
////
// IMPORT

import { rankFuzzy } from "../../shared/services/ui/fuzzyService.js";


/**
 * 
 */

export function fuzzySearch(fuzzyBox, renderResults) {

    fuzzyBox.innerHTML = "";

    const input = fuzzyBox.createEl("input", {cls: "opmn-search-input"});
    

    input.addEventListener("input", (e) => {
        renderResults(e.target.value); // e.target.value => userInputString
    });

    renderResults("");
}

