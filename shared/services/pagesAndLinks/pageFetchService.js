
////
// IMPORT                       // FROM

import { getPageNormObject }    from "./pageNormService";


/**
 * Norm object for the note currently open in Obsidian, or null if none is open.
 */

export function getActivePageNormObject(app, dv) {
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) return null;

    return getPageNormObject(app, dv, activeFile.path);
}

