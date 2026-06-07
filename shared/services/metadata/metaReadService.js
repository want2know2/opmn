
////
// IMPORT                   // FROM

import { toArray }          from "../../utils/valueUtils";


////
// Test: FM ohne DV
// ----

/**
 * 
 */

export function einzelnerFeldWert(app, tFile, feld) {
    const cache = app.metadataCache.getFileCache(tFile);
    const fm = cache?.frontmatter;
    return feld.split(".").reduce((o, k) => o?.[k], fm);
}


//// 
// DV-Funktionen
// ----

/**
 * Einzelnen Feldwert abfragen. Wird verwendet in dvLinkSucheAusfuehren.
 * Weiß nicht, ob das einen Unterschied machen würde, stattdessen
 * einzelnerFeldWertVerschachtelt zu verwenden (um die hier löschen zu können).
 */

export function einzelnerFeldWertDV(dvPage, feld) {
    return feld.split(".").reduce((o, k) => o?.[k], dvPage);
}


/**
 * Liste von Feldern abfragen => Liste von Werten zurück.
 */

export function alleFeldWerte(dv, dvPage, feldListe) {
    if (!Array.isArray(feldListe)) return [];
    return feldListe
        .flatMap(f => toArray(einzelnerFeldWertVerschachtelt(dv, dvPage, f)));
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

