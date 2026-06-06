
////
// IMPORT

import { dvLinkSuche } from "./queryService.js";


////
// ENTITÄTEN

export const ENTITY_TYPES = [
    {
        key: "kat",
        label: "Kategorie",
        query: dvQueryKat
    },
    {
        key: "the",
        label: "Thema",
        query: dvQueryThe
    },
    {
        key: "ere",
        label: "Ereignis",
        query: dvQueryEre
    },
    {
        key: "inh",
        label: "Inhalt",
        query: dvQueryInh
    },
    {
        key: "gen",
        label: "Genre",
        query: dvQueryGen
    },
    {
        key: "per",
        label: "Person",
        query: dvQueryPer
    },
    {
        key: "org",
        label: "Organisation",
        query: dvQueryOrg
    },
    {
        key: "geg",
        label: "Gegenstand",
        query: dvQueryGeg
    },
    {
        key: "geo",
        label: "Geo",
        query: dvQueryGeo
    }
];


////
// QUERIES

/**
 * Haupt-Entitäten: Seiten, die via ist*0 zu "Auswahl Ent" linken.
 */

export function dvQueryMainEnts(dv) {
    return dvLinkSuche(dv, ["Auswahl Ent"], ["istdin"], 0, true);
}


/**
 * Kategorie: Seiten, die via ist*2 zu 'Kategorie' linken.
 */

export function dvQueryKat(dv) {
    return dvLinkSuche(dv, ["Kategorie", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
    // const katSuche = dvLinkSuche(dv, ["Kategorie", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
    // return [...katSuche, "Kategorie.md"];
}

export function dvQueryKatAlle(dv) {
    return dvLinkSuche(dv, ["Kategorie"], ["ist", "istdin"], 0, true);
    // const katSuche = dvLinkSuche(dv, ["Kategorie", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
    // return [...katSuche, "Kategorie.md"];
}


/**
 * Thema: Seiten, die via ist*2 zu 'Thema' linken.
 */

export function dvQueryThe(dv) {
    return dvLinkSuche(dv, ["Thema", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
    // return [...theSuche, "Thema.md"];
}


/**
 * Ereignis: Seiten, die via ist*2 zu 'Ereignis' linken.
 */

export function dvQueryEre(dv) {
    return dvLinkSuche(dv, ["Ereignis", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Inhalt: Seiten, die via ist*2 zu 'Inhalt' linken.
 */

export function dvQueryInh(dv) {
    return dvLinkSuche(dv, ["Inhalt", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Genre: Seiten, die via ist*2 zu 'Genre' linken.
 */

export function dvQueryGen(dv) {
    return dvLinkSuche(dv, ["Genre", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Person: Seiten, die via ist*2 zu 'Person' linken.
 */

export function dvQueryPer(dv) {
    return dvLinkSuche(dv, ["Person", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Organisation: Seiten, die via ist*2 zu 'Organisation' linken.
 */

export function dvQueryOrg(dv) {
    return dvLinkSuche(dv, ["Organisation", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Gegenstand: Seiten, die via ist*2 zu 'Gegenstand' linken.
 */

export function dvQueryGeg(dv) {
    return dvLinkSuche(dv, ["Gegenstand", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}


/**
 * Geo: Seiten, die via ist*2 zu 'Geo' linken.
 */

export function dvQueryGeo(dv) {
    return dvLinkSuche(dv, ["Geo", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}

