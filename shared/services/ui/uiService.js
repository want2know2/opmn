

/**
 * Tabelle Überschriften: Eine Reihe + pro Header eine Cell.
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
 * Eine Reihe + pro Header eine Cell.
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

