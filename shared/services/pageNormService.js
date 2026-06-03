
////
// IMPORT

import { getPageDisplayName } from "./pageDisplayNameService.js";
import { toWikiLink, toWikiLinkWithAlias } from "./pageLinkService.js";
import { resolvePageReference } from "./pageReferenceService.js";

/**
 * 
 */

export function getPageNormObject(dv, p) {

    const pageRef = resolvePageReference(dv, p);

    const normObject = {
        ref: null,
        get dvPage() {
            return this.ref?.dvPage ?? null;
        },
        get tFile() {
            return this.ref?.tFile ?? null;
        },

        name: null,
        path: null,
        displayName: null,
        wikiLink: null,
        displayLink: null,

        // Link text for referring to this page from `sourcePath`, using
        // Obsidian's own resolver (respects vault link settings, shortest
        // unambiguous form). Falls back to the static wikiLink if either the
        // TFile or a source path is unavailable.
        linkFrom(sourcePath) {
            const file = this.tFile;
            if (!file || !sourcePath) return this.wikiLink;
            return app.fileManager.generateMarkdownLink(file, sourcePath);
        }
    };

    if (!pageRef.exists) 
        return normObject;

    const name = pageRef.name;
    const path = pageRef.path;
    const displayName = getPageDisplayName(dv, pageRef).displayName;
    normObject.ref = pageRef;
    normObject.name = name;
    normObject.path = path;
    normObject.displayName = displayName;
    normObject.wikiLink = toWikiLink(pageRef);
    normObject.displayLink = toWikiLinkWithAlias(pageRef, displayName);
    
    return normObject;
}

