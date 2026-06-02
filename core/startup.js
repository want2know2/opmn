
////
// IMPORT

import { metadataEditor } from "../features/metadataEditor/metadataEditor.js";
// import { bulkMetaEditor } from "../features/bulkMetaEditor/bulkMetaEditor.js";
import { treeFeature } from "../features/testFeatures/treeFeature.js";
// import { dvAPItestFeature } from "../features/testFeatures/dvAPItestFeature.js";

/**
 * `invoke` von CodeScript Toolkit vorgegeben um Sachen in Obsidian 
 * verfügbar zu machen.
 */

export async function invoke(app) {
    console.log("`appModules.features` werden geladen");
    window.appModules = {
        features: {
            metadataEditor: (dv) => metadataEditor(dv),
            // bulkMetaEditor: (dv) => bulkMetaEditor(dv),
            treeFeature: (dv) => treeFeature(dv),
            // dvAPItestFeature: () => dvAPItestFeature(),
            
        }
    };
    console.log("`appModules.features` wurden geladen");
}

