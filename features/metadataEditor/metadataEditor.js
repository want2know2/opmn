
////
// IMPORT                               // FROM
import { getActivePageNormObject } from "../../shared/services/pagesAndLinks/pageFetchService.js";
import { feldIstEditor }                from "./feldIstEditor.js";
import { pStatusEditor }                from "./pStatusEditor.js";


/**
 * 
 */

// `mountEl` is the DOM element the feature renders into. Previously the two
// root containers were created via `dv.el(...)` (which both creates the element
// AND appends it to the surrounding dataviewjs output). Outside a dataviewjs
// block there is no such output context, so the caller passes in an element
// (e.g. a modal's contentEl) and we build into it with `createEl(...)`.

export function metadataEditor(dv, mountEl) {

    const metaEditState = {
        featureBoxActive: true,
        pStatus: {
            active: null,
            auswahl: []
        },
        ist: {
            auswahl: [],
            keineAuswahl: false
        },
        // The "active page": the note currently open in Obsidian.
        // The editors write the `ist` field into this norm object.
        activePage: null
    }
    
    metaEditState.activePage = getActivePageNormObject(dv);

    const miniContainer = mountEl.createEl("div", { 
        text: "Seite bearbeiten (+)", 
        cls: "opmn-mini-container" 
    });
    miniContainer.style.display = "none";
    
    const container = mountEl.createEl("div");
    
    const renderActiveContainer = () => {
        if (metaEditState.featureBoxActive) {
            miniContainer.style.display = "none";
            container.style.display = "";
        } else {
            container.style.display = "none";
            miniContainer.style.display = "";
        }
    }

    const headerBox = container.createEl("div");
    const header = headerBox.createEl("h4", {text: "Seiteneditor (-)", cls: "opmn-header"});
    
    const columnsBox = container.createEl("div", { cls: "opmn-columns" });

    [miniContainer, header].forEach(el => {
        el.addEventListener("click", () => {
            metaEditState.featureBoxActive = !metaEditState.featureBoxActive;
            renderActiveContainer();
        })
    })

    const activePageInfo = headerBox.createEl("div", {cls: "opmn-target-info"}); 
    
    if (metaEditState.activePage?.ref?.exists) {
        activePageInfo.setText(`Aktive Seite: ${metaEditState.activePage.path}`);
    } else {
        activePageInfo.setText("Keine aktive Seite. Öffne eine Notiz, um Änderungen zu speichern.");
        activePageInfo.addClass("opmn-target-info-error");
    }
    
    const leftColumn = columnsBox.createEl("div", { cls: "opmn-column-left" });
    const centerColumn = columnsBox.createEl("div", { cls: "opmn-column-center" });
    /*const rightColumn = columnsBox.createEl("div", { cls: "opmn-column-right" });*/

    let renderFeldIst = () => {};           // Platzhalter, um eine CallbackFn
                                            // an `pStatusEditor` zu übergeben,
    pStatusEditor(                          // obwohl `feldIstEditor`, wo die 
        dv,                                 // CallbackFn eigentlich definiert wird, 
        leftColumn,                         // noch nicht  erzeugt wurde (da in der 
        metaEditState,                      // UI `pStatusEditor` vor `feldIstEditor` 
        () => renderFeldIst()               // kommen soll.
    );                                      
                                            // `feldIstEditor` wird hier einerseits gecalled                        
    renderFeldIst = feldIstEditor(          // UND gibt seine render-Funktion zurück,
        dv,                                 // also `renderFuzzy` -> das ist dann
        centerColumn,                       // die CallbackFn, die an `pStatusEditor`
        metaEditState                       // übergeben und dort beim Anklicken 
    )                                       // der Checkbox ausgeführt wird.
}

