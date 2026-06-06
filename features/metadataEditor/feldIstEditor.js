
////
// IMPORT                       // FROM

import { toStringValue }        from "../../shared/utils/valueUtils.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { listFieldHasLink }     from "../../shared/services/pagesAndLinks/linkNormService.js";
import {
    addLinkToListField,
    removeLinkFromListField
} from "../../shared/services/metadata/metaWriteService.js";
import { alleFeldWerte } from "../../shared/services/metadata/metaReadService.js";

import { entityButtons }        from "./entityButtons.js";
import { rankFuzzy }            from "../../shared/services/uiServices/fuzzyService.js";
import { fuzzySearch }          from "./fuzzySearch.js";


/**
 * 
 */

export function feldIstEditor(app, dv, container, metaEditState) {

    const stateIntern = {
        boxOpen: true,
        activeEntityType: null,
        candidatePages: []
    };

    const headerText = "ist";
    const header = container.createEl("h4", { text: headerText, cls: "opmn-header" });

    header.addEventListener("click", () => {
        stateIntern.boxOpen = !stateIntern.boxOpen;
        box.style.display = stateIntern.boxOpen ? "" : "none";
        header.textContent = stateIntern.boxOpen ? `${headerText} (-)` : `${headerText} (+)`;
    });

    const box = container.createEl("div");
    const btnBox = box.createEl("div", {cls: "opmn-button-group"});
    const fuzzyBox = box.createEl("div");
    const resultBox = box.createEl("div", { cls: "opmn-result-box" });

    const searchableFieldsOfPageExtractor = (p) => {
        return [
            p.name,
            ...(p.dvPage?.in ?? []),
            ...(p.dvPage?.ist ?? [])
        ].join(" ");
    };

    const getCandidatePagesForEntityType = () => {
        return stateIntern.activeEntityType
                .query(dv)
                .map(p => getPageNormObject(app, dv, p))
                /*.filter(p => {
                    const istP = p.dvPage.ist?.join(" ")?.includes("Status _ p.md");
                    return metaEditState.pStatus.active
                        ? istP : !istP;
                })*/
                .filter(Boolean);
    }


    const renderResults = (userInputString) => {

        const ranked =
            rankFuzzy(
                userInputString,
                stateIntern.candidatePages,
                searchableFieldsOfPageExtractor
            );

        resultBox.innerHTML = "";

        const resultTable = resultBox.createEl("div");

        ranked.forEach(p => {

            const parentPagesArr = p.name.split(" _ ");
            const parentPagesFlt = parentPagesArr.filter((_, i) =>
                i > 0 && i < parentPagesArr.length - 1
            );
            const parentPagesStr = parentPagesFlt.join(" / ");
            const resultRow = resultTable.createEl("div", { cls: "opmn-result-row" });
            const checkInputBox = resultRow.createEl("input", {
                type: "checkbox"
            });

            const resultCell = resultRow.createEl("div", {
                text:
                    (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") + p.displayName,
                cls: "opmn-result-cell"
            });

            const activePage = metaEditState.activePage;

            // Anfangszustand spiegelt das tatsächliche `ist` der aktiven Seite.
            checkInputBox.checked = activePage
                ? listFieldHasLink(app, activePage, "ist", p)
                : false;
            if (!activePage) checkInputBox.disabled = true;

            async function toggleCheckedState() {
                if (!activePage) return;
                checkInputBox.disabled = true;

                try {
                    if (checkInputBox.checked) {
                        await addLinkToListField(app, activePage, "ist", p);
                    } else {
                        await removeLinkFromListField(app, activePage, "ist", p);
                    }
                } catch (e) {
                    console.error("[OPMN] ist write failed:", e);
                    checkInputBox.checked = !checkInputBox.checked;  // zurücksetzen
                } finally {
                    checkInputBox.disabled = false;
                }
            }

            resultCell.addEventListener("click", () => {
                if (!activePage) return;
                checkInputBox.checked = !checkInputBox.checked;
                toggleCheckedState();
            })

            // Mehrfachauswahl: jede Checkbox schaltet ihren Link in `ist` um.
            checkInputBox.addEventListener("change", toggleCheckedState);
        });
    };

    const renderFuzzy = () => {
        if (!stateIntern.activeEntityType) return;
        stateIntern.candidatePages = getCandidatePagesForEntityType();
        fuzzySearch(fuzzyBox, renderResults);
    };

    async function toggleEntityType(entityType) {

        const activePage = metaEditState.activePage;
        if (!activePage) return;

        const entityTypePage = getPageNormObject(app, dv, entityType.label);

        if (
            listFieldHasLink(
                app, 
                activePage,
                "ist",
                entityTypePage
            )
        ) {
            await removeLinkFromListField(
                app,
                activePage,
                "ist",
                entityTypePage
            );
        } else {
            await addLinkToListField(
                app,
                activePage,
                "ist",
                entityTypePage
            );
        }
    }

    entityButtons(btnBox, async (entityType) => {
        stateIntern.activeEntityType = entityType;

        stateIntern.candidatePages = getCandidatePagesForEntityType();
        
        if (stateIntern.candidatePages.length === 0) {
            await toggleEntityType(entityType);
            return;
        }

        renderFuzzy();
    });

    return renderFuzzy;
}

