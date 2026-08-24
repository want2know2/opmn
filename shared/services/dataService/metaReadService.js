
////
// IMPORT                   // FROM

import { toArray }          from "../../utils/valueUtils";
import { resolveLinkPath } from "../pagesAndLinks/linkService";


////
// Test: FM ohne DV
// ----

/**
 * Besorgt Wert aus Feld.
 */

export function einzelnesFeldLesen(app, seiteNormObj, feld) {
    
    //console.log("exists: " + seiteNormObj.exists + ", tFile" + seiteNormObj.tFile)

    if (!seiteNormObj.exists) 
        return null;
    
    const tFile = seiteNormObj.tFile;
    const cache = app.metadataCache.getFileCache(tFile);
    const fm = cache?.frontmatter;
    
    const test514 = feld.split(".").reduce((o, k) => o?.[k], fm);
    //console.log("test514: "  + test514)
    return test514;
}


/**
 * Übung diesdas
 * Seite hat Feld?
 * Noch nirgendwo verwendet
 * Vielleicht Quatsch.. 
 */

export function checkObSeiteHatFeld(app, seiteNormObj, feld) {
    if (!seiteNormObj.exists) 
        return null;
    
    console.log("CHECK OB SEITE " + seiteNormObj.name + "HAT FELD " + feld);

    const bisVorletztesfeldArr = feld.split(".");
    const letztesFeld = bisVorletztesfeldArr.pop();

    console.log("letztesFeld: " + letztesFeld)
    /*
    if (bisVorletztesfeldArr.length > 0)
        bisVorletztesfeldArr.forEach(arrVal => console.log("arrVal: " + arrVal))
    */

    const tFile = seiteNormObj.tFile;
    const cache = app.metadataCache.getFileCache(tFile);
    const fm = cache?.frontmatter;
    
    
    const fmCheckObj = bisVorletztesfeldArr.length > 0
        ? bisVorletztesfeldArr.reduce((o, k) => o?.[k], fm)
        : fm;
    
    if (!!fmCheckObj) {
        const checkKeys = Object.keys(fmCheckObj);
        if (checkKeys.length > 0)
            checkKeys.forEach(key => console.log("checkKey: " + key))
    }

    const feldVorhanden = fmCheckObj?.[letztesFeld];
    
    console.log("Feld vorhanden: " + !!feldVorhanden);
    
    return !!feldVorhanden;
}

/**
 * Link in Feld vorhanden?
 */


export function checkFieldArrForLink(app, normPage, fieldPath, linkPage) {

    const current = toArray(
        einzelnesFeldLesen(app, normPage, fieldPath)
    );

    const targetPath = linkPage?.path;

    return current.some(link => resolveLinkPath(app, link) === targetPath);
}




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 


////
// DV-Funktionen
// -------------
// Versuchen, zu ersetzen, wo/wenn möglich
// ----


/**
 * Einzelnen Feldwert abfragen. Wird verwendet in dvLinkSucheAusfuehren.
 * (Weiß nicht, ob das einen Unterschied machen würde, stattdessen
 * einzelnerFeldWertVerschachtelt zu verwenden, bzw. noch besser: 
 * überall wo es möglich ist, `einzelnerFeldWert` verwenden anstatt den 
 * DV-Funktionen.
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

