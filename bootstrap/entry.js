////
// IMPORT                         	// FROM  

import { Plugin }                 	from "obsidian";
import { getDataviewApi }         	from "../shared/services/queryService/dvQueryService.js";


import { MetadataEditorModal }    	from "../adapters/MetadataEditorModal.js";

import { SeitenManagerView, 
		 TYPE_SEITEN_MANAGER } 		from "../adapters/seitenManagerView.js";
import { FafoView, TYPE_FAFO_VIEW } from "../adapters/FafoView.js";
import { EventManager } from "../shared/services/eventService/eventManager.js";




/**
 * Der Einstiegspunkt des Plugins. Registriert die Views, 
 * Ribbon-Buttons und Commands.
 * Quasi die "Komposition" des Plugins.
 */

export default class OpmnPlugin extends Plugin {

	async onload() {

		// DV Objekt
		const dv = getDataviewApi(this.app);

		// 1. EVENT MANAGER INSTANZIEREN
		// Wir übergeben "this" (die Plugin-Instanz), damit der EventManager Zugriff auf this.app hat
		this.eventManager = new EventManager(this);

		// 2. WARTEN BIS DAS HOOK LAYOUT BEREIT IST
		// Verhindert Performance-Probleme beim Laden des Tresors (Vault Startup-Scan)
		this.app.workspace.onLayoutReady(() => {
			console.log("OPMN: Workspace ist bereit. Starte EventManager...");
			this.eventManager.initialize();
		});
		
		
		// VIEWS RECHIEREN
		// Wir geben den Views sowohl das 'dv'-Objekt als auch unsere neue 'eventManager'-Instanz mit
		this.registerView(TYPE_SEITEN_MANAGER.id, (leaf) => new SeitenManagerView(leaf, dv, this.eventManager));
		this.registerView(TYPE_FAFO_VIEW.id, (leaf) => new FafoView(leaf, dv, this.eventManager));
		

		// BUTTONS AUF DEM RIBBON
		this.addRibbonIcon(
			TYPE_SEITEN_MANAGER.icon, 
			TYPE_SEITEN_MANAGER.text, 
			() => {
				this.activateView(TYPE_SEITEN_MANAGER.id);
			}
		);

		this.addRibbonIcon(
			TYPE_FAFO_VIEW.icon,
			TYPE_FAFO_VIEW.text,
			() => {
				this.activateView(TYPE_FAFO_VIEW.id);
			}
		)

		this.addRibbonIcon(
			"table-properties",
			"OPMN: Open Metadata editor", 
			() => {
				new MetadataEditorModal(this.app, dv).open();
			}
		);

		// COMMANDS IN DER COMMAND PALETTE
		this.addCommand({
			id: TYPE_SEITEN_MANAGER.id,	
			name: TYPE_SEITEN_MANAGER.name,
			callback: () => this.activateView(TYPE_SEITEN_MANAGER.id),
		});

		this.addCommand({
			id: TYPE_FAFO_VIEW.id,
			name: TYPE_FAFO_VIEW.name,
			callback: () => this.activateView(TYPE_FAFO_VIEW.id)
		})

		this.addCommand({
			id: "open-opmn-metadata-editor",
			name: "Open metadata editor",
			callback: () => new MetadataEditorModal(this.app, dv).open(),
		});
	}

	onunload() {
		console.log("Unloading OPMN plugin...");
		// 3. SAUBERES ENTFERNEN DER EVENT-LISTENERS
		if (this.eventManager) {
			this.eventManager.destroy();
		}
	}

	// Open in new tab, focusing the existing one if it is already open.
	async activateView(type) {
		
		const { app } = this;
		// workspace.getLeavesOfType gibt anscheinend Array aller 
		// geöffneten Views dieses Typs (type = bspw. der 
		// String in TYPE_SEITEN_MANAGER.id ) zurück.
		let leaf = app.workspace.getLeavesOfType(type)[0];
		if (!leaf) {
			leaf = app.workspace.getLeaf(true); // true = open in a new tab
			await leaf.setViewState({ type: type, active: true });
		}

		app.workspace.revealLeaf(leaf);
	}
}
