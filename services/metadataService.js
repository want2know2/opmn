
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

