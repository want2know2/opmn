
////
// IMPORT						    // FROM

import { ItemView } 			    from "obsidian";
import { seitenManager } from "../features/baustelleFt/seitenManager/seitenManager";
//import { migManagerTest5 }          from "../features/_migrations/v1ToV2/migFeatures/migManagerTest5.js";


////
// ANGABEN ZUR VIEW-KLASSE

export const TYPE_SEITEN_MANAGER = {
    id: "opmn-seiten-manager",
    text: "Seiten-Manager",
    icon: "file-diff"
}


/**
 * Inhalts-Migrations-Feature
 */

export class SeitenManagerView extends ItemView {

    constructor(leaf, dv) {
        super(leaf);
        this.dv = dv;
    }

    getViewType() {
        return TYPE_SEITEN_MANAGER.id;
    }

    getDisplayText() {
        return TYPE_SEITEN_MANAGER.text;
    }

    getIcon() {
        return TYPE_SEITEN_MANAGER.icon;
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
        
        // migManagerTest5(this);
        seitenManager(this);
    }
}

