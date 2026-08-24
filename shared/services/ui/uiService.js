

/**
 * Tabelle Überschriften: Erste Reihe + pro Header eine Cell.
 * Gibt TABELLE zurück.
 */

export function tableMakerReiheHd(container, headerArr) {
	const tabelle = container.createEl("table", { cls: "" });
	const tabReihe = tabelle.createEl("tr", { cls: "" });
	headerArr.forEach(h => {
		tabReihe.createEl("th", {
			text: h, cls: "opmn-table-cell-hd"
		});
	});
	return tabelle;
}


/**
 * Tabelle weitere Reihen: cellsNum sollte = Anzahl header 
 * in Tabelle Überschriften (s.o.) sein. 
 * Eine Reihe + pro Header (bzw. pro in `cellsNum` 
 * angegebener Anzahl) eine Cell.
 * GIBT CELLS zurück.
 */

export function tableMakerReihe(table, cellsNum) {
	const tabReihe = table.createEl("tr", { cls: "" });
	let cells = [];
	for (let i = 0; i < cellsNum; i++) {
		const cell = tabReihe.createEl("td", {
			cls: "opmn-table-cell"
		});
		cells.push(cell);
	}
	return cells;
}


/**
 * 
 */

export function listMaker(container, listeArr) {

	const liste = container.createEl("ul");

	listeArr.forEach(el => liste.createEl("li", {text: el}));

	return liste;
}


/**
 * Benutzung:
 * 1. Argument: HTML/DOM-Parent-Element, 
 * 2. Argument: Objekt: Key = wie das El heißen soll, z.B. mainCon
 * 		jeder Key speichert eine Tabelle, die optional drei Einträge enthalten kann:
 * 		[0] = parent (leer = das im 1. Argument angegebene Parent-Element) 
 * 			wenn ein Parent angegeben wird, das Teil dieses Objekts ist,
 * 			muss das Parent-Element im Objekt vor dem Child-Element kommen.
 * 		[1] = HTML-Typ (leer = "div")
 * 		[2] = Text (leer = "")
 * 
 * 		z.B.:
 *      mainCon: [],
 *      infoCon: ["mainCon", "span", "Willkommen beim Migrations-Manager"],
 *		usw: ["","br"]
 *		usf: ["mainCon","br"]
		etc: [,,"Text diesdas bla"]
 * })
 */

export function uiMaker(conEl, elArrsObj = {}) {
	const elObj = {};
	Object.entries(elArrsObj).forEach(([key, entry]) => {

				
		const parent = !entry?.[0] || entry?.[0] === "" 
			? conEl 
			: elObj[entry[0]]; // greift auf el zu, das bereits vorher zu elObj hinzugefügt wurde
		
		const htmlTyp = !entry?.[1] || entry?.[1] === "" 
			? "div" 
			: entry[1];
		
		const text = !entry?.[2] || entry?.[2] === "" 
			? "" 
			: entry[2];

		elObj[key] = parent.createEl(htmlTyp, {text: text});
	})
	return elObj;
}

