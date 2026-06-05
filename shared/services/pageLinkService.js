
/**
 * 
 */

export function toWikiLink(pageRef) {
    if (!pageRef?.path) return null;

    return `[[${pageRef.path.replace(/\.md$/, "")}]]`;
}

/**
 * 
 */

export function toWikiLinkWithAlias(pageRef, alias) {
    if (!pageRef?.path)
        return null;
 
    if (!alias || typeof alias !== "string") 
        return toWikiLink(pageRef);
    
    return `[[${pageRef.path.replace(/\.md$/, "")}|${alias}]]`;
}


/**
 * 
 */

export function createPageLink(conEl, page, view, viewType) {
    const link = conEl.createEl("a", {
        text: page.displayName,
        cls: "internal-link"
    });

    link.dataset.href = page.path;

    link.addEventListener("mouseover", (event) => {
        app.workspace.trigger("hover-link", {
            event,
            source: viewType,
            hoverParent: view,
            targetEl: link,
            linktext: page.path
        });
    });
    link.addEventListener("click", () => {
        app.workspace.openLinkText(page.path, "", true);
    });        
    return link;
}

