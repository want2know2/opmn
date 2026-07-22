
////
// IMPORT                       // FROM

import { checkFieldArrForLink, 
         einzelnesFeldLesen }   from "../../../../shared/services/dataService/metaReadService";
import { resolveLinkPath }      from "../../../../shared/services/pagesAndLinks/linkService";
import { getPageNormObject }    from "../../../../shared/services/pagesAndLinks/pageNormService";


/* check, check */

export function zielSeiteIstCheckTest(
    app, dv, 
    zielNorm,
    rootKlKey,
    defOInst,
) {

    /* Pfad der Ausgangs-Zielseite ( = erster Key im Objekt das erstellt wird) */
    const ausgangsZielPath = zielNorm.path;
    const warnungen = [];
    /* ist-Objekt erstellen */
    const uniqueArr = getUniqueArr(app, dv, zielNorm, rootKlKey, defOInst);
    /* rekursive Fn erstellt ist-Objekt */
    function getUniqueArr(
        app, dv, 
        zielNorm,
        rootKlKey,
        defOInst,
        startObj = {},
        geprueft = new Set(),
    ) {
        /* Geprüft? Return. */
        if (geprueft.has(zielNorm.path)) return;
        geprueft.add(zielNorm.path);
        
        /* Feld ist lesen */
        const istRawArr = (einzelnesFeldLesen(app, zielNorm, "ist") ?? []);
        /* ist-Werte zu Links (oder Warnung) */
        
        const istLinkArr = [...istRawArr]
        .map(istRaw => {
            const istLink = resolveLinkPath(app, istRaw);
            if (typeof istLink === "string") return istLink;
            else warnungen.push({ wert: istRaw, info: "kein Link" });
        })

        /* ist-Werte zu NormSeite (oder Warnung) */
        const istNormArr = [...istLinkArr]
        .map(path => {
            const istNorm = getPageNormObject(app, dv, path);
            if (istNorm.exists) return istNorm;
            else warnungen.push({ wert: path, info: "existiert nicht" })   
        })
        
        /* Pfad der NormSeite als Key ans Objekt */
        startObj[zielNorm.path] = {
            norm: zielNorm,
            ist: {},
        }
        
        istNormArr.forEach(istNorm => {
            const istObj = startObj[zielNorm.path]["ist"];
            getUniqueArr(app, dv, istNorm, rootKlKey, defOInst, istObj, geprueft);
        })

        // wenn Inst: ersten Wert entfernen (= die Inst-Zielseite selbst, danach kommen die ist-Werte). 
        // Testweise ausprobiert, aber muss noch mal in Ruhe gucken, wie die neuen
        // Werte für die einzelnen klassen (Inh, Kat usw.) erstellt werden sollen.
        if (defOInst) geprueft.splice(0,1);

        return geprueft
            .map(path => getPageNormObject(app, dv, path));

    }
    
    // was will ich hier zurückkriegen und wie geht's dann damit weiter?
    const neueWerteObj = neueWerteErstellen(app, dv, uniqueArr, rootKlKey);

    // [...uniqueNoSArr].map(nos => uniqueNosArrCheck(app, dv, nos, rootKlKey));

    istObj.neueWerte = neueWerteObj;
    istObj.warnungen = warnungen;

    return istObj;
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


