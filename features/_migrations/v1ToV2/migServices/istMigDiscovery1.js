
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

export function istMigDiscovery1(app, dv, MIG_REGELN, migRootKl, instODef) {

    // REGELN UND INFOS
    const MIGRGL_ROOT = MIG_REGELN[migRootKl];
    const EIGENE_REGELN = MIGRGL_ROOT[instODef];
    const REGELN_felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const neueSeiteAusWerten = REGELN_felderUndWerte?.letzter === "seite";
    const erwarteteTypen = MIGRGL_ROOT.erwarteteTypen;

    const migRootKlNorm = getPageNormObject(app, dv, migRootKl);
    const rootPStatNorm  = getPageNormObject(app, dv, "p-Status.md");
    const nichtPNorm  = getPageNormObject(app, dv, "nicht-p-Eintrag.md");
    
    const RGLuINF = {
        migRootKl,
        instODef,
        EIGENE_REGELN,
        erwarteteTypen,
        migRootKlNorm,
        rootPStatNorm,
        nichtPNorm
    }

    const checkSeitenSet = getCheckSeiten(app, dv, RGLuINF, instODef);

    
    if (checkSeitenSet.size < 1)
        return

    const analysierteSeiten = [...checkSeitenSet].map(checkSeite => {
        const as = einzelneSeiteAnalysieren(app, dv, RGLuINF, instODef, checkSeite);
        
        /*/CONSOLE
        as.meldungen.forEach(asMeldung => console.log(`MELDUNG für die Seite ${as.name}: ${asMeldung.ursprung} / ${asMeldung.info}`))
        //*/

        return as;
    });

    const sammelObjektUndMeldungen = sammelObjAusASeitenErstellen(app, dv, RGLuINF, instODef, analysierteSeiten);
    const { sammelObjekt, meldungen } = sammelObjektUndMeldungen;

    delete sammelObjekt[migRootKl];

    erwarteteTypenChecken(app, dv, RGLuINF, instODef, sammelObjekt, meldungen);

    /*/CONSOLE
    meldungen.forEach(mel => {
        const { ursprung, info } = mel;
        console.log("MELDUNG: " + ursprung + " / " + info);
    })
    //*/

    erlaubterTypZuRootParentsSchieben(app, dv, RGLuINF, instODef, sammelObjekt);

    //CONSOLE
    Object.entries(sammelObjekt).forEach(([key, entry]) => {
        console.log(key);
        Object.entries(entry).forEach(([key, entry]) => {
            console.log(key)
        })
    })
    //*/


}


/**
 * 
 */

function erlaubterTypZuRootParentsSchieben(app, dv, RGLuINF, RGL_KEY, sammelObjekt) {

    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;
    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const feldErlaubterTypVorhanden = felderUndWerte.erster === "erlaubterTyp";

    if (!feldErlaubterTypVorhanden)
        return sammelObjekt;

    const rootParents = {};
    const children = {};

    // rootParents und children sammeln
    Object.entries(sammelObjekt).forEach(([key, entry]) => {
        const neueFelderAlteWerte = entry.neueFelderAlteWerte;
        const parentArr = [...neueFelderAlteWerte.vorletzter];
        const hatParent = !!parentArr[0];

        if (!hatParent) {
            // console.log("==Seite==: " + key + "ohne Parent");
            rootParents[key] = entry;
        }
        else {
            children[key] = entry;
        }
    });

    Object.keys(rootParents).forEach(rootKey => {
        const childrenKeys = Object.keys(children).filter(key => key.startsWith(rootKey));
        // console.log("Root-Parent: " + rootKey + " / children: " + childrenKeys);

        childrenKeys.forEach(ck => {
            const erlaubterTypChild = sammelObjekt[ck].neueFelderAlteWerte.erster;
            erlaubterTypChild.forEach(typ => {
                // console.log("verschobener typ:"  + typ + " / von " + ck + " zu " + rootKey);
                sammelObjekt[rootKey].neueFelderAlteWerte.erster.add(typ);
            });
            delete sammelObjekt[ck].neueFelderAlteWerte.erster;
        });
    });

    return sammelObjekt;
}


/**
 * 
 */

function erwarteteTypenChecken(app, dv, RGLuINF, RGL_KEY, sammelObjekt, meldungen) {
    
    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;
    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const erwarteteTypen = RGLuINF.erwarteteTypen;

    if (!felderUndWerte.erster) 
        return;

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        //console.log("ERW_TYPEN_CHECKEN: sammelObjekt.key: " + key);

        const neueFelderAlteWerte = entry.neueFelderAlteWerte;
        const erster = neueFelderAlteWerte.erster;
        erster.forEach(typVal => {
            
            const typKorrekt = erwarteteTypen.includes(typVal);

            // console.log("key = Seite: " + key + " / erster=typVal: " + typVal + " / typKorrekt: " + typKorrekt);
            if (!typKorrekt) {

                //console.log(`ERW_TYPEN_CHECKEN >>> TYP NICHT KORREKT: Die Seite ${key} enthät den nicht erwarteten typ ${typVal}`)

                const meldung = { 
                    ursprung: "erwartete Typen Checken", 
                    info: `Die Seite ${key} enthät den nicht erwarteten typ ${typVal}` 
                };

                meldungen.push(meldung);
            }

            
            
        });
    })
}


/**
 * 
 */

function sammelObjAusASeitenErstellen(app, dv, RGLuINF, RGL_KEY, analysierteSeiten) {

    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;
    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const neueSeiteAusWerten = felderUndWerte.letzter === "seite";
    const feldErlaubterTypVorhanden = felderUndWerte.erster === "erlaubterTyp";
    const erwarteteTypen = RGLuINF.erwarteteTypen;
    
    const sammelObjekt = {};
    const meldungen = [];
    
    //console.log("neueSeiteAusWerten: " + neueSeiteAusWerten);

    if (neueSeiteAusWerten) {
        analysierteSeiten.forEach(as => {
            /*/CONSOLE
            console.log("SEITE: " + as.name);
            Object.entries(as.seitenWerteNeu).forEach(([key, entry]) => {
                console.log(key + ": " + [...entry]);
            })
            //*/
            
            const neueSeiteSet = as.seitenWerteNeu.letzter;
            // console.log("ANALYSIERTE SEITE: " + as.name + " / nSSet: " + [...as.seitenWerteNeu.letzter]);

            if (neueSeiteSet.size > 1) {
                const meldung = { 
                    ursprung: "Sammel-Objekt aus analysierten Seiten erstellen", 
                    info: `Aus ${as.name} soll die neue Seite aus Neu-Wert 'letzter' erstellt werden, aber mehr als eine Seite in Neu-Wert 'letzter'` 
                };
                meldungen.push(meldung);
            }
            else {
                // console.log("neueSeite-Set: " + [...neueSeiteSet][0])
                const neueSeite = [...neueSeiteSet][0];
                
                let keineTypenOderWieErwartet = true;
                if (feldErlaubterTypVorhanden) {
                    as.seitenWerteNeu.erster.forEach(typ => {
                        const typKorrekt = erwarteteTypen.includes(typ);
                        if (!typKorrekt) {
                            keineTypenOderWieErwartet = null;
                            const meldung = {
                                ursprung: "Sammel-Objekt aus analysierten Seiten erstellen > erwarteter Typ?",
                                info: `Die Seite ${as.name} enthät den nicht erwarteten typ ${typ}`
                            };
                            meldungen.push(meldung);
                        }
                    })
                }

                if (keineTypenOderWieErwartet) {
                    sammelObjekt[neueSeite] = {neueFelderAlteWerte: {}};
                    const neueFelderAlteWerteObj = sammelObjekt[neueSeite].neueFelderAlteWerte;
                    
                    Object.entries(as.seitenWerteNeu).forEach(([key, entry]) => {
                        if (key !== "letzter")
                            neueFelderAlteWerteObj[key] = entry;
                    });
                }
            }
        });
    }

    else {
        analysierteSeiten.forEach(as => {
            
            const neueSeite = as.name;
            sammelObjekt[neueSeite] = {neueFelderAlteWerte: {}};
            const neueFelderAlteWerteObj = sammelObjekt[neueSeite].neueFelderAlteWerte;
            
            Object.entries(as.seitenWerteNeu).forEach(([key, entry]) => {
                neueFelderAlteWerteObj[key] = entry;
            });
        });
    }

    /*/CONSOLE
    Object.entries(sammelObjekt).forEach(([seiteKey, seiteEntry]) => {
        console.log("==SEITE:== " + seiteKey);
        Object.entries(seiteEntry.neueFelderAlteWerte).forEach(([mKey, mEntry]) => {
            console.log(mKey + ": " + mEntry);
        });
    });
    //*/
    
    unregistrierteParentsHinzufuegen(app, dv, RGLuINF, RGL_KEY, sammelObjekt);

    return { sammelObjekt, meldungen };
}


    /**
 * 
 */

function unregistrierteParentsHinzufuegen(app, dv, RGLuINF, RGL_KEY, sammelObjekt) {

    const unregistrierteParentsObj = {};

    Object.entries(sammelObjekt).forEach(([key, entry]) => {
        
        const parentArr = !!entry.neueFelderAlteWerte.vorletzter
            ? [...entry.neueFelderAlteWerte.vorletzter]
            : [];

        if (parentArr.length > 1) {
            const meldung = { ursprung: "unregistrierte Parents Hinzufuegen", info: "mehr als ein Parent" };
        }

        else if (parentArr.length > 0 && !!parentArr[0]) {
            const parent = parentArr[0];
            const parentRegistriert = sammelObjekt.hasOwnProperty(parent);
            const parentErfasstAlsUnregistriert = unregistrierteParentsObj.hasOwnProperty(parent);
            
            if (!parentRegistriert && !parentErfasstAlsUnregistriert) {
                unregistrierteParentsObj[parent] = {neueFelderAlteWerte: {}};
                const neueFelderAlteWerteObj = unregistrierteParentsObj[parent].neueFelderAlteWerte;

                const grandParentSet = new Set();
                const grandParent = getGrandParent(parent);
                if (!!grandParent)
                    grandParentSet.add(grandParent);
                
                //console.log("grandPAr" + grandParent);
                
                Object.entries(entry.neueFelderAlteWerte).forEach(([neuKey, neuEntry]) => {
                    if (neuKey === "vorletzter")
                        neueFelderAlteWerteObj[neuKey] = grandParentSet;
                    else 
                        neueFelderAlteWerteObj[neuKey] = neuEntry;
                })

            }
            
        }
    });

    const anzahlUnregistrierteParents = Object.keys(unregistrierteParentsObj).length;

    if (anzahlUnregistrierteParents > 0) {
        Object.entries(unregistrierteParentsObj).forEach(([key, entry]) => {
            // console.log("key unregPar" + key)
            sammelObjekt[key] = entry;
        });

        unregistrierteParentsHinzufuegen(app, dv, RGLuINF, RGL_KEY, sammelObjekt);
    }
    else {
        // console.log("return unregPar");
        return sammelObjekt;
    }
        
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

function einzelneSeiteAnalysieren(app, dv, RGLuINF, RGL_KEY, seitePath) {

    /*/CONSOLE
    console.log("einzelne Seite analysieren: Seite: " + seitePath);
    //*/

    // Aus den REGELN
    const migRootKl = RGLuINF.migRootKl;
    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;
    const RGL_felderUWerte = EIGENE_REGELN.felderUndWerte;
    

    /** analyse-Objekt
     */

    const analyse = {
        pfad: seitePath,
        name: null,
        norm: null,
        feldIst: [],
        checkWerteErkannt: [],
        RGL_felderUWerte,
        checkWerteNeuArr: [],
        seitenWerteNeu: {},
        meldungen: []
    };

    // seitePath => seiteCWerteErkannt: Obj{ sPath,  sNorm, feldIst, checkWerte }
    const erkannteSeiteundCWerte = einzelneSeiteUndCWerkennen(app, dv, RGLuINF, RGL_KEY, seitePath);
    
    // normSeite existiert nicht => return
    if (!erkannteSeiteundCWerte.norm)
        return analyse;

    // erkannte checkWerte an Analyse weitergeben 
    analyse.norm = erkannteSeiteundCWerte.norm;
    analyse.name = erkannteSeiteundCWerte.norm.name;
    analyse.feldIst = erkannteSeiteundCWerte.feldIst;
    analyse.checkWerteErkannt = erkannteSeiteundCWerte.checkWerte;

    /*/CONSOLE
    console.log("analyse.name: "+ analyse.name)
    analyse.checkWerteErkannt.forEach(cw => console.log(cw.wert + ", erkannt als " + cw.erkanntAls));
    //*/

    // *** Neue-Felder und Werte-Objekt *** //
    const seitenWerteNeu = {};

    /*  Objekte / Arrays insgesamt:
        - analyse               //  enthält alles => RETURN-Objekt
        - neueWerteSets   //  wird später zu analyse.neueWWerte, enthält zunächst (s.u.)
                                    die endgültigen Felder und Werte, also
                                    - klasse | inKlasse | stKlasse: migRootKl
                                    - inFeld: art
                                    - typ | erlaubterTyp: neue Werte_erster
                                    - art | Seite: neue Werte_letzter
                                    - parent | stParent: neue Werte_vorletzter
                                    - pstatus: unique p-Status
        
        - RGL_KeysArr           // [migRootKl, artPath, erster, letzter, vorletzter, pstatus]

    */
    
    // Keys aus Regeln: [migRootKl, artPath, erster, letzter, vorletzter, pstatus]
    const RGL_Keys = Object.keys(RGL_felderUWerte);

    /*CONSOLE
    console.log("Regel-Keys: ")
    RGL_KeysArr.forEach(key => {
        console.log("Regel-Key: " + key);
        console.log("Feld: " + RGL_felderUWerte[key]);
    });
    //*/

    const cw2erNeueWerteKandidaten = [...erkannteSeiteundCWerte.checkWerte]
        .filter(cw => cw.erkanntAls === 2);

    const neueWerteArr = cw2erNeueWerteKandidaten
        .map(cw2er => getNeueWerte(app, dv, RGLuINF, RGL_KEY, cw2er.norm.name));

    analyse.checkWerteNeuArr = neueWerteArr;

    /*CONSOLE
    neueWerteArr.forEach(nw => console.log("letzter: " + nw.letzter))
    //*/

    // ** neueWerteSets bearbeiten:
    //  * => erhält Keys gemäß Regeln = new Set()
    //  * => erhält Standard-Werte: migRootKl, inFeld/artPath, pstatus gemäß Regeln

    RGL_Keys.forEach(key => { // [migRootKl, artPath, erster, letzter, vorletzter, pstatus]
        
        // wenn für den entsprechenden Regel-Key ein Feld vorhanden ist, bspw. 
        // migRootKl: inKlasse / artPath: inFeld (also nicht null) / erster: typ usw.
        if (!!RGL_felderUWerte[key]) {

            const regelKey = key; /* /!\ */ 
            // statt feldAusRgl = RGL_felderUWerte[key] jetzt doch einfach nur regelKey = key 
            // genommen, weil das in den folgenden schritten leichter ist, wenn ich
            // bspw. vorletzter statt parent ODER stParent benutzen kann
            
            seitenWerteNeu[regelKey] = new Set();
            
            if (key === "migRootKl") {
                seitenWerteNeu[regelKey].add(migRootKl);
            }
            else if (key === "artPath") {
                seitenWerteNeu[regelKey].add("art");
            }
            else if (key === "erster") {
                neueWerteArr.forEach(nw => seitenWerteNeu[regelKey].add(nw.erster));
            }
            else if (key === "letzter") {
                neueWerteArr.forEach(nw => {
                    const nichtMigRoot = nw.letzter !== migRootKl;
                    // console.log("letzter Wert: " + nw.letzter + " / migRootKl: " + migRootKl + " / nichtMigRoot: " + nichtMigRoot)
                        if (nichtMigRoot) 
                            seitenWerteNeu[regelKey].add(nw.letzter);
                });
            }
            else if (key === "vorletzter") {
                neueWerteArr.forEach(nw => seitenWerteNeu[regelKey].add(nw.vorletzter));
            }
            else if (key === "pstatus") {
                const uniquePSet = getAlleUniquePStatus(app, dv, RGLuINF, RGL_KEY, erkannteSeiteundCWerte.checkWerte);
                const mehrAlsEinP = uniquePSet.size >1;
                if (mehrAlsEinP) {
                    const meldung = { 
                        ursprung: "einzelne Seite analysieren > unique p-Status", 
                        info: `${[...uniquePSet]} hat mehr als einen (${uniquePSet.size}) p-Status`
                    };
                    analyse.meldungen.push(meldung);
                }
                
                seitenWerteNeu[regelKey] = uniquePSet;
            }
        }
    });

    analyse.seitenWerteNeu = seitenWerteNeu;
    
    return analyse;
    
}



/** für einzelnen checkWertNorm (warum Norm und wo erstellt?)
 
 *  name-String bei " _ " teilen, " (p)" entfernen
    gemäß REGELN index1 entfernen
    erstellen und als Obj zurückgeben:
    {erster, letzter, vorletzter} 
    
 */

function getNeueWerte(app, dv, RGLuINF, RGL_KEY, checkWertName) {
    
    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;
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

    /*
    Object.keys(neuPathsObj).forEach(key => {
        neueWertePaths[key] = !!neuPathsObj[key]
            ? neuPathsObj[key]
            : null;
    })
    */
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

function getAlleUniquePStatus(app, dv, RGLuINF, RGL_KEY, checkWerte) {

    const nichtP = RGLuINF.nichtPNorm.name;

    const uniquePSet = new Set();

    checkWerte.forEach(cwert => {
        
        if (cwert.erkanntAls === 4)
            uniquePSet.add(cwert.norm.name);
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {
            
            const erkannteSeiteUndCWerte = einzelneSeiteUndCWerkennen(app, dv, RGLuINF, RGL_KEY, cwert.norm.path);
            
            erkannteSeiteUndCWerte.checkWerte.forEach(cwrt => {

                if (cwrt.erkanntAls === 4)
                    uniquePSet.add(cwrt.norm.name);
            })
        }

    });

    
    if (uniquePSet.size === 0)
        uniquePSet.add(nichtP);

    return uniquePSet;
}


/** einzelner checkWert pstatus-Check
 */
/*
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
*/



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

function einzelneSeiteUndCWerkennen(app, dv, RGLuINF, RGL_KEY, seitePath) {

    /*/CONSOLE
    console.log("einzelneSeiteUndCWerkennen: Seite: "  + seitePath)
    //*/

    const einzelneSeiteNorm = getPageNormObject(app, dv, seitePath);
    const exists = einzelneSeiteNorm.exists;

    const cwerteErkanntObj = {
        pfad: seitePath,
        norm: exists ? einzelneSeiteNorm : null,
        feldIst: [],
        checkWerte: []
    };
    
    if (!exists) 
        return cwerteErkanntObj;

    //console.log("checkWerteErkennen: Seite: " + einzelneSeiteNorm.name);
        
    const checkWerteArr = getCheckWerteArr(app, RGLuINF, RGL_KEY, einzelneSeiteNorm);

    cwerteErkanntObj.feldIst = checkWerteArr.feldIst;

    checkWerteArr.checkWerte.forEach(checkWert => {
        const cwertErkannt = einzelnenCheckWertErkennen(app, dv, RGLuINF, RGL_KEY, checkWert);
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

function getCheckWerteArr(app, RGLuINF, RGL_KEY, einzelneSeiteNorm) {

    const feldIst = einzelnesFeldLesen(app, einzelneSeiteNorm, "ist") ?? [];
    
    /*
    console.log("getCheckWerteArr: RGL_KEY: " + RGL_KEY);
    console.log("getCheckWerteArr: checkInklSeite: " + RGLuINF.EIGENE_REGELN.checkInklSeite);
    */
    
    const checkWerte = RGLuINF.EIGENE_REGELN.checkInklSeite
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

function einzelnenCheckWertErkennen(app, dv, RGLuINF, RGL_KEY, checkWertRaw) {

    const {migRootKlNorm, rootPStatNorm, nichtPNorm} = RGLuINF;

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
    else if (defInPStat){
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 4);
        return { wert: checkWertRaw, norm: checkWertNorm, erkanntAls: 4 }; // 4 = "p-migDef in p-Status"
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

function getCheckSeiten(app, dv, RGLuINF, RGL_KEY) {

    const EIGENE_REGELN = RGLuINF.EIGENE_REGELN;

    //console.log("EIGENE_REGELN: ziel: " + EIGENE_REGELN.ziel);

    const checkSeitenSet = new Set();

    if (!EIGENE_REGELN.ziel)
        return checkSeitenSet;

    queryMigInstsODefs(dv, RGLuINF.migRootKl, EIGENE_REGELN.ziel)
        .forEach(path => checkSeitenSet.add(path));

    
    if (EIGENE_REGELN.ziel === "ontDef") {
        
        
        queryMigInstsODefs(dv, RGLuINF.migRootKl, "inst")
            .forEach(einzelSPath => {
                //console.log("zusätzlich gefundene inst: " + einzelSPath);

                const sCWerkannt = einzelneSeiteUndCWerkennen(app, dv, RGLuINF, "migInst", einzelSPath);

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