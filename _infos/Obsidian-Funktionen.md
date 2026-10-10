
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

