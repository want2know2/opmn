"use strict";

const { Plugin } = require("obsidian");
const { OpmnView, VIEW_TYPE_OPMN } = require("./view.js");

// Plugin entry point. This is the native-plugin equivalent of the
// CodeScript Toolkit `startup.js` `invoke(app)` function: it runs once when
// Obsidian loads the plugin and is where we register everything.
module.exports = class OpmnPlugin extends Plugin {
  async onload() {
    // 1. Register our custom view type.
    this.registerView(VIEW_TYPE_OPMN, (leaf) => new OpmnView(leaf));

    // 2. Ribbon icon to open the view (left toolbar).
    this.addRibbonIcon("layout-dashboard", "Open OPMN", () => {
      this.activateView();
    });

    // 3. Command palette entry (Ctrl/Cmd-P -> "OPMN: Open view").
    this.addCommand({
      id: "open-opmn-view",
      name: "Open view",
      callback: () => this.activateView(),
    });
  }

  onunload() {}

  // Open the OPMN view in a new tab, reusing an existing one if it is already
  // open.
  async activateView() {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_OPMN)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true); // true = open in a new tab
      await leaf.setViewState({ type: VIEW_TYPE_OPMN, active: true });
    }

    workspace.revealLeaf(leaf);
  }
};
