
////
// IMPORT                         	// FROM  

import { Plugin }                 	from "obsidian";

import { MetadataEditorModal }    	from "../adapters/MetadataEditorModal.js";
import { getDataviewApi }         	from "../shared/services/queries/queryService.js";
import {BulkEditorTestView, 
		TYPE_BULK_EDITOR } 		from "../adapters/BulkEditorTestView.js";


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

		// BUTTONS AUF DEM RIBBON

		this.addRibbonIcon("app-window-mac", "Open OPMNnew", () => {
			this.activateView(TYPE_BULK_EDITOR);
		});

		this.addRibbonIcon("table-properties", "OPMN: Open Metadata editor", () => {
			new MetadataEditorModal(this.app, dv).open();
		});

		// COMMANDS IN DER COMMAND PALETTE

		this.addCommand({
			id: "open-opmn-view",
			name: "Open view",
			callback: () => this.activateView(TYPE_BULK_EDITOR),
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
		
		const { workspace } = this.app;
		// workspace.getLeavesOfType gibt anscheinend Liste aller 
		// geöffneten Views dieses Typs (type = bspw. der 
		// String in VIEW_TYPE_OPMN ) zurück.
		let leaf = workspace.getLeavesOfType(type)[0];
		if (!leaf) {
			leaf = workspace.getLeaf(true); // true = open in a new tab
			await leaf.setViewState({ type: type, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}

