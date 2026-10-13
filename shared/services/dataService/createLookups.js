import { compareObjects } from "../../utils/valueUtils";
import { readJSON, readOrCreateJSONinklPath, writeJSON } from "./jsonReadAndWrite";
import { getFrontmatterValue } from "./metaReadService";

/** Nur Objekt(e) erstellen, die gebraucht werden, 
 * um Seiten zu checken
 * 
 */

export function getLookups(app) {

    return {
        roots: {
            ontology: [
                "Inhalt",
                "Ereignis",
                "Person",
                "Organisation",
                "Gegenstand",
                "Geo"
            ],
            semanticTaxonomy: [
                "Kategorie",
                "Thema"
            ]
        },
        global: {
            pflichtfelder: ["id", "graphRole"]
        },
        rollen: {
            "Ontology Root Page": {
                pflichtfelder: [
                    // "id", "graphRole",

                ]
            },
            "Ontology Instance": {
                pflichtfelder: [
                    // "id", "graphRole",
                    "klasse", "typ", "art",
                    "pstatus"
                ]
            },
            "Ontology Definition": {
                pflichtfelder: [
                    // "id", "graphRole",
                    "inKlasse", "inFeld", "parent"
                ],
                level1: [
                    "erlaubterTyp"
                ]
            },
            "Semantic Taxonomy Root": {
                pflichtfelder: [
                    // "id", "graphRole",
                ]
            },
            "Semantic Taxonomy Page": {
                pflichtfelder: [
                    // "id", "graphRole",
                    "stKlasse", "stParent",
                    "pstatus"
                ]
            },
            "Semantic Relation": {
                pflichtfelder: [
                    // "id", "graphRole",
                    "relationType", "relatedTo",
                ]
            }
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
            
            ist: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: null
            },
            in: {
                feldTyp: "array",
                wertTyp: "link",
                berechtigt: null
            },

            
        },
        frontMatterCheck: function(fm) {

            
        }

    };
}





function checkFelderUndWerteTyp(fm) {

    const gecheckteFelder = {};

    Object.entries(this).forEach(([key, entry]) => {

        if (typeof entry !== "object" || entry === null) return;

        //console.log(key)

        if (fm.hasOwnProperty(key)) {

            const feldWert = getFrontmatterValue(fm, key);

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
                        gecheckteFelder[key].wertTypKorrekt 
                            = checkEinzelWertTyp(this, gecheckteFelder, key, entry, feldWert);
                    } 
                    else if (Array.isArray(feldWert))
                        gecheckteFelder[key].wertTypKorrekt 
                            = checkArrWertTyp(this, gecheckteFelder, key, entry, feldWert);
                        
                    break;

                case "array":

                    if (Array.isArray(feldWert)) {
                        
                        gecheckteFelder[key].feldTypKorrekt = true;
                        gecheckteFelder[key].wertTypKorrekt 
                            = checkArrWertTyp(this, gecheckteFelder, key, entry, feldWert);
                    }
                    else if (typeof feldWert === "string")
                        gecheckteFelder[key].wertTypKorrekt 
                            = checkEinzelWertTyp(this, gecheckteFelder, key, entry, feldWert);
                    
                    break;
            }

            function checkEinzelWertTyp(thisObj, gecheckteFelder, key, feldRegelnObj, feldWert) {

                return gecheckteFelder[key].wertTypKorrekt 
                    = thisObj.checkWertTyp(gecheckteFelder, key, feldRegelnObj, feldWert);
            }

            function checkArrWertTyp(thisObj, gecheckteFelder, key, feldRegelnObj, feldWert) {
            
                return gecheckteFelder[key].wertTypKorrekt 
                    = feldWert.every(einzelWert => thisObj.checkWertTyp(gecheckteFelder, key, feldRegelnObj, einzelWert));
            }
        }
    });

    return gecheckteFelder;
    
}

function checkWertTyp(gecheckteFelder, key, feldRegelnObj, wert) {

    switch (feldRegelnObj.wertTyp) {
        case "string":
            
            if (typeof wert === "string")
                return true;
            break;

        case "link":

            if (wert.startsWith("[["))
                return true;
            break;

        case "id":

            const idCheck = feldRegelnObj.check(wert);

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