
//// 
// IMPORT                           // FROM

import { dvQueryInh, dvQueryKat }   from "../../shared/services/entityService.js";
import { createPageLink }           from "../../shared/services/pageLinkService.js";
import { getPageNormObject }        from "../../shared/services/pageNormService.js";
import { dvLinkSuche } 				from "../../shared/services/queryService.js";


/**
 * 
 */

export function bulkEditorTest(view) {
    
	const { app, dv, contentEl } = view;
	contentEl.createEl("h2", { text: "Bulk-Editor" });

	const dbPagesP = dvLinkSuche(dv, ["Inhalt", "Status _ p"], ["ist"], 0, true)
		.map(p => getPageNormObject(dv, p))
	
	const ergebnisTabelle = contentEl.createEl("table", { cls: "" });
	const ergTabReiheHd = ergebnisTabelle.createEl("tr", { cls: "" });
	const ergTabCellHd1 = ergTabReiheHd.createEl("th", { text: "Link", cls: "opmn-table-cell-hd" });
	const ergTabCellHd2 = ergTabReiheHd.createEl("th", { text: "ist-typ", cls: "opmn-table-cell-hd" });
	const ergTabCellHd3 = ergTabReiheHd.createEl("th", { text: "ist-typ-Link", cls: "opmn-table-cell-hd" });

	dbPagesP.forEach(p => {
		

		const ergTabReihe = ergebnisTabelle.createEl("tr", { cls: "" });
		const linkCell = ergTabReihe.createEl("td", { cls: "opmn-table-cell" });	
		const isttypStr = p.path.split(" _ ")[1]
			?.replace(" (p)", "")?.replace(".md", ""); 
		const isttypLinkStr = `Inhalt _ ${isttypStr}`;
		const isttypLinkObj = getPageNormObject(dv, isttypLinkStr);

		const isttypCell = ergTabReihe.createEl("td", { text: isttypStr, cls: "opmn-table-cell" });
		const isttypLinkCell = ergTabReihe.createEl("td", { text: isttypLinkObj.path, cls: "opmn-table-cell" });
		createPageLink(view, linkCell, p);
		// createPageLink(view, isttypLinkCell, isttypLinkObj);
	});
	
}

//// BAustelle
// .filter(p => p.dvPage.istdin?.join(" ")?.includes("Datenbankinterne Entität"));





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