
////
// IMPORT                           // FROM


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
    // criticism: linkPath.includes("/") is not 
    // a guaranteed indicator of a canonical vault path.

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

