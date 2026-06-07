
//// 
// IMPORT                       // FROM

import { einzelnerFeldWert }    from "../../shared/services/metadata/metaReadService.js";
import { removeField, 
         setField, 
         updateFrontmatter }    from "../../shared/services/metadata/metaWriteService.js";

import { resolveLinkPath }      from "../../shared/services/pagesAndLinks/linkService.js";
import { listFeldAsNormPages } from "../../shared/services/pagesAndLinks/pageFetchService.js";
import { getPageNormObject }    from "../../shared/services/pagesAndLinks/pageNormService.js";

import { tableMakerReihe, 
         tableMakerReiheHd }    from "../../shared/services/ui/uiService.js";
import { placeHoverLinkOnEl }   from "../../shared/services/ui/uiLinkService.js";


/**
 * Alle Seiten im Vault anzeigen:
 * -----------------------------
 * - nummeriert
 * - Link zur Seite
 * - Feld ist: 
 * - - Link zu ist-Werten
 * 
 * Was noch fehlt:
 * ---------------
 * - Weitere Felder
 * - Überprüfung der Felder
 * ------------------------
 */

export function obsappTest(obsidianClassObj) {
    
	const { app, dv, contentEl } = obsidianClassObj;

    // Überschrift
    const header = contentEl.createEl("h2");

    // Tabelle
    const tabHeader = [
        "nr",     // (1)
        "Seite",  // (2)
        "ist"     // (3)
    ];
    const tabelle = tableMakerReiheHd(contentEl, tabHeader);

    // SUCHE: Alle Seiten
    const alleSeiten = dv.pages().map(p => getPageNormObject(app, dv, p.file.path));
    const alleSLng = alleSeiten.length;

    // Überschrift-Text
    header.textContent = `${alleSLng} Ergebnisse`;
    
    // SUCHE ergebnisse anzeigen
    alleSeiten.forEach((p, i) => {

        // Reihe
        const cells = tableMakerReihe(tabelle, tabHeader.length);
        // (1) nr.
        const nrBox = cells[0].createEl("div", {text: i+1});
        // (2) Seite-Link
        const linkBox = cells[1].createEl("div");
        placeHoverLinkOnEl(obsidianClassObj, linkBox, p);

        // (3) Feld ist: Feldwert in Seitenobjekt umwandeln
        const istPgsArr = listFeldAsNormPages(app, dv, p, "ist");
        
        // Feld ist: Links anzeigen                                 
        const istPgsBox = cells[2].createEl("div");                 // Das theoretisch auch:
        istPgsArr.forEach(istpage => {                              // Für Liste von Seiten-Objekten 
            const istpgBox = istPgsBox.createEl("div");             // => Box mit Link iwo anheften
            placeHoverLinkOnEl(obsidianClassObj, istpgBox, istpage, istpage.name);
        })
        
        
        

        
        
        
    })

}

