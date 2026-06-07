
////
// IMPORT                       // FROM

import { listFieldHasLink }     from "./linkService";
import { getPageNormObject }    from "./pageNormService";


/**
 * Prüft für jeden Wert, ob dazu eine Seite existiert,
 * die ein Inhalt ist und Status _ P hat.
 */

export function istWertSeitenCheck(app, dv, seite, pStatusSeite, inhaltSeite) {
	// Zielseite Feld ist-Werte => normSeiten
	const feldIst = (Array.isArray(seite.dvPage.ist)
		? seite.dvPage.ist : [seite.dvPage.ist])
		.map(ist => getPageNormObject(app, dv, ist.path));

	// prüfe ist-Wert-Seiten: 
	// existiert, ist Inhalt und Status p
	const istWerteFalsch = [];
	const istWerteEditierbar = [...feldIst]
		.filter(ist => {
			if (!ist.exists) istWerteFalsch.push({ info: "existiert nicht" });
			else return true;
		})
		.filter(ist => {
			const statP = listFieldHasLink(app, ist, "ist", pStatusSeite);
			const inh = listFieldHasLink(app, ist, "ist", inhaltSeite);
			const infostr = [];
			if (!statP) infostr.push("hat keinen p-Status");
			if (!inh) infostr.push("ist kein Inhalt");
			if (!statP || !inh) {
				ist.info = infostr.join(", ");
				istWerteFalsch.push(ist);
			}
			else return true;
		});

	return {
		editierbar: istWerteEditierbar,
		nichtEditierbar: istWerteFalsch
	};
}


/**
 *
 */

export function neueInhIstWerte(app, dv, seite) {
	const pathNP = seite.path.replace(" (p)", "");
	const cleanPathArr = pathNP.split(" _ ")
		.filter((str, i) => i !== 1);

	// Neu-, Typ-, Parent-Path
	let neuPath = "";
	const typPath = `Inhalt _ ${pathNP.split(" _ ")[1]}`;
	let parentPath = "";

	cleanPathArr.forEach((str, i) => {
		if (i < cleanPathArr.length - 1) {
			neuPath += `${str} _ `;
			if (cleanPathArr.length > 2 && i < cleanPathArr.length - 2)
				parentPath += `${str} _ `;
			else if (cleanPathArr.length > 2) parentPath += `${str}`;
		}
		else {
			neuPath += `${str}`;
		}
	});

	// Neu-, Typ-, Parent-Seiten
	const neuSeite = getPageNormObject(app, dv, neuPath);
	const typSeite = getPageNormObject(app, dv, typPath);
	const parentSeite = getPageNormObject(app, dv, parentPath);

	return {
		neuSeite, typSeite, parentSeite
	};
}

