
////
// IMPORT						    // FROM

import { ItemView } 			    from "obsidian";
import { fafo } from "../features/fafoView/fafoAnzeige";


////
// ANGABEN ZUR VIEW-KLASSE

export const TYPE_FAFO_VIEW = {
    id: "opmn-fafo-view",
    text: "FAFO-View",
    icon: "test-tube-diagonal"
}


/**
 * Rumspielen und Sachen herausfinden
 */

export class FafoView extends ItemView {

    constructor(leaf, dv, eventManager) {
        super(leaf);
        this.dv = dv;
        this.eventManager = eventManager;
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
        
        this.eventManager.registerFeature(TYPE_FAFO_VIEW.id, {

            filter: (eventProperties) => {

                switch (eventProperties.eventType) {
                    case "vault.create":
                    case "vault.rename":
                    case "vault.delete":
                    //case "vault.modify":
                    //case "metadataCache.changed":
                    //case "metadataCache.resolve":
                        return true;
                
                    default:
                        return false;
                }
            },

            onUpdate: (eventProperties) => {

                this.render(eventProperties);
            }
        });
        
        this.render();
    }

    async onClose() {
        this.eventManager.unregisterFeature(TYPE_FAFO_VIEW.id);
        this.contentEl.empty();
    }

    render(eventProperties = {}) {

        if (!this.dv) return;
        
        this.contentEl.empty();
        fafo(this, eventProperties);
    }
}

