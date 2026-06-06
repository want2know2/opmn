
////
// IMPORT                           // FROM

import { toArray }                  from "../../utils/valueUtils.js";
import { einzelnerFeldWert }        from "../metadata/metaReadService.js";


export function resolveLinkPath(app, link) {

    if (!link)
        return null;

    let linkPath = null;

    // Dataview Link object
    if (typeof link === "object") {
        linkPath = link.path ?? null;
    }

    // String
    else if (typeof link === "string") {

        // [[Page]]
        // [[Page|Alias]]
        const match = link.match(/\[\[([^|\]]+)/);

        linkPath = match
            ? match[1].trim()
            : link.trim();
    }

    if (!linkPath)
        return null;

    // Canonical vault path already?
    if (linkPath.includes("/")) {

        const file = app.vault.getFileByPath(
            linkPath.endsWith(".md")
                ? linkPath
                : `${linkPath}.md`
        );

        if (file)
            return file.path;
    }

    // Legacy short links ("Page", "[[Page]]", etc.)
    const file = app.metadataCache.getFirstLinkpathDest(
        linkPath.replace(/\.md$/, ""),
        ""
    );

    return file?.path ?? null;
}


/**
 * Checks whether a list field of the (active) page already contains a given
 * target link. Reads from the norm object's Dataview page object.
 */

export function listFieldHasLink(app, normPage, fieldPath, linkPage) {

    const current = toArray(
        einzelnerFeldWert(normPage.dvPage, fieldPath)
    );

    const targetPath = linkPage?.path;

    return current.some(link =>
        resolveLinkPath(app, link) === targetPath
    );
}

