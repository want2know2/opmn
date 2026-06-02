
//// 
// IMPORT

import { rankFuzzy } from "../../shared/services/fuzzyService.js";
import { getPageNormObject } from "../../shared/services/pageNormService.js";
import { dvQueryPStatus } from "../../shared/services/pStatusService.js";
import { fuzzySearch } from "./fuzzySearch.js";



/**
 * 
 */

export function pStatusEditor(dv, container, metaEditState, refreshCallback) {
    const headerText = "p-Status";
    const header = container.createEl("h4", {text: `${headerText}`});
    header.style.cursor = "pointer";
    const stateIntern = {
        boxOpen: true
    };
    
    header.addEventListener("click", () => {
        stateIntern.boxOpen = !stateIntern.boxOpen;
        box.style.display = stateIntern.boxOpen 
            ? "" : "none";
        header.textContent = stateIntern.boxOpen 
            ? `${headerText} (-)` : `${headerText} (+)`
    })
    const box = container.createEl("div");
    const checkBoxInput = box.createEl("input", {type: "checkbox"});
    const fuzzyBox = box.createEl("div");
    const resultBox = box.createEl("div");

    checkBoxInput.addEventListener("change", () => {
        if (checkBoxInput.checked) {
            resultBox.style.display = "";
            metaEditState.pStatus.active = true;
            renderFuzzy();
        } else { 
            resultBox.style.display = "none";
            metaEditState.pStatus.active = null;
        }
        refreshCallback();
    })

    const pStatResults = (dvQueryPStatus(dv) ?? [])
        .map(p => getPageNormObject(dv, p));

    const renderFuzzy = () => {
        if (checkBoxInput.checked) 
            fuzzySearch(fuzzyBox, renderResults);
    }

    const searchableFieldsOfPageExtractor = (entCandidatePage) => {
        return [
            entCandidatePage.name,
            ...(entCandidatePage.dvPage?.in ?? []),
            ...(entCandidatePage.dvPage?.ist ?? [])
        ].join(" ");
    };

    const resultTable = resultBox.createEl("table");

    const renderResults = (userInputString) => {

        
        resultTable.innerHTML = "";

        const ranked =
            rankFuzzy(
                userInputString,
                pStatResults,
                searchableFieldsOfPageExtractor
            );

        ranked.forEach(p => {
            const parentPagesArr = p.name.split(" _ ");
            const parentPagesFlt = parentPagesArr.filter((_, i) =>
                i > 0 && i < parentPagesArr.length - 1
            );
            const parentPagesStr = parentPagesFlt.join(" / ");

            const resultRow = resultTable.createEl("tr");
            const resultCheckCell = resultRow.createEl("td");
            const resultCheckbox = resultCheckCell.createEl("input", { type: "checkbox" });
            if (p.name === "Status _ p") resultCheckbox.checked = true;
            const resultCell = resultRow.createEl("td", {
                text:
                    (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") +
                    p.displayName
            });

            resultCheckCell.style.padding = "6px";
            resultCell.style.padding = "6px";
        });
    };

}

