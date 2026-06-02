
////
// IMPORT

import { feldIstEditor } from "./feldIstEditor.js";
import { pStatusEditor } from "./pStatusEditor.js";


/**
 * 
 */

export function metadataEditor(dv) {

    const metaEditState = {
        featureBoxActive: true,
        pStatus: {
            active: null,
            auswahl: []
        },
        ist: {
            auswahl: []
        }
    }

    const miniContainer = dv.el("div", "> _Seite bearbeiten (+)_");
    miniContainer.style.display = "none";
    miniContainer.style.cursor = "pointer";
    const container = dv.el("div", "");
    
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

