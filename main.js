"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/dvApi.js
var require_dvApi = __commonJS({
  "src/dvApi.js"(exports2, module2) {
    "use strict";
    function getDataviewApi(app) {
      var _a, _b, _c, _d;
      return (_d = (_c = (_b = (_a = app == null ? void 0 : app.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b.dataview) == null ? void 0 : _c.api) != null ? _d : null;
    }
    module2.exports = { getDataviewApi };
  }
});

// src/view.js
var require_view = __commonJS({
  "src/view.js"(exports2, module2) {
    "use strict";
    var { ItemView } = require("obsidian");
    var { getDataviewApi } = require_dvApi();
    var VIEW_TYPE_OPMN2 = "opmn-view";
    var OpmnView2 = class extends ItemView {
      getViewType() {
        return VIEW_TYPE_OPMN2;
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
        const dv = getDataviewApi(this.app);
        if (!dv) {
          const err = root.createEl("p", {
            text: "Dataview API not found. Make sure the Dataview plugin is installed and enabled, then reopen this view."
          });
          err.style.color = "var(--text-error)";
          return;
        }
        const pageCount = dv.pages().length;
        root.createEl("p", {
          text: `Dataview connected \u2014 ${pageCount} pages indexed.`
        });
        const slot = root.createEl("div", { cls: "opmn-feature-slot" });
        slot.createEl("p", {
          text: "Feature mount point. metadataEditor / bulkMetaEditor will be wired in here next."
        });
      }
    };
    module2.exports = { OpmnView: OpmnView2, VIEW_TYPE_OPMN: VIEW_TYPE_OPMN2 };
  }
});

// src/main.js
var { Plugin } = require("obsidian");
var { OpmnView, VIEW_TYPE_OPMN } = require_view();
module.exports = class OpmnPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_OPMN, (leaf) => new OpmnView(leaf));
    this.addRibbonIcon("layout-dashboard", "Open OPMN", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-opmn-view",
      name: "Open view",
      callback: () => this.activateView()
    });
  }
  onunload() {
  }
  // Open the OPMN view in a new tab, reusing an existing one if it is already
  // open.
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_OPMN)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_OPMN, active: true });
    }
    workspace.revealLeaf(leaf);
  }
};
