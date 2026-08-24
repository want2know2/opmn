
//// 
// IMPORT                       // FROM

import { normalizePath }        from "obsidian";  


/**
 * 
 */

export async function readRegJSON(app, jsonName) {  

    const fullPath = normalizePath(
        `${app.vault.configDir}/plugins/opmn/shared/registry/${jsonName}.json`
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

export async function writeRegJSON(app, jsonName, newData = {}) {
    
    const fullPath = normalizePath(
        `${app.vault.configDir}/plugins/opmn/shared/registry/${jsonName}.json`
    );

    await app.vault.adapter.write(fullPath, JSON.stringify(newData, null, 2));
}



//////

// kann weg, wollte nur wissen, wie "1. Ensure the directory exists", aslo mkdir geht

async function readOrCreateRegistry(app, objName, data = {}) {  
    const adapter = app.vault.adapter;  
    const dirPath  = normalizePath(
        `${app.vault.configDir}/plugins/opmn/shared/registry`
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
        await adapter.write(fullPath, JSON.stringify(data, null, 2));  
    }  
  
    // 3. Read and return parsed content  
    const raw = await adapter.read(fullPath);  
    return JSON.parse(raw);  
}