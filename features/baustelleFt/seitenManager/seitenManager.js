// IMPORTs

import { getNormPage } from "../../../shared/services/pagesAndLinks/normPageService.js";
import { seitenCheck } from "../../../shared/services/pagesAndLinks/seitenCheckService.js";
import { dvLinkSuche } from "../../../shared/services/queries/dvQueryService.js";
import { rankPagesByFuzzySearch } from "../../../shared/services/queries/fuzzySearch.js";
import { placeHoverLinkOnEl } from "../../../shared/services/ui/uiLinkService.js";
import { seitenManagerErgAnzeigen, seitenManagerUI } from "./seitenManagerUI.js";

// --------


export async function seitenManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const alleSeiten = app.vault.getMarkdownFiles()
    .map(s => {
        const normSeite = getNormPage(app, s.path);
        seitenCheck(app, normSeite);
        return normSeite;
    });

    const managerState = getManagerState(obsClsObj, alleSeiten);

    const ergSucheInputFn = inputSuchstring => {

        const rankedPages = rankPagesByFuzzySearch(inputSuchstring, alleSeiten, {
            fields: ["name", "art"],
        });

        seitenManagerErgAnzeigen(managerState, ui, rankedPages);;
    };

    const ergSuchfelderAuswahlBtnFn = (suchfeld, managerState) => {

        managerState.toggleErgSuchfeldAuswahl(suchfeld);
    };

    const ui = seitenManagerUI(managerState, alleSeiten, {ergSucheInputFn, ergSuchfelderAuswahlBtnFn});

    seitenManagerErgAnzeigen(managerState, ui, alleSeiten);
}


/**
 * 
 */

function getManagerState(obsClsObj) {

    return {
        obsClsObj,
        ergSucheContainerBearbeiten: null,
        ergSuchfelderAuswahl: ["hallo"],
        ergSuchfelderAktiv: [],
        
        toggleErgSuchfeldAuswahl: function(suchfeld) {

            const index = this.ergSuchfelderAuswahl.indexOf(suchfeld);

            if (index === -1) 
                this.ergSuchfelderAuswahl.push(suchfeld);
            else 
                this.ergSuchfelderAuswahl.splice(index, 1);
        },

        
    }
}

