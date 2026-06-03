
////
// IMPORT

import { toArray } from "../utils/valueUtils.js";




/**
 * Einzelnen Feldwert abfragen. Wird verwendet in dvLinkSucheAusfuehren. 
 * Weiß nicht, ob das einen Unterschied machen würde, stattdessen
 * einzelnerFeldWertVerschachtelt zu verwenden (um die hier löschen zu können).
 */

export function einzelnerFeldWert(dvPage, feld) {
  return feld.split(".").reduce((o, k) => o?.[k], dvPage);
}


/**
 * Liste von Feldern abfragen => Liste von Werten zurück.
 */

export function alleFeldWerte(dv, dvPage, feldListe) {
	  if ( !Array.isArray(feldListe) ) return [];
	  return feldListe
	    .flatMap(f => toArray( einzelnerFeldWertVerschachtelt(dv, dvPage, f) ));
}


/**
 * 
 */

export function einzelnerFeldWertVerschachtelt(dv, seite, feld) {
  if (!seite) return [];
  const keys = feld.split(".");
  let current = [seite]; // always work with arrays
  
  for (const key of keys) {
    current = current.flatMap(item => {
      if (!item) return [];
      // resolve link to page
      if (item?.path && item?.type === "file") {
        const p = dv.page(item.path);
        if (!p) return [];
        item = p;
      }

      const val = item[key];
      if (!val) return [];
      if (val?.path && val?.type === "file") {
        const p = dv.page(val.path); // if val is a link, resolve to page
        return p ? [p] : [];
      }
      return Array.isArray(val) ? val : [val];
    });
  }
  return toArray(current);
}


/** 
 * Wahrscheinlich überflüssing, weil ich überall dv page-Objekt 
 * verwenden will...
 * Schreibt beliebige Werte in ein Metadatenfeld einer Seite (path)
 * (auch verschachtelte Felder wie med.titel)
 */

export async function updateFieldByPath(fPath, fieldPath, value) {
    const file = app.vault.getFileByPath(fPath);
    if (!file) return;

    await updateField(file, fieldPath, value);
}


/**
 * Schreibt beliebige Werte in ein Metadatenfeld einer Seite (dvPage-Objekt)
 * (auch verschachtelte Felder wie med.titel)
 */

export async function updateFieldByDVPage(dvPage, fieldPath, value) {
    const fPath = dvPage?.file?.path;
    const file = app.vault.getFileByPath(fPath);
    if (!file) return;

    await updateField(file, fieldPath, value);
}


/**
 * Schreibt beliebige Werte in ein Metadatenfeld einer Seite (TFile)
 * (auch verschachtelte Felder wie med.titel)
 */

export async function updateField(tFile, fieldPath, value) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) { obj[key] = {}; }
            return obj[key];
        }, frontmatter);

        target[lastKey] = value;
    });
}


/**
 * Normalizes a path into a comparison key (without .md, lower-cased).
 */

function normalizePathKey(path) {
    return String(path).replace(/\.md$/, "").toLowerCase();
}


/**
 * From a link value (wiki-link string "[[target|alias]]", markdown link
 * "[alias](path)", a raw path string, or a Dataview link object) extracts the
 * target linkpath and resolves it relative to `sourcePath` into a comparison
 * key. This way different spellings of the same target (short name vs. full
 * path) reliably match.
 */

function linkTargetKey(value, sourcePath) {
    if (value == null) return null;

    let linkpath = null;

    if (typeof value === "object") {
        // Dataview link object or similar.
        linkpath = value.path ?? null;
    }
    else if (typeof value === "string") {
        const wiki = value.match(/\[\[([^\]|#]+)/);
        const md = value.match(/\]\(([^)]+)\)/);
        if (wiki) linkpath = wiki[1].trim();
        else if (md) linkpath = decodeURIComponent(md[1].trim());
        else linkpath = value.replace(/^["']|["']$/g, "").trim();
    }

    if (!linkpath) return null;

    const dest = app.metadataCache.getFirstLinkpathDest(
        linkpath.replace(/\.md$/, ""),
        sourcePath ?? ""
    );
    return normalizePathKey(dest?.path ?? linkpath);
}


/**
 * Turns an add/remove item (norm object or string) into the link text to be
 * written, relative to `sourcePath`.
 *
 * For now every written link gets an alias = the page's displayName (i.e.
 * "[[target|displayName]]"). This is a temporary testing default; the alias
 * source is expected to become configurable later.
 */

function itemToLinkText(item, sourcePath) {
    if (item == null) return null;
    if (typeof item === "string") return item;
    if (typeof item.linkFrom === "function")
        return item.linkFrom(sourcePath, item.displayName);
    if (item.wikiLink) return item.wikiLink;
    return null;
}


/**
 * Turns an add/remove item into its comparison key.
 */

function itemToKey(item, sourcePath) {
    if (item == null) return null;
    if (typeof item === "string") return linkTargetKey(item, sourcePath);
    if (item.path) return normalizePathKey(item.path);
    return linkTargetKey(itemToLinkText(item, sourcePath), sourcePath);
}


/**
 * Atomic, array-aware update of a list field (e.g. `ist`) of links. Reads the
 * target file's current frontmatter value, removes the targets named in
 * `remove`, adds those named in `add` (without duplicates) and writes the
 * result back in a single processFrontMatter pass.
 *
 * `targetNorm`   norm object of the (active) page being edited.
 * `add`/`remove` arrays of norm objects and/or link strings.
 *
 * Comparison is done via resolved target paths, not the raw spelling, so that
 * short names and full-path links are recognized as the same target.
 */

export async function updateListFieldLinks(targetNorm, fieldPath, { add = [], remove = [] } = {}) {
    const tFile = targetNorm?.tFile;
    if (!tFile) return;

    const sourcePath = targetNorm.path;

    const removeKeys = new Set(
        remove.map(i => itemToKey(i, sourcePath)).filter(Boolean)
    );

    const addItems = add
        .map(i => ({
            key: itemToKey(i, sourcePath),
            text: itemToLinkText(i, sourcePath)
        }))
        .filter(i => i.key && i.text);

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {
        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) { obj[key] = {}; }
            return obj[key];
        }, frontmatter);

        let list = toArray(target[lastKey]);

        list = list.filter(v => !removeKeys.has(linkTargetKey(v, sourcePath)));

        for (const item of addItems) {
            const present = list.some(
                v => linkTargetKey(v, sourcePath) === item.key
            );
            if (!present) list.push(item.text);
        }

        target[lastKey] = list;
    });
}


/**
 * Adds a single link to a list field (if not already present).
 */

export async function addLinkToListField(targetNorm, fieldPath, item) {
    await updateListFieldLinks(targetNorm, fieldPath, { add: [item] });
}


/**
 * Removes a single link from a list field.
 */

export async function removeLinkFromListField(targetNorm, fieldPath, item) {
    await updateListFieldLinks(targetNorm, fieldPath, { remove: [item] });
}


/**
 * Checks whether a list field of the (active) page already contains a given
 * target link. Reads from the norm object's Dataview page object.
 */

export function listFieldHasLink(targetNorm, fieldPath, item) {
    const dvPage = targetNorm?.dvPage;
    if (!dvPage) return false;

    const sourcePath = targetNorm.path;
    const current = einzelnerFeldWert(dvPage, fieldPath);
    const key = itemToKey(item, sourcePath);
    if (!key) return false;

    return toArray(current).some(
        v => linkTargetKey(v, sourcePath) === key
    );
}


/**
 * Löscht vorhandene Frontmatter-Metadaten vollständig und ersetzt sie
 * durch gegebene neue (Metadaten-Objekt).
 */

export async function updateEntireFrontmatter(file, newFrontObj = {}) {
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        for (const key of Object.keys(frontmatter)) {
            if (key !== "id") delete frontmatter[key];
        }
        Object.assign(frontmatter, newFrontObj);
    })
}



export async function deleteFieldByDVPage(dvPage, fieldPath) {
    const pagePath = dvPage?.file?.path;
    const tFile = app.vault.getFileByPath(pagePath);
    if (!tFile) return;

    await deleteField(tFile, fieldPath);
}


/**
 * Löscht beliebiges Feld einer Seite.
 * WARNING
 * hidden bug in your deleteField()
 * This is dangerous:
 * if (!obj[key]) { obj[key] = {}; }
 * because deletion should never create missing structures.
 * 
 * Besser:
 
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) return null;
            return obj[key];
        }, frontmatter);

        if (!target) return;

        delete target[lastKey];

 *
 */

async function deleteField(tFile, fieldPath) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {
        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) { obj[key] = {}; }
            return obj[key];
        }, frontmatter);

        delete target[lastKey];
    })
}

