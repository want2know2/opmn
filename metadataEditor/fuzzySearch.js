
////
// IMPORT

import { rankFuzzy } from "../../shared/services/fuzzyService.js";


/**
 * 
 */

export function fuzzySearch(fuzzyBox, renderResults) {

    fuzzyBox.innerHTML = "";

    const input = fuzzyBox.createEl("input");
    // const resultTable = fuzzyBox.createEl("table");

    // Wenn einzelne Bausteine andere Kriterien verwenden sollen
    // `searchableFieldsOfPageExtractor` auslagern und an `fuzzySearch`
    // als weiteres Argument weiterreichen (wird von hier auch nur
    // an `rankFuzzy` weitergereicht).
    /*const searchableFieldsOfPageExtractor = (entCandidatePage) => {
        return [
            entCandidatePage.name,
            ...(entCandidatePage.dvPage?.in ?? []),
            ...(entCandidatePage.dvPage?.ist ?? [])
        ].join(" ");
    };*/

    /*const render = (userInputString) => {
        resultTable.innerHTML = "";

        const ranked = 
            rankFuzzy(
                userInputString,
                entCandidatePages,
                searchableFieldsOfPageExtractor
            );

        ranked.forEach(p => {
            const parentPagesArr = p.name.split(" _ ");
            const parentPagesFlt = parentPagesArr
                .filter((p, i) => {
                    return (i >0 && i < parentPagesArr.length-1) ? true : false;
                });
            const parentPagesStr = parentPagesFlt.join(" / ");
            
            const resultRow = resultTable.createEl("tr");
            const resultCheckCell = resultRow.createEl("td");
            const resultCheckbox = resultCheckCell.createEl("input", {type: "checkbox"});
            const resultCell = resultRow.createEl("td", { 
                text: `${parentPagesFlt.length > 0 
                    ? parentPagesStr+" /" 
                    : ""}
                    ${p.displayName}` 
            });
            resultCheckCell.style.padding = "6px";
            resultCell.style.padding = "6px";
        });
    };*/

    input.addEventListener("input", (e) => {
        renderResults(e.target.value); // e.target.value => userInputString
    });

    renderResults("");
}

