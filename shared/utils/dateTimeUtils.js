

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

