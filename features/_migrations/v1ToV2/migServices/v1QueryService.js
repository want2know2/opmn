
////
// IMPORT                       // FROM

import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";
import { ONT_ROOTKL } from "../migReg/migReg.js";


/**
 * Definitionen finden
 */

export function dvDefsLinkSuche(dv, rootPath) {
    return dvLinkSuche(dv, [rootPath, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
}


/**
 * Instanzen finden
 */

export function dvInstsLinkSuche(dv, rootPath) {
    const defs = dvDefsLinkSuche(dv, rootPath);
    const defsOSeite = ONT_ROOTKL[rootPath]?.instByRoot
        ? [rootPath] : defs;
    return dvLinkSuche(dv, defsOSeite, ["ist"], 0, false) ?? [];
}
