

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

