
//// 
// IMPORT                       // FROM

import { einzelnerFeldWert }    from "../../shared/services/metadata/metaReadService.js";
import { removeField, setField, updateFrontmatter } from "../../shared/services/metadata/metaWriteService.js";
import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkNormService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { tableMakerReihe, tableMakerReiheHd } from "../../shared/services/ui/uiService.js";
import { placeHoverLinkOnEl } from "../../shared/services/ui/uiLinkService.js";


/**
 * 
 */

export function obsappTest(obsidianClassObj) {
    
	const { app, dv, contentEl } = obsidianClassObj;
    const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
    
    const istdin = einzelnerFeldWert(app, inhaltSeite.tFile, "istdin");
    
    const tabHeader = [
        "Seite",
        "button"
    ]

    const tabelle = tableMakerReiheHd(contentEl, tabHeader);
    
    istdin.forEach(din => {
        const link = resolveLinkPath(app, din);
        const page = getPageNormObject(app, dv, link);

        const cells = tableMakerReihe(tabelle, 2);

        const box = cells[0].createEl("div");
        placeHoverLinkOnEl(obsidianClassObj, box, page, page.name);
        const btn = cells[1].createEl("button", {text: "BTN"});
        btn.addEventListener("click", async () => {
            cells[1].createEl("span", {text: "click"});
            await updateFrontmatter(app, page, fm => {
                setField(fm, "neuesfeld", page.wikiLink);
                removeField(fm, "ist");
                removeField(fm, "gruppe");
            })
        })
    });
}

