




/**
 * Normalizes and examines all supplied pages for the Page Manager.
 *
 * For each page:
 * 1. Creates its normalized page representation.
 * 2. Examines its metadata and determines relevant validation results.
 *
 * Returns an array of page examination results.
 * Does not modify manager state or interact with the UI.
 */
export function getSManSeitenAnalyse(app, alleSeiten, sManAnalyseRegeln) {

    return alleSeiten.map(s => {
        const normSeite = getNormPage(app, s.path);
        const analysierteSeite = sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln);
        return analysierteSeite;
    });
}


/**
 * Examines one normalized page for the Page Manager.
 *
 * Determines the page's relevant role, metadata status and validation
 * results needed by this feature.
 *
 * Returns an examination result associated with the normalized page.
 * Does not render UI or manage search and filter state.
 */
function sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln) {

    
}


/**
 * 
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