
//// 
// IMPORT                           // FROM

import { dvQueryInh, dvQueryKat }   from "../../shared/services/entityService.js";
import { createPageLink }           from "../../shared/services/pageLinkService.js";
import { getPageNormObject }        from "../../shared/services/pageNormService.js";


/**
 * 
 */

export function bulkEditorTest(view) {
    
        const { dv, contentEl } = view;
		
}



////////////////////

		// Erster Versuch
		/*
		contentEl.createEl("h2", { text: "Suchergebnisse" });
		
		const inhResults = dvQueryInh(dv)
        	.map(p => getPageNormObject(dv, p));	

		inhResults.forEach(p => {
			const linkBox = contentEl.createEl("div", { cls: "" });
			createPageLink(view, linkBox, p);
		});
		*/