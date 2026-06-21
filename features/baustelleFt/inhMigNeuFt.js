
//// 
// IMPORT                       // FROM

import { removeField, setField, 
		 updateFrontmatter } 	from "../../shared/services/dataService/metaWriteService.js";

import { placeHoverLinkOnEl }   from "../../shared/services/ui/uiLinkService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche } 			from "../../shared/services/queries/queryService.js";

import { tableMakerReiheHd, 
		 tableMakerReihe } 		from "../../shared/services/ui/uiService.js";

import { seiteIstWerteCheck, 
		 neueInhIstWerte } 		from "../../shared/services/pagesAndLinks/mergeService.js";


/**
 * 
 */

export function inhMigNeuFt(obsClsObj) {
    
    // APP, DV, Conteiner
	const { app, dv, contentEl } = obsClsObj;
	
    // Seiten: Inhalt / p-Status
	const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(app, dv, "Status _ p.md");

    ////
    // ZIELSEITEN SUCHEN
    function getZielseiten(app, dv) {

		// Suche 1: Inhalt, Status P
		const dbPagesP = dvLinkSuche(dv, 
            ["Inhalt", "Status _ p"], 
            ["ist"], 
            0, true);

		// Suche 2: ZIELSEITEN: Seiten die zu Suche 1-Seiten linken
		const zielseiten = dvLinkSuche(dv, 
            dbPagesP, 
            ["ist"], 
            2, false);
        
        return zielseiten.map(zielseite => getPageNormObject(app, dv, zielseite));
    }

    ////
    // ZIELSEITEN AUSWERTEN UND NEUE WERTE ERSTELLEN
    function neueWerteAusZielseite(app, dv, zielseite) {

        // Gibt zwei Arrays zurück: 
        // EDITIERBAR: NormSeite für jeden gültigen `ist`-Wert
        // NICHT EDITIERBAR: Info-String für jeden nicht gültigen `ist`-Wert
        const istWerte = seiteIstWerteCheck(app, dv, zielseite);

        let istWerteNeu = null;

        // Anzahl NICHT EDITIERBAR
        const nichtEditierbarAnzahl = istWerte.nichtEditierbar.length;
        const editierbarCheck = nichtEditierbarAnzahl === 0;

        ////
        // EDITIERBARE `ist`-Werte
        if (editierbarCheck) {

            istWerteNeu = istWerte.editierbar.map(istWert => {
                return neueInhIstWerte(app, dv, istWert);
            })
        }

        // ZIELSEITEN NEU
        return {
            zielseite,    // NormSeite Zielseite
            istWerteNeu,
            istWerteNEditierbar: istWerte.nichtEditierbar
        }
    }

    ////
    // HTML-ELEMENTE BAUEN

    // Überschriften / Container
	const featureHeader = contentEl.createEl("h2", { 
		text: "p-Seiten Editor" 
	});

    const menuHeader = contentEl.createEl("h4");
	const infoBox = contentEl.createEl("div");
	const mainBox = contentEl.createEl("div");

    // Tabelle
    const ergTabHeader = [
        "Link",
        "editierbare ist-Werte",	
        "ersetzen",
    ];

    const ergTabelle = tableMakerReiheHd(mainBox, ergTabHeader);
    const cellsNr = ergTabHeader.length;
    const btnCells = tableMakerReihe(ergTabelle, cellsNr);

    ////
    // ALLE EDITIEREN-BTN
    const alleBtn = btnCells[cellsNr-1].createEl("button", { text: "Alle ersetzen"});

    ////
    // ZIELSEITEN DARSTELLEN
    function renderZielseiten(obsClsObj, app, dv, ergTabelle, cellsNr) {
        
        // Suche
        const zielseitenNorm = getZielseiten(app, dv);

        // Ergebnisse auswerten / darstellen
        zielseitenNorm.forEach(zielseiteNorm => {
            
            // Auswerten, neue Werte, auslesen
            const zielseiteAltZuNeu = neueWerteAusZielseite(app, dv, zielseiteNorm);
            const { zielseite, istWerteNeu, istWerteNEditierbar } = zielseiteAltZuNeu;

            // Cell 1: Zielseite Link
			const cells = tableMakerReihe(ergTabelle, cellsNr);
			const cell0Box = cells[0].createEl("div");
            const cell1Box = cells[1].createEl("div");
            const cell2Box = cells[2].createEl("div");
            placeHoverLinkOnEl(obsClsObj, cell0Box, zielseite, zielseite.name);

            if (!istWerteNeu) {
                cell0Box.createEl("p", {
					text: `enthält ${istWerteNEditierbar.length}
                        nicht editierbare Seite${istWerteNEditierbar.length > 1 
                            ? "n" : ""}:`
				});
                istWerteNEditierbar.forEach(istWertNE => {
                    cell0Box.createEl("div", {
                        text: `- ${istWertNE.name}: ${istWertNE.info}`
                    });
                })
            }

            if (!!istWerteNeu) {
                istWerteNeu.forEach(istWertNeu => {
                    cell1Box.createEl("p", { text: `Der Wert
                        ${istWertNeu.istSeiteAlt.name} wird ersetzt durch` });
                    
                    cell1Box.createEl("div", { text: `klasse: ${inhaltSeite?.name}`});
                    cell1Box.createEl("div", { text: `typ: ${istWertNeu.typSeite?.name}`});
                    cell1Box.createEl("div", { text: `art: ${istWertNeu.artSeite?.name}`});
                    cell1Box.createEl("div", { text: `pstatus: ${pStatusSeite?.name}`});
                });

                // btn
                const btn = cell2Box.createEl("button", { text: "ersetzen" });
                btn.addEventListener("click", async () => {

                    cell2Box.empty();

                    const typSet = new Set();
                    istWerteNeu.forEach(istWertNeu => 
                        typSet.add(istWertNeu.typSeite.wikiLink)
                    );
                    const artArr = istWerteNeu.map(istWertNeu => {
                        const istInhaltCheck = istWertNeu.artSeite.name 
                            === inhaltSeite.name;
                        if (istInhaltCheck)
                            return null;
                        else return istWertNeu.artSeite.wikiLink;
                    }).filter(Boolean);
                    
                    await updateFrontmatter(app, zielseiteNorm, fm => {
                        setField(fm, "klasse", [inhaltSeite.wikiLink]);
						setField(fm, "typ", [...typSet]);
                        if (artArr.length > 0)
                          setField(fm, "art", artArr);
						setField(fm, "pstatus", [pStatusSeite.wikiLink]);
						removeField(fm, "ist");
                    });

                    setTimeout(() => {
                        cell2Box.textContent = "Werte ersetzt"
                    }, 200);
                })
            }

        })
    }

    renderZielseiten(obsClsObj, app, dv, ergTabelle, cellsNr);


}