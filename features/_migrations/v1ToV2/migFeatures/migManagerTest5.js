
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
        instODef:       "migDef",
       ergAnzahlGesamt: 0,
        ergAnzeigeVon:  0,
        ergAnzeigeBis:  100,
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
        instODefBtn:            ["topUIBox",            "button",   "Definitionen"          ],
        ergHeader:              ["topUIBox",            "h5"                                ],
        uiTabBox:               ["topUIBox"                                                 ],
        sortHeader:             ["topUIBox",            "h6",       "Sortieren nach"        ],
        uiSortBox:              ["topUIBox"                                                 ],
        infoBox:                ["topUIBox"                                                 ],
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
    els.infoBox.style.height = "85px";



    els.hiddenEls = [
        //els.infoHeader,
        //els.ergHeader,
        els.uiTabBox,
        els.sortHeader,
        els.uiSortBox,
        els.infoBox,
        els.navBtnBoxTop,
        els.ergBox,
        els.belowUIBox
    ];
    
    renderHiddenEls(migManager, null);

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

            resetErgAnzUndFlt(migManager);
        
            await getGesamtauswertungUndRenderUI(migManager);
            /*
            await vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtauswertung);
            renderDynamicUI(els, dynamicUI, migManagerStatus);
            */
        }); 
    });  


    // InstODef-Button
    els.instODefBtn.addEventListener("click", async () => {

        migManager.instODef = migManager.instODef === "migDef" 
            ? "migInst" : "migDef";
        
        resetErgAnzUndFlt(migManager);

        await getGesamtauswertungUndRenderUI(migManager);
    });
    
}



/** Angezeigte Tabelle wieder auf 0, Filter auf gesamt
 *  verwendet von migRootKl- und instODef-Btns
 */

function resetErgAnzUndFlt(migManager) {

    migManager.ergAnzeigeVon = 0;

    migManager.fltKeinFlt = true;
    migManager.fltAktionKey = "";
    migManager.fltExistsKey = "";
}



/** gesamtauswertung holen => checken
 *  verwendet von migRootKl- und instODef-Btns
 */

async function getGesamtauswertungUndRenderUI(migManager) {

    const gesamtauswertung = await istMigDiscovery4(migManager);

    checkGesamtauswertungAndSetMigManagerStatus(migManager, gesamtauswertung);

    renderUI(migManager, gesamtauswertung);
}



/** gesamtauswertung checken, wenn nicht vorhanden, erg-Anzahl = 0 und hiddenEls hidden
 *  verwendet von get Gesamtauswertung Und RenderUI
 */

function checkGesamtauswertungAndSetMigManagerStatus(migManager, gesamtauswertung) {
    
    if (!gesamtauswertung || gesamtauswertung.finalAnzahl.gesamt === 0) {
        
        migManager.ergAnzahlGesamt = 0;
        migManager.ui.hidden = true;
    } else {

        migManager.ergAnzahlGesamt = gesamtauswertung.finalAnzahl.gesamt;
        migManager.ui.hidden = null;
    }
}



/** render alle dynamischen ui-Elemente gemäß gesamtauswertung
 *  verwendet von get Gesamtauswertung Und RenderUI
 */

function renderUI(migManager, gesamtauswertung) {

    if (migManager.ergAnzahlGesamt === 0) {

        renderAlwaysVisibleElements(migManager, gesamtauswertung, null);

        return;
    }
    
    
    const { els } = migManager.ui;

    renderAlwaysVisibleElements(migManager, gesamtauswertung);

    renderUIBox(migManager, gesamtauswertung);

    renderUiSortBox(migManager, gesamtauswertung);

    renderNavBoxes(migManager, gesamtauswertung);
    
    renderErgBox(migManager, gesamtauswertung);
}



/** hidden Els, info-Header, instODef-Button, ergebnis-Header
 *  verwendet von renderUI
 *  Logik: wenn gesamtauswertungvorhanden => sichtbar/rendern, sonst nicht
 */

function renderAlwaysVisibleElements(migManager, gesamtauswertung, ergVorhanden = true) {

    renderHiddenEls(migManager, ergVorhanden);

    renderInfoHeader(migManager, gesamtauswertung);
    renderInstODefBtn(migManager);
    renderErgHeader(migManager, gesamtauswertung, ergVorhanden);
}



/** hidden-Els
 * 
 */

function renderHiddenEls(migManager, ergVorhanden = true) {

    const { els } = migManager.ui;

    els.hiddenEls.forEach(el => 
        el.style.visibility = !ergVorhanden
            ? "hidden" : "visible"
    );
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

        setTimeout(() => { els.infoHeader.textContent += textArr[i] }, i * (15 + (i * 1,25)));
    }
}



/** instODef-Button
 * 
 */

function renderInstODefBtn(migManager) {

    const { els } = migManager.ui;

    els.instODefBtn.textContent = 
        migManager.instODef === "migDef" 
            ? "Definitionen" : "Instanzen";
}



/** ergebnis-Header
 * 
 */

function renderErgHeader(migManager, gesamtauswertung, ergVorhanden = true) {

    const { els } = migManager.ui;

    let textArr = [];

    if (!ergVorhanden) {

        textArr = "Keine Ergebnisse".split("");
    }

    else {

        const { 
            ergAnzahlGesamt,
            fltKeinFlt, fltExistsKey, fltFelderKey, fltAktuellKey, fltAktionKey 
        } = migManager;

        const { suchseiten, gesamt, status } = gesamtauswertung.finalAnzahl;

        if (fltKeinFlt) {

            textArr = 
                `${gesamt} Ergebnisse aus ${suchseiten} analysierten Seiten`.split("");
        }

        else {

            textArr = 
                `${status[fltExistsKey][fltFelderKey][fltAktuellKey][fltAktionKey]} Seiten (aus ${gesamt} Ergebnissen aus ${suchseiten} analysierten Seiten)`.split("");
        }
        
    }

    els.ergHeader.textContent = " ";

    for (let i = 0; i < textArr.length; i++) {

        setTimeout(() => { els.ergHeader.textContent += textArr[i] }, i * ((5) + (i * 1,25)));
    }

    
    
}



/** ui-Box: Filter-Buttons 
 * 
 */

function renderUIBox(migManager, gesamtauswertung) {

    const { els } = migManager.ui;

    const {aktionenAuswahl, aktionenTexte} = getAktionsInfos();

    /*const fltBtnInfos = {
        e: {
            a: {
                "0": "keine Aktion",
                "3": "löschen"
            },
            na: {
                "0": "keine Aktion",
                "1": "updaten",
                "3": "löschen"
            }
        },
        ne: {
            na: {
            "0": "keine Aktion",
            "2": "erstellen"
            }
        }
    };*/

    // BOX LEEREN
    els.uiTabBox.empty();

    // TABELLE
    const tabelle = tableMakerReiheHd(els.uiTabBox, els.uiTabHeaderArr);
    
    // GESAMT-BTN
    const cells = tableMakerReihe(tabelle, els.uiTabHeaderArr.length);

    cells[0].textContent = `insgesamt: ${gesamtauswertung.finalAnzahl.gesamt} Seiten`;
    const btn = cells[1].createEl("button", {text: "anzeigen"});
    
    btn.addEventListener("click", () => {

        migManager.ergAnzahlGesamt = gesamtauswertung.finalAnzahl.gesamt;
        migManager.ergAnzeigeVon = 0;

        migManager.fltKeinFlt = true;
        migManager.fltExistsKey = "";
        migManager.fltFelderKey = "";
        migManager.fltAktionKey = "";
        migManager.fltAktuellKey = "";

        renderErgHeader(migManager, gesamtauswertung);
        renderUIBox(migManager, gesamtauswertung);
        renderNavInfo(migManager);
        renderErgBox(migManager, gesamtauswertung);
    });

    // FILTER-BUTTONS                                          // e/ne: {{{...}}}
    Object.entries(gesamtauswertung.finalAnzahl.status).forEach(([existsKey, existsEntry]) => {

                                                    // f/nf: {{...}}
        Object.entries(existsEntry).forEach(([felderKey, felderEntry]) => {

                                                // a/na: {...}
            Object.entries(felderEntry).forEach(([aktuellKey, aktuellEntry]) => {

                                                        // "0": 10
                Object.entries(aktuellEntry).forEach(([aktionKey, aktionEntry]) => {
                
                    if (aktionEntry > 0) {

                        const cells = tableMakerReihe(tabelle, els.uiTabHeaderArr.length);

                        const eTxt = existsKey === "e" ? "" : "nicht existent";
                        const fTxt = felderKey === "f" ? "neue Felder vorbereitet" : "keine neuen Felder vorbereitet";
                        const aTxt = aktuellKey === "a" ? "aktuell" : "nicht aktuell";

                        cells[0].textContent = 
                                    `${aktionenTexte[aktionKey]}: ${aktionEntry} Seiten (${eTxt}${!!eTxt ? "" : aTxt}, ${fTxt})`;
                        

                        const fltBtn = 
                            cells[1].createEl("button", {text: "anzeigen"});

                        fltBtn.addEventListener("click", () => 
                            fltBtnFn(existsKey, felderKey, aktuellKey, aktionKey, aktionEntry)
                        );
                        
                        if (migManager.fltExistsKey === existsKey &&
                            migManager.fltFelderKey === felderKey &&
                            migManager.fltAktuellKey === aktuellKey &&
                            Number(migManager.fltAktionKey) === Number(aktionKey)) 
                        {
                            if (gesamtauswertung.finalAnzahl.statusGes["2"] === 0) {

                                aktionenAuswahl[existsKey][felderKey][aktuellKey][aktionKey]
                                .forEach(aktNr => {

                                    const andereAktionBtn = cells[2].createEl("button", {
                                        text: aktionenTexte[aktNr]
                                    });
                                });
                            }

                            else if (Number(aktionKey) !== 2) {

                                cells[2].createEl("div", { 
                                    text: "Erst zu erstellende Seiten bearbeiten"
                                });
                            }

                            if (Number(aktionKey) === 2) {

                                aktionenAuswahl[existsKey][felderKey][aktuellKey][aktionKey]
                                .forEach(aktNr => {

                                    const andereAktionBtn = cells[2].createEl("button", {
                                        text: aktionenTexte[aktNr]
                                    });
                                });
                            }



                            
                        }
                    }
                });
            });
        });
    });


    // Flt-Btn-Funktion für alle außer gesamt

    function fltBtnFn(existsKey, felderKey, aktuellKey, aktionKey, aktionEntry) {

        migManager.ergAnzeigeVon = 0;

        migManager.ergAnzahlGesamt = aktionEntry;

        migManager.fltKeinFlt = null;
        migManager.fltExistsKey = existsKey;
        migManager.fltFelderKey = felderKey;
        migManager.fltAktuellKey = aktuellKey;
        migManager.fltAktionKey = Number(aktionKey);

        renderErgHeader(migManager, gesamtauswertung);
        renderUIBox(migManager, gesamtauswertung);
        renderNavInfo(migManager);
        renderErgBox(migManager, gesamtauswertung);
    }
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

    ["Top", "Below"].forEach(topAndBlw => {

        els[`navBtnBox${topAndBlw}`].empty();
        
        els[`navInfoBox${topAndBlw}`] = 
            els[`navBtnBox${topAndBlw}`].createEl("span", 
                {text: `${aktuellerTab}/${tabAnzahl} `});
        
        els[`navZurueckBtn${topAndBlw}`] = 
            els[`navBtnBox${topAndBlw}`].createEl("button", { text: "zurück"});
        
        els[`navZurueckBtn${topAndBlw}`].addEventListener("click", navZurueckBtnFn);
        
        els[`navVorBtn${topAndBlw}`] = 
            els[`navBtnBox${topAndBlw}`].createEl("button", { text: "vor"});
        
        els[`navVorBtn${topAndBlw}`].addEventListener("click", navVorBtnFn);
    })
    
    

    function navZurueckBtnFn() {

        if (migManager.ergAnzeigeVon > 0) {
            
            if ((migManager.ergAnzeigeVon - migManager.ergAnzeigeBis) >= 0) {

                migManager.ergAnzeigeVon = 
                    migManager.ergAnzeigeVon - migManager.ergAnzeigeBis;
            }

            else {

                migManager.ergAnzeigeVon = 0;
            }

            renderNavInfo(migManager);
            renderErgBox(migManager, gesamtauswertung);
        }
    }

    
    function navVorBtnFn() {

        if ((migManager.ergAnzeigeVon + migManager.ergAnzeigeBis) <= migManager.ergAnzahlGesamt) {

            migManager.ergAnzeigeVon = migManager.ergAnzeigeVon + migManager.ergAnzeigeBis;

            renderNavInfo(migManager);
            renderErgBox(migManager, gesamtauswertung);
        }
    }
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

function renderInfoBox() {


}



/** Ergebnis-Tabelle: filtern, sortieren, paginieren & darstellen => renderErgCells
 * 
 */

function renderErgBox(migManager, gesamtauswertung) {
    
    const { els } = migManager.ui;

    const { analyseObjekt, finalAnzahl } = gesamtauswertung;

    els.ergBox.empty();

    const tabelle = tableMakerReiheHd(els.ergBox, els.ergTabHeaderArr);

    Object.entries(analyseObjekt)
    
    // Filtern
    .filter(([key, entry]) => {

        // Filter-Einstellungen
        const fltKeinFlt = migManager.fltKeinFlt;
        const fltExistsKey =
            migManager.fltExistsKey === (entry.normInfos.exists ? "e" : "ne");
        const fltFelderKey =
            migManager.fltFelderKey === (entry.auswertung.neueFelderErstellt > 0 ? "f" : "nf");
        const fltAktuellKey =
            migManager.fltAktuellKey === (entry.auswertung.alleFelderAktuell ? "a" : "na");
        const fltAktionKey = 
            migManager.fltAktionKey === entry.auswertung.aktiveAktion;
        
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
    
    // darstellen
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

    const { gesamt, status, statusGes } = gesamtauswertung.finalAnzahl;
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

            meldungenBox.createEl("span", {text: `${mel.info}${(i+1) < entry.meldungen.length ? ", " : ""}`});
        })
    }
    // 2: Aktion, Feld ist, neue Felder
    //cells[2].textContent = JSON.stringify(entry.neueFelderUndWerte, null, 2);
    addNeueFelderUndWerteBox(cells[2], entry);



    // 3: Filter-Buttons
    const existsKey = entry.normInfos.exists ? "e" : "ne";
    const felderKey = entry.auswertung.neueFelderErstellt > 0 ? "f" : "nf";
    const aktuellKey = entry.auswertung.alleFelderAktuell ? "a" : "na";
    let { aktiveAktion, userAuswahlAktion } = entry.auswertung;
    
    const {aktionenAuswahl, aktionenTexte} = getAktionsInfos();

    
    aktionenAuswahl[existsKey][felderKey][aktuellKey][aktiveAktion].forEach(aktionNrKey => {

        //cells[3].createEl("div", {text: "test"})
        

        const andereAktionBtn = cells[3].createEl("button", {
            text: aktionenTexte[aktionNrKey]
        });


        andereAktionBtn.addEventListener("click", async () => {

            status[existsKey][felderKey][aktuellKey][aktiveAktion] -= 1;
            status[existsKey][felderKey][aktuellKey][aktionNrKey] += 1;
            statusGes[aktiveAktion] -= 1;
            statusGes[aktionNrKey] += 1;

            entry.auswertung.aktiveAktion = aktionNrKey;
            entry.auswertung.userAuswahlAktion = aktionNrKey;
            userReg[key].userAuswahl = aktionNrKey;

            await writeRegJSON(app, `${migRootKl} _ ${instODef}`, gesamtauswertung.userReg);
            renderErgHeader(migManager, gesamtauswertung);
            renderUIBox(migManager, gesamtauswertung);
            renderErgCells(migManager, gesamtauswertung, cells, key, entry, i);
        });
    });
}



/**
 * 
 */
                              // cell[2]
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


