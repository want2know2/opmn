
/**
 * Erstellt einen Link mit  Hover-Funktionalität. Wird gebraucht, um Links
 * auf Modals, Views usw. darzustellen. 
 * @param {object} obsClsObj z.B. view aus OpmnNewView extends ItemView.
 */

export function placeHoverLinkOnEl(obsClsObj, container, page, displayAs = null) {

    const { app } = obsClsObj;

    // `display` erfüllt zwei Aufgaben: 
    // --------------------------------
    // Erstens: Über displayAs kann man optional selbst entscheiden, wie 
    // der Link angezeigt werden soll.
    // Zweitens: page.displayName benötigt DV, page.name / path verwenden
    // TFile, d.h. wenn beim Editieren von Seiten das Dataview-Indexing noch 
    // nicht so weit ist, wird automatisch auf name/path zurückgegriffen.
    const display = displayAs ?? /*page.displayName ??*/ page.name ?? page.path;

    const link = container.createEl("a", {
        text: display,
        cls: "internal-link"
    });

    link.dataset.href = page.path;

    link.addEventListener("mouseover", (event) => {
        app.workspace.trigger("hover-link", {
            event,
            source: "",
            hoverParent: obsClsObj,
            targetEl: link,
            linktext: page.path
        });
    });
    link.addEventListener("click", () => {
        app.workspace.openLinkText(page.path, "", true);
    });        
    return link;
}

