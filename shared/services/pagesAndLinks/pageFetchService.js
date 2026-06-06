
////
// IMPORT                       // FROM

import { getPageNormObject }    from "./pageNormService";


/**
 * Norm object for the note currently open in Obsidian, or null if none is open.
 */

export function getActivePageNormObject(dv) {
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) return null;

    return getPageNormObject(dv, activeFile.path);
}

