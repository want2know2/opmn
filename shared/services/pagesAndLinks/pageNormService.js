
////
// IMPORT

import { getPageDisplayName } from "./pageDisplayNameService.js";


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
 *
 */

export function resolvePageReference(dv, p) {

    let inputPath = null;

    if (p?.file?.path) { // DV page
        inputPath = p.file.path;
    }
    else if (p?.path && p?.type === "file") { // DV link
        inputPath = p.path;
    }
    else if (typeof p === "string" && p.endsWith(".md")) { // path string
        inputPath = p;
    } else if (typeof p === "string") { // page name string 
        inputPath = `${p}.md`;
    }

    return {
        get tFile() {
            return inputPath
                ? app.vault.getFileByPath(inputPath)
                : null;
        },
        get exists() {
            return !!this.tFile;
        },
        get path() {
            return this.tFile?.path ?? null;
        },
        get name() {
            return this.tFile?.basename ?? null;
        },
        get dvPage() {
            return this.path
                ? dv.page(this.path)
                : null;
        }
    };
}


/**
 * Wird gebraucht, um Links in diesem Format in die Metadaten zu
 * schreiben.
 */

export function toWikiLink(pageRef) {
    if (!pageRef?.path) return null;

    return `[[${pageRef.path.replace(/\.md$/, "")}]]`;
}


/**
 *
 */

export function toWikiLinkWithAlias(pageRef, alias) {
    if (!pageRef?.path)
        return null;

    if (!alias || typeof alias !== "string")
        return toWikiLink(pageRef);

    return `[[${pageRef.path.replace(/\.md$/, "")}|${alias}]]`;
}

