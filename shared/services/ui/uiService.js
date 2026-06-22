

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
 * Benutzung:
 * uiMaker(contentEl, {
 * 		// key = wie das El heißen soll, z.B. mainCon
 * 		// [0] = parent (leer = contentEl) 
 * 			// parent muss ein key dieses Objekts sein, der vor diesem key kommt
 * 		// [1] = HTML-Typ (leer = "div")
 * 		// [2] = Text (leer = "")
 *      mainCon: ["", "", ""],
 *      infoCon: ["mainCon", "span", "Willkommen beim Migrations-Manager"],
 *		usw: ["","br"]
 * })
 */

export function uiMaker(conEl, elArrsObj = {}) {
	const elObj = {};
	Object.keys(elArrsObj).forEach(key => {
		
		const parent = !elArrsObj[key]?.[0] || elArrsObj[key]?.[0] === "" 
			? conEl 
			: elObj[elArrsObj[key][0]];
		
		const htmlTyp = !elArrsObj[key]?.[1] || elArrsObj[key]?.[1] === "" 
			? "div" 
			: elArrsObj[key][1];
		
		const text = !elArrsObj[key]?.[2] || elArrsObj[key]?.[2] === "" 
			? "" 
			: elArrsObj[key][2];

		elObj[key] = parent.createEl(htmlTyp, {text: text});
	})
	return elObj;
}

