
//// 
// IMPORT                           // FROM

import { dvQueryInh, dvQueryKat }   from "../../shared/services/entityService.js";
import { getDateTimeID } 			from "../../shared/services/idService.js";
import { einzelnerFeldWert, 
		 updateEntireFrontmatter } 	from "../../shared/services/metadataService.js";
import { placeHoverLinkOnEl }       from "../../shared/services/pageLinkService.js";
import { getPageNormObject }        from "../../shared/services/pageNormService.js";
import { dvLinkSuche } 				from "../../shared/services/queryService.js";


/**
 * 
 */

export function bulkEditorTest(view) {
    
	const { app, dv, contentEl } = view;
	
	// Überschrift
	contentEl.createEl("h2", { text: "DB-Inhalt-p-Seiten Editor" });
	const menuHeader = contentEl.createEl("h4");

	const mainBox = contentEl.createEl("div");
	
	// Ergebnisse darstellen
	const renderErgebnisse = () => {

		mainBox.empty();
		// let dbPagesP = null;

		// Suche Inhalt, Status P
		const dbPagesP = dvLinkSuche(dv, ["Inhalt", "Status _ p"], ["ist"], 0, true)
			.map(p => getPageNormObject(dv, p));

		menuHeader.textContent = `${dbPagesP?.length} Ergebnisse`;
		
		const refreshBtn = mainBox.createEl("button", { text: "neu laden "});
		refreshBtn.addEventListener("click", () => {
			renderErgebnisse();
		})

		// Tabelle
		const ergebnisTabelle = mainBox.createEl("table", { cls: "" });

		// Tabelle Überschriften
		const ergTabReiheHd = ergebnisTabelle.createEl("tr", { cls: "" });
		const ergTabHeader = [
			"Link",
			"ersetzen durch",		
			//"erstellen",
			// "ist-typ",
			// "ist-Typ-Link",
			"ersetzen"
		];

		ergTabHeader.forEach(h => {
			ergTabReiheHd.createEl("th", { 
				text: h, cls: "opmn-table-cell-hd" 
			});
		});

		// Reihe für Buttons
		const tabReiheButtons = ergebnisTabelle.createEl("tr", { cls: "" });
		const btnCells = [...ergTabHeader].map(h => {
			const btnCell = tabReiheButtons.createEl("th", { 
				cls: "opmn-table-cell-hd" 
			});
			return btnCell;
		});
		/*const linkOhnePBtnCell = btnCells[2];
		const linkOhnePBtn = linkOhnePBtnCell.createEl("button", { 
			text: "Alle DB-Seiten erstellen"
		});*/
		const alleErsetzenBtnCell = btnCells[2];
		const alleErsetzenBtn = alleErsetzenBtnCell.createEl("button", { 
			text: "Alle ersetzen" 
		});

				
		// Ergebnisse Inhalt, Status P anzeigen
		dbPagesP.forEach(p => {
			
			// Ergebnisreihe
			const ergTabReihe = ergebnisTabelle.createEl("tr", { cls: "" });

			// CELL 1: Link
			const linkCell = ergTabReihe.createEl("td", { cls: "opmn-table-cell" });
			placeHoverLinkOnEl(view, linkCell, p, p.name);

			// Link ohne p Path
			const linkOhnePStr = p.path.replace(" (p)", "");
			const linkOhnePOhneTypArr = linkOhnePStr.split(" _ ")
				.filter((t, i) => i !== 1);
			const linkOhnePOhneTypArrLength = linkOhnePOhneTypArr.length;
			
			// Link ohne P 			
			let neueSeitePath = ""; 
			// Parent
			let neuerParentPath = "";

			linkOhnePOhneTypArr.forEach((t, i) => {
				if (i < linkOhnePOhneTypArrLength-1) {
					neueSeitePath += `${t} _ `;
					if (linkOhnePOhneTypArrLength > 2 && i < linkOhnePOhneTypArrLength-2) 
						neuerParentPath += `${t} _ `;
					else neuerParentPath += `${t}`;
				}					
				else { 
					neueSeitePath += `${t}`;
				}
			});

			const neuerLinkObj = getPageNormObject(dv, neueSeitePath);
			const neuerParentObj = getPageNormObject(dv, neuerParentPath);

			// CELL 2: 
			const ersetzenDurchCell = ergTabReihe.createEl("td", { cls: "opmn-table-cell" });
			// CELL 2: Box 1: Neuer Link
			const neueSeiteBox = ersetzenDurchCell.createEl("div", {
				text: "Neuer Link: "
			});
			
			if (neuerLinkObj.exists)
				placeHoverLinkOnEl(view, neueSeiteBox, neuerLinkObj, neuerLinkObj.name);
			else { 
				const btn = neueSeiteBox.createEl("button", { text: "erstellen" });
				btn.addEventListener("click", async () => {
					await app.vault.create(neueSeitePath, "");
					const metaObj = {
						id: getDateTimeID(),
						istdin: [`[[Datenbankinterne Entität]]`],
						ist: [`[[Inhalt]]`],
						typ: [isttypLinkObj.wikiLink]
					}
					if (neuerParentObj.exists) metaObj.parent = neuerParentObj.wikiLink;
					neueSeiteBox.empty();
					neueSeiteBox.textContent = "Neuer Link: ";
					const newPageObj = getPageNormObject(dv, neueSeitePath);
					updateEntireFrontmatter(newPageObj.tFile, metaObj);
					placeHoverLinkOnEl(view, neueSeiteBox, newPageObj, newPageObj.name);
				})
			}

			// ist-Typ
			const isttypStr = p.path.split(" _ ")[1]
				?.replace(" (p)", "")?.replace(".md", ""); 

			const isttypLinkStr = `Inhalt _ ${isttypStr}`;
			const isttypLinkObj = getPageNormObject(dv, isttypLinkStr);
			
			// CELL 2: Box 2: ist-Typ
			const isttypBox = ersetzenDurchCell.createEl("div", {
				text: "Typ: "
			});
			placeHoverLinkOnEl(view, isttypBox, isttypLinkObj, isttypLinkObj.name);

			// CELL 2: Box 3: Parent
			if (neuerParentObj.exists) {
				const neuerParentBox = ersetzenDurchCell.createEl("div", {
					text: "Parent: "
				});
				placeHoverLinkOnEl(view, neuerParentBox, neuerParentObj, neuerParentObj.name);
			}

			// CELL 2: Box 4: Status _ P
			const statusPBox = ersetzenDurchCell.createEl("div", {
				text: "p-Status: "
			});
			const statPObj = getPageNormObject(dv, "Status _ p.md");
			placeHoverLinkOnEl(view, statusPBox, statPObj, statPObj.name);

			// CELL 3: Link ohne p Link
			const ersetzenBtnCell = ergTabReihe.createEl("td", { cls: "opmn-table-cell" });
			
			if (neuerLinkObj.exists) {
				const ersetzenBtn = ersetzenBtnCell.createEl("button", { 
					text: "ersetzen"
				});
				ersetzenBtn.addEventListener("click", () => {
					renderErsetzenMenu(p, neuerLinkObj);
				})
			}


			// ist-Typ Cell
			/*const isttypCell = ergTabReihe.createEl("td", { 
				text: isttypStr, cls: "opmn-table-cell" 
			});*/

			// ist-Typ-Link Cell & Link
			/*const isttypLinkCell = ergTabReihe.createEl("td", { 
				cls: "opmn-table-cell" 
			});*/
			

			// ersetzen-Btn
			/*
			const ersetzenBtnCell = ergTabReihe.createEl("td", { 
				cls: "opmn-table-cell" 
			});
			 */
		});
	}

	const renderErsetzenMenu = (pageNorm, neuePageNorm) => {
		// MainBox und Überschrift
		mainBox.empty();
		menuHeader.textContent = pageNorm.name;

		// Wenn keine Seite, zurück zum Suchmenü
		if (!pageNorm.exists) {
			mainBox.createEl("div", { text: "Seite existiert nicht"});
			const btn = mainBox.createEl("button", { text: "zurück"});
			btn.addEventListener("click", () => {
				renderErgebnisse();
			})
			return;
		}
		
		// zurück-Btn
		const zurueckBtn = mainBox.createEl("button", {text: "zurück"});
		zurueckBtn.addEventListener("click", () => {
			renderErgebnisse();
		})

		// Tabelle und Überschriften
		const zielPagesTabelle = mainBox.createEl("table");
		const zielPagesReiheHd = zielPagesTabelle.createEl("tr", { cls: "" });
		const zielPagesTabHeader = [
			"Seite",
			"ist",		
			// "Link ohne p",
			// "ist-typ",
			// "ist-Typ-Link",
			// "ersetzen"
		];

		zielPagesTabHeader.forEach(h => {
			zielPagesReiheHd.createEl("th", { 
				text: h, cls: "opmn-table-cell-hd" 
			});
		});


		// Zielpage: Pages mit pageNorm in `ist`
		const pagesMitStatus = dvLinkSuche(dv, [pageNorm.path], ["ist"], 0, true)
			.map(p => getPageNormObject(dv, p));

		pagesMitStatus.forEach(p => {
			const zielPagesReihe = zielPagesTabelle.createEl("tr");
			const zielPageCell = zielPagesReihe.createEl("td");
			placeHoverLinkOnEl(view, zielPageCell, p);
			const istWertArr = (Array.isArray(p.dvPage.ist) 
				? p.dvPage.ist : [p.dvPage.ist])
				.filter(val => val.path !== pageNorm.path)
				.map(val => getPageNormObject(dv, val.path));
			
			istWertArr.push(neuePageNorm);

			const istValCell = zielPagesReihe.createEl("td");
			
			istWertArr.forEach(val => {
				const valPath = val.path;
				
				const istValBox = istValCell.createEl("div", {
					text: `valPath: ${valPath}`
				});
				
			})

		})
	}

	renderErgebnisse();
	
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