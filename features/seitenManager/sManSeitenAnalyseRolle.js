


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

