
/**
 * 
 */

export function resolvePageReference(dv, p) {

    let inputPath = null;

    if (p?.file?.path) {                      // DV page
        inputPath = p.file.path;
    }
    else if (p?.path && p?.type === "file") { // DV link
        inputPath = p.path;
    }
    else if (typeof p === "string" && p.endsWith(".md")) {         // path string
        inputPath = p;
    } else if (typeof p === "string") {                 // page name string 
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

