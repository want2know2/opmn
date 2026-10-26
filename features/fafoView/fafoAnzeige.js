

export function fafo(view, eventProperties = {}) {

    const {app, dv, contentEl} = view;

    contentEl.textContent = `Zuletzt geändert: ${eventProperties?.file?.basename}, ${eventProperties?.eventType}`;
}


