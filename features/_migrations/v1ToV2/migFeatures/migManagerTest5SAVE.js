
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
import { istMigDiscovery3 }     from "../migServices/istMigDiscovery3.js";
import { getEmptyFinalSeiteObj } from "../migServices/istMigDiscovery4.js";



/**
 * 
 */

export async function migManagerTest5SAVE(obsClsObj) {

    // Standard deps
    const { app, dv, contentEl } = obsClsObj;


    // Mig-MANAGER STATUS / User-Auswahl / REGELN
    const migManagerStatus = {
        app, dv, 
        migRootKl:      null,
        instODef:       "migDef",
        ergAnzFilter:   "gesamt",
        ergAnzVon:      0,
        ergAnzBisPlus:  100,
        MIG_REGELN:     GET_MIG_REGELN()
    };


    // GESAMT-OBJEKT (User-Auswahl-REG und Such-ERG)
    
    const gesamtObj = {
        finalUserAuswahlReg: {},
        finalErgUUserGesamt: {},
        finalAnzahl: {},
        finalErgUUserGesamtAnzahl: {} // Hier werden gezählt:
            // Wenn Aktion in Reg-Eintrag angegeben, hat diese Vorrang.
            // Wenn keine Aktion in Reg-Eintrag angegeben, 
            // Aktion von Erg-Eintrag übernehmen. 
    };

    /* kann weg
    let finalUserAuswahlReg = {};
    let finalErgUUserGesamt = {};
    let finalAnzahl = {};
    let finalUserAnzahl = {};
    */

    // DOM ELemente, UI, Ergebnis-Tabelle
    const els = uiMaker(contentEl, {

        topUIBox:               [],
        mainHeader:             ["topUIBox", "h4", "Migrations-Manager"],
        migKlInstODefHeader:    ["topUIBox", "h5", "Auswahl treffen"],
        migKlBtnBox:            ["topUIBox"],
        migInstODefBtn:         ["topUIBox", "button", "mig-Instanzen"],
        ergHeader:              ["topUIBox", "h5", "Ergebnisse"],
        ergInfoBox:             ["topUIBox"],
        ergUITabBox:            ["topUIBox"],
        ergNavBtnBoxTop:        ["topUIBox"],
        ergNavZurueckBtnTop:    ["ergNavBtnBoxTop", "button", "zurück"],
        ergNavVorBtnTop:        ["ergNavBtnBoxTop", "button", "vor"],
        
        ergBox:                 [],

        belowUIBox:             [],
        ergNavBtnBoxBelow:      ["belowUIBox"],
        ergNavZurueckBtnBelow:  ["ergNavBtnBoxBelow", "button", "zurück"],
        ergNavVorBtnBelow:      ["ergNavBtnBoxBelow", "button", "vor"],
    });


    // CSS
    els.ergInfoBox.style.height = "65px";


    // Versteckte Elemente
    const hiddenEls = [
        els.ergUITabBox,
        els.ergNavBtnBoxTop, 
        els.ergNavBtnBoxBelow
    ];
    hiddenEls.forEach(el => el.style.visibility = "hidden");


    // Tabellenüberschriften
    const ergUITabHeaderArr = [ 
        "Status / Anzahl Ergebniss", "Ergebnisse filtern", 
        "Neue Werte in Ergebnisse schreiben"
    ];

    const ergTabHeaderArr = [ 
        "Nr.", "Ergebnisseite", 
        "neue Felder & Werte", "Aktion auswählen"
    ];


    // Erg-Infos & UI-Buttons-Tabelle
    const ergUITabelle = tableMakerReiheHd(els.ergUITabBox, ergUITabHeaderArr);


    // dynamische Elemente
    const dynamicUI = { 
        hiddenEls,
        ergUITabelle
    };
    

    // MIG_ROOT Buttons
    Object.keys(migManagerStatus.MIG_REGELN).forEach(key => {

        const btn = els.migKlBtnBox.createEl("button", { text: key});

        btn.addEventListener("click", async () => {
            
            migManagerStatus.migRootKl = key;

            await vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtObj);
            renderDynamicUI(els, dynamicUI, migManagerStatus);
        }); 
    });  


    // MIG InstODef-Button
    els.migInstODefBtn.addEventListener("click", async () => {

        migManagerStatus.instODef = migManagerStatus.instODef === "migDef" 
            ? "migInst" : "migDef";

        els.migInstODefBtn.textContent = migManagerStatus.instODef === "migDef" 
            ? "Definitionen" : "Instanzen";

        if (!!migManagerStatus.migRootKl)
            await vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtObj);
        // renderDynamicUI(els, dynamicUI, migManagerStatus);

        // +++ TEST +++
        els.ergInfoBox.empty();
        els.ergInfoBox.textContent = Object.keys(gesamtObj).join("FELD: ");
    });
}



/**
 * 
 */

async function vergleicheFinalErgUndUserAuswahl(migManagerStatus, gesamtObj) {

    // Standard Deps
    const { app, dv, migRootKl, instODef } = migManagerStatus;


    // Such-ERGEBNISSE und User-Auswahl-REGISTRY
    const finalUndAuswertungObjekt = istMigDiscovery3(migManagerStatus);
    const finalUserAuswahlReg = await readRegJSON(app, `${migRootKl}_${instODef}`);

    console.log(Object.keys(finalUndAuswertungObjekt.finalObjekt).length);
    

    // ERG und REG BEIDE nicht vorhanden
    if (!finalUndAuswertungObjekt && !finalUserAuswahlReg) {
        
        console.log("BEIDE nicht vorhanden");
        return gesamtObj;
    }
        

    // User-REG nicht vorhanden
    if (!finalUserAuswahlReg) {

        console.log("REG nicht vorhanden");

        // ERG finalObjekt = Grundlage für GEMEINSAMES Objekt ERG + REG
        gesamtObj.finalErgUUserGesamt = finalUndAuswertungObjekt.finalObjekt;
        // ERG finalAnzahl bleibt unverändert wie von ERG geliefert
        gesamtObj.finalAnzahl = finalUndAuswertungObjekt.finalAnzahl;

        console.log(`
            ges:       ${gesamtObj.finalAnzahl.gesamt}
            aktuell:   ${gesamtObj.finalAnzahl.aktuell}
            updaten:   ${gesamtObj.finalAnzahl.updaten}
            erstellen: ${gesamtObj.finalAnzahl.erstellen}
            löschen:   ${gesamtObj.finalAnzahl.loeschen}
            gelöscht:  ${gesamtObj.finalAnzahl.geloescht}
        `);
        
        // REG übernimmt alle Einträge von ERG
        Object.entries(gesamtObj.finalErgUUserGesamt).forEach(([key, entry]) => {

            gesamtObj.finalUserAuswahlReg[key] = {};

            gesamtObj.finalUserAuswahlReg[key].inErg = true;
            gesamtObj.finalUserAuswahlReg[key].inReg = true;
            
            gesamtObj.finalUserAuswahlReg[key].geplanteAktion = entry.auswertung.geplanteAktion;
            gesamtObj.finalUserAuswahlReg[key].geplanteAktionNr = entry.auswertung.geplanteAktionNr;
            gesamtObj.finalUserAuswahlReg[key].userAuswahlAktion = null;
            gesamtObj.finalUserAuswahlReg[key].userAuswahlAktionNr = null; 
            
            // ERG um die Werte ergänzen, die nicht von ERG geliefert werden
            entry.auswertung.inErg = true;
            entry.auswertung.inReg = true;
            entry.auswertung.userAuswahlAktion = null;
            entry.auswertung.userAuswahlAktionNr = null;
        });

        return gesamtObj;
    }

    // ERG nicht vorhanden - wird in der Praxis ohnehin kaum vorkommen.. 
    if (!finalUndAuswertungObjekt) {

        console.log("ERG nicht vorhanden");

        // Neuen Eintrag für GEMEINSAMES ERG + REG - Objekt erstellen
        Object.entries(finalUserAuswahlReg).forEach(([key, entry]) => {

            const neuerEintrag = getEmptyFinalSeiteObj("",{},true);

            neuerEintrag.auswertung.inErg = null;
            neuerEintrag.auswertung.inReg = true;

            neuerEintrag.auswertung.geplanteAktion = null;
            neuerEintrag.auswertung.geplanteAktionNr = null;
            neuerEintrag.auswertung.userAuswahlAktion = entry.userAuswahlAktion;
            neuerEintrag.auswertung.userAuswahlAktionNr = entry.userAuswahlAktionNr;

            // Neuen Eintrag an GEMEINSAMES ERG + REG - Objekt anhängen
            gesamtObj.finalErgUUserGesamt[key] = neuerEintrag;
        });
        
        return gesamtObj;
    }

    
    // REG und ERG - beide vorhanden 

    console.log("REG und ERG vorhanden");


    // ERG finalObjekt = Grundlage für GEMEINSAMES Objekt ERG + REG
    gesamtObj.finalErgUUserGesamt = finalUndAuswertungObjekt.finalObjekt;
    // ERG finalAnzahl bleibt unverändert wie von ERG geliefert
    gesamtObj.finalAnzahl = finalUndAuswertungObjekt.finalAnzahl;

    console.log(`
        ges:       ${gesamtObj.finalAnzahl.gesamt}
        aktuell:   ${gesamtObj.finalAnzahl.aktuell}
        updaten:   ${gesamtObj.finalAnzahl.updaten}
        erstellen: ${gesamtObj.finalAnzahl.erstellen}
        löschen:   ${gesamtObj.finalAnzahl.loeschen}
        gelöscht:  ${gesamtObj.finalAnzahl.geloescht}
    `);

    // Hier werden gezählt:
    // Wenn Aktion in Reg-Eintrag angegeben, hat diese Vorrang.
    // Wenn keine Aktion in Reg-Eintrag angegeben, 
    // Aktion von Erg-Eintrag übernehmen. 
    const finalErgUUserGesamtAnzahl = { 
        gesamt:    0,
        aktuell:   0,
        updaten:   0,
        erstellen: 0,
        loeschen:  0,
        geloescht: 0
    };


    // GEMEINSAMES Objekt ERG + REG (= zunächst einfach ERG.finalObjekt),
    // dann mit REG-Einträgen vergleichen + beide ergänzen
    Object.entries(gesamtObj.finalErgUUserGesamt).forEach(([key, entry]) => {

        // ERG-Eintrag ist natürlich sowieso .inErg und wird im 
        // nächsten Schritt, wenn nicht bereits in REG vorhanden,
        // für REG erstellt und dort angehangen, also .inErg und 
        // .inReg beide = true
        entry.auswertung.inErg = true;
        entry.auswertung.inReg = true;

        
        // ERG-Eintrag noch nicht in REG voorhanden
        if (!finalUserAuswahlReg.hasOwnProperty(key)) {

            // REG-Eintrag erstellen
            finalUserAuswahlReg[key] = {};

            finalUserAuswahlReg[key].inErg = true;
            finalUserAuswahlReg[key].inReg = true;

            finalUserAuswahlReg[key].geplanteAktion 
                = entry.auswertung.geplanteAktion;
            finalUserAuswahlReg[key].geplanteAktionNr 
                = entry.auswertung.geplanteAktionNr;
            
            finalUserAuswahlReg[key].userAuswahlAktion = null;
            finalUserAuswahlReg[key].userAuswahlAktionNr = null;

            // ERG-Eintrag aktualisieren
            entry.auswertung.userAuswahlAktion = null;
            entry.auswertung.userAuswahlAktionNr = null;
        }

        // ERG-Eintrag bereits in REG voorhanden
        else {

            // Wenn ERG.geplanteAktion anders als in REG, von ERG übernehmen
            if (finalUserAuswahlReg[key].geplanteAktion 
                !== entry.auswertung.geplanteAktion) 
            {
                finalUserAuswahlReg[key].geplanteAktion 
                    = entry.auswertung.geplanteAktion;
            }

            // Wenn ERG.geplanteAktionNr anders als in REG, von ERG übernehmen
            if (finalUserAuswahlReg[key].geplanteAktionNr 
                !== entry.auswertung.geplanteAktionNr) 
            {
                finalUserAuswahlReg[key].geplanteAktionNr 
                    = entry.auswertung.geplanteAktionNr;
            }
        }        
    });


    // Checken, ob es Einträge in REG gibt, die NICHT in ERG vorhanden sind - dürfte vermutlich ziemlich seltenen vorkommen
    Object.keys(finalUserAuswahlReg).forEach(key => {


        if (!gesamtObj.finalErgUUserGesamt.hasOwnProperty(key)) {
        
            // Neuen Eintrag für GEMEINSAMES ERG + REG - Objekt erstellen
            const neuerEintrag = getEmptyFinalSeiteObj("",{},true);

            neuerEintrag.auswertung.inErg = null;
            neuerEintrag.auswertung.inReg = true;

            neuerEintrag.auswertung.geplanteAktion = null;
            neuerEintrag.auswertung.geplanteAktionNr = null;

            // Neuen Eintrag an GEMEINSAMES Obj anhängen
            gesamtObj.finalErgUUserGesamt[key] = neuerEintrag;
        }
    });
}











/**
 * 
 */

function renderDynamicUI(els, dynamicUI, migManagerStatus) {

    dynamicUI.hiddenEls.forEach(el => el.style.visibility = "visible");

    els.ergInfoBox.empty();
    els.ergInfoBox.textContent = migManagerStatus.migRootKl 
        ?? "keine Auswahl";

    if (!!migManagerStatus.instODef)
        els.ergInfoBox.textContent += ` ${migManagerStatus.instODef}`;

    
}

