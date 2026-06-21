
////
// IMPORT                       // FROM

import { feldIDAltCheck } from "../migUtils/dateTimeAndIdUtils.js";


/**
 * 
 */

export function idAltzuNeu(idStr) {
    if (!feldIDAltCheck(idStr)) return;
    const idAltArr = idStr.split(" _ ");
    const random = Math.random().toString(36).slice(2, 8);
    return `${idAltArr[0]}T${idAltArr[1]}.000Z _ ${random}`;
}

