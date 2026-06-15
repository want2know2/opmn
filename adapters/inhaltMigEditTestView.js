
////
// IMPORT						// FROM

import { ItemView } 			from "obsidian";
import { alleInhalteMigFt } from "../features/bulkEditorTest/alleInhalteMigFt.js";


////
// ANGABEN ZUR VIEW-KLASSE

export const TYPE_INHALT_MIG = {
    id: "opmn-inhalt-mig",
    text: "Inhalt-Migrations-Editor",
    icon: "file-diff"
}


/**
 * Inhalts-Migrations-Feature
 */

export class InhaltMigView extends ItemView {

    constructor(leaf, dv) {
        super(leaf);
        this.dv = dv;
    }

    getViewType() {
        return TYPE_INHALT_MIG.id;
    }

    getDisplayText() {
        return TYPE_INHALT_MIG.text;
    }

    getIcon() {
        return TYPE_INHALT_MIG.icon;
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
        alleInhalteMigFt(this);
    }
}

