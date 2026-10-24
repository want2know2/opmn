
////
// IMPORT						    // FROM

import { ItemView } 			    from "obsidian";
import { anzeigeTest, fafoAnzeige } from "../features/fafoView/fafoAnzeige";


////
// ANGABEN ZUR VIEW-KLASSE

export const TYPE_FAFO_VIEW = {
    id: "opmn-fafo-view",
    text: "FAFO-View",
    icon: "baby"
}


/**
 * Rumspielen und Sachen herausfinden
 */

export class FafoView extends ItemView {

    constructor(leaf, dv) {
        super(leaf);
        this.dv = dv;
        this.
    }

    getViewType() {
        return TYPE_FAFO_VIEW.id;
    }

    getDisplayText() {
        return TYPE_FAFO_VIEW.text;
    }

    getIcon() {
        return TYPE_FAFO_VIEW.icon;
    }

    async onOpen() {
        this.registerEvent(

            this.app.vault.on("modify", () => {

                anzeigeTest(this.contentEl);
            })
        )
        
        this.render();
    }

    async onClose() {
        this.contentEl.empty();
    }

    render() {

        if (!this.dv) return;
        
        this.contentEl.empty();
        fafoAnzeige(this);
        // seitenManager(this);
    }
}

