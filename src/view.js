"use strict";

const { ItemView } = require("obsidian");
const { getDataviewApi } = require("./dvApi.js");

const VIEW_TYPE_OPMN = "opmn-view";

// A custom tab/view. `this.contentEl` is the full content area of the tab and
// is the plugin equivalent of the container you used to get back from
// `dv.el(...)`. You build into it with the same `createEl(...)` API you already
// use throughout the existing feature code.
class OpmnView extends ItemView {
  getViewType() {
    return VIEW_TYPE_OPMN;
  }

  getDisplayText() {
    return "OPMN";
  }

  getIcon() {
    return "layout-dashboard";
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.contentEl.empty();
  }

  render() {
    const root = this.contentEl;
    root.empty();

    root.createEl("h2", { text: "OPMN" });

    // --- Dataview connectivity check ----------------------------------------
    const dv = getDataviewApi(this.app);

    if (!dv) {
      const err = root.createEl("p", {
        text:
          "Dataview API not found. Make sure the Dataview plugin is installed " +
          "and enabled, then reopen this view.",
      });
      err.style.color = "var(--text-error)";
      return;
    }

    const pageCount = dv.pages().length;
    root.createEl("p", {
      text: `Dataview connected \u2014 ${pageCount} pages indexed.`,
    });

    // --- Feature mount point -------------------------------------------------
    // This is where features (metadataEditor, bulkMetaEditor, ...) will be
    // mounted next. They will receive `slot` (a real DOM element) as their
    // container and `dv` (the Dataview API) for queries -- the same two things
    // they got via `dv.el(...)` and the `dv` argument before.
    const slot = root.createEl("div", { cls: "opmn-feature-slot" });
    slot.createEl("p", {
      text:
        "Feature mount point. The metadata editor currently opens from the " +
        "\u201COPMN: Metadata editor\u201D ribbon icon (and command).",
    });
  }
}

module.exports = { OpmnView, VIEW_TYPE_OPMN };
