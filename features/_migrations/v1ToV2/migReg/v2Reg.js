

/// Keine Ahnung, ob das überhaupt was bringt in der Form..


const ontRootKlassen = {
    "Inhalt.md": {
        fields: ["klasse", "typ", "art"],
        nestedDefs: true,
        instances: true
    },
    "Kategorie.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: false
    },
    "Thema.md": {
        fields: ["klasse"],
        nestedDefs: false,
        instances: true
    },
    "Ereignis.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: true
    },
    "Person.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: true
    },
    "Organisation.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: true
    },
    "Gegenstand.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: true
    },
    "Geo.md": {
        fields: ["klasse", "art"],
        nestedDefs: true,
        instances: true
    }
};
