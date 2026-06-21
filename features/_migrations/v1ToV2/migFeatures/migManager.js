//// Erst mal nur behindert paar Sachen rausfinden / ausprobieren

import { dvLinkSuche } from "../../../../shared/services/queries/queryService";
import { dvDefsLinkSuche, dvInstsLinkSuche } from "../migServices/v1QueryService";


/**
 * 
 */

export function migManager(obsClsObj) {

    const { app, dv, contentEl } = obsClsObj;

    // const defs = dvDefsLinkSuche(dv, "Inhalt.md");
    
    // const insts = dvLinkSuche(dv, defs, ["ist"], 0, false);
    const insts = dvInstsLinkSuche(dv, "Inhalt.md")

    //insts.forEach(defPath => contentEl.createEl("div", {text: defPath}))

    
}

