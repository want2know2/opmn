
//// 
// IMPORT

import { rankFuzzy } from "../../shared/services/fuzzyService.js";
import { updateListFieldLinks,
         listFieldHasLink }  from "../../shared/services/metadataService.js";
import { getPageNormObject } from "../../shared/services/pageNormService.js";
import { dvQueryPStatus } from "../../shared/services/pStatusService.js";
import { fuzzySearch } from "./fuzzySearch.js";



/**
 * 
 */

  export function pStatusEditor(dv, container, metaEditState, refreshCallback) {
      const headerText = "p-Status";
      const header = container.createEl("h4", {text: `${headerText}`});
      header.style.cursor = "pointer";
      const stateIntern = {
          boxOpen: true
      };

      header.addEventListener("click", () => {
          stateIntern.boxOpen = !stateIntern.boxOpen;
          box.style.display = stateIntern.boxOpen
              ? "" : "none";
          header.textContent = stateIntern.boxOpen
              ? `${headerText} (-)` : `${headerText} (+)`
      })
      const box = container.createEl("div");
      const checkBoxInput = box.createEl("input", {type: "checkbox"});
      const fuzzyBox = box.createEl("div");
      const resultBox = box.createEl("div");
      resultBox.style.maxHeight = "250px";
      resultBox.style.overflowY = "auto";

      const pStatResults = (dvQueryPStatus(dv) ?? [])
          .map(p => getPageNormObject(dv, p));

      const target = metaEditState.activePage;

      // Standard-p-Status, der gewählt wird, sobald der Master aktiviert
      // wird, die Seite aber noch keinen p-Status hat.
      const defaultPStatus =
          pStatResults.find(p => p.name === "Status _ p")
          ?? pStatResults[0]
          ?? null;

      // Bereits in `ist` der aktiven Seite gesetzter p-Status (falls vorhanden).
      const existingPStatus = target
          ? (pStatResults.find(p => listFieldHasLink(target, "ist", p)) ?? null)
          : null;

      // Aktuell gewählter p-Status (null = Master aus, kein p-Status gesetzt).
      let selectedPStatus = existingPStatus;

      // Anfangszustand spiegelt die vorhandenen Metadaten. Es wird hierbei
      // bewusst nichts geschrieben - nur das Vorhandene abgebildet.
      checkBoxInput.checked = !!selectedPStatus;
      if (!target) checkBoxInput.disabled = true;
      metaEditState.pStatus.active = selectedPStatus ? true : null;
      resultBox.style.display = selectedPStatus ? "" : "none";

      // Schreibt den gewählten p-Status atomar in `ist`: entfernt jeden
      // p-Status-Link und fügt (falls vorhanden) den gewählten hinzu.
      const writePStatus = async (chosen) => {
          if (!target) return;
          await updateListFieldLinks(target, "ist", {
              remove: pStatResults,
              add: chosen ? [chosen] : []
          });
      };

      // Master-Checkbox: schaltet, ob die Seite überhaupt einen p-Status hat.
      checkBoxInput.addEventListener("change", async () => {
          const turnedOn = checkBoxInput.checked;
          try {
              if (turnedOn) {
                  if (!selectedPStatus) selectedPStatus = defaultPStatus;
                  metaEditState.pStatus.active = true;
                  resultBox.style.display = "";
                  await writePStatus(selectedPStatus);
                  renderFuzzy();
              } else {
                  selectedPStatus = null;
                  metaEditState.pStatus.active = null;
                  resultBox.style.display = "none";
                  await writePStatus(null);
              }
          } catch (e) {
              console.error("[OPMN] p-Status write failed:", e);
              checkBoxInput.checked = !turnedOn;            // zurücksetzen
              selectedPStatus = checkBoxInput.checked ? selectedPStatus : null;
              metaEditState.pStatus.active = checkBoxInput.checked ? true : null;
              resultBox.style.display = checkBoxInput.checked ? "" : "none";
          }
          refreshCallback();
      })

      const renderFuzzy = () => {
          if (checkBoxInput.checked)
              fuzzySearch(fuzzyBox, renderResults);
      }

      const searchableFieldsOfPageExtractor = (entCandidatePage) => {
          return [
              entCandidatePage.name,
              ...(entCandidatePage.dvPage?.in ?? []),
              ...(entCandidatePage.dvPage?.ist ?? [])
          ].join(" ");
      };

      const resultTable = resultBox.createEl("table");

      const renderResults = (userInputString) => {

          resultTable.innerHTML = "";

          const ranked =
              rankFuzzy(
                  userInputString,
                  pStatResults,
                  searchableFieldsOfPageExtractor
              );

          // Checkboxen dieses Render-Durchlaufs, um die Einfachauswahl (Radio)
          // ohne Neu-Rendern aktuell zu halten.
          const rowChecks = [];
          const syncRadioUI = () => {
              rowChecks.forEach(({ page, el }) => {
                  el.checked = selectedPStatus?.path === page.path;
              });
          };

          ranked.forEach(p => {
              const parentPagesArr = p.name.split(" _ ");
              const parentPagesFlt = parentPagesArr.filter((_, i) =>
                  i > 0 && i < parentPagesArr.length - 1
              );
              const parentPagesStr = parentPagesFlt.join(" / ");

              const resultRow = resultTable.createEl("tr");
              const resultCheckCell = resultRow.createEl("td");
              const resultCheckbox = resultCheckCell.createEl("input", { type: "checkbox" });
              resultCheckbox.checked = selectedPStatus?.path === p.path;
              if (!target) resultCheckbox.disabled = true;

              rowChecks.push({ page: p, el: resultCheckbox });

              // Einfachauswahl: genau einer ist (bei aktivem Master) gewählt.
              resultCheckbox.addEventListener("change", async () => {
                  if (!target) return;
                  if (!resultCheckbox.checked) {
                      // Abwählen des einzigen Gewählten ist nicht erlaubt.
                      resultCheckbox.checked = true;
                      return;
                  }
                  const previous = selectedPStatus;
                  selectedPStatus = p;
                  syncRadioUI();
                  try {
                      await writePStatus(p);
                  } catch (e) {
                      console.error("[OPMN] p-Status write failed:", e);
                      selectedPStatus = previous;
                      syncRadioUI();
                  }
              });

              const resultCell = resultRow.createEl("td", {
                  text:
                      (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") +
                      p.displayName
              });

              resultCheckCell.style.padding = "6px";
              resultCell.style.padding = "6px";
          });
      };

      // Anfangsrender, falls die Seite bereits einen p-Status hat.
      if (checkBoxInput.checked) renderFuzzy();

  }
