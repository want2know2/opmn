
////
// IMPORT                       // FROM

import { einzelnesFeldLesen } from "../metadata/metaReadService";
import { resolveLinkPath } from "./linkService";
import { getPageNormObject }    from "./pageNormService";


/**
 * Norm object for the note currently open in Obsidian, or null if none is open.
 */

export function getActivePageNormObject(app, dv) {
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) return null;

    return getPageNormObject(app, dv, activeFile.path);
}


/**
 *
 */

export function fieldValuesAsNormPages(app, dv, page, feldStr) {

    const feld = einzelnesFeldLesen(app, page, feldStr);
    const feldArr = Array.isArray(feld) ? feld : [feld];
    const feldPgsArr = feldArr
        .map(iststr => resolveLinkPath(app, iststr))
        .map(istpath => getPageNormObject(app, dv, istpath));
    return feldPgsArr;
}

