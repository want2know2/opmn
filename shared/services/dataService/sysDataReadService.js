

export async function readJson(app, path) {

    const file = app.vault.getFileByPath(path);
    if (!file) return null;

    const content = await app.vault.read(file);

    return JSON.parse(content);
}