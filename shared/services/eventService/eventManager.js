import { debounce, TFile, TFolder } from "obsidian";

export class EventManager {
    constructor(plugin) {
        // Store the plugin instance to access app, vault, and workspace safely
        this.plugin = plugin;
        this.app = plugin.app;
        
        // This is where our features sign up
        this.features = new Map();
        
        // Prepare the debounced processor
        this.quickDebouncedNotify = debounce((eventProperties) => {
            this.notifyFeatures(eventProperties);
        }, 20, true);

        this.debouncedNotify = debounce((eventProperties) => {
            this.notifyFeatures(eventProperties);
        }, 300, true);
    }

    processQueue(eventProperties) {

        const highFrequencyEvents = [
            "vault.modify", 
            
            "metadataCache.resolve",
            "metadataCache.resolved",
            
            "workspace.active-leaf-change",
            "workspace.file-open",
            "workspace.layout-change",
            "workspace.editor-change", 
        ];

        if (highFrequencyEvents.includes(eventProperties.eventType)) 
            this.debouncedNotify(eventProperties);
        else
            this.quickDebouncedNotify(eventProperties);
    }

    /**
     * Binds the event listeners to Obsidian once layout is ready.
     */
    initialize() {
        
        // Track the events so we can detach them later during destroy():
        // We aren't copying the function itself. Instead, `this.app.vault.on()` 
        // behaves like an order confirmation receipt.
        // When you call `this.app.vault.on()`, Obsidian's vault registers your 
        // listener in its internal system, and then it returns a small tracking 
        // reference pointer (an EventRef object).
        // We store that receipt inside `this.modifyEvent`. Later, when the plugin 
        // unloads, you hand that receipt back to Obsidian via 
        // `this.app.vault.offref(this.modifyEvent)`, which tells Obsidian: 
        // "Please cancel the subscription associated with this specific receipt."

        // 1. Vault (Low-Level File Storage)
        this.createEvent = this.app.vault.on("create", (fileOrFolder) => {
            const eventProperties = this.createEventProperties("vault.create", fileOrFolder);
            this.processQueue(eventProperties);
        });
        
        this.renameEvent = this.app.vault.on("rename", (fileOrFolder, oldPath) => {
            const eventProperties = this.createEventProperties("vault.rename", fileOrFolder, oldPath);
            this.processQueue(eventProperties);
        });
        
        this.modifyEvent = this.app.vault.on("modify", (file) => {
            const eventProperties = this.createEventProperties("vault.modify", file);
            this.processQueue(eventProperties);
        });
        
        this.deleteEvent = this.app.vault.on("delete", (fileOrFolder) => {
            const eventProperties = this.createEventProperties("vault.delete", fileOrFolder);
            this.processQueue(eventProperties);
        });
        /*
        
        // 2. Metadata Cache (High-Level Index)
        this.mdcChangedEvent = this.app.metadataCache.on("changed", (file, data, cache) => {
            const eventProperties = this.createEventProperties("metadataCache.changed", file, data, cache);
            this.processQueue(eventProperties);
        });
        
        this.mdcDeletedEvent = this.app.metadataCache.on("deleted", (file, oldCache) => {
            const eventProperties = this.createEventProperties("metadataCache.deleted", file, oldCache);
            this.processQueue(eventProperties);
        });
        
        this.mdcResolveEvent = this.app.metadataCache.on("resolve", (file) => {
            const eventProperties = this.createEventProperties("metadataCache.resolve", file);
            this.processQueue(eventProperties);
        });
        
        this.mdcResolvedEvent = this.app.metadataCache.on("resolved", () => {
            const eventProperties = this.createEventProperties("metadataCache.resolved");
            this.processQueue(eventProperties);
        });
        
        // 3. Workspace & Editor (UI & Interaction)
        this.wsActiveLeafChangeEvent = this.app.workspace.on("active-leaf-change", (leaf) => {
            const eventProperties = this.createEventProperties("workspace.active-leaf-change", leaf);
            this.processQueue(eventProperties);
        });

        this.wsFileOpenEvent = this.app.workspace.on("file-open", (file) => {
            const eventProperties = this.createEventProperties("workspace.file-open", file);
            this.processQueue(eventProperties);
        });

        this.wsLayoutChangeEvent = this.app.workspace.on("layout-change", () => {
            const eventProperties = this.createEventProperties("workspace.layout-change");
            this.processQueue(eventProperties);
        });

        this.wsEditorChangeEvent = this.app.workspace.on("editor-change", (editor, viewInfo) => {
            const eventProperties = this.createEventProperties("workspace.editor-change", editor, viewInfo);
            this.processQueue(eventProperties);
        });
        */
    }

    createEventProperties(eventType, ...givenEventProps) {
        
        const eventProperties = {
            eventType: eventType,
            file: null,
            folder: null,
            oldPath: null,
            cache: null,
            leaf: null,
            editor: null,
            viewInfo: null
        };

        // Helper: separate files and folders 
        const assignFileOrFolder = (fileOrFolder) => {
            if (!fileOrFolder) return;
            // .children = Ordner ist der schnellste und gängigste Weg, das zu überprüfen. 
            
            //if (fileOrFolder.children !== undefined) { 
            if (fileOrFolder instanceof TFolder) {
                eventProperties.folder = fileOrFolder;
            } else {
                eventProperties.file = fileOrFolder;
            }
        };

        switch (eventType) {
            case "vault.modify":
            case "metadataCache.resolve":
            case "workspace.file-open":
                eventProperties.file = givenEventProps[0]; // Always a TFile
                break;

            case "vault.create":
            case "vault.delete":
                assignFileOrFolder(givenEventProps[0]); // fileOrFolder
                break;

            case "vault.rename":
                assignFileOrFolder(givenEventProps[0]); // fileOrFolder
                eventProperties.oldPath = givenEventProps[1];     // String path
                break;

            case "metadataCache.deleted":
                eventProperties.file = givenEventProps[0];
                eventProperties.cache = givenEventProps[1]; // The oldCache before wipe
                break;

            case "metadataCache.changed":
                eventProperties.file = givenEventProps[0];
                // args[1] is raw text data, which we can skip or store if needed
                eventProperties.cache = givenEventProps[2]; // CachedMetadata
                break;

            case "workspace.active-leaf-change":
                eventProperties.leaf = givenEventProps[0];  // WorkspaceLeaf
                /*
                // Proactive extraction: get the file currently sitting inside the leaf
                if (givenEventProps[0]?.view?.file) {
                    eventProperties.file = givenEventProps[0].view.file;
                }*/
                break;

            case "workspace.editor-change":
                eventProperties.editor = givenEventProps[0];   // CodeMirror Editor instance
                eventProperties.viewInfo = givenEventProps[1]; // MarkdownView context info
                /*if (givenEventProps[1]?.file) {
                    eventProperties.file = givenEventProps[1].file;
                }*/
                break;

            case "metadataCache.resolved":
            case "workspace.layout-change":
                // Pure structural signals; all payload fields remain null
                break;
        }

        return eventProperties;
    }

    /**
     * This registers your specific view modules (like FafoView or SeitenManagerView)
     */
    registerFeature(id, featureConfig) {
        // config should be an object containing: { filter: (file, type) => boolean, onUpdate: (file, type) => void }
        this.features.set(id, featureConfig);
    }

    /**
     * Unsubscribes a view when it closes to prevent memory leaks
     */
    unregisterFeature(id) {
        this.features.delete(id);
    }

    /**
     * Internal processor that checks filters and notifies the active views
     */
    notifyFeatures(eventProperties) {
                            // featureConfig, id in dieser Reihenfolge liegt an dem JS-typischen Eigenheiten, in dem Fall von forEach in dieser Verwendung
        this.features.forEach((featureConfig, id) => {
            try {
                // If no filter is given, or if the filter says 'true'
                if (!featureConfig.filter || featureConfig.filter(eventProperties)) {
                    featureConfig.onUpdate(eventProperties);
                }
            } catch (err) {
                console.error(`Error processing event for feature "${id}":`, err);
            }
        });
    }

    /**
     * Clean up routine called by entry.js on plugin unload
     */
    destroy() {
        if (this.createEvent) this.app.vault.offref(this.createEvent);
        if (this.renameEvent) this.app.vault.offref(this.renameEvent);
        if (this.modifyEvent) this.app.vault.offref(this.modifyEvent);
        if (this.deleteEvent) this.app.vault.offref(this.deleteEvent);
        
        if (this.mdcChangedEvent) this.app.metadataCache.offref(this.mdcChangedEvent);
        if (this.mdcDeletedEvent) this.app.metadataCache.offref(this.mdcDeletedEvent);
        if (this.mdcResolveEvent) this.app.metadataCache.offref(this.mdcResolveEvent);
        if (this.mdcResolvedEvent) this.app.metadataCache.offref(this.mdcResolvedEvent);

        if (this.wsActiveLeafChangeEvent) this.app.workspace.offref(this.wsActiveLeafChangeEvent);
        if (this.wsFileOpenEvent) this.app.workspace.offref(this.wsFileOpenEvent);
        if (this.wsLayoutChangeEvent) this.app.workspace.offref(this.wsLayoutChangeEvent);
        if (this.wsEditorChangeEvent) this.app.workspace.offref(this.wsEditorChangeEvent);
        
        this.features.clear();
    }
}
