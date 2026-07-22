
////
// IMPORT                       // FROM

import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";
import { ONT_ROOTKL }           from "../migReg/migReg.js";




/**
 * 
 */

export function queryMigInstsODefs(dv, migRootKl, ziel) {
    
    // migInst => inst
    if (ziel === "inst") {
        const migDefSuche = dvLinkSuche(dv, [migRootKl, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
        return dvLinkSuche(dv, migDefSuche, ["ist"], 0, false) ?? [];        
    }

    // migDef => ontDef
    else if (ziel === "ontDef") {
        return dvLinkSuche(dv, [migRootKl, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
    }

    // migInst => semTax
    else if (ziel === "semTax") {
        return dvLinkSuche(dv, [migRootKl], ["ist"], 0, false) ?? [];
    }
    
    else return [];

}











////////////////


/**
 * Definitionen finden
 */

export function v1DvDefsLinkSuche(dv, rootPath) {
    
    return dvLinkSuche(dv, [rootPath, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
}


/**
 * Instanzen finden
 */

export function v1DvInstsLinkSuche(dv, rootPath) {
    const defs = v1DvDefsLinkSuche(dv, rootPath);
    const defsOSeite = ONT_ROOTKL[rootPath]?.instByRoot
        ? [rootPath] : defs;
    return dvLinkSuche(dv, defsOSeite, ["ist"], 0, false) ?? [];
}

