
////
// IMPORT

import { ENTITY_TYPES } from "../../shared/services/entityService.js";


/**
 * 
 */

export function entityButtons(btnBox, btnCallbackFn) {

    ENTITY_TYPES.forEach(entType => {

        const btn = btnBox.createEl("button", {
            text: entType.label
        });

        btn.addEventListener("click", () => {
            btnCallbackFn(entType);
        });
    });
}

