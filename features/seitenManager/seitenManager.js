// IMPORTs

import { sManQueryService } from "./sManQueryService.js";
import { getSManUI, renderSManUI } from "./sManUI.js";
import { getSManAnalyseRegeln, getSManAnalysierteSeiten } from "./sManSeitenAnalyse.js";
import { getSManAngezeigteSeiten } from "./sManAngezeigteSeitenService.js";

// --------


/**
 * Initialisiert und koordiniert Seiten-Manager.
 *
 * 1.0 State erstellen
 * 2.0 Alle Seiten querien
 * 2.1 Seiten normalisieren und analysieren
 * 2.2 Ergebnisse in sManState speichern
 * 3.0 UI erstellen
 * 3.1 Connects UI events to feature operations.
 * 4.0 Renders the initial view.
 */
export async function seitenManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const sManState = getSManState(obsClsObj);

    const alleSeiten = sManQueryService(app);

    const sManAnalyseRegeln = getSManAnalyseRegeln(app);

    sManState.analysierteSeiten = getSManAnalysierteSeiten(app, alleSeiten, sManAnalyseRegeln);
    
    const ui = getSManUI(contentEl);

    connectSManUI(sManState, ui);

    updateSManView(sManState, ui);
}


/** 
 * Erstellt ursprüngliches state-Objekt
 *
 * Enthält nur Zustände des Features:
 * - analysierte Seiten
 * - aktueller Suchstring
 * - verfügbare Suchfelder
 * - aktive Suchfelder
 * - aktive Filter
 *
 */
function getSManState(obsClsObj) {

    // const { app, dv, contentEl } = obsClsObj;

    return {
        obsClsObj,
        analysierteSeiten: [],
        angezeigteSeiten: [],
        angezeigteSeitenAnzahl: 30,
        inputSuchstring: "",
        ergSucheContainerBearbeiten: null,
        ergSuchfelderAuswahl: ["name", "art"],
        ergSuchfelderAktiv: ["name","art"],
    }
}


/**
 * Verbindet UI-Events mit Feature-Vorgängen
 * Registriert Event Handler, die das state-Objekt ändern und 
 * View updaten.
 */
function connectSManUI(sManState, ui) {

    // Here, event.target refers to the input element that triggered the event. 
    // Its .value property contains the current input string.
    const ergSucheInputFn = (event) => {

        sManState.inputSuchstring = event.target.value;

        updateSManView(sManState, ui);
    };

    // The key point is that addEventListener calls the event handler with an Event object as its argument. 
    ui.ergSucheInput.addEventListener("input", ergSucheInputFn);

    // Buttons
    const ergSuchfelderAktivBtnFn = (suchfeld) => {

        if (!sManState.ergSuchfelderAktiv.includes(suchfeld))
            sManState.ergSuchfelderAktiv.push(suchfeld);
        else if (sManState.ergSuchfelderAktiv.length >1) {
            const index = sManState.ergSuchfelderAktiv.indexOf(suchfeld);
            sManState.ergSuchfelderAktiv.splice(index, 1)
        }

        updateSManView(sManState, ui);
    };

    // Nutzt Event Propagation: Jedem in `renderSManUISuchfelderBox`
    // erstellten Button wird dort an btn.dataset.suchfeld = suchfeld
    // zugewiesen, wobei = suchfeld dort der jeweilige String aus dem
    // `sManState.ergSuchfelderAktiv`-Array ist, anhand dessen der 
    // Button erstellt wird.
    // Hier wird der Event Listener an die Box angehangen, in der die
    // Buttons enthalten sind. Das Click-Event bubbelt von der Box
    // hoch zum Button, der entsprechende Button wird abgefangen, 
    // indem ausgehend vom Event event.target.closest mit dem Selektor
    // "button 'der die Eigenschaft' [data-suchfeld]" 'hat', abgefragt 
    // wird. "[data-suchfeld]" entspricht dabei, glaube ich, der 
    // vermurksten HTML-Notierung (aber es handelt sich um einen CSS-
    // Selektor? Das müsste ich noch mal nachschauen..).
    ui.ergSuchfelderBox.addEventListener("click", event => {

        const btn = event.target.closest("button[data-suchfeld]");

        if (!btn || !ui.ergSuchfelderBox.contains(btn))
            return;

        ergSuchfelderAktivBtnFn(btn.dataset.suchfeld);
    });
    


}


/**
 * Ermittelt anhand des state-Objekts, welche Ergebnisse jeweils
 * angezeigt werden sollen und rendert UI und Ergebnisse entsprechend.
 * Koordiniert Filter, Fuzzy Search und Rendering.
 */
function updateSManView(sManState, ui) {
    
    sManState.angezeigteSeiten = getSManAngezeigteSeiten(sManState);
    renderSManUI(sManState, ui)
}


