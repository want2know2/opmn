
////
// IMPORT                   // FROM

import { toArray }          from "../../utils/valueUtils.js";
import { resolveLinkPath }  from "../pagesAndLinks/linkService.js";
import { getPageNormObject } from "../pagesAndLinks/pageNormService.js";


////
// NEU

////
// neue seite erstellen

// erstellt neue seite
// error, wenn schon vorhanden

export async function createPage(app, dv, path, content = "") {
    const existing = app.vault.getFileByPath(path);
    if (existing) throw new Error(`Page already exists: ${path}`);

    const tFile = await app.vault.create(path, content);
    return getPageNormObject(app, dv, tFile);
}

// prüft, ob seite vorhanden, wenn ja, gibt diese zurück
// wenn nein, erstellt neue seite

export async function getOrCreatePage(app, dv, path, content = "") {
    const existing = app.vault.getFileByPath(path);
    if (existing) return getPageNormObject(app, dv, existing);

    const tFile = await app.vault.create(path, content);
    return getPageNormObject(app, dv, tFile);
}

////
// updateFrontmatter und Helfer

export async function updateFrontmatter(app, normPage, updaterFns) {
    if (!normPage.exists) return;
    await app.fileManager.processFrontMatter(normPage.tFile, updaterFns);
}

// helfer:

/**
 * all modifications happen directly on the fm object. 
 * After the callback finishes, updateFrontmatter sees the 
 * already-modified object and writes it back to the file. 
 */

// set field

export function setField(fm, fieldPath, value) {

    const keys = fieldPath.split(".");
    const lastKey = keys.pop();

    const target = keys.reduce((o, k) => {
        if (!o[k]) o[k] = {};
        return o[k];
    }, fm);

    target[lastKey] = value;
}

// remove field

export function removeField(fm, fieldPath) {

    const keys = fieldPath.split(".");
    const lastKey = keys.pop();

    const target = keys.reduce((o, key) => {
        if (!o[key]) return null;
        return o[key];
    }, fm);

    if (target) {
        delete target[lastKey];
    }
}

//////////////////////

/**
 * Schreibt beliebige Werte in ein Metadatenfeld einer Seite 
 * (auch verschachtelte Felder wie med.titel)
 */

export async function updateField(app, normPage, fieldPath, value) {
    if (!normPage.exists) return null;
    await app.fileManager.processFrontMatter(normPage.tFile, (frontmatter) => {

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

export async function addLinkToListField(app, normPage, fieldPath, linkPage) {

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
    app,
    normPage,
    fieldPath,
    linkPage
) {

    const tFile = normPage?.tFile;
    if (!tFile)
        return;

    const targetPath = resolveLinkPath(app, linkPage.wikiLink);

    await app.fileManager.processFrontMatter(tFile, (frontmatter) => {

        const keys = fieldPath.split(".");
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, frontmatter);

        let list = toArray(target[lastKey]);

        list = list.filter(link => resolveLinkPath(app, link) !== targetPath);

        target[lastKey] = list;
    });
}


/**
 * 
 */

export async function deleteFieldByDVPage(app, dvPage, fieldPath) {
    const pagePath = dvPage?.file?.path;
    const tFile = app.vault.getFileByPath(pagePath);
    if (!tFile) return;

    await deleteField(app, tFile, fieldPath);
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


async function deleteField(app, tFile, fieldPath) {
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


export async function updateEntireFrontmatter(app, normPage, newFrontObj = {}) {
    if (!normPage.exists) return;
    await app.fileManager.processFrontMatter(normPage.tFile, (frontmatter) => {
        for (const key of Object.keys(frontmatter)) {
            if (key !== "id") delete frontmatter[key];
        }
        Object.assign(frontmatter, newFrontObj);
    });
}

