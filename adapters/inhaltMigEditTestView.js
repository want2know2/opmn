
////
// IMPORT						    // FROM

import { ItemView } 			    from "obsidian";
import { alleInhalteMigFt }         from "../features/baustelleFt/alleInhalteMigFt.js";
import { alleInhMigFtNeu }          from "../features/baustelleFt/alleInhMigFtNeu.js";
import { alleMigTestFt }            from "../features/baustelleFt/allMigTestFt.js";
import { alleMigKatTestFt }         from "../features/baustelleFt/alleMigKatTestFt.js";
import { distinctIstValues,
         iwasServiceTestDingens }   from "../features/baustelleFt/dingensTest.js";
import { migManager }               from "../features/_migrations/v1ToV2/migFeatures/migManager.js";
import { migManagerTest2 }          from "../features/_migrations/v1ToV2/migFeatures/migManagerTest2.js";
import { migManagerTest4 } from "../features/_migrations/v1ToV2/migFeatures/migManagerTest4.js";


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
        //alleInhalteMigFt(this);
        //alleInhMigFtNeu(this);
        //alleMigTestFt(this);
        //alleMigKatTestFt(this);
        //iwasServiceTestDingens(this);
        //distinctIstValues(this);
        //migManager(this);
        //migManagerTest2(this);
        //migManagerTest3(this);
        migManagerTest4(this);
    }
}

