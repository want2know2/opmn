
    await updateFrontmatter(app, p, fm => {
        setField(fm, "klass", [inhaltSeite.wikiLink]);
        setField(fm, "typ", istSeiteArr);
        setField(fm, "art", typArr);
        setField(fm, "pstatus", [pStatusSeite.wikiLink]);
        removeField(fm, "ist");
    });

   
// ---------------------------------------------------------------------------------------- //

/**
 * Status-quo:
 * - Nach Aktion filtern geht 
 * - Aktion ändern-Btns werden nur angezeigt, wenn Kriterien erfüllt
 *      (alle erstellen erledigt oder erstellen)
 * 
 * Was muss noch passieren?
 * - Aktion ändern-Btns-Funktionen
 * 
 *      - Für UI-Box:
 *          - wenn mehr Ergebnisse als auf Tab passen:
 *              in Info-Box schreiben "ersten x-Anzahl aktualisieren?" + Btn ausführen / Btn zurück
 *              wenn ausführen:
 *                  ersten xAnz ausführen, fragen, ob zur nächsten Tab-Seite wechseln + ausführen
 * 
 *      - Für Cells-Btns:
 *          - Aktion ausführen
 */




    async function andereAktionBtnFn(migManager, gesamtauswertung, existsKey, felderKey, aktuellKey, aktiveAktion, buttonAktion) {
        
        status[existsKey][felderKey][aktuellKey][aktiveAktion] -= 1;
        status[existsKey][felderKey][aktuellKey][buttonAktion] += 1;
        statusGes[aktiveAktion] -= 1;
        statusGes[buttonAktion] += 1;

        entry.auswertung.aktiveAktion = buttonAktion;
        entry.auswertung.userAuswahlAktion = buttonAktion;
        userReg[key].userAuswahl = buttonAktion;

        await writeRegJSON(app, `${migRootKl} _ ${instODef}`, gesamtauswertung.userReg);
        renderErgHeader(migManager, gesamtauswertung);
        renderUIBox(migManager, gesamtauswertung);
        renderErgCells(migManager, gesamtauswertung, cells, key, entry, i);
    }