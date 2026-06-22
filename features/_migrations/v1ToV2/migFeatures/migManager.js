
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
import { zielseiteIstCheck, zSeiteIstCheckNeu }    from "../migServices/feldIstCheck.js";

import { dvDefsLinkSuche, 
         dvInstsLinkSuche }     from "../migServices/v1QueryService.js";


//// Erst mal nur behindert paar Sachen rausfinden / ausprobieren

/**
 * 
 */

export async function migManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const mmState = {
        auswKl: null,
        defOInst: null
    }
    
    const els = uiMaker(contentEl, {
        /* name         [parent, typ, text] */
        // main
        mainCon:        [],
        mainHeader:     ["mainCon", "h4", "Migrations-Manager"],

        // info
        infoBox:        ["mainCon",, "Feld ist bearbeiten"],
        infoBr1:        ["mainCon", "br"],

        // UI
        uiCon:          ["mainCon","", ""],
        defOInstHeader: ["uiCon", "h5", "Definitionen oder Instanzen suchen"],
        defOInstBtn:    ["uiCon","button","Def"],
        uiConBr1:       ["uiCon", "br"],
        uiConBr2:       ["uiCon", "br"],
        klsAuswInfo:    ["uiCon", "", "Klasse auswählen"],
        uiConBr3:       ["uiCon", "br"],
        klsBtnsBox:     ["uiCon"],

        // ergebnisse
        ergHeader:      ["mainCon", "h5"],
        ergCon:         ["mainCon"]
    });

    const ergTabArr = [ "Seite", "ist", "neueWerte" ];
    
    els.defOInstBtn.addEventListener("click", () => {
        mmState.defOInst = mmState.defOInst ? false : true;
        els.defOInstBtn.textContent = mmState.defOInst ? "Inst" : "Def";
        if (!!mmState.auswKl) renderRootErg(mmState.auswKl);
    })

    Object.keys(ONT_ROOTKL).forEach(rootKl => {
        const btn = els.klsBtnsBox.createEl("button", {text: rootKl});
        btn.addEventListener("click", () => {
            mmState.auswKl = rootKl;
            renderRootErg(mmState.auswKl)
        })
    })

    function renderRootErg(rootKl) {

        const rootKlNormSeite = getPageNormObject(app, dv, rootKl);
        
        els.klsAuswInfo.empty();
        els.defOInstHeader.textContent = 
            `${rootKl}: ${mmState.defOInst ? "Instanzen" : "Definitionen"}`;
        
        let ergebnisse = [];
        if (mmState.defOInst) ergebnisse = dvInstsLinkSuche(dv, rootKl);
        else ergebnisse = dvDefsLinkSuche(dv, rootKl);

        els.ergHeader.textContent = `${ergebnisse.length} Seiten`

        els.ergCon.empty();
        let ergebnisTabelle;
        if (ergebnisse.length > 0) {
            ergebnisTabelle = tableMakerReiheHd(els.ergCon, ergTabArr);
        }

        ergebnisse.forEach(erg => {
            const cells = tableMakerReihe(ergebnisTabelle, ergTabArr.length);
            const norm = getPageNormObject(app, dv, erg);

            placeHoverLinkOnEl(obsClsObj, cells[0], norm, norm.path);
            
            const neuObj = zSeiteIstCheckNeu(app, dv, norm, mmState.auswKl, mmState.defOInst);



            /*
            Object.keys(neuObj).forEach(key => {
                const zsFeldIst = neuObj[key]["ist"];
                Object.keys(zsFeldIst).forEach(zsIstkey => {
                    cells[1].createEl("div", {text: zsIstkey})
                })

            })
            */
       





















            /*
            const feldIst = einzelnesFeldLesen(app, norm, "ist");
            const feldIstArr = Array.isArray(feldIst) ? feldIst : [feldIst];
            cells[1].textContent = feldIstArr;

            const neueWerteObj = zielseiteIstCheck(app, dv, norm, rootKl);
            const neuEls = uiMaker(cells[2], {
                klInfo:      [,,"Klasse"],   klBox:      [], klaBr: [,"br"],
                typInfo:     [,,"Typ"],      typBox:     [], typBr: [,"br"],
                artInfo:     [,,"Art"],      artBox:     [], artBr: [,"br"],
                pstatusInfo: [,,"p-Status"], pstatusBox: [], pstBr: [,"br"],
                warnungInfo: [,,"Warnungen"],warnungBox: [], warBr: [,"br"],
                neInfo:      [,,"nicht editierbar"],neBox:[],nedBr: [,"br"],
            });

            neuEls.klBox.textContent = rootKlNormSeite.wikiLink;
            neuEls.typBox.textContent = String(neueWerteObj.typ);
            neuEls.artBox.textContent = String(neueWerteObj.art);
            neuEls.pstatusBox.textContent = String(neueWerteObj.pstatus);
            
            if (neueWerteObj.warnungen) {
                neuEls.warnungBox.textContent = String(neueWerteObj.warnungen);
            } else {
                neuEls.warnungInfo.style.display = "none";
                neuEls.warBr.style.display = "none";
            }
            if (neueWerteObj.nichtEditierbar) {
                neuEls.neBox.textContent = String(neueWerteObj.nichtEditierbar);
            } else {
                neuEls.neInfo.style.display = "none";
                neuEls.nedBr.style.display = "none";
            }
            
            */

                
            
        })
    }
        
  

    
}

