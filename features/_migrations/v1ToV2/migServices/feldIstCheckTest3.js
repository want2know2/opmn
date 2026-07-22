
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService";
import { ONT_ROOTKL }           from "../migReg/migReg";


/* check, check */

export function zielSeiteIstCheckTest3(app, dv, zielseiteNorm, rootKlKey, defOInst) {
    const uniqueNestedIstValuesObj = getUniqueNestedIstValuesObj(app, dv, zielseiteNorm);
    if (!defOInst) uniqueNestedIstValuesObj.unshift({wert: zielseiteNorm.path, norm: zielseiteNorm, neueWerte: null, fehler: null})
    const checkRootKlUndStatusObj = checkRootKlUndStatus(app, dv, uniqueNestedIstValuesObj, rootKlKey, defOInst);
    
    checkRootKlUndStatusObj.neueWerte = getNeueDefWerte(app, dv, checkRootKlUndStatusObj.defsInKlasseArr, rootKlKey, defOInst);

    return checkRootKlUndStatusObj

    
    
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
        if (typeof path !== "string") istValuesObjs.add({wert: istWert, norm: null, neueWerte: null, fehler: "kein Link"});
        else if (!norm.exists) istValuesObjs.add({wert: path, norm: null, neueWerte: null, fehler: "existiert nicht"});
        else istValuesObjs.add({
            wert: norm.path, 
            norm,
            neueWerte: null,
            fehler: null
        });

        getUniqueNestedIstValuesObj(app, dv, norm, visited, istValuesObjs);
    });

    return [...istValuesObjs]
}



function checkRootKlUndStatus(app, dv, uniqueNestedIstValues, rootKlKey, defOInst) {

    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const pStatusNorm = getPageNormObject(app, dv, "p-Status.md");

    const defsInKlasseSet = new Set();
    const pStatusSet = new Set();
    const fehlerArr = [];
    const fehlerNeuSet = new Set();

    // Array mit unique ist-Werten als NormSeiten
    uniqueNestedIstValues.forEach(istCheck => {

        if (istCheck.fehler) 
            fehlerArr.push(istCheck);
        else {
            const istKlasse = istCheck.wert === rootKlasseNorm.path;
            if (istKlasse && ONT_ROOTKL[rootKlKey].instByRoot) defsInKlasseSet.add(istCheck.wert);
            const istDefInKlasse = checkFieldArrForLink(app, istCheck.norm, "ist", rootKlasseNorm);
            if (istDefInKlasse) defsInKlasseSet.add(istCheck.wert);

            const istPStatus = istCheck.wert === pStatusNorm.path;
            const istDefInPStatus = checkFieldArrForLink(app, istCheck.norm, "ist", pStatusNorm);
            if (istDefInPStatus) pStatusSet.add(istCheck.wert);

            if (!istKlasse && !istDefInKlasse && !istPStatus && !istDefInPStatus) 
                fehlerNeuSet.add(istCheck.wert);
        }
    });
    
    const fehlerNeuArr = [...fehlerNeuSet].map(wert => {
            const norm = getPageNormObject(app, dv, wert);
            return { wert, norm, neueWerte: null, 
                fehler: "nicht in Klasse"
            }
        })

    return {
        defsInKlasseArr: [...defsInKlasseSet].map(wert => {
            const norm = getPageNormObject(app, dv, wert);
            return { wert, norm, neueWerte: null, fehler: null }
        }),
        pStatusArr: [...pStatusSet].map(wert => {
            const norm = getPageNormObject(app, dv, wert);
            return { wert, norm, neueWerte: null, fehler: null }
        }),
        fehlerArr: [...fehlerArr, ...fehlerNeuArr]
    }
}


function getNeueDefWerte(app, dv, defInKlasseArr, rootKlKey, defOInst) {

    const typ = new Set();

    return defInKlasseArr;
}