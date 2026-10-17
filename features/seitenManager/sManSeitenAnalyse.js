import { getNormPage } from "../../shared/services/pagesAndLinks/normPageService";
import { sManFMAnalyse } from "./sManSeitenAnalyseFM";
import { sManRollenAnalyse } from "./sManSeitenAnalyseRolle";


/**
 * Normalisiert und analysiert die Seiten für den Seiten-Manager.
 * Gibt einen Array mit Analysierte-Seite-Objekten zurück. Enthält:
 * 
 * fmAnalyse für jedes Feld: Analyse-Objekt mit
 * - feldTyp
 * - feldBekannt
 * - gehoertZuNeuerStruktur
 * - anzahlElemente
 * - werte (null wenn feldTyp = "object")
 * - wertTypen
 * - feldTypKorrekt
 * - wertTypenKorrekt
 * - enthalteneFelder (rekursiv, nur wenn feldTyp = "object")
 * 
 * rolle:
 * 
 */
export function getSManAnalysierteSeiten(app, alleSeiten, sManAnalyseRegeln) {

    return alleSeiten.map(s => {

        const normSeite = getNormPage(app, s.path);
        return sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln);
         
    });
}


/**
 * Analysiert eine einzelne normalisierte Seite für den Seiten-Manager.
 * 
 * 1. Schickt die Seite durch `sManFMAnalyse`, um die Frontmatter-Metadaten auszuwerten
 * 2. Schickt die Seite durch `sManRollenAnalyse`, um die Rolle zu ermitteln.
 * 
 * Gibt die analysierte Seite zurück. Beschreibung s. `getSManAnalysierteSeiten`.
 */
function sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln) {
    
    const analysierteSeite = {
        tFile: normSeite.tFile,
        exists: normSeite.exists,
        name: normSeite.name,
        path: normSeite.path,
        wikiLink: normSeite.wikiLink,
        frontmatter: normSeite.frontmatter,
        fmAnalyse: {},
        rolle: {}
    };

    sManFMAnalyse(analysierteSeite, sManAnalyseRegeln.felder);
    analysierteSeite.rolle = sManRollenAnalyse(app, analysierteSeite, sManAnalyseRegeln);

    return analysierteSeite;
}





/**
 * Die Regeln, um die frontmatter-Felder einer Seite zu analysieren
 * und um die Rolle der Seite zu ermitteln. 
 */

export function getSManAnalyseRegeln(app) {

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
                feldTyp: "single",
                wertTyp: "id: neu",  // 
                gehoertZuNeuerStruktur: true,
            },
            graphRole: {
                feldTyp: "single",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            klasse: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            typ: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            art: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            inKlasse: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            inFeld: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            parent: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            erlaubterTyp: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            stKlasse: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            stParent: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            pstatus: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: true
            },
            
            ist: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: null
            },
            in: {
                feldTyp: "multi",
                wertTyp: "link",
                gehoertZuNeuerStruktur: null
            },
            med: {
                feldTyp: "object",
                wertTyp: null,
                gehoertZuNeuerStruktur: null,
                enthalteneFelder: {
                    in: {
                        feldTyp: "multi",
                        wertTyp: "link",
                        gehoertZuNeuerStruktur: null,
                    }
                    

                }
            }

            
        },
        frontMatterCheck: function(fm) {

            
        }

    };
}
