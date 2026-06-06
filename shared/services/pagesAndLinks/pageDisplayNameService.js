
////
// IMPORT

import { splitName } from "../../utils/namingUtils.js";


/**
 * Seitenlink benennen und anzeigen.
 */

export function getPageDisplayName(dv, pageRef) {
	
    const dvPage = pageRef.dvPage;
    
    if (!dvPage?.file?.path) 
        return {
            displayName: null,
            displayNameSource: null
        };
	
	const fieldIst = dvPage.ist;
	const fieldTitel = dvPage.titel;
	const fieldMedTitel = dvPage.med?.titel;
	const pageName = dvPage.file.name;
	const nameIDonly = /^\d{4}-\d{2}-\d{2} _ \d{2}-\d{2}-\d{2}$/.test(pageName);
	
	let displayName, displayNameSource;

	if (nameIDonly) {

		if (fieldTitel && typeof fieldTitel === "string") {
		displayName = fieldTitel;
		displayNameSource = "titel";
		} 
		
		else if (Array.isArray(fieldMedTitel) && fieldMedTitel.length > 0) {
		displayName = fieldMedTitel[0];
		displayNameSource = "med.in.titel";
		} 
		
		else if (fieldMedTitel) {
		displayName = fieldMedTitel;
		displayNameSource = "med.in.titel";
		} 
		
		else if (Array.isArray(fieldIst) && fieldIst.length === 1) {
		displayName = fieldIst[0].path;
		displayNameSource = "ist";
		} 
		
		else if (Array.isArray(fieldIst)) {
		displayName = fieldIst
			.map(istVal => {
                if (istVal?.file) {
					return splitName(istVal.file.name);
                } 
				
				else {
                    return "Fehler";
                }
			}).join(", ");
		
			displayNameSource = "ist";
		} 
		
		else {
		    displayName = "Notiz";
		};
	} 
	
	else {
		displayName = splitName(pageName);
		displayNameSource = "file.name";
	};

	return {
		displayName,
		displayNameSource
	};
}

