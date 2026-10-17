import { rankPagesByFuzzySearch } from "../../shared/services/queries/fuzzySearch";


/**
 * Ermittelt, welche Ergebnisse derzeit angezeigt werden.
 * Wendet die aktiven Filter und Fuzzy Search anhand des
 * aktuellen states auf die analysierten Seiten an.
 * Gibt die anzuzeigenden Ergebnisse zurück.
 */
export function getSManAngezeigteSeiten(sManState) {

    const rankedPages = rankPagesByFuzzySearch(sManState.inputSuchstring, sManState.analysierteSeiten, {
            fields: sManState.ergSuchfelderAktiv,
        });

    return rankedPages;
}

