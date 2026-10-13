


export function getNormPage(app, path) {

    const tFile = app.vault.getFileByPath(path);

    const normObj = {
        tFile,
        exists: !!tFile,
        path: "",
        name: "",
        wikiLink: "",
        frontmatter: {},
        /*getFrontmatterValue: function(field) {
            return field
                .split(".")
                .reduce((value, key) => value?.[key], this.frontmatter ?? {});
        }*/
    };

    if (!normObj.exists)
        return normObj;

    normObj.path = normObj.tFile.path;
    normObj.name = normObj.tFile.basename;
    normObj.wikiLink = `[[${tFile.path.replace(/\.md$/, "")}]]`; // nicht .name, wegen möglichem pfad, i.e. wenn die seite in einem ordner ist
    normObj.frontmatter = app.metadataCache.getFileCache(tFile)?.frontmatter ?? {};

    return normObj;
}   

