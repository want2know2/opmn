
////
// IMPORT                       // FROM

import { readRegJSON, 
         writeRegJSON }         from "../../../../shared/services/dataService/jsonReadAndWrite.js";

import { einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { dvLinkSuche }          from "../../../../shared/services/queries/queryService.js";
import { placeHoverLinkOnEl }   from "../../../../shared/services/ui/uiLinkService.js";

import { listMaker, tableMakerReihe, 
         tableMakerReiheHd, 
         uiMaker }              from "../../../../shared/services/ui/uiService.js";
import { GET_MIG_REGELN }       from "../migReg/migReg.js";

import { getEmptyFinalSeiteObj, 
         istMigDiscovery4 }     from "../migServices/istMigDiscovery4.js";
import { migManager } from "./migManager.js";


/** MigManager starten und Status-Objekt erstellen => UI erstellen
 * 
 */

export async function migManagerTest5(obsClsObj) {

    // Standard deps
    const { app, dv, contentEl } = obsClsObj;

    const MIG_REGELN = GET_MIG_REGELN();

    // Mig-MANAGER STATUS / User-Auswahl / REGELN
    const migManager = {
        
        obsClsObj,      
        app, dv,        

        migRootKl:      null,
        instODef:       "migInst",

       ergAnzahlGesamt: 0,
        ergAnzeigeVon:  0,
        ergAnzeigeBis:  100,

        ergAuswahl:     [],
        ergInArbeit:    [],

        fltKeinFlt:     true,
        fltExistsKey:   "",
        fltFelderKey:   "",
        fltAktuellKey:  "",
        fltAktionKey:   "",

        sortBy:         "name",

        MIG_REGELN,     

        ui: {           
                        
            els: {},    // < userUI
            contentEl,  
            hidden:     true,
        }
    };

    await getUI(migManager);
}



/** Alle fixen UI-Elemente erstellen, Boxen, Buttons, Tabellenüberschriften, hidden Els...
 * 
 */

async function getUI(migManager) {
    
    const { ui } = migManager;
    
    // DOM ELemente, UI, Ergebnis-Tabelle
    ui.els = uiMaker(ui.contentEl, {

        topUIBox:               [                                                           ],
        mainHeader:             ["topUIBox",            "h4",       "Migrations-Manager"    ],
        infoHeader:             ["topUIBox",            "h5",       "Auswahl treffen"       ],
        migKlBtnBox:            ["topUIBox"                                                 ],
        br_sLK66s:              ["topUIBox",            "br"                                ],
        instODefBtn:            ["topUIBox",            "button",   "Instanzen"             ],
        br_93sD7d:              ["topUIBox",            "br"                                ],
        ergHeader:              ["topUIBox",            "h5"                                ],
      fltAktAendAktAusfBtnsBox: ["topUIBox"                                                 ],

        bearbeitenBox:          ["topUIBox"                                                 ],

        sortHeader:             ["topUIBox",            "h6",       "Sortieren nach"        ],
        uiSortBox:              ["topUIBox"                                                 ],
        br_XkS64d:              ["topUIBox",            "br"                                ],
        br_sd2flk:              ["topUIBox",            "br"                                ],
        
        navBtnBoxTop:           ["topUIBox"                                                 ],
        navInfoBoxTop:          ["navBtnBoxTop",        "span"                              ],
        navZurueckBtnTop:       ["navBtnBoxTop",        "button",   "zurück"                ],
        navVorBtnTop:           ["navBtnBoxTop",        "button",   "vor"                   ],
        
        
        ergBox:                 [                                                           ],

        belowUIBox:             [                                                           ],
        navBtnBoxBelow:         ["belowUIBox"                                               ],
        navInfoBoxBelow:        ["navBtnBoxBelow",      "span"                              ],
        navZurueckBtnBelow:     ["navBtnBoxBelow",      "button",   "zurück"                ],
        navVorBtnBelow:         ["navBtnBoxBelow",      "button",   "vor"                   ],
        
    });

    const { els } = ui;

    // CSS
    els.bearbeitenBox.style.height = "85px";


    /*els.hiddenEls = [
       
        els.fltAktAendAktAusfBtnsBox,
        els.bearbeitenBox,
        
        els.sortHeader,
        els.uiSortBox,

        els.navBtnBoxTop,
        els.ergBox,
        els.belowUIBox
    ];*/


    
    // renderHiddenAndVisibleUI(migManager, null);

    // Tabellenüberschriften
    els.uiTabHeaderArr = [ 
        "Anzahl", 
        "nach Aktion filtern", 
        "aktive Aktion ändern",
        "Aktion ausführen"
    ];

    els.ergTabHeaderArr = [ 
        "Nr.", "Seite", 
        "Felder & Werte", "aktive Aktion ändern",
        "Aktion ausführen"
    ];



    // migRootKl-Buttons
    Object.keys(migManager.MIG_REGELN).forEach(key => {

        const btnBox = els.migKlBtnBox.createEl("span");
        btnBox.style.paddingRight = "2px";

        const btn = btnBox.createEl("button", { text: key});

        btn.addEventListener("click", async () => {
            
            migManager.migRootKl = key;

            setMigMngrStatus(migManager);
            //resetMigMngrErgAnzUndFlt(migManager);
        
            await getGesamtauswertungUndRenderUI(migManager);
            /*
            await vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtauswertung);
            renderDynamicUI(els, dynamicUI, migManagerStatus);
            */
        }); 
    });  


    // InstODef-Button
    els.instODefBtn.addEventListener("click", async () => {

        if (migManager.instODef === "migInst") { // wenn jetzt inst, wird auf def umgeschaltet

            /**
             * Bevor Definitionen bearbeitet werden, muss muss geprüft werden, ob alle 
             * Instanzen bereits bearbeitet wurden. Ich werde einbauen, dass eine 
             * migRootKlasse, die komplett abgeschlossen ist, eine JSON datei hinterlässt. 
             * Hier kann dann geprüft werden, ob diese vorhanden (bzw. die entsprechende 
             * Eigenschaft true) ist.
             */ 

            await instODefBtnFn(migManager);
        }

        else {

            await instODefBtnFn(migManager);
        }

        async function instODefBtnFn(migManager) {

            migManager.instODef = migManager.instODef === "migDef" 
                ? "migInst" : "migDef";
            
            setMigMngrStatus(migManager);
            //resetMigMngrErgAnzUndFlt(migManager);

            await getGesamtauswertungUndRenderUI(migManager);
        }
    });

    renderUI(migManager);
    
}



/** Angezeigte Tabelle wieder auf 0, Filter auf gesamt
 *  verwendet von migRootKl- und instODef-Btns
 */
/*
function resetMigMngrErgAnzUndFlt(migManager) {

    migManager.ergAnzeigeVon = 0;

    migManager.fltKeinFlt = true;

    migManager.fltExistsKey = "";
    migManager.fltFelderKey = "";
    migManager.fltAktuellKey = "";
    migManager.fltAktionKey = "";
}
*/


/** Angezeigte Erg und Filter setzen
 * 
 */

function setMigMngrStatus(
    migManager,
    anzahlGesamt = 0,
    anzeigeVon = 0,
    keinFlt = true,
    existsKey = "", felderKey = "", aktuellKey = "", aktionKey = ""
) {

    migManager.ergAnzahlGesamt = anzahlGesamt;
    migManager.ergAnzeigeVon = anzeigeVon;

    migManager.fltKeinFlt = keinFlt;

    migManager.fltExistsKey = existsKey;
    migManager.fltFelderKey = felderKey;
    migManager.fltAktuellKey = aktuellKey;
    migManager.fltAktionKey = aktionKey;
}



/** gesamtauswertung holen => checken
 *  verwendet von migRootKl- und instODef-Btns
 */

async function getGesamtauswertungUndRenderUI(migManager) {

    const gesamtauswertung = await istMigDiscovery4(migManager);

    if (!gesamtauswertung || gesamtauswertung.finalAnzahl.gesamt === 0) {
        
        migManager.ergAnzahlGesamt = 0;
    } 
    
    else {

        migManager.ergAuswahl = getAktuellAngezeigteErg(migManager, gesamtauswertung);

        migManager.ergAnzahlGesamt = gesamtauswertung.finalAnzahl.gesamt;
    }

    renderUI(migManager, gesamtauswertung);
}



/** RETURN: Filtern, Sortieren, Paginieren
 * 
 */

function getAktuellAngezeigteErg(migManager, gesamtauswertung) {

    return Object.entries(gesamtauswertung.analyseObjekt)
    
    // Filtern
    .filter(([key, entry]) => {

        // Filter-Einstellungen
        const fltKeinFlt = 
            migManager.fltKeinFlt;
        
        const fltExistsKey =
            migManager.fltExistsKey 
                === (entry.normInfos.exists ? "e" : "ne");
        
                const fltFelderKey =
            migManager.fltFelderKey 
                === (entry.auswertung.neueFelderErstellt > 0 ? "f" : "nf");
        
        const fltAktuellKey =
            migManager.fltAktuellKey 
                === (entry.auswertung.alleFelderAktuell ? "a" : "na");
        
        const fltAktionKey = 
            migManager.fltAktionKey 
                === entry.auswertung.aktiveAktion;
        
        return fltKeinFlt || 
            (fltExistsKey && fltFelderKey && fltAktuellKey && fltAktionKey);
    })

    // Sortieren
    .sort(([aKey, aEntry], [bKey, bEntry]) => {

        switch(migManager.sortBy) {

            case "name":
                return aKey.localeCompare(bKey);
                break;

            case "aktuell":
                return (aEntry.auswertung.alleFelderAktuell ? 1 : 0) - 
                    (bEntry.auswertung.alleFelderAktuell ? 1 : 0);
                break;

            case "aktiveAkt":
                return aEntry.auswertung.aktiveAktion - 
                    bEntry.auswertung.aktiveAktion;
                break;

            case "userAkt":
                return aEntry.auswertung.userAuswahlAktion - 
                    bEntry.auswertung.userAuswahlAktion;
                break;
        }
    })

    // Paginieren
    .filter(([key, entries], i) => {

        // von/bis-Anzeige
        const iGrVon = i >= migManager.ergAnzeigeVon;
        const iKlBis = i < (migManager.ergAnzeigeVon + migManager.ergAnzeigeBis);

        return iGrVon && iKlBis;
    })
}



/** render alle dynamischen ui-Elemente gemäß gesamtauswertung
 *  verwendet von get Gesamtauswertung Und RenderUI
 */

function renderUI(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    // sichtbar gemäß Ergebnisse vorhanden
    const ergVorhandenCheck = migManager.ergAnzahlGesamt > 0;

    [   
        els.fltAktAendAktAusfBtnsBox,
        els.bearbeitenBox,
        
        els.sortHeader,
        els.uiSortBox,

        els.navBtnBoxTop,
        els.ergBox,
        els.belowUIBox
    ]
    .forEach(el => 
        el.style.visibility = ergVorhandenCheck
            ? "visible" : "hidden"
    );

    // keine Ergebnisse vorhanden
    if (!ergVorhandenCheck) {

        renderInfoHeader(migManager, gesamtauswertung);
        renderInstODefBtn(migManager);
        renderErgHeader(migManager, gesamtauswertung);

        return;
    } 

    // sichtbar gemäß Ergebnisse in Arbeit
    const ergInArbeitCheck = migManager.ergInArbeit.length > 0;

    [
        els.fltAktAendAktAusfBtnsBox,

        els.sortHeader,
        els.uiSortBox,
        
        els.navBtnBoxTop,
        els.belowUIBox
    ]
    .forEach(el => 
        el.style.visibility = ergInArbeitCheck
            ? "hidden" 
            : "visible"
    );

    // Bearbeiten-Box
    [
        els.bearbeitenBox
    ]
    .forEach(el => 
        el.style.visibility = ergInArbeitCheck
            ? "visible" : "hidden"
    );


    // Immer rendern
    renderInfoHeader(migManager, gesamtauswertung);
    renderInstODefBtn(migManager);
    renderErgHeader(migManager, gesamtauswertung);
    
    // Rendern wenn sichtbar
    if (els.fltAktAendAktAusfBtnsBox.style.visibility === "visible")
        renderBtnsTopBox(migManager, gesamtauswertung);    

    if (els.uiSortBox.style.visibility === "visible")
        renderUiSortBox(migManager, gesamtauswertung);
    
    if (els.navBtnBoxTop.style.visibility === "visible")
        renderNavBoxes(migManager, gesamtauswertung);

    if (els.ergBox.style.visibility === "visible")
        renderErgBox(migManager, gesamtauswertung);

    if (els.bearbeitenBox.style.visibility === "visible")
        renderBearbeitenBox(migManager, gesamtauswertung);

}








/** info-Header
 * 
 */

function renderInfoHeader(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    const textArr = 
        `${migManager.migRootKl}: ${migManager.instODef === "migDef" ? "Definitionen" : "Instanzen"} ausgewählt`.split("");
    
    els.infoHeader.textContent = " ";

    for (let i = 0; i < textArr.length; i++) {

        setTimeout(() => { els.infoHeader.textContent += textArr[i] }, i * 5);
    }
}



/** instODef-Button
 * 
 */

function renderInstODefBtn(migManager) {

    const { els } = migManager.ui;

    els.instODefBtn.textContent = "zu ";

    els.instODefBtn.textContent += 
        migManager.instODef === "migDef" 
            ? "Instanzen" : "Definitionen";
}



/** ergebnis-Header
 * 
 */

function renderErgHeader(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    const ergVorhanden = migManager.ergAnzahlGesamt > 0;
    const ergInArbeitCheck = migManager.ergInArbeit.length > 0;

    let textStrToArr = "";

    if (!ergVorhanden) {

        textStrToArr = "Keine Ergebnisse";
    }

    else if (ergInArbeitCheck) {

        textStrToArr = "Ergebnisse in Arbeit";
    }

    else {

        const { 
            ergAnzahlGesamt,
            fltKeinFlt, fltExistsKey, fltFelderKey, fltAktuellKey, fltAktionKey,
            buttonAktion
        } = migManager;

        const { suchseiten, gesamt, status } = gesamtauswertung.finalAnzahl;

        if (fltKeinFlt) {

            textStrToArr = 
                `${gesamt} Ergebnisse aus ${suchseiten} analysierten Seiten`;
        }

        else {

            textStrToArr = 
                `${status
                    [fltExistsKey][fltFelderKey][fltAktuellKey][fltAktionKey]
                } Seiten (aus ${
                    gesamt
                } Ergebnissen aus ${
                    suchseiten
                } analysierten Seiten)`;
        }
        
    }

    els.ergHeader.textContent = " ";
    textStrToArr = textStrToArr.split("");

    for (let i = 0; i < textStrToArr.length; i++) {

        setTimeout(() => { els.ergHeader.textContent += textStrToArr[i] }, i * 7);
    }

    
    
}



/** UI-BOX: FILTER- / AKTION ÄNDERN- / AKTION AUSFÜHREN-BUTTONS 
 * 
 */

function renderBtnsTopBox(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    const {aktionenAuswahl, aktionenTexte} = getAktionsInfos();

    
    // UI-BOX LEEREN
    els.fltAktAendAktAusfBtnsBox.empty();

    // UI-TABELLE ERSTELLEN
    const tabelle = tableMakerReiheHd(els.fltAktAendAktAusfBtnsBox, els.uiTabHeaderArr);
    
    // UI-TABELLE: CELLS für FILTER-BUTTON Gesamt ERSTELLEN
    const cells = tableMakerReihe(tabelle, els.uiTabHeaderArr.length);

    // CELL 0: exists, felder, aktuell, aktiveAktion-Info ERSTELLEN
    cells[0].textContent = `insgesamt: ${gesamtauswertung.finalAnzahl.gesamt} Seiten`;
    
    // CELL 1: FILTER-BUTTON Gesamt ERSTELLEN
    const fltGesamtBtn = cells[1].createEl("button", {text: "anzeigen"});
    
    // FILTER-BUTTON Gesamt EVL
    fltGesamtBtn.addEventListener("click", () => 

        fltGesBtnTopFn(migManager, gesamtauswertung)
    );


    // FILTER-/ AKTION-ÄNDERN- / AKTION-AUSFÜHREN-
    // nach Keys-BUTTONS ERSTELLEN

    Object.entries(gesamtauswertung.finalAnzahl.status)
                // e/ne: {{{...}}}
    .forEach(([existsKey, existsEntry]) => {


        Object.entries(existsEntry)
                        // f/nf: {{...}}
        .forEach(([felderKey, felderEntry]) => {


            Object.entries(felderEntry)
                        // a/na: {...}
            .forEach(([aktuellKey, aktuellEntry]) => {

                
                Object.entries(aktuellEntry)
                                // "0": 10
                .forEach(([aktionKey, ergAnzahlByKeys]) => {
                
                    if (ergAnzahlByKeys > 0) {

                        // UI-TABELLE: CELLS für weitere
                        // FILTER-BUTTONS und AKTION-ÄNDERN-
                        // BUTTONS ERSTELLEN
                        const cells = tableMakerReihe(
                            tabelle, 
                            els.uiTabHeaderArr.length
                        );

                    /* -------------------------------------------------------- */

                        // CELL 0: exists, felder, aktuell, aktiveAktion-
                        // INFO-TEXTE VORBEREITEN
                        const eTxt = 
                            existsKey === "e" 
                                        ? "" 
                                        : "nicht existent";
                        
                        const fTxt = 
                            felderKey === "f" 
                                        ? "neue Felder vorbereitet" 
                                        : "keine neuen Felder vorbereitet";
                        
                        const aTxt = 
                            aktuellKey === "a" 
                                        ? "aktuell" 
                                        : "nicht aktuell";

                        // CELL 0: exists, felder, aktuell, aktiveAktion-
                        // INFO ERSTELLEN
                        cells[0].textContent = 
                            `${
                                aktionenTexte[aktionKey]
                            }: ${
                                ergAnzahlByKeys
                            } Seiten (${
                                eTxt
                            }${
                                !!eTxt 
                                    ? "" 
                                    : aTxt
                            }, ${
                                fTxt
                            })`;
                        
                    /* -------------------------------------------------------- */

                        // CELL 1: FILTER-BUTTON ERSTELLEN
                        const filterBtn = 
                            cells[1].createEl("button", {text: "anzeigen"});

                        // Keys und Anzahl für FILTER-BUTTON-FN gesammelt
                        const alleKeysUndAnzahl = { 
                            
                            existsKey, felderKey, 
                            aktuellKey, aktionKey, 
                            ergAnzahlByKeys 
                        };

                        // FILTER-BUTTON-EVL => -FN
                        filterBtn.addEventListener("click", () => 
                            fltByAktionKeyBtnTopFn(
                                migManager, gesamtauswertung, alleKeysUndAnzahl
                            )
                        );
                        
                    /* -------------------------------------------------------- */

                        // CELL 2: AKTION-ÄNDERN-BUTTONS ERSTELLEN

                        // BEDINGUNG: gemäß Filtereinstellungen
                        
                        if (
                            keysEntsprechenFilterauswahlCheck(migManager, alleKeysUndAnzahl)
                        ) {

                            // BEDINGUNG: es gibt insgesamt keine 
                            // laut Analyse zu erstellende Seite mehr
                            // ODER es gibt mindestens eine laut 
                            // Analyse zu erstellende Seite gemäß
                            // hiesiger Keys

                            const ltAnalyseZuErstellendeVorhanden = 
                                gesamtauswertung.finalAnzahl.ltAnalyseZuErstellende
                                [existsKey]?.[felderKey]?.[aktuellKey]?.[aktionKey] > 0;

                            if (
                                gesamtauswertung.finalAnzahl.statusGes["2"] === 0 
                                || ltAnalyseZuErstellendeVorhanden
                            ) {
                                
                                // Für jede MÖGLICHE AKTION einen
                                // AKTION-ÄNDERN-BUTTON ERSTELLEN
                                aktionenAuswahl
                                [existsKey][felderKey][aktuellKey][aktionKey]
                                .forEach(buttonAktion => {

                                    const andereAktionBtn = cells[2]
                                    .createEl("button", {
                                        text: aktionenTexte[buttonAktion]
                                    });

                                    // AKTION-ÄNDERN-BUTTON EVL => -FN
                                    andereAktionBtn
                                    .addEventListener("click", async () => 
                                        
                                        await aktionAendernBtnTopFn(
                                            migManager, gesamtauswertung, 
                                            buttonAktion
                                        )
                                    );
                                });
                            }


                            // WENN hiesiger aktiveAktion-KEY nicht 2
                            // kein AKTION-ÄNDERN-BUTTON

                            else if (Number(aktionKey) !== 2) {

                                cells[2].createEl("div", { 
                                    text: "Erst zu erstellende Seiten bearbeiten"
                                });
                            }

                            // WENN hiesiger aktiveAktion-KEY 2
                            // kein AKTION-ÄNDERN-BUTTON
                            if (
                                Number(aktionKey) === 2 
                                && !ltAnalyseZuErstellendeVorhanden
                            ) {

                                // Für jede MÖGLICHE AKTION einen
                                // AKTION-ÄNDERN-BUTTON ERSTELLEN
                                aktionenAuswahl
                                [existsKey][felderKey][aktuellKey][aktionKey]
                                .forEach(buttonAktion => {

                                    const andereAktionBtn = cells[2]
                                    .createEl("button", {
                                        text: aktionenTexte[buttonAktion]
                                    });

                                    // AKTION-ÄNDERN-BUTTON EVL => -FN
                                    andereAktionBtn
                                    .addEventListener("click", async () => 

                                        await aktionAendernBtnTopFn(
                                            migManager, gesamtauswertung, 
                                            buttonAktion
                                        )
                                    );
                                });
                            }
                        }
                    }
                });
            });
        });
    });
}



/**
 * 
 */

function keysEntsprechenFilterauswahlCheck(migManager, alleKeysUndAnzahl) {

    const { 
        existsKey, felderKey, aktuellKey, aktionKey

    } = alleKeysUndAnzahl;

    return migManager.fltExistsKey  === existsKey &&
    migManager.fltFelderKey  === felderKey &&
    migManager.fltAktuellKey === aktuellKey &&
    Number(migManager.fltAktionKey) === Number(aktionKey);

}








/** zwei Objekte mit Button-Infos
 * 
 */

function getAktionsInfos() {

    const aktionenAuswahl = {
        e: { 
            f: {
                a: {
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

    aktionenTexte = {
        "0": "keine Aktion",
        "1": "updaten",
        "2": "erstellen",
        "3": "löschen"
    };

    return {
        aktionenAuswahl,
        aktionenTexte
    };
}






/** Sort-Buttons
 * 
 */

function renderUiSortBox(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    els.uiSortBox.empty();

    // Sort-Buttons
    const sortBtnInfos = {
        name: {
            text: "Seitenname"
        },
        aktuell: {
            text: "Alle Felder aktuell"
        },
        aktiveAkt: {
            text: "Aktive Aktion"
        },
        userAkt: {
            text: "User-Auswahl-Aktion"
        }
    };
    
    
    Object.entries(sortBtnInfos).forEach(([key, entry]) => {

        const btn = els.uiSortBox.createEl("button", { text: entry.text});
        btn.addEventListener("click", () => sortBtnFn(key))
    });

    function sortBtnFn(key) {

        migManager.sortBy = key;

        renderErgBox(migManager, gesamtauswertung);
    }
}



/** nav-info und -Buttons gemäß anzahl gesamtausw., anzeige von/bis
 *  Die Buttons müssten eigentlich nicht jedesmal neu erstellt werden,
 *  könnten auch einmalig oben mit der restlichen UI
 *  - ODER AUCH NIcHT, da die Btns gesamtausw. zum Weitergeben
 *  an renderErgBox brauchen.. 
 */

function renderNavBoxes(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    const tabAnzahl = Math.ceil(migManager.ergAnzahlGesamt / migManager.ergAnzeigeBis);
    const aktuellerTab = Math.ceil(migManager.ergAnzeigeVon / migManager.ergAnzeigeBis)+1;

    ["Top", "Below"].forEach(topBelow => {

        els[`navBtnBox${topBelow}`].empty();
        
        els[`navInfoBox${topBelow}`] = 
            els[`navBtnBox${topBelow}`].createEl("span", 
                {text: `${aktuellerTab}/${tabAnzahl} `});
        
        els[`navZurueckBtn${topBelow}`] = 
            els[`navBtnBox${topBelow}`].createEl("button", { text: "zurück"});
        
        els[`navZurueckBtn${topBelow}`]
        .addEventListener("click", () => navZurueckBtnFn(migManager, gesamtauswertung));
        
        els[`navVorBtn${topBelow}`] = 
            els[`navBtnBox${topBelow}`].createEl("button", { text: "vor"});
        
        els[`navVorBtn${topBelow}`]
        .addEventListener("click", () => navVorBtnFn(migManager, gesamtauswertung));
    });
}



/** render nav-info nach Button-Click
 * 
 */

function renderNavInfo(migManager) {

    const { els } = migManager.ui;

    const tabAnzahl = Math.ceil(
        migManager.ergAnzahlGesamt / migManager.ergAnzeigeBis
    );
    const aktuellerTab = Math.ceil(
        migManager.ergAnzeigeVon / migManager.ergAnzeigeBis
    )+1;

    [els.navInfoBoxTop, els.navInfoBoxBelow].forEach(infoEl => 
        infoEl.textContent = `${aktuellerTab}/${tabAnzahl} `
    )
}



/** info-Box: infos reinschreiben
 * 
 */

function renderBearbeitenBox(migManager, gesamtauswertung) {

    const { migRootKl, instODef,
            existsKey, felderKey, 
            aktuellKey, aktionKey, buttonAktion
    } = migManager;

    const { els
    } = migManager.ui;

    const { userReg
    } = gesamtauswertung;

    const { status, statusGes, ltAnalyseZuErstellende 
    } = gesamtauswertung.finalAnzahl;

    els.bearbeitenBox.empty();

    const rBtn = els.bearbeitenBox
    .createEl("button", 
        { text: "rückgängig" }
    );

    rBtn.addEventListener("click", async () => 
        aktionAendernRueckgaengigBtnFn(migManager, gesamtauswertung)
    );

    const bBtn = els.bearbeitenBox
    .createEl("button", 
        { text: "bestätigen" }
    );

    bBtn.addEventListener("click", async () => 
        aktionAendernBestaetigenBtnFn(migManager, gesamtauswertung)
    );


}



/** Ergebnis-Tabelle: filtern, sortieren, paginieren & darstellen => renderErgCells
 * 
 */

function renderErgBox(migManager, gesamtauswertung) {
    
    const { els } = migManager.ui;

    els.ergBox.empty();

    const tabelle = tableMakerReiheHd(els.ergBox, els.ergTabHeaderArr);

    // wenn Erg in Arbeit, diese darstellen, sonst
    // Auswahl anhand der aktuellen Kriterien erhalten
    (
        ergAnzeigeAuswahl = migManager.ergInArbeit.length > 0
            ? migManager.ergInArbeit
            : migManager.ergAuswahl
    )
    .forEach(([key, entry], i) => {

        const cells = tableMakerReihe(tabelle, els.ergTabHeaderArr.length);

        renderErgCells(migManager, gesamtauswertung, cells, key, entry, i);
    })
}






/** Einzelne Zeile in Ergebnistabelle
 * 
 */

function renderErgCells(migManager, gesamtauswertung, cells, key, entry, i) {

    const { obsClsObj, app, migRootKl, instODef } = migManager;

    const { 
        gesamt, status, statusGes, ltAnalyseZuErstellende 
    
    } = gesamtauswertung.finalAnzahl;
    
    const { userReg } = gesamtauswertung;

    // CELLS LEEREN
    cells[0].empty(); cells[1].empty();
    cells[2].empty(); cells[3].empty();
    
    // 0: i/Nr
    cells[0].textContent = i+1 + migManager.ergAnzeigeVon;

    // 1: e: Seitenlink / ne: Seitenname
    if (entry.normInfos.exists) {
        
        const box = cells[1].createEl("div");
        const linkBox = box.createEl("div");
        const linkFett = linkBox.createEl("b");
        placeHoverLinkOnEl(obsClsObj, linkFett, entry.normInfos);
        box.createEl("br"); 
        box.createEl("div", { text: entry.feldIst.join(", ")});
        
        box.style.borderWidth = "1px";
        box.style.borderStyle = "solid";
        box.style.borderColor = "#323232";
        box.style.borderRadius = "5px";

    } 
    
    else {

        const box = cells[1].createEl("div");
        box.style.color = "#e97373";
        box.textContent = key;
    }

    if (entry.meldungen.length > 0) {
        const meldungenBox = cells[1].createEl("div");
        meldungenBox.createEl("br");

        entry.meldungen.forEach((mel, i) => {

            meldungenBox
            .createEl("span", {text: `${mel.info}${(i+1) 
                < entry.meldungen.length ? ", " : ""}`});
        })
    }
    // 2: Aktion, Feld ist, neue Felder
    //cells[2].textContent = JSON.stringify(entry.neueFelderUndWerte, null, 2);
    addNeueFelderUndWerteBox(cells[2], entry);



    // 3: Filter-Buttons
    const existsKey = entry.normInfos.exists ? "e" : "ne";
    const felderKey = entry.auswertung.neueFelderErstellt > 0 ? "f" : "nf";
    const aktuellKey = entry.auswertung.alleFelderAktuell ? "a" : "na";
    let { aktiveAktion, userAuswahlAktion, analyseAktion } = entry.auswertung;
    
    const {aktionenAuswahl, aktionenTexte} = getAktionsInfos();

    if (gesamtauswertung.finalAnzahl.statusGes["2"] === 0) {

        aktionenAuswahl[existsKey][felderKey][aktuellKey][aktiveAktion]
        .forEach(buttonAktion => {

            const andereAktionBtn = cells[3].createEl("button", {
                text: aktionenTexte[buttonAktion]
            });

            andereAktionBtn.addEventListener("click", async () => 
                await andereAktionBtnFn(
                    migManager, gesamtauswertung, 
                    key, entry, 
                    existsKey, felderKey, aktuellKey, aktiveAktion, 
                    buttonAktion
                )
            );
        });
    }

    else {

        aktionenAuswahl[existsKey][felderKey][aktuellKey][aktiveAktion]
        .forEach((buttonAktion, i) => {

            if (Number(aktiveAktion) === 2 || Number(analyseAktion) === 2) {

                // alleKeysUndInfos.buttonAktion = buttonAktion;

                const andereAktionBtn = cells[3].createEl("button", {
                    text: aktionenTexte[buttonAktion]
                });

                andereAktionBtn.addEventListener("click", async () => 
                    await andereAktionBtnFn(
                        migManager, gesamtauswertung, 
                        key, entry, 
                        existsKey, felderKey, aktuellKey, aktiveAktion, 
                        buttonAktion
                    )
                );
            }

            else if (i === 0) {

                cells[3].createEl("div", { 
                    text: "Erst zu erstellende Seiten bearbeiten"
                });
            }
        });
    }

    async function andereAktionBtnFn(
        migManager, gesamtauswertung, 
        ergKey, ergSeite, 
        existsKey, felderKey, aktuellKey, aktiveAktion, buttonAktion
    ) {
        
        status[existsKey][felderKey][aktuellKey][aktiveAktion] -= 1;
        status[existsKey][felderKey][aktuellKey][buttonAktion] += 1;
        statusGes[aktiveAktion] -= 1;
        statusGes[buttonAktion] += 1;


        if (existsKey === "ne" && aktuellKey === "na" 
            && Number(ergSeite.auswertung.analyseAktion) === 2
        ) {

            ltAnalyseZuErstellende
            [existsKey][felderKey][aktuellKey][aktiveAktion] -= 1;
            
            ltAnalyseZuErstellende
            [existsKey][felderKey][aktuellKey][buttonAktion] += 1;
        }


        ergSeite.auswertung.aktiveAktion = buttonAktion;
        ergSeite.auswertung.userAuswahlAktion = buttonAktion;
        userReg[ergKey].userAuswahl = buttonAktion;

        await writeRegJSON(app, `${migRootKl} _ ${instODef}`, gesamtauswertung.userReg);
        renderErgHeader(migManager, gesamtauswertung);
        renderBtnsTopBox(migManager, gesamtauswertung);
        renderErgCells(migManager, gesamtauswertung, cells, ergKey, ergSeite, i);
    }
}



/**
 * 
 */
                        // Ergebnis-Cell[2]
function addNeueFelderUndWerteBox(cell, ergSeite) {

    const { aktionenTexte } = getAktionsInfos();
    
    //const tabelle = tableMakerReiheHd(cell, ["Feld", "Wert" /*, "aktuell"*/]);
    const box = cell.createEl("div");
    box.style.borderWidth = "1px";
    box.style.borderStyle = "solid";
    box.style.borderColor = "#323232";
    box.style.borderRadius = "5px";

    const aktionenBox = box.createEl("div");

    // wird immer angezeigt
    const aktiveAktionTxt = 
        "Aktive Aktion: " + aktionenTexte[ergSeite.auswertung.aktiveAktion];
    
        const aktivBox = box.createEl("div", {text: aktiveAktionTxt});
    
    // wird nur angezeigt, wenn abweichend von aktiveAktion
    const analyseAktionTxt = 
        ergSeite.auswertung.analyseAktion !== ergSeite.auswertung.aktiveAktion
        ? "Analyse-Aktion: " + aktionenTexte[ergSeite.auswertung.analyseAktion]
        : "";
    
    const analyseBox = box.createEl("div", {text: analyseAktionTxt});

    // wird nur angezeigt, wenn abweichend von aktiveAktion
    const userAuswahlAktionTxt = 
        !!ergSeite.auswertung.userAuswahlAktion && 
        ergSeite.auswertung.userAuswahlAktion !== ergSeite.auswertung.aktiveAktion
        ? "Userauswahl-Aktion: " + aktionenTexte[ergSeite.auswertung.userAuswahlAktion]
        : "";
    
    const userAuswahl = box.createEl("div", {text: userAuswahlAktionTxt});
        

    const anzahlFelder = box.createEl("div", {text: "Anzahl neue Felder: "});

    const felderWerteBox = box.createEl("div");

    if (!!ergSeite.auswertung.neueFelderErstellt && ergSeite.auswertung.neueFelderErstellt > 0) {

        const cells = tableMakerReihe(felderWerteBox, 2);

        Object.entries(ergSeite.neueFelderUndWerte).forEach(([key, entry]) => {

            //const aktuell = ergSeite.neueFelderInSeiteAktuell[key] ? "ja" : "nein";

            //const cells = tableMakerReihe(tabelle, 2);
            cells[0].createEl("div", {text: key});
            cells[1].createEl("div", {text: entry});
            // cells[2].textContent = aktuell;
        });

        anzahlFelder.textContent += ergSeite.auswertung.neueFelderErstellt;
    }

    else
        anzahlFelder.textContent += "0";
        //Number(ergSeite.auswertung.neueFelderErstellt)
}



/* -------------------------------------------------------------------------------------- */

/**
 * BUTTONS
 */


/** FILTER: Gesamt (= kein Filter)-BUTTON
 * 
 */

function fltGesBtnTopFn(migManager, gesamtauswertung) {

    if (migManager.fltKeinFlt)
        return;

    setMigMngrStatus(
        migManager, 
        gesamtauswertung.finalAnzahl.gesamt
    );

    migManager.ergAuswahl = 
        getAktuellAngezeigteErg(migManager, gesamtauswertung);

    renderUI(migManager, gesamtauswertung);
}



/** FILTER-by-Keys-BUTTONS
 *  
 */

function fltByAktionKeyBtnTopFn(migManager, gesamtauswertung, alleKeysUndAnzahl) {

    if (
        !migManager.fltKeinFlt 
        && keysEntsprechenFilterauswahlCheck(migManager, alleKeysUndAnzahl)
    ) 
    return;

    const { 
        
        existsKey, felderKey, 
        aktuellKey, aktionKey, ergAnzahlByKeys 

    } = alleKeysUndAnzahl;

    setMigMngrStatus(
        migManager,
        ergAnzahlByKeys, 
        0,
        null,
        existsKey, felderKey, aktuellKey, Number(aktionKey)
    );

    migManager.ergAuswahl = 
        getAktuellAngezeigteErg(migManager, gesamtauswertung);

    renderUI(migManager, gesamtauswertung);
}



/** AKTION-ÄNDERN-BUTTONS-FN
 * 
 */

async function aktionAendernBtnTopFn(
    migManager, gesamtauswertung, 
    buttonAktion
) {

    const { migRootKl, instODef,
            fltKeinFlt, 
            fltExistsKey, fltFelderKey, fltAktuellKey, fltAktionKey,
    } = migManager;
    
    const { els 
    } = migManager.ui;
    
    const { userReg 
    } = gesamtauswertung;
    
    const { status, statusGes, ltAnalyseZuErstellende 
    } = gesamtauswertung.finalAnzahl;
    

    migManager.buttonAktion = buttonAktion;
    migManager.ergInArbeit = getAktuellAngezeigteErg(migManager, gesamtauswertung);

    
    //els.ergBox.empty();

    //const tabelle = tableMakerReiheHd(els.ergBox, els.ergTabHeaderArr);

    
    /*if (
        migManager.ergAnzahlGesamt <= migManager.ergAnzeigeBis
    ) {*/

        

        migManager.ergInArbeit.forEach(([key, entry], i) => {

            if (Number(fltAktionKey) !== Number(buttonAktion)) {

                status
                [fltExistsKey][fltFelderKey][fltAktuellKey]
                [fltAktionKey] -= 1;
                
                status
                [fltExistsKey][fltFelderKey][fltAktuellKey]
                [buttonAktion] += 1;
                
                statusGes[fltAktionKey] -= 1;
                statusGes[buttonAktion] += 1;


                if (fltExistsKey === "ne" && fltAktuellKey === "na" 
                    && Number(entry.auswertung.analyseAktion) === 2
                ) {

                    ltAnalyseZuErstellende
                    [fltExistsKey][fltFelderKey][fltAktuellKey]
                    [fltAktionKey] -= 1;
                    
                    ltAnalyseZuErstellende
                    [fltExistsKey][fltFelderKey][fltAktuellKey]
                    [buttonAktion] += 1;
                }

                entry.auswertung.aktiveAktion = buttonAktion;
                entry.auswertung.userAuswahlAktion = buttonAktion;
                userReg[key].userAuswahl = buttonAktion;

            }
        });
        
        // await writeRegJSON(app, `${migRootKl} _ ${instODef}`, userReg);
        
        renderUI(migManager, gesamtauswertung);
        
    /*} 
    
    else {

        //...
    }*/
    
}



/** AKTION-ÄNDERN-RÜCKGÄNGIG-MACHEN-BUTTON-FN
 * 
 */

async function aktionAendernRueckgaengigBtnFn(migManager, gesamtauswertung) {

    const { migRootKl, instODef,
            fltKeinFlt, 
            fltExistsKey, fltFelderKey, fltAktuellKey, fltAktionKey,
            buttonAktion
    } = migManager;
    
    const { els 
    } = migManager.ui;
    
    const { userReg 
    } = gesamtauswertung;
    
    const { status, statusGes, ltAnalyseZuErstellende 
    } = gesamtauswertung.finalAnzahl;

    migManager.ergInArbeit.forEach(([key, entry], i) => {

        status[fltExistsKey][fltFelderKey][fltAktuellKey][fltAktionKey] += 1;
        status[fltExistsKey][fltFelderKey][fltAktuellKey][buttonAktion] -= 1;
        statusGes[fltAktionKey] += 1;
        statusGes[buttonAktion] -= 1;


        if (fltExistsKey === "ne" && fltAktuellKey === "na" 
            && Number(entry.auswertung.analyseAktion) === 2
        ) {

            ltAnalyseZuErstellende
            [fltExistsKey][fltFelderKey][fltAktuellKey][fltAktionKey] += 1;

            ltAnalyseZuErstellende
            [fltExistsKey][fltFelderKey][fltAktuellKey][buttonAktion] -= 1;
        }

        entry.auswertung.aktiveAktion = fltAktionKey;
        entry.auswertung.userAuswahlAktion = null;
        userReg[key].userAuswahl = null;

    });

    migManager.buttonAktion = "";
    migManager.ergInArbeit = [];

    renderUI(migManager, gesamtauswertung);
    
}



/** AKTION-ÄNDERN-BESTÄTIGEN-BUTTON-FN
 * 
 */

async function aktionAendernBestaetigenBtnFn(migManager, gesamtauswertung) {

    const { migRootKl, instODef } = migManager;

    await writeRegJSON(app, `${migRootKl} _ ${instODef}`, gesamtauswertung.userReg);
    console.log("REG schreiben");

    migManager.fltAktionKey = migManager.buttonAktion;
    migManager.buttonAktion = "";
    migManager.ergInArbeit = [];

    renderUI(migManager, gesamtauswertung);
}



/**
 * 
 */

function navZurueckBtnFn(migManager, gesamtauswertung) {

    if (migManager.ergAnzeigeVon > 0) {
        
        if (
            (migManager.ergAnzeigeVon - migManager.ergAnzeigeBis) 
            >= 0
        ) {

            migManager.ergAnzeigeVon = 
                migManager.ergAnzeigeVon - migManager.ergAnzeigeBis;
        }

        else {

            migManager.ergAnzeigeVon = 0;
        }

        migManager.ergAuswahl = getAktuellAngezeigteErg(migManager, gesamtauswertung);
        renderErgBox(migManager, gesamtauswertung);
        renderNavInfo(migManager);
    }
}



/**
 * 
 */

function navVorBtnFn(migManager, gesamtauswertung) {

    if (
        (migManager.ergAnzeigeVon + migManager.ergAnzeigeBis) 
        <= migManager.ergAnzahlGesamt
    ) {

        migManager.ergAnzeigeVon = migManager.ergAnzeigeVon + migManager.ergAnzeigeBis;

        migManager.ergAuswahl = getAktuellAngezeigteErg(migManager, gesamtauswertung);
        renderErgBox(migManager, gesamtauswertung);
        renderNavInfo(migManager);
    }
}

