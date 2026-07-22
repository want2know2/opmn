
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService.js";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService.js";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService.js";
import { ONT_ROOTKL }           from "../migReg/migReg.js";


/* check, check */

export function zielSeiteIstCheckTest4(app, dv, zielseiteNorm, rootKlKey, defOInst) {
    const istCheckObj = {
        kandidaten: [],
        defKandidaten: [],
        pstatusKandidaten: [],
        fehler: []
    };
    
    
    const neueWerteObj = {
        erster: [],
        letzter: [],
        vorletzter: [],
    };
    

    const uniqueNestedValues = getUniqueNestedIstValuesObj(app, dv, zielseiteNorm)
        .forEach(istVal => {
            if (!istVal.fehler) {
                istCheckObj.kandidaten.push(istVal);
            } 
            else {
                istCheckObj.fehler.push(istVal);
            } 
        })
    
    
    istCheckObj.kandidaten.unshift({wert: zielseiteNorm.path, norm: zielseiteNorm, fehler: null});

    const defUndPStatKandidaten = getDefUndPStatKandidaten(app, dv, istCheckObj.kandidaten, rootKlKey);
    Object.keys(defUndPStatKandidaten).forEach(key => {
        defUndPStatKandidaten[key].forEach(istVal => istCheckObj[key].push(istVal));
    })

    const neuObj = getNeueWerteObj(app, dv, istCheckObj.defKandidaten, rootKlKey);
    Object.keys(neuObj).forEach(key => {
        neuObj[key].forEach(migObj => neueWerteObj[key].push(migObj))
    })
    
    return istCheckObj.pstatusKandidaten;
}    
    


function getUniqueNestedIstValuesObj(
    app, dv,
    zielseiteNorm,
    visited = new Set(),
    istValuesObjs = new Set(),
    // istValuesFehler = new Set()
) {
    if (visited.has(zielseiteNorm.path)) {
        return [...istValuesObjs];
    }

    visited.add(zielseiteNorm.path);

    const feldIst = einzelnesFeldLesen(app, zielseiteNorm, "ist") ?? [];

    feldIst.forEach(istWert => {
        const path = resolveLinkPath(app, istWert);
        const norm = getPageNormObject(app, dv, path);
        if (typeof path !== "string") istValuesObjs.add({wert: istWert, norm: null, fehler: "kein Link"});
        else if (!norm.exists) istValuesObjs.add({wert: path, norm: null, fehler: "existiert nicht"});
        else istValuesObjs.add({
            wert: norm.path, 
            norm,
            fehler: null
        });

        getUniqueNestedIstValuesObj(app, dv, norm, visited, istValuesObjs);
    });

    return [...istValuesObjs]
}



function getDefUndPStatKandidaten(app, dv, istKandidaten, rootKlKey) {
    
    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const pStatusNorm  = getPageNormObject(app, dv, "p-Status.md");

    const defsInKlSet = new Set();
    const pStatusSet = new Set();
    const fehlerSet = new Set();

    // Array mit unique ist-Werten als NormSeiten
    istKandidaten.forEach(ist => {

        const istKlasse = ist.wert === rootKlasseNorm.path;
        //if (istKlasse) defsInKlSet.add(ist.wert);
        const istDefInKlasse = checkFieldArrForLink(app, ist.norm, "ist", rootKlasseNorm);
        if (istDefInKlasse) {
            defsInKlSet.add(ist.wert);
            const feldIst = einzelnesFeldLesen(app, ist.norm, "ist") ?? [];
            feldIst.forEach(istWert => {
                const path = resolveLinkPath(app, istWert);
                const norm = getPageNormObject(app, dv, path);
                const defIstPStat = checkFieldArrForLink(app, norm, "ist", pStatusNorm);
                const defIstKlasse = norm.path === rootKlasseNorm.path;
                if (defIstPStat && !defIstKlasse) pStatusSet.add(norm.path);
                else pStatusSet.add("nicht-p-Eintrag.md");
            })
        }

        const istPStatus = ist.wert === pStatusNorm.path;
        const istDefInPStatus = checkFieldArrForLink(app, ist.norm, "ist", pStatusNorm);
        if (istDefInPStatus) pStatusSet.add(ist.wert);

        if (!istKlasse && !istDefInKlasse && !istPStatus && !istDefInPStatus) 
            fehlerSet.add(ist.wert);
    });

    return {
        defKandidaten: getReturnArray(app, dv, defsInKlSet),
        pstatusKandidaten: getReturnArray(app, dv, pStatusSet),
        fehler: getReturnArray(app, dv, fehlerSet, true)
    }

    function getReturnArray(app, dv, werteSet, fehlerCheck = null) {
        return [...werteSet].map(wert => {
            const norm = getPageNormObject(app, dv, wert);
            return { 
                wert, 
                norm, 
                fehler: !!fehlerCheck 
                    ? "nicht in Klasse" 
                    : null 
            }
        })
    }
}


function getNeueWerteObj(app, dv, defKandidaten, rootKlKey) {

    const ersterSet = new Set();
    const letzterSet = new Set();
    const vorletzterSet = new Set();

    [...defKandidaten].forEach(ist => {
        const rootName = rootKlKey.replace(".md", "");

        const splitPathOhneP = ist.wert
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

        if (letzter === rootName) letzter = null;

        ersterSet.add(erster);
        letzterSet.add(letzter);
        vorletzterSet.add(vorletzter);

    })

    return {
        erster: getReturnArray(app, dv, ersterSet),
        letzter: getReturnArray(app, dv, letzterSet),
        vorletzter: getReturnArray(app, dv, vorletzterSet)
    };

    function getReturnArray(app, dv, werteSet) {
        return [...werteSet].map(wert => {
            const norm = getPageNormObject(app, dv, wert);
            return { 
                wert,
                norm: norm.exists ? norm : null, 
                fehler: norm.exists
                    ? null
                    : "existiert nicht" 
            }
        })
    }
}