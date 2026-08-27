
////
// IMPORT                       // FROM

import { readRegJSON, 
         writeRegJSON }         from "../../../../shared/services/dataService/jsonReadAndWrite.js";

import { checkFieldArrForLink, 
         checkObSeiteHatFeld, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";

import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { queryMigInstsODefs}    from "./v1QueryService.js";



/**
 * 
 */

export async function istMigDiscovery4(depsStatusUndREGELN) {
   
    // REGELN UND INFOS
    const {app, dv, MIG_REGELN, migRootKl, instODef} = depsStatusUndREGELN;

    if (!migRootKl)
        return;

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
    
    //aSeiten.forEach(s => console.log(s.aNormInfos.name))

    // (3) ANALYSIERTE SEITEN AUSWERTEN
    const sammelUndMeldungenObjekt = getSammelUMeldungenUAbweichendObjekt(deps, aSeiten);

    //Object.keys(sammelUndMeldungenObjekt.sammelObjekt).forEach(key => console.log("MELD Obj Eintr: " + key))

    // (4) FINALE ANALYSE-AUSWERTUNG
    const finalAuswertungObjekt = await getAnalyseAuswertungUndUserReg(deps, sammelUndMeldungenObjekt);
    finalAuswertungObjekt.finalAnzahl.suchseiten = suchseiten.size;

    //Object.keys(finalUndAuswertungObjekt.analyseObjekt).forEach(key => console.log(key));

    // (5) REG & GESAMTAUSWERTUNG
    //await getRegUndGesamtauswertung(deps, finalAuswertungObjekt);

    return finalAuswertungObjekt;
    
}



/**
 * 
 */
/*
async function getRegUndGesamtauswertung(deps, finalAuswertungObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;
    const { migRootKl, instODef, EIGENE_REGELN } = REGELN;

    
    
    finalAuswertungObjekt.userReg = {};
    finalAuswertungObjekt.userReg = await readRegJSON(app, `${migRootKl} _ ${instODef}`) ?? {};

    let { analyseObjekt, userReg } = finalAuswertungObjekt;

    const userRegUnveraendert = new Set();
    let userRegNeu = {};

    // wenn userAuswahl = x, dann ist diese Auswahl zulässig, wenn die 
    // analysierte Seite als geplante Aktion [y,z] hat (also einen der Werte
    // in dem jeweiligen Array).
    const erlaubteUserAuswahl = {
         "0": [0,1,2,3],
         "1": [0,1,  3],
         "2": [0,  2  ],
         "3": [0,    3]
    };


    
    Object.entries(analyseObjekt).forEach(async ([key, entry]) => {

        //console.log("FINAL SEITE: " +key + " / AUSWERT . AKTION: " + entry.auswertung.analyseAktion);
        //checkExistierendeRegAuswahl(key, entry.auswertung.analyseAktion);

        //console.log("SEITE: " + key + " / CASE: " + entry.auswertung.analyseAktion);

        if (userReg.hasOwnProperty(key)) {

            const userAuswahlGetroffen = 
                typeof userReg[key].userAuswahl === "number" 
                    && !Number.isNaN(userReg[key].userAuswahl);

            //console.log("SEITE " + key + " / auswhal: " + userReg[key].userAuswahl + " / AUSWAHL GWETROFFEN " + userAuswahlGetroffen + " & TYPEOF auswahl " + typeof userReg[key].userAuswahl)

            if (userAuswahlGetroffen) {

                const userAuswahlErlaubt = 
                    erlaubteUserAuswahl[`${entry.auswertung.analyseAktion}`]
                        .some(erlaubt => erlaubt === userReg[key].userAuswahl);

                
                if (userAuswahlErlaubt) {

                    userRegUnveraendert.add(key);
                    
                    analyseObjekt[key].auswertung.aktiveAktion = 
                        userReg[key].userAuswahl;
                    analyseObjekt[key].auswertung.userAuswahlAktion =
                        userReg[key].userAuswahl;
                }

                else { // user auswahl nicht erlaubt

                    userRegNeu[key] = {userAuswahl: null};
                    
                    analyseObjekt[key].auswertung.aktiveAktion = 
                        analyseObjekt[key].auswertung.analyseAktion;
                    analyseObjekt[key].auswertung.userAuswahlAktion = null;
                }
            }

            else { // user auswahl = null

                analyseObjekt[key].auswertung.aktiveAktion = 
                        analyseObjekt[key].auswertung.analyseAktion;
                    
                analyseObjekt[key].auswertung.userAuswahlAktion =
                        userReg[key].userAuswahl;

                userRegUnveraendert.add(key);
            }
        }

        else { // Seite nicht in userAuswahlReg

            userRegNeu[key] = {userAuswahl: null};
                    
            analyseObjekt[key].auswertung.aktiveAktion = 
                analyseObjekt[key].auswertung.analyseAktion;

            analyseObjekt[key].auswertung.userAuswahlAktion =
                        userReg[key].userAuswahl;
        }
        

        
    });

    
    
    if (Object.keys(userRegNeu).length > 0) {

        userRegUnveraendert.forEach(seiteKey => userRegNeu[seiteKey] = userReg[seiteKey]);

        userReg = userRegNeu;
        console.log("wird geschrieben");
        writeRegJSON(app, `${migRootKl} _ ${instODef}`, userRegNeu);
    }

}
*/

/**
 * 
 */

function vergleicheMitRegUndSetAktiveAktion(userReg, finalSeite, aktionNr) {
    /*
    const erlaubteUserAuswahl = {
        e:  [0,1,3],
        ne: [0,2  ]
    }
    */

    const aktionenAuswahl = {
        e: { 
            f: {
                a: {
        // key = analysierte Aktion: Werte = erlaubte User Aktion
                    "0": [3],
                    "3": [0]
                },
                na: {
                    "0": [1,3],
                    "1": [0,3],
                    "3": [0,1],
                }
            },
            nf: {
                na: {
                    "0": [3],
                    "3": [0]
                }
            }
        },
        ne: {
            f: {
                na: {
                    "0": [2],
                    "2": [0]
                }
            },
            nf: {
                na: {
                    "0": [2],
                    "2": [0],
                }
            }
        }
    };


    finalSeite.auswertung.analyseAktion = aktionNr;

    const key = finalSeite.normInfos.name;
    let regUpdaten = null;

    

    if (userReg.hasOwnProperty(key)) {

        const userAuswahlGetroffen = 
            typeof userReg[key].userAuswahl === "number" 
                && !Number.isNaN(userReg[key].userAuswahl);

        //console.log("SEITE " + key + " / auswhal: " + userReg[key].userAuswahl + " / AUSWAHL GWETROFFEN " + userAuswahlGetroffen + " & TYPEOF auswahl " + typeof userReg[key].userAuswahl)

        if (userAuswahlGetroffen) {

            /*console.log(key + " / alyAkt: " + finalSeite.auswertung.analyseAktion + 
                " / exists: " + finalSeite.normInfos.exists +
                " / user auswahl erlaubt: " + erlaubteUserAuswahl[`${finalSeite.normInfos.exists ? "e" : "ne"}`]
                //erlaubteUserAuswahl[`${finalSeite.auswertung.analyseAktion}`][`${finalSeite.normInfos.exists ? "e" : "ne"}`]
            );*/
            
            const existsKey = finalSeite.normInfos.exists ? "e" : "ne";
            const felderKey = finalSeite.auswertung.neueFelderErstellt > 0 ? "f" : "nf";
            const aktuellKey = finalSeite.auswertung.alleFelderAktuell ? "a" : "na";
            const analyseAktionKey = finalSeite.auswertung.analyseAktion;
            const aktionenAuswahlCheck = 
                aktionenAuswahl[existsKey][felderKey][aktuellKey][analyseAktionKey]
                //erlaubteUserAuswahl[`${finalSeite.auswertung.analyseAktion}`][`${finalSeite.normInfos.exists ? "e" : "ne"}`]
                    .some(erlaubt => erlaubt === userReg[key].userAuswahl);

            /*console.log(key + " / user auswahl erlaubt: " + userAuswahlErlaubt);*/
            
            if (aktionenAuswahlCheck) {

                finalSeite.auswertung.aktiveAktion = 
                    userReg[key].userAuswahl;
                finalSeite.auswertung.userAuswahlAktion =
                    userReg[key].userAuswahl;
            }

            else { // user auswahl nicht erlaubt

                regUpdaten = true;

                userReg[key].userAuswahl = null;
                
                finalSeite.auswertung.aktiveAktion = 
                    finalSeite.auswertung.analyseAktion;
                finalSeite.auswertung.userAuswahlAktion = null;
            }
            
        }

        else { // user auswahl = null

            finalSeite.auswertung.aktiveAktion = 
                    finalSeite.auswertung.analyseAktion;
                
            finalSeite.auswertung.userAuswahlAktion =
                    null;

        }
    }

    
    else { // Seite nicht in userAuswahlReg

                
        finalSeite.auswertung.aktiveAktion = 
            finalSeite.auswertung.analyseAktion;

        finalSeite.auswertung.userAuswahlAktion = null;
    }

    
    return regUpdaten;
    
}


/** 
 * 
 */

async function getAnalyseAuswertungUndUserReg(deps, sammelUndMeldungenObjs) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // REGELN
    const { migRootKl, instODef, EIGENE_REGELN } = REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    

    /*Object.entries(REGELN_felderUWerte).forEach(([key, entry]) => {
        //console.log("REGEL-KEYS: " + key + ": " + entry);
    });*/

    const {sammelObjekt, meldungenObjekt, abweichendeASeiten} = sammelUndMeldungenObjs;

    const userReg = await readRegJSON(app, `${migRootKl} _ ${instODef}`) ?? {};
    let regUpdaten = null;
    
    const analyseObjekt = {};
    

    const finalAnzahl = {
        suchseiten: 0,
        gesamt: 0,
        status: {
            e: {
                f: {
                    a: {
                        "0": 0,
                        "3": 0
                    },
                    na: {
                        "0": 0,
                        "1": 0,
                        "3": 0
                    }
                },
                nf: {
                    na: {
                        "0": 0,
                        "3": 0
                    }
                }
            },
            ne: {
                f: {
                    na: {
                        "0": 0,
                        "2": 0
                    }
                },
                nf: {
                    na: {
                        "0": 0,
                        "2": 0
                    }
                }
            }
        },
        statusGes: {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0
        },
        ltAnalyseZuErstellende: {
            ne: {
                f: {
                    na: {
                // key = aktiveAktion: gezählt wird = analyseAktion
                        "0": 0, 
                        "2": 0
                    }
                },
                nf: {
                    na: {
                        "0": 0,
                        "2": 0
                    }
                }
            }
        }
    };
    

    function vergleichUndSetAktionAusfuehren(finalSeite, aktionNr) {

        const regCheckBackVal = vergleicheMitRegUndSetAktiveAktion(userReg, finalSeite, aktionNr);
        
        if (regCheckBackVal) 
            regUpdaten = true;
        
        const existsKey        = finalSeite.normInfos.exists ? "e" : "ne";
        const felderKey        = finalSeite.auswertung.neueFelderErstellt > 0 ? "f" : "nf";
        const aktuellKey       = finalSeite.auswertung.alleFelderAktuell ? "a" : "na";
        const aktiveAktionKey  = Number(finalSeite.auswertung.aktiveAktion);
        const analyseAktionKey = Number(finalSeite.auswertung.analyseAktion);

        finalAnzahl.status[existsKey][felderKey][aktuellKey][aktiveAktionKey] += 1;
        finalAnzahl.statusGes[aktiveAktionKey] += 1;
        if (analyseAktionKey === 2)
            finalAnzahl.ltAnalyseZuErstellende.ne[felderKey].na += 1;
    }

    // SAMMEL-OBJEKT auswerten

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        finalAnzahl.gesamt += 1;
        
        const finalSeite = getEmptyFinalSeiteObj("sammel", entry);

        //console.log("SAMMELSEITE: KEY: " + key + ", entry.pseudeoNorm: " + entry.normInfos.name + ", finalSeite: " + finalSeite.normInfos?.name);

        
        // Neue Werte in neue Felder
        getNeueWerteInFinalFelder(deps, entry, finalSeite);

        
        // Auswertung
        getFinalFelderAktuellAuswertung(finalSeite);

        
        // in Reg Vorhanden

        
        if (finalSeite.normInfos.exists) {

            if (!finalSeite.auswertung.alleFelderAktuell) {

                vergleichUndSetAktionAusfuehren(finalSeite, 1);
            }

            else {

                vergleichUndSetAktionAusfuehren(finalSeite, 0);
            }
        }

        else {

            vergleichUndSetAktionAusfuehren(finalSeite, 2);
        }

        
        // AN analyseObjekt anhängen
        analyseObjekt[key] = finalSeite;
        
    });


    // MELDUNGEN-OBJEKT auswerten
    
    Object.entries(meldungenObjekt).forEach(([key, entry]) => {
        
        //console.log("SEITE" + key)

        
        if (!analyseObjekt.hasOwnProperty(key)) {

            finalAnzahl.gesamt += 1;

            const finalSeite = getEmptyFinalSeiteObj("meldungen", entry);

            //console.log("MELDUNG-SEITE: KEY: " + key + ", entry.norm: " + entry.normInfos.name + ", finalSeite: " + finalSeite.normInfos?.name);

            // Neue Werte in neue Felder
            getNeueWerteInFinalFelder(deps, entry, finalSeite);

            // Auswertung
            getFinalFelderAktuellAuswertung(finalSeite);

            if (finalSeite.normInfos.exists) {

                vergleichUndSetAktionAusfuehren(finalSeite, 3);

            }

            else {

                vergleichUndSetAktionAusfuehren(finalSeite, 0);
            }

            // AN analyseObjekt anhängen
            analyseObjekt[key] = finalSeite;
        }
            
    });
    

    // ABWEICHEND-OBJEKT auswerten
    
    Object.entries(abweichendeASeiten).forEach(([key, entry]) => {


        if (!analyseObjekt.hasOwnProperty(key)) {

            finalAnzahl.gesamt += 1;
            


            const finalSeite = getEmptyFinalSeiteObj("abweichend", entry);


            if (finalSeite.normInfos.exists) {

                vergleichUndSetAktionAusfuehren(finalSeite, 3);
            }

            else {

                vergleichUndSetAktionAusfuehren(finalSeite, 0);
            }

            analyseObjekt[key] = finalSeite;
        }
    });

    Object.keys(analyseObjekt).forEach(key => {

        if (!userReg.hasOwnProperty(key)) {

            userReg[key] = {userAuswahl: null, inAnalyseObjekt: true};
            regUpdaten = true;
        }

        else {

            if (!userReg[key].hasOwnProperty("inAnalyseObjekt")) {

                userReg[key].inAnalyseObjekt = true;
                regUpdaten = true;
            }
        }
    });

    Object.entries(userReg).forEach(([key, entry]) => {

        if (!analyseObjekt.hasOwnProperty(key)) {
        
            if (!userReg[key].hasOwnProperty("inAnalyseObjekt")) {

                userReg[key].inAnalyseObjekt = null;
                regUpdaten = true;
            }
        }
    });

    if (regUpdaten) {
        
        console.log("REG SCHREIBEN");
        writeRegJSON(app, `${migRootKl} _ ${instODef}`, userReg);
    }
    
    return {
        analyseObjekt,
        finalAnzahl,
        userReg
    };
}



/** muss für die aktuelle Version (migManagerTest5) nicht mehr exportiert werden
 * 
 */

export function getEmptyFinalSeiteObj(objID, entry, leer = null) {

    return {
        finalSeiteAusObj: !leer ? new Set([objID]) : new Set([]),
        neueFelderUndWerte: {},
        neueFelderInSeiteAktuell: {},
        normInfos: { 
            exists: !leer ? entry.normInfos.exists : null,
            name: !leer ? entry.normInfos.name : null,
            path: !leer ? entry.normInfos.path : null,
            tFile: !leer ? entry.normInfos.tFile : null
        },
        feldIst: !leer ? entry.feldIst : [],
        meldungen: !leer ? entry.meldungen : [],
        auswertung: {

                                        // 0 keine Aktion, 1 updaten, 2 erstellen, 3 loeschen
            // aktiveAktion: 0, 
            // userAuswahlAktion: 0,
            analyseAktion: 0, 
                                        // aktuell?
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

            if (finalSeite.normInfos.exists) {

                const neuesFeldInSeite = einzelnesFeldLesen(app, finalSeite.normInfos, neuesFeld) ?? [];

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

        //console.log(analyse.aNormInfos.name)

        // NSEITE je nach anzahl meldungen an SAMMEL- oder MELDUNGEN
        const gesammelteNSeite = {
            normInfos: { exists: null },
            feldIst: [],
            neueWerte: {...analyse.neueWerte},
            meldungen: [...analyse.meldungen]
        };
        
        
        // wenn nSeiteAbweichend ASEITE an ABWEICHENDE aSeiten
        const gesammelteASeite = { normInfos: { exists: null }};

        const anzahlMeldungen = [...analyse.meldungen].filter(mel => mel).length;

        if (analyse.nSeiteAbweichend) {

            //console.log("analyse.nSeiteAbweichend BEI "+ analyse.aNormInfos.name + " / EXISTS" + analyse.aNormInfos.exists)

            
            gesammelteASeite.normInfos.exists = analyse.aNormInfos.exists;
            gesammelteASeite.normInfos.name = analyse.aNormInfos.name;
            gesammelteASeite.normInfos.path = analyse.aNormInfos.path;
            gesammelteASeite.normInfos.tFile = analyse.aNormInfos.tFile;
            gesammelteASeite.feldIst = [...analyse.aSeiteFeldIst];
            gesammelteASeite.neueWerte = {...analyse.neueWerte};
            gesammelteASeite.meldungen = [...analyse.meldungen];

            const nNorm = getPageNormObject(app, dv, `${analyse.nSeite}.md`);

            gesammelteNSeite.normInfos.exists = nNorm.exists;
            gesammelteNSeite.normInfos.name = nNorm.name;
            gesammelteNSeite.normInfos.path = nNorm.path;
            gesammelteNSeite.normInfos.tFile = nNorm.tFile;
            
            if (gesammelteNSeite.normInfos.exists) {

                gesammelteNSeite.feldIst = einzelnesFeldLesen(app, gesammelteNSeite.normInfos, "ist");

                
            }
            
        }
        
        // nSeite nicht abweichend
        else {
            //console.log("NICHT ABWEICH: " + analyse.aNormInfos.name)
            
            gesammelteNSeite.normInfos = analyse.aNormInfos;
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

        
        // ABWEICHENDE nSEITE =/= aSEITE
        if (analyse.nSeiteAbweichend && !abweichendeASeiten.hasOwnProperty(analyse.aSeite)) {

            //console.log(analyse.nSeite)

            const istTyp = REGELN_erwarteteTypen.includes(analyse.nSeite);
            if (!istTyp)
                abweichendeASeiten[analyse.aSeite] = gesammelteASeite;
        }

        
    });


    
    REGELN_erwarteteTypen.forEach(erwTyp => {
        const sammelObjektHatTyp = sammelObjekt.hasOwnProperty(erwTyp);
        const meldungenObjektHatTyp = meldungenObjekt.hasOwnProperty(erwTyp);
        const abweichendObjektHatTyp = abweichendeASeiten.hasOwnProperty(erwTyp);
        if (sammelObjektHatTyp)
            delete sammelObjekt[erwTyp];
        if (meldungenObjektHatTyp)
            delete meldungenObjekt[erwTyp];
        if (abweichendObjektHatTyp)
            delete abweichendeASeiten[erwTyp];
    });


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

                 //console.log("PARENT: " + parentPath + " / GerandParent Path: " + grandParentPath);

                
                const gesammelteNSeite = {
                    normInfos: { exists: null },
                    feldIst: [],
                    neueWerte: {...entry.neueWerte},
                    meldungen: [...entry.meldungen]
                };


                const norm = getPageNormObject(app, dv, parentPath);

                
                sammelObjekt[parentPath] = {
                    normInfos: { exists: null },
                    // norm: getPageNormObject(app, dv, parentPath),
                    feldIst: [],
                    neueWerte: {},
                    meldungen: []
                };

                
                sammelObjekt[parentPath].normInfos.exists = norm.exists;
                sammelObjekt[parentPath].normInfos.name = norm.name;
                sammelObjekt[parentPath].normInfos.path = norm.path;
                sammelObjekt[parentPath].normInfos.tFile = norm.tFile;

                
                if (sammelObjekt[parentPath].normInfos.exists) {
                    sammelObjekt[parentPath].feldIst = 
                                                // bevor ich zu xy geändert habe, war hier
                                                // sammelObjekt[parentPath].norm.path drin -
                                                // ich schätze mal, das war ein Fehler, da die
                                                // Funktion eigentlich ein norm-Objekt erwartet
                        einzelnesFeldLesen(app, sammelObjekt[parentPath].normInfos, "ist") ?? [];
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
        aNormInfos: {
            exists: null,
            name: null,
            path: null,
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

    
    if (!analyse.aNormInfos.exists) {

        analyse.meldungen.push({
            // meldung514
            info: `die suchseite "${suchseitePath}" existiert nicht`
        });

        delete analyse.erkannteCheckWerte;
        return analyse;
    }
    

    getNeueWerteAusErkanntenCheckWerten(deps, analyse);

    const meldungenLetzter = [...analyse.meldungen].filter(mel => mel.fuerKey === "letzter");
    //console.log("meldungenLetzter: " + meldungenLetzter.length)

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
            return getNeueWertePathsAusCW(deps, cwe.aNormInfos.name);
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
            analyse.neueWerte.pstatus.add(cwert.aNormInfos.name);
        }
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {

            //console.log("erkanntAls " + cwert.erkanntAls +": " + cwert.norm.name);
            
            // Die Frage ist, ob ich für jeden Wert einzeln ein uniqueSet machen muss
            // und wenn das leet bleibt, nichtP hinzufügen? - NEIN, glaube nicht.

            const pAnalyse = {
                aSeite: cwert.aNormInfos.name,
                aNormInfos: {
                    exists: cwert.aNormInfos.exists,
                    name: cwert.aNormInfos.name,
                    path: cwert.aNormInfos.path,
                    tFile: cwert.aNormInfos.tFile
                },
                neueWerte: {
                    pstatus: new Set()
                },
                meldungen: []
            };

            getNormSeiteUndErkannteCheckWerte(deps, pAnalyse, true);

            pAnalyse.erkannteCheckWerte.forEach(cwrt => {

                // console.log("pAnalyse.erkannteCheckWerte: " + cwrt.norm?.name);

                if (cwrt.erkanntAls === 4) {
                    pAnalyse.neueWerte.pstatus.add(cwrt.aNormInfos.name);
                    analyse.neueWerte.pstatus.add(cwrt.aNormInfos.name);
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

    // const aNormInfos = { exists: null, tFile: null };
    // let norm = { exists: null };

    if (!analyse.aNormInfos.exists) {

        const norm = getPageNormObject(app, dv, analyse.aSeitePath);
    
        analyse.aNormInfos.exists = norm.exists ?? null;
        analyse.aSeite                  = norm.exists ? norm.name : null;
        analyse.aNormInfos.name   = norm.exists ? norm.name : null;
        analyse.aNormInfos.path   = norm.exists ? norm.path : null;
        analyse.aNormInfos.tFile  = norm.exists ? norm.tFile : null;
    }
    
    if (!analyse.aNormInfos.exists)
        return;


    analyse.aSeite = analyse.aNormInfos.name;

    const feldIstUndCWerte = getFeldIstUndCheckWerteAusSeite(deps, analyse.aNormInfos, REGEL_wieFuerMigDef);

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
            
            //console.log(`${cwe.aNormInfos.name} gehört nicht zur migRootKl und ist kein pstatus`);

            analyse.meldungen.push({
                //meldung514
                info: `${cwe.aNormInfos.name} gehört nicht zur migRootKl und ist kein pstatus`
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
        return { wert: checkWertRaw, aNormInfos: { exists: null }, erkanntAls: 0 }; // 0 = existiert nicht
    }
    
    const aNormInfos = {
        exists: checkWertNorm.exists,
        path: checkWertNorm.path,
        name: checkWertNorm.name,
        tFile: checkWertNorm.tFile
    };

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
        return { wert: checkWertRaw, aNormInfos, erkanntAls: 1 } // 1 = "migRootKl"
    }
    else if (defInMigRootKl) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 2);
        return { wert: checkWertRaw, aNormInfos, erkanntAls: 2 }; // 2 = "migDef in migRootKl"
    }
    else if (istPStat) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 3);
        return { wert: checkWertRaw, aNormInfos, erkanntAls: 3 }; // 3 = "p-Status"
    }
    else if (defInPStat || istNichtP){
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 4);
        return { wert: checkWertRaw, aNormInfos, erkanntAls: 4 }; // 4 = "p-migDef in p-Status oder nicht-p"
    }
    else {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 5);
        return { wert: checkWertRaw, aNormInfos, erkanntAls: 5 }; // what5ver
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

