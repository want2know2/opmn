
////
// IMPORT                         	// FROM  

import { Plugin }                 	from "obsidian";
import { getDataviewApi }         	from "../shared/services/queries/queryService.js";

import { MetadataEditorModal }    	from "../adapters/MetadataEditorModal.js";

import { BulkEditorTestView, 
		 TYPE_BULK_EDITOR } 		from "../adapters/migrationsEditorTestView.js";

import { InhaltMigView, 
		 TYPE_INHALT_MIG } 			from "../adapters/inhaltMigEditTestView.js";


/**
 * Der Einstiegspunkt des Plugins. Registriert die Views, 
 * Ribbon-Buttons und Commands.
 * Quasi die "Komposition" des Plugins.
 */

export default class OpmnPlugin extends Plugin {

	async onload() {

		// DV Objekt
		const dv = getDataviewApi(this.app);

		// VIEWS

		this.registerView(TYPE_BULK_EDITOR, (leaf) => new BulkEditorTestView(leaf, dv));
		this.registerView(TYPE_INHALT_MIG.id, (leaf) => new InhaltMigView(leaf, dv));
		
		//

		// BUTTONS AUF DEM RIBBON

		this.addRibbonIcon("app-window-mac", "Open OPMNnew", () => {
			this.activateView(TYPE_BULK_EDITOR);
		});

		this.addRibbonIcon(TYPE_INHALT_MIG.icon, TYPE_INHALT_MIG.text, () => {
			this.activateView(TYPE_INHALT_MIG.id);
		});

		this.addRibbonIcon("table-properties", "OPMN: Open Metadata editor", () => {
			new MetadataEditorModal(this.app, dv).open();
		});

		// COMMANDS IN DER COMMAND PALETTE
		this.addCommand({
			id: "open-opmn-view",  	// irgendiwe ist hier noch mal ne andere 
									// "id" angegeben als die in TYPE_BULK_EDITOR
									// die überall sonst (s.o. und hier in der 
									// CallbackFn) verwendet wird.
			name: "Open view",
			callback: () => this.activateView(TYPE_BULK_EDITOR),
		});

		this.addCommand({
			id: TYPE_INHALT_MIG.id,	// hier die gleiche "id" verwendet wie oben
									// und in der CallbackFn, scheint egal zu sein.
			name: TYPE_INHALT_MIG.name,
			callback: () => this.activateView(TYPE_INHALT_MIG.id),
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

