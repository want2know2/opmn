
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService";


/* check, check */

export function zielSeiteIstCheck(
    app, dv, 
    zielNorm,
    rootKlKey,
    defOInst,
) {

    /* Pfad der Ausgangs-Zielseite ( = erster Key im Objekt das erstellt wird) */
    const ausgangsZielPath = zielNorm.path;
    const warnungen = [];
    /* ist-Objekt erstellen */
    const istObj = istObjErstellen(app, dv, zielNorm, rootKlKey, defOInst);
    /* rekursive Fn erstellt ist-Objekt */
    function istObjErstellen(
        app, dv, 
        zielNorm,
        rootKlKey,
        defOInst,
        startObj = {},
        schonGecheckt = new Set(),
    ) {
        /* Geprüft? Return. */
        if (schonGecheckt.has(zielNorm.path)) return;
        schonGecheckt.add(zielNorm.path);
        
        /* Feld ist lesen */
        const istRawArr = (einzelnesFeldLesen(app, zielNorm, "ist") ?? []);
        /* ist-Werte zu Links (oder Warnung) */
        
        const istLinkArr = [...istRawArr]
            .map(istRaw => {
                const istLink = resolveLinkPath(app, istRaw);
               if (typeof istLink === "string") return istLink;
                else warnungen.push({ 
                    wert: istRaw,
                    info: "kein Link"
                })
            })

        /* ist-Werte zu NormSeite (oder Warnung) */
        const istNormArr = [...istLinkArr].map(path => {
            const istNorm = getPageNormObject(app, dv, path);
            if (istNorm.exists) return istNorm;
            else {
                warnungen.push({
                    wert: path,
                    info: "existiert nicht"
                })
            }  
        })
        
        /* Pfad der NormSeite als Key ans Objekt */
        startObj[zielNorm.path] = {
            norm: zielNorm,
            ist: {},
        }
        
        istNormArr.forEach(istNorm => {
            const istObj = startObj[zielNorm.path]["ist"];
            istObjErstellen(app, dv, istNorm, rootKlKey, defOInst, istObj, schonGecheckt);
        })

        return startObj;
    }

    /* alle ist-Werte in einem Array */
    const uniqueArr = neuObjEntpacken(istObj);
    // wenn inst: ersten Wert entfernen 
    // (= die Inst-Zielseite selbst, danach kommen die ist-Werte)
    // testweise ausprobiert, aber muss noch mal in ruhe gucken, wie die neuen
    // Werte für die einzelnen klassen (Inh, Kat usw.) erstellt werden sollen
    if (defOInst) uniqueArr.splice(0,1);
    // alle ist-Werte NormSeiten
    const uniqueNormArr = [...uniqueArr]
        .map(path => getPageNormObject(app, dv, path));

    // was will ich hier zurückkriegen und wie geht's dann damit weiter?
    const neueWerteObj = neueWerteErstellen(app, dv, uniqueNormArr, rootKlKey);

    // [...uniqueNoSArr].map(nos => uniqueNosArrCheck(app, dv, nos, rootKlKey));

    istObj[ausgangsZielPath].neueWerte = neueWerteObj;
    istObj[ausgangsZielPath].warnungen = warnungen;



    /*Object.keys(istObj).forEach(key => {
        // console.log(istObj[key].norm.path)
    })*/

    return istObj;
}


/* muss eigentlich nicht exportiert werden */

export function neuObjEntpacken(neuObj) {

    // Die Values, die in neuObj hierhin übergeben werden, 
    // sind bereits unique, werden hier lediglich
    // aus dem verschachtelten Objekt in diesen Array entpackt
    const uniqueIstValues = [];
    runRecurs(neuObj);

    function runRecurs(neuObj) {
        Object.keys(neuObj).forEach(key => {
            
            const norm = neuObj[key]["norm"];
            const istObj = neuObj[key]["ist"];
            
            uniqueIstValues.push(key);

            runRecurs(istObj);
        
        })
    }

    return uniqueIstValues;
}




function neueWerteErstellen(app, dv, uniqueNormArr, rootKlKey) {

    /* Standard-Seiten zum Prüfen der Werte */

    const rootKlasseNorm = getPageNormObject(app, dv, rootKlKey);
    const pStatusNorm = getPageNormObject(app, dv, "p-Status.md");

    const klasseSet = new Set();
    const pStatusSet = new Set();
    const warnungSet = new Set();

    // Array mit unique ist-Werten als NormSeiten
    uniqueNormArr.forEach(norm => {

        const istKlasse = norm.path === rootKlasseNorm.path;
        const istDefInKlasse = checkFieldArrForLink(app, norm, "ist", rootKlasseNorm);
        if (istDefInKlasse) klasseSet.add(norm.path);

        const istPStatus = norm.path === pStatusNorm.path;
        const istDefInPStatus = checkFieldArrForLink(app, norm, "ist", pStatusNorm) ? norm.path : null;
        if (istDefInPStatus) pStatusSet.add(norm.path);
        if (!istKlasse && !istDefInKlasse && !istPStatus && !istDefInPStatus) warnungSet.add(norm.path);
    });

    const typSet = new Set();
    const artSet = new Set();
    const parentSet = new Set();

    [...klasseSet].forEach(path => {
        
        const norm = getPageNormObject(app, dv, path);
        const rootName = rootKlKey.replace(".md", "");

        const pathNP = norm.name.replace(" (p)", "");
        const cleanPathArr = pathNP.split(" _ ")
            .filter((str, i) => i !== 1);

        let typ = `${rootName} _ ${pathNP.split(" _ ")[1]}`;
        let art = "";
        let parent = "";

        cleanPathArr.forEach((str, i) => {
            // alle bis auf den letzten str einfach hintereinandersetzen:
            // str _ str _ ...
            if (i < cleanPathArr.length - 1) {
                art += `${str} _ `;
                // wenn der istSeite-Pfad länger als 2 ist
                // alle bis auf den vorletzten (weil parent) hintereinander:
                if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
                    parent += `${str} _ `;
                // wenn istSeite-Pfad länger als 2 den vorletzten anhängen
                else if (cleanPathArr.length > 2) parent += `${str}`;
            }
            else {
                art += `${str}`;
            }
        });

        if (art === rootName) art = null;

        typSet.add(typ);
        artSet.add(art);
        parentSet.add(parent);

    })

    return {
        typ: [...typSet],
        art: [...artSet],
        parent: [...parentSet],
        pstatus: [...pStatusSet],
        warnung: [...warnungSet]
    }

    
}




/*

function neueWerteErstellen(istNorm, istObj, rootKlKey) {
    
    const rootName = rootKlKey.replace(".md", "");

    // Neu-, Typ-, Parent-Path
    const pathNP = istNorm.name.replace(" (p)", "");
    const cleanPathArr = pathNP.split(" _ ")
        .filter((str, i) => i !== 1);

    istObj.typ = `${rootName} _ ${pathNP.split(" _ ")[1]}`;
    istObj.art = "";
    istObj.parent = "";

    cleanPathArr.forEach((str, i) => {
        // alle bis auf den letzten str einfach hintereinandersetzen:
        // str _ str _ ...
        if (i < cleanPathArr.length - 1) {
            istObj.art += `${str} _ `;
            // wenn der istSeite-Pfad länger als 2 ist
            // alle bis auf den vorletzten (weil parent) hintereinander:
            if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
                istObj.parent += `${str} _ `;
            // wenn istSeite-Pfad länger als 2 den vorletzten anhängen
            else if (cleanPathArr.length > 2) istObj.parent += `${str}`;
        }
        else {
            istObj.art += `${str}`;
        }
    });

    if (istObj.art === rootName) istObj.art = null;

    return istObj;
}


*/



























            /*            
            Object.keys(neuObj).forEach(key => {
                const obj = neuObj[key];
                
                ergEls.box1.createEl("div", {text: key})
            
                const istByPath = obj.istByPath;
                //ergEls.box2.createEl("div", {text: String(ist)})
                
                if (false) {
                    Object.keys(istByPath)?.forEach(key => {
                        const inh = istByPath[key];
                        ergEls.box2.createEl("div", {text: "String(inh)"})
                    })
                }
            })   
            */
            
            

            



















    /*

    startObj[zielNoS.path] = { 
        norm: zielNoS,
        ist: {},
        istRaw: [...istRawArr],
        istNorm: [...istNoSArr],
        istByPath: {}
    };

    istNoSArr.forEach(istNoS => {
        
        const byPathObj = originalObj 
            ? originalObj.istByPath 
            : startObj[zielNoS.path].istByPath;
        
        if (byPathObj.hasOwnProperty(istNoS.path)) {
            byPathObj[istNoS.path].counter += 1;
        } else {

            byPathObj[istNoS.path] = { 
                norm: istNoS, 
                isKlasseSeite: [],
                isKlasse: [], 
                isPStatusSeite: [],
                isPStatus: [],
                isFehler: [],
                counter: 1
            }
        }
            const editObj = startObj[zielNoS.path].istByPath[istNoS.path];

            const rootPageCheck = istNoS.path === rootKlasseNoS.path;
            const pStatusPageCheck = istNoS.path === pStatusNoS.path;

            const rootKlCheck = checkFieldArrForLink(app, istNoS, "ist", rootKlasseNoS);
            const pStatCheck = checkFieldArrForLink(app, istNoS, "ist", pStatusNoS);

            if (rootPageCheck) {
                editObj.isKlasseSeite.push(istNoS.path);
            }
            if (pStatusPageCheck) {
                editObj.isPStatusSeite.push(istNoS.path)
            }
            if (rootKlCheck) { 
                editObj.isKlasse.push(istNoS.path);
            }
            if (pStatCheck) {
                editObj.isPStatus.push(istNoS.path);
            }
            if ( !rootPageCheck && !rootKlCheck && !pStatusPageCheck && !pStatCheck ) {
                editObj.isFehler.push(istNoS.path);
            }
            
        
        const obj = startObj[zielNoS.path]["ist"];
        zielSeiteIstCheck(
            app, dv, 
            istNoS, 
            rootKlKey,
            defOInst,
            obj,
            wurdeGecheckt,
            startObj[zielNoS.path]
        );
        
    })
    return startObj;
    
}
*/






/*
export function zielSeiteIstCheck(
    app, dv, 
    zielseite,
    rootKlKey,
    defOInst,
    startObj = {},
    gecheckt = new Set()) 
{   
    if (gecheckt.has(zielseite.path)) return;
    gecheckt.add(zielseite.path);
    startObj[zielseite.path] = { norm: zielseite, ist: {}};
    const istArr = (einzelnesFeldLesen(app, zielseite, "ist") ?? [])
        .map(istRaw => resolveLinkPath(app, istRaw))
        .map(istPath => getPageNormObject(app, dv, istPath));
    istArr.forEach(istNorm => {
        const obj = startObj[zielseite.path]["ist"];
        zielSeiteIstCheck(app, dv, istNorm, rootKlKey, defOInst, obj, gecheckt);
    })
    return startObj;

}
*/

/**
 * 
 */
/*
export function istWerteAnalysieren(app, dv, rootKlKey, eingangsObj) {
    
    const rootKlNormSeite = getPageNormObject(app, dv, rootKlKey);
    const pStausNormSeite = getPageNormObject(app, dv, "p-Status.md");

    const checkObj = {};

    recurCheck(eingangsObj, checkObj)

    function recurCheck(eingangsObj, checkObj) {

    

        Object.keys(eingangsObj).forEach(key => {
            
            const norm = eingangsObj[key].norm;
            const istObj = eingangsObj[key].ist;
            
            checkObj[key] = { norm, ist: istObj, checks: {
                isKlasse: checkFieldArrForLink(app, norm, "ist", rootKlNormSeite) ? norm.path : null,
                isPStat: checkFieldArrForLink(app, norm, "ist", pStausNormSeite) ? norm.path : null
            }}

            

            recurCheck(istObj, checkObj)

        })

    }

    

    

    /*
    function recurWertChecken(feldIstObj) {
        

        Object.keys(feldIstObj).forEach(key => {

        })
    }
    */



    /*

    return checkObj;
    
}
*/















































///////
/*
Object.keys(feldIstObj).forEach(key => {
    const norm = feldIstObj[key].norm;
    const obj = feldIstObj[key].ist;

    istCheckObj[key] = { norm, feldIstObj: obj, istCheck: {} }
    
})
*/


///// +++ test +++ brauche ich die ueberhaupt +++ ? +++
/*
function neuObjEntpacken(neuObj) {
    Object.keys(neuObj).forEach(key => {
        
        const norm = neuObj[key]["norm"];
        const istObj = neuObj[key]["ist"];
        
        const textAnz = norm.path
        // Object.keys(istObj).map(key => String(istObj[key].norm.path))
        cells[1].createEl("div", {text: textAnz });

        neuObjEntpacken(istObj);
    })

    
}
*/
