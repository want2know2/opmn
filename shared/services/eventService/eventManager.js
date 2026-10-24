import { debounce } from "obsidian";

export class EventManager {
    constructor(plugin) {
        // Store the plugin instance to access app, vault, and workspace safely
        this.plugin = plugin;
        this.app = plugin.app;
        
        // This is where our features sign up
        this.features = new Map();
        
        // Prepare the debounced processor
        this.processQueue = debounce((file, eventType) => {
            this.notifyFeatures(file, eventType);
        }, 300, true);
    }

    /**
     * Binds the event listeners to Obsidian once layout is ready.
     */
    initialize() {
        console.log("EventManager listeners actively attaching to Obsidian Vault...");
        
        // Track the events so we can detach them later during destroy()
        this.modifyEvent = this.app.vault.on("modify", (file) => {
            this.processQueue(file, "modify");
        });

        this.deleteEvent = this.app.vault.on("delete", (file) => {
            this.processQueue(file, "delete");
        });
        
        // (Optional) Add metadata cache changes if your design requires it later
    }

    /**
     * This registers your specific view modules (like FafoView or SeitenManagerView)
     */
    registerFeature(id, config) {
        // config should be an object containing: { filter: (file, type) => boolean, onUpdate: (file, type) => void }
        this.features.set(id, config);
        console.log(`Feature registered: ${id}`);
    }

    /**
     * Unsubscribes a view when it closes to prevent memory leaks
     */
    unregisterFeature(id) {
        this.features.delete(id);
        console.log(`Feature unregistered: ${id}`);
    }

    /**
     * Internal processor that checks filters and notifies the active views
     */
    notifyFeatures(file, eventType) {
        this.features.forEach((config, id) => {
            try {
                // If no filter is given, or if the filter says 'true'
                if (!config.filter || config.filter(file, eventType)) {
                    config.onUpdate(file, eventType);
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
        console.log("Cleaning up EventManager listeners...");
        if (this.modifyEvent) this.app.vault.offref(this.modifyEvent);
        if (this.deleteEvent) this.app.vault.offref(this.deleteEvent);
        this.features.clear();
    }
}
