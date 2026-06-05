
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
 * Erstellt einen Link mit  Hover-Funktionalität.
 * @param {object} parentObj z.B. view aus OpmnNewView extends ItemView.
 */

export function createPageLink(parentObj, container, page) {

    const { app } = parentObj;

    const link = container.createEl("a", {
        text: page.displayName,
        cls: "internal-link"
    });

    link.dataset.href = page.path;

    link.addEventListener("mouseover", (event) => {
        app.workspace.trigger("hover-link", {
            event,
            source: "",
            hoverParent: parentObj,
            targetEl: link,
            linktext: page.path
        });
    });
    link.addEventListener("click", () => {
        app.workspace.openLinkText(page.path, "", true);
    });        
    return link;
}

