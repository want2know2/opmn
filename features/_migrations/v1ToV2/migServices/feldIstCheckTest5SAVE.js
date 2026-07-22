
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { ONT_ROOTKL }           from "../migReg/migReg.js";


/* check, check */

export function zielSeiteIstCheckTest5SAVE(app, dv, zielseiteNorm, rootKlKey, istObjInfos) {

    const istWerteArr = einzelnesFeldLesen(app, zielseiteNorm, "ist") ?? [];

    const { infos } = istObjInfos;

    const istObj = {
        infos,
        istWerte: istWerteArr,
        checkWerte: infos.zielseiteInkl ? [zielseiteNorm.wikiLink, ...istWerteArr] : istWerteArr,
        istMigObjs: []
    }
    
    /*
    const zielseiteInkl = !defOInst 
        || (!ONT_ROOTKL[rootKlKey].instances && ONT_ROOTKL[rootKlKey].instByRoot);

    const typVorhanden = Object.keys(ONT_ROOTKL[rootKlKey].felder).includes("typ");
    
    const istObj = {
        infos: {
            zielseiteInkl: zielseiteInkl ?? null,
        },
        istWerte: istWerteArr,
        checkWerte: zielseiteInkl ? [zielseiteNorm.wikiLink, ...istWerteArr] : istWerteArr,
        istMigObjs: []
    };
    */

    getMigObjsFromCheckWerte(app, dv, istObj, rootKlKey);
    
    getNeueWerteObjFromMigObjs(app, dv, istObj);

    
    
    return istObj;
}


function getNeueWerteObjFromMigObjs(app, dv, istObj) {

    const { istMigObjs } = istObj;
    
    const neuUniqueObj = { okay: null };
    const neuKeysArr = [ "erster", "letzter", "vorletzter" ];

    neuKeysArr.forEach(uniqueKey => {
        neuUniqueObj[uniqueKey] = { inFeld: null, erstellt: null, eintragen: new Set() };
    });

    istMigObjs.forEach(migObj => {
        const { neueWerteObj } = migObj;
        if (neueWerteObj && neueWerteObj?.erstellt) {
            neuKeysArr.forEach(neuKey => {
                const neuObj = neueWerteObj[neuKey];
                if (neuObj?.erstellt && !neuObj?.fehler) {
                    neuUniqueObj[neuKey].eintragen.add(neuObj.wikiLink);
                }
            });
        }
    });
    
    neuKeysArr.forEach(uniqueKey => {
        const neuObj = neuUniqueObj[uniqueKey];
        const arr = [...neuObj.eintragen];
        if (arr.length > 0) {
            neuObj.erstellt = true;
            neuObj.eintragen = arr;
        }
        else {
            neuObj.erstellt = null;
            neuObj.eintragen = [];
        }
    });
    
    istObj.neueWerteObj = neuUniqueObj;
}


function getMigObjsFromCheckWerte(app, dv, istObj, rootKlKey) {

    const { checkWerte } = istObj;

    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const rootPStatusNorm  = getPageNormObject(app, dv, "p-Status.md");
    const defNichtPNorm  = getPageNormObject(app, dv, "nicht-p-Eintrag.md");

    checkWerte.forEach(checkWert => {

        const path = resolveLinkPath(app, checkWert);
        const norm = getPageNormObject(app, dv, path);

        const migObj = {
            istWert: checkWert,
            exists: null,
            fehler: null,
        };

        if (typeof path !== "string") migObj.fehler = `${checkWert} ist kein Link`;
        else if (!norm.exists) migObj.fehler = `Seite zu ${checkWert} existiert nicht`;
        else {
            migObj.path = norm.path;
            migObj.exists = true; 
            migObj.norm = norm;
            migObj.pstatus = [];

            const istRootKl = norm.path === rootKlKey;
            const defInRootKl = checkFieldArrForLink(app, norm, "ist", rootKlasseNorm);
            const istPStat = norm.path === rootPStatusNorm.path;
            const defInPStat = checkFieldArrForLink(app, norm, "ist", rootPStatusNorm);

            if (!istRootKl && !defInRootKl && !istPStat && !defInPStat)
                migObj.fehler = `${norm.path} nicht (in) ${rootKlKey} und nicht (in) ${rootPStatusNorm.path}`;
            else if (defInRootKl) {
                const defIstPStatArr = (einzelnesFeldLesen(app, norm, "ist") ?? [])
                    .map(istWert => {
                        const path = resolveLinkPath(app, istWert);
                        const norm = getPageNormObject(app, dv, path);
                        if (norm.exists) return norm;
                        return null;
                    })
                    .filter(Boolean)
                    .forEach(pStatNorm => {
                        const pstat = checkFieldArrForLink(app, pStatNorm, "ist", rootPStatusNorm);
                        if (pstat) migObj.pstatus.push(pStatNorm.path);
                    });
                
                migObj.neueWerteObj = getNeueWerteObj(app, dv, norm, rootKlKey);
            }
            else if (defInPStat) migObj.pstatus.push(norm.path);
            if (migObj.pstatus.length === 0) migObj.pstatus.push(defNichtPNorm.path);
        }   

        istObj.istMigObjs.push(migObj)
    });
}


function getNeueWerteObj(app, dv, defInRtKlNorm, rootKlKey) {

    const neueWerteObj = {
        erstellt: true
    };
    
    const rootName = rootKlKey.replace(".md", "");

    const splitPathOhneP = defInRtKlNorm.path
        .replace(".md", "")
        .replace(" (p)", "")
        .split(" _ ");
    
    const cleanPathArr = splitPathOhneP
        .filter((str, i) => i !== 1);
    const cPathLength = cleanPathArr.length;
    
    let erster = `${rootName} _ ${splitPathOhneP[1]}`;
    let letzter = "";
    let vorletzter = "";

    cleanPathArr.forEach((str, i) => {
        if (i < cPathLength -1) {
            letzter += `${str} _ `;
            if (cPathLength >2 && i < cPathLength -2)
                vorletzter += `${str} _ `
            else if (cPathLength > 2) vorletzter += `${str}`;
        }
        else letzter += `${str}`
    })

    if (letzter === rootName || letzter === "") letzter = null;
    if (vorletzter === "") vorletzter = null;
    
    neueWerteObj.erster = getNeuWrtObj(app, dv, erster);
    neueWerteObj.letzter = getNeuWrtObj(app, dv, letzter);
    neueWerteObj.vorletzter = getNeuWrtObj(app, dv, vorletzter);

    function getNeuWrtObj(app, dv, neuerWert) {
        
        const neuWrtObj = {
            erstellt: neuerWert ? true : null,
            neuerWert: neuerWert,
            exists: null,
            fehler: null
        };
        
        if (neuerWert) {
            const norm = getPageNormObject(app, dv, neuerWert);
            if (!norm.exists) 
                neuWrtObj.fehler = `Seite zu ${neuerWert} existiert nicht`;
            else {
                neuWrtObj.exists = true;
                neuWrtObj.path = norm.path;
                neuWrtObj.wikiLink = norm.wikiLink;
                neuWrtObj.norm = norm;
            }
        }
        
        return neuWrtObj;
    }
    
    return neueWerteObj;
}






























/*
function getUniqueNestedIstValuesObj(
    app, dv,
    norm,
    ausgangswerteArr,
    nestedWerteMap,
    rootKlKey,
    visited = new Set(),
) {
    if (visited.has(norm.path)) {
        return nestedWerteMap;
    }
    visited.add(norm.path);

    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const pStatusNorm  = getPageNormObject(app, dv, "p-Status.md");

    ausgangswerteArr.forEach(istWert => {

        const istWertPath = resolveLinkPath(app, istWert);
        const norm = getPageNormObject(app, dv, istWertPath);
        if (!istWertPath) nestedWerteMap.set(istWert, {norm, classification: {kind: null, }})

        const nestedIst = einzelnesFeldLesen(app, norm, "ist");
        

        getUniqueNestedIstValuesObj(app, dv, norm, nestedIst, rootKlKey, visited);
    });

    return nestedWerteMap;
}
*/



/*

function kandidatenPruefen(app, dv, istObj, rootKlKey) {
    
    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const pStatusNorm  = getPageNormObject(app, dv, "p-Status.md");

    for (const migObj of istObj.kandidaten.values()) {
        const istKlasse = migObj.path === rootKlKey;
        const istDefInKlasse = checkFieldArrForLink(app, migObj.norm, "ist", rootKlasseNorm);
        const istPStatus = migObj.path === pStatusNorm.path;
        const istStatinPStat = checkFieldArrForLink(app, migObj.norm, "ist", pStatusNorm);


    }
}

*/