


import { einzelnesFeldLesen } from "../services/dataService/metaReadService";

/**
 * Erzeugt ID im neuen Format
 * noch mal neu: lesbare ID
 */

export function generateUniqueIdNeu() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");

    const random = Math.random().toString(36).slice(2, 8);

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}Z _ ${random}`;
}



/**
 * 
 */

export function generateErgaenzteSonstNeueID(app, normPage) {

    if (!normPage.exists)
        return null;

    const idFeldRaw = einzelnesFeldLesen(app, normPage, "id");

    const newFormatCheck = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(idFeldRaw);

    if (newFormatCheck)
        return null;

    const newFormatFalschCheck = /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(idFeldRaw); 
    const oldFormatCheck = /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(idFeldRaw);

    if (idFeldRaw && oldFormatCheck) {

        const now = new Date();

        const ms = String(now.getMilliseconds()).padStart(3, "0");

        const random = Math.random().toString(36).slice(2, 8);

        return `${idFeldRaw}.${ms}Z _ ${random}`;
    }

    if (idFeldRaw && newFormatFalschCheck) {

        const splitIDWert = idFeldRaw.split(" _ ");
        
        return `${splitIDWert[0]}T${splitIDWert[1]} _ ${splitIDWert[2]}`;
    }

    else {

        return generateUniqueIdNeu();
    }
}






/**
 * 
 */

export function idAltzuNeu(idStr) {
    if (!feldIDAltCheck(idStr)) return;
    const idAltArr = idStr.split(" _ ");
    const random = Math.random().toString(36).slice(2, 8);
    return `${idAltArr[0]}T${idAltArr[1]}.000Z _ ${random}`;
}


/**
 *
 */

export function feldIDAltCheck(str) {
    return /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(str);
}

