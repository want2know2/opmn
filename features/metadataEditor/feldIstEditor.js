
////
// IMPORT                     // FROM

import { rankFuzzy } from "../../shared/services/fuzzyService.js";
import { alleFeldWerte,
         addLinkToListField,
         removeLinkFromListField,
         listFieldHasLink }   from "../../shared/services/metadataService.js";
import { getPageNormObject }  from "../../shared/services/pageNormService.js";
import { toStringValue }      from "../../shared/utils/valueUtils.js";
import { entityButtons }      from "./entityButtons.js";
import { fuzzySearch }        from "./fuzzySearch.js";


/**
 * 
 */

export function feldIstEditor(dv, container, metaEditState) {

    const stateIntern = {
        boxOpen: true,
        activeEntityType: null
    };

    const headerText = "ist";
    const header = container.createEl("h4", { text: headerText });
    header.style.cursor = "pointer";

    header.addEventListener("click", () => {
        stateIntern.boxOpen = !stateIntern.boxOpen;
        box.style.display = stateIntern.boxOpen ? "" : "none";
        header.textContent = stateIntern.boxOpen ? `${headerText} (-)` : `${headerText} (+)`;
    });

    const box = container.createEl("div");
    const btnBox = box.createEl("div");
    const fuzzyBox = box.createEl("div");
    const resultBox = box.createEl("div");

    const searchableFieldsOfPageExtractor = (p) => {
        return [
            p.name,
            ...(p.dvPage?.in ?? []),
            ...(p.dvPage?.ist ?? [])
        ].join(" ");
    };

    const renderResults = (userInputString) => {

        const entTypeCandidatePages =
            stateIntern.activeEntityType
                .query(dv)
                .map(p => getPageNormObject(dv, p))
                .filter(p => {
                    const istP = p.dvPage.ist?.join(" ")?.includes("Status _ p.md");
                    return metaEditState.pStatus.active
                        ? istP : !istP;
                })
                .filter(Boolean);

        const ranked =
            rankFuzzy(
                userInputString,
                entTypeCandidatePages,
                searchableFieldsOfPageExtractor
            );

        resultBox.innerHTML = "";

        const resultTable = resultBox.createEl("table");

        ranked.forEach(p => {

            const parentPagesArr = p.name.split(" _ ");
            const parentPagesFlt = parentPagesArr.filter((_, i) =>
                i > 0 && i < parentPagesArr.length - 1
            );
            const parentPagesStr = parentPagesFlt.join(" / ");
            
            const resultRow = resultTable.createEl("tr");
            const checkCell = resultRow.createEl("td");
            const checkInputBox = checkCell.createEl("input", {type: "checkbox"});
            const resultCell = resultRow.createEl("td", { text: 
                (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") +
                    p.displayName
            });

            const target = metaEditState.target;

            // Anfangszustand spiegelt das tatsächliche `ist` der aktiven Seite.
            checkInputBox.checked = target
                ? listFieldHasLink(target, "ist", p)
                : false;
            if (!target) checkInputBox.disabled = true;

            // Mehrfachauswahl: jede Checkbox schaltet ihren Link in `ist` um.
            checkInputBox.addEventListener("change", async () => {
                if (!target) return;
                checkInputBox.disabled = true;
                try {
                    if (checkInputBox.checked)
                        await addLinkToListField(target, "ist", p);
                    else
                        await removeLinkFromListField(target, "ist", p);
                } catch (e) {
                    console.error("[OPMN] ist write failed:", e);
                    checkInputBox.checked = !checkInputBox.checked;  // zurücksetzen
                } finally {
                    checkInputBox.disabled = false;
                }
            });
        });
    };

    const renderFuzzy = () => {
        if (!stateIntern.activeEntityType) return;
        fuzzySearch(fuzzyBox, renderResults);
    };

    entityButtons(btnBox, (entityType) => {
        stateIntern.activeEntityType = entityType;
        renderFuzzy();
    });

    return renderFuzzy;
}

