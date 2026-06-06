
////
// IMPORT                       // FROM

import { ENTITY_TYPES }         from "../../shared/services/queries/entityService.js";


/**
 * Creates entity type buttons for the metadata editor.
 */

export function entityButtons(btnBox, btnCallbackFn) {

    ENTITY_TYPES.forEach(entType => {

        const btn = btnBox.createEl("button", {
            text: entType.label
        });

        btn.addEventListener("click", async () => {
            await btnCallbackFn(entType);
        });
    });
}

