


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

    

    // ELS
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


    // AKTIONS-BUTTONS
    const buttonInfos = {
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


    // Sort-Buttons
    const sortBtnInfos = {
        name: {
            text: "Seitenname"
        },
        aktuell: {
            text: "alle Felder aktuell"
        },
        aktiveAkt: {
            text: "aktive Aktion"
        },
        userAkt: {
            text: "user Auswahl Aktion"
        }
    };



    

    const entry = {
        finalSeiteAusObj: Set([]),
        neueFelderUndWerte: {},
        neueFelderInSeiteAktuell: {},
        normInfos: { 
            exists: null,
            name: "",
            path: "",
            tFile: tFile
        },
        feldIst: [],
        meldungen: [],
        auswertung: {

                                        // 0 keine Aktion, 1 updaten, 2 erstellen, 3 loeschen,
            aktiveAktion: 0, 
            analyseAktion: 0, 
            userAuswahlAktion: 0,
            alleFelderAktuell: null,
            neueFelderErstellt: 0,
            neueFelderBereitsAktuell: 0,
            neueFelderNichtAktuell: 0
        }
    };