
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

        name: null,
        path: null,
        displayName: null,
        wikiLink: null,
        displayLink: null
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

