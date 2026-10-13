
# **Links**

#### Link → file

```ts
// test === "[[Test Page]]"
const linktext = test.slice(2, -2); 
const { path, subpath } = parseLinktext(linktext); // handles "Page#Heading|alias" etc.
const target = this.app.metadataCache.getFirstLinkpathDest(path, file.path);
```

- `parseLinktext(linktext)` takes the link *without* the brackets and returns `{ path, subpath }`, where the subpath can be a heading or block ID. [5](#1-4) 
- `getLinkpath(linktext)` is a lighter variant that just returns the linked file's name/path, ignoring subpaths. [6](#1-5) 
- `metadataCache.getFirstLinkpathDest(linkpath, sourcePath)` resolves a linkpath to a `TFile` using Obsidian's link-resolution rules (shortest unique match, relative to `sourcePath`) — this is why stripping brackets naively and doing `getFileByPath` can fail: `"Test Page"` is a linktext, not a vault path. [7](#1-6) 

#### File → link

- `this.app.fileManager.generateMarkdownLink(file, sourcePath, subpath?, alias?)` produces a proper `[[...]]` or `[...](...)` link honoring the user's link-format preferences and computing relative paths. [8](#1-7) 
- `this.app.metadataCache.fileToLinktext(file, sourcePath, omitMdExtension?)` gives just the inner linktext — shortest unique filename, or full path if the name isn't unique. [9](#1-8) 

#### Related helpers

- `Workspace.openLinkText(linktext, sourcePath, newLeaf?)` opens a link directly if all you want is navigation. [10](#1-9) 
- `LinkValue.parseFromString(app, input, sourcePath)` parses wikilink syntax into a `LinkValue` — but it's part of the Bases `Value` system (API 1.10.0), so it's mainly relevant if you're working with Bases views. [11](#1-10) [12](#1-11) 

#### Notes

- Note the terminology distinction in the API: **linktext** = the full inner text (`Test Page|alias`), **linkpath** = the resolvable path part (`Test Page`). [13](#1-12) 
- For plain `[[Note]]` frontmatter values your `slice(2, -2)` + `getFirstLinkpathDest` approach is the standard pattern; there's no single "parse wikilink including brackets" helper in the documented API.
- The Bases guide shows `openLinkText` and the `hover-link` event used together when rendering links in custom views. [14](#1-13) 

---

# **Bilder**

```js
const imageTestFile = this.app.vault.getFileByPath("mmLogo.png");  
if (imageTestFile) {  
    const resourcePath = this.app.vault.getResourcePath(imageTestFile);  
    ui.gesUebersichtBox.createEl("img", { attr: { src: resourcePath, width: "600" } });  
}
```

---

# **Dateien per Drag & Drop in einen View ziehen**

Yes, this is achievable, but it requires combining plain HTML5 drag-and-drop event handling with Obsidian's vault/file APIs — there's no single built-in "accept dropped file" method for custom views.

How it would work conceptually:

1. Listen for drop events on your view's container, using Component.registerDomEvent(el, type, callback) so the listener is automatically cleaned up when the view unloads. registerDomEvent_2.md:10-20 You'd register both dragover (to call preventDefault() so the browser allows dropping) and drop on this.contentEl.

2. Extract the file(s) from the native DragEvent's dataTransfer.files (a standard FileList of File objects) — this part is plain browser JavaScript, not an Obsidian API.

3. Write the dropped file into the vault. Read the File as an ArrayBuffer, then create it in the vault using Vault.createBinary(path, data, options): "Create a new binary file inside the vault." createBinary.md:10-18

4. Pick a sensible destination path, respecting the user's attachment settings, with FileManager.getAvailablePathForAttachment(filename, sourcePath): "Resolves a unique path for the attachment file being saved. Ensures that the parent directory exists and dedupes the filename if the destination filename already exists." getAvailablePathForAttachment.md:10-25

5. Insert a link/embed into whatever content your view manages (if applicable) — e.g. using FileManager.generateMarkdownLink(file, sourcePath, subpath, alias), listed among FileManager's methods for "Manage the creation, deletion and renaming of files from the UI." FileManager.md:12-31


Note on the built-in editor behavior: the "drop a file into a tab/note" behavior you're describing is driven by the core Markdown editor's own drop handling, exposed via Workspace.on('editor-drop', callback): "Triggered when the editor receives a drop event. Check for evt.defaultPrevented... Use evt.preventDefault() to indicate that you've handled the event." on('editor-drop').md:12-20 This event is specific to MarkdownView/MarkdownFileInfo editors, not custom ItemViews — so it's not directly usable for a generic custom view, but it confirms the pattern: Obsidian core itself does plain DragEvent handling + vault file creation under the hood, exactly what you'd replicate manually.

So, a rough skeleton for a custom view:

```js
async onOpen() {  
  const container = this.contentEl;  
  container.empty();  
  
  this.registerDomEvent(container, 'dragover', (evt: DragEvent) => {  
    evt.preventDefault();  
  });  
  
  this.registerDomEvent(container, 'drop', async (evt: DragEvent) => {  
    evt.preventDefault();  
    const files = evt.dataTransfer?.files;  
    if (!files || files.length === 0) return;  
  
    for (const file of Array.from(files)) {  
      const arrayBuffer = await file.arrayBuffer();  
      const path = await this.app.fileManager.getAvailablePathForAttachment(file.name);  
      const tFile = await this.app.vault.createBinary(path, arrayBuffer);  
      // e.g. display it, or insert a link somewhere  
    }  
  });  
}
```