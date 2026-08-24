
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
        as.meldungen.forEach(asMeldung => console.log(`MELDUNG für die Seite ${as.name}: ${asMeldung.ursprung} / ${asMeldung.info}`))
        //*/
        return analysierteSeite;
    });

    
    // (3) SAMMEL-OBJEKT: NEUE-SEITEN + neue Werte in "alten Feldern" also Regel-Keys
    const sammelObjektUndMeldungen = sammelObjAusASeitenErstellen(deps, analysierteSeiten);
    const { sammelObjekt, meldungen } = sammelObjektUndMeldungen;

    delete sammelObjekt[migRootKl];

    erwarteteTypenChecken(deps, sammelObjekt, meldungen);

    erlaubterTypZuRootParentsSchieben(deps, sammelObjekt);
    
    /*/CONSOLE: sammelObjekt
    Object.entries(sammelObjekt).forEach(([key, entry]) => {
        console.log(key);
        Object.entries(entry).forEach(([key, entry]) => {
            console.log(key)
        });
    });
    //*/

    
    // (4) NEUE-SEITEN-FINAL-OBJEKT
    const final = getFinalMitNeuenWertenUFeldern(deps, sammelObjekt);

    neueFelderUWerteInFinalChecken(deps, final);

    /*/CON: final
    Object.entries(final).forEach(([seiteKey, seiteEntry]) => {
        console.log("==SEITE==:" + seiteKey);
        
        const neueFelderUndWerte = seiteEntry.neueFelderUndWerte;

        Object.entries(neueFelderUndWerte).forEach(([nfuwKey, nfuwEntry]) => {
            console.log(nfuwKey + ": " + nfuwEntry);
        });
        
        const felderCheck = seiteEntry.felderCheck;

        console.log(">>>>>>> felderCheck <<<<<<<<");
        Object.entries(felderCheck).forEach(([fcKey, fcEntry]) => {
            console.log("Neues Feld-Key: " + fcKey);
            
            console.log("Einzelnes Feld-Check: ");

            Object.entries(fcEntry).forEach(([checkKey, checkEntry]) => {
                console.log(checkKey + ": " + checkEntry);
            })
        });
        
    });
    //*/

    const seitenLoeschen = {};

    analysierteSeiten.forEach(aSeite => {
        
        console.log("aSeite: " + aSeite.name)
        
        const aSeiteInFinal = final.hasOwnProperty(aSeite.name);

        aSeite.meldungen.forEach(mel => {
            /*/CON
            console.log("SEITE: " + aSeite.name + ", MELDUNG: " + 
                "Seitenangabe in Meldung: " + mel.seite +
                ". Ursprung: " + mel.ursprung +
                ". Info: " + mel.info
            )
            //*/

            if (aSeiteInFinal) {
                final[aSeite.name].auswertung.meldungen.push(mel);
                
                /*/CON
                console.log(`Eine Meldung aus der Seite ${mel.seite} wird in das finale Objekt (Seitenauswertung) geschoben: '${mel.ursprung}. ${mel.info}'`);
                //*/

            } else {
                meldungen.push(mel);

                /*/CON
                console.log(`Eine Meldung aus der Seite ${mel.seite} wird in den separaten Array geschoben: '${mel.ursprung}. ${mel.info}'`);
                //*/

            }
        });

        
        /*/CON: seite nicht im final
        console.log(`Die Seite ${aSeite.name} ist ${aSeiteInFinal ? "" : "nicht "}im Final-Objekt enthalten.`);
        //*/
        if (!aSeiteInFinal) {
            seitenLoeschen[aSeite.name] = { 
                norm: aSeite.norm,  
                auswertung: { 
                    vorgeseheneAktion: "löschen"
                } 
            };
        }
        
    });

    /*/CON: meldungen
    meldungen.forEach(mel => {
        const { seite, ursprung, info } = mel;
        console.log("MELDUNG für die Seite " + seite + ". Ursprung der Meldung: " + ursprung + ". Meldung: " + info);
    })
    //*/

    /*/CON
    Object.keys(seitenLoeschen).forEach(key => console.log("LÖSCHEN-KEY: " + key));

    Object.entries(final).forEach(([seiteKey, seiteEntry]) => {
        
        console.log("SEITE " + seiteKey)
        
        const exists = seiteEntry.exists;
        const felderCheck = seiteEntry.felderCheck;
        const auswertung = seiteEntry.auswertung;

        Object.entries(auswertung).forEach(([key, entry]) => {

            console.log(key + ": " + entry)

        })

        let felderUWerteBereitsNeuAnz = 0;
        let neueFelderUWerteNochNichtDaAnz = 0;

        Object.entries(felderCheck).forEach(([fcKey, fcEntry]) => {
            console.log("FELD " + fcKey);
            const wertInFeldBereitsNeu = fcEntry.wertInFeldBereitsNeu;
            //console.log("wertInFeldBereitsNeu: " + wertInFeldBereitsNeu);

            if (wertInFeldBereitsNeu)
                felderUWerteBereitsNeuAnz += 1;
            else neueFelderUWerteNochNichtDaAnz += 1;

            //Object.entries(fcEntry).forEach(([checkKey, checkEntry], i) => {
            //    console.log("CHECK"+(i+1) +": " + checkKey + ": " + checkEntry)
            //})
        
        });

        console.log("feldWerteNeu: " + felderUWerteBereitsNeuAnz + ". feldWerte alt: " + neueFelderUWerteNochNichtDaAnz)
        
    });
    //*/
}


/**
 * 
 */

function neueFelderUWerteInFinalChecken(deps, finalObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    Object.entries(finalObjekt).forEach(([seiteKey, seiteEntry]) => {
        
        const exists = !!seiteEntry.exists;
        const normSeite = seiteEntry.norm;
        const neueFelderUndWerte = seiteEntry.neueFelderUndWerte;
                
        const felderCheck = {};

        Object.entries(neueFelderUndWerte).forEach(([nFWKey, nFWEntry]) => {

            felderCheck[nFWKey] = { 
                neuerWert: nFWEntry, 
                feldVorhanden: null,
                wertInFeld: [], 
                wertInFeldBereitsNeu: null 
            };

            if (exists) {

                const feldLesen = einzelnesFeldLesen(app, normSeite, nFWKey) ?? [];
                felderCheck[nFWKey].wertInFeld = feldLesen;
                felderCheck[nFWKey].feldVorhanden = feldLesen.length > 0 && !!feldLesen[0];
                
                if (felderCheck[nFWKey].feldVorhanden) {

                    const werteAusFeldNorm = [...felderCheck[nFWKey].wertInFeld].map(val => {
                        const nFWPfad = resolveLinkPath(app, val);
                        const nFWNorm = getPageNormObject(app, dv, nFWPfad);
                        return nFWNorm.name;
                    });
                    
                    felderCheck[nFWKey].wertInFeldBereitsNeu = 
                        werteAusFeldNorm.length === nFWEntry.length && 
                        werteAusFeldNorm.every((val, index) => val === nFWEntry[index]);
                }

            }

        });

        finalObjekt[seiteKey].auswertung.anzahlNeuSchonVorhanden = 0;
        finalObjekt[seiteKey].auswertung.anzahlNeuFehlenNoch = 0;
        
        Object.entries(felderCheck).forEach(([key, entry]) => {
            //console.log(">>>>>>>>>>>>>> SEITE: " + seiteKey + " >>>>>>>> felderCHeck - key: " + key + " >>>>>>>> ENTRY: " + entry);
            if (!!entry.wertInFeldBereitsNeu) {
                // console.log("anzahlFelderNeu: " + anzahlFelderNeu);
                finalObjekt[seiteKey].auswertung.anzahlNeuSchonVorhanden += 1;
            }
            else 
                finalObjekt[seiteKey].auswertung.anzahlNeuFehlenNoch += 1;
        });

        finalObjekt[seiteKey].auswertung.vorgeseheneAktion = 
            exists && finalObjekt[seiteKey].auswertung.anzahlNeuFehlenNoch === 0 
            ? "abgeschlossen"
            : exists && finalObjekt[seiteKey].auswertung.anzahlNeuFehlenNoch !== 0
                ? "updaten"
                : !exists 
                    ? "erstellen" 
                    : "keine Angabe";
        
        /*/CON
        console.log("Für " + seiteKey + " fehlen noch " + finalObjekt[seiteKey].auswertung.anzahlNeuFehlenNoch + " Felder.");
        console.log("Für " + seiteKey + " ist die vorgesehene Aktion / der aktuelle Status " 
            + finalObjekt[seiteKey].auswertung.vorgeseheneAktion +".");
        //*/

        finalObjekt[seiteKey].felderCheck = felderCheck;
        
        
        /*/CON
        Object.entries(finalObjekt[seiteKey].felderCheck).forEach(([key, entry]) => {
            console.log("==SEITE==: " + seiteKey + " (key: "+ key +")");

            Object.entries(entry).forEach(([nFWKey, nFWEntry]) => {
                console.log(nFWKey + ": " + nFWEntry);
            });
        })
        //*/


    });
}


// ab hier Final-Objekt
/**
 * 
 */

function getFinalMitNeuenWertenUFeldern(deps, sammelObjekt) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const REGELN_felderUndWerte = EIGENE_REGELN.felderUndWerte;

    const finalObjekt = {};

    Object.entries(sammelObjekt).forEach(([seiteKey, seiteEntry]) => {
        /*/CONSOLE
        console.log("SEITE: " + key);
        //*/

        const norm = getPageNormObject(app, dv, seiteKey);
        const exists = norm.exists;

        finalObjekt[seiteKey] = {
            norm: exists ? norm : null,
            exists,
            neueFelderUndWerte: {},
            felderCheck: {},
            auswertung: { meldungen: [] }
        };


        const neueWerteAlteFelder = seiteEntry.neueWerteAlteFelder;

        /*/CONSOLE
        console.log("==SEITE==: " + seiteKey)
        //*/

        Object.entries(neueWerteAlteFelder).forEach(([nWaFKey, nWaFEntry]) => {

            const finalFeld = REGELN_felderUndWerte[nWaFKey];

            /*/CONSOLE
            console.log("nwafKey: " + nwafKey + ", nwafEntry: " + [...nwafEntry] + ". feldAusRegel: "+ feldAusRegel);
            //*/

            const feldUWertVorhandenCheck = nWaFEntry.size > 0 && !![...nWaFEntry][0];
            
            /*/CONSOLE
            console.log("neueWerteAlteFelder: " + key + ": " + [...entry] + " / vorhanden: " + eintragVorhanden);
            //*/

            if (feldUWertVorhandenCheck)
                finalObjekt[seiteKey].neueFelderUndWerte[finalFeld] = [...nWaFEntry];

        });

    });

    return finalObjekt;
}

// bis hier Sammel-Objekt
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
        const neueWerteAlteFelder = entry.neueWerteAlteFelder;
        const parentArr = [...neueWerteAlteFelder.vorletzter];
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

        childrenKeys.forEach(childKey => {
            const erlaubterTypChild = sammelObjekt[childKey].neueWerteAlteFelder.erster;
            erlaubterTypChild.forEach(typ => {
                // console.log("verschobener typ:"  + typ + " / von " + ck + " zu " + rootKey);
                sammelObjekt[rootKey].neueWerteAlteFelder.erster.add(typ);
            });
            delete sammelObjekt[childKey].neueWerteAlteFelder.erster;
        });
    });

    return sammelObjekt;    
}


/**
 * 
 */

function erwarteteTypenChecken(deps, sammelObjekt, meldungen) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;
    
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const erwarteteTypen = REGELN.erwarteteTypen;

    if (!felderUndWerte.erster) 
        return;

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        //console.log("ERW_TYPEN_CHECKEN: sammelObjekt.key: " + key);

        const neueWerteAlteFelder = entry.neueWerteAlteFelder;
        const erster = neueWerteAlteFelder.erster;
        erster.forEach(typVal => {
            
            const typKorrekt = erwarteteTypen.includes(typVal);

            // console.log("key = Seite: " + key + " / erster=typVal: " + typVal + " / typKorrekt: " + typKorrekt);
            if (!typKorrekt) {

                //console.log(`ERW_TYPEN_CHECKEN >>> TYP NICHT KORREKT: Die Seite ${key} enthät den nicht erwarteten typ ${typVal}`)

                const meldung = { 
                    seite: entry.name,
                    ursprung: "erwartete Typen Checken", 
                    info: `Die Seite ${key} enthät nicht erwarteten typ (${typVal}).`
                };

                meldungen.push(meldung);
            }
        });
    })
}

// ab hier Sammel-Objekt (neue Seiten: neue Werte in Regel-Feldern)
/**
 * 
 */

function sammelObjAusASeitenErstellen(deps, analysierteSeiten) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
    
    /*/CON
    console.log(EIGENE_REGELN);
    //*/

    const felderUndWerte = EIGENE_REGELN.felderUndWerte;
    const neueSeiteAusWerten = felderUndWerte.letzter === "seite";
    const feldErlaubterTypVorhanden = felderUndWerte.erster === "erlaubterTyp";
    const erwarteteTypen = REGELN.erwarteteTypen;
    
    const sammelObjekt = {};
    const meldungen = [];
    
    //console.log("neueSeiteAusWerten: " + neueSeiteAusWerten);

    if (neueSeiteAusWerten) {
        analysierteSeiten.forEach(aSeite => {
            /*/CON
            console.log("SEITE: " + as.name);
            Object.entries(as.seitenWerteNeu).forEach(([key, entry]) => {
                console.log(key + ": " + [...entry]);
            })
            //*/
            
            const neueSeiteSet = aSeite.seitenWerteNeu.letzter;
            // console.log("ANALYSIERTE SEITE: " + as.name + " / nSSet: " + [...as.seitenWerteNeu.letzter]);

            if (neueSeiteSet.size > 1) {
                const meldung = { 
                    seite: aSeite.name,
                    ursprung: "Sammel-Objekt aus analysierten Seiten erstellen", 
                    info: `Aus ${aSeite.name} soll die neue Seite aus Neu-Wert 'letzter' erstellt werden, `+
                    `aber es befinden sich mehr als eine Seite in Neu-Wert 'letzter'.`
                };
                meldungen.push(meldung);
            }
            else {
                // console.log("neueSeite-Set: " + [...neueSeiteSet][0])
                const neueSeite = [...neueSeiteSet][0];
                let keineTypenOderWieErwartet = true;

                if (feldErlaubterTypVorhanden) {

                    aSeite.seitenWerteNeu.erster.forEach(typ => {

                        const typKorrekt = erwarteteTypen.includes(typ);

                        if (!typKorrekt) {
                            keineTypenOderWieErwartet = null;
                            const meldung = {
                                seite: aSeite.name,
                                ursprung: "Sammel-Objekt aus analysierten Seiten erstellen > erwarteterTyp",
                                info: `Die Seite ${aSeite.name} enthält nicht erwarteten Typ (${typ}).`
                            };
                            meldungen.push(meldung);
                        }
                    })
                }

                if (!!neueSeite) {
                    if (keineTypenOderWieErwartet) {
                        sammelObjekt[neueSeite] = { neueWerteAlteFelder: {} };
                        const neueWerteAlteFelderObj = sammelObjekt[neueSeite].neueWerteAlteFelder;
                        
                        Object.entries(aSeite.seitenWerteNeu).forEach(([key, entry]) => {
                            if (key !== "letzter")
                                neueWerteAlteFelderObj[key] = entry;
                        });
                    }
                } else {
                    const meldung = {
                        seite: aSeite.name,
                        ursprung: "Sammel-Objekt aus analysierten Seiten erstellen",
                        info: `Die für ${aSeite.name} zu erstellende Seite ist fehlerhaft.`
                    };
                    meldungen.push(meldung);
                }

                
            }
        });
    }

    else {
        analysierteSeiten.forEach(aSeite => {
            
            const neueSeite = aSeite.name;
            sammelObjekt[neueSeite] = {neueWerteAlteFelder: {}};
            const neueWerteAlteFelderObj = sammelObjekt[neueSeite].neueWerteAlteFelder;
            
            Object.entries(aSeite.seitenWerteNeu).forEach(([key, entry]) => {
                neueWerteAlteFelderObj[key] = entry;
            });
        });
    }

    /*/CONSOLE
    Object.entries(sammelObjekt).forEach(([seiteKey, seiteEntry]) => {
        console.log("==SEITE:== " + seiteKey);
        Object.entries(seiteEntry.neueWerteAlteFelder).forEach(([mKey, mEntry]) => {
            console.log(mKey + ": " + mEntry);
        });
    });
    //*/
    
    unregistrierteParentsHinzufuegen(deps, sammelObjekt, meldungen);

    return { sammelObjekt, meldungen };
}


/**
 * 
 */

function unregistrierteParentsHinzufuegen(deps, sammelObjekt, meldungen) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const unregistrierteParentsObj = {};

    Object.entries(sammelObjekt).forEach(([key, entry]) => {

        /*/CLOG
        console.log("UNREGPAR: SEITE: " + key);
        //*/

        const parentArr = !!entry.neueWerteAlteFelder.vorletzter
            ? [...entry.neueWerteAlteFelder.vorletzter]
            : [];

        if (parentArr.length > 1) {
            const meldung = { 
                seite: key, 
                ursprung: "unregistrierte Parents Hinzufuegen", 
                info: "mehr als ein Parent" 
            };
            meldungen.push(meldung);
        }

        else if (parentArr.length > 0 && !!parentArr[0]) {

            /*/CLOG
            console.log("+++++++PARENT: " + parentArr[0] + " ++++++++");
            //*/

            const parent = parentArr[0];
            const parentRegistriert = sammelObjekt.hasOwnProperty(parent);
            const parentErfasstAlsUnregistriert = 
                unregistrierteParentsObj.hasOwnProperty(parent);
            
            if (!parentRegistriert && !parentErfasstAlsUnregistriert) {
                unregistrierteParentsObj[parent] = {neueWerteAlteFelder: {}};
                const neueWerteAlteFelderObj = 
                    unregistrierteParentsObj[parent].neueWerteAlteFelder;

                const grandParentSet = new Set();
                const grandParent = getGrandParent(parent);
                if (!!grandParent)
                    grandParentSet.add(grandParent);
                
                //console.log("grandPAr" + grandParent);
                
                Object.entries(entry.neueWerteAlteFelder).forEach(([neuKey, neuEntry]) => {
                    if (neuKey === "vorletzter")
                        neueWerteAlteFelderObj[neuKey] = grandParentSet;
                    else 
                        neueWerteAlteFelderObj[neuKey] = neuEntry;
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

        unregistrierteParentsHinzufuegen(deps, sammelObjekt, meldungen);
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


// hier Seitenanalyse-Objekt
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

    /*/CONSOLE
    console.log("einzelne Seite analysieren: Seite: " + seitePath);
    //*/

    const { app, dv, REGELN, INSToDEF_KEY } = deps;
    
    // Aus den REGELN
    const migRootKl = REGELN.migRootKl;
    const EIGENE_REGELN = REGELN.EIGENE_REGELN;
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
    const erkannteSeiteundCWerte = einzelneSeiteUndCWerkennen(deps, seitePath);
    
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
        .map(cw2er => getNeueWerte(deps, cw2er.norm.name));

    analyse.checkWerteNeuArr = neueWerteArr;

    /*CONSOLE
    neueWerteArr.forEach(nw => console.log("letzter: " + nw.letzter))
    //*/

    // ** neueWerteSets bearbeiten:
    //  * => erhält Keys gemäß Regeln = new Set()
    //  * => erhält Standard-Werte: migRootKl, inFeld/artPath, pstatus gemäß Regeln

    // *** Neue-Felder und Werte-Objekt *** //
    const seitenWerteNeu = {};

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
                    const istSelbstMigRoot = nw.letzter === migRootKl;
                    const beginntMitRootKl = nw.letzter.startsWith(migRootKl);

                    // console.log("letzter Wert: " + nw.letzter + " / migRootKl: " + migRootKl + " / nichtMigRoot: " + nichtMigRoot)
                    if (!istSelbstMigRoot && beginntMitRootKl) 
                        seitenWerteNeu[regelKey].add(nw.letzter);
                    
                    else if (istSelbstMigRoot) {
                        const meldung = { 
                            seite: analyse.name,
                            ursprung: "einzelne Seite analysieren > letzter", 
                            info: `${nw.letzter} ist selbst die rootKl-Seite (${migRootKl}).`
                        };
                        analyse.meldungen.push(meldung);
                    }
                    else if (!beginntMitRootKl) {
                        const meldung = { 
                            seite: analyse.name,
                            ursprung: "einzelne Seite analysieren > letzter", 
                            info: `${nw.letzter} beginnt nicht mit migRootKl (${migRootKl}).`
                        };
                        analyse.meldungen.push(meldung);
                    }

                });
            }
            else if (key === "vorletzter") {
                neueWerteArr.forEach(nw => seitenWerteNeu[regelKey].add(nw.vorletzter));
            }
            else if (key === "pstatus") {
                const uniquePSet = getAlleUniquePStatus(deps, erkannteSeiteundCWerte.checkWerte);
                const mehrAlsEinP = uniquePSet.size >1;
                if (mehrAlsEinP) {
                    const meldung = { 
                        seite: analyse.name,
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

function getAlleUniquePStatus(deps, checkWerte) {

    const { app, dv, REGELN, INSToDEF_KEY } = deps;

    const nichtP = REGELN.nichtPNorm.name;

    const uniquePSet = new Set();

    checkWerte.forEach(cwert => {
        
        if (cwert.erkanntAls === 4)
            uniquePSet.add(cwert.norm.name);
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {
            
            const erkannteSeiteUndCWerte = einzelneSeiteUndCWerkennen(deps, cwert.norm.path);
            
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

    const {migRootKlNorm, rootPStatNorm, nichtPNorm} = REGELN;

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

