
////
// IMPORT

import { dvLinkSuche } from "./dvQueryService.js";


/**
 * 
 */

export function dvQueryPStatus(dv) {
    return dvLinkSuche(dv, ["p-Status", "Datenbankinterne Entität"], ["ist", "istdin"], 0, true);
}

