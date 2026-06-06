
////
// IMPORT                           // FROM

import { toArray }                  from "../utils/valueUtils.js";
import { resolvePageReference }     from "./pageReferenceService.js";




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


function resolveLinkPath(link) {

    if (!link)
        return null;

    let linkPath = null;

    // Dataview Link object
    if (typeof link === "object") {
        linkPath = link.path ?? null;
    }

    // String
    else if (typeof link === "string") {

        // [[Page]]
        // [[Page|Alias]]
        const match = link.match(/\[\[([^|\]]+)/);

        linkPath = match
            ? match[1].trim()
            : link.trim();
    }

    if (!linkPath)
        return null;

    // Canonical vault path already?
    if (linkPath.includes("/")) {

        const file = app.vault.getFileByPath(
            linkPath.endsWith(".md")
                ? linkPath
                : `${linkPath}.md`
        );

        if (file)
            return file.path;
    }

    // Legacy short links ("Page", "[[Page]]", etc.)
    const file = app.metadataCache.getFirstLinkpathDest(
        linkPath.replace(/\.md$/, ""),
        ""
    );

    return file?.path ?? null;
}



/**
 * Adds a single link to a list field (if not already present).
 */

export async function addLinkToListField(normPage, fieldPath, linkPage) {

    const tFile = normPage?.tFile;
    if (!tFile || !fieldPath || !linkPage?.wikiLink)
        return;

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, frontmatter);

        const list = toArray(target[lastKey]);

        if (!list.includes(linkPage.wikiLink))
            list.push(linkPage.wikiLink);

        target[lastKey] = list;
    });
}


/**
 * Removes a single link from a list field.
 */

export async function removeLinkFromListField(
    normPage,
    fieldPath,
    linkPage
) {

    const tFile = normPage?.tFile;
    if (!tFile)
        return;

    const targetPath = resolveLinkPath(linkPage.wikiLink);

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, frontmatter);

        let list = toArray(target[lastKey]);

        list = list.filter(link => resolveLinkPath(link) !== targetPath);

        target[lastKey] = list;
    });
}




/**
 * Checks whether a list field of the (active) page already contains a given
 * target link. Reads from the norm object's Dataview page object.
 */

export function listFieldHasLink(normPage, fieldPath, linkPage) {

    const current = toArray(
        einzelnerFeldWert(normPage.dvPage, fieldPath)
    );

    const targetPath = linkPage?.path;

    return current.some(link =>
        resolveLinkPath(link) === targetPath
    );
}


/**
 * Löscht vorhandene Frontmatter-Metadaten vollständig und ersetzt sie
 * durch gegebene neue (Metadaten-Objekt).
 */

export async function updateEntireFrontmatter(tFile, newFrontObj = {}) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {
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

