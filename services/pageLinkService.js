
/**
 * 
 */

export function toWikiLink(pageRef) {
    if (!pageRef?.path) return null;

    return `[[${pageRef.path.replace(/\.md$/, "")}]]`;
}

/**
 * 
 */

export function toWikiLinkWithAlias(pageRef, alias) {
    if (!pageRef?.path)
        return null;
 
    if (!alias || typeof alias !== "string") 
        return toWikiLink(pageRef);
    
    return `[[${pageRef.path.replace(/\.md$/, "")}|${alias}]]`;
}

