
////
// IMPORT

import { getPageNormObject } from "../../shared/services/pageNormService.js";
import { feldIstEditor } from "./feldIstEditor.js";
import { pStatusEditor } from "./pStatusEditor.js";


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
            auswahl: []
        },
        // Die "aktive Seite": die in Obsidian aktuell geöffnete Notiz.
        // In dieses Norm-Objekt schreiben die Editoren das Feld `ist`.
        target: null
    }

    const activeFile = app.workspace.getActiveFile();
    metaEditState.target = activeFile
        ? getPageNormObject(dv, activeFile.path)
        : null;

    const miniContainer = mountEl.createEl("div", { text: "Seite bearbeiten (+)" });
    miniContainer.style.display = "none";
    miniContainer.style.cursor = "pointer";
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

    // const box = container.createEl("div");

    const table = container.createEl("table");
    const rowA = table.createEl("tr");
    const cellA1 = rowA.createEl("td");
    cellA1.colSpan = 3;
    const header = cellA1.createEl("h4", {text: "Seiteneditor (-)"});
    header.style.cursor = "pointer";
    [miniContainer, header].forEach(el => {
        el.addEventListener("click", () => {
            metaEditState.featureBoxActive = !metaEditState.featureBoxActive;
            renderActiveContainer();
        })
    })

    // Aktive Seite anzeigen (Ziel der Schreiboperationen). Ohne aktive
    // Notiz kann nicht geschrieben werden -> deutlicher Hinweis.
    const targetInfo = cellA1.createEl("div");
    targetInfo.style.fontSize = "0.85em";
    targetInfo.style.marginBottom = "6px";
    if (metaEditState.target?.ref?.exists) {
        targetInfo.setText(`Aktive Seite: ${metaEditState.target.path}`);
        targetInfo.style.opacity = "0.8";
    } else {
        targetInfo.setText("Keine aktive Seite \u2013 \u00f6ffne eine Notiz, um \u00c4nderungen zu speichern.");
        targetInfo.style.color = "var(--text-error)";
    }
    const rowB = table.createEl("tr");
    const cellB1 = rowB.createEl("td");
    const cellB2 = rowB.createEl("td");
    const cellB3 = rowB.createEl("td");
    cellB1.style = "width:200px";
    cellB2.style = "width:350px";
    cellB3.style = "width:80px";

    let renderFeldIst = () => {};           // Platzhalter, um eine CallbackFn
                                            // an `pStatusEditor` zu übergeben,
    pStatusEditor(                          // obwohl `feldIstEditor`, wo die 
        dv,                                 // CallbackFn eigentlich definiert wird, 
        cellB1,                             // noch nicht  erzeugt wurde (da in der 
        metaEditState,                      // UI `pStatusEditor` vor `feldIstEditor` 
        () => renderFeldIst()               // kommen soll.
    );                                      
                                            
    renderFeldIst = feldIstEditor(          // gibt seine render-Funktion zurück,
        dv,                                 // also `renderFuzzy` -> das ist dann
        cellB2,                             // die CallbackFn, die an `pStatusEditor`
        metaEditState                       // übergeben und dort beim Anklicken 
    )                                       // der Checkbox ausgeführt wird.
}

