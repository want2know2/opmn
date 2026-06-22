

/// Keine Ahnung, ob das überhaupt was bringt in der Form..

export const ONT_ROOTKL = {
    "Inhalt.md": {
        fields: ["klasse", "typ", "art"],
        instances: true,
        instByRoot: false
    },
    "Kategorie.md": {
        fields: ["klasse", "art"],
        instances: false,
        instByRoot: true
    },
    "Thema.md": {
        fields: ["klasse"],
        instances: true,
        instByRoot: true
    },
    "Ereignis.md": {
        fields: ["klasse", "art"],
        instances: true,
        instByRoot: false
    },
    "Person.md": {
        fields: ["klasse", "art"],
        instances: true,
        instByRoot: false
    },
    "Organisation.md": {
        fields: ["klasse", "art"],
        instances: true,
        instByRoot: false
    },
    "Gegenstand.md": {
        fields: ["klasse", "art"],
        instances: true,
        instByRoot: false
    },
    "Geo.md": {
        fields: ["klasse", "art"],
        instances: true,
        instByRoot: false
    }
};

