
////
// IMPORT

import { ENTITY_TYPES } from "../../shared/services/entityService.js";
import { deleteFieldByDVPage, updateFieldByDVPage } from "../../shared/services/metadataService.js";


/**
 * 
 */

export function bulkMetaEditor(dv) {
    const container = dv.el("div", "");
    const infoBox = container.createEl("div", {text: "`Datenbankinterne Entität` entfernen"}); 
    const btnBox = container.createEl("div");
    const katBox = container.createEl("div");
    
    const katResults = (ENTITY_TYPES[4].query(dv) ?? [])
        .map(p => dv.page(p));
    const katResultsFlt = katResults.filter(page => page.istdin?.length);
    let refreshResults = [...katResultsFlt];

    const btn = btnBox.createEl("button", {text: "Alle bearbeiten"});
    btn.addEventListener("click", () => {

        refreshResults.forEach(async page => {
            const istdin = page.istdin ?? [];
            if (istdin.length === 1 
                    && istdin.join(" ").includes("Datenbankinterne Entität.md")
                ) {
                await deleteFieldByDVPage(page, "istdin");
            } 
            
            else if (istdin.length >1) {
                const newArr = istdin.filter(val => {
                    const text = (typeof val === "object" && val.path)
                        ? val.path : val;
                    return !text.includes("Entität");
                }).map(val => `[[${val.path.replace(".md", "")}]]`);
                
                await updateFieldByDVPage(page, "istdin", newArr);
            }
            
            refreshResults = refreshResults.filter(pg => 
                pg.file.path !== page.file.path
            );
            renderKatResults();
        })
    })

    const renderKatResults = () => {
        katBox.innerHTML = "";

        refreshResults.forEach(page => {
            const name = page?.file?.link;
            const istdin = page.istdin ?? [];
            const resultBox = katBox.createEl("div");
            const pageNameAndIstdinBox = dv.el("div", `${name}
                istdin: ${istdin}`);
            resultBox.appendChild(pageNameAndIstdinBox);

            const pageBtnBox = resultBox.createEl("div");
            const pageBtn = pageBtnBox.createEl("button", {text: "dbint löschen"});
            const afterPageBtnBox = resultBox.createEl("div");
            const brAfterBtn = dv.el("div", `<br>`);
            afterPageBtnBox.appendChild(brAfterBtn);

            pageBtn.addEventListener("click", async () => {
                if (istdin.length === 1 
                        && istdin.join(" ").includes("Datenbankinterne Entität.md")
                    ) {
                    await deleteFieldByDVPage(page, "istdin");
                    pageBtnBox.createEl("div", {text: `istdin wurde gelöscht`});
                } 
                
                else if (istdin.length >1) {
                    const newArr = istdin.filter(val => {
                        const text = (typeof val === "object" && val.path)
                            ? val.path : val;
                        return !text.includes("Entität");
                    }).map(val => `[[${val.path.replace(".md", "")}]]`);
                    
                    await updateFieldByDVPage(page, "istdin", newArr);
                }
                
                refreshResults = refreshResults.filter(
                    pg => pg.file.path !== page.file.path
                );
                renderKatResults();
            })
        });

    }

    renderKatResults();
}

