



export function GET_MIG_REGELN() {
	
	const obj = {
		Inhalt: {
			migInst: {
				ziel: "inst",
				checkInklSeite: null,
                ersterSeparat: true,
				felderUndWerte: {
                    migRootKl: "klasse",
                    artPath: null,
					erster: "typ",
					letzter: "art",
                    vorletzter: null,
					pstatus: "pstatus"

				}
			},
			migDef: {
				ziel: "ontDef",
				checkInklSeite: true,
                ersterSeparat: true,
				felderUndWerte: {
					migRootKl: "inKlasse",
                    artPath: "inFeld",
					erster: "erlaubterTyp",
					letzter: "seite",
					vorletzter: "parent",
                    pstatus: null
				}
			},
            erwarteteTypen: [
                "Inhalt _ Text",
                "Inhalt _ Bild",
                "Inhalt _ Audio",
                "Inhalt _ Video",
                "Inhalt _ Code",
            ]
		},
		Kategorie: {
			migInst: {
				ziel: "semTax",
				checkInklSeite: true,
                ersterSeparat: null,
				felderUndWerte: {
					migRootKl: "stKlasse",
                    artPath: null,
                    erster: null,
                    letzter: "seite",
					vorletzter: "stParent",
					pstatus: "pstatus",
				}
			},
            migDef: {},
            erlaubteTypen: []
		},
		Thema: {
			migInst: {
				ziel: "semTax",
				checkInklSeite: null,
                ersterSeparat: null,
				felderUndWerte: {
					migRootKl: "stKlasse",
                    artPath: null,
                    erster: null,
                    letzter: null,
                    vorletzter: null,
					pstatus: "pstatus",
				}
			},
            migDef: {},
            erlaubteTypen: []
		}
	};
	
	["Ereignis", "Person", "Organisation", "Gegenstand", "Geo"].forEach(migRootKl => {
		obj[migRootKl] = {
			migInst: {
				ziel: "inst",
				checkInklSeite: null,
                ersterSeparat: null,
				felderUndWerte: {
					migRootKl: "klasse",
                    artPath: null,
                    erster: null,
					letzter: "art",
                    vorletzter: null,
					pstatus: "pstatus",
				}
			},
			migDef: {
				ziel: "ontDef",
				checkInklSeite: true,
                ersterSeparat: null,
				felderUndWerte: {
					migRootKl: "inKlasse",
                    artPath: "inFeld",
                    erster: null,
					letzter: "seite",
					vorletzter: "parent",
                    pstatus: null
				}
			},
            erlaubteTypen: []
		};
	})
	
	return obj;	
}






export const ONT_DEF_FELDER = {
    klasse: {
    },
    typ: {
        inKlasse: "ROOTKL"
    },
    art: {
        inKlasse: "ROOTKL",
        parent: "vorletzter",
        erlaubtInTyp: "erster"
    }
};


export const ONT_ROOTKL = {
    "Inhalt.md": {
        felder: {
            klasse: "ROOTKL",
            typ: "erster",
            art: "letzter"
        },
        erlaubteTypen: {
            arr: [
                "Inhalt _ Text.md",
                "Inhalt _ Bild.md",
                "Inhalt _ Audio.md",
                "Inhalt _ Video.md",
                "Inhalt _ Code.md"
            ]
        },
        instances: true,
        instByRoot: null,
        definitions: true
    },
    "Kategorie.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: null,
        instByRoot: true,
        definitions: null
    },
    "Thema.md": {
        felder: {
            klasse: "ROOTKL"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: true,
        definitions: null
    },
    "Ereignis.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: null,
        definitions: true
    },
    "Person.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: null,
        definitions: true
    },
    "Organisation.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: null,
        definitions: true
    },
    "Gegenstand.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: null,
        definitions: true
    },
    "Geo.md": {
        felder: {
            klasse: "ROOTKL",
            art: "letzter"
        },
        erlaubteTypen: null,
        instances: true,
        instByRoot: null,
        definitions: true
    }
};

