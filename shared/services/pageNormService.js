
////
// IMPORT

import { getPageDisplayName } from "./pageDisplayNameService.js";
import { toWikiLink, toWikiLinkWithAlias } from "./pageLinkService.js";
import { resolvePageReference } from "./pageReferenceService.js";

/**
 * 
 */

export function getPageNormObject(dv, p) {

    const ref = resolvePageReference(dv, p);

    return {
        ref,

        get exists() {
            return this.ref.exists;
        },
        get path() {
            return this.ref.path;
        },
        get name() {
            return this.ref.name;
        },
        get displayName() {
            return this.exists
                ? getPageDisplayName(dv, this.ref).displayName
                : null;
        },
        get wikiLink() {
            return this.exists
                ? toWikiLink(this.ref)
                : null;
        },
        get displayLink() {
            return this.exists
                ? toWikiLinkWithAlias(this.ref, this.displayName)
                : null;
        },

        linkFrom(sourcePath, alias) {

            if (!this.exists)
                return null;

            if (!sourcePath)
                return alias
                    ? this.displayLink
                    : this.wikiLink;

            return app.fileManager.generateMarkdownLink(
                this.tFile,
                sourcePath,
                "",
                alias
            );
        },

        get dvPage() {
            return this.ref.dvPage;
        },
        get tFile() {
            return this.ref.tFile;
        }
    };
}


/**
 * Norm object for the note currently open in Obsidian, or null if none is open.
 */

export function getActivePageNormObject(dv) {
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) return null;

    return getPageNormObject(dv, activeFile.path);
}

