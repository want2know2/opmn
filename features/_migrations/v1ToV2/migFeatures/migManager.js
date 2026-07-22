
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

import { ONT_ROOTKL }           from "../migReg/migReg.js";

import { zielSeiteIstCheck }    from "../migServices/feldIstCheck.js";
import { zielSeiteIstCheckTest } from "../migServices/feldIstCheckTest.js";
import { zielSeiteIstCheckTest2 } from "../migServices/feldIstCheckTest2.js";
import { zielSeiteIstCheckTest3 } from "../migServices/feldIstCheckTest3.js";
import { zielSeiteIstCheckTest4 } from "../migServices/feldIstCheckTest4.js";
import { zielSeiteIstCheckTest5 } from "../migServices/feldIstCheckTest5.js";

import { v1DvDefsLinkSuche, 
         v1DvInstsLinkSuche }   from "../migServices/v1QueryService.js";


//// Erst mal nur behindert paar Sachen rausfinden / ausprobieren

/**
 * 
 */

export async function migManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const mmState = {
        auswKl: null,
        instODef: null
    }
    
    const els = uiMaker(contentEl, {
        /* name         optional: [parent, typ, text] */
        // main
        mainCon:        [],
        mainHeader:     ["mainCon", "h4", "Migrations-Manager"],

        // info
        infoBox:        ["mainCon",, "Feld ist bearbeiten"],
        infoBr1:        ["mainCon", "br"],

        // UI
        uiCon:          ["mainCon"],
        defOInstHeader: ["uiCon", "h5", "Definitionen oder Instanzen suchen"],
        defOInstBtn:    ["uiCon","button","Def"],
        uiConBr1:       ["uiCon", "br"],
        uiConBr2:       ["uiCon", "br"],
        klsAuswInfo:    ["uiCon", "", "Klasse auswählen"],
        uiConBr3:       ["uiCon", "br"],
        rootKlBtnsBox:  ["uiCon"],

        // ergebnisse
        ergHeader:      ["mainCon", "h5"],
        ergCon:         ["mainCon"]
    });

    const ergTabArr = [ "Nr", "Seite", "Werte i.A.", "info" ];
    
    els.defOInstBtn.addEventListener("click", () => {
        mmState.instODef = mmState.instODef ? false : true;
        els.defOInstBtn.textContent = mmState.instODef ? "Inst" : "Def";
        
        if (!!mmState.auswKl) renderRootErg(mmState.auswKl);
    })

    Object.keys(ONT_ROOTKL).forEach(rootKlKey => {
        const btn = els.rootKlBtnsBox.createEl("button", {text: rootKlKey});
        btn.addEventListener("click", () => {
            mmState.auswKl = rootKlKey;
            renderRootErg(mmState.auswKl)
        })
    })

    function renderRootErg(rootKlKey) {

        const rootKlNormSeite = getPageNormObject(app, dv, rootKlKey);
        
        els.klsAuswInfo.empty();
        els.defOInstHeader.textContent = 
            `${rootKlKey}: ${mmState.instODef ? "Instanzen" : "Definitionen"}`;
        
        let ergebnisse = [];
        
        if (mmState.instODef) ergebnisse = v1DvInstsLinkSuche(dv, rootKlKey);
        else ergebnisse = v1DvDefsLinkSuche(dv, rootKlKey);
        
        els.ergHeader.textContent = `${ergebnisse.length} Seiten`

        els.ergCon.empty();
        let ergebnisTabelle;
        if (ergebnisse.length > 0) {
            ergebnisTabelle = tableMakerReiheHd(els.ergCon, ergTabArr);
        }

        const zielseiteInkl = !mmState.instODef
            || (!ONT_ROOTKL[rootKlKey].instances && !ONT_ROOTKL[rootKlKey].definitions);

        const typVorhanden = Object.keys(ONT_ROOTKL[rootKlKey].felder).includes("typ");

        const istObjInfos = {
            infos: {
                rootKlKey,
                instODef: mmState.instODef,
                instances: ONT_ROOTKL[rootKlKey].instances,
                instByRoot: ONT_ROOTKL[rootKlKey].instByRoot,
                zielseiteInkl: zielseiteInkl ?? null,
                typVorhanden
            },
        };

        els.infoBox.empty();
        Object.entries(istObjInfos.infos).forEach(([key, val]) => {
            els.infoBox.createEl("div", {text: `${key}: ${val}`});
        })

        ergebnisse.forEach((erg, i) => {
            const cells = tableMakerReihe(ergebnisTabelle, ergTabArr.length);
            const norm = getPageNormObject(app, dv, erg);
            cells[0].createEl("span", {text: `${i+1} `})
            placeHoverLinkOnEl(obsClsObj, cells[1], norm, norm.path);
            
            const istObj = zielSeiteIstCheckTest5(app, dv, 
                norm, 
                istObjInfos
            );
            
            const { infos, istWerte, checkWerte, istMigObjs, neueWerteObj, report } = istObj;
            
            istMigObjs.forEach((migObj, i) => {
                Object.keys(migObj).forEach((key, idx) => {
                    if (idx === 0) 
                        cells[2].createEl("h6", {text: `${key}: ${migObj[key]}`});
                    else if (key !== "neueWerteObj") 
                        cells[2].createEl("div", {text: `${key}: ${migObj[key]}`});
                    else {
                        const { neueWerteObj } = migObj;
                        const { erstellt } = neueWerteObj;
                        if (erstellt) {
                            cells[2].createEl("b", {text: `${key}:`});
                            cells[2].createEl("br");
                            const neuArr = ["erster", "letzter", "vorletzter"]
                                .filter(keyStr => neueWerteObj[keyStr].erstellt)
                                
                            neuArr.forEach((keyStr, i) => {
                                const neuObj = neueWerteObj[keyStr]
                                if (!neuObj.fehler) 
                                    cells[2].createEl("div", {text: `${keyStr} ohne Fehler erstellt: ${neuObj.path}`});
                                else {
                                    const box = cells[2].createEl("div");
                                    box.createEl("mark", {text: `${keyStr}: ${neuObj.fehler}`});
                                }
                                
                                Object.keys(neuObj).forEach((key, idx) => {
                                    if (idx === 0) {
                                        const box = cells[2].createEl("div");
                                        box.createEl("b", {text: `${key}: ${neuObj[key]}`});
                                    }
                                    else 
                                        cells[2].createEl("div", {text: `${key}: ${neuObj[key]}`});
                                })
                                
                            
                                
                            })
                        }
                    }

                })
                if (i < istObj.istMigObjs.length-1) cells[2].createEl("br")
                
            })
            
            /*
            checkWerte.forEach(key => {
                
                cells[3].createEl("div", {text: `${key}: ${checkWerte[key]}`});

                
                
            })
            */


            

        })
    }
}


