
////
// IMPORT                       // FROM

import { readRegJSON, 
         writeRegJSON }         from "../../../../shared/services/dataService/jsonReadAndWrite.js";

import { einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";
import { placeHoverLinkOnEl }   from "../../../../shared/services/ui/uiLinkService.js";

import { tableMakerReihe, 
         tableMakerReiheHd, 
         uiMaker }              from "../../../../shared/services/ui/uiService.js";

import { GET_MIG_REGELN, ONT_ROOTKL }           from "../migReg/migReg.js";

import { zielSeiteIstCheck }    from "../migServices/feldIstCheck.js";
import { zielSeiteIstCheckTest } from "../migServices/feldIstCheckTest.js";
import { zielSeiteIstCheckTest2 } from "../migServices/feldIstCheckTest2.js";
import { zielSeiteIstCheckTest3 } from "../migServices/feldIstCheckTest3.js";
import { zielSeiteIstCheckTest4 } from "../migServices/feldIstCheckTest4.js";
import { zielSeiteIstCheckTest5 } from "../migServices/feldIstCheckTest5.js";
import { zielSeiteIstCheckTest6 } from "../migServices/feldIstCheckTest6.js";

import { queryMigInstsODefs, 
         v1DvDefsLinkSuche, 
         v1DvInstsLinkSuche }   from "../migServices/v1QueryService.js";


//// Erst mal nur behindert paar Sachen rausfinden / ausprobieren

/**
 * 
 */

export async function migManagerTest2(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const migManager = {
        migRootKl: null,
        instODef: "migDef"
    }
    
    const els = uiMaker(contentEl, {
        /* name         optional: [parent, typ, text] */
        // main
        mainCon:        [],
        mainHeader:     ["mainCon", "h4", "Migrations-Manager"],

        // UI
        uiCon:          ["mainCon"],
        defOInstHeader: ["uiCon", "h5", "Mig-Definitionen / Mig-Instanzen suchen"],
        defOInstBtn:    ["uiCon","button","Mig-Def"],
        uiConBr1:       ["uiCon", "br"],
        //uiConBr2:       ["uiCon", "br"],
        klsAuswInfo:    ["uiCon", "", "Mig-Klasse auswählen"],
        uiConBr3:       ["uiCon", "br"],
        migKlBtnsBox:  ["uiCon"],

        // info
        infoBr1:        ["mainCon", "br"],
        infoBox:        ["mainCon",, "Feld ist bearbeiten"],
        infoBr2:        ["mainCon", "br"],

        // ergebnisse
        ergHeader:      ["mainCon", "h5"],
        ergCon:         ["mainCon"]
    });

    els.infoBox.style.height = "50px";
    const ergTabArr = [ "Nr", "Seite", "Werte i.A.", "info" ];
    
    els.defOInstBtn.addEventListener("click", () => {

        migManager.instODef = migManager.instODef === "migInst" ? "migDef" : "migInst";
        els.defOInstBtn.textContent = migManager.instODef === "migInst" ? "Mig-Inst" : "Mig-Def";
        
        if (!!migManager.migRootKl) renderMigRootKlErgebnisse(migManager.migRootKl);
        
    })

    const MIG_ANWEISUNGEN = GET_MIG_REGELN();

    Object.keys(MIG_ANWEISUNGEN).forEach(migRootKl => {
        const btn = els.migKlBtnsBox.createEl("button", {text: migRootKl});
        btn.addEventListener("click", () => {
            
            migManager.migRootKl = migRootKl;
            renderMigRootKlErgebnisse(migManager.migRootKl)
        })
        
    });

    function renderMigRootKlErgebnisse(migRootKl) {

        els.infoBox.empty();

        els.defOInstHeader.textContent = "n/a";
        els.klsAuswInfo.empty();
        
        els.ergHeader.textContent = "";
        els.ergCon.empty();

        
        
        const MIG_RENDER_ANWEISUNGEN = MIG_ANWEISUNGEN[migRootKl][migManager.instODef];
        if (!MIG_RENDER_ANWEISUNGEN.felderByWert) {
            els.infoBox.textContent = `
                Keine Ausgangsseiten für ${migRootKl}: ${migManager.instODef === "migInst" ? "Mig-Instanzen" : "Mig-Definitionen"}`;
                return;
        }

        MIG_RENDER_ANWEISUNGEN.erlaubteTypen = MIG_ANWEISUNGEN[migRootKl].erlaubteTypen;

        
        els.infoBox.createEl("div", {text: JSON.stringify(MIG_RENDER_ANWEISUNGEN)});
        els.infoBox.createEl("div", {text: MIG_RENDER_ANWEISUNGEN.erlaubteTypen});
        
        const migRootKlNorm = getPageNormObject(app, dv, migRootKl);
        

        els.defOInstHeader.textContent = 
            `${migRootKl}: ${migManager.instODef === "migInst" ? "Mig-Instanzen" : "Mig-Definitionen"}`;
        
        
        const ergebnisse = queryMigInstsODefs(dv, migRootKl, MIG_RENDER_ANWEISUNGEN.ziel);
        
        els.ergHeader.textContent = `${ergebnisse.length} Ausgangsseiten`

        let ergebnisTabelle;
        if (ergebnisse.length > 0) {
            ergebnisTabelle = tableMakerReiheHd(els.ergCon, ergTabArr);
        }
        
        ergebnisse.forEach((erg, i) => {
            const cells = tableMakerReihe(ergebnisTabelle, ergTabArr.length);
            const norm = getPageNormObject(app, dv, erg);
            cells[0].createEl("span", {text: `${i+1} `})
            placeHoverLinkOnEl(obsClsObj, cells[1], norm, norm.path);

            const migObj = zielSeiteIstCheckTest6(app, dv, norm, migRootKl, MIG_RENDER_ANWEISUNGEN);

            const {ausgangswerte, neueWerte} = migObj;

            const { checkWerteAnalysieren } = ausgangswerte;

            
            checkWerteAnalysieren.forEach(obj => {
                
                Object.keys(obj).forEach(key => {
                    cells[2].createEl("div", {text: `${key}: ${obj[key]}`});
                });
                cells[2].createEl("br");
                Object.keys(obj.neueWertePaths).forEach(key => {
                    cells[2].createEl("div", {text: `${key}: ${obj.neueWertePaths[key]}`});
                });
                cells[2].createEl("br");
            })
            

            
            Object.keys(neueWerte.wertByFeld).forEach(key => {
                cells[3].createEl("h6", {text: `${key}`});
                    Object.keys(neueWerte.wertByFeld[key]).forEach(neuKey => {
                        cells[3].createEl("div", {text: `${neuKey}: ${neueWerte.wertByFeld[key][neuKey]}`});
                        
                    })
            })
            

        });
        
        
    }
}


