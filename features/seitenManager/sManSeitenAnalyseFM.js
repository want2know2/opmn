


/**
 * Erzeugt für jedes Feld in frontmatter einen Eintrag im fmAnalyse-Objekt
 * der analysierten Seite: key = feldName, entry => durch `analysiereFeldWert` erstellt:
 * (Beschreibung s. `getSManAnalysierteSeiten`)
 */

export function sManFMAnalyse(analysierteSeite, felderRegeln) {

    const { frontmatter, fmAnalyse } = analysierteSeite;

    for (const [feldName, feldWert] of Object.entries(frontmatter)) {

        fmAnalyse[feldName] = analysiereFeldWert(feldWert, felderRegeln[feldName]);
    }

    fmAnalyse.getText = () => {

        let text = "";

        Object.entries((fmAnalyse)).forEach(([key, entry]) => {

            if (key !== "getText")
                text += `${key}, `;
        });

        return text;
    }
}


/**
 * Erzeugt für jedes Feld, das von `sManFMAnalyse` als Key an fmAnalyse angehangen wird, 
 * das entsprechende Analyse-Objekt (Beschreibung s. `getSManAnalysierteSeiten`).
 */

function analysiereFeldWert(feldWert, feldRegeln) {

    const feldTyp = erkenneFeldTyp(feldWert);
    const feldBekannt = !!feldRegeln;

    const analyse = {
        feldTyp,
        feldBekannt,
        gehoertZuNeuerStruktur: feldBekannt
            ? feldRegeln.gehoertZuNeuerStruktur
            : null,
        feldTypKorrekt: feldBekannt
            ? feldTyp === feldRegeln.feldTyp
            : null,
    };
   
    if (feldTyp === "multi") {

        analyse.anzahlElemente = feldWert.length;
        analyse.werte = feldWert;
        analyse.wertTypen = feldWert.map(einzelWert => analysiereEinzelWert(einzelWert));
        analyse.wertTypenKorrekt = feldBekannt 
            ? analyse.wertTypen.every(wertTyp => wertTyp === feldRegeln.wertTyp)
            : null;
    }

    if (feldTyp === "single") {

        analyse.anzahlElemente = 1;
        analyse.werte = [feldWert];
        analyse.wertTypen = [analysiereEinzelWert(feldWert)];
        analyse.wertTypenKorrekt = feldBekannt 
            ? analyse.wertTypen[0] === feldRegeln.wertTyp
            : null;
    }

    if (feldTyp === "object") {

        analyse.anzahlElemente = Object.keys(feldWert).length;
        analyse.enthalteneFelder = {};

        for (const [enthFeldName, enthFeldWert] of Object.entries(feldWert)) {

            analyse.enthalteneFelder[enthFeldName] = analysiereFeldWert(enthFeldWert, feldRegeln?.enthalteneFelder?.[enthFeldName]);
        }
    }

    return analyse;
}

/**
 * Gibt für einen einzelnen Wert zurück, um welchen Wert-Typ es sich handelt. 
 */

function analysiereEinzelWert(feldWert) {
    
    if (typeof feldWert === "string" && feldWert.startsWith("[[") && feldWert.endsWith("]]")) 
        return "link";

    if (Array.isArray(feldWert)) 
        return "array";

    if (typeof feldWert === "object") 
        return "object";

    if (typeof feldWert === "string") {
        if (/^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}$/.test(feldWert)) 
            return "id: alt";
        if (/^\d{4}-\d{2}-\d{2} _ \d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(feldWert))
            return "id: neu (falsch)";
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z _ [a-z0-9]{6}$/.test(feldWert))
            return "id: neu";
        else 
            return "string";
    }

    else
        return "n/e";
}


/**
 * Gibt für ein einzelnes Feld zurück, um welchen Feld-Typ es sich handelt.
 */

function erkenneFeldTyp(feldWert) {
    
    if (Array.isArray(feldWert)) {
        return "multi";
    }

    if (feldWert === null) {
        return "null";
    }

    if (typeof feldWert === "string") {
        return "single";
    }

    if (typeof feldWert === "object") {
        return "object";
    }

    return "n/e";
}