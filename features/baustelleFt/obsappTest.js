
//// 
// IMPORT                       // FROM

import { fmOhneDv }             from "../../shared/services/metadata/metaReadService.js";
import { resolveLinkPath } from "../../shared/services/pagesAndLinks/linkNormService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";


/**
 * 
 */

export function obsappTest(obsidianClassObj) {
    
	const { app, dv, contentEl } = obsidianClassObj;
    const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
    
    const istdin = fmOhneDv(app, inhaltSeite.tFile, "istdin");
    istdin.forEach(din => {
        
        const txt = resolveLinkPath(app, din);
        contentEl.createEl("div", {text: txt});
    });
  

}