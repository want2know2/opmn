
////
// IMPORT                   // FROM 

import { Modal }            from "obsidian";
import { metadataEditor }   from "../features/metadataEditor/metadataEditor.js";

// A modal dialog that hosts the `metadataEditor` feature. `this.contentEl` is
// the modal body and is handed to the feature as its mount element, together
// with the Dataview API (used for the queries the feature runs).

export class MetadataEditorModal extends Modal {

  // `app` is required by the base Modal class (we pass it to super); `dv` is
  // the Dataview API injected by the composition root (bootstrap/entry.js).

  constructor(app, dv) {
    super(app);
    this.dv = dv;
  }

  onOpen() {
    this.modalEl.addClass("opmn-metadata-modal");
    this.titleEl.setText("Metadata editor");
    
    const { contentEl } = this;
    contentEl.empty();

    const dv = this.dv;
    if (!dv) {
      contentEl.createEl("p", {
        text:
          "Dataview API not found. Make sure the Dataview plugin is installed " +
          "and enabled.",
      });
      return;
    }


    // Render the feature. Wrapped so a runtime error shows inside the modal
    // instead of failing silently.

    try {
      metadataEditor(this.app, dv, contentEl);
    } 
    
    catch (e) {
      console.error("[OPMN] metadataEditor failed:", e);
      const err = contentEl.createEl("pre", {
        text: "metadataEditor error:\n" + (e && e.stack ? e.stack : String(e)),
      });
      err.style.color = "var(--text-error)";
      err.style.whiteSpace = "pre-wrap";
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
