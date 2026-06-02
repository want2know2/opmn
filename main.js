var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => OpmnPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/view.js
var import_obsidian = require("obsidian");

// src/dvApi.js
function getDataviewApi(app2) {
  var _a, _b, _c, _d;
  return (_d = (_c = (_b = (_a = app2 == null ? void 0 : app2.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b.dataview) == null ? void 0 : _c.api) != null ? _d : null;
}

// src/view.js
var VIEW_TYPE_OPMN = "opmn-view";
var OpmnView = class extends import_obsidian.ItemView {
  getViewType() {
    return VIEW_TYPE_OPMN;
  }
  getDisplayText() {
    return "OPMN";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.createEl("h2", { text: "OPMN" });
    const dv = getDataviewApi(this.app);
    if (!dv) {
      const err = root.createEl("p", {
        text: "Dataview API not found. Make sure the Dataview plugin is installed and enabled, then reopen this view."
      });
      err.style.color = "var(--text-error)";
      return;
    }
    const pageCount = dv.pages().length;
    root.createEl("p", {
      text: `Dataview connected \u2014 ${pageCount} pages indexed.`
    });
    const slot = root.createEl("div", { cls: "opmn-feature-slot" });
    slot.createEl("p", {
      text: "Feature mount point. The metadata editor currently opens from the \u201COPMN: Metadata editor\u201D ribbon icon (and command)."
    });
  }
};

// src/metadataEditorModal.js
var import_obsidian2 = require("obsidian");

// shared/services/fuzzyService.js
function scoreFuzzy(userInputString, searchableFieldsOfPageStr) {
  if (!userInputString || !searchableFieldsOfPageStr) return 0;
  const qTokens = userInputString.toLowerCase().trim().split(/\s+/);
  const rawText = searchableFieldsOfPageStr;
  const t = searchableFieldsOfPageStr.toLowerCase();
  const segments = t.split(" _ ").map((s) => s.trim());
  let segIndex = 0;
  let score = 0;
  let matchedAll = true;
  for (const token of qTokens) {
    let found = false;
    while (segIndex < segments.length) {
      if (segments[segIndex].includes(token)) {
        score += 20;
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
  if (matchedAll) {
    return score + 50;
  }
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
function rankFuzzy(userInputString, entTypeCandidatePages, searchableFieldsOfPageExtractor) {
  if (!userInputString)
    return entTypeCandidatePages;
  const scored = entTypeCandidatePages.map((entPage) => {
    const searchableFieldsOfPageStr = searchableFieldsOfPageExtractor(entPage);
    return {
      item: entPage,
      score: scoreFuzzy(userInputString, searchableFieldsOfPageStr)
    };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.item);
}

// shared/utils/valueUtils.js
function toStringValue(val) {
  if (val == null) return "";
  if (typeof val === "string" && val.includes("[[") || typeof val === "object" && val.path) return val.path;
  if (typeof val === "string") return val;
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}
function toArray(x, asString = false) {
  if (!x) return [];
  let arr = Array.isArray(x) ? Array.isArray(x[0]) ? x.flat(Infinity) : x : [x];
  if (asString) {
    return arr.map((v) => toStringValue(v)).filter(Boolean);
  }
  return arr;
}

// shared/services/metadataService.js
function einzelnerFeldWert(dvPage, feld) {
  return feld.split(".").reduce((o, k) => o == null ? void 0 : o[k], dvPage);
}

// shared/utils/namingUtils.js
function splitName(str) {
  if (typeof str !== "string") return "";
  const splitArr = str.split(" _ ");
  return splitArr[splitArr.length - 1];
}

// shared/services/pageDisplayNameService.js
function getPageDisplayName(dv, pageRef) {
  var _a, _b;
  const dvPage = pageRef.dvPage;
  if (!((_a = dvPage == null ? void 0 : dvPage.file) == null ? void 0 : _a.path))
    return {
      displayName: null,
      displayNameSource: null
    };
  const fieldIst = dvPage.ist;
  const fieldTitel = dvPage.titel;
  const fieldMedTitel = (_b = dvPage.med) == null ? void 0 : _b.titel;
  const pageName = dvPage.file.name;
  const nameIDonly = /^\d{4}-\d{2}-\d{2} _ \d{2}-\d{2}-\d{2}$/.test(pageName);
  let displayName, displayNameSource;
  if (nameIDonly) {
    if (fieldTitel && typeof fieldTitel === "string") {
      displayName = fieldTitel;
      displayNameSource = "titel";
    } else if (Array.isArray(fieldMedTitel) && fieldMedTitel.length > 0) {
      displayName = fieldMedTitel[0];
      displayNameSource = "med.in.titel";
    } else if (fieldMedTitel) {
      displayName = fieldMedTitel;
      displayNameSource = "med.in.titel";
    } else if (Array.isArray(fieldIst) && fieldIst.length === 1) {
      displayName = fieldIst[0].path;
      displayNameSource = "ist";
    } else if (Array.isArray(fieldIst)) {
      displayName = fieldIst.map((istVal) => {
        if (istVal == null ? void 0 : istVal.file) {
          return splitName(istVal.file.name);
        } else {
          return "Fehler";
        }
      }).join(", ");
      displayNameSource = "ist";
    } else {
      displayName = "Notiz";
    }
    ;
  } else {
    displayName = splitName(pageName);
    displayNameSource = "file.name";
  }
  ;
  return {
    displayName,
    displayNameSource
  };
}

// shared/services/pageLinkService.js
function toWikiLink(pageRef) {
  if (!(pageRef == null ? void 0 : pageRef.path)) return null;
  return `[[${pageRef.path.replace(/\.md$/, "")}]]`;
}
function toWikiLinkWithAlias(pageRef, alias) {
  if (!(pageRef == null ? void 0 : pageRef.path))
    return null;
  if (!alias || typeof alias !== "string")
    return toWikiLink(pageRef);
  return `[[${pageRef.path.replace(/\.md$/, "")}|${alias}]]`;
}

// shared/services/pageReferenceService.js
function resolvePageReference(dv, p) {
  var _a, _b, _c;
  let path = null;
  if ((_a = p == null ? void 0 : p.file) == null ? void 0 : _a.path) {
    path = p.file.path;
  } else if ((p == null ? void 0 : p.path) && (p == null ? void 0 : p.type) === "file") {
    path = p.path;
  } else if (typeof p === "string") {
    path = p;
  }
  const exists = !!(path && ((_c = (_b = dv.page(path)) == null ? void 0 : _b.file) == null ? void 0 : _c.path));
  return {
    exists,
    path: exists ? dv.page(path).file.path : null,
    name: exists ? dv.page(path).file.name : null,
    get dvPage() {
      return this.path ? dv.page(this.path) : null;
    },
    get tFile() {
      return this.path ? app.vault.getFileByPath(this.path) : null;
    }
  };
}

// shared/services/pageNormService.js
function getPageNormObject(dv, p) {
  const pageRef = resolvePageReference(dv, p);
  const normObject = {
    ref: null,
    get dvPage() {
      var _a, _b;
      return (_b = (_a = this.ref) == null ? void 0 : _a.dvPage) != null ? _b : null;
    },
    name: null,
    path: null,
    displayName: null,
    wikiLink: null,
    displayLink: null
  };
  if (!pageRef.exists)
    return normObject;
  const name = pageRef.name;
  const path = pageRef.path;
  const displayName = getPageDisplayName(dv, pageRef).displayName;
  normObject.ref = pageRef;
  normObject.name = name;
  normObject.path = path;
  normObject.displayName = displayName;
  normObject.wikiLink = toWikiLink(pageRef);
  normObject.displayLink = toWikiLinkWithAlias(pageRef, displayName);
  return normObject;
}

// shared/services/queryService.js
function dvLinkSuche(dv, listeSuchSeiten, listeSuchFelder, suchtiefe, undOderOption) {
  if (!(listeSuchSeiten == null ? void 0 : listeSuchSeiten.length) || !(listeSuchFelder == null ? void 0 : listeSuchFelder.length)) return [];
  const linkSucheErgebnis = listeSuchSeiten.map((str) => dv.page(str)).filter(Boolean).map((sobj) => dvLinkSucheAusfuehren(
    dv,
    sobj,
    listeSuchFelder,
    suchtiefe
  ));
  return undOderAuswerten(linkSucheErgebnis, undOderOption);
}
function dvLinkSucheAusfuehren(dv, page, sfields, suchtiefe, depth = 0, seen = /* @__PURE__ */ new Set()) {
  if (!page || depth > suchtiefe || seen.has(page.file.path)) return [];
  seen.add(page.file.path);
  const backlinks = page.file.inlinks.map((l) => dv.page(l.path)).filter((p) => p && p.file).sort(
    (a, b) => {
      var _a, _b, _c;
      return (
        // canonical order
        (_c = (_a = a.file) == null ? void 0 : _a.path) == null ? void 0 : _c.localeCompare((_b = b.file) == null ? void 0 : _b.path)
      );
    }
  );
  let suchergebnisse = [];
  for (const bp of backlinks) {
    const treffer = sfields.some((field) => {
      const value = einzelnerFeldWert(bp, field);
      if (!value) return false;
      return toArray(value).some((v) => (v == null ? void 0 : v.path) === page.file.path);
    });
    if (treffer) {
      suchergebnisse.push(bp.file.path);
      suchergebnisse.push(
        ...dvLinkSucheAusfuehren(
          dv,
          bp,
          sfields,
          suchtiefe,
          depth + 1,
          seen
        )
      );
    }
  }
  return suchergebnisse;
}
function undOderAuswerten(pfadListen, uoOption) {
  if (!pfadListen.length) return [];
  let result;
  if (!uoOption) {
    result = [...new Set([].concat(...pfadListen))];
  } else {
    const sets = pfadListen.map((l) => new Set(l));
    result = [...sets.reduce((a, s) => new Set([...a].filter((x) => s.has(x))))];
  }
  return result.sort((a, b) => a.localeCompare(b));
}

// shared/services/entityService.js
var ENTITY_TYPES = [
  {
    key: "kat",
    label: "Kategorie",
    query: dvQueryKat
  },
  {
    key: "the",
    label: "Thema",
    query: dvQueryThe
  },
  {
    key: "ere",
    label: "Ereignis",
    query: dvQueryEre
  },
  {
    key: "inh",
    label: "Inhalt",
    query: dvQueryInh
  },
  {
    key: "gen",
    label: "Genre",
    query: dvQueryGen
  },
  {
    key: "per",
    label: "Person",
    query: dvQueryPer
  },
  {
    key: "org",
    label: "Organisation",
    query: dvQueryOrg
  },
  {
    key: "geg",
    label: "Gegenstand",
    query: dvQueryGeg
  },
  {
    key: "geo",
    label: "Geo",
    query: dvQueryGeo
  }
];
function dvQueryKat(dv) {
  return dvLinkSuche(dv, ["Kategorie", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryThe(dv) {
  const theSuche = dvLinkSuche(dv, ["Thema", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
  return [...theSuche, "Thema.md"];
}
function dvQueryEre(dv) {
  return dvLinkSuche(dv, ["Ereignis", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryInh(dv) {
  return dvLinkSuche(dv, ["Inhalt", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryGen(dv) {
  return dvLinkSuche(dv, ["Genre", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryPer(dv) {
  return dvLinkSuche(dv, ["Person", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryOrg(dv) {
  return dvLinkSuche(dv, ["Organisation", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryGeg(dv) {
  return dvLinkSuche(dv, ["Gegenstand", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
function dvQueryGeo(dv) {
  return dvLinkSuche(dv, ["Geo", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}

// features/metadataEditor/entityButtons.js
function entityButtons(btnBox, btnCallbackFn) {
  ENTITY_TYPES.forEach((entType) => {
    const btn = btnBox.createEl("button", {
      text: entType.label
    });
    btn.addEventListener("click", () => {
      btnCallbackFn(entType);
    });
  });
}

// features/metadataEditor/fuzzySearch.js
function fuzzySearch(fuzzyBox, renderResults) {
  fuzzyBox.innerHTML = "";
  const input = fuzzyBox.createEl("input");
  input.addEventListener("input", (e) => {
    renderResults(e.target.value);
  });
  renderResults("");
}

// features/metadataEditor/feldIstEditor.js
function feldIstEditor(dv, container, metaEditState) {
  const stateIntern = {
    boxOpen: true,
    activeEntityType: null
  };
  const headerText = "ist";
  const header = container.createEl("h4", { text: headerText });
  header.style.cursor = "pointer";
  header.addEventListener("click", () => {
    stateIntern.boxOpen = !stateIntern.boxOpen;
    box.style.display = stateIntern.boxOpen ? "" : "none";
    header.textContent = stateIntern.boxOpen ? `${headerText} (-)` : `${headerText} (+)`;
  });
  const box = container.createEl("div");
  const btnBox = box.createEl("div");
  const fuzzyBox = box.createEl("div");
  const resultBox = box.createEl("div");
  const searchableFieldsOfPageExtractor = (p) => {
    var _a, _b, _c, _d;
    return [
      p.name,
      ...(_b = (_a = p.dvPage) == null ? void 0 : _a.in) != null ? _b : [],
      ...(_d = (_c = p.dvPage) == null ? void 0 : _c.ist) != null ? _d : []
    ].join(" ");
  };
  const renderResults = (userInputString) => {
    const entTypeCandidatePages = stateIntern.activeEntityType.query(dv).map((p) => getPageNormObject(dv, p)).filter((p) => {
      var _a, _b;
      const istP = (_b = (_a = p.dvPage.ist) == null ? void 0 : _a.join(" ")) == null ? void 0 : _b.includes("Status _ p.md");
      return metaEditState.pStatus.active ? istP : !istP;
    }).filter(Boolean);
    const ranked = rankFuzzy(
      userInputString,
      entTypeCandidatePages,
      searchableFieldsOfPageExtractor
    );
    resultBox.innerHTML = "";
    const resultTable = resultBox.createEl("table");
    ranked.forEach((p) => {
      const parentPagesArr = p.name.split(" _ ");
      const parentPagesFlt = parentPagesArr.filter(
        (_, i) => i > 0 && i < parentPagesArr.length - 1
      );
      const parentPagesStr = parentPagesFlt.join(" / ");
      const resultRow = resultTable.createEl("tr");
      const checkCell = resultRow.createEl("td");
      const checkInputBox = checkCell.createEl("input", { type: "checkbox" });
      const resultCell = resultRow.createEl("td", {
        text: (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") + p.displayName
      });
    });
  };
  const renderFuzzy = () => {
    if (!stateIntern.activeEntityType) return;
    fuzzySearch(fuzzyBox, renderResults);
  };
  entityButtons(btnBox, (entityType) => {
    stateIntern.activeEntityType = entityType;
    renderFuzzy();
  });
  return renderFuzzy;
}

// shared/services/pStatusService.js
function dvQueryPStatus(dv) {
  return dvLinkSuche(dv, ["p-Status", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}

// features/metadataEditor/pStatusEditor.js
function pStatusEditor(dv, container, metaEditState, refreshCallback) {
  var _a;
  const headerText = "p-Status";
  const header = container.createEl("h4", { text: `${headerText}` });
  header.style.cursor = "pointer";
  const stateIntern = {
    boxOpen: true
  };
  header.addEventListener("click", () => {
    stateIntern.boxOpen = !stateIntern.boxOpen;
    box.style.display = stateIntern.boxOpen ? "" : "none";
    header.textContent = stateIntern.boxOpen ? `${headerText} (-)` : `${headerText} (+)`;
  });
  const box = container.createEl("div");
  const checkBoxInput = box.createEl("input", { type: "checkbox" });
  const fuzzyBox = box.createEl("div");
  const resultBox = box.createEl("div");
  checkBoxInput.addEventListener("change", () => {
    if (checkBoxInput.checked) {
      resultBox.style.display = "";
      metaEditState.pStatus.active = true;
      renderFuzzy();
    } else {
      resultBox.style.display = "none";
      metaEditState.pStatus.active = null;
    }
    refreshCallback();
  });
  const pStatResults = ((_a = dvQueryPStatus(dv)) != null ? _a : []).map((p) => getPageNormObject(dv, p));
  const renderFuzzy = () => {
    if (checkBoxInput.checked)
      fuzzySearch(fuzzyBox, renderResults);
  };
  const searchableFieldsOfPageExtractor = (entCandidatePage) => {
    var _a2, _b, _c, _d;
    return [
      entCandidatePage.name,
      ...(_b = (_a2 = entCandidatePage.dvPage) == null ? void 0 : _a2.in) != null ? _b : [],
      ...(_d = (_c = entCandidatePage.dvPage) == null ? void 0 : _c.ist) != null ? _d : []
    ].join(" ");
  };
  const resultTable = resultBox.createEl("table");
  const renderResults = (userInputString) => {
    resultTable.innerHTML = "";
    const ranked = rankFuzzy(
      userInputString,
      pStatResults,
      searchableFieldsOfPageExtractor
    );
    ranked.forEach((p) => {
      const parentPagesArr = p.name.split(" _ ");
      const parentPagesFlt = parentPagesArr.filter(
        (_, i) => i > 0 && i < parentPagesArr.length - 1
      );
      const parentPagesStr = parentPagesFlt.join(" / ");
      const resultRow = resultTable.createEl("tr");
      const resultCheckCell = resultRow.createEl("td");
      const resultCheckbox = resultCheckCell.createEl("input", { type: "checkbox" });
      if (p.name === "Status _ p") resultCheckbox.checked = true;
      const resultCell = resultRow.createEl("td", {
        text: (parentPagesFlt.length > 0 ? parentPagesStr + " / " : "") + p.displayName
      });
      resultCheckCell.style.padding = "6px";
      resultCell.style.padding = "6px";
    });
  };
}

// features/metadataEditor/metadataEditor.js
function metadataEditor(dv, mountEl) {
  const metaEditState = {
    featureBoxActive: true,
    pStatus: {
      active: null,
      auswahl: []
    },
    ist: {
      auswahl: []
    }
  };
  const miniContainer = mountEl.createEl("div", { text: "Seite bearbeiten (+)" });
  miniContainer.style.display = "none";
  miniContainer.style.cursor = "pointer";
  const container = mountEl.createEl("div");
  const renderActiveContainer = () => {
    if (metaEditState.featureBoxActive) {
      miniContainer.style.display = "none";
      container.style.display = "";
    } else {
      container.style.display = "none";
      miniContainer.style.display = "";
    }
  };
  const table = container.createEl("table");
  const rowA = table.createEl("tr");
  const cellA1 = rowA.createEl("td");
  cellA1.colSpan = 3;
  const header = cellA1.createEl("h4", { text: "Seiteneditor (-)" });
  header.style.cursor = "pointer";
  [miniContainer, header].forEach((el) => {
    el.addEventListener("click", () => {
      metaEditState.featureBoxActive = !metaEditState.featureBoxActive;
      renderActiveContainer();
    });
  });
  const rowB = table.createEl("tr");
  const cellB1 = rowB.createEl("td");
  const cellB2 = rowB.createEl("td");
  const cellB3 = rowB.createEl("td");
  cellB1.style = "width:200px";
  cellB2.style = "width:350px";
  cellB3.style = "width:80px";
  let renderFeldIst = () => {
  };
  pStatusEditor(
    // obwohl `feldIstEditor`, wo die 
    dv,
    // CallbackFn eigentlich definiert wird, 
    cellB1,
    // noch nicht  erzeugt wurde (da in der 
    metaEditState,
    // UI `pStatusEditor` vor `feldIstEditor` 
    () => renderFeldIst()
    // kommen soll.
  );
  renderFeldIst = feldIstEditor(
    // gibt seine render-Funktion zurück,
    dv,
    // also `renderFuzzy` -> das ist dann
    cellB2,
    // die CallbackFn, die an `pStatusEditor`
    metaEditState
    // übergeben und dort beim Anklicken 
  );
}

// src/metadataEditorModal.js
var MetadataEditorModal = class extends import_obsidian2.Modal {
  onOpen() {
    this.titleEl.setText("Metadata editor");
    const { contentEl } = this;
    contentEl.empty();
    const dv = getDataviewApi(this.app);
    if (!dv) {
      contentEl.createEl("p", {
        text: "Dataview API not found. Make sure the Dataview plugin is installed and enabled."
      });
      return;
    }
    try {
      metadataEditor(dv, contentEl);
    } catch (e) {
      console.error("[OPMN] metadataEditor failed:", e);
      const err = contentEl.createEl("pre", {
        text: "metadataEditor error:\n" + (e && e.stack ? e.stack : String(e))
      });
      err.style.color = "var(--text-error)";
      err.style.whiteSpace = "pre-wrap";
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/main.js
var OpmnPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_OPMN, (leaf) => new OpmnView(leaf));
    this.addRibbonIcon("layout-dashboard", "Open OPMN", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-opmn-view",
      name: "Open view",
      callback: () => this.activateView()
    });
    this.addRibbonIcon("table-properties", "OPMN: Open Metadata editor", () => {
      new MetadataEditorModal(this.app).open();
    });
    this.addCommand({
      id: "open-opmn-metadata-editor",
      name: "Open metadata editor",
      callback: () => new MetadataEditorModal(this.app).open()
    });
  }
  onunload() {
  }
  // Open the OPMN view in a new tab, reusing an existing one if it is already
  // open.
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_OPMN)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_OPMN, active: true });
    }
    workspace.revealLeaf(leaf);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiLCAic3JjL3ZpZXcuanMiLCAic3JjL2R2QXBpLmpzIiwgInNyYy9tZXRhZGF0YUVkaXRvck1vZGFsLmpzIiwgInNoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanMiLCAic2hhcmVkL3V0aWxzL3ZhbHVlVXRpbHMuanMiLCAic2hhcmVkL3NlcnZpY2VzL21ldGFkYXRhU2VydmljZS5qcyIsICJzaGFyZWQvdXRpbHMvbmFtaW5nVXRpbHMuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VEaXNwbGF5TmFtZVNlcnZpY2UuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VMaW5rU2VydmljZS5qcyIsICJzaGFyZWQvc2VydmljZXMvcGFnZVJlZmVyZW5jZVNlcnZpY2UuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VOb3JtU2VydmljZS5qcyIsICJzaGFyZWQvc2VydmljZXMvcXVlcnlTZXJ2aWNlLmpzIiwgInNoYXJlZC9zZXJ2aWNlcy9lbnRpdHlTZXJ2aWNlLmpzIiwgImZlYXR1cmVzL21ldGFkYXRhRWRpdG9yL2VudGl0eUJ1dHRvbnMuanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvZnV6enlTZWFyY2guanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvZmVsZElzdEVkaXRvci5qcyIsICJzaGFyZWQvc2VydmljZXMvcFN0YXR1c1NlcnZpY2UuanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvcFN0YXR1c0VkaXRvci5qcyIsICJmZWF0dXJlcy9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IE9wbW5WaWV3LCBWSUVXX1RZUEVfT1BNTiB9IGZyb20gXCIuL3ZpZXcuanNcIjtcclxuaW1wb3J0IHsgTWV0YWRhdGFFZGl0b3JNb2RhbCB9IGZyb20gXCIuL21ldGFkYXRhRWRpdG9yTW9kYWwuanNcIjtcclxuXHJcbi8vIFBsdWdpbiBlbnRyeSBwb2ludC4gVGhpcyBpcyB0aGUgbmF0aXZlLXBsdWdpbiBlcXVpdmFsZW50IG9mIHRoZVxyXG4vLyBDb2RlU2NyaXB0IFRvb2xraXQgYHN0YXJ0dXAuanNgIGBpbnZva2UoYXBwKWAgZnVuY3Rpb246IGl0IHJ1bnMgb25jZSB3aGVuXHJcbi8vIE9ic2lkaWFuIGxvYWRzIHRoZSBwbHVnaW4gYW5kIGlzIHdoZXJlIHdlIHJlZ2lzdGVyIGV2ZXJ5dGhpbmcuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9wbW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG4gIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgIC8vIDEuIFJlZ2lzdGVyIG91ciBjdXN0b20gdmlldyB0eXBlLlxyXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX09QTU4sIChsZWFmKSA9PiBuZXcgT3BtblZpZXcobGVhZikpO1xyXG5cclxuICAgIC8vIDIuIFJpYmJvbiBpY29uIHRvIG9wZW4gdGhlIHZpZXcgKGxlZnQgdG9vbGJhcikuXHJcbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJsYXlvdXQtZGFzaGJvYXJkXCIsIFwiT3BlbiBPUE1OXCIsICgpID0+IHtcclxuICAgICAgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIDMuIENvbW1hbmQgcGFsZXR0ZSBlbnRyeSAoQ3RybC9DbWQtUCAtPiBcIk9QTU46IE9wZW4gdmlld1wiKS5cclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgIGlkOiBcIm9wZW4tb3Btbi12aWV3XCIsXHJcbiAgICAgIG5hbWU6IFwiT3BlbiB2aWV3XCIsXHJcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVmlldygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gNC4gU2Vjb25kIHJpYmJvbiBpY29uICsgY29tbWFuZDogb3BlbiB0aGUgTWV0YWRhdGEgZWRpdG9yIG1vZGFsLlxyXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwidGFibGUtcHJvcGVydGllc1wiLCBcIk9QTU46IE9wZW4gTWV0YWRhdGEgZWRpdG9yXCIsICgpID0+IHtcclxuICAgICAgbmV3IE1ldGFkYXRhRWRpdG9yTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgIGlkOiBcIm9wZW4tb3Btbi1tZXRhZGF0YS1lZGl0b3JcIixcclxuICAgICAgbmFtZTogXCJPcGVuIG1ldGFkYXRhIGVkaXRvclwiLFxyXG4gICAgICBjYWxsYmFjazogKCkgPT4gbmV3IE1ldGFkYXRhRWRpdG9yTW9kYWwodGhpcy5hcHApLm9wZW4oKSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb251bmxvYWQoKSB7fVxyXG5cclxuICAvLyBPcGVuIHRoZSBPUE1OIHZpZXcgaW4gYSBuZXcgdGFiLCByZXVzaW5nIGFuIGV4aXN0aW5nIG9uZSBpZiBpdCBpcyBhbHJlYWR5XHJcbiAgLy8gb3Blbi5cclxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XHJcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XHJcblxyXG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9PUE1OKVswXTtcclxuICAgIGlmICghbGVhZikge1xyXG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYodHJ1ZSk7IC8vIHRydWUgPSBvcGVuIGluIGEgbmV3IHRhYlxyXG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFZJRVdfVFlQRV9PUE1OLCBhY3RpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyBJdGVtVmlldyB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBnZXREYXRhdmlld0FwaSB9IGZyb20gXCIuL2R2QXBpLmpzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgVklFV19UWVBFX09QTU4gPSBcIm9wbW4tdmlld1wiO1xyXG5cclxuLy8gQSBjdXN0b20gdGFiL3ZpZXcuIGB0aGlzLmNvbnRlbnRFbGAgaXMgdGhlIGZ1bGwgY29udGVudCBhcmVhIG9mIHRoZSB0YWIgYW5kXHJcbi8vIGlzIHRoZSBwbHVnaW4gZXF1aXZhbGVudCBvZiB0aGUgY29udGFpbmVyIHlvdSB1c2VkIHRvIGdldCBiYWNrIGZyb21cclxuLy8gYGR2LmVsKC4uLilgLiBZb3UgYnVpbGQgaW50byBpdCB3aXRoIHRoZSBzYW1lIGBjcmVhdGVFbCguLi4pYCBBUEkgeW91IGFscmVhZHlcclxuLy8gdXNlIHRocm91Z2hvdXQgdGhlIGV4aXN0aW5nIGZlYXR1cmUgY29kZS5cclxuZXhwb3J0IGNsYXNzIE9wbW5WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xyXG4gIGdldFZpZXdUeXBlKCkge1xyXG4gICAgcmV0dXJuIFZJRVdfVFlQRV9PUE1OO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGlzcGxheVRleHQoKSB7XHJcbiAgICByZXR1cm4gXCJPUE1OXCI7XHJcbiAgfVxyXG5cclxuICBnZXRJY29uKCkge1xyXG4gICAgcmV0dXJuIFwibGF5b3V0LWRhc2hib2FyZFwiO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25PcGVuKCkge1xyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uQ2xvc2UoKSB7XHJcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xyXG4gICAgcm9vdC5lbXB0eSgpO1xyXG5cclxuICAgIHJvb3QuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT1BNTlwiIH0pO1xyXG5cclxuICAgIC8vIC0tLSBEYXRhdmlldyBjb25uZWN0aXZpdHkgY2hlY2sgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgY29uc3QgZHYgPSBnZXREYXRhdmlld0FwaSh0aGlzLmFwcCk7XHJcblxyXG4gICAgaWYgKCFkdikge1xyXG4gICAgICBjb25zdCBlcnIgPSByb290LmNyZWF0ZUVsKFwicFwiLCB7XHJcbiAgICAgICAgdGV4dDpcclxuICAgICAgICAgIFwiRGF0YXZpZXcgQVBJIG5vdCBmb3VuZC4gTWFrZSBzdXJlIHRoZSBEYXRhdmlldyBwbHVnaW4gaXMgaW5zdGFsbGVkIFwiICtcclxuICAgICAgICAgIFwiYW5kIGVuYWJsZWQsIHRoZW4gcmVvcGVuIHRoaXMgdmlldy5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIGVyci5zdHlsZS5jb2xvciA9IFwidmFyKC0tdGV4dC1lcnJvcilcIjtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhZ2VDb3VudCA9IGR2LnBhZ2VzKCkubGVuZ3RoO1xyXG4gICAgcm9vdC5jcmVhdGVFbChcInBcIiwge1xyXG4gICAgICB0ZXh0OiBgRGF0YXZpZXcgY29ubmVjdGVkIFxcdTIwMTQgJHtwYWdlQ291bnR9IHBhZ2VzIGluZGV4ZWQuYCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIC0tLSBGZWF0dXJlIG1vdW50IHBvaW50IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFRoaXMgaXMgd2hlcmUgZmVhdHVyZXMgKG1ldGFkYXRhRWRpdG9yLCBidWxrTWV0YUVkaXRvciwgLi4uKSB3aWxsIGJlXHJcbiAgICAvLyBtb3VudGVkIG5leHQuIFRoZXkgd2lsbCByZWNlaXZlIGBzbG90YCAoYSByZWFsIERPTSBlbGVtZW50KSBhcyB0aGVpclxyXG4gICAgLy8gY29udGFpbmVyIGFuZCBgZHZgICh0aGUgRGF0YXZpZXcgQVBJKSBmb3IgcXVlcmllcyAtLSB0aGUgc2FtZSB0d28gdGhpbmdzXHJcbiAgICAvLyB0aGV5IGdvdCB2aWEgYGR2LmVsKC4uLilgIGFuZCB0aGUgYGR2YCBhcmd1bWVudCBiZWZvcmUuXHJcbiAgICBjb25zdCBzbG90ID0gcm9vdC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJvcG1uLWZlYXR1cmUtc2xvdFwiIH0pO1xyXG4gICAgc2xvdC5jcmVhdGVFbChcInBcIiwge1xyXG4gICAgICB0ZXh0OlxyXG4gICAgICAgIFwiRmVhdHVyZSBtb3VudCBwb2ludC4gVGhlIG1ldGFkYXRhIGVkaXRvciBjdXJyZW50bHkgb3BlbnMgZnJvbSB0aGUgXCIgK1xyXG4gICAgICAgIFwiXFx1MjAxQ09QTU46IE1ldGFkYXRhIGVkaXRvclxcdTIwMUQgcmliYm9uIGljb24gKGFuZCBjb21tYW5kKS5cIixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiLy8gU2luZ2xlLCBjYW5vbmljYWwgd2F5IHRvIHJlYWNoIHRoZSBEYXRhdmlldyBwbHVnaW4ncyBKYXZhU2NyaXB0IEFQSSBmcm9tXHJcbi8vICpvdXRzaWRlKiBhIGBkYXRhdmlld2pzYCBjb2RlIGJsb2NrLlxyXG4vL1xyXG4vLyBJbnNpZGUgYSBgZGF0YXZpZXdqc2AgYmxvY2sgeW91IHdlcmUgaGFuZGVkIGEgYGR2YCBvYmplY3QgKGFcclxuLy8gRGF0YXZpZXdJbmxpbmVBcGkpLiBGcm9tIGEgcGx1Z2luIHdlIGluc3RlYWQgZ3JhYiB0aGUgZ2xvYmFsIERhdGF2aWV3IEFQSVxyXG4vLyAoYSBEYXRhdmlld0FwaSkuIEl0IGV4cG9zZXMgdGhlIHF1ZXJ5IGhlbHBlcnMgd2UgcmVseSBvbiAtLSBgZHYucGFnZXMoLi4uKWAsXHJcbi8vIGBkdi5wYWdlKHBhdGgpYCwgYGR2LnBhZ2VQYXRocyguLi4pYCwgYGR2LmluZGV4YCAtLSBidXQgTk9UIHRoZSByZW5kZXJpbmdcclxuLy8gaGVscGVycyAoYGR2LmVsYCwgYGR2LnRhYmxlYCwgLi4uKS4gV2UgZG9uJ3QgbmVlZCB0aG9zZSBhbnltb3JlOiBpbiBhIHBsdWdpblxyXG4vLyB3ZSBidWlsZCBET00gd2l0aCB0aGUgZWxlbWVudCdzIG93biBgY3JlYXRlRWwoLi4uKWAgaW5zdGVhZC5cclxuLy9cclxuLy8gUmV0dXJucyBgbnVsbGAgd2hlbiBEYXRhdmlldyBpcyBub3QgaW5zdGFsbGVkIC8gbm90IHlldCBsb2FkZWQsIHNvIGNhbGxlcnNcclxuLy8gY2FuIHNob3cgYSBmcmllbmRseSBtZXNzYWdlIGluc3RlYWQgb2YgY3Jhc2hpbmcuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRhdmlld0FwaShhcHApIHtcclxuICByZXR1cm4gYXBwPy5wbHVnaW5zPy5wbHVnaW5zPy5kYXRhdmlldz8uYXBpID8/IG51bGw7XHJcbn1cclxuXHJcbiIsICJpbXBvcnQgeyBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBnZXREYXRhdmlld0FwaSB9IGZyb20gXCIuL2R2QXBpLmpzXCI7XHJcbmltcG9ydCB7IG1ldGFkYXRhRWRpdG9yIH0gZnJvbSBcIi4uL2ZlYXR1cmVzL21ldGFkYXRhRWRpdG9yL21ldGFkYXRhRWRpdG9yLmpzXCI7XHJcblxyXG4vLyBBIG1vZGFsIGRpYWxvZyB0aGF0IGhvc3RzIHRoZSBgbWV0YWRhdGFFZGl0b3JgIGZlYXR1cmUuIGB0aGlzLmNvbnRlbnRFbGAgaXNcclxuLy8gdGhlIG1vZGFsIGJvZHkgYW5kIGlzIGhhbmRlZCB0byB0aGUgZmVhdHVyZSBhcyBpdHMgbW91bnQgZWxlbWVudCwgdG9nZXRoZXJcclxuLy8gd2l0aCB0aGUgRGF0YXZpZXcgQVBJICh1c2VkIGZvciB0aGUgcXVlcmllcyB0aGUgZmVhdHVyZSBydW5zKS5cclxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhRWRpdG9yTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XHJcbiAgb25PcGVuKCkge1xyXG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJNZXRhZGF0YSBlZGl0b3JcIik7XHJcblxyXG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuXHJcbiAgICBjb25zdCBkdiA9IGdldERhdGF2aWV3QXBpKHRoaXMuYXBwKTtcclxuICAgIGlmICghZHYpIHtcclxuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XHJcbiAgICAgICAgdGV4dDpcclxuICAgICAgICAgIFwiRGF0YXZpZXcgQVBJIG5vdCBmb3VuZC4gTWFrZSBzdXJlIHRoZSBEYXRhdmlldyBwbHVnaW4gaXMgaW5zdGFsbGVkIFwiICtcclxuICAgICAgICAgIFwiYW5kIGVuYWJsZWQuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVuZGVyIHRoZSBmZWF0dXJlLiBXcmFwcGVkIHNvIGEgcnVudGltZSBlcnJvciBzaG93cyBpbnNpZGUgdGhlIG1vZGFsXHJcbiAgICAvLyBpbnN0ZWFkIG9mIGZhaWxpbmcgc2lsZW50bHkuXHJcbiAgICB0cnkge1xyXG4gICAgICBtZXRhZGF0YUVkaXRvcihkdiwgY29udGVudEVsKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIltPUE1OXSBtZXRhZGF0YUVkaXRvciBmYWlsZWQ6XCIsIGUpO1xyXG4gICAgICBjb25zdCBlcnIgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xyXG4gICAgICAgIHRleHQ6IFwibWV0YWRhdGFFZGl0b3IgZXJyb3I6XFxuXCIgKyAoZSAmJiBlLnN0YWNrID8gZS5zdGFjayA6IFN0cmluZyhlKSksXHJcbiAgICAgIH0pO1xyXG4gICAgICBlcnIuc3R5bGUuY29sb3IgPSBcInZhcigtLXRleHQtZXJyb3IpXCI7XHJcbiAgICAgIGVyci5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmUtd3JhcFwiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25DbG9zZSgpIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgfVxyXG59XHJcbiIsICJcclxuLy8vL1xyXG4vLyBGVVpaWSBTRVJWSUNFIChtaW5pbWFsKVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNjb3JlRnV6enkodXNlcklucHV0U3RyaW5nLCBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyKSB7XHJcbiAgICBcclxuICAgIGlmICghdXNlcklucHV0U3RyaW5nIHx8ICFzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyKSByZXR1cm4gMDtcclxuXHJcbiAgICBjb25zdCBxVG9rZW5zID0gdXNlcklucHV0U3RyaW5nLnRvTG93ZXJDYXNlKCkudHJpbSgpLnNwbGl0KC9cXHMrLyk7XHJcbiAgICBjb25zdCByYXdUZXh0ID0gc2VhcmNoYWJsZUZpZWxkc09mUGFnZVN0cjtcclxuICAgIGNvbnN0IHQgPSBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gMS4gU1RSVUNUVVJFLUFXQVJFIE1BVENIXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IHQuc3BsaXQoXCIgXyBcIikubWFwKHMgPT4gcy50cmltKCkpO1xyXG5cclxuICAgIGxldCBzZWdJbmRleCA9IDA7XHJcbiAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgbGV0IG1hdGNoZWRBbGwgPSB0cnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgcVRva2Vucykge1xyXG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB3aGlsZSAoc2VnSW5kZXggPCBzZWdtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKHNlZ21lbnRzW3NlZ0luZGV4XS5pbmNsdWRlcyh0b2tlbikpIHtcclxuICAgICAgICAgICAgICAgIHNjb3JlICs9IDIwOyAvLyBzdHJvbmcgd2VpZ2h0IGZvciBzdHJ1Y3R1cmFsIG1hdGNoXHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzZWdJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VnSW5kZXgrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgbWF0Y2hlZEFsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZnVsbCBzdHJ1Y3R1cmVkIHN1Y2Nlc3MgXHUyMTkyIHJldHVybiBlYXJseVxyXG4gICAgaWYgKG1hdGNoZWRBbGwpIHtcclxuICAgICAgICByZXR1cm4gc2NvcmUgKyA1MDsgLy8gc3Ryb25nIGJvbnVzIGZvciBmdWxsIHBhdGggbWF0Y2hcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyAyLiBGQUxMQkFDSyBGVVpaWSBNQVRDSFxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIHJlc2V0IGZvciBmYWxsYmFja1xyXG4gICAgbGV0IHBvcyA9IDA7XHJcbiAgICBsZXQgZmFsbGJhY2tTY29yZSA9IDA7XHJcblxyXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiBxVG9rZW5zKSB7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gdC5pbmRleE9mKHRva2VuLCBwb3MpO1xyXG4gICAgICAgIGlmIChpZHggPT09IC0xKSByZXR1cm4gMDtcclxuXHJcbiAgICAgICAgZmFsbGJhY2tTY29yZSArPSA1O1xyXG4gICAgICAgIHBvcyA9IGlkeCArIHRva2VuLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsbGJhY2tTY29yZTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByYW5rRnV6enkoXHJcbiAgICAgICAgdXNlcklucHV0U3RyaW5nLCBcclxuICAgICAgICBlbnRUeXBlQ2FuZGlkYXRlUGFnZXMsXHJcbiAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvclxyXG4gICAgKXtcclxuICAgIFxyXG4gICAgaWYgKCF1c2VySW5wdXRTdHJpbmcpXHJcbiAgICAgICAgcmV0dXJuIGVudFR5cGVDYW5kaWRhdGVQYWdlcztcclxuXHJcbiAgICBjb25zdCBzY29yZWQgPSBlbnRUeXBlQ2FuZGlkYXRlUGFnZXMubWFwKGVudFBhZ2UgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VTdHIgPSBcclxuICAgICAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvcihlbnRQYWdlKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpdGVtOiBlbnRQYWdlLFxyXG4gICAgICAgICAgICBzY29yZTogc2NvcmVGdXp6eSh1c2VySW5wdXRTdHJpbmcsIHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VTdHIpXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzY29yZWRcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5zY29yZSA+IDApXHJcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlKVxyXG4gICAgICAgIC5tYXAoeCA9PiB4Lml0ZW0pO1xyXG59XHJcblxyXG4iLCAiXHJcblxyXG4vKipcclxuICogV2FuZGVsdCBXZXJ0IGluIFN0cmluZyB1bS5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9TdHJpbmdWYWx1ZSh2YWwpIHtcclxuICAgIGlmICh2YWwgPT0gbnVsbCkgcmV0dXJuIFwiXCI7XHJcblxyXG4gICAgaWYgKCBcclxuICAgICAgICAodHlwZW9mIHZhbCAgPT09IFwic3RyaW5nXCIgJiYgdmFsLmluY2x1ZGVzKFwiW1tcIikpIFxyXG4gICAgICAgIHx8ICh0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiICYmIHZhbC5wYXRoKVxyXG4gICAgKSByZXR1cm4gdmFsLnBhdGg7XHJcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHZhbDtcclxuICAgIGlmICh0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsLCBudWxsLCAyKTtcclxuICAgIHJldHVybiBTdHJpbmcodmFsKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBXYW5kZWx0IFdlcnQgaW4gYWJnZWZsYWNodGVuIEFycmF5IHVtIChvcHRpb25hbDogYWxsZSBlbnRoYWx0ZW5lbiBcclxuICogV2VydGUgYWxzIFN0cmluZ3MpXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkoeCwgYXNTdHJpbmcgPSBmYWxzZSkge1xyXG4gICAgaWYgKCF4KSByZXR1cm4gW107XHJcbiAgICBsZXQgYXJyID0gQXJyYXkuaXNBcnJheSh4KSBcclxuICAgICAgICA/IChBcnJheS5pc0FycmF5KHhbMF0pIFxyXG4gICAgICAgICAgICA/IHguZmxhdChJbmZpbml0eSkgXHJcbiAgICAgICAgICAgIDogeCkgXHJcbiAgICAgICAgOiBbeF07XHJcbiAgICBpZiAoYXNTdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gYXJyLm1hcCh2ID0+IHRvU3RyaW5nVmFsdWUodikpLmZpbHRlcihCb29sZWFuKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IHRvQXJyYXkgfSBmcm9tIFwiLi4vdXRpbHMvdmFsdWVVdGlscy5qc1wiO1xyXG5cclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIEVpbnplbG5lbiBGZWxkd2VydCBhYmZyYWdlbi4gV2lyZCB2ZXJ3ZW5kZXQgaW4gZHZMaW5rU3VjaGVBdXNmdWVocmVuLiBcclxuICogV2VpXHUwMERGIG5pY2h0LCBvYiBkYXMgZWluZW4gVW50ZXJzY2hpZWQgbWFjaGVuIHdcdTAwRkNyZGUsIHN0YXR0ZGVzc2VuXHJcbiAqIGVpbnplbG5lckZlbGRXZXJ0VmVyc2NoYWNodGVsdCB6dSB2ZXJ3ZW5kZW4gKHVtIGRpZSBoaWVyIGxcdTAwRjZzY2hlbiB6dSBrXHUwMEY2bm5lbikuXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVpbnplbG5lckZlbGRXZXJ0KGR2UGFnZSwgZmVsZCkge1xyXG4gIHJldHVybiBmZWxkLnNwbGl0KFwiLlwiKS5yZWR1Y2UoKG8sIGspID0+IG8/LltrXSwgZHZQYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBMaXN0ZSB2b24gRmVsZGVybiBhYmZyYWdlbiA9PiBMaXN0ZSB2b24gV2VydGVuIHp1clx1MDBGQ2NrLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbGxlRmVsZFdlcnRlKGR2LCBkdlBhZ2UsIGZlbGRMaXN0ZSkge1xyXG5cdCAgaWYgKCAhQXJyYXkuaXNBcnJheShmZWxkTGlzdGUpICkgcmV0dXJuIFtdO1xyXG5cdCAgcmV0dXJuIGZlbGRMaXN0ZVxyXG5cdCAgICAuZmxhdE1hcChmID0+IHRvQXJyYXkoIGVpbnplbG5lckZlbGRXZXJ0VmVyc2NoYWNodGVsdChkdiwgZHZQYWdlLCBmKSApKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZWluemVsbmVyRmVsZFdlcnRWZXJzY2hhY2h0ZWx0KGR2LCBzZWl0ZSwgZmVsZCkge1xyXG4gIGlmICghc2VpdGUpIHJldHVybiBbXTtcclxuICBjb25zdCBrZXlzID0gZmVsZC5zcGxpdChcIi5cIik7XHJcbiAgbGV0IGN1cnJlbnQgPSBbc2VpdGVdOyAvLyBhbHdheXMgd29yayB3aXRoIGFycmF5c1xyXG4gIFxyXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcclxuICAgIGN1cnJlbnQgPSBjdXJyZW50LmZsYXRNYXAoaXRlbSA9PiB7XHJcbiAgICAgIGlmICghaXRlbSkgcmV0dXJuIFtdO1xyXG4gICAgICAvLyByZXNvbHZlIGxpbmsgdG8gcGFnZVxyXG4gICAgICBpZiAoaXRlbT8ucGF0aCAmJiBpdGVtPy50eXBlID09PSBcImZpbGVcIikge1xyXG4gICAgICAgIGNvbnN0IHAgPSBkdi5wYWdlKGl0ZW0ucGF0aCk7XHJcbiAgICAgICAgaWYgKCFwKSByZXR1cm4gW107XHJcbiAgICAgICAgaXRlbSA9IHA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHZhbCA9IGl0ZW1ba2V5XTtcclxuICAgICAgaWYgKCF2YWwpIHJldHVybiBbXTtcclxuICAgICAgaWYgKHZhbD8ucGF0aCAmJiB2YWw/LnR5cGUgPT09IFwiZmlsZVwiKSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGR2LnBhZ2UodmFsLnBhdGgpOyAvLyBpZiB2YWwgaXMgYSBsaW5rLCByZXNvbHZlIHRvIHBhZ2VcclxuICAgICAgICByZXR1cm4gcCA/IFtwXSA6IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbCkgPyB2YWwgOiBbdmFsXTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gdG9BcnJheShjdXJyZW50KTtcclxufVxyXG5cclxuXHJcbi8qKiBcclxuICogV2FocnNjaGVpbmxpY2ggXHUwMEZDYmVyZmxcdTAwRkNzc2luZywgd2VpbCBpY2ggXHUwMEZDYmVyYWxsIGR2IHBhZ2UtT2JqZWt0IFxyXG4gKiB2ZXJ3ZW5kZW4gd2lsbC4uLlxyXG4gKiBTY2hyZWlidCBiZWxpZWJpZ2UgV2VydGUgaW4gZWluIE1ldGFkYXRlbmZlbGQgZWluZXIgU2VpdGUgKHBhdGgpXHJcbiAqIChhdWNoIHZlcnNjaGFjaHRlbHRlIEZlbGRlciB3aWUgbWVkLnRpdGVsKVxyXG4gKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVGaWVsZEJ5UGF0aChmUGF0aCwgZmllbGRQYXRoLCB2YWx1ZSkge1xyXG4gICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGZQYXRoKTtcclxuICAgIGlmICghZmlsZSkgcmV0dXJuO1xyXG5cclxuICAgIGF3YWl0IHVwZGF0ZUZpZWxkKGZpbGUsIGZpZWxkUGF0aCwgdmFsdWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFNjaHJlaWJ0IGJlbGllYmlnZSBXZXJ0ZSBpbiBlaW4gTWV0YWRhdGVuZmVsZCBlaW5lciBTZWl0ZSAoZHZQYWdlLU9iamVrdClcclxuICogKGF1Y2ggdmVyc2NoYWNodGVsdGUgRmVsZGVyIHdpZSBtZWQudGl0ZWwpXHJcbiAqL1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUZpZWxkQnlEVlBhZ2UoZHZQYWdlLCBmaWVsZFBhdGgsIHZhbHVlKSB7XHJcbiAgICBjb25zdCBmUGF0aCA9IGR2UGFnZT8uZmlsZT8ucGF0aDtcclxuICAgIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChmUGF0aCk7XHJcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcclxuXHJcbiAgICBhd2FpdCB1cGRhdGVGaWVsZChmaWxlLCBmaWVsZFBhdGgsIHZhbHVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBTY2hyZWlidCBiZWxpZWJpZ2UgV2VydGUgaW4gZWluIE1ldGFkYXRlbmZlbGQgZWluZXIgU2VpdGUgKFRGaWxlKVxyXG4gKiAoYXVjaCB2ZXJzY2hhY2h0ZWx0ZSBGZWxkZXIgd2llIG1lZC50aXRlbClcclxuICovXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlRmllbGQodEZpbGUsIGZpZWxkUGF0aCwgdmFsdWUpIHtcclxuICAgIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIodEZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBrZXlzID0gZmllbGRQYXRoLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICBjb25zdCBsYXN0S2V5ID0ga2V5cy5wb3AoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0ga2V5cy5yZWR1Y2UoKG9iaiwga2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghb2JqW2tleV0pIHsgb2JqW2tleV0gPSB7fTsgfVxyXG4gICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XHJcbiAgICAgICAgfSwgZnJvbnRtYXR0ZXIpO1xyXG5cclxuICAgICAgICB0YXJnZXRbbGFzdEtleV0gPSB2YWx1ZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIExcdTAwRjZzY2h0IHZvcmhhbmRlbmUgRnJvbnRtYXR0ZXItTWV0YWRhdGVuIHZvbGxzdFx1MDBFNG5kaWcgdW5kIGVyc2V0enQgc2llXHJcbiAqIGR1cmNoIGdlZ2ViZW5lIG5ldWUgKE1ldGFkYXRlbi1PYmpla3QpLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVFbnRpcmVGcm9udG1hdHRlcihmaWxlLCBuZXdGcm9udE9iaiA9IHt9KSB7XHJcbiAgICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZyb250bWF0dGVyKSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcImlkXCIpIGRlbGV0ZSBmcm9udG1hdHRlcltrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBPYmplY3QuYXNzaWduKGZyb250bWF0dGVyLCBuZXdGcm9udE9iaik7XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVGaWVsZEJ5RFZQYWdlKGR2UGFnZSwgZmllbGRQYXRoKSB7XHJcbiAgICBjb25zdCBwYWdlUGF0aCA9IGR2UGFnZT8uZmlsZT8ucGF0aDtcclxuICAgIGNvbnN0IHRGaWxlID0gYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgocGFnZVBhdGgpO1xyXG4gICAgaWYgKCF0RmlsZSkgcmV0dXJuO1xyXG5cclxuICAgIGF3YWl0IGRlbGV0ZUZpZWxkKHRGaWxlLCBmaWVsZFBhdGgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIExcdTAwRjZzY2h0IGJlbGllYmlnZXMgRmVsZCBlaW5lciBTZWl0ZS5cclxuICogV0FSTklOR1xyXG4gKiBoaWRkZW4gYnVnIGluIHlvdXIgZGVsZXRlRmllbGQoKVxyXG4gKiBUaGlzIGlzIGRhbmdlcm91czpcclxuICogaWYgKCFvYmpba2V5XSkgeyBvYmpba2V5XSA9IHt9OyB9XHJcbiAqIGJlY2F1c2UgZGVsZXRpb24gc2hvdWxkIG5ldmVyIGNyZWF0ZSBtaXNzaW5nIHN0cnVjdHVyZXMuXHJcbiAqIFxyXG4gKiBCZXNzZXI6XHJcbiBcclxuICAgICAgICBjb25zdCB0YXJnZXQgPSBrZXlzLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFvYmpba2V5XSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICB9LCBmcm9udG1hdHRlcik7XHJcblxyXG4gICAgICAgIGlmICghdGFyZ2V0KSByZXR1cm47XHJcblxyXG4gICAgICAgIGRlbGV0ZSB0YXJnZXRbbGFzdEtleV07XHJcblxyXG4gKlxyXG4gKi9cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUZpZWxkKHRGaWxlLCBmaWVsZFBhdGgpIHtcclxuICAgIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIodEZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGtleXMgPSBmaWVsZFBhdGguc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGNvbnN0IGxhc3RLZXkgPSBrZXlzLnBvcCgpO1xyXG5cclxuICAgICAgICBjb25zdCB0YXJnZXQgPSBrZXlzLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFvYmpba2V5XSkgeyBvYmpba2V5XSA9IHt9OyB9XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICB9LCBmcm9udG1hdHRlcik7XHJcblxyXG4gICAgICAgIGRlbGV0ZSB0YXJnZXRbbGFzdEtleV07XHJcbiAgICB9KVxyXG59XHJcblxyXG4iLCAiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3BsaXROYW1lKHN0cikge1xyXG4gICAgaWYgKHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiO1xyXG4gICAgY29uc3Qgc3BsaXRBcnIgPSBzdHIuc3BsaXQoXCIgXyBcIik7XHJcbiAgICByZXR1cm4gc3BsaXRBcnJbc3BsaXRBcnIubGVuZ3RoLTFdO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUXHJcblxyXG5pbXBvcnQgeyBzcGxpdE5hbWUgfSBmcm9tIFwiLi4vdXRpbHMvbmFtaW5nVXRpbHMuanNcIjtcclxuXHJcblxyXG4vKipcclxuICogU2VpdGVubGluayBiZW5lbm5lbiB1bmQgYW56ZWlnZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhZ2VEaXNwbGF5TmFtZShkdiwgcGFnZVJlZikge1xyXG5cdFxyXG4gICAgY29uc3QgZHZQYWdlID0gcGFnZVJlZi5kdlBhZ2U7XHJcbiAgICBcclxuICAgIGlmICghZHZQYWdlPy5maWxlPy5wYXRoKSBcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogbnVsbCxcclxuICAgICAgICAgICAgZGlzcGxheU5hbWVTb3VyY2U6IG51bGxcclxuICAgICAgICB9O1xyXG5cdFxyXG5cdGNvbnN0IGZpZWxkSXN0ID0gZHZQYWdlLmlzdDtcclxuXHRjb25zdCBmaWVsZFRpdGVsID0gZHZQYWdlLnRpdGVsO1xyXG5cdGNvbnN0IGZpZWxkTWVkVGl0ZWwgPSBkdlBhZ2UubWVkPy50aXRlbDtcclxuXHRjb25zdCBwYWdlTmFtZSA9IGR2UGFnZS5maWxlLm5hbWU7XHJcblx0Y29uc3QgbmFtZUlEb25seSA9IC9eXFxkezR9LVxcZHsyfS1cXGR7Mn0gXyBcXGR7Mn0tXFxkezJ9LVxcZHsyfSQvLnRlc3QocGFnZU5hbWUpO1xyXG5cdFxyXG5cdGxldCBkaXNwbGF5TmFtZSwgZGlzcGxheU5hbWVTb3VyY2U7XHJcblxyXG5cdGlmIChuYW1lSURvbmx5KSB7XHJcblxyXG5cdFx0aWYgKGZpZWxkVGl0ZWwgJiYgdHlwZW9mIGZpZWxkVGl0ZWwgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRUaXRlbDtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJ0aXRlbFwiO1xyXG5cdFx0fSBcclxuXHRcdFxyXG5cdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmaWVsZE1lZFRpdGVsKSAmJiBmaWVsZE1lZFRpdGVsLmxlbmd0aCA+IDApIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRNZWRUaXRlbFswXTtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJtZWQuaW4udGl0ZWxcIjtcclxuXHRcdH0gXHJcblx0XHRcclxuXHRcdGVsc2UgaWYgKGZpZWxkTWVkVGl0ZWwpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRNZWRUaXRlbDtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJtZWQuaW4udGl0ZWxcIjtcclxuXHRcdH0gXHJcblx0XHRcclxuXHRcdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZmllbGRJc3QpICYmIGZpZWxkSXN0Lmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0ZGlzcGxheU5hbWUgPSBmaWVsZElzdFswXS5wYXRoO1xyXG5cdFx0ZGlzcGxheU5hbWVTb3VyY2UgPSBcImlzdFwiO1xyXG5cdFx0fSBcclxuXHRcdFxyXG5cdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmaWVsZElzdCkpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRJc3RcclxuXHRcdFx0Lm1hcChpc3RWYWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzdFZhbD8uZmlsZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNwbGl0TmFtZShpc3RWYWwuZmlsZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRmVobGVyXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblx0XHRcdH0pLmpvaW4oXCIsIFwiKTtcclxuXHRcdFxyXG5cdFx0XHRkaXNwbGF5TmFtZVNvdXJjZSA9IFwiaXN0XCI7XHJcblx0XHR9IFxyXG5cdFx0XHJcblx0XHRlbHNlIHtcclxuXHRcdCAgICBkaXNwbGF5TmFtZSA9IFwiTm90aXpcIjtcclxuXHRcdH07XHJcblx0fSBcclxuXHRcclxuXHRlbHNlIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gc3BsaXROYW1lKHBhZ2VOYW1lKTtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJmaWxlLm5hbWVcIjtcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0ZGlzcGxheU5hbWUsXHJcblx0XHRkaXNwbGF5TmFtZVNvdXJjZVxyXG5cdH07XHJcbn1cclxuXHJcbiIsICJcclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1dpa2lMaW5rKHBhZ2VSZWYpIHtcclxuICAgIGlmICghcGFnZVJlZj8ucGF0aCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGBbWyR7cGFnZVJlZi5wYXRoLnJlcGxhY2UoL1xcLm1kJC8sIFwiXCIpfV1dYDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1dpa2lMaW5rV2l0aEFsaWFzKHBhZ2VSZWYsIGFsaWFzKSB7XHJcbiAgICBpZiAoIXBhZ2VSZWY/LnBhdGgpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiBcclxuICAgIGlmICghYWxpYXMgfHwgdHlwZW9mIGFsaWFzICE9PSBcInN0cmluZ1wiKSBcclxuICAgICAgICByZXR1cm4gdG9XaWtpTGluayhwYWdlUmVmKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGBbWyR7cGFnZVJlZi5wYXRoLnJlcGxhY2UoL1xcLm1kJC8sIFwiXCIpfXwke2FsaWFzfV1dYDtcclxufVxyXG5cclxuIiwgIlxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQYWdlUmVmZXJlbmNlKGR2LCBwKSB7XHJcblxyXG4gICAgbGV0IHBhdGggPSBudWxsO1xyXG5cclxuICAgIGlmIChwPy5maWxlPy5wYXRoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gRFYgcGFnZVxyXG4gICAgICAgIHBhdGggPSBwLmZpbGUucGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIGlmIChwPy5wYXRoICYmIHA/LnR5cGUgPT09IFwiZmlsZVwiKSB7ICAgLy8gRFYgbGlua1xyXG4gICAgICAgIHBhdGggPSBwLnBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHAgPT09IFwic3RyaW5nXCIpIHsgICAgICAgLy8gcGF0aCBzdHJpbmdcclxuICAgICAgICBwYXRoID0gcDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBleGlzdHMgPSAhIShcclxuICAgICAgICBwYXRoICYmXHJcbiAgICAgICAgZHYucGFnZShwYXRoKT8uZmlsZT8ucGF0aFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGV4aXN0cyxcclxuXHJcbiAgICAgICAgcGF0aDogZXhpc3RzXHJcbiAgICAgICAgICAgID8gZHYucGFnZShwYXRoKS5maWxlLnBhdGhcclxuICAgICAgICAgICAgOiBudWxsLFxyXG5cclxuICAgICAgICBuYW1lOiBleGlzdHNcclxuICAgICAgICA/IGR2LnBhZ2UocGF0aCkuZmlsZS5uYW1lXHJcbiAgICAgICAgOiBudWxsLFxyXG5cclxuICAgICAgICBnZXQgZHZQYWdlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhcclxuICAgICAgICAgICAgPyBkdi5wYWdlKHRoaXMucGF0aClcclxuICAgICAgICAgICAgOiBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0IHRGaWxlKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXRoXHJcbiAgICAgICAgICAgICAgICA/IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRoaXMucGF0aClcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUXHJcblxyXG5pbXBvcnQgeyBnZXRQYWdlRGlzcGxheU5hbWUgfSBmcm9tIFwiLi9wYWdlRGlzcGxheU5hbWVTZXJ2aWNlLmpzXCI7XHJcbmltcG9ydCB7IHRvV2lraUxpbmssIHRvV2lraUxpbmtXaXRoQWxpYXMgfSBmcm9tIFwiLi9wYWdlTGlua1NlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgcmVzb2x2ZVBhZ2VSZWZlcmVuY2UgfSBmcm9tIFwiLi9wYWdlUmVmZXJlbmNlU2VydmljZS5qc1wiO1xyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkge1xyXG5cclxuICAgIGNvbnN0IHBhZ2VSZWYgPSByZXNvbHZlUGFnZVJlZmVyZW5jZShkdiwgcCk7XHJcblxyXG4gICAgY29uc3Qgbm9ybU9iamVjdCA9IHtcclxuICAgICAgICByZWY6IG51bGwsXHJcbiAgICAgICAgZ2V0IGR2UGFnZSgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmPy5kdlBhZ2UgPz8gbnVsbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIHBhdGg6IG51bGwsXHJcbiAgICAgICAgZGlzcGxheU5hbWU6IG51bGwsXHJcbiAgICAgICAgd2lraUxpbms6IG51bGwsXHJcbiAgICAgICAgZGlzcGxheUxpbms6IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFwYWdlUmVmLmV4aXN0cykgXHJcbiAgICAgICAgcmV0dXJuIG5vcm1PYmplY3Q7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IHBhZ2VSZWYubmFtZTtcclxuICAgIGNvbnN0IHBhdGggPSBwYWdlUmVmLnBhdGg7XHJcbiAgICBjb25zdCBkaXNwbGF5TmFtZSA9IGdldFBhZ2VEaXNwbGF5TmFtZShkdiwgcGFnZVJlZikuZGlzcGxheU5hbWU7XHJcbiAgICBub3JtT2JqZWN0LnJlZiA9IHBhZ2VSZWY7XHJcbiAgICBub3JtT2JqZWN0Lm5hbWUgPSBuYW1lO1xyXG4gICAgbm9ybU9iamVjdC5wYXRoID0gcGF0aDtcclxuICAgIG5vcm1PYmplY3QuZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZTtcclxuICAgIG5vcm1PYmplY3Qud2lraUxpbmsgPSB0b1dpa2lMaW5rKHBhZ2VSZWYpO1xyXG4gICAgbm9ybU9iamVjdC5kaXNwbGF5TGluayA9IHRvV2lraUxpbmtXaXRoQWxpYXMocGFnZVJlZiwgZGlzcGxheU5hbWUpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbm9ybU9iamVjdDtcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgdG9BcnJheSB9IGZyb20gXCIuLi91dGlscy92YWx1ZVV0aWxzLmpzXCI7XHJcbmltcG9ydCB7IGVpbnplbG5lckZlbGRXZXJ0IH0gZnJvbSBcIi4vbWV0YWRhdGFTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLy8vLyBcclxuLy8gTElOSy1SXHUwMERDQ0tXXHUwMEM0UlRTU1VDSEVcclxuXHJcbi8qKiBcclxuICogRGllIGJlclx1MDBGQ2htdGUgTGluay1SXHUwMEZDY2t3XHUwMEU0cnRzc3VjaGVcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZMaW5rU3VjaGUoXHJcbiAgICAgICAgZHYsIFxyXG4gICAgICAgIGxpc3RlU3VjaFNlaXRlbiwgXHJcbiAgICAgICAgbGlzdGVTdWNoRmVsZGVyLCBcclxuICAgICAgICBzdWNodGllZmUsIFxyXG4gICAgICAgIHVuZE9kZXJPcHRpb24gICAgICAvLyBmYWxzZSA9IG9kZXIsIHRydWUgPSB1bmRcclxuICAgICkge1xyXG4gICAgaWYgKCFsaXN0ZVN1Y2hTZWl0ZW4/Lmxlbmd0aCB8fCAhbGlzdGVTdWNoRmVsZGVyPy5sZW5ndGgpIHJldHVybiBbXTtcclxuICAgIGNvbnN0IGxpbmtTdWNoZUVyZ2VibmlzID0gbGlzdGVTdWNoU2VpdGVuXHJcbiAgICAgICAgLm1hcChzdHIgPT4gZHYucGFnZShzdHIpKVxyXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgICAgICAubWFwKHNvYmogPT4gZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgICAgICBkdixcclxuICAgICAgICAgICAgc29iaixcclxuICAgICAgICAgICAgbGlzdGVTdWNoRmVsZGVyLFxyXG4gICAgICAgICAgICBzdWNodGllZmVcclxuICAgICAgICApKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHVuZE9kZXJBdXN3ZXJ0ZW4obGlua1N1Y2hlRXJnZWJuaXMsIHVuZE9kZXJPcHRpb24pO1xyXG59XHJcblxyXG5cclxuLyoqIFxyXG4gKiB3aXJkIHZvbiBkdkxpbmtTdWNoZSBhdWZnZXJ1ZmVuXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgIGR2LFxyXG4gICAgICAgIHBhZ2UsXHJcbiAgICAgICAgc2ZpZWxkcyxcclxuICAgICAgICBzdWNodGllZmUsXHJcbiAgICAgICAgZGVwdGggPSAwLFxyXG4gICAgICAgIHNlZW4gPSBuZXcgU2V0KClcclxuICAgICkge1xyXG5cclxuICAgIGlmICghcGFnZSB8fCBkZXB0aCA+IHN1Y2h0aWVmZSB8fCBzZWVuLmhhcyhwYWdlLmZpbGUucGF0aCkpIHJldHVybiBbXTtcclxuICAgIHNlZW4uYWRkKHBhZ2UuZmlsZS5wYXRoKTsgICAgIFxyXG5cclxuICAgIGNvbnN0IGJhY2tsaW5rcyA9IHBhZ2UuZmlsZS5pbmxpbmtzXHJcbiAgICAgICAgLm1hcChsID0+IGR2LnBhZ2UobC5wYXRoKSkgICAgICAgIC8vIHBhZ2Ugb2JqZWN0IGZyb20gbGlua1xyXG4gICAgICAgIC5maWx0ZXIocCA9PiBwICYmIHAuZmlsZSkgICAgICAgICAvLyBlbnN1cmUgZnVsbHkgaHlkcmF0ZWRcclxuICAgICAgICAuc29ydCgoYSwgYikgPT4gICAgICAgICAgICAgICAgICAgLy8gY2Fub25pY2FsIG9yZGVyXHJcbiAgICAgICAgICAgIGEuZmlsZT8ucGF0aD8ubG9jYWxlQ29tcGFyZShiLmZpbGU/LnBhdGgpIFxyXG4gICAgICAgICk7IFxyXG4gICAgXHJcbiAgICBsZXQgc3VjaGVyZ2Vibmlzc2UgPSBbXTtcclxuICAgIFxyXG4gICAgZm9yIChjb25zdCBicCBvZiBiYWNrbGlua3MpIHtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IHRyZWZmZXIgPSBzZmllbGRzLnNvbWUoZmllbGQgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGVpbnplbG5lckZlbGRXZXJ0KGJwLCBmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRvQXJyYXkodmFsdWUpLnNvbWUodiA9PiB2Py5wYXRoID09PSBwYWdlLmZpbGUucGF0aCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBpZiAodHJlZmZlcikge1xyXG4gICAgICAgICAgICBzdWNoZXJnZWJuaXNzZS5wdXNoKGJwLmZpbGUucGF0aCk7XHJcbiAgICAgICAgICAgIHN1Y2hlcmdlYm5pc3NlLnB1c2goLi4uZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgICAgICAgICAgZHYsXHJcbiAgICAgICAgICAgICAgICBicCxcclxuICAgICAgICAgICAgICAgIHNmaWVsZHMsXHJcbiAgICAgICAgICAgICAgICBzdWNodGllZmUsXHJcbiAgICAgICAgICAgICAgICBkZXB0aCArIDEsXHJcbiAgICAgICAgICAgICAgICBzZWVuKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VjaGVyZ2Vibmlzc2U7XHJcbn1cclxuXHJcblxyXG4vKiogXHJcbiAqIFZlcmJpbmRldCBMaXN0ZW4gdm9uIFNlaXRlbnBmYWRlbiBnZW1cdTAwRTRcdTAwREYgdHJ1ZS9mYWxzZSA9IHVuZC9vZGVyXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gdW5kT2RlckF1c3dlcnRlbihwZmFkTGlzdGVuLCB1b09wdGlvbikge1xyXG4gICAgaWYgKCFwZmFkTGlzdGVuLmxlbmd0aCkgcmV0dXJuIFtdO1xyXG4gICAgbGV0IHJlc3VsdDtcclxuXHJcbiAgICBpZiAoIXVvT3B0aW9uKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gWy4uLm5ldyBTZXQoW10uY29uY2F0KC4uLnBmYWRMaXN0ZW4pKV07IC8vIE9SOiB1bmlvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBzZXRzID0gcGZhZExpc3Rlbi5tYXAobCA9PiBuZXcgU2V0KGwpKTtcclxuICAgICAgICByZXN1bHQgPSBbLi4uc2V0cy5yZWR1Y2UoKGEsIHMpID0+IFxyXG4gICAgICAgICAgICBuZXcgU2V0KFsuLi5hXS5maWx0ZXIoeCA9PiBzLmhhcyh4KSkpKV07IC8vIEFORDogaW50ZXJzZWN0aW9uXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpOyAvLyBjYW5vbmljYWwgb3JkZXJcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgZHZMaW5rU3VjaGUgfSBmcm9tIFwiLi9xdWVyeVNlcnZpY2UuanNcIjtcclxuXHJcblxyXG4vLy8vXHJcbi8vIEVOVElUXHUwMEM0VEVOXHJcblxyXG5leHBvcnQgY29uc3QgRU5USVRZX1RZUEVTID0gW1xyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJrYXRcIixcclxuICAgICAgICBsYWJlbDogXCJLYXRlZ29yaWVcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUthdFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwidGhlXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiVGhlbWFcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeVRoZVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiZXJlXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiRXJlaWduaXNcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUVyZVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiaW5oXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiSW5oYWx0XCIsXHJcbiAgICAgICAgcXVlcnk6IGR2UXVlcnlJbmhcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAga2V5OiBcImdlblwiLFxyXG4gICAgICAgIGxhYmVsOiBcIkdlbnJlXCIsXHJcbiAgICAgICAgcXVlcnk6IGR2UXVlcnlHZW5cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAga2V5OiBcInBlclwiLFxyXG4gICAgICAgIGxhYmVsOiBcIlBlcnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5OiBkdlF1ZXJ5UGVyXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJvcmdcIixcclxuICAgICAgICBsYWJlbDogXCJPcmdhbmlzYXRpb25cIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeU9yZ1xyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiZ2VnXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiR2VnZW5zdGFuZFwiLFxyXG4gICAgICAgIHF1ZXJ5OiBkdlF1ZXJ5R2VnXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJnZW9cIixcclxuICAgICAgICBsYWJlbDogXCJHZW9cIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUdlb1xyXG4gICAgfVxyXG5dO1xyXG5cclxuXHJcbi8vLy9cclxuLy8gUVVFUklFU1xyXG5cclxuLyoqXHJcbiAqIEhhdXB0LUVudGl0XHUwMEU0dGVuOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjAgenUgXCJBdXN3YWhsIEVudFwiIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeU1haW5FbnRzKGR2KSB7XHJcbiAgICByZXR1cm4gZHZMaW5rU3VjaGUoZHYsIFtcIkF1c3dhaGwgRW50XCJdLCBbXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEthdGVnb3JpZTogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdLYXRlZ29yaWUnIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUthdChkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxuICAgIC8vIGNvbnN0IGthdFN1Y2hlID0gZHZMaW5rU3VjaGUoZHYsIFtcIkthdGVnb3JpZVwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG4gICAgLy8gcmV0dXJuIFsuLi5rYXRTdWNoZSwgXCJLYXRlZ29yaWUubWRcIl07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkdlF1ZXJ5S2F0QWxsZShkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbiAgICAvLyBjb25zdCBrYXRTdWNoZSA9IGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxuICAgIC8vIHJldHVybiBbLi4ua2F0U3VjaGUsIFwiS2F0ZWdvcmllLm1kXCJdO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFRoZW1hOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjIgenUgJ1RoZW1hJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlUaGUoZHYpIHtcclxuICAgIGNvbnN0IHRoZVN1Y2hlID0gZHZMaW5rU3VjaGUoZHYsIFtcIlRoZW1hXCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbiAgICByZXR1cm4gWy4uLnRoZVN1Y2hlLCBcIlRoZW1hLm1kXCJdO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEVyZWlnbmlzOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjIgenUgJ0VyZWlnbmlzJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlFcmUoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiRXJlaWduaXNcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbmhhbHQ6IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnSW5oYWx0JyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlJbmgoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiSW5oYWx0XCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2VucmU6IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnR2VucmUnIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUdlbihkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJHZW5yZVwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFBlcnNvbjogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdQZXJzb24nIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeVBlcihkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJQZXJzb25cIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBPcmdhbmlzYXRpb246IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnT3JnYW5pc2F0aW9uJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlPcmcoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiT3JnYW5pc2F0aW9uXCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2VnZW5zdGFuZDogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdHZWdlbnN0YW5kJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlHZWcoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiR2VnZW5zdGFuZFwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdlbzogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdHZW8nIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUdlbyhkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJHZW9cIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgRU5USVRZX1RZUEVTIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9lbnRpdHlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlCdXR0b25zKGJ0bkJveCwgYnRuQ2FsbGJhY2tGbikge1xyXG5cclxuICAgIEVOVElUWV9UWVBFUy5mb3JFYWNoKGVudFR5cGUgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBidG4gPSBidG5Cb3guY3JlYXRlRWwoXCJidXR0b25cIiwge1xyXG4gICAgICAgICAgICB0ZXh0OiBlbnRUeXBlLmxhYmVsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBidG5DYWxsYmFja0ZuKGVudFR5cGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IHJhbmtGdXp6eSB9IGZyb20gXCIuLi8uLi9zaGFyZWQvc2VydmljZXMvZnV6enlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cykge1xyXG5cclxuICAgIGZ1enp5Qm94LmlubmVySFRNTCA9IFwiXCI7XHJcblxyXG4gICAgY29uc3QgaW5wdXQgPSBmdXp6eUJveC5jcmVhdGVFbChcImlucHV0XCIpO1xyXG4gICAgLy8gY29uc3QgcmVzdWx0VGFibGUgPSBmdXp6eUJveC5jcmVhdGVFbChcInRhYmxlXCIpO1xyXG5cclxuICAgIC8vIFdlbm4gZWluemVsbmUgQmF1c3RlaW5lIGFuZGVyZSBLcml0ZXJpZW4gdmVyd2VuZGVuIHNvbGxlblxyXG4gICAgLy8gYHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VFeHRyYWN0b3JgIGF1c2xhZ2VybiB1bmQgYW4gYGZ1enp5U2VhcmNoYFxyXG4gICAgLy8gYWxzIHdlaXRlcmVzIEFyZ3VtZW50IHdlaXRlcnJlaWNoZW4gKHdpcmQgdm9uIGhpZXIgYXVjaCBudXJcclxuICAgIC8vIGFuIGByYW5rRnV6enlgIHdlaXRlcmdlcmVpY2h0KS5cclxuICAgIC8qY29uc3Qgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvciA9IChlbnRDYW5kaWRhdGVQYWdlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZS5uYW1lLFxyXG4gICAgICAgICAgICAuLi4oZW50Q2FuZGlkYXRlUGFnZS5kdlBhZ2U/LmluID8/IFtdKSxcclxuICAgICAgICAgICAgLi4uKGVudENhbmRpZGF0ZVBhZ2UuZHZQYWdlPy5pc3QgPz8gW10pXHJcbiAgICAgICAgXS5qb2luKFwiIFwiKTtcclxuICAgIH07Ki9cclxuXHJcbiAgICAvKmNvbnN0IHJlbmRlciA9ICh1c2VySW5wdXRTdHJpbmcpID0+IHtcclxuICAgICAgICByZXN1bHRUYWJsZS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgICAgICBjb25zdCByYW5rZWQgPSBcclxuICAgICAgICAgICAgcmFua0Z1enp5KFxyXG4gICAgICAgICAgICAgICAgdXNlcklucHV0U3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZXMsXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlRXh0cmFjdG9yXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJhbmtlZC5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0FyclxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcigocCwgaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA+MCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoLTEpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFBhZ2VzU3RyID0gcGFyZW50UGFnZXNGbHQuam9pbihcIiAvIFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdFJvdyA9IHJlc3VsdFRhYmxlLmNyZWF0ZUVsKFwidHJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdENoZWNrQ2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDaGVja2JveCA9IHJlc3VsdENoZWNrQ2VsbC5jcmVhdGVFbChcImlucHV0XCIsIHt0eXBlOiBcImNoZWNrYm94XCJ9KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIsIHsgXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBgJHtwYXJlbnRQYWdlc0ZsdC5sZW5ndGggPiAwIFxyXG4gICAgICAgICAgICAgICAgICAgID8gcGFyZW50UGFnZXNTdHIrXCIgL1wiIFxyXG4gICAgICAgICAgICAgICAgICAgIDogXCJcIn1cclxuICAgICAgICAgICAgICAgICAgICAke3AuZGlzcGxheU5hbWV9YCBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlc3VsdENoZWNrQ2VsbC5zdHlsZS5wYWRkaW5nID0gXCI2cHhcIjtcclxuICAgICAgICAgICAgcmVzdWx0Q2VsbC5zdHlsZS5wYWRkaW5nID0gXCI2cHhcIjtcclxuICAgICAgICB9KTtcclxuICAgIH07Ki9cclxuXHJcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKGUpID0+IHtcclxuICAgICAgICByZW5kZXJSZXN1bHRzKGUudGFyZ2V0LnZhbHVlKTsgLy8gZS50YXJnZXQudmFsdWUgPT4gdXNlcklucHV0U3RyaW5nXHJcbiAgICB9KTtcclxuXHJcbiAgICByZW5kZXJSZXN1bHRzKFwiXCIpO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUICAgICAgICAgICAgICAgICAgICAgLy8gRlJPTVxyXG5cclxuaW1wb3J0IHsgcmFua0Z1enp5IH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgYWxsZUZlbGRXZXJ0ZSB9ICAgICAgZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9tZXRhZGF0YVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZ2V0UGFnZU5vcm1PYmplY3QgfSAgZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9wYWdlTm9ybVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgdG9TdHJpbmdWYWx1ZSB9ICAgICAgZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlscy92YWx1ZVV0aWxzLmpzXCI7XHJcbmltcG9ydCB7IGVudGl0eUJ1dHRvbnMgfSAgICAgIGZyb20gXCIuL2VudGl0eUJ1dHRvbnMuanNcIjtcclxuaW1wb3J0IHsgZnV6enlTZWFyY2ggfSAgICAgICAgZnJvbSBcIi4vZnV6enlTZWFyY2guanNcIjtcclxuXHJcblxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZlbGRJc3RFZGl0b3IoZHYsIGNvbnRhaW5lciwgbWV0YUVkaXRTdGF0ZSkge1xyXG5cclxuICAgIGNvbnN0IHN0YXRlSW50ZXJuID0ge1xyXG4gICAgICAgIGJveE9wZW46IHRydWUsXHJcbiAgICAgICAgYWN0aXZlRW50aXR5VHlwZTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBoZWFkZXJUZXh0ID0gXCJpc3RcIjtcclxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogaGVhZGVyVGV4dCB9KTtcclxuICAgIGhlYWRlci5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcclxuXHJcbiAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICBzdGF0ZUludGVybi5ib3hPcGVuID0gIXN0YXRlSW50ZXJuLmJveE9wZW47XHJcbiAgICAgICAgYm94LnN0eWxlLmRpc3BsYXkgPSBzdGF0ZUludGVybi5ib3hPcGVuID8gXCJcIiA6IFwibm9uZVwiO1xyXG4gICAgICAgIGhlYWRlci50ZXh0Q29udGVudCA9IHN0YXRlSW50ZXJuLmJveE9wZW4gPyBgJHtoZWFkZXJUZXh0fSAoLSlgIDogYCR7aGVhZGVyVGV4dH0gKCspYDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGJveCA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGJ0bkJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGZ1enp5Qm94ID0gYm94LmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG4gICAgY29uc3QgcmVzdWx0Qm94ID0gYm94LmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG5cclxuICAgIGNvbnN0IHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VFeHRyYWN0b3IgPSAocCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHAubmFtZSxcclxuICAgICAgICAgICAgLi4uKHAuZHZQYWdlPy5pbiA/PyBbXSksXHJcbiAgICAgICAgICAgIC4uLihwLmR2UGFnZT8uaXN0ID8/IFtdKVxyXG4gICAgICAgIF0uam9pbihcIiBcIik7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHJlbmRlclJlc3VsdHMgPSAodXNlcklucHV0U3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGVudFR5cGVDYW5kaWRhdGVQYWdlcyA9XHJcbiAgICAgICAgICAgIHN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGVcclxuICAgICAgICAgICAgICAgIC5xdWVyeShkdilcclxuICAgICAgICAgICAgICAgIC5tYXAocCA9PiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzdFAgPSBwLmR2UGFnZS5pc3Q/LmpvaW4oXCIgXCIpPy5pbmNsdWRlcyhcIlN0YXR1cyBfIHAubWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ldGFFZGl0U3RhdGUucFN0YXR1cy5hY3RpdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyBpc3RQIDogIWlzdFA7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmFua2VkID1cclxuICAgICAgICAgICAgcmFua0Z1enp5KFxyXG4gICAgICAgICAgICAgICAgdXNlcklucHV0U3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgZW50VHlwZUNhbmRpZGF0ZVBhZ2VzLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvclxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICByZXN1bHRCb3guaW5uZXJIVE1MID0gXCJcIjtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0VGFibGUgPSByZXN1bHRCb3guY3JlYXRlRWwoXCJ0YWJsZVwiKTtcclxuXHJcbiAgICAgICAgcmFua2VkLmZvckVhY2gocCA9PiB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0Fyci5maWx0ZXIoKF8sIGkpID0+XHJcbiAgICAgICAgICAgICAgICBpID4gMCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc1N0ciA9IHBhcmVudFBhZ2VzRmx0LmpvaW4oXCIgLyBcIik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRSb3cgPSByZXN1bHRUYWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja0NlbGwgPSByZXN1bHRSb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgICAgICAgICAgY29uc3QgY2hlY2tJbnB1dEJveCA9IGNoZWNrQ2VsbC5jcmVhdGVFbChcImlucHV0XCIsIHt0eXBlOiBcImNoZWNrYm94XCJ9KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogXHJcbiAgICAgICAgICAgICAgICAocGFyZW50UGFnZXNGbHQubGVuZ3RoID4gMCA/IHBhcmVudFBhZ2VzU3RyICsgXCIgLyBcIiA6IFwiXCIpICtcclxuICAgICAgICAgICAgICAgICAgICBwLmRpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCByZW5kZXJGdXp6eSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoIXN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGUpIHJldHVybjtcclxuICAgICAgICBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGVudGl0eUJ1dHRvbnMoYnRuQm94LCAoZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgIHN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGUgPSBlbnRpdHlUeXBlO1xyXG4gICAgICAgIHJlbmRlckZ1enp5KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVuZGVyRnV6enk7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IGR2TGlua1N1Y2hlIH0gZnJvbSBcIi4vcXVlcnlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkdlF1ZXJ5UFN0YXR1cyhkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJwLVN0YXR1c1wiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy8gXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgcmFua0Z1enp5IH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZ2V0UGFnZU5vcm1PYmplY3QgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3NlcnZpY2VzL3BhZ2VOb3JtU2VydmljZS5qc1wiO1xyXG5pbXBvcnQgeyBkdlF1ZXJ5UFN0YXR1cyB9IGZyb20gXCIuLi8uLi9zaGFyZWQvc2VydmljZXMvcFN0YXR1c1NlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZnV6enlTZWFyY2ggfSBmcm9tIFwiLi9mdXp6eVNlYXJjaC5qc1wiO1xyXG5cclxuXHJcblxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBTdGF0dXNFZGl0b3IoZHYsIGNvbnRhaW5lciwgbWV0YUVkaXRTdGF0ZSwgcmVmcmVzaENhbGxiYWNrKSB7XHJcbiAgICBjb25zdCBoZWFkZXJUZXh0ID0gXCJwLVN0YXR1c1wiO1xyXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwge3RleHQ6IGAke2hlYWRlclRleHR9YH0pO1xyXG4gICAgaGVhZGVyLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgY29uc3Qgc3RhdGVJbnRlcm4gPSB7XHJcbiAgICAgICAgYm94T3BlbjogdHJ1ZVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgc3RhdGVJbnRlcm4uYm94T3BlbiA9ICFzdGF0ZUludGVybi5ib3hPcGVuO1xyXG4gICAgICAgIGJveC5zdHlsZS5kaXNwbGF5ID0gc3RhdGVJbnRlcm4uYm94T3BlbiBcclxuICAgICAgICAgICAgPyBcIlwiIDogXCJub25lXCI7XHJcbiAgICAgICAgaGVhZGVyLnRleHRDb250ZW50ID0gc3RhdGVJbnRlcm4uYm94T3BlbiBcclxuICAgICAgICAgICAgPyBgJHtoZWFkZXJUZXh0fSAoLSlgIDogYCR7aGVhZGVyVGV4dH0gKCspYFxyXG4gICAgfSlcclxuICAgIGNvbnN0IGJveCA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGNoZWNrQm94SW5wdXQgPSBib3guY3JlYXRlRWwoXCJpbnB1dFwiLCB7dHlwZTogXCJjaGVja2JveFwifSk7XHJcbiAgICBjb25zdCBmdXp6eUJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IHJlc3VsdEJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuXHJcbiAgICBjaGVja0JveElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgIGlmIChjaGVja0JveElucHV0LmNoZWNrZWQpIHtcclxuICAgICAgICAgICAgcmVzdWx0Qm94LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICBtZXRhRWRpdFN0YXRlLnBTdGF0dXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVuZGVyRnV6enkoKTtcclxuICAgICAgICB9IGVsc2UgeyBcclxuICAgICAgICAgICAgcmVzdWx0Qm94LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgbWV0YUVkaXRTdGF0ZS5wU3RhdHVzLmFjdGl2ZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hDYWxsYmFjaygpO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBwU3RhdFJlc3VsdHMgPSAoZHZRdWVyeVBTdGF0dXMoZHYpID8/IFtdKVxyXG4gICAgICAgIC5tYXAocCA9PiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkpO1xyXG5cclxuICAgIGNvbnN0IHJlbmRlckZ1enp5ID0gKCkgPT4ge1xyXG4gICAgICAgIGlmIChjaGVja0JveElucHV0LmNoZWNrZWQpIFxyXG4gICAgICAgICAgICBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvciA9IChlbnRDYW5kaWRhdGVQYWdlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZS5uYW1lLFxyXG4gICAgICAgICAgICAuLi4oZW50Q2FuZGlkYXRlUGFnZS5kdlBhZ2U/LmluID8/IFtdKSxcclxuICAgICAgICAgICAgLi4uKGVudENhbmRpZGF0ZVBhZ2UuZHZQYWdlPy5pc3QgPz8gW10pXHJcbiAgICAgICAgXS5qb2luKFwiIFwiKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgcmVzdWx0VGFibGUgPSByZXN1bHRCb3guY3JlYXRlRWwoXCJ0YWJsZVwiKTtcclxuXHJcbiAgICBjb25zdCByZW5kZXJSZXN1bHRzID0gKHVzZXJJbnB1dFN0cmluZykgPT4ge1xyXG5cclxuICAgICAgICBcclxuICAgICAgICByZXN1bHRUYWJsZS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgICAgICBjb25zdCByYW5rZWQgPVxyXG4gICAgICAgICAgICByYW5rRnV6enkoXHJcbiAgICAgICAgICAgICAgICB1c2VySW5wdXRTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwU3RhdFJlc3VsdHMsXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlRXh0cmFjdG9yXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJhbmtlZC5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0Fyci5maWx0ZXIoKF8sIGkpID0+XHJcbiAgICAgICAgICAgICAgICBpID4gMCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc1N0ciA9IHBhcmVudFBhZ2VzRmx0LmpvaW4oXCIgLyBcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRSb3cgPSByZXN1bHRUYWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDaGVja0NlbGwgPSByZXN1bHRSb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2hlY2tib3ggPSByZXN1bHRDaGVja0NlbGwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcclxuICAgICAgICAgICAgaWYgKHAubmFtZSA9PT0gXCJTdGF0dXMgXyBwXCIpIHJlc3VsdENoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDZWxsID0gcmVzdWx0Um93LmNyZWF0ZUVsKFwidGRcIiwge1xyXG4gICAgICAgICAgICAgICAgdGV4dDpcclxuICAgICAgICAgICAgICAgICAgICAocGFyZW50UGFnZXNGbHQubGVuZ3RoID4gMCA/IHBhcmVudFBhZ2VzU3RyICsgXCIgLyBcIiA6IFwiXCIpICtcclxuICAgICAgICAgICAgICAgICAgICBwLmRpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0Q2hlY2tDZWxsLnN0eWxlLnBhZGRpbmcgPSBcIjZweFwiO1xyXG4gICAgICAgICAgICByZXN1bHRDZWxsLnN0eWxlLnBhZGRpbmcgPSBcIjZweFwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IGZlbGRJc3RFZGl0b3IgfSBmcm9tIFwiLi9mZWxkSXN0RWRpdG9yLmpzXCI7XHJcbmltcG9ydCB7IHBTdGF0dXNFZGl0b3IgfSBmcm9tIFwiLi9wU3RhdHVzRWRpdG9yLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbi8vIGBtb3VudEVsYCBpcyB0aGUgRE9NIGVsZW1lbnQgdGhlIGZlYXR1cmUgcmVuZGVycyBpbnRvLiBQcmV2aW91c2x5IHRoZSB0d29cclxuLy8gcm9vdCBjb250YWluZXJzIHdlcmUgY3JlYXRlZCB2aWEgYGR2LmVsKC4uLilgICh3aGljaCBib3RoIGNyZWF0ZXMgdGhlIGVsZW1lbnRcclxuLy8gQU5EIGFwcGVuZHMgaXQgdG8gdGhlIHN1cnJvdW5kaW5nIGRhdGF2aWV3anMgb3V0cHV0KS4gT3V0c2lkZSBhIGRhdGF2aWV3anNcclxuLy8gYmxvY2sgdGhlcmUgaXMgbm8gc3VjaCBvdXRwdXQgY29udGV4dCwgc28gdGhlIGNhbGxlciBwYXNzZXMgaW4gYW4gZWxlbWVudFxyXG4vLyAoZS5nLiBhIG1vZGFsJ3MgY29udGVudEVsKSBhbmQgd2UgYnVpbGQgaW50byBpdCB3aXRoIGBjcmVhdGVFbCguLi4pYC5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ldGFkYXRhRWRpdG9yKGR2LCBtb3VudEVsKSB7XHJcblxyXG4gICAgY29uc3QgbWV0YUVkaXRTdGF0ZSA9IHtcclxuICAgICAgICBmZWF0dXJlQm94QWN0aXZlOiB0cnVlLFxyXG4gICAgICAgIHBTdGF0dXM6IHtcclxuICAgICAgICAgICAgYWN0aXZlOiBudWxsLFxyXG4gICAgICAgICAgICBhdXN3YWhsOiBbXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXN0OiB7XHJcbiAgICAgICAgICAgIGF1c3dhaGw6IFtdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1pbmlDb250YWluZXIgPSBtb3VudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgdGV4dDogXCJTZWl0ZSBiZWFyYmVpdGVuICgrKVwiIH0pO1xyXG4gICAgbWluaUNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICBtaW5pQ29udGFpbmVyLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gbW91bnRFbC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIFxyXG4gICAgY29uc3QgcmVuZGVyQWN0aXZlQ29udGFpbmVyID0gKCkgPT4ge1xyXG4gICAgICAgIGlmIChtZXRhRWRpdFN0YXRlLmZlYXR1cmVCb3hBY3RpdmUpIHtcclxuICAgICAgICAgICAgbWluaUNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICBtaW5pQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25zdCBib3ggPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIik7XHJcblxyXG4gICAgY29uc3QgdGFibGUgPSBjb250YWluZXIuY3JlYXRlRWwoXCJ0YWJsZVwiKTtcclxuICAgIGNvbnN0IHJvd0EgPSB0YWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgY29uc3QgY2VsbEExID0gcm93QS5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgY2VsbEExLmNvbFNwYW4gPSAzO1xyXG4gICAgY29uc3QgaGVhZGVyID0gY2VsbEExLmNyZWF0ZUVsKFwiaDRcIiwge3RleHQ6IFwiU2VpdGVuZWRpdG9yICgtKVwifSk7XHJcbiAgICBoZWFkZXIuc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7XHJcbiAgICBbbWluaUNvbnRhaW5lciwgaGVhZGVyXS5mb3JFYWNoKGVsID0+IHtcclxuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBtZXRhRWRpdFN0YXRlLmZlYXR1cmVCb3hBY3RpdmUgPSAhbWV0YUVkaXRTdGF0ZS5mZWF0dXJlQm94QWN0aXZlO1xyXG4gICAgICAgICAgICByZW5kZXJBY3RpdmVDb250YWluZXIoKTtcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGNvbnN0IHJvd0IgPSB0YWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgY29uc3QgY2VsbEIxID0gcm93Qi5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgY29uc3QgY2VsbEIyID0gcm93Qi5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgY29uc3QgY2VsbEIzID0gcm93Qi5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgY2VsbEIxLnN0eWxlID0gXCJ3aWR0aDoyMDBweFwiO1xyXG4gICAgY2VsbEIyLnN0eWxlID0gXCJ3aWR0aDozNTBweFwiO1xyXG4gICAgY2VsbEIzLnN0eWxlID0gXCJ3aWR0aDo4MHB4XCI7XHJcblxyXG4gICAgbGV0IHJlbmRlckZlbGRJc3QgPSAoKSA9PiB7fTsgICAgICAgICAgIC8vIFBsYXR6aGFsdGVyLCB1bSBlaW5lIENhbGxiYWNrRm5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbiBgcFN0YXR1c0VkaXRvcmAgenUgXHUwMEZDYmVyZ2ViZW4sXHJcbiAgICBwU3RhdHVzRWRpdG9yKCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2J3b2hsIGBmZWxkSXN0RWRpdG9yYCwgd28gZGllIFxyXG4gICAgICAgIGR2LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGxiYWNrRm4gZWlnZW50bGljaCBkZWZpbmllcnQgd2lyZCwgXHJcbiAgICAgICAgY2VsbEIxLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9jaCBuaWNodCAgZXJ6ZXVndCB3dXJkZSAoZGEgaW4gZGVyIFxyXG4gICAgICAgIG1ldGFFZGl0U3RhdGUsICAgICAgICAgICAgICAgICAgICAgIC8vIFVJIGBwU3RhdHVzRWRpdG9yYCB2b3IgYGZlbGRJc3RFZGl0b3JgIFxyXG4gICAgICAgICgpID0+IHJlbmRlckZlbGRJc3QoKSAgICAgICAgICAgICAgIC8vIGtvbW1lbiBzb2xsLlxyXG4gICAgKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgcmVuZGVyRmVsZElzdCA9IGZlbGRJc3RFZGl0b3IoICAgICAgICAgIC8vIGdpYnQgc2VpbmUgcmVuZGVyLUZ1bmt0aW9uIHp1clx1MDBGQ2NrLFxyXG4gICAgICAgIGR2LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gYHJlbmRlckZ1enp5YCAtPiBkYXMgaXN0IGRhbm5cclxuICAgICAgICBjZWxsQjIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWUgQ2FsbGJhY2tGbiwgZGllIGFuIGBwU3RhdHVzRWRpdG9yYFxyXG4gICAgICAgIG1ldGFFZGl0U3RhdGUgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MDBGQ2JlcmdlYmVuIHVuZCBkb3J0IGJlaW0gQW5rbGlja2VuIFxyXG4gICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlciBDaGVja2JveCBhdXNnZWZcdTAwRkNocnQgd2lyZC5cclxufVxyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBdUI7OztBQ0F2QixzQkFBeUI7OztBQ1lsQixTQUFTLGVBQWVDLE1BQUs7QUFacEM7QUFhRSxVQUFPLHVCQUFBQSxRQUFBLGdCQUFBQSxLQUFLLFlBQUwsbUJBQWMsWUFBZCxtQkFBdUIsYUFBdkIsbUJBQWlDLFFBQWpDLFlBQXdDO0FBQ2pEOzs7QURYTyxJQUFNLGlCQUFpQjtBQU12QixJQUFNLFdBQU4sY0FBdUIseUJBQVM7QUFBQSxFQUNyQyxjQUFjO0FBQ1osV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGlCQUFpQjtBQUNmLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxVQUFVO0FBQ1IsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sU0FBUztBQUNiLFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFBQSxFQUVBLE1BQU0sVUFBVTtBQUNkLFNBQUssVUFBVSxNQUFNO0FBQUEsRUFDdkI7QUFBQSxFQUVBLFNBQVM7QUFDUCxVQUFNLE9BQU8sS0FBSztBQUNsQixTQUFLLE1BQU07QUFF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O0FBQ2xDLFFBQUksQ0FBQyxJQUFJO0FBQ1AsZ0JBQVUsU0FBUyxLQUFLO0FBQUEsUUFDdEIsTUFDRTtBQUFBLE1BRUosQ0FBQztBQUNEO0FBQUEsSUFDRjtBQUlBLFFBQUk7QUFDRixxQkFBZSxJQUFJLFNBQVM7QUFBQSxJQUM5QixTQUFTLEdBQUc7QUFDVixjQUFRLE1BQU0saUNBQWlDLENBQUM7QUFDaEQsWUFBTSxNQUFNLFVBQVUsU0FBUyxPQUFPO0FBQUEsUUFDcEMsTUFBTSw2QkFBNkIsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLE9BQU8sQ0FBQztBQUFBLE1BQ3RFLENBQUM7QUFDRCxVQUFJLE1BQU0sUUFBUTtBQUNsQixVQUFJLE1BQU0sYUFBYTtBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUFBLEVBRUEsVUFBVTtBQUNSLFNBQUssVUFBVSxNQUFNO0FBQUEsRUFDdkI7QUFDRjs7O0FIbENBLElBQXFCLGFBQXJCLGNBQXdDLHdCQUFPO0FBQUEsRUFDN0MsTUFBTSxTQUFTO0FBRWIsU0FBSyxhQUFhLGdCQUFnQixDQUFDLFNBQVMsSUFBSSxTQUFTLElBQUksQ0FBQztBQUc5RCxTQUFLLGNBQWMsb0JBQW9CLGFBQWEsTUFBTTtBQUN4RCxXQUFLLGFBQWE7QUFBQSxJQUNwQixDQUFDO0FBR0QsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sS0FBSyxhQUFhO0FBQUEsSUFDcEMsQ0FBQztBQUdELFNBQUssY0FBYyxvQkFBb0IsOEJBQThCLE1BQU07QUFDekUsVUFBSSxvQkFBb0IsS0FBSyxHQUFHLEVBQUUsS0FBSztBQUFBLElBQ3pDLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSxJQUFJLG9CQUFvQixLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQUEsSUFDekQsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFdBQVc7QUFBQSxFQUFDO0FBQUE7QUFBQTtBQUFBLEVBSVosTUFBTSxlQUFlO0FBQ25CLFVBQU0sRUFBRSxVQUFVLElBQUksS0FBSztBQUUzQixRQUFJLE9BQU8sVUFBVSxnQkFBZ0IsY0FBYyxFQUFFLENBQUM7QUFDdEQsUUFBSSxDQUFDLE1BQU07QUFDVCxhQUFPLFVBQVUsUUFBUSxJQUFJO0FBQzdCLFlBQU0sS0FBSyxhQUFhLEVBQUUsTUFBTSxnQkFBZ0IsUUFBUSxLQUFLLENBQUM7QUFBQSxJQUNoRTtBQUVBLGNBQVUsV0FBVyxJQUFJO0FBQUEsRUFDM0I7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImFwcCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiXQp9Cg==
