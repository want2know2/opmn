# Event Handling

## Layer 1: The Vault (Low-Level File Storage)

These events deal directly with the files and folders sitting on your computer's hard drive. They only look at raw file bytes, names, and paths.

### 1. `vault.create`

- **Description:** Fires immediately after a completely new file or a folder is created anywhere inside your vault. It passes **1 parameter**: the `TFile` or `TFolder` object that was just created.

```js
this.app.vault.on("create", (fileOrFolder) => {
	this.handleNewFile(fileOrFolder);
});
```

### 2. `vault.rename`

- **Description:** Fires when a file or folder is renamed, or moved to a completely different folder. It passes **2 parameters**: the `TAbstractFile` object showing its new state, and a string containing its exact _old_ path.

```js
this.app.vault.on("rename", (fileOrFolder, oldPath) => {
	this.handleRenamedFile(fileOrFolder, oldPath);
});
```

### 3. `vault.modify`

- **Description:** Fires every time the raw content of an existing file changes on disk (e.g., when a user types, a template writes data, or an external script edits the file). It passes **1 parameter**: the `TFile` object of the modified file.

```js
this.app.vault.on("modify", (file) => {
	this.handleModifiedFile(file);
});
```

### 4. `vault.delete`

- **Description:** Fires immediately after a file or folder is deleted or moved into the system trash. It passes **1 parameter**: the `TFile` or `TFolder` object that was removed. _(Note: Because the file is already gone, you cannot read its contents when this fires)._

```js
this.app.vault.on("delete", (fileOrFolder) => {
	this.handleDeletedFile(fileOrFolder);
});
```

---

## Layer 2: The Metadata Cache (High-Level Index)

These events are managed by Obsidian's background scanner. They trigger after Obsidian parses a file to read headers, tags, frontmatter, and internal links.

### 5. `metadataCache.changed`

- **Description:** Fires when Obsidian finishes parsing a file's structures. It runs slightly after `vault.modify`. It passes **3 parameters**: the `TFile` itself, a string of the raw file text, and a highly detailed `CachedMetadata` object containing arrays of links, tags, and properties.

```js
this.app.metadataCache.on("changed", (file, data, cache) => {
	this.handleCacheUpdate(file, cache);
});
```

### 6. `metadataCache.deleted`

- **Description:** Fires when a file is deleted and Obsidian is actively wiping its property/tag data out of the central index. It passes **2 parameters**: the `TFile` object being removed, and its last known `CachedMetadata` state before deletion.

```js
this.app.metadataCache.on("deleted", (file, oldCache) => {
	this.handleCacheRemoval(file);
});
```

### 7. `metadataCache.resolve`

- **Description:** Fires when Obsidian recalculates the specific links belonging to a _single_ individual file (connecting the text `[[Note]]` to its actual target path). It passes **1 parameter**: the `TFile` that had its links updated.

```js
this.app.metadataCache.on("resolve", (file) => {
	this.handleSingleLinkResolution(file);
});
```

### 8. `metadataCache.resolved`

- **Description:** A global event that fires once when Obsidian finishes indexing **all links across the entire vault** (usually right at startup, or after a major multi-file refactor). It passes **0 parameters**.

```js
this.app.metadataCache.on("resolved", () => {
	this.handleAllLinksReady();
});
```


---

## Layer 3: Workspace & Editor (UI & Interaction Layer)

These events track what the user is actively looking at, clicking on, or interacting with on their screen layout.

### 9. `workspace.active-leaf-change`

- **Description:** Fires when focus moves to a different tab, a split pane, or a sidebar view. It passes **1 parameter**: the workspace `WorkspaceLeaf` element that just gained focus (or `null` if all tabs are closed).

```js
this.app.workspace.on("active-leaf-change", (leaf) => {
	this.handleTabFocusChange(leaf);
});
```

### 10. `workspace.file-open`

- **Description:** Fires specifically when a markdown note is successfully loaded into an active workspace view tab. It passes **1 parameter**: the `TFile` object that was opened (or `null` if an empty tab was opened).

```js
this.app.workspace.on("file-open", (file) => {
	this.handleOpenedFile(file);
});
```

### 11. `workspace.layout-change`

- **Description:** Fires when the UI changes shape (e.g., splitting a pane, closing a tab group, adjusting sidebar widths, or collapsing panels). It passes **0 parameters**.

```js
this.app.workspace.on("layout-change", () => {
	this.handleUiLayoutRearranged();
});
```

### 12. `workspace.editor-change`

- **Description:** Fires on every keystroke in a live editor pane. Unlike `vault.modify`, this gives direct context into what is happening on screen right now. It passes **2 parameters**: the CodeMirror `Editor` object, and a `MarkdownView` info object containing the file structure context.

```js
this.app.workspace.on("editor-change", (editor, viewInfo) => {
	this.handleLiveKeystroke(editor);
});
```

