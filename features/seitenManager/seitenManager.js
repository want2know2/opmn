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
        angezeigteSeitenAnzahl: 123,
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

    const ergSuchfelderAktivBtnFn = (suchfeld) => {

        if (!sManState.ergSuchfelderAktiv.includes(suchfeld))
            sManState.ergSuchfelderAktiv.push(suchfeld);
        else {
            const index = sManState.ergSuchfelderAktiv.indexOf(suchfeld);
            sManState.ergSuchfelderAktiv.splice(index, 1)
        }

        updateSManView(sManState, ui);
    };
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


//--------------------------

/** 
 * 
 */
/*
export async function seitenManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const alleSeiten = app.vault.getMarkdownFiles()
    .map(s => {
        const normSeite = getNormPage(app, s.path);
        seitenCheck(app, normSeite);
        return normSeite;
    });

    const managerState = getManagerState(obsClsObj, alleSeiten);

    managerState.ergSucheInputFn = (inputSuchstring) => {

        const rankedPages = rankPagesByFuzzySearch(inputSuchstring, alleSeiten, {
            fields: managerState.ergSuchfelderAktiv,
        });

        renderSManUI(managerState, ui, rankedPages);
    };

    managerState.ergSuchfelderAktivBtnFn = (suchfeld, inputSuchstring) => {

        managerState.toggleErgSuchfeldAktiv(suchfeld);
        managerState.ergSucheInputFn(inputSuchstring);
    };

    const ui = getSManUI(managerState, alleSeiten);

    renderSManUI(managerState, ui, alleSeiten);
}
*/

/**
 * 
 */
/*
function getManagerState(obsClsObj) {

    return {
        obsClsObj,
        ergSucheContainerBearbeiten: null,
        ergSuchfelderAuswahl: ["name", "art"],
        ergSuchfelderAktiv: ["name","art"],
        
        toggleArr: function(feldMitArr, value) {

            const index = this[feldMitArr].indexOf(value);

            if (index === -1) 
                this[feldMitArr].push(value);
            else if (this[feldMitArr].length >= 2)
                this[feldMitArr].splice(index, 1);
        },
        
        toggleErgSuchfeldAuswahl: function(suchfeld) {

            this.toggleArr("ergSuchfelderAuswahl", suchfeld);
        },

        toggleErgSuchfeldAktiv: function(suchfeld) {

            this.toggleArr("ergSuchfelderAktiv", suchfeld);
        },

        
    }
}
*/

