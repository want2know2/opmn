
////
// IMPORT

import { buildRegistryDefault } from "../../shared/registry/defaultDefinitionenReg.js";
import { einzelnesFeldLesen } from "../../shared/services/dataService/metaReadService.js";
import { getPageNormObject } from "../../shared/services/pagesAndLinks/pageNormService_ALT.js";
import { placeHoverLinkOnEl } from "../../shared/services/ui/uiLinkService.js";
import { tableMakerReihe, tableMakerReiheHd } from "../../shared/services/ui/uiService.js";


/**
 * 
 */

export function defaultDefsTest(obsClsObj) {
    
    // Objekte aus View erhalten
	const { app, dv, contentEl } = obsClsObj;

    // Container, Überschrift
    const container = contentEl.createEl("div");
    const header = container.createEl("h2");
    header.textContent = "Ursprungsdefinitionen";
    
    // Refresh-Button
    const refreshBtn = container.createEl("button", {text: "neu laden"});
    refreshBtn.addEventListener("click", () => {
        renderUrDefs();
    })
    
    // Info-Box
    const infobox = container.createEl("div");
    // Ergebnis-/Render-Container
    const urDefsCont = container.createEl("div", {cls: "opmn-move-container"});
    
    // x/y-Koordinaten
    let newX = 0, newY = 0, startX = 0, startY = 0;
    // Mouse Move Fn
    function mouseMoveFn(e) {
        newX = startX - e.clientX;
        newY = startY - e.clientY;
        startX = e.clientX;
        startY = e.clientY;
        urDefsCont.style.top = (urDefsCont.offsetTop - newY) + "px";
        urDefsCont.style.left = (urDefsCont.offsetLeft - newX) + "px";
    }
    // urDef-Mausfunktion
    urDefsCont.addEventListener("mousedown", (e) => {
        startX = e.clientX;  
        startY = e.clientY;
        contentEl.addEventListener("mousemove", mouseMoveFn)
        contentEl.addEventListener("mouseup", (e) => {
            contentEl.removeEventListener("mousemove", mouseMoveFn);
        })
    })
    
    // Tabelle Überschriften
    const tabHeader = [
        "nr",
        "Klasse",
        "swert"
    ];
    
    /**
     * Render-Funktion
     */
    const renderUrDefs = () => {
        
        urDefsCont.empty();
        // Tabelle & Überschriften (Tab + erste Reihe + Cells)
        const tabelle = tableMakerReiheHd(urDefsCont, tabHeader);

        // Ursprungdefinitionen-Suche
        const urDefs = buildRegistryDefault(app, dv)
          // Seitenobjekte erstellen + sortieren
            .map(def => {
                const page = getPageNormObject(app, dv, def);
                const swert = Number(einzelnesFeldLesen(app, page, "swert"));
                page.swert = swert;
                return page;
            })
            .sort((defA, defB) => defA.swert - defB.swert);
        
        // UrsprungsDefs anzeigen
        urDefs.forEach((def, i) => {
            // Tabelle Reihe m. Cells
            const cells = tableMakerReihe(tabelle, tabHeader.length);
            // (1) nr.
            cells[0].textContent = i+1;
            // (2) UrDef-Link
            const urDefCont = cells[1].createEl("div");
            placeHoverLinkOnEl(obsClsObj, urDefCont, def);
            // (3) Swert
            cells[2].textContent = def.swert;
        });

    }
    
    renderUrDefs();
}

