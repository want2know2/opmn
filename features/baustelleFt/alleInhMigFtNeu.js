
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvQueryInh,
         dvQueryKat }           from "../../shared/services/queries/entityService.js";
import { dvLinkSuche }          from "../../shared/services/queries/queryService.js";
import { placeHoverLinkOnEl }   from "../../shared/services/ui/uiLinkService.js";

import { tableMakerReihe, 
         tableMakerReiheHd }    from "../../shared/services/ui/uiService.js";


/**
 * 
 */

export function alleInhMigFtNeu(obsClsObj) {
    
    const { app, dv, contentEl } = obsClsObj;
    
    ////
    // SUCHE
    // Inhalt-Defs
    const sucheInh = dvQueryInh(dv) ?? [];
    
    // Instanzen: Seiten, die zu Inhalt-Defs linken
    const zielseiten = (dvLinkSuche(dv, sucheInh, ["ist"], 0, false) ?? [])
        .map(zielseitePath => getPageNormObject(app, dv, zielseitePath));

    const zielseitenObj = zielseiten.map(zs => zielseiteIstCheck(app, dv, zs));

    // Suchergebnisse filtern
    const zsOkMonoTyp = zielseitenObj
        .filter(zsObj => {
            const monoTyp = zsObj.typ?.length === 1;
            return monoTyp && !zsObj.nichtEditierbar && !zsObj.warnungen;
        });

    const zsOkMultiTyp = zielseitenObj
        .filter(zsObj => {
            const multiTyp = zsObj.typ?.length > 1;
            return multiTyp && !zsObj.nichtEditierbar && !zsObj.warnungen
        });

    const zsNichtOk = zielseitenObj
        .filter(zsObj => zsObj.nichtEditierbar || zsObj.warnungen);
    
    const mainContainer = contentEl.createEl("div");
    const mainHeader = mainContainer.createEl("h4", { 
            text: "Datenmigration: Instanzen der Klasse Inhalt" 
        });
    const btnBox = mainContainer.createEl("div");
    const ergContainer = mainContainer.createEl("div");

    // für jeden Btn: der Text, der angezeigt werden soll (text)
    // und die Suchergebnisse, die angezeigt werden sollen (zsArr)
    const btnTxtUndZSObjekteArr = [
        {text: "Mono-Typ", zsArr: zsOkMonoTyp},
        {text: "Multi-Typ", zsArr: zsOkMultiTyp},
        {text: "Mit Warnung", zsArr: zsNichtOk}
    ];
    btnTxtUndZSObjekteArr.forEach(btnUndErgObj => {
        const btn = btnBox.createEl("button", { text: btnUndErgObj.text});
        btn.addEventListener("click", () => {
            zielSeitenDarstellen(btnUndErgObj, ergContainer);
        })
    });
    
    // wenn noch keiner per Button gewählt, Mono-Typ anzeigen
    zielSeitenDarstellen(btnTxtUndZSObjekteArr[0], ergContainer);

    function zielSeitenDarstellen(btnUndErgObj, ergCon) {
        
        ////
        // HTML 
        // i. Main Container + Header + Infobox
        ergCon.empty();

        const mainInfoBox = ergCon.createEl("div", { 
            text: `${btnUndErgObj.text}: ${btnUndErgObj.zsArr.length} Instanzen`
        });
        ergCon.createEl("br");
        
        // ii. Content-Container
        const sucheInhCon = ergCon.createEl("div");

        // Tabelle + Erste Reihe + Überschriften
        const tabelleHd = [ "h1", "h2"];
        const inhTabelle = tableMakerReiheHd(sucheInhCon, tabelleHd);

        // Suchergebnisse darstellen 
        btnUndErgObj.zsArr.forEach(zsObj => {

            // Tabelle-Reihe + Cells + cellBoxen
            const cells = tableMakerReihe(inhTabelle, tabelleHd.length);
            const cell0LinkHd = cells[0].createEl("h5");
            placeHoverLinkOnEl(obsClsObj, 
                cell0LinkHd, 
                zsObj.zielseite, 
                zsObj.zielseite.name
            );
            cells[0].createEl("div", { 
                text: `> ${zsObj.zielseite.displayName}`
            })

            const box = cells[1].createEl("div");

            ["nichtEditierbar", "warnungen", "typ", "art", "pstatus"]
                .forEach(zsObjKey => {
                    const defBox = box.createEl("div", {
                        text: `${zsObj[zsObjKey] 
                            ? zsObjKey + ": " + zsObj[zsObjKey] 
                            : ""
                        }`
                    })
                })
            
        })
    }
}


/**
 * 
 */

function zielseiteIstCheck(app, dv, zielseite) {

    // für zielseite insgesamt will ich wissen:
    // ist einer der ist-Werte kein Inhalt und kein pstatus?
    //      => zielseite nichtEditierbar
    const zielseiteObj = {
        zielseite,
        nichtEditierbar: [],
        warnungen: []
    };

    // Standardseiten
    const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
    const pStatusSeite = getPageNormObject(app, dv, "p-Status.md");

    // ist-Seiten
    const istWertArr = einzelnesFeldLesen(app, zielseite, "ist")
        .map(istWert => resolveLinkPath(app, istWert))
        .map(istWert => getPageNormObject(app, dv, istWert))
        // für jede ist-Seite Objekt mit
        // nichtEditierbar oder typ, art usw. (s.u.)
        .map(istSeite => istSeiteChecken(istSeite));
    
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

    
    /**
     * 
     */

    function istSeiteChecken(istSeite) {
        
        let istObj = {};
        
        // Inhalt?
        if (checkFieldArrForLink(app, istSeite, "ist", inhaltSeite)) {
            // Wenn ja: istObj mit typ, art, parent erstellen:
            istObj = neueInhWerte(istSeite, istObj);

            // das kann eigentlich nicht sein, das wäre
            // z.B. bei istSeite = Inhalt _ Text _ Mail (p) => ist: Inhalt, p-Status...
            if (checkFieldArrForLink(app, istSeite, "ist", pStatusSeite)) {
                istObj.pstatus = [istSeite.name];
            } 
            
            // ...aber eigentlich haben wir
            // z.B. bei istSeite = Inhalt _ Text _ Mail (p) => ist: Inhalt, Status _ p,
            // daher für die ist-Seite noch mal das Feld ist checken:
            const ististSeiten = einzelnesFeldLesen(app, istSeite, "ist")
                .map(ististWert => resolveLinkPath(app, ististWert))
                .map(ististWert => getPageNormObject(app, dv, ististWert))
                .map(ististSeite => {
                    // wenn dann p-Status vorhanden ist, 
                    // ist die ististSeite z.B. Status _ p
                    if (checkFieldArrForLink(app, ististSeite, "ist", pStatusSeite))
                        return ististSeite.name;
                    return null;
                }).filter(Boolean);
            
            // Wenn unter den ististSeiten min. ein Status ist
            if (ististSeiten.length > 0) {
                // ptüfen, ob istObj.pstatus bereits vorhanden,
                // also ein Array ist, wenn ja
                // jede ististSeite in diesen Array pushen
                if (Array.isArray(istObj.pstatus)) {
                    ististSeiten.forEach(iis => istObj.pstatus.push(iis))
                // wenn istObj.pstatus kein Array ist
                // istObj.pstatus = ististSeiten-Array
                } else istObj.pstatus = ististSeiten;
            }
        // wenn istSeite kein Inhalt ist, checken ob p-Status
        } else if (checkFieldArrForLink(app, istSeite, "ist", pStatusSeite)) {
            if (Array.isArray(istObj.pstatus)) {
                    istObj.pstatus.push(istSeite.name)
                } else istObj.pstatus = [istSeite.name];
        // ... müsste hier nicht noch gecheckt, werden, ob ististSeiten = p-Status?
        // wenn kein Inhalt und kein p-Status
        } else {
            istObj.nichtEditierbar = istSeite.name;
            return istObj;
        }
        // wenn kein p-Status = nicht-p, um vergleichen zu können,
        // ob eine zielseite unterschiedliche p-Status-Angaben hat
        if (!istObj.hasOwnProperty("pstatus")) istObj.pstatus = ["nicht-p"];

        return istObj;
    }


    /**
     * 
     */

    function neueInhWerte(istSeite, istObj) {
        
        // Neu-, Typ-, Parent-Path
        const pathNP = istSeite.name.replace(" (p)", "");
        const cleanPathArr = pathNP.split(" _ ")
            .filter((str, i) => i !== 1);

        istObj.typ = `Inhalt _ ${pathNP.split(" _ ")[1]}`;
        istObj.art = "";
        istObj.parent = "";

        cleanPathArr.forEach((str, i) => {
            // alle bis auf den letzten str einfach hintereinandersetzen:
            // str _ str _ ...
            if (i < cleanPathArr.length - 1) {
                istObj.art += `${str} _ `;
                // wenn der istSeite-Pfad länger als 2 ist
                // alle bis auf den vorletzten (weil parent) hintereinander:
                if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
                    istObj.parent += `${str} _ `;
                // wenn istSeite-Pfad länger als 2 den vorletzten anhängen
                else if (cleanPathArr.length > 2) istObj.parent += `${str}`;
            }
            else {
                istObj.art += `${str}`;
            }
        });

        if (istObj.art === "Inhalt") istObj.art = null;

        return istObj;
    }
   
}

