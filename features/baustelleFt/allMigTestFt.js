
////
// IMPORT                       // FROM

import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService";
import { dvQueryEre,
         dvQueryInh,
         dvQueryKat,
         dvQueryThe }           from "../../shared/services/queries/entityService";
import { dvLinkSuche }          from "../../shared/services/queries/queryService";


/**
 * 
 */

export function alleMigTestFt(obsClsObj) {
    
    const { app, dv, contentEl } = obsClsObj;

    const migFtObj = {
        seitenAuswahl: null
    };

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

    const mainContainer = contentEl.createEl("div");
    const infoBox = contentEl.createEl("div");
    const btnBox = mainContainer.createEl("div");
    const ergBox = mainContainer.createEl("div");
    Object.keys(klssObj).forEach(klssKey => {
        const btn = btnBox.createEl("button", {text: klssObj[klssKey].path});
        btn.addEventListener("click", () => {
            const erg = getDefSeiten(app, dv, klssObj[klssKey]);
            seitenDarstellen(app, dv, erg, ergBox);
        })
    })

    function getDefSeiten(app, dv, klOb) {
        const seitenArr = (klOb.query(dv) ?? [])
            .map(defPath => getPageNormObject(app, dv, defPath))
            .filter(p => p.exists);
        if (seitenArr.length > 0) return seitenArr;
        else return [klOb.path]
            .map(defPath => getPageNormObject(app, dv, defPath));
    }

    function getInstSeiten(app, dv, dvQuery) {
        const defSeiten = dvQuery(dv) ?? [];
        return (dvLinkSuche(dv, defSeiten, ["ist"], 0, false) ?? [])
            .map(defPath => getPageNormObject(app, dv, defPath));
    }

    function seitenDarstellen(app, dv, seiten, conEl) {
       conEl.empty();
       seiten.forEach(p => conEl.createEl("div", {text: p.name})) 
    }
    // const testErg = getDefSeiten(app, dv, defObj.inh);
    // testErg.forEach(p => contentEl.createEl("div", {text: p}))
}

