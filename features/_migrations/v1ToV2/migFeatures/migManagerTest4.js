
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
import { GET_MIG_REGELN } from "../migReg/migReg.js";
import { istMigDiscovery1 } from "../migServices/istMigDiscovery1.js";







//// Erst mal nur behindert paar Sachen rausfinden / ausprobieren

/**
 * 
 */

export async function migManagerTest4(obsClsObj) {

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
        migKlBtnsBox:   ["uiCon"],

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
        
        if (!!migManager.migRootKl) istMigDiscoveryErgebnisse(app, dv, MIG_REGELN, migManager.migRootKl, migManager.instODef);
        
    })

    const MIG_REGELN = GET_MIG_REGELN();

    Object.keys(MIG_REGELN).forEach(migRootKl => {
        const btn = els.migKlBtnsBox.createEl("button", {text: migRootKl});
        btn.addEventListener("click", () => {
            
            migManager.migRootKl = migRootKl;
            istMigDiscoveryErgebnisse(app, dv, MIG_REGELN, migManager.migRootKl, migManager.instODef);
        })
        
    });

    function istMigDiscoveryErgebnisse(app, dv, MIG_REGELN, migRootKl, instODef) {

        els.infoBox.empty();

        els.defOInstHeader.textContent = "n/a";
        els.klsAuswInfo.empty();
        
        els.ergHeader.textContent = "";
        els.ergCon.empty();
        
        const istMigDiscoveryErgebnisse = istMigDiscovery1(app, dv, MIG_REGELN, migRootKl, instODef);
        
    }
}

