
////
// IMPORT                       // FROM

import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";


/**
 * Definitionen finden
 */

export function dvDefsLinkSuche(dv, rootPageStr) {
    return dvLinkSuche(dv, [rootPageStr, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
}


/**
 * Instanzen finden
 */

export function dvInstsLinkSuche(dv, rootPageStr) {
    const defs = dvDefsLinkSuche(dv, rootPageStr);
    return dvLinkSuche(dv, defs, ["ist"], 0, false) ?? [];
}
