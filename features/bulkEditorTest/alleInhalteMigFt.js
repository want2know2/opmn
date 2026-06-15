
////                    
// IMPORT                       // FROM

import { einzelnesFeldLesen,
         checkFieldArrForLink } from "../../shared/services/metadata/metaReadService.js";

import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";
import { dvQueryInh }           from "../../shared/services/queries/entityService.js";
import { dvLinkSuche }          from "../../shared/services/queries/queryService.js";
import { placeHoverLinkOnEl }   from "../../shared/services/ui/uiLinkService.js";

import { tableMakerReihe,
         tableMakerReiheHd }    from "../../shared/services/ui/uiService.js";


/**
 * 
 */

export function alleInhalteMigFt(obsClsObj) {
    
    // Auslesen
    const { app, dv, contentEl } = obsClsObj;

    // STANDARDSEITEN 
    const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");



    ////
    // SUCHE 
    const sucheInh = dvQueryInh(dv);
    const sucheInhInstanzen = (dvLinkSuche(dv, sucheInh, ["ist"], 0, false) ?? [])
        .map(zielseiteStr => getPageNormObject(app, dv, zielseiteStr));


    ////
    // HTML 
    // i. Main Container + Header + Infobox

    const mainContainer = contentEl.createEl("div");
    const mainHeader = mainContainer.createEl("h4", { 
        text: "Datenmigration: Klasse Inhalt" 
    });
    const mainInfoBox = mainContainer.createEl("div", { 
        text: `Klasse Inhalt: ${sucheInhInstanzen.length} Instanzen`
    });
    mainContainer.createEl("br");
    
    // ii. Content-Container

    const sucheInhCon = mainContainer.createEl("div");

    // Tabelle + Erste Reihe + Überschriften
    const tabelleHd = [ "h1", "h2"];
    const inhTabelle = tableMakerReiheHd(sucheInhCon, tabelleHd);
    
    // Suchergebnisse darstellen + 
    // weitere Suchergebnisse abfragen 

    sucheInhInstanzen.forEach(zielseite => {

        // Tabelle-Reihe + Cells + cellBoxen
        const cells = tableMakerReihe(inhTabelle, tabelleHd.length);
        const cell0LinkHd = cells[0].createEl("h5");
        const cell0LinkHdSpan = cell0LinkHd.createEl("span");
        const cell0istWerteBox = cells[0].createEl("div");
        const cell0neuGesamtBox = cells[0].createEl("div");

        const cell1Box = cells[1].createEl("div");
        

        // Cell 0
        placeHoverLinkOnEl(obsClsObj, cell0LinkHdSpan, zielseite, zielseite.name);
        cell0LinkHdSpan.createEl("span", {text: ` (${zielseite.displayName})`});
        cell0istWerteBox.createEl("b", {text: "Feld ist-Werte:"});
        


        //
        const istWerteObj = istWertePruefen(app, dv, zielseite);
        
        istWerteObj.istWerte.forEach(istWert => {

            const { istWertAlt, nichtEditierbar, 
                    klasse, typ, art, parent, pstatus } = istWert;
            
            
                
            const istWerteDlEl = cell0istWerteBox.createEl("dl");
            const dt = istWerteDlEl.createEl("dt");
            const dtSpanLink = dt.createEl("span");
            const dtSpanText = dt.createEl("span");
            placeHoverLinkOnEl(obsClsObj, dtSpanLink, istWertAlt, istWertAlt.name);
            dtSpanText.textContent = nichtEditierbar 
                ? " kann nicht editiert werden" : " wird zu";
            
            const ddNE = istWerteDlEl.createEl("dd");
            
            const ddKlasse = istWerteDlEl.createEl("dd");
            const ddKlasseSpanText = ddKlasse.createEl("span");
            const ddKlasseSpanLink = ddKlasse.createEl("span");
            
            const ddTyp = istWerteDlEl.createEl("dd");
            const ddTypSpanText = ddTyp.createEl("span");
            const ddTypSpanLink = ddTyp.createEl("span");
                        
            const ddArt = istWerteDlEl.createEl("dd");
            const ddArtSpanText = ddArt.createEl("span");
            const ddArtSpanLink = ddArt.createEl("span");
                        
            const ddPstatus = istWerteDlEl.createEl("dd");
            const ddPstatusSpanText = ddPstatus.createEl("span");
            const ddPstatusSpanLink = ddPstatus.createEl("span");

            
            if (nichtEditierbar) ddNE.textContent = nichtEditierbar;
            if (klasse.normSeite?.exists) {
                ddKlasseSpanText.textContent = "Klasse: ";
                placeHoverLinkOnEl(obsClsObj, 
                    ddKlasseSpanLink, 
                    klasse.normSeite, 
                    klasse.normSeite.name
                );
            }
            
            if (typ.normSeite?.exists) {
                ddTypSpanText.textContent = "Typ: ";
                placeHoverLinkOnEl(obsClsObj, 
                    ddTypSpanLink, 
                    typ.normSeite, 
                    typ.normSeite.name
                );
                
            }
            
            if (art.normSeite?.exists) {
                ddArtSpanText.textContent = "Art: ";
                placeHoverLinkOnEl(obsClsObj, 
                    ddArtSpanLink, 
                    art.normSeite, 
                    art.normSeite.name
                );
            } else {
                ddArtSpanText.textContent = "Art: ";
                ddArtSpanLink.createEl("mark", {text: `Die Seite ${art.path}
                    existiert nicht`})
            }

            // if (pstatus.path)
            // ddPstatusSpanText.textContent = (pstatus.path.map(pst => pst.path) ?? []).join(", ");
            
            

        });

        const neuGesamtUL = cell0neuGesamtBox.createEl("ul");

        if (istWerteObj.istWerte.length > 1) {
            cell0neuGesamtBox.createEl("b", {text: "Neue Werte gesamt:"});

            const liKlasse = neuGesamtUL.createEl("li");
            const liKlasseSpanText = liKlasse.createEl("span");
            const liKlasseSpanLink = liKlasse.createEl("span");
            
            const liTyp = neuGesamtUL.createEl("li");
            const liTypSpanText = liTyp.createEl("span");
            const liTypSpanLink = liTyp.createEl("span");
                        
            const liArt = neuGesamtUL.createEl("li");
            const liArtSpanText = liArt.createEl("span");
            const liArtSpanLink = liArt.createEl("span");
                        
            liKlasseSpanText.textContent = "Klasse: ";
            placeHoverLinkOnEl(obsClsObj, liKlasseSpanLink, inhaltSeite, inhaltSeite.name);

            liTypSpanText.textContent = "Typ: ";
            istWerteObj.einzelneDefArrays.typArr.forEach((typ, i) => {
                placeHoverLinkOnEl(obsClsObj, liTypSpanLink, typ, typ.name);
                let commaTxt = "";
                if (i < istWerteObj.einzelneDefArrays.typArr.length-1) commaTxt = ", ";
                liTypSpanLink.createEl("span", {text: commaTxt});
            })

            liArtSpanText.textContent = "Art: ";
            istWerteObj.einzelneDefArrays.artArr.forEach((art, i) => {
                placeHoverLinkOnEl(obsClsObj, liArtSpanLink, art, art.name);
                let commaTxt = "";
                if (i < istWerteObj.einzelneDefArrays.artArr.length-1) commaTxt = ", ";
                liArtSpanLink.createEl("span", {text: commaTxt});
            })
        }

        istWerteObj.einzelneDefArrays.pstatusArr.forEach(pstat => {
            const liPstatus = neuGesamtUL.createEl("li");
            const liPstatusSpanText = liPstatus.createEl("span", {text: pstat.name});
        })
        
        let nichtPArrLength = 0;
        const nichtpArr = istWerteObj.istWerte
            .filter(istSeite => istSeite.pstatus.nichtp)
            .forEach(istSeite => nichtPArrLength += 1);
                
        if (nichtPArrLength>0) {
            const liPstatus = neuGesamtUL.createEl("li");
            const liPstatusSpanLink = liPstatus.createEl("span", {text: "nicht-p-Eintrag"});
        }
        

        
    })
    
}


function istWertePruefen(app, dv, zielseite) {
    
    // Standardseiten
    const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(app, dv, "p-Status.md");

    // ist-Seiten
    const feldIstSeitenArr = einzelnesFeldLesen(app, zielseite.tFile, "ist")
        .map(istWert => resolveLinkPath(app, istWert))
        .map(istWert => getPageNormObject(app, dv, istWert));

    const typSet = new Set();
    const artSet = new Set();
    const pstatusSet = new Set();
    
    const istWerte = feldIstSeitenArr.map(istSeite => {

        const istWertObj = {
            istWertAlt: istSeite,
            nichtEditierbar: null,
            klasse: { 
                normSeite: inhaltSeite,
                path: inhaltSeite.path
            },
            typ: { 
                normSeite: null,
                path: null
            },
            art: { 
                normSeite: null,
                path: null
            },
            parent: { 
                normSeite: null,
                path: null
            },
            pstatus: { 
                normSeite: null,
                path: null,
                nichtp: null
            }
        };

        if (!istSeite.exists) { 
            istWertObj.nichtEditierbar = "existiert nicht";
            return istWertObj;
        }
        
        const istSelbstDieSeiteInhalt = istSeite.name === inhaltSeite.name;
        const inhCheck = checkFieldArrForLink(app, istSeite, "ist", inhaltSeite);
        const statusCheck = checkFieldArrForLink(app, istSeite, "ist", pStatusSeite);
        
        if (statusCheck) pstatusSet.add(istSeite.name);

        const istX2Check = einzelnesFeldLesen(app, istSeite, "ist")
            .map(istX2Wert => resolveLinkPath(app, istX2Wert))
            .map(istX2Wert => getPageNormObject(app, dv, istX2Wert));

        const istX2OhneInhalt = [...istX2Check]
            .filter(istX2Seite => istX2Seite.path !== inhaltSeite.path);

        let istX2PStatusLength = 0;
        const istX2PStatus = [...istX2OhneInhalt]
            .filter(istX2Seite => 
                checkFieldArrForLink(app, istX2Seite, "ist", pStatusSeite)
                || istX2Seite.name === pStatusSeite.name
            )
            .forEach(istX2Seite => {
                pstatusSet.add(istX2Seite.name);
                istX2PStatusLength += 1;
            });
        
        if (istX2PStatusLength <1) istWertObj.pstatus.nichtp = true;

        
        const pathNP = istSeite.name.replace(" (p)", "");
        const cleanPathArr = pathNP.split(" _ ")
            .filter((str, i) => i !== 1);
        

        // Neu-, Typ-, Parent-Path
        istWertObj.art.path = "";
        istWertObj.typ.path = `Inhalt _ ${pathNP.split(" _ ")[1]}`;
        istWertObj.parent.path = "";

        cleanPathArr.forEach((str, i) => {
            if (i < cleanPathArr.length - 1) {
                istWertObj.art.path += `${str} _ `;
                if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
                    istWertObj.parent.path += `${str} _ `;
                else if (cleanPathArr.length > 2) istWertObj.parent.path += `${str}`;
            }
            else {
                istWertObj.art.path += `${str}`;
            }
        });

        // Neu-, Typ-, Parent-Seiten
        const typSeite = getPageNormObject(app, dv, istWertObj.typ.path);
        const artSeite = getPageNormObject(app, dv, istWertObj.art.path);
        const parentSeite = getPageNormObject(app, dv, istWertObj.parent.path);
        
        typSet.add(typSeite.name);
        artSet.add(artSeite.name);
        
        istWertObj.klasse.normSeite = inhaltSeite;
        istWertObj.typ.normSeite = typSeite;
        istWertObj.art.normSeite = artSeite;
        istWertObj.parent.normSeite = parentSeite;
        // istWertObj.pstatus.normSeite = null;

        return istWertObj;
        
    })

    const typArr = [...typSet]
        .map(typ => getPageNormObject(app, dv, typ));
    const artArr = [...artSet]
        .map(art => getPageNormObject(app, dv, art));
    const pstatusArr = [...pstatusSet]
        .map(pstat => getPageNormObject(app, dv, pstat));

    return {
        istWerte,
        einzelneDefArrays: {
            typArr,
            artArr,
            pstatusArr
        }
    };
    
}

