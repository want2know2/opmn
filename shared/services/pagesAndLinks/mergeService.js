
////
// IMPORT                       // FROM

import { toArray } from "../../utils/valueUtils";
import { einzelnerFeldWert, checkFieldArrForLink } from "../metadata/metaReadService";
import { resolveLinkPath } from "./linkService";
import { getPageNormObject }    from "./pageNormService";


/**
 * Erhält die Zielseite: Liest Feld `ist`: 
 * Prüft für jeden Wert, ob dazu eine Seite existiert,
 * die ein Inhalt ist und Status _ P hat.
 */

export function istWertSeitenCheck(app, dv, seite) {
	
	const inhaltSeite  = getPageNormObject(app, dv, "Inhalt.md");
	const pStatusSeite = getPageNormObject(app, dv, "Status _ p.md");
	
	// Zielseite Feld ist-Werte => normSeiten
	const feldIst = toArray(einzelnerFeldWert(app, seite.tFile, "ist"))
		.map(ist => resolveLinkPath(app, ist))
		.map(ist => getPageNormObject(app, dv, ist));

	// prüfe ist-Wert-Seiten: 
	// existiert, ist Inhalt und Status p
	const istWerteFalsch = [];
	const istWerteEditierbar = [...feldIst]
		.filter(ist => {
			if (!ist.exists) istWerteFalsch.push({ info: "existiert nicht" });
			else return true;
		})
		.filter(ist => {
			const inh = checkFieldArrForLink(app, ist, "ist", inhaltSeite);
			const statP = checkFieldArrForLink(app, ist, "ist", pStatusSeite);
			const infostr = [];
			if (!inh && !statP) infostr.push("ist kein Inhalt und hat keinen p-Status");
			if (!inh) infostr.push("ist kein Inhalt");
			if (!statP) infostr.push("hat keinen p-Status");
			if (!inh || !statP) {
				ist.info = infostr.join(", ");
				istWerteFalsch.push(ist);
			} else return true;
		});

	// Gibt zwei Listen mit `ist`-Werten zurück: 
	// editierbar: gültiges Norm-Obj für jeden  `ist`-Wert, 
	// der ein gültiges Norm-Objekt ist, Inhalt und p-Status hat.
	// nicht editierbar: Info-String für jeden `ist`-Wert, 
	// bei dem das nicht der Fall ist.
	return {
		editierbar: istWerteEditierbar,
		nichtEditierbar: istWerteFalsch
	};
}


/**
 * Erhält SeiteNormObj für gültigen `ist`-Wert
 * gibt drei SeiteNormObj zurück: 
 * neuSeite: 
 */

export function neueInhIstWerte(app, dv, seite) {
	const pathNP = seite.path.replace(" (p)", "");
	const cleanPathArr = pathNP.split(" _ ")
		.filter((str, i) => i !== 1);

	// Neu-, Typ-, Parent-Path
	let artPath = "";
	const typPath = `Inhalt _ ${pathNP.split(" _ ")[1]}`;
	let parentPath = "";

	cleanPathArr.forEach((str, i) => {
		if (i < cleanPathArr.length - 1) {
			artPath += `${str} _ `;
			if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
				parentPath += `${str} _ `;
			else if (cleanPathArr.length > 2) parentPath += `${str}`;
		}
		else {
			artPath += `${str}`;
		}
	});

	// Neu-, Typ-, Parent-Seiten
	const artSeite = getPageNormObject(app, dv, artPath);
	const typSeite = getPageNormObject(app, dv, typPath);
	const parentSeite = getPageNormObject(app, dv, parentPath);

	return {
		artSeite, typSeite, parentSeite
	};
}

