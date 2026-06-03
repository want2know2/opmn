
////
// IMPORT

import { toArray } from "../utils/valueUtils.js";
import { einzelnerFeldWert } from "./metadataService.js";


// Single, canonical way to reach the Dataview plugin's JavaScript API from
// *outside* a `dataviewjs` code block.
//
// Inside a `dataviewjs` block you were handed a `dv` object (a
// DataviewInlineApi). From a plugin we instead grab the global Dataview API
// (a DataviewApi). It exposes the query helpers we rely on -- `dv.pages(...)`,
// `dv.page(path)`, `dv.pagePaths(...)`, `dv.index` -- but NOT the rendering
// helpers (`dv.el`, `dv.table`, ...). We don't need those anymore: in a plugin
// we build DOM with the element's own `createEl(...)` instead.
//
// Returns `null` when Dataview is not installed / not yet loaded, so callers
// can show a friendly message instead of crashing.
export function getDataviewApi(app) {
  return app?.plugins?.plugins?.dataview?.api ?? null;
}


//// 
// LINK-RÜCKWÄRTSSUCHE

/** 
 * Link-Rückwärtssuche
 */

export function dvLinkSuche(
        dv, 
        listeSuchSeiten, 
        listeSuchFelder, 
        suchtiefe, 
        undOderOption      // false = oder, true = und
    ) {
    if (!listeSuchSeiten?.length || !listeSuchFelder?.length) return [];
    const linkSucheErgebnis = listeSuchSeiten
        .map(str => dv.page(str))
        .filter(Boolean)
        .map(sobj => dvLinkSucheAusfuehren(
            dv,
            sobj,
            listeSuchFelder,
            suchtiefe
        ));
    
    return undOderAuswerten(linkSucheErgebnis, undOderOption);
}


/** 
 * wird von dvLinkSuche aufgerufen
 */

function dvLinkSucheAusfuehren(
        dv,
        page,
        sfields,
        suchtiefe,
        depth = 0,
        seen = new Set()
    ) {

    if (!page || depth > suchtiefe || seen.has(page.file.path)) return [];
    seen.add(page.file.path);     

    const backlinks = page.file.inlinks
        .map(l => dv.page(l.path))        // page object from link
        .filter(p => p && p.file)         // ensure fully hydrated
        .sort((a, b) =>                   // canonical order
            a.file?.path?.localeCompare(b.file?.path) 
        ); 
    
    let suchergebnisse = [];
    
    for (const bp of backlinks) {
    
        const treffer = sfields.some(field => {
            const value = einzelnerFeldWert(bp, field);
            if (!value) return false;
            return toArray(value).some(v => v?.path === page.file.path);
        });
    
        if (treffer) {
            suchergebnisse.push(bp.file.path);
            suchergebnisse.push(...dvLinkSucheAusfuehren(
                dv,
                bp,
                sfields,
                suchtiefe,
                depth + 1,
                seen)
            );
        }
    }

    return suchergebnisse;
}


/** 
 * Verbindet Listen von Seitenpfaden gemäß true/false = und/oder
 */

function undOderAuswerten(pfadListen, uoOption) {
    if (!pfadListen.length) return [];
    let result;

    if (!uoOption) {
        result = [...new Set([].concat(...pfadListen))]; // OR: union
    } else {
        const sets = pfadListen.map(l => new Set(l));
        result = [...sets.reduce((a, s) => 
            new Set([...a].filter(x => s.has(x))))]; // AND: intersection
    }

    return result.sort((a, b) => a.localeCompare(b)); // canonical order
}

