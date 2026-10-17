# Seiten analysieren

## getSManSeitenAnalyse

```js
/**
 * Normalisiert und analysiert die Seiten für den Seiten-Manager.
 * Gibt einen Array mit Analysierte-Seite-Objekten zurück. 
 */
export function getSManSeitenAnalyse(app, alleSeiten, sManAnalyseRegeln) {

    return alleSeiten.map(s => {
        const normSeite = getNormPage(app, s.path);
        const analysierteSeite = sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln);
        return analysierteSeite;
    });
}
```

---

## sManEinzelSeitenAnalyse

```js
/**
 * Normalisiert und analysiert einzelne Seite für den Seiten-Manager.
 */
function sManEinzelSeitenAnalyse(app, normSeite, sManAnalyseRegeln) {

    const erkannteFelder = erkenneFelder(app, normSeite, sManAnalyseRegeln);
    
    const analysierteSeite = {
        tFile: normSeite.tFile,
        exists: normSeite.exists,
        name: normSeite.name,
        path: normSeite.path,
        wikiLink: normSeite.wikiLink,
        frontmatter: normSeite.frontmatter,
        erkannteFelder: {},
        rolle: [],
        rolleVia: []


    };

    //const rollenErkennung = erkenneRolle(normSeite);

    return analysierteSeite;
}
```

## erkenneFelder

```js
/**
 * Erhält eine NormSeite und die Analyse-Regln. 
 * überprüft anhand der Regeln, welche der dort angegebenen Felder 
 * im dort angegebenen Format vorliegen. 
 * Gibt ... zurück. 
 */

function erkenneFelder(app, normSeite, sManAnalyseRegeln) {

    const { name, frontmatter } = normSeite;

    const { graphRole, klasse, inKlasse, stKlasse, ist } = frontmatter;

    const erkannteFelder = {};
    
    Object.entries(sManAnalyseRegeln.felder).forEach((feldKey, regeln) => {

        if (frontmatter.hasOwnProperty(feldKey)) {

            erkannteFelder[feldKey] = {...regeln};
            feldAnalyse(erkannteFelder[feldKey], frontmatter[feldKey]);
            

        }
    });

    function feldAnalyse(analysiertesFeld, wert) {

        analysiertesFeld.anzahlWerte = 0;
        analysiertesFeld.erkannteWertTypen = [];

        if (Array.isArray(wert)) {
            
            analysiertesFeld.erkannterFeldTyp = "multi";

            wert.forEach(einzelWert => {
            
                analysiertesFeld.anzahlWerte += 1;
                analysiertesFeld.erkannteWertTypen.push(einzelWertAnalyse(wert));
            });
        }
        
        if (typeof wert === "string") {
            
            return "single";
        }

        if (typeof wert === "object") {
            
            return "object";
        }

        else {
         
            return "n/e";
        }
    }

    function einzelWertAnalyse(wert) {

        if (Array.isArray(wert)) 
            return "array";

        if (typeof wert === "string" && wert.startsWith("[[")) 
            return "link";

        if (typeof wert === "string")
            return "string";

        if (typeof wert === "object") 
            return "object";

        else
            return "n/e";
    }
    
}
```

## getSManAnalyseRegeln

```js
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
                erwarteterFeldTyp: "single",
                erwarteterWertTyp: "id",  // 
                berechtigt: true,
            },
            graphRole: {
                erwarteterFeldTyp: "single",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            klasse: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            typ: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            art: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            inKlasse: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            inFeld: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            parent: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            erlaubterTyp: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            stKlasse: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            stParent: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            pstatus: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: true
            },
            
            ist: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: null
            },
            in: {
                erwarteterFeldTyp: "multi",
                erwarteterWertTyp: "link",
                berechtigt: null
            },
            /*med: {
                erwarteterFeldTyp: "object",
                erwarteterWertTyp: "key"
            }*/

            
        },
        frontMatterCheck: function(fm) {

            
        }

    };

    function idCheck(wert) {
                    
        return {
            altesFormat: /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(wert),
            neuesFormatFalsch: /^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(wert),
            neuesFormat: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(wert)
        };
    }
}
```

## erkenneRolle

```js
/**
 * 
 */

function erkenneRolle(normSeite) {

    const { name, frontmatter } = normSeite;

    const { graphRole, klasse, inKlasse, stKlasse, ist } = frontmatter;

    const erkannteRolle = {

        als: [],
        via: [],
        addErkennung: function(als, via) {

            if (!this.als.includes(als))
                this.als.push(als);

            if (!this.via.includes(via))
                this.via.push(via);
        },

        getInfoString: function() {

            const erkanntAls = this.als.length > 0 ? this.als.join(", ") : "";
            const erkanntVia = this.via.length > 0 ? this.via.join(", ") : "";
            
            return this.als.length === 0 && this.via.length === 0
                ? "n/a" 
                : `erkannt als ${erkanntAls} via ${erkanntVia}`;
        }
    };

    const rootsObj = {

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
        ]
    }

    if (graphRole?.includes("Ontology Root Page")) {

        erkannteRolle.addErkennung("Ontology Root Page", "graphRole");
    }

    if (klasse?.some(val => rootsObj.ontRoots.includes(val.slice(2,-2))) ) {

        erkannteRolle.addErkennung("Ontology Instance", "klasse");
    }

    if ( (!!ist && ist?.some(val => rootsObj.ontRoots.some(root => val.startsWith(`[[${root}`))) 
         && !rootsObj.ontRoots.some(root => name.startsWith(`${root} _`)) ) 
    ) {

        erkannteRolle.addErkennung("Ontology Instance", "ist");
    }

    if (inKlasse?.some(val => rootsObj.ontRoots.includes(val.slice(2,-2))) ) {

        erkannteRolle.addErkennung("Ontology Definition", "inKlasse");
    }

    if ( (!!ist && ist?.some(val => rootsObj.ontRoots.some(root => val.startsWith(`[[${root}`))) 
         && rootsObj.ontRoots.some(root => name.startsWith(`${root} _`)) ) 
    ) {

        erkannteRolle.addErkennung("Ontology Definition", "ist");
    }
    
    if (graphRole?.includes("Semantic Taxonomy Root Page")) {

        erkannteRolle.addErkennung("Semantic Taxonomy Root Page", "graphRole");
    }

    if (stKlasse?.some(val => rootsObj.semTaxRoots.includes(val.slice(2,-2))) ) {

        erkannteRolle.addErkennung("Semantic Taxonomy Page", "stKlasse");
    }

    if ( (!!ist && ist?.some(val => rootsObj.semTaxRoots.some(root => val.startsWith(`[[${root}`))) 
         /*&& checkObj.ontRoots.some(root => name.startsWith(`${root} _`))*/ ) 
    ) {

        erkannteRolle.addErkennung("Semantic Taxonomy Page", "ist");
    }

    return erkannteRolle;
}
```

