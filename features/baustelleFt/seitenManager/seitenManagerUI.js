import { placeHoverLinkOnEl } from "../../../shared/services/ui/uiLinkService";
import { uiMaker } from "../../../shared/services/ui/uiService";

/**
 * 
 */

export function seitenManagerUI(managerState, alleSeiten, {ergSucheInputFn, ergSuchfelderAuswahlBtnFn}) {
    
    const { app, dv, contentEl } = managerState.obsClsObj;

    const ui = uiMaker(contentEl, {
        mainHeader:             [, "h4", "Seiten-Manager"],
        gesUebersichtContainer: [],
        gesUebersichtHeader:    ["gesUebersichtContainer", "h5", "Gesamtübersicht"],
        gesUebersichtBox:       ["gesUebersichtContainer"],

        ergSucheContainer:      [],
        ergSucheInput:          ["ergSucheContainer", "input"],
        addErgSuchfelderBtn:    ["ergSucheContainer", "button", "Felder bearbeiten"],
        ergSuchfelderBox:       ["ergSucheContainer"],

        ergSucheBearbeitenContainer:[],
        addSuchfelderInput:     ["ergSucheBearbeitenContainer", "input"],

        ergebnisContainer:      [],
    });

    ui.ergSucheBearbeitenContainer.style.display = "none";

    ui.ergSucheInput.addEventListener("input", () => {

        ergSucheInputFn(ui.ergSucheInput.value);
    });

    managerState.ergSuchfelderAuswahl.forEach(suchfeld => {

        const btn = ui.ergSuchfelderBox.createEl("button", { text: suchfeld });
        btn.addEventListener("click", ()=> {

            ergSuchfelderAuswahlBtnFn(suchfeld, managerState);
        })
    });

    return ui;
}

/**
 * 
 */

export function renderSeitenManagerUI(managerState, ui, pages) {

    seitenManagerErgAnzeigen(managerState, ui, pages);
}

/**
 * 
 */

export function seitenManagerErgAnzeigen(managerState, ui, pages) {

    const { app, dv, contentEl } = managerState.obsClsObj;

    ui.ergebnisContainer.empty();

    for (const [i, normSeite] of pages.entries()) {

        if (i >= 0 && i <=99) {

            const header = ui.ergebnisContainer.createEl("h6");
            const hdSpanA = header.createEl("span");
            const hdSpanB = header.createEl("span");
            const checkBox = ui.ergebnisContainer.createEl("div");  
            const fmBox = ui.ergebnisContainer.createEl("div");
            const gecheckteFelderBox = ui.ergebnisContainer.createEl("div");

            hdSpanA.textContent = i+1 + " ";
            placeHoverLinkOnEl(managerState.obsClsObj, hdSpanB, normSeite);
            
            checkBox.textContent = normSeite.erkannteRolle?.getInfoString();

            fmBox.textContent = Object.keys(normSeite.frontmatter)
            .length === 0
                ? "" // "No frontmatter"
                : ""; // JSON.stringify(normSeite.frontmatter, null, 2);
            
            //console.log(normSeite.gecheckteFelder)

            Object.entries(normSeite.gecheckteFelder).forEach(([key, entry]) => {

                //console.log(key);
                const { feldTypKorrekt, wertTypKorrekt,
                    wertTypVeraltet, berechtigt } = entry;

                const box = gecheckteFelderBox.createEl("div");
                box.textContent = `${key}: 
                    feldTypKorrekt: ${feldTypKorrekt}
                    wertTypKorrekt: ${wertTypKorrekt}
                    wertTypVeraltet: ${wertTypVeraltet}
                    berechtigt: ${berechtigt}`;
            });

            [header, checkBox, fmBox, gecheckteFelderBox].forEach(el => 
                el.style.userSelect = "text"
            );
        }
    }
}