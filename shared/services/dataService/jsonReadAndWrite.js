
//// 
// IMPORT                       // FROM

import { normalizePath }        from "obsidian";  



/**
 * 
 */

export async function readJSON(app, jsonPathAndName) {  

    const fullPath = normalizePath(
        `${app.vault.configDir}/plugins/opmn/${jsonPathAndName}.json`
    );
    
    if (!(await app.vault.adapter.exists(fullPath))) {
        return null;
    }

    const raw = await app.vault.adapter.read(fullPath);  

    return JSON.parse(raw);  
}


/**
 * 
 */

export async function writeJSON(app, jsonPathAndName, newData = {}) {
    
    const fullPath = normalizePath(
        `${app.vault.configDir}/plugins/opmn/${jsonPathAndName}.json`
    );

    await app.vault.adapter.write(fullPath, JSON.stringify(newData, null, 2));
}



//////

// kann weg, wollte nur wissen, wie "1. Ensure the directory exists", aslo mkdir geht

export async function readOrCreateJSONinklPath(app, path, objName) {  
    
    const adapter = app.vault.adapter;  
    const dirPath  = normalizePath(
        `${app.vault.configDir}/plugins/opmn/${path}`
    );
    const fullPath = normalizePath(
        `${dirPath}/${objName}.json`
    );
    
    // 1. Ensure the directory exists  
    if (!(await adapter.exists(dirPath))) {  
        await adapter.mkdir(dirPath);  
    }  
    
    // 2. Ensure the file exists (seed it with defaultData if not)  
    if (!(await adapter.exists(fullPath))) {  
        await adapter.write(fullPath, JSON.stringify({}, null, 2));  
    }  
    
    // 3. Read and return parsed content  
    const raw = await adapter.read(fullPath);  
    return JSON.parse(raw);  
}