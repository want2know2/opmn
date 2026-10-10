import { compareObjects } from "../../utils/valueUtils";
import { readJSON, readOrCreateJSONinklPath, writeJSON } from "./jsonReadAndWrite";


export /*async*/ function getLookups(app) {

    /*const path = "shared/lookups";
    const objName = "rollen";
    
    const rollenJSON = 
        await readOrCreateJSONinklPath(app, path, objName);*/

    //const rollen =
    return {
        ontRoots: [
            "Inhalt",
            "Ereignis",
            "Person",
            "Organisation",
            "Gegenstand",
            "Geo"
        ],
        semTaxRoots: [
            "Kategorie",
            "Thema"
        ],
        "Ontology Root Page": {
            pflichtfelder: [
                "id", "graphRole",

            ]
        },
        "Ontology Instance": {
            pflichtfelder: [
                "id", "graphRole",
                "klasse", "typ", "art",
                "pstatus"
            ]
        },
        "Ontology Definition": {
            pflichtfelder: [
                "id", "graphRole",
                "inKlasse", "inFeld", "parent"
            ],
            level1: [
                "erlaubterTyp"
            ]
        },
        "Semantic Taxonomy Page": {
            pflichtfelder: [
                "id", "graphRole",
                "stKlasse", "stParent",
                "pstatus"
            ]
        },
        felder: {
            id: {
                feldTyp: "string",
                wertTyp: "id",  // 
                berechtigt: true,
                check: function(wert) {
                    
                    return {
                        altesFormat: /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(wert),
                        neuesFormatFalsch: /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(wert),
                        neuesFormat: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(wert)
                    };
                }
            },
            graphRole: {
                feldTyp: "string",
                wertTyp: "link",
                berechtigt: true
            },
            klasse: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            typ: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            art: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            inKlasse: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            inFeld: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            parent: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            erlaubterTyp: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            stKlasse: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            stParent: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            pstatus: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: true
            },
            checkFelder: function(fm) {

                const gecheckteFelder = {};

                Object.entries(this).forEach(([key, entry]) => {

                    if (typeof entry !== "object" || entry === null) return;

                    //console.log(key)

                    if (fm.hasOwnProperty(key)) {

                        const feldWert = fm[key];

                        gecheckteFelder[key] = {
                            feldTypKorrekt: null,
                            wertTypKorrekt: null,
                            wertTypVeraltet: null,
                            berechtigt: entry.berechtigt
                        };

                        switch (entry.feldTyp) {
                            case "string":
                                
                                if (typeof feldWert === "string") {
                                
                                    gecheckteFelder[key].feldTypKorrekt = true;
                                    gecheckteFelder[key].wertTypKorrekt = checkWertTyp(entry, feldWert);
                                }
                                break;

                            case "array":

                                if (Array.isArray(feldWert)) {
                                    
                                    gecheckteFelder[key].feldTypKorrekt = true;
                                    gecheckteFelder[key].wertTypKorrekt 
                                        = feldWert.every(wert => checkWertTyp(entry, wert));
                                }
                                break;
                        }

                        function checkWertTyp(feldCheckObj, wert) {

                            switch (feldCheckObj.wertTyp) {
                                case "string":
                                    
                                    if (typeof wert === "string")
                                        return true;
                                    break;

                                case "link":

                                    if (wert.startsWith("[["))
                                        return true;
                                    break;

                                case "id":

                                    const idCheck = feldCheckObj.check(wert);

                                    //console.log(wert, idCheck);

                                    if (idCheck.altesFormat) {
                                     
                                        gecheckteFelder[key].wertTypVeraltet = "alt";
                                        return null;
                                    }

                                    else if (idCheck.neuesFormatFalsch) {

                                        gecheckteFelder[key].wertTypVeraltet = "neu falsch";
                                        return null;
                                    }

                                    else if (idCheck.neuesFormat) 
                                        return true;

                                    else return null;
                                    break;
                            }
                        }

                        

                    }
                });

                return gecheckteFelder;
                
            }
            
            
        }
    };

    /*if (!compareObjects(rollenJSON, rollen)) {

        writeJSON(app, `${path}/${objName}`, rollen);
        console.log("WRITE!")
    }*/
 
}