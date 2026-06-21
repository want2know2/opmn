
////
// IMPORT                       // FROM

import { getPageNormObject }    from "../services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche }          from "../services/queries/queryService.js";


/// KP, ob das iwo genutzt wird
// kann wahrscheinlich weg


////
// REGISTRY

const registry = {
    systemLabels: {
        definition: "Definition.md"
    },
    klassen: {}
}


/**
 * 
 */

export function buildRegistryDefault(app, dv) {
                // 
    return dvLinkSuche(
        dv, 
        ["Definition _ Klasse", "Ursprungsdefinition"],
        ["sysTyp", "sysRolle"],
        0, true
    );
}

