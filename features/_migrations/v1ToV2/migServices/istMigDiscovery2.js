
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         checkObSeiteHatFeld, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { queryMigInstsODefs}    from "./v1QueryService.js";



/** feld `ist` Migration Discovery:

 ** für REGELN, mig-Root-Klasse und "Instanzen oder Definitionen"

 *  REGELN-Objekt erzeugen (heißt hier RGLuINF, vielleicht ändern) mit 
    - migRootKl, 
    - "Instanzen oder Definitionen", 
    - MIGRGL_ROOT (beinhaltet Regeln für Instanzen und Definitionen, + InstODef-Key = EIGENE_REGELN,
      also die Regeln für die hier zu bearbeitenden Instanzen ODER Definitionen der jeweiligen mig-Root-Klasse)
    - erwarteteTypen-REGEL
    - migRootKl als NormSeite
    - p-Status als NormSeite
    - nicht-p als NormSeite         // wird, glaube ich, nicht gebraucht

 *  REGELN + InstODef => getCheckSeiten = Suchergebnis-Seiten für Instanzen oder Definitionen 
    der jeweiligen mig-Root-Klasse.

 *  aus diesem Array: einzelne Suchergebnis-Seite => einzelneSeiteAnalysieren = ... analyse ...

 *  verwendet:
    - getCheckSeiten
    - einzelneSeiteAnalysieren
 */

export function istMigDiscovery2(app, dv, MIG_REGELN, migRootKl, instODef) {

    // REGELN UND INFOS
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
    }

    const deps = { 
        app, 
        dv, 
        REGELN, 
        INSToDEF_KEY: instODef
    };

    // (1) AUSGÄNGLICHE SUCHSEITEN
    const checkSeitenSet = getCheckSeiten(deps);
    
    if (checkSeitenSet.size < 1)
        return


    // (2) EINZELNE-SEITEN-ANALYSE
    const analysierteSeiten = [...checkSeitenSet].map(checkSeite => {
        
        const analysierteSeite = einzelneSeiteAnalysieren(deps, checkSeite);
        
        /*/CONSOLE
        console.log(`analysierte Seite: ${analysierteSeite.analysierteSeite}

            FINAL SEITE: ${analysierteSeite.finalSeite}

            analysierteSeiteAbweichend: ${analysierteSeite.analysierteSeiteAbweichend}

            erstellt durch: ${[...Object.keys(analysierteSeite.erstelltDurch)]}
            `);
        //*/
        
        
        /*/CONSOLE
        console.log(`ANALYSIERTE SEITE: ${analysierteSeite.analysierteSeite}`)
        analysierteSeite.meldungen.forEach(asMeldung => {
            console.log(`MELDUNG für die Seite ${asMeldung.finalSeite}: ${asMeldung.regelFeld} / ${asMeldung.info}`);
        });
        //*/

        return analysierteSeite;
    });

    // (3) SAMMEL-OBJEKT ERSTELLEN
    const sammelObjekt = sammelObjektAusASeiten(deps, [...analysierteSeiten]);

    const sammelObjekt2 = erlaubterTypZuRootParentsSchieben(deps, sammelObjekt);

    // (4) WERTE IN NEUE FELDER + SEITEN PRÜFEN
    //const finalObjekt = finalObjektAusSammelObjekt(deps, sammelObjekt2);

    
}



/**
 * 
 */

function finalObjektAusSammelObjekt(deps, sammelObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        //CONLOG
        console.log("FINAL-OBJEKT ERSTELLEN, SEITE AN SAMMEL-OBJEKT: " + key);
        //*/


    });
}


/**
 * 
 */

function sammelObjektAusASeiten(deps, analysierteSeiten) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    // Aus den REGELN
    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";

    // wenn letzter === "seite", ist vorletzter ein parent-Feld


    const sammelObjekt = {};

    analysierteSeiten.forEach(aSeite => {

        /*/CONLOG
        console.log(aSeite.analysierteSeite)
        //*/

        const finaleSeiteVorhanden = aSeite.finalSeite;

        console.log(aSeite.finalSeite   )

        if (finaleSeiteVorhanden) {

            if (sammelObjekt.hasOwnProperty(aSeite.finalSeite)) {

                const erstelltDurch = sammelObjekt[aSeite.finalSeite].erstelltDurch;
                
                Object.entries(aSeite.erstelltDurch).forEach(([key, entry]) => {

                    if (erstelltDurch.hasOwnProperty(key)) {
                        erstelltDurch[key].anzahl += 1;
                    }

                });

            } 

            else {

                sammelObjekt[aSeite.finalSeite] = {
                    norm: !!aSeite.analysierteSeiteAbweichend ? null : aSeite.norm,
                    analysierteSeite: aSeite.analysierteSeite,
                    analysierteSeiteAbweichend: aSeite.analysierteSeiteAbweichend,
                    erstelltDurch: aSeite.erstelltDurch,
                    feldIst: aSeite.feldIst,
                    seitenWerteNeu: aSeite.seitenWerteNeu,
                    meldungen: aSeite.meldungen
                };

            }

        }

        
    });

    if (!!REGELN_letzterIstNeueSeite) {
        unregistrierteParentsHinzufuegen(deps, sammelObjekt);
    }

    return sammelObjekt;

}



/**
 * 
 */


function erlaubterTypZuRootParentsSchieben(deps, sammelObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const feldErlaubterTypVorhanden = felderUndWerte.erster === "erlaubterTyp";

    if (!feldErlaubterTypVorhanden)
        return sammelObjekt;

    const rootParents = {};
    const children = {};

    // rootParents und children sammeln
    
    Object.entries(sammelObjekt).forEach(([key, entry]) => {

         console.log("SAMMEL SEITE " + key)

        const seitenWerteNeu = entry.seitenWerteNeu;
        const parentArr = [...seitenWerteNeu.vorletzter];
        const hatParent = !!parentArr[0];

        if (!hatParent) {
            
           // console.log("HAT KEIN PAR: " +key)

            rootParents[key] = entry;
        }
        else {
            children[key] = entry;

           //console.log("HAT PAR: " +key)
        }
    });
    


    
    Object.keys(rootParents).forEach(rootParentKey => {
        
        const childrenKeys = Object.keys(children).filter(key => key.startsWith(rootParentKey));
        
        
        console.log("ROOT PART" + rootParentKey)

        console.log("LÄNGE CHILDKEYS" + Object.keys(children).length)
        console.log("LÄNGE CHILDKEYS STARTSWITH" + childrenKeys.length)


        childrenKeys.forEach(childKey => {

            const erlaubterTypChild = sammelObjekt[childKey].seitenWerteNeu.erster;



            //console.log("ERSTER : " +[...sammelObjekt[childKey].seitenWerteNeu.erster])

            
            erlaubterTypChild.forEach(typ => {
                
                //console.log("verschobener typ:"  + typ + " / von " + childKey + " zu " + rootKey);
                sammelObjekt[rootParentKey].seitenWerteNeu.erster.add(typ);
            });
            
            
            //console.log("SAMMEL " + rootKey + " HAS CHILD KEY: " + childKey + " : " + sammelObjekt.hasOwnProperty(childKey))
            //console.log("CHIULD KEY " + childKey + " HAT PROPERT " + Object.keys(sammelObjekt[childKey]))
            //console.log("WERTE NEU HAT PROP " + Object.keys(sammelObjekt[childKey].seitenWerteNeu))
            

            if (sammelObjekt[childKey].seitenWerteNeu.erster.size > 0) {
                
               console.log("CHILD WERTE " + [...sammelObjekt[childKey].seitenWerteNeu.erster])
                
                
                
                
                // delete sammelObjekt[childKey].seitenWerteNeu.erster;
            }
        });
        
        
    });
    

    return sammelObjekt;
    
}


/**
 * 
 */

function unregistrierteParentsHinzufuegen(deps, sammelObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const neueParentsHinzugefuegtReg = new Set;

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        console.log("PARENTS HINZUFUEGEN: CHILD: " + key);
        
        
        // wenn es keine meldung für vorletzter gibt, 
        // dürfte eigebtlich nur ein wert in vorletzter sein
        const parentMeldungen = [...entry.meldungen].filter(mel => {
            return mel.regelFeld === "vorletzter";
        });

        // ich prüfe trotzdem beides.. 
        if (parentMeldungen.length === 0 && entry.seitenWerteNeu.vorletzter.size === 1) {
            
            const parentPath = [...entry.seitenWerteNeu.vorletzter][0];


            console.log("Parent Path: " + parentPath + "REAL EXISTS: " + !!parentPath);

        
            // parent bereits am sammelObjekt und/oder unregistrierteParernts vorhanden?
            const parentIstInSammelObjekt = sammelObjekt.hasOwnProperty(parentPath);
            const neuerParentBereitsRegistriert = neueParentsHinzugefuegtReg.has(parentPath);
            
            if (!parentIstInSammelObjekt && !neuerParentBereitsRegistriert) {

                const grandParentPath = getGrandParent(parentPath);

                sammelObjekt[parentPath] = {
                    norm: null,
                    analysierteSeite: null,
                    analysierteSeiteAbweichend: null,
                    erstelltDurch: {},
                    feldIst: null,
                    seitenWerteNeu: {},
                    meldungen: []
                };

                sammelObjekt[parentPath].erstelltDurch[key] = {
                    aktion: "parents erstellen",
                    anzahl: 1
                };
                
                Object.entries(entry.seitenWerteNeu).forEach(([childNWKey, childNWEntry]) => {
                    
                    if (childNWKey === "letzter")
                        sammelObjekt[parentPath].seitenWerteNeu.letzter = new Set([parentPath]);
                    
                    if (childNWKey === "vorletzter") {
                        sammelObjekt[parentPath].seitenWerteNeu.vorletzter = grandParentPath
                            ? new Set([grandParentPath])
                            : new Set();
                    }
                    
                    if (childNWKey !== "letzter" && childNWKey !== "vorletzter") {
                        sammelObjekt[parentPath].seitenWerteNeu[childNWKey] = childNWEntry;
                    }
                });

                
                console.log("Parent Path: " + parentPath);
                

                neueParentsHinzugefuegtReg.add(parentPath);
            }
        }
    });

    
    console.log("neuParREG ANZAHL: " + neueParentsHinzugefuegtReg.size);
    

    if (neueParentsHinzugefuegtReg.size > 0) {
        
    
        neueParentsHinzugefuegtReg.forEach(pn => console.log("NEU PARENT REG: " + pn));
    

        unregistrierteParentsHinzufuegen(deps, sammelObjekt);
    }

    else return sammelObjekt;
}



/**
 * 
 */

function getGrandParent(parent) {

    const parentArr = parent.split(" _ ");
    let grandParent = "";
    
    if (parentArr.length > 1) {
        for (let i = 0; i < parentArr.length; i++) {
            if (i < parentArr.length-1)
                grandParent += `${parentArr[i]} _ `;
            else
                grandParent += `${parentArr[i]}`;
        }
    }
    else grandParent = null;
    
    return grandParent;
}



/** einzelne Suchergebnis-Seite

 *  analyse-Objekt erzeugen mit
    - Pfad der Seite,
    - NormSeite,
    - alte Werte
      - feld ist
      - checkWerte
    - felderUndWerte aus REGELN
    - neue Werte: {}

 *  für die Seite => einzelneSeiteCWerkennen = NormSeite 
    für die Seite erzeugen und ihre checkWerte erkennen

    wenn SeiteNorm nicht existiert, analyse-Obj zurückgeben
    sonst NormSeite, feld ist und checkWerte zu analyse-Obj hinzufügen
    
 *  neue Felder und Werte-Objekt erzeugen: {}
   
 */

function einzelneSeiteAnalysieren(deps, seitePath) {



    const { app, dv, REGELN, INSToDEF_KEY } = deps;
    
    // Aus den REGELN
    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";
    
    const REGELN_erwarteteTypen = REGELN.erwarteteTypen;
    

    const analyse = {
        pfad: seitePath,
        analysierteSeite: null,
        analysierteSeiteAbweichend: null,
        erstelltDurch: {},
        norm: null,
        finalSeite: null,
        feldIst: [],
        checkWerteErkannt: [],
        checkWerteNeuArr: [],
        seitenWerteNeu: {},
        meldungen: []
    };

    // seitePath => seiteCWerteErkannt: Obj{ sPath,  sNorm, feldIst, checkWerte }
    const erkannteSeiteundCWerte = einzelneSeiteUndCWerkennen(deps, seitePath);
    
    // normSeite existiert nicht => return
    if (!erkannteSeiteundCWerte.norm)
        return analyse;

    // erkannte checkWerte an Analyse weitergeben 
    analyse.norm = erkannteSeiteundCWerte.norm;
    analyse.analysierteSeite = erkannteSeiteundCWerte.norm.name;
    analyse.feldIst = erkannteSeiteundCWerte.feldIst;
    analyse.checkWerteErkannt = erkannteSeiteundCWerte.checkWerte;

    analyse.erstelltDurch[analyse.analysierteSeite] = {
        aktion: new Set(["Seitenanalyse"]),
        anzahl: 1
    };

    // Keys aus Regeln: [migRootKl, artPath, erster, letzter, vorletzter, pstatus]
    const RGL_Keys = Object.keys(REGELN_felderUWerte);

    const cw0u5erMelden = [...erkannteSeiteundCWerte.checkWerte]
        .filter(cw => cw.erkanntAls === 0 || cw.erkanntAls === 5)
        .forEach(cw0o5 => {



            if (cw0o5.erkanntAls === 0) {
                const meldung = { 
                    analysierteSeite: analyse.analysierteSeite,
                    finalSeite: null,
                    regelFeld: null, 
                    info: ` ${cw0o5.wert} existiert nicht.`
                };
                analyse.meldungen.push(meldung);
            }

            else {
                const meldung = { 
                    analysierteSeite: analyse.analysierteSeite,
                    finalSeite: null,
                    regelFeld: null, 
                    info: ` ${cw0o5.norm.name} gehört nicht zur migRootKl und ist kein pstatus.`
                };
                analyse.meldungen.push(meldung);
            }
        });

    const cw2erNeueWerteKandidaten = [...erkannteSeiteundCWerte.checkWerte]
        .filter(cw => cw.erkanntAls === 2);

    analyse.checkWerteNeuArr = cw2erNeueWerteKandidaten
        .map(cw2er => getNeueWerte(deps, cw2er.norm.name));

    // const seitenWerteNeu = {};

    RGL_Keys.forEach(key => { // [migRootKl, artPath, erster, letzter, vorletzter, pstatus]
        
        // wenn für den entsprechenden Regel-Key ein Feld vorhanden ist, bspw. 
        // migRootKl: inKlasse / artPath: inFeld (also nicht null) / erster: typ usw.
        if (!!REGELN_felderUWerte[key]) {

            if (key === "migRootKl") {
                analyse.seitenWerteNeu[key] = new Set();
                analyse.seitenWerteNeu[key].add(migRootKl);
            }

            else if (key === "artPath") {
                analyse.seitenWerteNeu[key] = new Set();
                analyse.seitenWerteNeu[key].add("art");
            }

            else if (key === "erster") {

                analyse.seitenWerteNeu[key] = getErsterSet(deps, analyse.checkWerteNeuArr, analyse.meldungen, analyse.analysierteSeite);
            }

            else if (key === "letzter") {
 
                analyse.seitenWerteNeu[key] = getLetzterSet(deps, analyse.checkWerteNeuArr, analyse.meldungen, analyse.analysierteSeite);
            }

            else if (key === "vorletzter") {

                analyse.seitenWerteNeu[key] = getVorletzterSet(deps, analyse.checkWerteNeuArr, analyse.meldungen, analyse.analysierteSeite);
            }

            else if (key === "pstatus") {
                analyse.seitenWerteNeu[key] = getUniquePStatus(deps, analyse.checkWerteErkannt, analyse.meldungen, analyse.analysierteSeite);
            }
        }
    });



    if (REGELN_letzterIstNeueSeite && analyse.seitenWerteNeu.letzter.size === 1) {

        const finalSeite = [...analyse.seitenWerteNeu.letzter][0];
        analyse.finalSeite = finalSeite;

        if (finalSeite !== analyse.analysierteSeite)
            analyse.analysierteSeiteAbweichend = true;

        analyse.meldungen.forEach(mel => {
            mel.finalSeite = finalSeite;
        });


    } else {

        analyse.finalSeite = analyse.analysierteSeite;

        analyse.meldungen.forEach(mel => {
            mel.finalSeite = analyse.analysierteSeite;
        });

    }

    const istSelbstMigRoot = analyse.finalSeite === migRootKl;
    const beginntMitRootKl = analyse.finalSeite.startsWith(migRootKl);
    const istTyp = REGELN_erwarteteTypen.includes(analyse.finalSeite);

    if (istSelbstMigRoot) {
        const meldung = {
            analysierteSeite: analyse.analysierteSeite,
            finalSeite: analyse.finalSeite,
            regelFeld: null,
            info: ` ${analyse.finalSeite} ist selbst migRootKl.`
        };
        analyse.meldungen.push(meldung);
        analyse.finalSeite = null;
    }

    if (istTyp) {
        const meldung = {
            analysierteSeite: analyse.analysierteSeite,
            finalSeite: analyse.finalSeite,
            regelFeld: null,
            info: ` ${analyse.finalSeite} ist typ.`
        };
        analyse.meldungen.push(meldung);
        analyse.finalSeite = null;
    }
       


   
    return analyse;
    
}



/**
 * 
 */

function getErsterSet(deps, checkWerteNeuArr, meldungen, seiteName) {
    
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const REGELN_erwarteteTypen = REGELN.erwarteteTypen;

    const ersterSet = new Set();

    checkWerteNeuArr.forEach(nw => {
        const typErwartet = REGELN_erwarteteTypen.includes(nw.erster);
        
        if (!typErwartet) {
            const meldung = { 
                analysierteSeite: seiteName,
                finalSeite: null,
                regelFeld: "erster", 
                info: `Nicht erwarteter Typ: ${nw.erster}.`
            };
            meldungen.push(meldung);
        }

        else
            ersterSet.add(nw.erster);
    });

    /*/CONLOG
    console.log("ERSTER SET: " + [...ersterSet]);
    //*/

    return ersterSet;
}



/**
 * 
 */

function getLetzterSet(deps, checkWerteNeuArr, meldungen, seiteName) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUWerte = EIGENE_REGELN.felderUndWerte;
    const REGELN_letzterIstNeueSeite = REGELN_felderUWerte.letzter === "seite";

    const letzterSet = new Set();

    checkWerteNeuArr.forEach(nw => {

        const istSelbstMigRoot = nw.letzter === migRootKl;
        const beginntMitRootKl = nw.letzter.startsWith(migRootKl);

        // console.log("letzter Wert: " + nw.letzter + " / migRootKl: " + migRootKl + " / nichtMigRoot: " + nichtMigRoot)
        if (!istSelbstMigRoot && beginntMitRootKl) 
            letzterSet.add(nw.letzter);
        
        else if (istSelbstMigRoot) {
            const meldung = { 
                analysierteSeite: seiteName,
                finalSeite: null,
                regelFeld: "letzter", 
                info: `${nw.letzter} ist selbst die rootKl-Seite (${migRootKl}).`
            };
            meldungen.push(meldung);
        }

        else if (!beginntMitRootKl) {
            const meldung = { 
                analysierteSeite: seiteName,
                finalSeite: null,
                regelFeld: "letzter", 
                info: `${nw.letzter} beginnt nicht mit migRootKl (${migRootKl}).`
            };
            meldungen.push(meldung);
        }
    });

    if (REGELN_letzterIstNeueSeite && letzterSet.size > 1) {
        const meldung = { 
            analysierteSeite: seiteName,
            finalSeite: null,
            regelFeld: "letzter", 
            info: `Final-Seite = letzter, mehr als ein Wert in letzter: ${[...letzterSet]}.`
        };
        meldungen.push(meldung);
    }

    /*/CONLOG
    console.log("LETZTER SET: " + [...letzterSet]);
    //*/

    return letzterSet;
}



/**
 * 
 */

function getVorletzterSet(deps, checkWerteNeuArr, meldungen, seiteName) {
    
    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const migRootKl = REGELN.migRootKl;

    const vorletzterSet = new Set();
    
    checkWerteNeuArr.forEach(nw => {

        const istSelbstMigRoot = nw.vorletzter === migRootKl;
        const beginntMitRootKl = nw.vorletzter.startsWith(migRootKl);

        // bei vorletzter müssen nicht zwingend meldungenh erstellt werden, 
        // wenn istSelbstMigRoot oder beginntMitRootKl, oder?

        if (!!nw.vorletzter && !istSelbstMigRoot && beginntMitRootKl)
            vorletzterSet.add(nw.vorletzter);
    });

    if (vorletzterSet.size > 1) {
        const meldung = { 
            analysierteSeite: seiteName,
            finalSeite: null,
            regelFeld: "vorletzter",
            info: `Mehr als ein parent: ${[...vorletzterSet]}.`
        };
        analyse.meldungen.push(meldung);
    }

    /*/CONLOG
    console.log("VORLETZTER SET: " + [...vorletzterSet]);
    //*/

    return vorletzterSet;
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

function getUniquePStatus(deps, checkWerte, meldungen, seiteName) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const nichtP = REGELN.nichtPNorm.name;

    const uniquePSet = new Set();

    checkWerte.forEach(cwert => {
        
        if (cwert.erkanntAls === 4)
            uniquePSet.add(cwert.norm.name);
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {
            
            // Die Frage ist, ob ich für jeden Wert einzeln ein uniqueSet machen muss
            // und wenn das leet bleibt, nichtP hinzufügen?

            const erkannteSeiteUndCWerte = einzelneSeiteUndCWerkennen(deps, cwert.norm.path);
            
            erkannteSeiteUndCWerte.checkWerte.forEach(cwrt => {

                if (cwrt.erkanntAls === 4)
                    uniquePSet.add(cwrt.norm.name);
            })
        }

    });

    
    if (uniquePSet.size === 0)
        uniquePSet.add(nichtP);

    if (uniquePSet.size >1) {
        const meldung = { 
            analysierteSeite: seiteName,
            finalSeite: null,
            regelFeld: "pstatus",
            info: `Mehr als ein (${uniquePSet.size}) p-Status (${[...uniquePSet]}).`
        };
        meldungen.push(meldung);
    }
    
    /*/CONLOG
    console.log("PSTATUS-SET: " + [...uniquePSet]);
    //*/

    return uniquePSet;
}



/** für einzelnen checkWert
 *  name-String bei " _ " teilen, " (p)" entfernen
    gemäß REGELN index1 entfernen
    erstellen und als Obj zurückgeben:
    {erster, letzter, vorletzter} 
    
 */

function getNeueWerte(deps, checkWertName) {

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



/** einzelner checkWert pstatus-Check
 */

function einzelnerCWpStatCheck(app, dv, RGLuINF, RGL_KEY, norm) {

    const uniquePs = new Set();

    const feldIst = (einzelnesFeldLesen(app, norm, "ist") ?? [])
        .map(istWertRaw => {
            
            const cwErkannt = einzelnenCheckWertErkennen(app, dv, RGLuINF, RGL_KEY, istWertRaw);
            if (cwErkannt.erkanntAls === 4)
                uniquePs.add(cwertErkannt.norm.path);



            if (norm.exists) return norm;
            return null;
        })
        .filter(Boolean);
}




/** einzelne Suchergebnis-Seite: checkWerte erkennen:

 *  Für einzelne Seite wird geprüft:
    existiert?

    Seite => getCheckWerteArr besorgt die checkWerte (Feld ist + gemäß Regeln Seite selbt)
    Für jeden Wert in diesem Array => einzelnenCheckWertErkennen = 0,1,2,3,4,5

 *  return {
        sPath,
        sNorm: exists? norm :null,
        feldIst,                        // Feld ist Raw
        checkWerte: Array mit erkannten checkWerten {norm, feldIst, erkanntAls: 0||1||2||3||4||5 }
    }

 *  verwendet FN:
    - getCheckWerteArr
    - einzelnenCheckWertErkennen
 */

function einzelneSeiteUndCWerkennen(deps, seitePath) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    /*/CONSOLE
    console.log("einzelneSeiteUndCWerkennen: Seite: "  + seitePath)
    //*/

    const einzelneSeiteNorm = getPageNormObject(app, dv, seitePath);
    const exists = einzelneSeiteNorm.exists;

    const cwerteErkanntObj = {
        pfad: seitePath,
        norm: null,
        feldIst: [],
        checkWerte: []
    };
    
    if (!exists) 
        return cwerteErkanntObj;

    cwerteErkanntObj.norm = einzelneSeiteNorm;

    //console.log("checkWerteErkennen: Seite: " + einzelneSeiteNorm.name);
        
    const checkWerteArr = getCheckWerteArr(deps, einzelneSeiteNorm);

    cwerteErkanntObj.feldIst = checkWerteArr.feldIst;

    checkWerteArr.checkWerte.forEach(checkWert => {
        const cwertErkannt = einzelnenCheckWertErkennen(deps, checkWert);
        cwerteErkanntObj.checkWerte.push(cwertErkannt);
    });
    
    return cwerteErkanntObj;
}



/** getCheckWerte-Arr:
 *  return { 
        feldIst,        // Feld ist Raw
        checkWerte      // Feld ist gemäß REGEL + Seite selbst
    }

 *  Für eine einzelne Suchergebnis-Seite: Liest das Feld ist 
    und gibt anhand der REGELN nur die ist-Werte als Array 
    oder ist-Werte + die Seite selbst.path zurück
    (REGEL: Bei OntDef und SemTax-Kategorie wird die Seite 
    selbst hinzugefügt, z.B. Inhalt _ Text _ Buch / 
    Gegenstand _ Werkzeug _ Software _ DAW / 
    Kategorie _ Wissenschaft _ Philosophie)
 */

function getCheckWerteArr(deps, einzelneSeiteNorm) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const feldIst = einzelnesFeldLesen(app, einzelneSeiteNorm, "ist") ?? [];
    
    /*
    console.log("getCheckWerteArr: RGL_KEY: " + RGL_KEY);
    console.log("getCheckWerteArr: checkInklSeite: " + RGLuINF.EIGENE_REGELN.checkInklSeite);
    */
    
    const checkWerte = REGELN.EIGENE_REGELN.checkInklSeite
        ? [einzelneSeiteNorm.path, ...feldIst]
        : feldIst;
    
    return {
        feldIst,
        checkWerte
    }
}



/** einzelnen checkWert erkennen: 
    { norm, erkanntAls: 0,1,2,3,4,5 }
 */

function einzelnenCheckWertErkennen(deps, checkWertRaw) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const { migRootKlNorm, rootPStatNorm, nichtPNorm } = REGELN;

    const checkWertPath = resolveLinkPath(app, checkWertRaw);
    const checkWertNorm = getPageNormObject(app, dv, checkWertPath);
    if (!checkWertNorm.exists) {
        //console.log("checkWert erkennen: checkWertRaw: "+checkWertRaw +" / erkanntAls: " + 0);
        return { wert: checkWertRaw, norm: null, erkanntAls: 0 };
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



/** getCheckSeiten: Mig-Root-Klasse + REGELN => Suchergebnisse-Array

 *  Sucht die mig-Instanzen oder mig-Definitionen der jeweiligen migRootKl.
    Bei ziel "ontDef" werden alle als 2 erkannte checkWerte aller Inst-Seiten unique hinzugefügt.
    
 *  Erklärung: checkSeiten = Alle Suchergebnisse für die jeweiligen mig-Instanzen oder 
    mig-Definitionen einer mig-Root-Klasse, z.B. Aristokratie, Neoliberalismus, Wohlstandsverteilung usw.
    ODER Inhalt _ Text _ Buch, Inhalt _ Audio _ Podcast _ Podcastfolge usw. ODER Kategorie _ Wissenschaft,
    Kategorie _ Politik _ Bildungspolitik usw. 

    Gibt es in den REGELN für die mig-Inst oder mig-Def einer mig-Root-Klasse kein ziel
    (bzw. Regeln für die mig-Inst oder mig-Def selbst existieren überhaupt nicht für diese mig-Root-Klasse, 
    wie das bspw. bei Kategorie > mig-Def oder Thema > mig-Def der Fall ist), wird ein leeres Set zurückgegeben.

    Anonsten wird die Suche via queryMigInstsODefs gemäß der mig-Root-Klasse und dem in den Regeln
    angegebenen Ziel ("inst", "ontDef" oder "semTax") ausgeführt.

    ---
(i) Für Ziel "ontDef" kommt noch ein Schritt, der vermutlich redundant ist:
    Es werden zusätzlich via queryMigInstsODefs alle mig-Inst gesucht, deren Feld ist ausgelsen 
    und entsprechnde checkWerte geprüft, alle 2er-Werte (also Definitionen die zur jeweiligen 
    mig-Root-Klasse gehören) werden zu den Suchergebnissen der "ontDef" hinzugefügt. 

    Der Hintergedanke ist, dass eine Inst im Feld ist Definitionen enthalten könnte, die 
    in der Suche nach den "ontDef" nicht gefunden würden. Das ist aber gar nicht möglich,
    da die Instanzen ja von queryMigInstsODefs zunächst anhand der Definitionen gesucht werden:
    Suche alle Definitionen > Suche alle Instanzen, die zu diesen Definitionen linken. 
    Für eine Instanz, die gefunden wird, muss also bereits eine entsprechende Definition 
    existieren. 

    Oder ist es denkbar, dass eine Instanz zusätzlich eine Definition enthält, die nicht
    als Definition gefunden wurde? Nur, wenn eine Definition im Feld ist eingetragen ist,
    zu der keine Seite existiert. In dem Fall würde aber der entsprechende checkWert nicht
    als 2er Wert erkannt, sondern als 0 - und somit hier auch nicht den "ontDef" hinzugefügt.
    ---

 *  verwendet FN:
    - einzelneSeiteCWerkennen
 */

function getCheckSeiten(deps) {

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

    const checkSeitenSet = new Set();

    if (!EIGENE_REGELN.ziel)
        return checkSeitenSet;

    queryMigInstsODefs(dv, REGELN.migRootKl, EIGENE_REGELN.ziel)
        .forEach(path => checkSeitenSet.add(path));

    
    if (EIGENE_REGELN.ziel === "ontDef") {
        
        
        queryMigInstsODefs(dv, REGELN.migRootKl, "inst")
            .forEach(einzelSPath => {
                //console.log("zusätzlich gefundene inst: " + einzelSPath);

                const sCWerkannt = einzelneSeiteUndCWerkennen({app, dv, REGELN, INSToDEF_KEY: "migInst"}, einzelSPath);

                sCWerkannt.checkWerte.forEach(cwert => {
                    //console.log("zusätzliche inst checkWerte => .erkanntAls " + cwert.erkanntAls)
                    if (cwert.erkanntAls === 2)
                        checkSeitenSet.add(cwert.norm.path)
                })
            });
        
        
    }
    
    /*
    console.log("checkSeitenSet: ");
    checkSeitenSet.forEach(val => console.log(val));
    */
    
    return checkSeitenSet;
}

