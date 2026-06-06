
////
// FUZZY SERVICE (minimal)

export function scoreFuzzy(userInputString, searchableFieldsOfPageStr) {
    
    if (!userInputString || !searchableFieldsOfPageStr) return 0;

    const qTokens = userInputString.toLowerCase().trim().split(/\s+/);
    const rawText = searchableFieldsOfPageStr;
    const t = searchableFieldsOfPageStr.toLowerCase();

    // ----------------------------
    // 1. STRUCTURE-AWARE MATCH
    // ----------------------------
    const segments = t.split(" _ ").map(s => s.trim());

    let segIndex = 0;
    let score = 0;
    let matchedAll = true;

    for (const token of qTokens) {
        let found = false;

        while (segIndex < segments.length) {
            if (segments[segIndex].includes(token)) {
                score += 20; // strong weight for structural match
                found = true;
                segIndex++;
                break;
            }
            segIndex++;
        }

        if (!found) {
            matchedAll = false;
            break;
        }
    }

    // full structured success → return early
    if (matchedAll) {
        return score + 50; // strong bonus for full path match
    }

    // ----------------------------
    // 2. FALLBACK FUZZY MATCH
    // ----------------------------

    // reset for fallback
    let pos = 0;
    let fallbackScore = 0;

    for (const token of qTokens) {
        const idx = t.indexOf(token, pos);
        if (idx === -1) return 0;

        fallbackScore += 5;
        pos = idx + token.length;
    }

    return fallbackScore;
}


export function rankFuzzy(
        userInputString, 
        entTypeCandidatePages,
        searchableFieldsOfPageExtractor
    ){
    
    if (!userInputString)
        return entTypeCandidatePages;

    const scored = entTypeCandidatePages.map(entPage => {
        const searchableFieldsOfPageStr = 
            searchableFieldsOfPageExtractor(entPage);
        
        return {
            item: entPage,
            score: scoreFuzzy(userInputString, searchableFieldsOfPageStr)
        };
    });

    return scored
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
}

