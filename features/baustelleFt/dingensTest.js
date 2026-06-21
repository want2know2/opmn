
//// 
// IMPORT                       // FROM

import { idAltzuNeu } from "../_migrations/v1ToV2/migServices/idService.js";
import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../shared/services/dataService/metaReadService.js";
import { getOrCreatePage, 
         setField,
         updateFrontmatter }    from "../../shared/services/dataService/metaWriteService.js";
import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvQueryEre, dvQueryInh, dvQueryKat, dvQueryThe } from "../../shared/services/queries/entityService.js";
import { dvLinkSuche }          from "../../shared/services/queries/queryService.js";
import { placeHoverLinkOnEl }   from "../../shared/services/ui/uiLinkService.js";
import { tableMakerReihe, tableMakerReiheHd } from "../../shared/services/ui/uiService.js";
import { generateUniqueIdNeu }   from "../../shared/utils/dateTimeUtils.js";
import { toStringValue }        from "../../shared/utils/valueUtils.js";


/**
 * 
 */

export function iwasServiceTestDingens(obsClsObj) {
    
    const { app, dv, contentEl } = obsClsObj;

    ////
    // 
    
    const migManState = {
        schrittAktiv: 0
    };

    //

    const migManInfos = [
        // Schritt 1:
        {
            topHeader: "Migrations-Manager: Klasse Inhalt",
            topInfoBox: "Schritt 1.1: Inhalt: Instanzen"
        }
    ];
    
    //

    const klssObj = {
            inh: {
                path: "Inhalt.md",
                query: dvQueryInh
            },
            kat: {
                path: "Kategorie.md",
                query: dvQueryKat
            },
            the: {
                path: "Thema.md",
                query: dvQueryThe
            },
            ere: {
                path: "Ereignis.md",
                query: dvQueryEre
            }
        };
    
    
    ////
    // HTML FÜR UI

    const mainContainer = contentEl.createEl("div");
    const topContainer = mainContainer.createEl("div");
    const topHeader = topContainer.createEl("h4");
    const topInfoBox = topContainer.createEl("div");
    topContainer.createEl("br");
    const topUIBox = topContainer.createEl("div");

    const ergContainer = mainContainer.createEl("div");
    const ergTabelleHdArr = ["Seite", "Optionen"];
    
    topHeader.textContent = migManInfos[migManState.schrittAktiv].topHeader;
    topInfoBox.textContent = migManInfos[migManState.schrittAktiv].topInfoBox;

    const ergTabelle = tableMakerReiheHd(ergContainer, ergTabelleHdArr);
    
}


/**
 * DISTINCT IST VALUES
 */

export function distinctIstValues(obsClsObj) {
    
    const { app, dv, contentEl } = obsClsObj;
    
    const mainContainer = contentEl.createEl("div");
    
    const alleSeiten = app.vault.getMarkdownFiles()
        .map(tf => getPageNormObject(app, dv, tf));
    
    const alleIstWerteObj = { normLinks : {}, undefLinks: {} };   

    alleSeiten.forEach(p => {
        
        const feldIst = einzelnesFeldLesen(app, p, "ist");
        const istArr = Array.isArray(feldIst)
            ? feldIst : [feldIst];
        const istPNExistArr = [];
        const istPExistsArr = [...istArr]
            .map(istVal => {
                const link = resolveLinkPath(app, istVal)
                const norm = getPageNormObject(app, dv, link);
                if (norm.exists) return norm;
                else istPNExistArr.push(istVal); // if (typeof istVal === "string") 
                return null;
            }).filter(Boolean);
        
        
        istPExistsArr.forEach(norm => {
            const normPath = norm.path;
            if (isNaN(alleIstWerteObj.normLinks[normPath]?.anz)) {
                alleIstWerteObj.normLinks[normPath] = {};
                alleIstWerteObj.normLinks[normPath].anz = 1;
                alleIstWerteObj.normLinks[normPath].seiten = [];
                alleIstWerteObj.normLinks[normPath].seiten.push(p.path);
            } else { 
                alleIstWerteObj.normLinks[normPath].anz += 1;
                alleIstWerteObj.normLinks[normPath].seiten.push(p.path);
            }
        })
        
        istPNExistArr.forEach(istVal => {
            const textVal = String(istVal).split("|")[0].replace("[[", "").replace("]]", "");
           
            if (isNaN(alleIstWerteObj.undefLinks[textVal]?.anz)) {
                alleIstWerteObj.undefLinks[textVal] = {}
                alleIstWerteObj.undefLinks[textVal].anz = 1;
                alleIstWerteObj.undefLinks[textVal].seiten = [];
                alleIstWerteObj.undefLinks[textVal].seiten.push(p.path);
            }
            else {
                alleIstWerteObj.undefLinks[textVal].anz += 1;
                alleIstWerteObj.undefLinks[textVal].seiten.push(p.path);
            }
        })
    })

    const { normLinks, undefLinks } = alleIstWerteObj;
    
    mainContainer.createEl("h4", {text: "Gültige ist-Werte (existierende Links)"})
    //mainContainer.createEl("div", {text: JSON.stringify(alleIstWerteObj.normLink, null, 2)})
    const normInfoBox = mainContainer.createEl("div");
    mainContainer.createEl("br");
    
    let normInSeitenAnz = 0;

    const normTabHdArr = ["ist-Wert", "in Seiten"];
    const normTab = tableMakerReiheHd(mainContainer, normTabHdArr);

    Object.keys(normLinks).forEach(istSKey => {
        const normState = { zeigen: true }
        
        const istSNorm = getPageNormObject(app, dv, istSKey);

        normInSeitenAnz += normLinks[istSKey].anz;
        const cells = tableMakerReihe(normTab, normTabHdArr.length);
        const istSBox = cells[0].createEl("b");
        placeHoverLinkOnEl(obsClsObj, istSBox, istSNorm, istSNorm.path);
        const sBtn = cells[1].createEl("button", {text: "+"});
        const sCon = cells[1].createEl("div");
        
        sCon.textContent = `${normLinks[istSKey].anz} Seiten`
        sBtn.addEventListener("click", () => {
            sCon.empty();
            normState.zeigen = !normState.zeigen;
            if (!!normState.zeigen) {
                sCon.textContent = `${normLinks[istSKey].anz} Seiten`;
                sBtn.textContent = "+";
            } else {
                normLinks[istSKey].seiten.forEach((path, i) => {
                    const normS = getPageNormObject(app, dv, path);
                    const sBox = sCon.createEl("div", {text: `${i+1}. `});
                    placeHoverLinkOnEl(obsClsObj, sBox, normS, normS.path);
                    sBtn.textContent = "-";
                })
            }
        })


    })
    normInfoBox.textContent = 
        `${Object.keys(normLinks).length} ist-Werte in ${normInSeitenAnz} Seiten`
    

    mainContainer.createEl("br")
    mainContainer.createEl("h4", {text: "Undefined"})
    const undefInfoBox = mainContainer.createEl("div", {
        text: "Seite hat kein ist-Feld, ist-Wert kein gültiger Link usw."
    });
    mainContainer.createEl("br");

    mainContainer.createEl("div", {text: JSON.stringify(undefLinks, null, 2)})
    
    
}

