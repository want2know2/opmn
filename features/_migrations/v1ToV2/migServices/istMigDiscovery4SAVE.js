
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         checkObSeiteHatFeld, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { queryMigInstsODefs}    from "./v1QueryService.js";



/*
    (Hoffentlich nicht zu) späte Sicherheitskopie, bereits mit dem 
    Umbau angefangen: 
    Bisher eigentlich nur `getSeitenanalyse` und 
    `getNormSeiteUndErkannteCheckWerte` bearbeitet - glaube ich,
    echt nicht 100 Pro sicher. 

    Habe jedenfalls versucht, `norm` loszuwerdem und durch 
    aSeitePseudoNorm zu ersetzen. Das soll {exists, path, name, tFile}
    enthalten, was eigentlucb für alle Aktionen ausreichend sein sollte, 
    die irgendwo stattfinden.

    Wenn gar nichts mehr läuft, müsste ich mich, um das hier wieder in 
    den Ausgangszustand zu versetzen, vermutlich an `istMigDiscovery3` 
    orientieren, und wie `getSeitenanalyse` und 
    `getNormSeiteUndErkannteCheckWerte` und `getFeldIstUndCheckWerteAusSeite` 
    da aussehen - und beten, dass ich hier bisher nicht groß iwas anderes 
    verändert habe außer diesen Funktionen.
*/


/**
 * 
 */

export function istMigDiscovery4(depsStatusUndREGELN) {
   
    // REGELN UND INFOS
    const {app, dv, MIG_REGELN, migRootKl, instODef} = depsStatusUndREGELN;

    const MIGRGL_ROOT = MIG_REGELN[migRootKl];
    const EIGENE_REGELN = MIGRGL_ROOT[instODef];
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const erwarteteTypen = MIGRGL_ROOT.erwarteteTypen;

    const migRootKlNorm = getPageNormObject(app, dv, migRootKl);
    const rootPStatNorm  = getPageNormObject(app, dv, "p-Status.md");
    const nichtPNorm  = getPageNormObject(app, dv, "nicht-p-Eintrag.md");
    
    const REGELN = {
        migRootKl,
        instODef,
        EIGENE_REGELN,
        erwarteteTypen,
        migRootKlNorm,
        rootPStatNorm,
        nichtPNorm
    };

    const deps = { 
        app, 
        dv, 
        REGELN, 
        INSToDEF_KEY: instODef
    };

    // (1) AUSGÄNGLICHE SUCHSEITEN
    const suchseiten = getSuchseiten(deps);

    if (suchseiten.size < 1)
        return;

    // (2) ANALYSIERE SEITEN
    const aSeiten = [...suchseiten]
        .map(suchseitePath => getSeitenanalyse(deps, suchseitePath));
    
    // (3) SAMMEL-OBJEKT
    const sammelUndMeldungenObjekt = getSammelUMeldungenUAbweichendObjekt(deps, aSeiten);

    // (4) FINAL-OBJEKT
    const finalUndAuswertungObjekt = getFinalUndAuswertungObjekt(deps, sammelUndMeldungenObjekt);
    finalUndAuswertungObjekt.finalAnzahl.aSeiten = suchseiten.size;

    return finalUndAuswertungObjekt;
}



/** 
 * 
 */

function getFinalUndAuswertungObjekt(deps, sammelUndMeldungenObjs) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;

    /*Object.entries(REGELN_felderUWerte).forEach(([key, entry]) => {
        //console.log("REGEL-KEYS: " + key + ": " + entry);
    });*/

    const {sammelObjekt, meldungenObjekt, abweichendeASeiten} = sammelUndMeldungenObjs;

    
    const finalObjekt = {};
    
    const finalAnzahl = {
        gesamt: 0,
        aktuell: 0,
        updaten: 0,
        erstellen: 0,
        loeschen: 0,
        geloescht: 0
    };

    // geplanteAktionNr:
    // 0 = keine, 1 = updaten, 2 = erstellen, 3 = löschen

    // SAMMEL-OBJEKT auswerten

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        finalAnzahl.gesamt += 1;
        
        const finalSeite = getEmptyFinalSeiteObj("sammel", entry);

        //console.log("SAMMELSEITE: KEY: " + key + ", entry.norm: " + entry.norm.name + ", finalSeite: " + finalSeite.norm?.name);

        // Neue Werte in neue Felder
        getNeueWerteInFinalFelder(deps, entry, finalSeite);

        // Auswertung
        getFinalFelderAktuellAuswertung(finalSeite);

        if (finalSeite.norm.exists) {

            if (!finalSeite.auswertung.alleFelderAktuell) {

                finalSeite.auswertung.geplanteAktion = "updaten";
                finalSeite.auswertung.geplanteAktionNr = 1;
                finalAnzahl.updaten += 1;
            }

            else {

                finalSeite.auswertung.geplanteAktion = "keine: bereits aktuell";
                finalSeite.auswertung.geplanteAktionNr = 0;
                finalAnzahl.aktuell += 1;
            }
        }

        else {

            finalSeite.auswertung.geplanteAktion = "erstellen";
            finalSeite.auswertung.geplanteAktionNr = 2;
            finalAnzahl.erstellen += 1;
        }

        
        // AN finalObjekt anhängen
        finalObjekt[key] = finalSeite;

    });


    // MELDUNGEN-OBJEKT auswerten
    
    Object.entries(meldungenObjekt).forEach(([key, entry]) => {
        
        if (!finalObjekt.hasOwnProperty(key)) {

            finalAnzahl.gesamt += 1;
            /*
            // eigentlich unnötig, dass die Einträge, die ohne Meldungen gefunden werden, 
            // die Meldungen von hier übernehmen:
            //entry.meldungen.forEach(mel => finalObjekt[key].meldungen.push(mel));
            
            finalObjekt[key].finalSeiteAusObj.add("meldungen");
        }*/

        //else {

            const finalSeite = getEmptyFinalSeiteObj("meldungen", entry);

            //console.log("MELDUNG-SEITE: KEY: " + key + ", entry.norm: " + entry.norm.name + ", finalSeite: " + finalSeite.norm?.name);

            // Neue Werte in neue Felder
            getNeueWerteInFinalFelder(deps, entry, finalSeite);

            // Auswertung
            getFinalFelderAktuellAuswertung(finalSeite);

            if (finalSeite.norm.exists) {

                //if (!finalSeite.auswertung.alleFelderAktuell) {

                    finalSeite.auswertung.geplanteAktion = "löschen: meldung";
                    finalSeite.auswertung.geplanteAktionNr = 3;
                    finalAnzahl.loeschen += 1;
                /*}

                else {

                    finalSeite.auswertung.geplanteAktion = "löschen: meldung";
                    finalSeite.auswertung.geplanteAktionNr = 3;
                    finalAnzahl.finalLoeschenAnz += 1;
                }*/
            }

            else {

                finalSeite.auswertung.geplanteAktion = "keine: existiert nicht (bereits gelöscht)";
                finalSeite.auswertung.geplanteAktionNr = 0;
                finalAnzahl.geloescht += 1;
            }

            // AN finalObjekt anhängen
            finalObjekt[key] = finalSeite;
        }
    });
    

    // ABWEICHEND-OBJEKT auswerten
    
    Object.entries(abweichendeASeiten).forEach(([key, entry]) => {

        //console.log("ABWEICHENDE-ASEITE: KEY: " + key + ", entry.norm: " + entry.norm.name); //  + ", finalSeite: " + finalSeite.norm?.name
        //entry.meldungen.forEach(mel => console.log(mel.info))

        if (!finalObjekt.hasOwnProperty(key)) {

            finalAnzahl.gesamt += 1;
            
            /*
            // eigentlich unnötig, dass die Einträge, die ohne Meldungen gefunden werden, 
            // die Meldungen von hier übernehmen:
            // entry.meldungen.forEach(mel => finalObjekt[key].meldungen.push(mel));    
            
            finalObjekt[key].finalSeiteAusObj.add("abweichend");
        }

        else { */

            const finalSeite = getEmptyFinalSeiteObj("abweichend", entry);

            if (finalSeite.norm.exists) {
            
                finalSeite.auswertung.geplanteAktion = "löschen";
                finalSeite.auswertung.geplanteAktionNr = 3;
                finalAnzahl.loeschen += 1;
            }

            else {

                finalSeite.auswertung.geplanteAktion = "keine: existiert nicht (bereits gelöscht)";
                finalSeite.auswertung.geplanteAktionNr = 0;
                finalAnzahl.geloescht += 1;
            }

            finalObjekt[key] = finalSeite;
        }
    });
    

    /* Alt, unnötig, das finalObjekt noch mal zu durchsuchen
    // FERTIGES FINAL-OBJEKT AUSWERTUNG:
    Object.entries(finalObjekt).forEach(([key, entry]) => {

        //console.log(`Seite: ${key}, finalSeiteAusObj: ${[...entry.finalSeiteAusObj]},
        //    Anzahl neue Felder erstellt: ${entry.auswertung.neueFelderErstellt}, Meldungen (s.u.):`);

        //entry.meldungen.forEach(mel => console.log(mel.info));

        if (entry.finalSeiteAusObj.has("sammel")) {
            
            if (entry.norm.exists) {

                if (!entry.auswertung.alleFelderAktuell) {

                    entry.auswertung.geplanteAktion = "updaten";
                }

                else {

                    entry.auswertung.geplanteAktion = "keine: bereits aktuell";
                }
            }

            else {

                entry.auswertung.geplanteAktion = "erstellen";
            }
        }
        
        else if (entry.finalSeiteAusObj.has("meldungen")) {

            if (entry.norm.exists) {

                if (!entry.auswertung.alleFelderAktuell) {

                    entry.auswertung.geplanteAktion = "prüfen: meldung";
                }

                else {

                    entry.auswertung.geplanteAktion = "keine: bereits aktuell";
                }
            }

            else {

                entry.auswertung.geplanteAktion = "prüfen: meldung";
            }
        
        }

        else if (entry.finalSeiteAusObj.has("abweichend")) {
        
            if (entry.norm.exists) {
            
                entry.auswertung.geplanteAktion = "löschen";
            }

            else {

                entry.auswertung.geplanteAktion = "keine: existiert nicht (bereits gelöscht)";
            }
        }
    });
    */

    return {
        finalObjekt,
        finalAnzahl
    };
}



/** 
 * 
 */

export function getEmptyFinalSeiteObj(objID, entry, leer = null) {

    return {
        finalSeiteAusObj: !leer ? new Set([objID]) : new Set([]),
        neueFelderUndWerte: {},
        neueFelderInSeiteAktuell: {},
        norm: !leer ? entry.norm : {exists: null},
        feldIst: !leer ? entry.feldIst : [],
        meldungen: !leer ? entry.meldungen : [],
        auswertung: {
            geplanteAktion: "",  // geplante Aktion als textinfo
            geplanteAktionNr: 0, // 0 keine, 1 updaten, 2 erstellen, 3 löschen
            alleFelderAktuell: null,
            neueFelderErstellt: 0,
            neueFelderBereitsAktuell: 0,
            neueFelderNichtAktuell: 0
        }
    };
}



/** 
 * 
 */

function getNeueWerteInFinalFelder(deps, entry, finalSeite) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;

    Object.entries(entry.neueWerte).forEach(([nwKey, nwEntry]) => {

        const eintragVorhanden = nwEntry.size > 0;
        const neuesFeld = REGELN_felderUWerte[nwKey];
        
        //console.log("neuesFeld: " + neuesFeld);

        if (eintragVorhanden && neuesFeld !== "seite") {

            const neuerEintragFinal = [...nwEntry].map(eintrName => `[[${eintrName}]]`);

            finalSeite.neueFelderUndWerte[neuesFeld] = neuerEintragFinal;
            finalSeite.neueFelderInSeiteAktuell[neuesFeld] = null;

            if (finalSeite.norm.exists) {

                const neuesFeldInSeite = einzelnesFeldLesen(app, finalSeite.norm, neuesFeld) ?? [];

                const sorted1 = [...neuerEintragFinal].sort();
                const sorted2 = [...neuesFeldInSeite].sort();

                const neuesFeldInSAktuell =
                    sorted1.length === sorted2.length &&
                    sorted1.every((val, i) => val === sorted2[i]);

                // console.log("neue Werte: " + neuerEintragFinal + ", Feld in Seite: " + neuesFeldLesen + ". AKTUELL? " + neuesFeldInSAktuell);

                if (neuesFeldInSAktuell)
                    finalSeite.neueFelderInSeiteAktuell[neuesFeld] = true;
            }
        }
    });
}



/**
 * 
 */

function getFinalFelderAktuellAuswertung(finalSeite) {
    
    Object.entries(finalSeite.neueFelderInSeiteAktuell).forEach(([key, entry]) => {

        finalSeite.auswertung.neueFelderErstellt +=1;

        // console.log("FELD AKTUELL KEY " + key + ", EINTRAG: " + entry);

        if (!!entry)
            finalSeite.auswertung.neueFelderBereitsAktuell += 1;
        else
            finalSeite.auswertung.neueFelderNichtAktuell +=1;
    });

    if (finalSeite.auswertung.neueFelderBereitsAktuell 
            === finalSeite.auswertung.neueFelderErstellt 
                && finalSeite.auswertung.neueFelderNichtAktuell === 0) 
    {
        finalSeite.auswertung.alleFelderAktuell = true;
    }
}



/** 
 *
 */

function getSammelUMeldungenUAbweichendObjekt(deps, aSeiten) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";
    const REGELN_erlaubterTypVorhanden = REGELN_felderUWerte.erster === "erlaubterTyp";

    const REGELN_erwarteteTypen = REGELN.erwarteteTypen ?? [];


    const sammelObjekt = {};
    const meldungenObjekt = {};
    const abweichendeASeiten = {};


    aSeiten.forEach(analyse => {

        // NSEITE je nach anzahl meldungen an SAMMEL- oder MELDUNGEN
        const gesammelteNSeite = {
            norm: { exists: null },
            feldIst: [],
            neueWerte: {...analyse.neueWerte},
            meldungen: [...analyse.meldungen]
        };
        
        // wenn nSeiteAbweichend ASEITE an ABWEICHENDE aSeiten
        const gesammelteASeite = {};

        const anzahlMeldungen = [...analyse.meldungen].filter(mel => mel).length;

        if (analyse.nSeiteAbweichend) {

            gesammelteASeite.norm = {...analyse.aSeiteNorm};
            gesammelteASeite.feldIst = [...analyse.aSeiteFeldIst];
            gesammelteASeite.neueWerte = {...analyse.neueWerte};
            gesammelteASeite.meldungen = [...analyse.meldungen];

            gesammelteNSeite.norm = getPageNormObject(app, dv, `${analyse.nSeite}.md`);
            
            if (gesammelteNSeite.norm.exists) {

                gesammelteNSeite.feldIst = einzelnesFeldLesen(app, gesammelteNSeite.norm, "ist");

                //console.log(`aSEITE "${analyse.aSeite}" erstellt nSEITE "${sammelSeite.norm.name}"`);
            }
        }
        
        // nSeite nicht abweichend
        else {
            gesammelteNSeite.norm = analyse.aSeiteNorm;
            gesammelteNSeite.feldIst = analyse.aSeiteFeldIst;
        }

        //console.log("MELDUNGEN für " + analyse.aSeite + ", ANZAHL: " + mels.length);
        //mels.forEach(mel => console.log(mel.info));

        // AN SAMMEL-OBJEKT   
        if (anzahlMeldungen === 0 && !sammelObjekt.hasOwnProperty(analyse.nSeite)) {

            //console.log("+++++++++ SAMMELSEITE wird angehangen: " + analyse.nSeite);
            const istTyp = REGELN_erwarteteTypen.includes(analyse.nSeite);
            if (!istTyp)
                sammelObjekt[analyse.nSeite] = gesammelteNSeite;
        }

        // AN MELDUNGEN-OBJEKT
        else if (anzahlMeldungen > 0 && !meldungenObjekt.hasOwnProperty(analyse.nSeite)) {

            //console.log(analyse.nSeite + ", MELDUNGEN: "+ [...analyse.meldungen.map(mel => mel.info)])
            const istTyp = REGELN_erwarteteTypen.includes(analyse.nSeite);
            if (!istTyp)
                meldungenObjekt[analyse.nSeite] = gesammelteNSeite;
        }

        // ABWEICHENDE aSEITEN
        if (analyse.nSeiteAbweichend && !abweichendeASeiten.hasOwnProperty(analyse.aSeite)) {

            const istTyp = REGELN_erwarteteTypen.includes(analyse.nSeite);
            if (!istTyp)
                abweichendeASeiten[analyse.aSeite] = gesammelteASeite;
        }
    });

    REGELN_erwarteteTypen.forEach(erwTyp => {
        sammelObjekt.hasOwnProperty
    })

    if (!!REGELN_letzterIstNeueSeite) {
        unregistrierteParentsHinzufuegen(deps, sammelObjekt);
    }

    if (!!REGELN_erlaubterTypVorhanden) {
        erlaubterTypZuRootParentsSchieben(deps, sammelObjekt);
    }

    /*
    console.log("ANZAHL sammelObjekt: " + Object.keys(sammelObjekt).length);
    console.log("ANZAHL meldungenObjekt: " + Object.keys(meldungenObjekt).length);
    console.log("ANZAHL abweichendeASeitenObjekt: " + Object.keys(abweichendeASeiten).length);
    */

    return {
        sammelObjekt,
        meldungenObjekt,
        abweichendeASeiten
    };
}



/**
 * 
 */

function unregistrierteParentsHinzufuegen(deps, sammelObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const neueParentsHinzugefuegtReg = new Set;

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        //console.log("PARENTS HINZUFUEGEN: CHILD: " + key);
        
        
        if (entry.neueWerte.vorletzter.size === 1) {
            
            const parentPath = [...entry.neueWerte.vorletzter][0];

            //console.log("Parent Path: " + parentPath + "REAL EXISTS: " + !!parentPath);
        
            const parentIstInSammelObjekt = sammelObjekt.hasOwnProperty(parentPath);
            const neuerParentBereitsRegistriert = neueParentsHinzugefuegtReg.has(parentPath);
            
            if (!parentIstInSammelObjekt && !neuerParentBereitsRegistriert) {

                const grandParentPath = getGrandParent(parentPath);

                // console.log("GerandParent Path: " + grandParentPath);

                sammelObjekt[parentPath] = {
                    norm: getPageNormObject(app, dv, parentPath),
                    feldIst: [],
                    neueWerte: {},
                    meldungen: []
                };

                if (sammelObjekt[parentPath].norm.exists) {
                    sammelObjekt[parentPath].feldIst = 
                        einzelnesFeldLesen(app, sammelObjekt[parentPath].norm.path, "ist") ?? [];
                }

                Object.entries(entry.neueWerte).forEach(([childNWKey, childNWEntry]) => {
                    
                    if (childNWKey === "letzter")
                        sammelObjekt[parentPath].neueWerte.letzter = new Set([parentPath]);
                    
                    if (childNWKey === "vorletzter") {
                        sammelObjekt[parentPath].neueWerte.vorletzter = !!grandParentPath
                            ? new Set([grandParentPath])
                            : new Set();
                    }
                    
                    if (childNWKey !== "letzter" && childNWKey !== "vorletzter") {
                        sammelObjekt[parentPath].neueWerte[childNWKey] = childNWEntry;
                    }
                });

                
                //console.log("Parent Path: " + parentPath);
                

                neueParentsHinzugefuegtReg.add(parentPath);
            }
        }
    });

    
    //console.log("neuParREG ANZAHL: " + neueParentsHinzugefuegtReg.size);
    

    if (neueParentsHinzugefuegtReg.size > 0) {
        
    
        //neueParentsHinzugefuegtReg.forEach(pn => console.log("NEU PARENT REG: " + pn));
    

        unregistrierteParentsHinzufuegen(deps, sammelObjekt);
    }

    else return sammelObjekt;
}



/**
 * 
 */

function getGrandParent(parentPath) {

    const parentArr = parentPath.split(" _ ");
    let grandParentPath = "";
    
    if (parentArr.length > 2) {
        for (let i = 0; i < parentArr.length; i++) {
            if (i < parentArr.length-1)
                grandParentPath += `${parentArr[i]} _ `;
            else
                grandParentPath += `${parentArr[i]}`;
        }
    }
    else grandParentPath = null;

    //console.log("PARENT: " + parentPath + " / PARENT-Arr Länge: " + parentArr.length + " / GRAND-PARENT: " + grandParentPath);
    
    return grandParentPath;
}



/**
 * 
 */

function erlaubterTypZuRootParentsSchieben(deps, sammelObjekt) {
    
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const rootParents = {};
    const children = {};

    // rootParents und children sammeln
    
    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        //console.log("SAMMEL SEITE " + key);

        const neueWerte = entry.neueWerte;
        const parentArr = [...neueWerte.vorletzter];
        const hatParent = !!parentArr[0];

        if (!hatParent) {
            //console.log("HAT KEIN PAR: " +key)
            rootParents[key] = entry;
        }

        else {
            //console.log("HAT PAR: " +key)
            children[key] = entry;
        }
    });


    Object.keys(rootParents).forEach(rootKey => {
        
        const childrenKeys = Object.keys(children).filter(key => key.startsWith(rootKey));
                
        //console.log("ROOT PART" + rootKey);
        //console.log("LÄNGE CHILDKEYS" + Object.keys(children).length);
        //console.log("LÄNGE CHILDKEYS STARTSWITH" + childrenKeys.length);

        childrenKeys.forEach(childKey => {

            const erlaubterTypChild = sammelObjekt[childKey].neueWerte.erster;
            //console.log("ERSTER : " +[...sammelObjekt[childKey].neueWerte.erster])
           
            erlaubterTypChild.forEach(typ => {
                
                //console.log("verschobener typ:"  + typ + " / von " + childKey + " zu " + rootKey);
                sammelObjekt[rootKey].neueWerte.erster.add(typ);
            });
           
            //console.log("SAMMEL " + rootKey + " HAS CHILD KEY: " + childKey + " : " + sammelObjekt.hasOwnProperty(childKey))
            //console.log("CHIULD KEY " + childKey + " HAT PROPERT " + Object.keys(sammelObjekt[childKey]))
            //console.log("WERTE NEU HAT PROP " + Object.keys(sammelObjekt[childKey].neueWerte))
               
            //console.log("CHILD WERTE " + [...sammelObjekt[childKey].neueWerte.erster]);
            delete sammelObjekt[childKey].neueWerte.erster;
        });
    });

    return sammelObjekt;
}



/**
 * 
 */

function getSeitenanalyse(deps, suchseitePath) {

    //console.log("ANALYSE, eingehende Seite: " +suchseitePath);

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // Aus den REGELN
    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";

    const REGELN_erwarteteTypen = REGELN.erwarteteTypen;

    const analyse = {
        
        aSeitePath: suchseitePath,
        aSeite: "",
        aSeitePseudoNorm: {
            path: null,
            exists: null,
            tFile: null
        },
        aSeiteNorm: { exists: null },
        //nSeiteNorm: { exists: null },
        aSeiteFeldIst: [],

        nSeite: "",
        nSeiteAbweichend: null,
        // nSeiteFeldIst: [],
        neueWerte: {},
        meldungen: [],
        erkannteCheckWerte: [] // wird gelöscht, also nicht mit analyse returned
    };

    getNormSeiteUndErkannteCheckWerte(deps, analyse);

    
    if (!analyse.aSeiteNorm.exists) {

        analyse.meldungen.push({
            // meldung514
            info: `die suchseite "${suchseitePath}" existiert nicht`
        });

        delete analyse.erkannteCheckWerte;
        return analyse;
    }
    

    getNeueWerteAusErkanntenCheckWerten(deps, analyse);

    const meldungenLetzter = [...analyse.meldungen].filter(mel => mel.fuerKey === "letzter");

    if (REGELN_letzterIstNeueSeite && meldungenLetzter.length === 0) {
        
        analyse.nSeite = [...analyse.neueWerte.letzter][0];
        analyse.nSeiteAbweichend = analyse.nSeite === analyse.aSeite
            ? null
            : true;
        
        //console.log("NSEITE: " + nSeite);
    }
    else 
        analyse.nSeite = analyse.aSeite;

    delete analyse.erkannteCheckWerte;

    return analyse;

}



/**
 * 
 */

function getNeueWerteAusErkanntenCheckWerten(deps, analyse) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN UND INFOS
    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;

    const neueWerteKandidaten = [...analyse.erkannteCheckWerte].map(cwe => {

        if (cwe.erkanntAls === 2) {

            // console.log("erkannt Als 2 name: " + cwe.norm.name)
            return getNeueWertePathsAusCW(deps, cwe.norm.name);
        }

        else {
            //console.log("NICHT 2: " + cwe.norm?.name)
            return null;
        }
    }).filter(Boolean);

    // neueWerteKandidaten.forEach(nw => console.log(typeof nw))
    // console.log(Object.keys(REGELN_felderUWerte));

    
    Object.keys(REGELN_felderUWerte).forEach(key => {

        if (!!REGELN_felderUWerte[key]) {

            if (key === "migRootKl") {

                analyse.neueWerte[key] = new Set();
                analyse.neueWerte[key].add(migRootKl);
            }

            else if (key === "artPath") {

                analyse.neueWerte[key] = new Set();
                analyse.neueWerte[key].add("art");
            }

            else if (key === "erster") {

                getErsterSet(deps, analyse, neueWerteKandidaten);
            }

            else if (key === "letzter") {

                getLetzterSet(deps, analyse, neueWerteKandidaten);
            }
            
            else if (key === "vorletzter") {

                getVorletzterSet(deps, analyse, neueWerteKandidaten);
            }
            
            else if (key === "pstatus") {

                getUniquePStatus(deps, analyse);
            }
        }
    });
}



/**
 * 
 */

function getErsterSet(deps, analyse, neueWerteKandidaten) {
    
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";
    const REGELN_erwarteteTypen = REGELN.erwarteteTypen;

    analyse.neueWerte.erster = new Set();

    neueWerteKandidaten.forEach(nw => {

        const typErwartet = REGELN_erwarteteTypen.includes(nw.erster);
        //console.log("typErwartet: "+typErwartet);
           
        if (!typErwartet) {

            analyse.meldungen.push({ 
                //meldung514
                info: `${nw.erster} ist kein erwarteter typ`
            });
        }

        else
            analyse.neueWerte.erster.add(nw.erster);
    });

    if (REGELN_letzterIstNeueSeite && analyse.neueWerte.erster.size > 1) {

        analyse.meldungen.push({
            //meldung514
            info: `mehr als ein (${analyse.neueWerte.erster.size}) typ`
        })
    }
}



/**
 * 
 */

function getLetzterSet(deps, analyse, neueWerteKandidaten) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";

    analyse.neueWerte.letzter = new Set();

    neueWerteKandidaten.forEach(nw => {

        const istSelbstMigRoot = nw.letzter === migRootKl;
        const beginntMitRootKl = nw.letzter.startsWith(`${migRootKl} _ `);

        // console.log("letzter Wert: " + nw.letzter + " / migRootKl: " + migRootKl + " / nichtMigRoot: " + nichtMigRoot)
        if (!istSelbstMigRoot && beginntMitRootKl) {
            // console.log("LETZTER " + nw.letzter);
            analyse.neueWerte.letzter.add(nw.letzter);
        }
        
        else if (istSelbstMigRoot) {
            analyse.meldungen.push({ 
                // meldung514
                fuerKey: "letzter",
                info: `${nw.letzter} ist selbst migRootKl (${migRootKl})`
            });
        }

        else if (!beginntMitRootKl) {
            analyse.meldungen.push({ 
                // meldung514
                fuerKey: "letzter",
                info: `${nw.letzter} beginnt nicht mit "${migRootKl} _ "`
            });
        }
    });

    if (REGELN_letzterIstNeueSeite && analyse.neueWerte.letzter.size > 1) {
        analyse.meldungen.push({ 
            // meldung514
            fuerKey: "letzter",
            info: `letzter ist neue seite und mehr als ein letzter (${analyse.neueWerte.letzter.size})`
        });
    }
}



/**
 * 
 */

function getVorletzterSet(deps, analyse, neueWerteKandidaten) {
    
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const migRootKl = REGELN.migRootKl;

    analyse.neueWerte.vorletzter = new Set();
    
    neueWerteKandidaten.forEach(nw => {

        if (!!nw.vorletzter) {

            const istSelbstMigRoot = nw.vorletzter === migRootKl;
            const beginntMitRootKl = nw.vorletzter.startsWith(`${migRootKl} _ `);

            if (!istSelbstMigRoot && beginntMitRootKl)
                analyse.neueWerte.vorletzter.add(nw.vorletzter);

            else if (istSelbstMigRoot) {
                
                analyse.meldungen.push({
                    //meldung514
                    info: `${nw.vorletzter} ist selbst migRootKl (${migRootKl})`
                });
            }

            else if (!beginntMitRootKl) {
                
                analyse.meldungen.push({
                    //meldung514
                    info: `${nw.vorletzter} beginnt nicht mit "${migRootKl} _ "`
                });
            }
        }

    });

    if (analyse.neueWerte.vorletzter.size > 1) {
        analyse.meldungen.push({ 
            //meldung514
            info: `parent, aber mehr als ein vorletzter (${analyse.neueWerte.vorletzter.size})`
        });
        
    }

    //console.log("VORLETZTER SET von " + analyse.aSeite + ": " + [...analyse.neueWerte.vorletzter]);
    
}



/** erkannte checkWerte einer einzelnen Suchergebnis-Seite:

 *  p-Status Set

    alle 4er ins Set

    alle 2er und 5er => einzelneSeiteCWerkennen
    davon 4er ins Set

 *  get unique pstatus
    4 => Set
    2,5 prüfen => Set
    return Set
 */

function getUniquePStatus(deps, analyse) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const nichtP = REGELN.nichtPNorm.name;

    //console.log("PSTATUS aus aSEITE: " + analyse.aSeite);

    analyse.neueWerte.pstatus = new Set();

    analyse.erkannteCheckWerte.forEach(cwert => {
        
        if (cwert.erkanntAls === 4) {
            //console.log("erkannt als 4: " + cwert.norm.name);
            analyse.neueWerte.pstatus.add(cwert.norm.name);
        }
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {

            //console.log("erkanntAls " + cwert.erkanntAls +": " + cwert.norm.name);
            
            // Die Frage ist, ob ich für jeden Wert einzeln ein uniqueSet machen muss
            // und wenn das leet bleibt, nichtP hinzufügen? - NEIN, glaube nicht.

            const pAnalyse = {
                aSeite: cwert.norm.name,
                aSeiteNorm: cwert.norm,
                neueWerte: {
                    pstatus: new Set()
                },
                meldungen: []
            };

            getNormSeiteUndErkannteCheckWerte(deps, pAnalyse, true);

            pAnalyse.erkannteCheckWerte.forEach(cwrt => {

                // console.log("pAnalyse.erkannteCheckWerte: " + cwrt.norm?.name);

                if (cwrt.erkanntAls === 4) {
                    pAnalyse.neueWerte.pstatus.add(cwrt.norm.name);
                    analyse.neueWerte.pstatus.add(cwrt.norm.name);
                }
                    
            });

            //console.log("checkWert pSet: " + [...pAnalyse.neueWerte.pstatus]);
        }

    });

    
    if (analyse.neueWerte.pstatus.size === 0)
        analyse.neueWerte.pstatus.add(nichtP);

    if (analyse.neueWerte.pstatus.size >1) {

        analyse.meldungen.push({ 
            // meldung514
            info: `mehr als ein pstatus (${analyse.neueWerte.pstatus.size})`
        });
    }
    
    //console.log("PSTATUS-SET: " + [...analyse.neueWerte.pstatus]);
}



/**
 * 
 */

function getNeueWertePathsAusCW(deps, checkWertName) {

    //console.log("GET NEUE NWERTE FUER : " + checkWertName)

    const { app, dv, REGELN, INSToDEF_KEY } = deps;
    
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const ersterSeparat = EIGENE_REGELN.ersterSeparat;

    const splitPathOhneP = checkWertName
        .replace(" (p)", "")
        .replace(" (pp)", "")
        .split(" _ ");

    const splitPathLength = splitPathOhneP.length;

    const neuePathsObj = {
        erster: "",
        letzter: "",
        vorletzter: ""
    };

    if (splitPathLength > 1) 
        neuePathsObj.erster = `${splitPathOhneP[0]} _ ${splitPathOhneP[1]}`;
    
    const cleanPathArr = splitPathOhneP
        .filter((str, i) => i !== 1 || !ersterSeparat);

    const cPathLength = cleanPathArr.length;

    for (let i = 0; i < cPathLength; i++) {
        if (cPathLength >= 1) {
            if (i <= cPathLength-3) {
                neuePathsObj.letzter += `${cleanPathArr[i]} _ `;
                neuePathsObj.vorletzter += `${cleanPathArr[i]} _ `;
            }
            else if (i === cPathLength-2) {
                neuePathsObj.letzter += `${cleanPathArr[i]} _ `;
                if (cPathLength > 2)
                    neuePathsObj.vorletzter += `${cleanPathArr[i]}`;
            }
            else if (i === cPathLength-1)
                neuePathsObj.letzter += `${cleanPathArr[i]}`;
        }
    }

    return neuePathsObj;
}



/** 
 *  
 */

function getNormSeiteUndErkannteCheckWerte(deps, analyse, REGEL_wieFuerMigDef = null) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // const pseudoNorm = { exists: null, tFile: null };
    let norm = { exists: null };

    if (!analyse.aSeitePseudoNorm.exists) {

        norm = getPageNormObject(app, dv, analyse.aSeitePath);
    
        analyse.aSeitePseudoNorm.exists = norm.exists ?? null;
        analyse.aSeitePseudoNorm.path = norm.exists ? norm.path : null;
        analyse.aSeitePseudoNorm.tFile = norm.exists ? norm.tFile : null;
    }
    
    if (!norm.exists)
        return;


    analyse.aSeite = norm.name;

    const feldIstUndCWerte = getFeldIstUndCheckWerteAusSeite(deps, analyse.aSeitePseudoNorm, REGEL_wieFuerMigDef);

    analyse.aSeiteFeldIst = feldIstUndCWerte.feldIst;

    analyse.erkannteCheckWerte = [...feldIstUndCWerte.checkWerte].map(checkWert => {
        
        const cwe = einzelnenCheckWertErkennen(deps, checkWert);
        
        if (cwe.erkanntAls === 0) {
            
            //console.log(`${cwe.wert} existiert nicht`);

            analyse.meldungen.push({
                //meldung514
                info: `${cwe.wert} existiert nicht`
            })
        }

        if (cwe.erkanntAls === 5) {
            
            //console.log(`${cwe.norm.name} gehört nicht zur migRootKl und ist kein pstatus`);

            analyse.meldungen.push({
                //meldung514
                info: `${cwe.pseudoNorm.name} gehört nicht zur migRootKl und ist kein pstatus`
            })
        }

        return cwe;
    });
}



/**
 * 
 */

function getFeldIstUndCheckWerteAusSeite(deps, pseudoNorm, REGEL_wieFuerMigDef = null) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN
    const checkInklSeite = REGELN.EIGENE_REGELN.checkInklSeite;

    const feldIst = einzelnesFeldLesen(app, pseudoNorm, "ist") ?? [];
    
    /*
    console.log("getCheckWerteArr: RGL_KEY: " + RGL_KEY);
    console.log("getCheckWerteArr: checkInklSeite: " + RGLuINF.EIGENE_REGELN.checkInklSeite);
    */
    
    const checkWerte = (checkInklSeite || REGEL_wieFuerMigDef)
        ? [pseudoNorm.path, ...feldIst]
        : feldIst;
    
    return {
        feldIst,
        checkWerte
    }
}



/**
 * 
 */

function einzelnenCheckWertErkennen(deps, checkWertRaw) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const { migRootKlNorm, rootPStatNorm, nichtPNorm } = REGELN;

    const checkWertPath = resolveLinkPath(app, checkWertRaw);
    const checkWertNorm = getPageNormObject(app, dv, checkWertPath);
    if (!checkWertNorm.exists) {
        //console.log("checkWert erkennen: checkWertRaw: "+checkWertRaw +" / erkanntAls: " + 0);
        return { wert: checkWertRaw, pseudoNorm: { exists: null, tFile: null }, erkanntAls: 0 }; // 0 = existiert nicht
    }
    
    /*/CONSOLE
    console.log("einzelnenCheckWertErkennen: "+ checkWertRaw);
    //*/

    const istMigRootKl = checkWertNorm.path === migRootKlNorm.path;
    const defInMigRootKl = checkFieldArrForLink(app, checkWertNorm, "ist", migRootKlNorm);
    const istPStat = checkWertNorm.path === rootPStatNorm.path;
    const defInPStat = checkFieldArrForLink(app, checkWertNorm, "ist", rootPStatNorm);
    const istNichtP = checkWertNorm.path === nichtPNorm.path;

    /*/CONSOLE
    console.log("migRootKlNorm: " + migRootKlNorm.path +
        " / checkWertNorm: " + checkWertNorm.path +
        " / defInMigRootKl: " + defInMigRootKl
    )
    //*/

    if (istMigRootKl) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 1);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 1 } // 1 = "migRootKl"
    }
    else if (defInMigRootKl) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 2);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 2 }; // 2 = "migDef in migRootKl"
    }
    else if (istPStat) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 3);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 3 }; // 3 = "p-Status"
    }
    else if (defInPStat || istNichtP){
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 4);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 4 }; // 4 = "p-migDef in p-Status oder nicht-p"
    }
    else {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 5);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 5 }; // what5ver
    }
}



/**
 * 
 */

function getSuchseiten(deps) {

    // oben:
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    /*/CONSOLE: INSToDEF_KEY
    console.log(">>>>>>>>>>> INSToDEF_KEY <<<<<<<<<<<<<: " + INSToDEF_KEY);
    //*/

    // hier:
    // app, dv, RGLuINF, RGL_KEY
    // console.log("EIGENE_REGELN: "+ REGELN.EIGENE_REGELN)
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;

    //console.log("EIGENE_REGELN: ziel: " + EIGENE_REGELN.ziel);

    const suchseitenSet = new Set();

    if (!EIGENE_REGELN.ziel)
        return suchseitenSet;

    queryMigInstsODefs(dv, REGELN.migRootKl, EIGENE_REGELN.ziel)
        .forEach(path => suchseitenSet.add(path));


    /*
    if (EIGENE_REGELN.ziel === "ontDef") {
        
        
        queryMigInstsODefs(dv, REGELN.migRootKl, "inst")
            .forEach(seitePath => {
                //console.log("zusätzlich gefundene inst: " + einzelSPath);

                const sCWerkannt = getNormSeiteUndErkannteCheckWerte({app, dv, REGELN, INSToDEF_KEY: "migInst"}, seitePath);

                sCWerkannt.erkannteCheckWerte.forEach(checkWert => {
                    //console.log("zusätzliche inst checkWerte => .erkanntAls " + cwert.erkanntAls)
                    if (checkWert.erkanntAls === 2)
                        suchseitenSet.add(checkWert.norm.path)
                })
            });
        
        
    }
    */

    /*
    console.log("checkSeitenSet: ");
    checkSeitenSet.forEach(val => console.log(val));
    */
    
    return suchseitenSet;
}

