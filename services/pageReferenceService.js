
/**
 * 
 */

export function resolvePageReference(dv, p) {

    let path = null;

    if (p?.file?.path) {                        // DV page
        path = p.file.path;
    }

    else if (p?.path && p?.type === "file") {   // DV link
        path = p.path;
    }

    else if (typeof p === "string") {       // path string
        path = p;
    }

    const exists = !!(
        path &&
        dv.page(path)?.file?.path
    );

    return {
        exists,

        path: exists
            ? dv.page(path).file.path
            : null,

        name: exists
        ? dv.page(path).file.name
        : null,

        get dvPage() {
        return this.path
            ? dv.page(this.path)
            : null;
        },
        get tFile() {
            return this.path
                ? app.vault.getFileByPath(this.path)
                : null;
        }
    };
}

