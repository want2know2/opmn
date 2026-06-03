import { Plugin } from "obsidian";
import { OpmnView, VIEW_TYPE_OPMN } from "../adapters/view.js";
import { MetadataEditorModal } from "../adapters/metadataEditorModal.js";
import { getDataviewApi } from "../shared/services/queryService.js";

// Plugin entry point. This is the native-plugin equivalent of the
// CodeScript Toolkit `startup.js` `invoke(app)` function: it runs once when
// Obsidian loads the plugin and is where we register everything.
export default class OpmnPlugin extends Plugin {
  async onload() {
    // Composition root: acquire the Dataview API once here and inject it into
    // the adapters below, so it is obtained in a single place. The adapters
    // still guard against a null `dv` (Dataview not installed/enabled).
    const dv = getDataviewApi(this.app);

    // 1. Register our custom view type.
    this.registerView(VIEW_TYPE_OPMN, (leaf) => new OpmnView(leaf, dv));

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

    // 4. Second ribbon icon + command: open the Metadata editor modal.
    this.addRibbonIcon("table-properties", "OPMN: Open Metadata editor", () => {
      new MetadataEditorModal(this.app, dv).open();
    });

    this.addCommand({
      id: "open-opmn-metadata-editor",
      name: "Open metadata editor",
      callback: () => new MetadataEditorModal(this.app, dv).open(),
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
}
