
////
// IMPORT						// FROM

import { ItemView } 			from "obsidian";
import { dvQueryInh } 			from "../shared/services/queries/entityService.js";
import { getPageNormObject } 	from "../shared/services/pagesAndLinks/pageNormService.js";
import { placeHoverLinkOnEl } 	from "../shared/services/uiServices/uiLinkService.js";
import { inhaltMigrationFt } 	from "../features/bulkEditorTest/inhaltMigrationFt.js";

export const TYPE_BULK_EDITOR = "opmn-newview";


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

		inhaltMigrationFt(this);
	}
}

