
////
// IMPORT                       // FROM

import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";
import { ONT_ROOTKL }           from "../migReg/migReg.js";




/**
 * 
 */

export function queryMigInstsODefs(dv, migRootKl, ziel) {
    
    // (2.8.26) Habe bei "inst" und "ontDef" "Datenbankinterne Entität.md" 
    // rausgenommen, weil es gut sein kann, dass ich in einigen Einträgen 
    // vergessen habe, sie mit "Datenbankinterne Entität.md" zu markieren, 
    // und die dann in den Ergebnissen fehlen. Aber auch so müsste eigentlich 
    // alles richtig gefunden werden - oder?
    // =>
    // nicht ganz: bei "Person" gibt es viele, die nur "Person" in `ist haben
    // und daher fälschlicherweise als "ontDef" angezeigt werden, anstatt als
    // "inst", wenn ohne "Datenbankinterne Entität.md" gesucht wird.

    // migInst => inst
    if (ziel === "inst") {  // , "Datenbankinterne Entität.md"
        const migDefSuche = dvLinkSuche(dv, [migRootKl, "Datenbankinterne Entität.md"], ["ist", "istdin"], 0, true) ?? [];
        return dvLinkSuche(dv, migDefSuche, ["ist"], 0, false) ?? [];        
    }

    // migDef => ontDef
    else if (ziel === "ontDef") {  // , "Datenbankinterne Entität.md"
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

