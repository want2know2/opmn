
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { ONT_ROOTKL }           from "../migReg/migReg.js";


/* check, check */

export function zielSeiteIstCheckTest7(app, dv, ausgangsseiteNorm, migRootKl, MIG_RENDER_ANWEISUNGEN) {

    const {ziel, checkInklSeite, ersterSeparat, felderByWert} = MIG_RENDER_ANWEISUNGEN;

    const istWerteArr = einzelnesFeldLesen(app, ausgangsseiteNorm, "ist") ?? [];

    const migObj = {
        ausgangswerte: {
            istWerte: istWerteArr,
            checkWerte: checkInklSeite ? [ausgangsseiteNorm.path, ...istWerteArr] : istWerteArr,
            checkWerteAnalysieren: []
        },
        neueWerte: {
            uniqueSets: {
                /*
                migRootKl: new Set(),
                erster: new Set(),
                letzter: new Set(),
                letzterMinus1: new Set(),
                pstatus: new Set()
                */
            },
            wertByFeld: {
                /*
                // unten erstellt mit getNeuWertObj
                migRootKl: null,
                erster: null,
                letzter: null,
                letzterMinus1: null,
                pstatus: null,
                */
            }
        },
        report: {
            migSeiteOkay: true,
            fehlerArr: []
        }
    };

    ["migRootKl", "erster", "letzter", "letzterMinus1", "pstatus"].forEach((key, i) => {
        migObj.neueWerte.uniqueSets[key] = new Set();
        const neuesFeldName = felderByWert[key];
        const migRootKlCheck = key === "migRootKl" ? migRootKl : null;
        migObj.neueWerte.wertByFeld[key] = getNeuWertObj(neuesFeldName     //, migRootKlCheck
        );
    })

    function getNeuWertObj(neuesFeldName //, migRootKl
    ) {
        /*
        if (migRootKl) 
            return {
                neuesFeld: neuesFeldName,
                uniqueArr: [ migRootKl ],
                eintragen: [ `[[${migRootKl}]]`],
                fehler: {}
            }

        else */
            return {
                neuesFeld: neuesFeldName,
                uniqueArr: [],
                eintragen: [],
                fehler: []
            }
    }

    getCheckWerte(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN);
    getUniqueSetsAusCheckWerte(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN);
    getNeueWerteAusUniqueSets(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN);

    return migObj;
}


function getNeueWerteAusUniqueSets(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN) {

    const { uniqueSets, wertByFeld } = migObj.neueWerte;
    const { felderByWert, erstellen, erlaubteTypen } = MIG_RENDER_ANWEISUNGEN;

    Object.keys(uniqueSets).forEach(key => {
        if (uniqueSets[key].size > 0) 
            wertByFeld[key].uniqueArr = [...uniqueSets[key]];

        wertByFeld[key].uniqueArr.forEach(wertPath => {
            const norm = getPageNormObject(app, dv, wertPath);
            if (!norm.exists) {
                const erstInfo = !!erstellen?.[key]
                    ? erstellen[key]
                    : null;

                const fehlerObj = {
                    quelle: key,
                    path: null,
                    meldung: `Seite zu ${wertPath} existiert nicht`,
                    erstellenAls: erstInfo
                };

                wertByFeld[key].fehler.push(fehlerObj);
                migObj.report.fehlerArr.push(fehlerObj);
            }
        })
    })
}



function getUniqueSetsAusCheckWerte(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN) {

    const { checkWerteAnalysieren } = migObj.ausgangswerte;
    const { uniqueSets, wertByFeld } = migObj.neueWerte;
    const { felderByWert, erlaubteTypen } = MIG_RENDER_ANWEISUNGEN;

    checkWerteAnalysieren.forEach(checkWertObj => {
        
        const { erkanntAls, norm, pstatus, neueWertePaths, fehler } = checkWertObj;
        
        uniqueSets.migRootKl.add(migRootKl);

        if (erkanntAls === 1)
            uniqueSets.migRootKl.add(norm.name)
        if (erkanntAls === 2 || erkanntAls === 4) { // 2 = "migDef in migRootKl" // 4 = "p-migDef in p-Status"
            uniqueSets.pstatus.add(pstatus);
        }
        if (erkanntAls === 2) {
            Object.keys(neueWertePaths).forEach(key => {
                if (!!neueWertePaths[key])
                    uniqueSets[key].add(neueWertePaths[key]);
            })
        }
        if (!!fehler)
            migObj.report.fehlerArr.push(fehler);
    });
}



function getCheckWerte(app, dv, migObj, migRootKl, MIG_RENDER_ANWEISUNGEN) {
    
    const { ausgangswerte, checkWerte, neueWerte, report } = migObj;
    const { felderByWert } = MIG_RENDER_ANWEISUNGEN;

    const migRootKlasseNorm = getPageNormObject(app, dv, migRootKl);
    const rootPStatusNorm  = getPageNormObject(app, dv, "p-Status.md");
    const defNichtPNorm  = getPageNormObject(app, dv, "nicht-p-Eintrag.md");

    ausgangswerte.checkWerteAnalysieren = ausgangswerte.checkWerte.map((checkWert, i) => {

        const path = resolveLinkPath(app, checkWert);
        const norm = getPageNormObject(app, dv, path);

        const checkWertObj = getCheckWertObj(checkWert);

        
        console.log(`checkWertObj.checkWert: ${checkWertObj.checkWert}`);


        const pStatusSet = checkWertObj.pStatusSet;
        
        
        if (typeof path !== "string") {
            checkWertObj.fehler = {
                quelle: "checkWert",
                path: null,
                meldung: `${checkWert} ist kein Link`,
                erstellenAls: null
            };
            
        } 
        
        else if (!norm.exists) {
            checkWertObj.fehler = {
                quelle: "checkWert",
                path: null,
                meldung: `Seite zu ${checkWert} existiert nicht`,
                erstellenAls: null
            };
            
        }
        
        else {
            
            const istMigRootKl = norm.name === migRootKl;
            const defInMigRootKl = checkFieldArrForLink(app, norm, "ist", migRootKlasseNorm);
            const istPStat = norm.path === rootPStatusNorm.path;
            const defInPStat = checkFieldArrForLink(app, norm, "ist", rootPStatusNorm);
            
            
            if (istMigRootKl) {
                checkNormWerteEintragen(checkWertObj, norm, 1); // 1 = "migRootKl"
            }
            else if (defInMigRootKl) {
                
                checkNormWerteEintragen(checkWertObj, norm, 2); // 2 = "migDef in migRootKl"
                migDefPStatusErmitteln(app, dv, norm, pStatusSet, rootPStatusNorm, defNichtPNorm);
                neueWerteErmitteln(app, dv, checkWertObj, migRootKl, MIG_RENDER_ANWEISUNGEN);
            }
            else if (istPStat) {
                checkNormWerteEintragen(checkWertObj, norm, 3); // 3 = "p-Status"
            }
            
            
            else if (defInPStat){
                checkNormWerteEintragen(checkWertObj, norm, 4); // 4 = "p-migDef in p-Status"
                pStatusSet.add(norm.name);
            }
            
            else {
                checkWertObj.fehler = {
                    quelle: "checkWert",
                    path: norm.path,
                    meldung: `${norm.path} gehört nicht zu ${migRootKl} oder ${rootPStatusNorm.name}`,
                    erstellenAls: null
                }
                
            }

            checkWertObj.pStatusSet;
            
        }
       
        return checkWertObj;     
        
        
    });
}

function getCheckWertObj(checkWert) {
    return {
        erkanntAls: null,
        checkWert: checkWert,
        path: null,
        exists: null,
        norm: null,
        pStatusSet: new Set(),
        fehler: {},
        neueWertePaths: {
            erster: null,
            letzter: null,
            letzterMinus1: null
        }
    }

}

function checkNormWerteEintragen(checkWertObj, norm, erkanntAls) {
    checkWertObj.erkanntAls = erkanntAls;
    checkWertObj.path = norm.path;
    checkWertObj.exists = true;
    checkWertObj.norm = norm;
}

function migDefPStatusErmitteln(app, dv, norm, pStatusSet, rootPStatusNorm, defNichtPNorm) {
    
    const defIstPStatArr = (einzelnesFeldLesen(app, norm, "ist") ?? [])
        .map(istWert => {
            const path = resolveLinkPath(app, istWert);
            const norm = getPageNormObject(app, dv, path);
            if (norm.exists) return norm;
            return null;
        })
        .filter(Boolean)
        .map(pStatNorm => {
            const pstat = checkFieldArrForLink(app, pStatNorm, "ist", rootPStatusNorm);
            if (pstat) {
                pStatusSet.add(pStatNorm.name);
                return true;
            } else return null;
        })
        .filter(Boolean);

    if (defIstPStatArr.length === 0) pStatusSet.add(defNichtPNorm.name);
}

function getFehlerObj() {
    return {
        quelle,
        path,
        meldung,
        erstellenAls
    }
}


function neueWerteErmitteln(app, dv, checkWertObj, migRootKl, MIG_RENDER_ANWEISUNGEN) {
    
    const { norm, neueWertePaths } = checkWertObj;
    const { ersterSeparat, felderByWert } = MIG_RENDER_ANWEISUNGEN;

    const splitPathOhneP = norm.name
        .replace(" (p)", "")
        .split(" _ ");

    const splitPathLength = splitPathOhneP.length;

    const neuPathsObj = {
        erster: "",
        letzter: "",
        letzterMinus1: ""
    };

    if (splitPathLength > 1) 
        neuPathsObj.erster = `${splitPathOhneP[0]} _ ${splitPathOhneP[1]}`;
    
    const cleanPathArr = splitPathOhneP
        .filter((str, i) => i !== 1 || !ersterSeparat);
    const cPathLength = cleanPathArr.length;

    for (let i = 0; i < cPathLength; i++) {
        if (cPathLength >= 1) {
            if (i <= cPathLength-3) {
                neuPathsObj.letzter += `${cleanPathArr[i]} _ `;
                neuPathsObj.letzterMinus1 += `${cleanPathArr[i]} _ `;
            }
            else if (i === cPathLength-2) {
                neuPathsObj.letzter += `${cleanPathArr[i]} _ `;
                if (cPathLength > 2)
                    neuPathsObj.letzterMinus1 += `${cleanPathArr[i]}`;
            }
            else if (i === cPathLength-1)
                neuPathsObj.letzter += `${cleanPathArr[i]}`;
        }
    }

    Object.keys(neuPathsObj).forEach(key => {
        neueWertePaths[key] = !!neuPathsObj[key]
            ? neuPathsObj[key]
            : null;
    })

}







