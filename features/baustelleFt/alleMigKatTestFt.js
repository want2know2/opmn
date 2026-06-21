
//// 
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../shared/services/dataService/metaReadService";
import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkService";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService";
import { dvLinkSuche }          from "../../shared/services/queries/queryService";


/**
 * 
 */

export function alleMigKatTestFt(obsClsObj) {
    
    const { app, dv, contentEl } = obsClsObj;

    // SUCHE
    // Kat-Instanzen

    const zielseiten = (dvLinkSuche(dv, ["Kategorie.md"], ["ist"], 0, false) ?? [])
        .map(zielseitePath => getPageNormObject(app, dv, zielseitePath));

    const zielseitenObj = zielseiten
        .map(zielseite => zielseiteIstCheck(app, dv, zielseite));
    
    const mainContainer = contentEl.createEl("div");
    const mainHeader = mainContainer.createEl("h4", { 
        text: "Datenmigration: Instanzen der Klasse Kategorie" 
    });
    const infoBox = mainContainer.createEl("div", {
        text: `${zielseiten.length} Seiten`
    })

    zielseitenObj.forEach(zs => {
        const zsBox = mainContainer.createEl("div")
        zsBox.createEl("h4", {text: zs.zielseite.name})
        zsBox.createEl("h6", {text: "Warnungen"})
        zsBox.createEl("div", {text: zs.warnungen})
        zsBox.createEl("li", {text: "Art: " + zs.art})
        if (zs.parent) 
            zsBox.createEl("li", {text: zs.parent })
        zsBox.createEl("br");
    })
    
    
}


function zielseiteIstCheck(app, dv, zielseite) {
    
    const zielseiteObj = {
        zielseite,
        nichtEditierbar: [],
        warnungen: [],
    }

    const katSeite = getPageNormObject(app, dv, "Kategorie.md");
    const pStatusSeite = getPageNormObject(app, dv, "p-Status.md");

    const istWertArr = einzelnesFeldLesen(app, zielseite, "ist")
        .map(istWert => resolveLinkPath(app, istWert))
        .map(istWert => getPageNormObject(app, dv, istWert))
        .map(istSeite => istSeiteChecken(app, istSeite));

    /////
    const typSet = new Set();
    const artSet = new Set();
    const parentSet = new Set();
    const pstatusSet = new Set();

    istWertArr.forEach(istObj => {
        
        typSet.add(istObj.typ);
        artSet.add(istObj.art);
        parentSet.add(istObj.parent);
        istObj.pstatus?.forEach(ps => pstatusSet.add(ps));

        if (istObj.nichtEditierbar)
            zielseiteObj.nichtEditierbar.push(istObj.nichtEditierbar);
    });
    if ([...pstatusSet].length > 1)
        zielseiteObj.nichtEditierbar.push("pStaus nicht einheitlich");

    if (zielseiteObj.nichtEditierbar.length === 0) 
        zielseiteObj.nichtEditierbar = null;

    const defArrObj = {
        typ: [...typSet],
        art: [...artSet],
        parent: [...parentSet],
        pstatus: [...pstatusSet]
    };

    Object.keys(defArrObj).forEach(defKey => {
        const newArr = defArrObj[defKey]
            .map(def => {
                const p = getPageNormObject(app, dv, def);
                if (!p.exists) {
                    if (defKey !== "parent" && defKey !== "pstatus")
                        zielseiteObj.warnungen.push(
                            `${defKey}: ${def} existiert nicht`);
                    return null;
                } else return p.wikiLink;
            }).filter(Boolean);
        
        if (newArr.length === 0) {
            zielseiteObj[defKey] = null
            if (defKey === "art")
                zielseiteObj.warnungen.push(
                    `Keine ${defKey}-Angabe vorhanden`);
        }
        else zielseiteObj[defKey] = newArr;
        
    })

    if (zielseiteObj.warnungen.length === 0) 
        zielseiteObj.warnungen = null;

    return zielseiteObj;
    /////

    function istSeiteChecken(app, istSeite) {

        let istObj = {};

        if (istSeite.path === katSeite.path) {
            // anders als bei Inhalten muss hier die zielseite
            // übergeben werden, nicht die istSeite
            istObj = neueKatWerte(zielseite, istObj);
        // wenn zielseite.ist pStatus enthält
        } else if (checkFieldArrForLink(app, istSeite, "ist", pStatusSeite)) {
            istObj.ptatus = istSeite.name
        } 
        
        return istObj
    }

    function neueKatWerte(istSeite, istObj) {
        const pathNP = istSeite.name.replace(" (p)", "");
        const pathArr = pathNP.split(" _ ");

        istObj.art = "";
        istObj.parent = "";

        pathArr.forEach((str, i) => {
            // alle bis auf den letzten str einfach hintereinandersetzen:
            // str _ str _ ...
            if (i < pathArr.length - 1) {
                istObj.art += `${str} _ `;
                // wenn der istSeite-Pfad länger als 2 ist
                // alle bis auf den vorletzten (weil parent) hintereinander:
                if (pathArr.length > 2 && i < pathArr.length - 2)
                    istObj.parent += `${str} _ `;
                // wenn istSeite-Pfad länger als 2 den vorletzten anhängen
                else if (pathArr.length > 2) istObj.parent += `${str}`;
            }
            else {
                istObj.art += `${str}`;
            }
        });

        if (istObj.art === "Kategorie") istObj.art = null;

        return istObj;
    }

    


}


