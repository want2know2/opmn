
/**
 * Wird gebraucht, um Links in diesem Format in die Metadaten zu 
 * schreiben.
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
 * Erstellt einen Link mit  Hover-Funktionalität. Wird gebraucht, um Links
 * auf Modals, Views usw. darzustellen. 
 * @param {object} parentObj z.B. view aus OpmnNewView extends ItemView.
 */

export function placeHoverLinkOnEl(parentObj, container, page, displayAs = null) {

    const { app } = parentObj;

    const display = displayAs ?? page.displayName ?? page.name ?? page.path;

    const link = container.createEl("a", {
        text: display,
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

