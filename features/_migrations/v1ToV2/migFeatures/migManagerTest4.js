
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
import { istMigDiscovery1 }     from "../migServices/istMigDiscovery1.js";
import { istMigDiscovery2 }     from "../migServices/istMigDiscovery2.js";
import { istMigDiscovery3 }     from "../migServices/istMigDiscovery3.js";



/**
 * 
 */

export async function migManagerTest4(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    const depsStatusUndREGELN = {
        app, dv,
        migRootKl: null,
        instODef: "migDef",
        tabAnzeigeFilter: "gesamt",
        tabAnzeigeSeite: 0,
        tabAnzeigeAnzahl: 100,
        MIG_REGELN: GET_MIG_REGELN()
    };

    let finalObjekt = {};
    let finalUserAuswahlReg = {};
    let finalAnzahl = {};
    let tabAnzeigeFilterBtnArr = [];

    // DOM-ELEMENTE
    const els = uiMaker(contentEl, {
        /* name             optional: [parent (contentEl), typ ("div"), text ("")] */
        // main
        mainCon:            [],
        mainHeader:         ["mainCon", "h4", "Migrations-Manager"],

        // UI
        uiCon:              ["mainCon"],
        uiConHeader:        ["uiCon", "h5", "Mig-Definitionen / Mig-Instanzen suchen"],
        
        //uiConBr2:         ["uiCon", "br"],
        migKlBtnsBox:       ["uiCon"],
        uiConBr1:           ["uiCon", "br"],
        defOInstBtn:        ["uiCon","button","Mig-Def"],
        

        // info
        ergHeader:          ["mainCon", "h5", "Auswahl treffen, um Ergebnisse anzuzeigen"],
        // infoBr1:            ["mainCon", "br"],
        infoBox:            ["mainCon",, "Feld ist bearbeiten"],
        infoBr2:            ["mainCon", "br"],
    
        // ergebnisse
        jsonSchreibenBtnBox:["mainCon"],
        jsonSchreibenBtn:   ["jsonSchreibenBtnBox","button","JSON schreiben"],
        uiConBr4:           ["mainCon", "br"],
        tabAnzFilterBtnBox: ["mainCon"],
        uiConBr5:           ["mainCon", "br"],
        tabAnzBtnBox:       ["mainCon"],
        tabAnzZurueckBtn:   ["tabAnzBtnBox","button","zurück"],
        tabAnzVorBtn:       ["tabAnzBtnBox","button","vor"],
        tabAnzInfoBox:      ["mainCon"],
        uiConBr3:           ["mainCon", "br"],
        ergCon:             ["mainCon"]
    });

    const hiddenEls = [ els.jsonSchreibenBtnBox, els.tabAnzFilterBtnBox, els.tabAnzBtnBox ];
    hiddenEls.forEach(el => el.style.visibility = "hidden");

    els.infoBox.style.height = "65px";

    const ergTabArr = [ "Nr.", "Seite", "Neue Felder und Werte", "info", "Aktion anpassen" ];
    
    // BUTTONS
    // migDefs oder migInst
    els.defOInstBtn.addEventListener("click", async () => {

        depsStatusUndREGELN.tabAnzeigeSeite = 0;
        depsStatusUndREGELN.instODef = depsStatusUndREGELN.instODef === "migInst" ? "migDef" : "migInst";
        els.defOInstBtn.textContent = depsStatusUndREGELN.instODef === "migInst" ? "Mig-Inst" : "Mig-Def";
        
        console.time("insgesamt (defOInstBtn)");
        if (!!depsStatusUndREGELN.migRootKl) 
            await istMigDiscoveryErgebnisse(depsStatusUndREGELN);
        console.timeEnd("insgesamt (defOInstBtn)");
    });

    // JSON schreiben
    els.jsonSchreibenBtn.addEventListener("click", async () => {

        await writeRegJSON(app, "test", finalUserAuswahlReg);
    });

    // migRoot-Klasse auswählen
    Object.keys(depsStatusUndREGELN.MIG_REGELN).forEach(migRootKey => {

        const btn = els.migKlBtnsBox.createEl("button", {text: migRootKey});
        
        btn.addEventListener("click", async () => {
            
            depsStatusUndREGELN.tabAnzeigeSeite = 0;
            depsStatusUndREGELN.migRootKl = migRootKey;
            //console.time("insgesamt (migRootKl-Btn)");
            await istMigDiscoveryErgebnisse(depsStatusUndREGELN);
            //console.timeEnd("insgesamt (migRootKl-Btn)");
        });
    });

    // FILTER final Anzeige ("gesamt", "updaten", usw.) 
    function renderTabAnzFilterBtn(tabAnzeigeFilterBtnArr) {

        els.tabAnzFilterBtnBox.empty();

        tabAnzeigeFilterBtnArr.forEach(key => {

            const btn = els.tabAnzFilterBtnBox.createEl("button", {text: `${key} anzeigen`});
            btn.addEventListener("click", async () => {
                depsStatusUndREGELN.tabAnzeigeFilter = key;
                await tabUndRegBauen(depsStatusUndREGELN, finalObjekt);
            });
        });
    }



    // Tabelle Anzeige zurück
    els.tabAnzZurueckBtn.addEventListener("click", async () => {

        if (depsStatusUndREGELN.tabAnzeigeSeite !== 0) {

            depsStatusUndREGELN.tabAnzeigeSeite -= depsStatusUndREGELN.tabAnzeigeAnzahl;
            await tabUndRegBauen(depsStatusUndREGELN, finalObjekt);
        }
    });

    // Tabelle Anzeige vor
    els.tabAnzVorBtn.addEventListener("click", async () => {

        if ((depsStatusUndREGELN.tabAnzeigeSeite + depsStatusUndREGELN.tabAnzeigeAnzahl) < Object.keys(finalObjekt).length) {

            depsStatusUndREGELN.tabAnzeigeSeite += depsStatusUndREGELN.tabAnzeigeAnzahl;
            await tabUndRegBauen(depsStatusUndREGELN, finalObjekt);
        }
    });

    // FETCH DATA TEST 2
    const fetchedResponse = await fetch("https://geek-jokes.sameerkumar.website/api?format=json"); 
    const fetchedData = await fetchedResponse.json();
    els.infoBox.textContent = fetchedData.joke;
    

    /**
     * 
     */

    async function istMigDiscoveryErgebnisse(depsStatusUndREGELN) {

        const {app, dv, migRootKl, instODef, MIG_REGELN } = depsStatusUndREGELN;

        console.log("FN aufrufen mit " + tabAnzeigeFilterBtnArr);
        //console.log("Button wählt migRootKl: " + migRootKl);

        els.uiConHeader.textContent = `${migRootKl}: ${instODef === "migInst" 
            ? "Instanzen (mig)" 
            : "Definitionen (mig)"}`;
        
        els.ergHeader.textContent = "Ergebnisse werden vorbereitet";

        els.infoBox.textContent = "";
        
        els.ergCon.empty();
        
        els.ergCon.textContent = "⏳ Bitte warten...";

        // Durch den Timeout wird der aktuelle Task im Event Loop
        // beendet. Nur dann wird das, was zu diesem Zeitpunkt da ist,
        // vom Browser dargestellt (d.h. "Bitte warten" wird angezeigt).
        await new Promise(resolve => setTimeout(resolve, 0));
        // Ab hier beginnt dann der nächste Task im Event Loop.

        console.time("fetch migDef");
        
        const finalUndAuswertungObjekt = istMigDiscovery3(depsStatusUndREGELN);
        
        console.timeEnd("fetch migDef");

        if (!finalUndAuswertungObjekt) {

            els.ergHeader.textContent = "Keine Ergebnisse";
            els.ergCon.empty();
            els.infoBox.empty();
            els.infoBox.textContent = fetchedData.joke;
            els.tabAnzInfoBox.empty();

            hiddenEls.forEach(el => {
                el.style.visibility = "hidden";
            });

            return;
        }


        finalObjekt = finalUndAuswertungObjekt.finalObjekt;
        finalAnzahl = finalUndAuswertungObjekt.finalAnzahl;

        const auswertungAnzTextArr =[];
        let headerPt1 = "";
        let headerPt2 = "";
        tabAnzeigeFilterBtnArr = [];

        Object.entries(finalAnzahl).forEach(([key, anz]) => {

            if (key === "aSeiten") 
                headerPt2 = `${anz} analysierten Seiten`;

            if (key === "gesamt") {
                headerPt1 = `${anz} Ergebnisse aus`;
                tabAnzeigeFilterBtnArr.push(key);
            }

            if (anz > 0) {
                
                if (key === "aktuell") {
                    auswertungAnzTextArr.push(`${anz} Ergebnisse sind bereits aktuell.`);
                    if (anz !== finalAnzahl.gesamt)
                        tabAnzeigeFilterBtnArr.push(key);
                }
                if (key === "updaten") {
                    auswertungAnzTextArr.push(`${anz} Ergebnisse sollen geupdated werden.`);
                    if (anz !== finalAnzahl.gesamt)
                        tabAnzeigeFilterBtnArr.push(key);
                }
                if (key === "erstellen") { 
                    auswertungAnzTextArr.push(`${anz} Ergebnisse sollen erstellt werden.`);
                    if (anz !== finalAnzahl.gesamt)
                        tabAnzeigeFilterBtnArr.push(key);
                }
                if (key === "loeschen") {
                    auswertungAnzTextArr.push(`${anz} Ergebnisse sollen gelöscht werden.`);
                    if (anz !== finalAnzahl.gesamt)
                        tabAnzeigeFilterBtnArr.push(key);
                }
                if (key === "geloescht") {
                    auswertungAnzTextArr.push(`${anz} Ergebnisse sind bereits gelöscht.`);
                    if (anz !== finalAnzahl.gesamt)
                        tabAnzeigeFilterBtnArr.push(key);
                }
            }
        });

        els.ergHeader.textContent = `${headerPt1} ${headerPt2}`;

        els.infoBox.empty();
        listMaker(els.infoBox, auswertungAnzTextArr);

        renderTabAnzFilterBtn(tabAnzeigeFilterBtnArr);

        finalUserAuswahlReg = await readRegJSON(app, "test");

        if (!finalUserAuswahlReg.hasOwnProperty(migRootKl))
            finalUserAuswahlReg[migRootKl] = {};

        if (!finalUserAuswahlReg[migRootKl].hasOwnProperty(instODef))
            finalUserAuswahlReg[migRootKl][instODef] = {};

        //const finalMigRootKlObj = {};

        els.ergCon.empty();
        els.ergCon.textContent = `Anzahl: ${Object.keys(finalObjekt).length}`;


        console.time("tabelle");
        await tabUndRegBauen(depsStatusUndREGELN, finalObjekt);
        console.timeEnd("tabelle");
        

        hiddenEls.forEach(el => {
            el.style.visibility = "visible";
        });
        
        
    }


    /**
     * 
     */

    async function tabUndRegBauen(depsStatusUndREGELN, finalObjekt) {

        const { app, dv, MIG_REGELN, migRootKl, instODef, 
            tabAnzeigeFilter, tabAnzeigeSeite, tabAnzeigeAnzahl } = depsStatusUndREGELN;

        const end = tabAnzeigeSeite + tabAnzeigeAnzahl;

        els.ergCon.empty();
        const tabelle = tableMakerReiheHd(els.ergCon, ergTabArr);
       
        Object.entries(finalObjekt)
        .filter(([key, entry]) => {

            if (tabAnzeigeFilter === "gesamt")
                return true;

            else if (tabAnzeigeFilter === "aktuell")
                return !!entry.auswertung.alleFelderAktuell;

            else if (tabAnzeigeFilter === "updaten")
                return finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 1;

            else if (tabAnzeigeFilter === "erstellen")
                return finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 2;

            else if (tabAnzeigeFilter === "loeschen")
                return finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 3 && entry.norm.exists;
            
            else if (tabAnzeigeFilter === "geloescht")
                return finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 3 && !entry.norm.exists;

        })

        .slice(tabAnzeigeSeite, end)
        
        .forEach(([key, entry], i) => {

            const { 
                finalSeiteAusObj, 
                neueFelderUndWerte,
                neueFelderInSeiteAktuell, 
                norm, 
                feldIst, 
                meldungen, 
                auswertung
            } = entry;

            
            if (!finalUserAuswahlReg[migRootKl][instODef].hasOwnProperty(key)) {

                finalUserAuswahlReg[migRootKl][instODef][key] = {
                    geplanteAktion: auswertung.geplanteAktion,
                    geplanteAktionNr: auswertung.geplanteAktionNr
                };
            }

            const geplanteAktion = finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktion;
            const geplanteAktionNr = finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr;

            const cells = tableMakerReihe(tabelle, ergTabArr.length);

            cells[0].textContent = i+1+tabAnzeigeSeite;

            if (norm.exists) {
                const linkFett = cells[1].createEl("b");
                placeHoverLinkOnEl(obsClsObj, linkFett, norm, norm.name);
                //cells[1].createEl("b", {text: norm.name});
            }
            else
                cells[1].createEl("b", {text: `${key}`});

            cells[1].createEl("br");
            cells[1].createEl("i", {text: `${norm.displayName}`});

            cells[1].createEl("br");
            cells[1].createEl("div", {text: `Feld ist: ${[...feldIst]}.`});
            
            const neueWerteBox = cells[2].createEl("div");
            const neueWerteTextBox = neueWerteBox.createEl("div");

            let neueWerteAnz = 0;
            Object.entries(neueFelderUndWerte).forEach(([key, entry]) => {

                neueWerteAnz += 1;
                neueWerteBox.createEl("div", {text: `${key}: ${entry}`});
            });
            neueWerteTextBox.textContent = neueWerteAnz > 0
                ? "Neue Werte: "
                : "";

            const geplanteAktionBox = cells[3].createEl("div", {text: `geplante Aktion: ${geplanteAktion}`});
            //cells[3].createEl("br");
            //cells[3].createEl("div", {text: `seite aus obj: ${[...finalSeiteAusObj]}`});
            
            if (meldungen.length > 0)
                cells[3].createEl("br");

            meldungen.forEach(mel => cells[3].createEl("div", {text: mel.info}));

            // AKTIONS-BTNs

            const aktionBtnBox = cells[4].createEl("div");
            const aktionUserTextArr = ["keine: Userauswahl", "updaten: Userauswahl", "erstellen: Userauswahl", "löschen: Userauswahl"];

            function renderUserAuswahlBtn(nr) {

                const btnText = aktionUserTextArr[nr].split(":")[0];

                const btn = aktionBtnBox.createEl("button", { text: btnText });
                btn.addEventListener("click", async () => {

                    finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr = nr;
                    finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktion = aktionUserTextArr[nr];
                    geplanteAktionBox.textContent = `geplante Aktion: ${aktionUserTextArr[nr]}`;
                    
                    await writeRegJSON(app, "test", finalUserAuswahlReg);

                    //checkAktionUndAnalyseStatus(nr);
                });
            }

            //checkAktionUndAnalyseStatus(finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr);

            //function checkAktionUndAnalyseStatus(nr) {

              //  aktionBtnBox.empty();
                // wenn keine => exists ? löschen : erstellen
                if (finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 0) { 

                    if (norm.exists) {

                        renderUserAuswahlBtn(3);

                        if (finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktion.includes("Userauswahl")) {

                            renderUserAuswahlBtn(1);
                        }
                    }
                    else {
                        renderUserAuswahlBtn(2);
                    }
                }


                // wenn updaten => keine, löschen
                if (finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 1) { 

                    renderUserAuswahlBtn(0);
                    renderUserAuswahlBtn(3);
                }


                // wenn erstellen => keine
                if (finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 2) { 

                    renderUserAuswahlBtn(0);
                }


                // wenn löschen => keine / wenn neueWerteAnz > 0: updaten
                if (finalUserAuswahlReg[migRootKl][instODef][key].geplanteAktionNr === 3) { 
                    
                    renderUserAuswahlBtn(0);
                    
                    if (neueWerteAnz > 0) {
                        
                        renderUserAuswahlBtn(1);
                    }
                }
            //}
            
            
            

            
            
        });

        await writeRegJSON(app, "test", finalUserAuswahlReg);
    }
}

