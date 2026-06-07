
////
// IMPORT						// FROM

import { ItemView } 			from "obsidian";
import { inhaltMigrationFt } 	from "../features/bulkEditorTest/inhaltMigrationFt.js";
import { obsappTest } 			from "../features/baustelleFt/obsappTest.js";

////
// VIEW-TYPE

export const TYPE_BULK_EDITOR = "opmn-newview";


/**
 * Inhalts-Migrations-Feature
 */

export class BulkEditorTestView extends ItemView {

	constructor(leaf, dv) {
		super(leaf);
		this.dv = dv;
	}

	getViewType() {
		return TYPE_BULK_EDITOR;
	}

	getDisplayText() {
		return "OPMNnew";
	}

	getIcon() {
		return "app-window-mac";
	}

	async onOpen() {
		this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	render() {
		if (!this.dv) return;
		this.contentEl.empty();

		//inhaltMigrationFt(this);
		obsappTest(this);
		
	}
}

