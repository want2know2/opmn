
//// 
// IMPORT                           // FROM

import { dvQueryInh }   			from "../../shared/services/queries/entityService.js";
import { getDateTimeID } 			from "../../shared/utils/dateTimeUtils.js";

import { listFieldHasLink} 				from "../../shared/services/pagesAndLinks/linkNormService.js";
import { updateEntireFrontmatter } from "../../shared/services/metadata/metaWriteService.js";
import { updateField } from "../../shared/services/metadata/metaWriteService.js";
import { einzelnerFeldWert } from "../../shared/services/metadata/metaReadService.js";

import { placeHoverLinkOnEl }       		from "../../shared/services/uiServices/uiLinkService.js";
import { toWikiLink } from "../../shared/services/pagesAndLinks/pageNormService.js";

import { getPageNormObject }        from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche } 				from "../../shared/services/queries/queryService.js";


/**
 * Tabelle Überschriften: Row & Cells
 */

function tableMakerReiheHd(container, header) {
	const tabelle = container.createEl("table", { cls: "" });
	const tabReihe = tabelle.createEl("tr", { cls: "" });
	header.forEach(h => {
		tabReihe.createEl("th", { 
			text: h, cls: "opmn-table-cell-hd" 
		});
	});
	return tabelle;
}


/**
 * Tabelle weitere Reihen: Rows & Cells 
 * (cellsNum sollte = Anzahl header in Tabelle Überschriften sein).
 */

function tableMakerReihe(table, cellsNum) {
	const tabReihe = table.createEl("tr", { cls: "" });
	let cells = [];
	for (let i=0; i<cellsNum; i++) {
		const cell = tabReihe.createEl("td", { 
			cls: "opmn-table-cell" 
		});
		cells.push(cell);
	}
	return cells;
}


/**
 * Prüft für jeden Wert, ob dazu eine Seite existiert, 
 * die ein Inhalt ist und Status _ P hat.
 */

function istWertSeitenCheck(dv, seite, pStatusSeite, inhaltSeite) {
	// Zielseite Feld ist-Werte => normSeiten
	const feldIst = (Array.isArray(seite.dvPage.ist) 
		? seite.dvPage.ist : [seite.dvPage.ist])
		.map(ist => getPageNormObject(dv, ist.path));
	
	// prüfe ist-Wert-Seiten: 
	// existiert, ist Inhalt und Status p
	const istWerteFalsch = [];
	const istWerteEditierbar = [...feldIst]
		.filter(ist => {
			if (!ist.exists) istWerteFalsch.push({info: "existiert nicht"});
			else return true;
		})
		.filter(ist => {
			const statP = listFieldHasLink(ist, "ist", pStatusSeite);
			const inh = listFieldHasLink(ist, "ist", inhaltSeite);
			const infostr = [];
			if (!statP) infostr.push("hat keinen p-Status");
			if (!inh) infostr.push("ist kein Inhalt");
			if (!statP || !inh) {
				ist.info = infostr.join(", ");
				istWerteFalsch.push(ist);
			}
			else return true;
		})

	return {
		editierbar: istWerteEditierbar,
		nichtEditierbar: istWerteFalsch
	}
}


/**
 * 
 */

function neueInhIstWerte(dv, seite) {
	const pathNP = seite.path.replace(" (p)", "");
	const cleanPathArr = pathNP.split(" _ ")
		.filter((str, i) => i !== 1);

	// Neu-, Typ-, Parent-Path
	let neuPath = "";		
	const typPath = `Inhalt _ ${pathNP.split(" _ ")[1]}`;
	let parentPath = "";
	
	cleanPathArr.forEach((str, i) => {
		if (i < cleanPathArr.length-1) {
			neuPath += `${str} _ `;
			if (cleanPathArr.length > 2 && i < cleanPathArr.length-2) 
				parentPath += `${str} _ `;
			else if (cleanPathArr.length > 2) parentPath += `${str}`;
		}					
		else { 
			neuPath += `${str}`;
		}
	});
	
	// Neu-, Typ-, Parent-Seiten
	const neuSeite = getPageNormObject(dv, neuPath);
	const typSeite = getPageNormObject(dv, typPath);
	const parentSeite = getPageNormObject(dv, parentPath);

	return {
		neuSeite, typSeite, parentSeite
	}
}



/**
 * 
 */

export function inhaltMigrationFt(view) {
    
	const { app, dv, contentEl } = view;
	
	const inhaltSeite  = getPageNormObject(dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(dv, "Status _ p.md");

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
			.map(p => getPageNormObject(dv, p));
		
		infoBox.textContent = `${zielseiten.length} Seiten, die zu ${dbPagesP?.length} 
			DBint-Seiten mit integriertem Status _ p linken`

		// Seiten, die zu irgendeiner Inhalt _ Typ _ Bla (p)-Seite linken
		const zielseitenNeu = zielseiten.map(p => {

			// Cell 1: Zielseite Link
			const cells = tableMakerReihe(ergTabelle, cellsNr);
			const linkBox = cells[0].createEl("div");
			placeHoverLinkOnEl(view, linkBox, p, p.name);

			const istWerte = istWertSeitenCheck(dv, p, pStatusSeite, inhaltSeite);

			// Cell 2: 
			// editierbare ist-Wert Links
			istWerte.editierbar.forEach(ist => {
				const istBox = cells[1].createEl("div");
				placeHoverLinkOnEl(view, istBox, ist, ist.name);
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

				const istNeu = neueInhIstWerte(dv, ist);
				const { neuSeite, typSeite, parentSeite } = istNeu;
				
				// -Box
				const neuBox = cell3Box.createEl("div");
				const parentBox = cell3Box.createEl("div");
				const typBox = cell3Box.createEl("div");
				const pStatusBox = cell3Box.createEl("div");
				
				// Neu- und Typ-Info und Link
				const neuInfo = neuBox.createEl("div", {text: "neuer ist-Wert"});
				placeHoverLinkOnEl(view, neuBox, neuSeite, neuSeite.name);
				const typInfo = typBox.createEl("div", {text: "Typ"});
				placeHoverLinkOnEl(view, typBox, typSeite, typSeite.name);
				const pStatusInfo = pStatusBox.createEl("div", {text: "p-Status"});
				placeHoverLinkOnEl(view, pStatusBox, pStatusSeite, pStatusSeite.name)

				// Parent Info und Link
				if (parentSeite.exists) {
					const parentInfo = parentBox.createEl("div", {text: "Parent"});
					placeHoverLinkOnEl(view, parentBox, parentSeite, parentSeite.name);
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
					
					await updateField(p.tFile, "ist", istSeiteArr);
					if (parentArr.length>0) { await updateField(p.tFile, "parent", parentArr); }
					await updateField(p.tFile, "typ", typArr);
					await updateField(p.tFile, "pstatus", pStatusSeite.wikiLink);
					

				}) 
			} else cells[3].createEl("span", {text: "Nicht editierbar, s. Seite"});

			return {
				alt: p,
				
			}

		})




		
		
	}

	renderErgebnisse();
	
}

