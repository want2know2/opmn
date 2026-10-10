import { getLookups } from "../dataService/createLookups";



export function seitenCheck(app, normSeite) {

    const { name, frontmatter } = normSeite;

    const { graphRole, klasse, inKlasse, stKlasse, ist } = frontmatter;

    const erwarteterTyp = pruefeFeldWertTyp(normSeite);

    normSeite.meldungen = [];

    Object.entries(erwarteterTyp).forEach(([key, feldObj]) => {

        if (feldObj.vorhanden && !feldObj.erwarteterTypKorrekt)
            normSeite.meldungen.push(`Das Feld ${key} hat nicht den richtigen FeldWertTyp`)
    });

    if (normSeite.meldungen.length === 0)
        normSeite.erkannteRolle = erkenneRolle(normSeite);

    const lookups = getLookups(app);
    normSeite.gecheckteFelder = lookups.felder.checkFelder(normSeite.frontmatter);

}


/**
 * 
 */

function pruefeFeldWertTyp(normSeite) {

    const { name, frontmatter } = normSeite;

    const { graphRole, klasse, inKlasse, stKlasse, ist } = frontmatter;

    const erwarteterTyp = {

        graphRole: { wert: graphRole, vorhanden: null, erwarteterTyp: "string", erwarteterTypKorrekt: null },
        klasse: { wert: klasse, vorhanden: null, erwarteterTyp: "array", erwarteterTypKorrekt: null },
        inKlasse: { wert: inKlasse, vorhanden: null, erwarteterTyp: "array", erwarteterTypKorrekt: null },
        stKlasse: { wert: stKlasse, vorhanden: null, erwarteterTyp: "array", erwarteterTypKorrekt: null },
        ist: { wert: ist, vorhanden: null, erwarteterTyp: "array", erwarteterTypKorrekt: null }
    };

    Object.values(erwarteterTyp).forEach(feldObj => {

        if (!!feldObj.wert) {

            feldObj.vorhanden = true;
            feldObj.erwarteterTypKorrekt = check(feldObj.wert, feldObj.erwarteterTyp);
        }
    })
    
    function check(feldWert, erwarteterTyp) {

        switch (erwarteterTyp) {
            case "string":
                
                return typeof feldWert === "string";
                break;
            
            case "array":
                return Array.isArray(feldWert);
                break;
        }
    }

    return erwarteterTyp;
}




// ------------------------------

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

    if ( (ist?.some(val => rootsObj.ontRoots.some(root => val.startsWith(`[[${root}`))) 
         && !rootsObj.ontRoots.some(root => name.startsWith(`${root} _`)) ) 
    ) {

        erkannteRolle.addErkennung("Ontology Instance", "ist");
    }

    if (inKlasse?.some(val => rootsObj.ontRoots.includes(val.slice(2,-2))) ) {

        erkannteRolle.addErkennung("Ontology Definition", "inKlasse");
    }

    if ( (ist?.some(val => rootsObj.ontRoots.some(root => val.startsWith(`[[${root}`))) 
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

    if ( (ist?.some(val => rootsObj.semTaxRoots.some(root => val.startsWith(`[[${root}`))) 
         /*&& checkObj.ontRoots.some(root => name.startsWith(`${root} _`))*/ ) 
    ) {

        erkannteRolle.addErkennung("Semantic Taxonomy Page", "ist");
    }

    return erkannteRolle;
}