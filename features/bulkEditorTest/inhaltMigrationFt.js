
//// 
// IMPORT                           // FROM

import { dvQueryInh }   			from "../../shared/services/queries/entityService.js";
import { getDateTimeID } 			from "../../shared/utils/dateTimeUtils.js";

import { setField, 
		 updateField,
		 updateFrontmatter } 		from "../../shared/services/metadata/metaWriteService.js";

import { placeHoverLinkOnEl }       from "../../shared/services/ui/uiLinkService.js";
import { getPageNormObject }        from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche } 				from "../../shared/services/queries/queryService.js";

import { tableMakerReiheHd, 
		 tableMakerReihe } 			from "../../shared/services/ui/uiService.js";

import { istWertSeitenCheck, 
		 neueInhIstWerte } 			from "../../shared/services/pagesAndLinks/mergeService.js";


/**
 * 
 */

export function inhaltMigrationFt(obsidianClassObj) {
    
	const { app, dv, contentEl } = obsidianClassObj;
	
	const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(app, dv, "Status _ p.md");

	// Überschriften / Container
	const featureHeader = contentEl.createEl("h2", { 
		text: "p-Seiten Editor" 
	});
	const menuHeader = contentEl.createEl("h4");
	const infoBox = contentEl.createEl("div");
	const mainBox = contentEl.createEl("div");

	// RENDER Ergebnisse:
	// Ergebnisse darstellen
	const renderErgebnisse = () => {

		mainBox.empty();

		const ergTabHeader = [
            "Link",
            "editierbare ist-Werte",	
            "ersetzen durch",
			"ersetzen",
			"test"
        ];

		const ergTabelle = tableMakerReiheHd(mainBox, ergTabHeader);
		const cellsNr = ergTabHeader.length;
		const btnCells = tableMakerReihe(ergTabelle, cellsNr);

		const alleBtn = btnCells[3].createEl("button", { text: "Alle editieren"});
		alleBtn.addEventListener("click", () => {
			// ...
		})

		// Suche Inhalt, Status P
		const dbPagesP = dvLinkSuche(dv, ["Inhalt", "Status _ p"], ["ist"], 0, true)

		menuHeader.textContent = "Seiten, die zu DBint Seiten mit integriertem Status _ p linken";

		const zielseiten = dvLinkSuche(dv, dbPagesP, ["ist"], 2, false)
			.map(p => getPageNormObject(app, dv, p));
		
		infoBox.textContent = `${zielseiten.length} Seiten, die zu ${dbPagesP?.length} 
			DBint-Seiten mit integriertem Status _ p linken`

		// Seiten, die zu irgendeiner Inhalt _ Typ _ Bla (p)-Seite linken
		const zielseitenNeu = zielseiten.map(p => {

			// Cell 1: Zielseite Link
			const cells = tableMakerReihe(ergTabelle, cellsNr);
			const linkBox = cells[0].createEl("div");
			placeHoverLinkOnEl(obsidianClassObj, linkBox, p, p.name);

			const istWerte = istWertSeitenCheck(app, dv, p, pStatusSeite, inhaltSeite);

			// Cell 2: 
			// editierbare ist-Wert Links
			istWerte.editierbar.forEach(ist => {
				const istBox = cells[1].createEl("div");
				placeHoverLinkOnEl(obsidianClassObj, istBox, ist, ist.name);
			});
			
			// nicht editierbare ist-Wert Links
			if (istWerte.nichtEditierbar.length > 0) {
				linkBox.createEl("div", {
					text: `Feld ist enthält ${istWerte.nichtEditierbar.length} 
						nicht editierbare Seiten:`
				});
			}
			istWerte.nichtEditierbar.forEach(ist => {
				const istBox = linkBox.createEl("div", {
					text: `- Seite ${ist.info}`
				});
			})
		
			// Cell 3: neue Werte
			const cell3Box = cells[2].createEl("div");

			const istSeiteArr = [];
			const typArr = [];
			const parentArr = [];
			// Aus DBint-Seite mit p-Status neue Werte bilden
			istWerte.editierbar.forEach(ist => {
				// Pfad für neuen ist-Wert, Typ und Parent vorbereiten

				const istNeu = neueInhIstWerte(app, dv, ist);
				const { neuSeite, typSeite, parentSeite } = istNeu;
				
				// -Box
				const neuBox = cell3Box.createEl("div");
				const parentBox = cell3Box.createEl("div");
				const typBox = cell3Box.createEl("div");
				const pStatusBox = cell3Box.createEl("div");
				
				// Neu- und Typ-Info und Link
				const neuInfo = neuBox.createEl("div", {text: "neuer ist-Wert"});
				placeHoverLinkOnEl(obsidianClassObj, neuBox, neuSeite, neuSeite.name);
				const typInfo = typBox.createEl("div", {text: "Typ"});
				placeHoverLinkOnEl(obsidianClassObj, typBox, typSeite, typSeite.name);
				const pStatusInfo = pStatusBox.createEl("div", {text: "p-Status"});
				placeHoverLinkOnEl(obsidianClassObj, pStatusBox, pStatusSeite, pStatusSeite.name)

				// Parent Info und Link
				if (parentSeite.exists) {
					const parentInfo = parentBox.createEl("div", {text: "Parent"});
					placeHoverLinkOnEl(obsidianClassObj, parentBox, parentSeite, parentSeite.name);
				}
				
				istSeiteArr.push(neuSeite.wikiLink);  
				typArr.push(typSeite.wikiLink);
				if (parentSeite.exists) parentArr.push(parentSeite.wikiLink);

			});

			// Cell 4: Btn
			if (istWerte.nichtEditierbar.length === 0) {
				const btn = cells[3].createEl("button", {text: "Editieren"});
				btn.addEventListener("click", async () => {
					cells[1].empty(); cells[2].empty();
					cells[2].createEl("span", {text: `${p.name} wurde editiert` });
					
					await updateFrontmatter(app, p, fm => {
						setField(fm, "ist", istSeiteArr);
						setField(fm, "typ", typArr);
						setField(fm, "pstatus", pStatusSeite.wikiLink);
					})
					/*
					await updateField(app, p, "ist", istSeiteArr);
					if (parentArr.length>0) { await updateField(app, p, "parent", parentArr); }
					await updateField(app, p, "typ", typArr);
					await updateField(app, p, "pstatus", pStatusSeite.wikiLink);
					*/
				}) 
			} else cells[3].createEl("span", {text: "Nicht editierbar, s. Seite"});

			return {
				alt: p,
				
			}

		})




		
		
	}

	renderErgebnisse();
	
}

