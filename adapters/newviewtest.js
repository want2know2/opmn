import { ItemView } from "obsidian";
import { dvQueryInh } from "../shared/services/entityService";
import { getPageNormObject } from "../shared/services/pageNormService";
import { createPageLink } from "../shared/services/pageLinkService";


export const VIEW_TYPE_OPMNnew = "opmn-newview";


export class OpmnNewView extends ItemView {

	constructor(leaf, dv) {
		super(leaf);
		this.dv = dv;
	}

	getViewType() {
		return VIEW_TYPE_OPMNnew;
	}

	getDisplayText() {
		return "OPMNnew";
	}

	getIcon() {
		return "layout-dashboard";
	}

	async onOpen() {
		this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	render() {
		const dv = this.dv;
		if (!dv) return;
		const conEl = this.contentEl;
		conEl.empty();

		conEl.createEl("h2", { text: "Suchergebnisse" });
		// testfeatureInTestview(conEl, dv);

		const inhResults = dvQueryInh(dv)
        	.map(p => getPageNormObject(dv, p));	
    
		inhResults.forEach(p => {
			
			const linkBox = conEl.createEl("div", { cls: "" });

			createPageLink(linkBox, p, this, VIEW_TYPE_OPMNnew);

		});
	
		
	}
}
