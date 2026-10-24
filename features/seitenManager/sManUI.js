import { placeHoverLinkOnEl } from "../../shared/services/uiService/uiLinkService";
import { uiMaker } from "../../shared/services/uiService/uiService";

/**
 * Creates the Page Manager's DOM elements.
 *
 * Returns an object containing the relevant UI element references.
 * Does not register feature-specific event handlers or perform searches.
 */

export function getSManUI(contentEl) {
    
    const ui = uiMaker(contentEl, {
        
        // main Header
        mainHeader:             [, "h4", "Seiten-Manager"],
        
        // Gesamtübersicht (noch niht verwendet)
        gesUebersichtContainer: [],
        gesUebersichtHeader:    ["gesUebersichtContainer", "h5", "Gesamtübersicht"],
        gesUebersichtBox:       ["gesUebersichtContainer"],
        
        // Such/Filteroptionen
        ergSucheContainer:      [],
        ergSucheInput:          ["ergSucheContainer", "input"],
        addErgSuchfelderBtn:    ["ergSucheContainer", "button", "Felder bearbeiten"],
        ergSuchfelderBox:       ["ergSucheContainer"],
        
        // Such/Filteroptionen bearbeiten
        ergSucheBearbeitenContainer:[],
        addSuchfelderInput:     ["ergSucheBearbeitenContainer", "input"],
        
        // Ergebnisse 
        ergebnisContainer:      [],
    });

    ui.ergSucheBearbeitenContainer.style.display = "none";

    /*ui.ergSucheInput.addEventListener("input", () => {

        sManState.ergSucheInputFn(ui.ergSucheInput.value);
    });
    */
    return ui;
}


/**
 * Renders the overall Page Manager view.
 *
 * Updates the result list, search-field controls and other UI sections
 * from the supplied state and derived results.
 * Does not register event handlers.
 */
export function renderSManUI(sManState, ui, angezeigteSeiten) {

    renderSManUISuchfelderBox(sManState, ui);
    renderSManUIErgebnisseBox(sManState, ui, angezeigteSeiten)
}


/**
 * Renders the available search-field controls.
 *
 * Visually distinguishes active and inactive search fields.
 */
function renderSManUISuchfelderBox(sManState, ui) {

    ui.ergSuchfelderBox.empty();

    sManState.ergSuchfelderAuswahl.forEach(suchfeld => {

        const btnAktivCheck = sManState.ergSuchfelderAktiv.includes(suchfeld);

        const btn = ui.ergSuchfelderBox.createEl("button", { text: suchfeld });
        btn.dataset.suchfeld = suchfeld;

        btn.style.width = "70px"
        btn.style.color = btnAktivCheck ? "#8A5CF5" : "";
        btn.style.fontWeight = btnAktivCheck ? "bold" : "";
    });
}


/**
 * Renders the supplied page examination results.
 *
 * Displays the relevant page information and validation results.
 */
function renderSManUIErgebnisseBox(sManState, ui) {

    const { angezeigteSeiten } = sManState;

    ui.ergebnisContainer.empty();
    ui.ergebnisContainer.style.userSelect = "text"; // vll redundant mit den einzelnen el.style... unten

    for (const [i, analysierteSeite] of angezeigteSeiten.entries()) {

        if (i <sManState.angezeigteSeitenAnzahl) {

            const header = ui.ergebnisContainer.createEl("h6");
            const hdSpanA = header.createEl("span");
            const hdSpanB = header.createEl("span");
            const rolleBox = ui.ergebnisContainer.createEl("div");
            const fmBox = ui.ergebnisContainer.createEl("div");
            const gecheckteFelderBox = ui.ergebnisContainer.createEl("div");
            
            [header, rolleBox, fmBox, gecheckteFelderBox].forEach(el => 
                el.style.userSelect = "text"
            );

            hdSpanA.textContent = i+1 + " ";
            placeHoverLinkOnEl(sManState.obsClsObj, hdSpanB, analysierteSeite);

            rolleBox.textContent = analysierteSeite.rolle.getText();
            fmBox.textContent = analysierteSeite.fmAnalyse.getText();
            
            
        }
    }
}

