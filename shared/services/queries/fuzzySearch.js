import { getFrontmatterValue } from "../dataService/metaReadService";

/**
 * Scores a query against searchable text.
 *
 * Higher scores indicate a stronger match.
 * Returns 0 when the query cannot be matched.
 */
export function scoreFuzzy(query, searchableText) {
    if (typeof query !== "string" || !query.trim()) {
        return 0;
    }

    if (
        typeof searchableText !== "string" ||
        !searchableText.trim()
    ) {
        return 0;
    }

    const tokens = query.toLowerCase().trim().split(/\s+/);
    const text = searchableText.toLowerCase();

    // 1. Structure-aware matching.
    // Tokens must match successive segments in the correct order.
    const segments = text.split(" _ ").map(segment => segment.trim());

    let segmentIndex = 0;
    let structuredScore = 0;
    let matchedAll = true;

    for (const token of tokens) {
        let found = false;

        while (segmentIndex < segments.length) {
            if (segments[segmentIndex].includes(token)) {
                structuredScore += 20;
                segmentIndex++;
                found = true;
                break;
            }

            segmentIndex++;
        }

        if (!found) {
            matchedAll = false;
            break;
        }
    }

    if (matchedAll) {
        return structuredScore + 50;
    }

    // 2. Fallback: ordered substring matching.
    let position = 0;
    let fallbackScore = 0;

    for (const token of tokens) {
        const index = text.indexOf(token, position);

        if (index === -1) {
            return 0;
        }

        fallbackScore += 5;
        position = index + token.length;
    }

    return fallbackScore;
}


/**
 * Ranks arbitrary items by the searchable text extracted from each item.
 *
 * @param {string} query
 * @param {Array} items
 * @param {(item: any) => string} getSearchableText
 * @returns {Array} Matching items, highest score first.
 */

export function rankByFuzzySearch(
    query,
    items,
    getSearchableText
) {
    if (!Array.isArray(items)) {
        throw new TypeError("items must be an array");
    }

    if (typeof getSearchableText !== "function") {
        throw new TypeError("getSearchableText must be a function");
    }

    if (typeof query !== "string" || !query.trim()) {
        return [...items];
    }

    return items
        .map((item, index) => ({
            item,
            index,
            score: scoreFuzzy(
                query,
                getSearchableText(item)
            )
        }))
        .filter(result => result.score > 0)
        .sort((a, b) =>
            b.score - a.score || a.index - b.index
        )
        .map(result => result.item);
}


/**
 * 
 */

function valueToSearchText(value) {
    if (value == null) {
        return "";
    }

    if (Array.isArray(value)) {
        return value
            .map(valueToSearchText)
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (typeof value === "object" && typeof value.path === "string") {
        return value.path;
    }

    return "";
}


/**
 * 
 */

/*function getNestedValue(object, field) {
    return field
        .split(".")
        .reduce((value, key) => value?.[key], object);
}*/


/**
 * 
 */

function getFieldValue(page, field) {
    switch (field) {
        case "name":
        case "path":
        case "wikiLink":
            return page[field];

        default:
            return getFrontmatterValue(page.frontmatter, field);
            //getNestedValue(page.frontmatter ?? {}, field);
    }
}


/**
 * 
 */

export function rankPagesByFuzzySearch(
    query,
    pages,
    { fields } = {}
) {
    if (!Array.isArray(pages)) {
        throw new TypeError("pages must be an array");
    }

    if (!Array.isArray(fields) || fields.length === 0) {
        throw new TypeError("fields must be a non-empty array");
    }

    const getSearchableText = page => fields
        .map(field => valueToSearchText(getFieldValue(page, field)))
        .filter(Boolean)
        .join(" ");

    return rankByFuzzySearch(query, pages, getSearchableText);
}

