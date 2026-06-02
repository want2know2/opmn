

export function splitName(str) {
    if (typeof str !== "string") return "";
    const splitArr = str.split(" _ ");
    return splitArr[splitArr.length-1];
}

