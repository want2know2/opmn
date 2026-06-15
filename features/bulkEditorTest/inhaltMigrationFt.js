
//// 
// IMPORT                           // FROM

import { dvQueryInh }   			from "../../shared/services/queries/entityService.js";
import { getDateTimeID } 			from "../../shared/utils/dateTimeUtils.js";

import { removeField, setField, 
		 updateFrontmatter } 		from "../../shared/services/metadata/metaWriteService.js";

import { placeHoverLinkOnEl }       from "../../shared/services/ui/uiLinkService.js";
import { getPageNormObject }        from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche } 				from "../../shared/services/queries/queryService.js";

import { tableMakerReiheHd, 
		 tableMakerReihe } 			from "../../shared/services/ui/uiService.js";

import { seiteIstWerteCheck, 
		 neueInhIstWerte } 			from "../../shared/services/pagesAndLinks/mergeService.js";


/**
 * 
 */

export function inhaltMigrationFt(obsClsObj) {
    
	const { app, dv, contentEl } = obsClsObj;
	
	const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(app, dv, "Status _ p.md");

	// Überschriften / Container
	const featureHeader = contentEl.createEl("h2", { 
		text: "p-Seiten Editor" 
	});
	const menuHeader = contentEl.createEl("h4");
	const infoBox = contentEl.createEl("div");
	const mainBox = contentEl.createEl("div");

	////
	// RENDER Ergebnisse:
	// Ergebnisse darstellen
	const renderErgebnisse = () => {

		mainBox.empty();
		
		// Tabelle
		const ergTabHeader = [
            "Link",
            "editierbare ist-Werte",	
            "ersetzen durch",
			"ersetzen",
        ];

		const ergTabelle = tableMakerReiheHd(mainBox, ergTabHeader);
		const cellsNr = ergTabHeader.length;
		const btnCells = tableMakerReihe(ergTabelle, cellsNr);

		////
		// ALLE EDITIEREN-BTN
		const alleBtn = btnCells[3].createEl("button", { text: "Alle editieren"});
		alleBtn.addEventListener("click", () => {
			zielseitenNeu.forEach((zseite, i) => {
				// Timeout zu Testzwecken
				setTimeout(() => {
					// Zielseite auslesen
					const { cells, zielseite, neuWerte } = zseite;
					//cells[1].empty(); cells[2].empty();
					if (neuWerte.editierbar) {
						cells[2].empty();
						cells[2].textContent = JSON.stringify(neuWerte, null, 2);
					}
				}, i * 200);
			})
		})

		////
		// SUCHE 1: Inhalt, Status P
		const dbPagesP = dvLinkSuche(dv, ["Inhalt", "Status _ p"], ["ist"], 0, true);

		////
		// SUCHE 2: ZIELSEITEN: Seiten die zu Suche 1-Seiten linken
		const zielseiten = dvLinkSuche(dv, dbPagesP, ["ist"], 2, false)
			.map(p => getPageNormObject(app, dv, p));
		
		menuHeader.textContent = 
			"Seiten, die zu DBint Seiten mit integriertem Status _ p linken";
		
		infoBox.textContent = `${zielseiten.length} Seiten, die zu ${dbPagesP?.length} 
			DBint-Seiten mit integriertem Status _ p linken`

		////
		// ZIELSEITEN DARSTELLEN
		const zielseitenNeu = zielseiten.map(p => {

			// Cell 1: Zielseite Link
			const cells = tableMakerReihe(ergTabelle, cellsNr);
			const linkBox = cells[0].createEl("div");
			placeHoverLinkOnEl(obsClsObj, linkBox, p, p.name);

			// `ist`-Check: Gibt zwei Arrays zurück: 
			// editierbar: SitenNormObj für jeden gültigen `ist`-Wert
			// nicht editierbar: Info-String für jeden nicht gültigen `ist`-Wert
			const istWerte = seiteIstWerteCheck(app, dv, p);

			// Info-Strings für nicht editierbare `ist`-Werte
			if (istWerte.nichtEditierbar.length > 0) {
				linkBox.createEl("div", {
					text: `Feld ist enthält ${istWerte.nichtEditierbar.length} 
						nicht editierbare Seiten:`
				});
			}
			istWerte.nichtEditierbar.forEach(istNEditable => {
				const istBox = linkBox.createEl("div", {
					text: `- Seite ${istNEditable.info}`
				});
			})
		
			// Cell 2: 
			// gültige `ist`-Wert SeiteNormObjekte
			istWerte.editierbar.forEach(istEditable => {
				const istBox = cells[1].createEl("div");
				placeHoverLinkOnEl(obsClsObj, istBox, istEditable, istEditable.name);
			});

			// Cell 3: neue Werte
			const cell3Box = cells[2].createEl("div");

			// Arrays für neue Werte, die als Wikilinks 
			// hier reingepusht werden (s.u.)
			const istSeiteArr = []; 
			const typArr = [];
			const parentArr = [];

			////
			// EDITIERBARE `IST`-WERTE
			if (istWerte.nichtEditierbar.length === 0) {

				// Für alle gültigten `ist`-Wert SeitenObj neue Werte bilden
				istWerte.editierbar.forEach(ist => {

					// Pfad für neuen ist-Wert, Typ und Parent vorbereiten
					const istNeu = neueInhIstWerte(app, dv, ist);
					const { artSeite, typSeite, parentSeite } = istNeu;
					
					// -Box
					const neuBox = cell3Box.createEl("div");
					const parentBox = cell3Box.createEl("div");
					const typBox = cell3Box.createEl("div");
					const pStatusBox = cell3Box.createEl("div");
					
					// Neu- und Typ-Info und Link
					const neuInfo = neuBox.createEl("div", {text: "neuer ist-Wert"});
					placeHoverLinkOnEl(obsClsObj, 
						neuBox, artSeite, artSeite.name);
					const typInfo = typBox.createEl("div", {text: "Typ"});
					placeHoverLinkOnEl(obsClsObj, 
						typBox, typSeite, typSeite.name);
					const pStatusInfo = pStatusBox.createEl("div", {text: "p-Status"});
					placeHoverLinkOnEl(obsClsObj, 
						pStatusBox, pStatusSeite, pStatusSeite.name)

					// Parent Info und Link
					if (parentSeite.exists) {
						const parentInfo = parentBox.createEl("div", {text: "Parent"});
						placeHoverLinkOnEl(obsClsObj, 
							parentBox, parentSeite, parentSeite.name);
					}
					// neue Werte als Wikilinks in die Arrays pushen
					istSeiteArr.push(artSeite.wikiLink);  
					typArr.push(typSeite.wikiLink);
					if (parentSeite.exists) parentArr.push(parentSeite.wikiLink);

				});

				// Cell 4: Btn
				const btn = cells[3].createEl("button", {text: "Editieren"});
				btn.addEventListener("click", async () => {
					cells[1].empty(); cells[2].empty();
					cells[2].createEl("span", {text: `${p.name} wurde editiert` });
					
					// NOCHMAL NEU - ANGEPASST AN NEUE STRUKTUR
					// S. [[Datenbankschema]]
					await updateFrontmatter(app, p, fm => {
						setField(fm, "klass", [inhaltSeite.wikiLink]);
						setField(fm, "typ", istSeiteArr);
						setField(fm, "art", typArr);
						setField(fm, "pstatus", [pStatusSeite.wikiLink]);
						removeField(fm, "ist");
					})

				}) 
			}
			// für nicht editierbare `ist`-Werte
			else cells[3].createEl("span", {text: "Nicht editierbar, s. Seite"});
			
			return {
				cells,
				zielseite: p,
				neuWerte: {
					editierbar: istWerte.nichtEditierbar.length === 0,
					klass: [inhaltSeite.wikiLink],
					typ: istSeiteArr,
					art: typArr,
					pstatus: [pStatusSeite.wikiLink],
					// parent: parentArr    	// parent soll nicht in die 
												// Inhalts-Seiten (Instanzen) 
												// selbst geschrieben werden.
				}
			}
		})
	}

	renderErgebnisse();
	
}

