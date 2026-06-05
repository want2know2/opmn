
////
// IMPORT						// FROM

import { ItemView } 			from "obsidian";
import { dvQueryInh } 			from "../shared/services/entityService.js";
import { getPageNormObject } 	from "../shared/services/pageNormService.js";
import { createPageLink } 		from "../shared/services/pageLinkService.js";
import { bulkEditorTest } 		from "../features/bulkEditorTest/bulkEditorTest.js";

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

		bulkEditorTest(this);
	}
}

