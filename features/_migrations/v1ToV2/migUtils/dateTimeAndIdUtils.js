

/**
 *
 */

export function feldIDAltCheck(str) {
    return /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(str);
}


/**
 *
 */

export function pageNameIDAltCheck(str) {
    return /^\d{4}-\d{2}-\d{2} _ \d{2}-\d{2}-\d{2}$/.test(str);
}


/**
 * erzeugt ID im bisherigen Format
 * wird wahrscheinlich gar nicht mehr gebraucht..
 */

export function generateIDAlt() {
    const now = new Date();

    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    const time = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0")
    ].join("-");

    return `${date} _ ${time}`;
}

