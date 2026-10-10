

/**
 * Wandelt Wert in String um.
 */

export function toStringValue(val) {
    if (val == null) return "";

    if ( 
        (typeof val  === "string" && val.includes("[[")) 
        || (typeof val === "object" && val.path)
    ) return val.path;
    if (typeof val === "string") return val;
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
}


/**
 * Wandelt Wert in abgeflachten Array um (optional: alle enthaltenen 
 * Werte als Strings)
 */

export function toArray(x, asString = false) {
    if (!x) return [];
    let arr = Array.isArray(x) 
        ? (Array.isArray(x[0]) 
            ? x.flat(Infinity) 
            : x) 
        : [x];
    if (asString) {
        return arr.map(v => toStringValue(v)).filter(Boolean);
    }
    return arr;
}

/**
 * Prüft, ob zwei Objekte gleich sind
 */

export function compareObjects(obj1, obj2) {
    // 1. Same reference or primitive values
    if (obj1 === obj2) return true;

    // 2. Handle null or mismatched types
    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    }

    // 3. Handle Dates
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    // 4. Handle Arrays and Objects keys length
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    // 5. Recursively check all keys and values
    for (const key of keys1) {
        if (!keys2.includes(key) || !compareObjects(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

