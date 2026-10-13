
/**
 * Queries all Markdown files in the vault.
 *
 * Returns the raw page references obtained from the Obsidian API.
 * Does not normalize, examine or render pages.
 */
export function sManQueryService(app) {

    return app.vault.getMarkdownFiles();
    
}

