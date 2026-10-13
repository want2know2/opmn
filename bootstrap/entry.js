
////
// IMPORT                         	// FROM  

import { Plugin }                 	from "obsidian";
import { getDataviewApi }         	from "../shared/services/queries/dvQueryService.js";

import { MetadataEditorModal }    	from "../adapters/MetadataEditorModal.js";

import { SeitenManagerView, 
		 TYPE_SEITEN_MANAGER } 			from "../adapters/seitenManagerView.js";




/**
 * Der Einstiegspunkt des Plugins. Registriert die Views, 
 * Ribbon-Buttons und Commands.
 * Quasi die "Komposition" des Plugins.
 */

export default class OpmnPlugin extends Plugin {

	async onload() {

		// DV Objekt
		const dv = getDataviewApi(this.app);

		// JSON-Objekte, quasi sowas wie Registry erstellen
		//createLookups(this.app);
		
		
		
		// VIEWS

		this.registerView(TYPE_SEITEN_MANAGER.id, (leaf) => new SeitenManagerView(leaf, dv));
		
		//

		// BUTTONS AUF DEM RIBBON
		this.addRibbonIcon(TYPE_SEITEN_MANAGER.icon, TYPE_SEITEN_MANAGER.text, () => {
			this.activateView(TYPE_SEITEN_MANAGER.id);
		});

		this.addRibbonIcon("table-properties", "OPMN: Open Metadata editor", () => {
			new MetadataEditorModal(this.app, dv).open();
		});

		// COMMANDS IN DER COMMAND PALETTE
		this.addCommand({
			id: TYPE_SEITEN_MANAGER.id,	// hier die gleiche "id" verwendet wie oben
									// und in der CallbackFn, scheint egal zu sein.
			name: TYPE_SEITEN_MANAGER.name,
			callback: () => this.activateView(TYPE_SEITEN_MANAGER.id),
		});

		this.addCommand({
			id: "open-opmn-metadata-editor",
			name: "Open metadata editor",
			callback: () => new MetadataEditorModal(this.app, dv).open(),
		});
	}

	onunload() {}

	// Open in new tab, focusing the existing one if it is already open.
	async activateView(type) {
		
		const { app } = this;
		// workspace.getLeavesOfType gibt anscheinend Liste aller 
		// geöffneten Views dieses Typs (type = bspw. der 
		// String in VIEW_TYPE_OPMN ) zurück.
		let leaf = app.workspace.getLeavesOfType(type)[0];
		if (!leaf) {
			leaf = app.workspace.getLeaf(true); // true = open in a new tab
			await leaf.setViewState({ type: type, active: true });
		}

		app.workspace.revealLeaf(leaf);
	}
}

