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
main.js                BUILD OUTPUT (gitignored; run `npm run build` to (re)generate)

src/                   plugin source (this is the new code)
  main.js                plugin entry point (onload / registers view, ribbon, command)
  view.js                the custom tab/view (ItemView)
  dvApi.js               helper to reach the Dataview API from a plugin

# --- ported feature code (bundled into main.js) ----------------------------
features/metadataEditor/  the metadata editor feature (loaded by the plugin)
shared/services/          query / metadata / page-normalization services
shared/utils/             shared utilities

# --- legacy reference code (not yet loaded) --------------------------------
core/startup.js           old `invoke` startup script
features/bulkMetaEditor/  not yet ported
```

`features/metadataEditor/` and `shared/` are imported by `src/` and bundled into
`main.js`. `core/` and `features/bulkMetaEditor/` are old CodeScript Toolkit code
kept for reference and are not loaded yet.

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

Build first (`npm run build`) so `main.js` exists, then copy `manifest.json` and
`main.js` into:

```
<your-vault>/.obsidian/plugins/opmn/
```

Then enable **OPMN** in Obsidian: Settings -> Community plugins. The plugin adds
a ribbon icon ("Open OPMN") and a command ("OPMN: Open view"). Requires the
Dataview plugin to be installed and enabled.
