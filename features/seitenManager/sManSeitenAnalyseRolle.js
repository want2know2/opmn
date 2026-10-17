


/**
 * Ermittelt anhand der Regeln und der (bereits analysierten) Felder,
 * welche Rolle die Seite im Graph spielt, und aus welchem/n Feld/ern 
 * diese Information entnommen wurde.
 */

export function sManRollenAnalyse(app, analysierteSeite, sManAnalyseRegeln) {

    // Dekonst:

    const { name } = analysierteSeite;
    const { graphRole, klasse, inKlasse, stKlasse, ist } = analysierteSeite.fmAnalyse;

    const ontologyRoots = sManAnalyseRegeln.roots.ontology;
    const semanticTaxonomyRoots = sManAnalyseRegeln.roots.semanticTaxonomy;

    // Objekt erstellen:

    const erkannteRolle = {

        erkanntAls: [],
        erkanntVia: [],
        getText: function() {

            const erkanntAls = this.erkanntAls.length > 0 ? this.erkanntAls.join(", ") : "";
            const erkanntVia = this.erkanntVia.length > 0 ? this.erkanntVia.join(", ") : "";
            
            return this.erkanntAls.length === 0 && this.erkanntVia.length === 0
                ? "n/a" 
                : `erkannt als ${erkanntAls} via ${erkanntVia}`;
        }
    };

    // Helfer:

    function addErkennung(als, via) {

        if (!erkannteRolle.erkanntAls.includes(als))
            erkannteRolle.erkanntAls.push(als);

        if (!erkannteRolle.erkanntVia.includes(via))
            erkannteRolle.erkanntVia.push(via);
    }

    // Erkennung:

    if (graphRole?.werte?.includes("Ontology Root Page")) {

        addErkennung("Ontology Root Page", "graphRole");
    }

    if (klasse?.werte?.some(val => ontologyRoots.includes(val.slice(2,-2))) ) {

        addErkennung("Ontology Instance", "klasse");
    }

    if ( (!!ist && ist?.werte?.some(val => ontologyRoots.some(root => val.startsWith(`[[${root}`))) 
         && !ontologyRoots.some(root => name.startsWith(`${root} _`)) ) 
    ) {

        addErkennung("Ontology Instance", "ist");
    }

    if (inKlasse?.werte?.some(val => ontologyRoots.includes(val.slice(2,-2))) ) {

        addErkennung("Ontology Definition", "inKlasse");
    }

    if ( (!!ist && ist?.werte?.some(val => ontologyRoots.some(root => val.startsWith(`[[${root}`))) 
         && ontologyRoots.some(root => name.startsWith(`${root} _`)) ) 
    ) {

        addErkennung("Ontology Definition", "ist");
    }
    
    if (graphRole?.werte?.includes("Semantic Taxonomy Root Page")) {

        addErkennung("Semantic Taxonomy Root Page", "graphRole");
    }

    if (stKlasse?.werte?.some(val => semanticTaxonomyRoots.includes(val.slice(2,-2))) ) {

        addErkennung("Semantic Taxonomy Page", "stKlasse");
    }

    if ( (!!ist && ist?.werte?.some(val => semanticTaxonomyRoots.some(root => val.startsWith(`[[${root}`))) 
         /*&& checkObj.ontRoots.some(root => name.startsWith(`${root} _`))*/ ) 
    ) {

        addErkennung("Semantic Taxonomy Page", "ist");
    }

    return erkannteRolle;
}


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
