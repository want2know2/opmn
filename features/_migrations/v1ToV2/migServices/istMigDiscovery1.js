
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
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
    
    const erwarteteTypen = MIGRGL_ROOT.erwarteteTypen;

    const migRootKlNorm = getPageNormObject(app, dv, migRootKl);
    const rootPStatNorm  = getPageNormObject(app, dv, "p-Status.md");
    const nichtPNorm  = getPageNormObject(app, dv, "nicht-p-Eintrag.md");
    
    const RGLuINF = {
        migRootKl,
        instODef,
        MIGRGL_ROOT,
        erwarteteTypen,
        migRootKlNorm,
        rootPStatNorm,
        nichtPNorm
    }

    const EIGENE_REGELN = MIGRGL_ROOT[instODef];

    //console.log("...felderUndWerte?.letzter: " + EIGENE_REGELN.felderUndWerte?.letzter);

    const checkSeitenSet = getCheckSeiten(app, dv, RGLuINF, instODef);

    
    if (checkSeitenSet.size > 0) {

        const checkSeitenAnalysieren = [...checkSeitenSet].map(checkSeite => 
            einzelneSeiteAnalysieren(app, dv, RGLuINF, instODef, checkSeite)
        );

        /*
        checkSeitenSet.forEach(s => console.log("checkSeitenSet => einzelne zu analysierende Seite: " + s));
        return null;
        */
    }
    

    

    
    

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

    //CONSOLE
    console.log("einzelne Seite analysieren: Seite: " + seitePath);
    //*/

    // Aus den REGELN
    const migRootKl = RGLuINF.migRootKl;
    const EIGENE_REGELN = RGLuINF.MIGRGL_ROOT[RGL_KEY];
    const RGL_felderUWerte = EIGENE_REGELN.felderUndWerte;
    

    /** analyse-Objekt
     */

    const analyse = {
        sPath: seitePath,
        sNorm: null,
        alteWerte: {
            feldIst: [],
            checkWerte: []
        },
        RGL_felderUWerte,
        neueWerte: {}
    };


    // seitePath => seiteCWerteErkannt: Obj{ sPath,  sNorm, feldIst, checkWerte }
    const seiteCWerteErkannt = einzelneSeiteUndCWerkennen(app, dv, RGLuINF, RGL_KEY, seitePath);
    
    // normSeite existiert nicht => return
    if (!seiteCWerteErkannt.sNorm)
        return analyse;

   
    // erkannte checkWerte an Analyse weitergeben 
    analyse.sNorm = seiteCWerteErkannt.sNorm;
    analyse.alteWerte.feldIst = seiteCWerteErkannt.feldIst;
    analyse.alteWerte.checkWerte = seiteCWerteErkannt.checkWerte;

    // *** Neue-Felder und Werte-Objekt *** //
    const neueWerteSets = {};

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
    const RGL_KeysArr = Object.keys(RGL_felderUWerte);

    /*CONSOLE
    console.log("Regel-Keys: ")
    RGL_KeysArr.forEach(key => {
        console.log("Regel-Key: " + key);
        console.log("Feld: " + RGL_felderUWerte[key]);
    });
    //*/


    // ** neueWerteSets bearbeiten:
    //  * => erhält Keys gemäß Regeln = new Set()
    //  * => erhält Standard-Werte: migRootKl, inFeld/artPath, pstatus gemäß Regeln

    RGL_KeysArr.forEach(key => { // [migRootKl, artPath, erster, letzter, vorletzter, pstatus]
        
        // wenn für den entsprechenden Regel-Key ein Feld vorhanden ist, bspw. 
        // migRootKl: inKlasse / artPath: inFeld (also nicht null) / erster: typ usw.
        if (!!RGL_felderUWerte[key]) {

            const feldAusRgl = RGL_felderUWerte[key]; // kasse | inKlasse | stKlasse / inFeld / typ | erlaubterTyp usw.
            neueWerteSets[feldAusRgl] = new Set();

            if (key === "migRootKl") {
                neueWerteSets[feldAusRgl].add(migRootKl);
            }
            else if (key === "artPath") {
                neueWerteSets[feldAusRgl].add("art");
            }
            else if (key === "pstatus") {
                const uniquePSet = getAlleUniquePStatus(app, dv, RGLuINF, RGL_KEY, seiteCWerteErkannt.checkWerte);
                neueWerteSets[feldAusRgl] = uniquePSet;
             }
        }
    });

    const 

    
    // REGELN-Neue-Werte-Keys-Arr: "erster", "letzter", "vorletzter"
    // nur die, die auch tatsächlich in REGELN vorgesehen sind.

    /*
    const RGL_VorhandeneNeueWerteKeysArr = RGL_KeysArr
        .filter(key => key === "erster" || key === "letzter" || key === "vorletzter");
    */

    /*CONSOLE
    console.log("Neue Werte-Keys: ");
    RGL_VorhandeneNeueWerteKeysArr.forEach(key => console.log(key));
    //*/

    /*
    // *** Neue Werte erzeugen ***

    //   * ist in REGELN für Wert "letzter" ein Feld vorgesehen? 
    //     (wenn nicht, gibt es auch erster und vorletzter nicht = keine neuen Werte erzeugen)
    if (!!RGL_VorhandeneNeueWerteKeysArr.letzter) {
    //   * Dann...
        seiteCWerteErkannt.checkWerte.forEach(cwert => {
    //   * ...für jeden 2er...
            if (cwert.erkanntAls === 2) {
    //   * ...neue Werte (Pfade) erzeugen...
                const neueWerteObj = getNeueWerte(app, dv, RGLuINF, RGL_KEY, cwert.norm);
               
    //   *      // ...und anhand von REGELN-Neue-Werte-Keys-Arr =>
                RGL_VorhandeneNeueWerteKeysArr.forEach(key => {

                    // => entsprechenden Neue-Felder-Key für "erster" || "letzter" || "vorletzter" 
                    const feldAusRgl = RGL_felderUWerte[key];

                    // => entsprechenden Wert (Pfad) aus neueWerteObj für "erster" || "letzter" || "vorletzter"
                    const neuerWert = neueWerteObj[key];

                    // => Wert (Pfad) zu Neues-Feld-Key des neueWerteSetss hinzufügen
                    neueWerteSets[feldAusRgl].add(neuerWert);
                });
            }
        });
    }
    */
    
    /*CONSOLE
    Object.keys(neueWerteSets).forEach(key => {
        console.log("KEY: " + key);
        neueWerteSets[key].forEach(wert => console.log(wert));
    })
    //*/ 
    

    
    // * Return Obj *
    return analyse;
    
}




/** für einzelnen checkWertNorm (warum Norm und wo erstellt?)
 
 *  name-String bei " _ " teilen, " (p)" entfernen
    gemäß REGELN index1 entfernen
    erstellen und als Obj zurückgeben:
    {erster, letzter, vorletzter} 
    
 */

function getNeueWerte(app, dv, RGLuINF, RGL_KEY, checkWertNorm) {
    
    const EIGENE_REGELN = RGLuINF.MIGRGL_ROOT[RGL_KEY];
    const ersterSeparat = EIGENE_REGELN.ersterSeparat;

    const splitPathOhneP = checkWertNorm.name
        .replace(" (p)", "")
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

    const uniquePSet = new Set();

    checkWerte.forEach(cwert => {
        
        if (cwert.erkanntAls === 4)
            uniquePSet.add(cwert.norm.path);
        
        else if (cwert.erkanntAls === 2 || cwert.erkanntAls === 5) {
            
            const cwSeiteMitCWerten = einzelneSeiteUndCWerkennen(app, dv, RGLuINF, RGL_KEY, cwert.norm.path);
            
            cwSeiteMitCWerten.checkWerte.forEach(cwrt => {

                if (cwrt.erkanntAls === 4)
                    uniquePSet.add(cwrt.norm.path);
            })
        }

    });

    
    /*
    if (uniquePSet.size === 0)
        uniquePSet.add("nicht-p-Eintrag");
    */

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

    const einzelneSeiteNorm = getPageNormObject(app, dv, seitePath);
    const exists = einzelneSeiteNorm.exists;

    const cwerteErkanntObj = {
        sPath: seitePath,
        sNorm: exists ? einzelneSeiteNorm : null,
        feldIst: [],
        checkWerte: []
    };
    
    if (!exists) 
        return cwerteErkanntObj;

    //console.log("checkWerteErkennen: Seite-Pfad: " + einzelneSeiteNorm.path);
        
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
    
    //console.log("getCheckWerteArr: RGL_KEY: " + RGL_KEY);
    //console.log("getCheckWerteArr: checkInklSeite: " + RGLuINF.REGELN_MIGROOT[RGL_KEY].checkInklSeite);

    const checkWerte = RGLuINF.MIGRGL_ROOT[RGL_KEY].checkInklSeite
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
        return { norm: null, erkanntAls: 0 };
    }
    

    const istMigRootKl = checkWertNorm.path === migRootKlNorm.path;
    const defInMigRootKl = checkFieldArrForLink(app, checkWertNorm, "ist", migRootKlNorm);
    const istPStat = checkWertNorm.path === rootPStatNorm.path;
    const defInPStat = checkFieldArrForLink(app, checkWertNorm, "ist", rootPStatNorm);

    if (istMigRootKl) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 1);
        return { norm: checkWertNorm, erkanntAls: 1 } // 1 = "migRootKl"
    }
    else if (defInMigRootKl) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 2);
        return { norm: checkWertNorm, erkanntAls: 2 }; // 2 = "migDef in migRootKl"
    }
    else if (istPStat) {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 3);
        return { norm: checkWertNorm, erkanntAls: 3 }; // 3 = "p-Status"
    }
    else if (defInPStat){
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 4);
        return { norm: checkWertNorm, erkanntAls: 4 }; // 4 = "p-migDef in p-Status"
    }
    else {
        //console.log("checkWert erkennen: checkWertPath: "+checkWertNorm.path +" / erkanntAls: " + 5);
        return { norm: checkWertNorm, erkanntAls: 5 }; // what5ver
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

    const EIGENE_REGELN = RGLuINF.MIGRGL_ROOT[RGL_KEY];

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
    
    return checkSeitenSet;
}