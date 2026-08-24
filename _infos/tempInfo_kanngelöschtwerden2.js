
    //////////////////////////////////////////
    // Filter-Buttons in UITab

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

    
// ---------------------------------------------------------------------------------------- //
    
    ////////////////////////////////
    // Filter-Buttons in ErgCell

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

    