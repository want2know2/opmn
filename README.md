# opmn

An Obsidian plugin (work in progress). This is the migration of a metadata /
query "options hub" that previously ran via the **Dataview** + **CodeScript
Toolkit** plugins into a **native Obsidian plugin**.

The plugin keeps using Dataview as its data source for now (queries via the
Dataview API), but the UI and lifecycle are owned by the plugin itself.

## Repository layout

```
manifest.json          Obsidian plugin manifest
versions.json          plugin-version -> minimum Obsidian version
package.json           npm metadata + build scripts
esbuild.config.mjs     bundler config (src/main.js -> main.js)
main.js                BUILD OUTPUT (committed so the plugin can be installed
                       without building it yourself)

src/                   plugin source (this is the new code)
  main.js                plugin entry point (onload / registers view, ribbon, command)
  view.js                the custom tab/view (ItemView)
  dvApi.js               helper to reach the Dataview API from a plugin

# --- legacy reference code (the old CodeScript Toolkit setup) ---------------
core/startup.js        old `invoke` startup script
features/              old feature scripts (metadataEditor, bulkMetaEditor)
shared/services/       old query / metadata / page-normalization services
shared/utils/          old shared utilities
```

The `core/`, `features/` and `shared/` folders are the **old** CodeScript
Toolkit codebase, kept for reference while the feature logic is ported into the
plugin. They are not loaded by the plugin yet.

## Build

Requires Node.js.

```bash
npm install      # once
npm run build    # produce main.js
npm run dev      # watch mode: rebuild on every save
```

The build bundles everything under `src/` into a single `main.js` at the repo
root (Obsidian plugins must ship a single `main.js`).

## Install into a vault

Copy `manifest.json` and `main.js` into:

```
<your-vault>/.obsidian/plugins/opmn/
```

Then enable **OPMN** in Obsidian: Settings -> Community plugins. The plugin adds
a ribbon icon ("Open OPMN") and a command ("OPMN: Open view"). Requires the
Dataview plugin to be installed and enabled.
