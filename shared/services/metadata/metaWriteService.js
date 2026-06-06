

/**
 * Schreibt beliebige Werte in ein Metadatenfeld einer Seite (TFile)
 * (auch verschachtelte Felder wie med.titel)
 */

import { toArray } from "../../utils/valueUtils";
import { resolveLinkPath } from "../pagesAndLinks/linkNormService";

export async function updateField(tFile, fieldPath, value) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) { obj[key] = {}; }
            return obj[key];
        }, frontmatter);

        target[lastKey] = value;
    });
}


/**
 * Adds a single link to a list field (if not already present).
 */

export async function addLinkToListField(normPage, fieldPath, linkPage) {

    const tFile = normPage?.tFile;
    if (!tFile || !fieldPath || !linkPage?.wikiLink)
        return;

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, frontmatter);

        const list = toArray(target[lastKey]);

        if (!list.includes(linkPage.wikiLink))
            list.push(linkPage.wikiLink);

        target[lastKey] = list;
    });
}


/**
 * Removes a single link from a list field.
 */

export async function removeLinkFromListField(
    normPage,
    fieldPath,
    linkPage
) {

    const tFile = normPage?.tFile;
    if (!tFile)
        return;

    const targetPath = resolveLinkPath(linkPage.wikiLink);

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, frontmatter);

        let list = toArray(target[lastKey]);

        list = list.filter(link => resolveLinkPath(link) !== targetPath);

        target[lastKey] = list;
    });
}


/**
 * 
 */

export async function deleteFieldByDVPage(dvPage, fieldPath) {
    const pagePath = dvPage?.file?.path;
    const tFile = app.vault.getFileByPath(pagePath);
    if (!tFile) return;

    await deleteField(tFile, fieldPath);
}


/**
 * Löscht beliebiges Feld einer Seite.
 * WARNING
 * hidden bug in your deleteField()
 * This is dangerous:
 * if (!obj[key]) { obj[key] = {}; }
 * because deletion should never create missing structures.
 *
 * Besser:
 
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) return null;
            return obj[key];
        }, frontmatter);

        if (!target) return;

        delete target[lastKey];

 *
 */


async function deleteField(tFile, fieldPath) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {
        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) { obj[key] = {}; }
            return obj[key];
        }, frontmatter);

        delete target[lastKey];
    });
}


/**
 * Löscht vorhandene Frontmatter-Metadaten vollständig und ersetzt sie
 * durch gegebene neue (Metadaten-Objekt).
 */


export async function updateEntireFrontmatter(tFile, newFrontObj = {}) {
    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {
        for (const key of Object.keys(frontmatter)) {
            if (key !== "id") delete frontmatter[key];
        }
        Object.assign(frontmatter, newFrontObj);
    });
}

