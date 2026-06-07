
//// 
// IMPORT                           // FROM

import { dvQueryInh }   from "../../shared/services/queries/entityService.js";
import { getDateTimeID } 			from "../../shared/utils/dateTimeUtils.js";
import { updateEntireFrontmatter } from "../../shared/services/metadata/metaWriteService.js";

import { placeHoverLinkOnEl }       from "../../shared/services/uiServices/uiLinkService.js";

import { dvLinkSuche } 				from "../../shared/services/queries/queryService.js";
import { getPageNormObject } from "../../shared/services/pagesAndLinks/pageNormService.js";


/**
 * 
 */

export function bulkEditorTest(view) {
    
    const { app, dv, contentEl } = view;
    
    // Überschrift
    contentEl.createEl("h2", { text: "p-Seiten Editor" });
    const menuHeader = contentEl.createEl("h4");

    const mainBox = contentEl.createEl("div");
    
    // Ergebnisse darstellen
    const renderErgebnisse = () => {

        mainBox.empty();

        // Suche Inhalt, Status P
        const dbPagesP = dvLinkSuche(dv, ["Inhalt", "Status _ p"], ["ist"], 0, true)
            .map(p => getPageNormObject(app, dv, p));

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
            const btnCell = tabReiheButtons.createEl("td", { 
                cls: "opmn-table-cell-hd" 
            });
            return btnCell;
        });

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
                    else if (linkOhnePOhneTypArrLength > 2) neuerParentPath += `${t}`;
                }					
                else { 
                    neueSeitePath += `${t}`;
                }
            });

            const neuerLinkObj = getPageNormObject(app, dv, neueSeitePath);
            const neuerParentObj = getPageNormObject(app, dv, neuerParentPath);

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
                    const newPageObj = getPageNormObject(app, dv, neueSeitePath);
                    updateEntireFrontmatter(app, newPageObj.tFile, metaObj);
                    placeHoverLinkOnEl(view, neueSeiteBox, newPageObj, newPageObj.name);
                })
            }

            // ist-Typ
            const isttypStr = p.path.split(" _ ")[1]
                ?.replace(" (p)", "")?.replace(".md", ""); 

            const isttypLinkStr = `Inhalt _ ${isttypStr}`;
            const isttypLinkObj = getPageNormObject(app, dv, isttypLinkStr);
            
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
            const statPObj = getPageNormObject(app, dv, "Status _ p.md");
            placeHoverLinkOnEl(view, statusPBox, statPObj, statPObj.name);

            // CELL 3: Link ohne p Link
            const ersetzenBtnCell = ergTabReihe.createEl("td", { cls: "opmn-table-cell" });
            
            if (neuerLinkObj.exists) {
                const ersetzenBtn = ersetzenBtnCell.createEl("button", { 
                    text: "ersetzen"
                });
                ersetzenBtn.addEventListener("click", () => {
                                // p = 
                    renderErsetzenMenu(p, neuerLinkObj);
                })
            }

        });
    }

                        // ausgangsseite z.B. 
    const renderErsetzenMenu = (sAlt, sNeu) => {
        // MainBox und Überschrift
        mainBox.empty();
        menuHeader.textContent = sAlt.name;

        // Wenn keine Seite, zurück zum Suchmenü
        if (!sAlt.exists) {
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
        const sMitLinkZuSAltTabelle = mainBox.createEl("table");
        const zielPagesReiheHd = sMitLinkZuSAltTabelle.createEl("tr", { cls: "" });
        const zielPagesTabHeader = [
            `Seiten, die zu ${sAlt.name} linken`,
            "ist aktuell",
            "ist neu"
        ];

        zielPagesTabHeader.forEach(h => {
            zielPagesReiheHd.createEl("th", { 
                text: h, cls: "opmn-table-cell-hd" 
            });
        });


        // Zielpage: Pages mit pageNorm in `ist`
        const sMitLinkZuSAlt = dvLinkSuche(dv, [sAlt.path], ["ist"], 0, true)
            .map(p => getPageNormObject(app, dv, p));

        sMitLinkZuSAlt.forEach(p => {
            
            const sMitLinkZuSAltReihe = sMitLinkZuSAltTabelle.createEl("tr");

            // CELL 1: Zielpage Link
            const sMitLinkZuSAltCell = sMitLinkZuSAltReihe.createEl("td", { cls: "opmn-table-cell" });
            placeHoverLinkOnEl(view, sMitLinkZuSAltCell, p);

            // Zielpage ist-Array: Ausgangsseite-Path alt getauscht gegen neu
            const sMitLinkZuSAltFeldIst = (Array.isArray(p.dvPage.ist) 
                ? p.dvPage.ist : [p.dvPage.ist])
                .map(val => getPageNormObject(app, dv, val.path));
            
            const sMitLinkZuPAltFeldIstNeu = [...sMitLinkZuSAltFeldIst]
                .filter(val => val.path !== sAlt.path);

            sMitLinkZuPAltFeldIstNeu.push(sNeu);

            // CELL 2: Zielpage ist-Array mit neuem (und ggf. verbleibenden alten Werten)
            const istValCell = sMitLinkZuSAltReihe.createEl("td", { cls: "opmn-table-cell" });
            
            sMitLinkZuSAltFeldIst.forEach(istVal => {
                const valPath = istVal.path;
                
                const istValBox = istValCell.createEl("div", {
                    text: valPath
                });
            })

            // CELL 3: Zielpage ist-Array mit neuem (und ggf. verbleibenden alten Werten)
            const istValNeuCell = sMitLinkZuSAltReihe.createEl("td", { cls: "opmn-table-cell" });
            
            sMitLinkZuPAltFeldIstNeu.forEach(istVal => {
                const valPath = istVal.path;
                
                const istValBox = istValNeuCell.createEl("div", {
                    text: valPath
                });
            })

        })
    }

    renderErgebnisse();
    
}

