
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



/**
 * 
 */

export async function migManagerTest5SAVE2(obsClsObj) {

    // Standard deps
    const { app, dv, contentEl } = obsClsObj;

    const MIG_REGELN = GET_MIG_REGELN();

    // Mig-MANAGER STATUS / User-Auswahl / REGELN
    const migManagerStatus = {
        app, dv, 
        migRootKl:       null,
        instODef:        "migDef",
        ergFltGesamt:    true,
        ergFltAktionKey: "",
        ergFltExistsKey: "",
        ergAnzVon:       0,
        ergAnzAnzahl:    100,
        ergAnzGesamt:    0,
        MIG_REGELN,
        ui: {
            contentEl,
            hidden: true,
        }
    };

    await renderUI(migManagerStatus);
}



/**
 * 
 */

async function renderUI(migManagerStatus) {
    
    const { ui } = migManagerStatus;
    
    // DOM ELemente, UI, Ergebnis-Tabelle
    const els = uiMaker(ui.contentEl, {

        topUIBox:               [],
        mainHeader:             ["topUIBox", "h4", "Migrations-Manager"],
        migKlInstODefHeader:    ["topUIBox", "h5", "Auswahl treffen"],
        migKlBtnBox:            ["topUIBox"],
        migInstODefBtn:         ["topUIBox", "button", "mig-Instanzen"],
        ergHeader:              ["topUIBox", "h5"],
        ergUITabBox:            ["topUIBox"],
        ergInfoBox:             ["topUIBox",,"test"],
        ergNavBtnBoxTop:        ["topUIBox"],
        ergNavInfoBoxTop:       ["ergNavBtnBoxTop", "span"],
        ergNavZurueckBtnTop:    ["ergNavBtnBoxTop", "button", "zurück"],
        ergNavVorBtnTop:        ["ergNavBtnBoxTop", "button", "vor"],
        
        
        ergBox:                 [],

        belowUIBox:             [],
        ergNavBtnBoxBelow:      ["belowUIBox"],
        ergNavInfoBoxBelow:     ["ergNavBtnBoxBelow", "span"],
        ergNavZurueckBtnBelow:  ["ergNavBtnBoxBelow", "button", "zurück"],
        ergNavVorBtnBelow:      ["ergNavBtnBoxBelow", "button", "vor"],
        
    });


    // CSS
    els.ergInfoBox.style.height = "85px";


    // Versteckte Elemente
    renderHiddenEls(migManagerStatus, els);

    els.hiddenEls = [
        els.ergUITabBox,
        els.ergNavBtnBoxTop, 
        els.ergNavBtnBoxBelow
    ];
    els.hiddenEls.forEach(el => el.style.visibility = "hidden");


    // Tabellenüberschriften
    els.ergUITabHeaderArr = [ 
        "Anzahl", 
        "nach Aktion filtern", 
        "Neue Werte schreiben"
    ];

    els.ergTabHeaderArr = [ 
        "Nr.", "Seite", 
        "Felder & Werte", "aktive Aktion ändern"
    ];

    

    els.migKlBtns = {};

    // MIG_ROOT Buttons
    Object.keys(migManagerStatus.MIG_REGELN).forEach(key => {

        
        els.migKlBtns[key] = els.migKlBtnBox.createEl("button", { text: key});

        els.migKlBtns[key].addEventListener("click", async () => {
            
            migManagerStatus.migRootKl = key;

            migManagerStatus.ergAnzVon = 0;

            migManagerStatus.ergFltGesamt = true;
            migManagerStatus.ergFltAktionKey = "";
            migManagerStatus.ergFltExistsKey = "";
        
            await gesamtauswertungNehmenDynamicUIBauen(migManagerStatus, els);
            /*
            await vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtauswertung);
            renderDynamicUI(els, dynamicUI, migManagerStatus);
            */
        }); 
    });  


    // MIG InstODef-Button
    els.migInstODefBtn.addEventListener("click", async () => {

        migManagerStatus.instODef = migManagerStatus.instODef === "migDef" 
            ? "migInst" : "migDef";
        
        migManagerStatus.ergAnzVon = 0;

        migManagerStatus.ergFltGesamt = true;
        migManagerStatus.ergFltAktionKey = "";
        migManagerStatus.ergFltExistsKey = "";

        await gesamtauswertungNehmenDynamicUIBauen(migManagerStatus, els);

        
    });

    
}



/**
 * 
 */

async function gesamtauswertungNehmenDynamicUIBauen(migManagerStatus, els) {

    //console.log("HALLO")
    const { app, dv, migRootKl, instODef, ui } = migManagerStatus;

    // suchseitenAnzahl, analyseObjekt, finalAnzahl, userReg
    const gesamtauswertung = await istMigDiscovery4(migManagerStatus);
    
    migManagerStatus.ergAnzGesamt = gesamtauswertung?.finalAnzahl?.gesamt ?? 0;

    renderDynamicUI(migManagerStatus, gesamtauswertung, els);

    //Object.keys(gesamtauswertung.analyseObjekt).forEach(key => console.log(key));

}



/** NEUE VERSION
 * 
 */

function renderDynamicUI(migManagerStatus, gesamtauswertung, els) {

    const { app, dv, migRootKl, instODef, ui } = migManagerStatus;

    if (!gesamtauswertung) {

        ui.hidden = true;
        els.ergHeader.textContent = "Keine Ergebnisse";
        els.ergInfoBox.empty();
        renderHiddenEls(migManagerStatus, els);
        return;
    }

    ui.hidden = null;

    const { analyseObjekt, finalAnzahl, userReg } = gesamtauswertung;
        
    renderHiddenEls(migManagerStatus, els);

    // TEXTE AKTUALISIEREN
    // InstODef - BUTTON

    /* 
        Text-Content haben folgende Elemente in dieser Reihenfolge:
        (* = dynamisch, - = nicht dynamisch)

        els.
        - mainHeader                "Migrations-Manager"
        * migKlInstODefHeader       "Auswahl treffen" 
        - migKlBtns[migRootKl]      migRootKl
        * migInstODefBtn            "Instanzen" / "Definitionen"
        * ergHeader                 "Ergebnisse"
        * ergInfoBox                "" / "Angaben zu erg diesdas"

        * ergUITabelle
        * ergTabelle

    */

    els.migKlInstODefHeader.textContent = `${migRootKl}: ${instODef}`;

    els.migInstODefBtn.textContent = migManagerStatus.instODef === "migDef" 
        ? "Definitionen" : "Instanzen";

    els.ergHeader.textContent = 
        `${finalAnzahl.gesamt} Ergebnisse aus `+
        `${finalAnzahl.suchseiten} analysierten Seiten`;

    els.ergInfoBox.empty();

    els.ergInfoBox.textContent = `von: ${migManagerStatus.ergAnzVon}, bis: ${migManagerStatus.ergAnzAnzahl},
        gesamt: ${migManagerStatus.ergAnzGesamt}`
    
    
    /*els.ergNavBtnBoxTop.empty();

    const btnZurueck = els.ergNavBtnBoxTop.createEl("button", {text: "zurück"});
    const btnVor = els.ergNavBtnBoxTop.createEl("button", {text: "vor"});

    btnZurueck.addEventListener("click", ergNavZurueckFn);
    btnVor.addEventListener("click", ergNavVorFn);*/
    

    /*
    [els.ergNavBtnBoxTop, els.ergNavBtnBoxBelow].forEach(box => {

        box.empty();

        const btnZurueck = box.createEl("button", {text: "zurück"});
        const btnVor = box.createEl("button", {text: "vor"});

        btnZurueck.addEventListener("click", ergNavZurueckFn);
        btnVor.addEventListener("click", ergNavVorFn);
    });*/

    
    /*
    els.ergNavZurueckBtnTop.addEventListener("click", ergNavZurueckFn);
    els.ergNavZurueckBtnBelow.addEventListener("click", ergNavZurueckFn);

    els.ergNavVorBtnTop.addEventListener("click", ergNavVorFn);
    els.ergNavVorBtnBelow.addEventListener("click", ergNavVorFn);
    */

    function ergNavZurueckFn() {

        if (migManagerStatus.ergAnzVon > 0) {

            if ((migManagerStatus.ergAnzVon - migManagerStatus.ergAnzAnzahl) <= 0) {

                migManagerStatus.ergAnzVon = 0;
            }

            else {

                migManagerStatus.ergAnzVon = (migManagerStatus.ergAnzVon - migManagerStatus.ergAnzAnzahl);
            }

            renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
        }
    }


    function ergNavVorFn() {

        if ((migManagerStatus.ergAnzVon + migManagerStatus.ergAnzAnzahl) 
            <= migManagerStatus.ergAnzGesamt) 
        {
            migManagerStatus.ergAnzVon = (migManagerStatus.ergAnzVon + migManagerStatus.ergAnzAnzahl);

            renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
        }
    }

    
    // FILTER BUTTONS Tabelle usw.

    els.ergUITabBox.empty();

    els.ergUITabelle = tableMakerReiheHd(els.ergUITabBox, els.ergUITabHeaderArr);

    const cells = tableMakerReihe(els.ergUITabelle, els.ergUITabHeaderArr.length);    

    cells[0].textContent = `${finalAnzahl.gesamt} Seiten`;
    
    const fltGesamtBtn = cells[1].createEl("button", { text: "gesamt anzeigen"});

    fltGesamtBtn.addEventListener("click", () => {

        migManagerStatus.ergAnzGesamt = finalAnzahl.gesamt;

        migManagerStatus.ergAnzVon = 0;

        migManagerStatus.ergFltGesamt = true;
        migManagerStatus.ergFltAktionKey = "";
        migManagerStatus.ergFltExistsKey = "";

        renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
    });

    const fltBtnText = {
        "0": {
             e: "keine Aktion (exists)",
            ne: "keine Aktion (!exists)"
        },
        "1": {
             e: "updaten"
        },
        "2": {
            ne: "erstellen"
        },
        "3": {
             e: "löschen"
        }
    };


    // FILTER BUTTONS

    Object.entries(finalAnzahl)
    .filter(([key, entry]) => 
        key !== "suchseiten" && key !== "gesamt"
    )

    .forEach(([key, entry]) => {

        

        if (entry.hasOwnProperty("e")) {

            if (entry["e"] > 0) {

                const cells = tableMakerReihe(els.ergUITabelle, els.ergUITabHeaderArr.length);
                
                cells[0].textContent = `${entry["e"]} Seiten`;

                const fltBtn = cells[1].createEl("button", { text: `${fltBtnText[key]["e"]} anzeigen`});

                fltBtn.addEventListener("click", () => {

                    migManagerStatus.ergAnzGesamt = entry["e"];

                    migManagerStatus.ergAnzVon = 0;

                    migManagerStatus.ergFltGesamt = null;
                    migManagerStatus.ergFltAktionKey = key;
                    migManagerStatus.ergFltExistsKey = "e";

                    renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
                });
            }
        }

        if (entry.hasOwnProperty("ne")) {

            if (entry["ne"] > 0) {

                const cells = tableMakerReihe(els.ergUITabelle, els.ergUITabHeaderArr.length);

                cells[0].textContent = `${entry["ne"]} Seiten`;

                const fltBtn = cells[1].createEl("button", { text: `${fltBtnText[key]["ne"]} anzeigen`});

                fltBtn.addEventListener("click", () => {

                    migManagerStatus.ergAnzGesamt = entry["ne"];

                    migManagerStatus.ergAnzVon = 0;

                    migManagerStatus.ergFltGesamt = null;
                    migManagerStatus.ergFltAktionKey = key;
                    migManagerStatus.ergFltExistsKey = "ne";

                    renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
                });
            }
        }
    });
    
    
   


    renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els);
    

}



function renderErgTabUndInfoBoxen(migManagerStatus, gesamtauswertung, els) {

    

    const ergAnzAnzahlTabs = Math.ceil((migManagerStatus.ergAnzGesamt / migManagerStatus.ergAnzAnzahl));
    const ergAnzAktuelleTab = ((migManagerStatus.ergAnzVon / migManagerStatus.ergAnzAnzahl)+1);

    [els.ergNavInfoBoxTop, els.ergNavInfoBoxBelow].forEach(el => {

        el.empty();

        el.textContent = `(${ergAnzAktuelleTab} / ${ergAnzAnzahlTabs})`
    });
    

    renderErgebnistabelle(migManagerStatus, gesamtauswertung, els);

}



function renderErgebnistabelle(migManagerStatus, gesamtauswertung, els) {

    const { analyseObjekt } = gesamtauswertung;

    els.ergBox.empty();

    els.ergTabelle = tableMakerReiheHd(els.ergBox, els.ergTabHeaderArr);

    
    Object.entries(analyseObjekt)
        .filter(([key, entry]) => {

            let test = null;

            if (migManagerStatus.ergFltGesamt) 
                test = true;

            if ((entry.auswertung.aktiveAktion === Number(migManagerStatus.ergFltAktionKey)) 
            && ((entry.normInfos.exists ? "e" : "ne") === migManagerStatus.ergFltExistsKey))
                test = true;
            
            return test;
        })
        .filter(([key, entry], i) => {

            return (i >= migManagerStatus.ergAnzVon) 
                && (i <= ((migManagerStatus.ergAnzVon + migManagerStatus.ergAnzAnzahl)-1));
        })
        .sort(([aKey, aEntry],[bKey, bEntry]) => {
            return aEntry.auswertung.aktiveAktion - bEntry.auswertung.aktiveAktion
        })
        .forEach(([key, entry], i) => {

            //console.log("anakyseSeite: " + key)

            const cells = tableMakerReihe(els.ergTabelle, els.ergTabHeaderArr.length);
            
            const iPlusNav = i + migManagerStatus.ergAnzVon;

            renderErgebnisCells(migManagerStatus, gesamtauswertung, cells, iPlusNav, key, entry);
        });
        
}


function renderErgebnisCells(migManagerStatus, gesamtauswertung, cells, i, seiteKey, seiteEntry) {
    
    const { app, dv, migRootKl, instODef, ui } = migManagerStatus;

    cells[0].textContent = i+1;
    cells[1].textContent = seiteKey;
    cells[2].textContent = JSON.stringify(seiteEntry.auswertung, null, 2);
    cells[3].empty();

    
    const zuErstellendeButtons = {
        "0": {
            e: {
                "0": [3],
                "3": [0]
            },
            ne: {
                "0": [2],
                "2": [0]
            }
        },
        "1": {
            e: {
                "0": [1,3],
                "1": [0,3],
                "3": [0,1]
            }
        },
        "2": {
            ne: {
                "0": [2],
                "2": [0]
            }
        },
        "3": {
            e: {
                "0": [1,3],
                "1": [0,3],
                "3": [0,1]
            }
        }
    };

    const buttonVorlagen = {
        "0": { text: "keine Aktion" },
        "1": { text: "updaten" },
        "2": { text: "erstellen" },
        "3": { text: "löschen" }
    };

    function auswahlButtonFn(nr) {

        seiteEntry.auswertung.aktiveAktion = nr;
        seiteEntry.auswertung.userAuswahlAktion = nr;
        gesamtauswertung.userReg[seiteKey].userAuswahl = nr;
        writeRegJSON(app, `${migRootKl} _ ${instODef}`, gesamtauswertung.userReg);
        renderErgebnisCells(migManagerStatus, gesamtauswertung, cells, i, seiteKey, seiteEntry);

    }

    const key_analyseAktion = seiteEntry.auswertung.analyseAktion;
    const key_exists = seiteEntry.normInfos.exists ? "e" : "ne";
    const key_aktiveAktion = seiteEntry.auswertung.aktiveAktion;
    
    zuErstellendeButtons[key_analyseAktion][key_exists][key_aktiveAktion]
    .forEach(nr => {

        const btn = cells[3].createEl("button", { text: buttonVorlagen[nr].text});
        btn.addEventListener("click", () => auswahlButtonFn(nr));

    });
    


}


/**
 * 
 */

function renderHiddenEls(migManagerStatus, els) {

    //
    const { hidden } = migManagerStatus.ui;

    // HIDDEN ELs
    const hiddenEls = [
        els.ergUITabBox,
        els.ergNavBtnBoxTop,
        els.ergNavBtnBoxBelow,
        //els.ergHeader,
        els.ergBox
    ];
    
    hiddenEls.forEach(el => 
        el.style.visibility = hidden
            ? "hidden" : "visible"
    );
}

