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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiLCAic3JjL3ZpZXcuanMiLCAic3JjL2R2QXBpLmpzIiwgInNyYy9tZXRhZGF0YUVkaXRvck1vZGFsLmpzIiwgInNoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanMiLCAic2hhcmVkL3V0aWxzL3ZhbHVlVXRpbHMuanMiLCAic2hhcmVkL3NlcnZpY2VzL21ldGFkYXRhU2VydmljZS5qcyIsICJzaGFyZWQvdXRpbHMvbmFtaW5nVXRpbHMuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VEaXNwbGF5TmFtZVNlcnZpY2UuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VMaW5rU2VydmljZS5qcyIsICJzaGFyZWQvc2VydmljZXMvcGFnZVJlZmVyZW5jZVNlcnZpY2UuanMiLCAic2hhcmVkL3NlcnZpY2VzL3BhZ2VOb3JtU2VydmljZS5qcyIsICJzaGFyZWQvc2VydmljZXMvcXVlcnlTZXJ2aWNlLmpzIiwgInNoYXJlZC9zZXJ2aWNlcy9lbnRpdHlTZXJ2aWNlLmpzIiwgImZlYXR1cmVzL21ldGFkYXRhRWRpdG9yL2VudGl0eUJ1dHRvbnMuanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvZnV6enlTZWFyY2guanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvZmVsZElzdEVkaXRvci5qcyIsICJzaGFyZWQvc2VydmljZXMvcFN0YXR1c1NlcnZpY2UuanMiLCAiZmVhdHVyZXMvbWV0YWRhdGFFZGl0b3IvcFN0YXR1c0VkaXRvci5qcyIsICJmZWF0dXJlcy9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IE9wbW5WaWV3LCBWSUVXX1RZUEVfT1BNTiB9IGZyb20gXCIuL3ZpZXcuanNcIjtcclxuaW1wb3J0IHsgTWV0YWRhdGFFZGl0b3JNb2RhbCB9IGZyb20gXCIuL21ldGFkYXRhRWRpdG9yTW9kYWwuanNcIjtcclxuXHJcbi8vIFBsdWdpbiBlbnRyeSBwb2ludC4gVGhpcyBpcyB0aGUgbmF0aXZlLXBsdWdpbiBlcXVpdmFsZW50IG9mIHRoZVxyXG4vLyBDb2RlU2NyaXB0IFRvb2xraXQgYHN0YXJ0dXAuanNgIGBpbnZva2UoYXBwKWAgZnVuY3Rpb246IGl0IHJ1bnMgb25jZSB3aGVuXHJcbi8vIE9ic2lkaWFuIGxvYWRzIHRoZSBwbHVnaW4gYW5kIGlzIHdoZXJlIHdlIHJlZ2lzdGVyIGV2ZXJ5dGhpbmcuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9wbW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG4gIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgIC8vIDEuIFJlZ2lzdGVyIG91ciBjdXN0b20gdmlldyB0eXBlLlxyXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX09QTU4sIChsZWFmKSA9PiBuZXcgT3BtblZpZXcobGVhZikpO1xyXG5cclxuICAgIC8vIDIuIFJpYmJvbiBpY29uIHRvIG9wZW4gdGhlIHZpZXcgKGxlZnQgdG9vbGJhcikuXHJcbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJsYXlvdXQtZGFzaGJvYXJkXCIsIFwiT3BlbiBPUE1OXCIsICgpID0+IHtcclxuICAgICAgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIDMuIENvbW1hbmQgcGFsZXR0ZSBlbnRyeSAoQ3RybC9DbWQtUCAtPiBcIk9QTU46IE9wZW4gdmlld1wiKS5cclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgIGlkOiBcIm9wZW4tb3Btbi12aWV3XCIsXHJcbiAgICAgIG5hbWU6IFwiT3BlbiB2aWV3XCIsXHJcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVmlldygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gNC4gU2Vjb25kIHJpYmJvbiBpY29uICsgY29tbWFuZDogb3BlbiB0aGUgTWV0YWRhdGEgZWRpdG9yIG1vZGFsLlxyXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwidGFibGUtcHJvcGVydGllc1wiLCBcIk9QTU46IE9wZW4gTWV0YWRhdGEgZWRpdG9yXCIsICgpID0+IHtcclxuICAgICAgbmV3IE1ldGFkYXRhRWRpdG9yTW9kYWwodGhpcy5hcHApLm9wZW4oKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgIGlkOiBcIm9wZW4tb3Btbi1tZXRhZGF0YS1lZGl0b3JcIixcclxuICAgICAgbmFtZTogXCJPcGVuIG1ldGFkYXRhIGVkaXRvclwiLFxyXG4gICAgICBjYWxsYmFjazogKCkgPT4gbmV3IE1ldGFkYXRhRWRpdG9yTW9kYWwodGhpcy5hcHApLm9wZW4oKSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb251bmxvYWQoKSB7fVxyXG5cclxuICAvLyBPcGVuIHRoZSBPUE1OIHZpZXcgaW4gYSBuZXcgdGFiLCByZXVzaW5nIGFuIGV4aXN0aW5nIG9uZSBpZiBpdCBpcyBhbHJlYWR5XHJcbiAgLy8gb3Blbi5cclxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XHJcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XHJcblxyXG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9PUE1OKVswXTtcclxuICAgIGlmICghbGVhZikge1xyXG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYodHJ1ZSk7IC8vIHRydWUgPSBvcGVuIGluIGEgbmV3IHRhYlxyXG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFZJRVdfVFlQRV9PUE1OLCBhY3RpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyBJdGVtVmlldyB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBnZXREYXRhdmlld0FwaSB9IGZyb20gXCIuL2R2QXBpLmpzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgVklFV19UWVBFX09QTU4gPSBcIm9wbW4tdmlld1wiO1xyXG5cclxuLy8gQSBjdXN0b20gdGFiL3ZpZXcuIGB0aGlzLmNvbnRlbnRFbGAgaXMgdGhlIGZ1bGwgY29udGVudCBhcmVhIG9mIHRoZSB0YWIgYW5kXHJcbi8vIGlzIHRoZSBwbHVnaW4gZXF1aXZhbGVudCBvZiB0aGUgY29udGFpbmVyIHlvdSB1c2VkIHRvIGdldCBiYWNrIGZyb21cclxuLy8gYGR2LmVsKC4uLilgLiBZb3UgYnVpbGQgaW50byBpdCB3aXRoIHRoZSBzYW1lIGBjcmVhdGVFbCguLi4pYCBBUEkgeW91IGFscmVhZHlcclxuLy8gdXNlIHRocm91Z2hvdXQgdGhlIGV4aXN0aW5nIGZlYXR1cmUgY29kZS5cclxuZXhwb3J0IGNsYXNzIE9wbW5WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xyXG4gIGdldFZpZXdUeXBlKCkge1xyXG4gICAgcmV0dXJuIFZJRVdfVFlQRV9PUE1OO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGlzcGxheVRleHQoKSB7XHJcbiAgICByZXR1cm4gXCJPUE1OXCI7XHJcbiAgfVxyXG5cclxuICBnZXRJY29uKCkge1xyXG4gICAgcmV0dXJuIFwibGF5b3V0LWRhc2hib2FyZFwiO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25PcGVuKCkge1xyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uQ2xvc2UoKSB7XHJcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xyXG4gICAgcm9vdC5lbXB0eSgpO1xyXG5cclxuICAgIHJvb3QuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT1BNTlwiIH0pO1xyXG5cclxuICAgIC8vIC0tLSBEYXRhdmlldyBjb25uZWN0aXZpdHkgY2hlY2sgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgY29uc3QgZHYgPSBnZXREYXRhdmlld0FwaSh0aGlzLmFwcCk7XHJcblxyXG4gICAgaWYgKCFkdikge1xyXG4gICAgICBjb25zdCBlcnIgPSByb290LmNyZWF0ZUVsKFwicFwiLCB7XHJcbiAgICAgICAgdGV4dDpcclxuICAgICAgICAgIFwiRGF0YXZpZXcgQVBJIG5vdCBmb3VuZC4gTWFrZSBzdXJlIHRoZSBEYXRhdmlldyBwbHVnaW4gaXMgaW5zdGFsbGVkIFwiICtcclxuICAgICAgICAgIFwiYW5kIGVuYWJsZWQsIHRoZW4gcmVvcGVuIHRoaXMgdmlldy5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIGVyci5zdHlsZS5jb2xvciA9IFwidmFyKC0tdGV4dC1lcnJvcilcIjtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhZ2VDb3VudCA9IGR2LnBhZ2VzKCkubGVuZ3RoO1xyXG4gICAgcm9vdC5jcmVhdGVFbChcInBcIiwge1xyXG4gICAgICB0ZXh0OiBgRGF0YXZpZXcgY29ubmVjdGVkIFxcdTIwMTQgJHtwYWdlQ291bnR9IHBhZ2VzIGluZGV4ZWQuYCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIC0tLSBGZWF0dXJlIG1vdW50IHBvaW50IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFRoaXMgaXMgd2hlcmUgZmVhdHVyZXMgKG1ldGFkYXRhRWRpdG9yLCBidWxrTWV0YUVkaXRvciwgLi4uKSB3aWxsIGJlXHJcbiAgICAvLyBtb3VudGVkIG5leHQuIFRoZXkgd2lsbCByZWNlaXZlIGBzbG90YCAoYSByZWFsIERPTSBlbGVtZW50KSBhcyB0aGVpclxyXG4gICAgLy8gY29udGFpbmVyIGFuZCBgZHZgICh0aGUgRGF0YXZpZXcgQVBJKSBmb3IgcXVlcmllcyAtLSB0aGUgc2FtZSB0d28gdGhpbmdzXHJcbiAgICAvLyB0aGV5IGdvdCB2aWEgYGR2LmVsKC4uLilgIGFuZCB0aGUgYGR2YCBhcmd1bWVudCBiZWZvcmUuXHJcbiAgICBjb25zdCBzbG90ID0gcm9vdC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJvcG1uLWZlYXR1cmUtc2xvdFwiIH0pO1xyXG4gICAgc2xvdC5jcmVhdGVFbChcInBcIiwge1xyXG4gICAgICB0ZXh0OlxyXG4gICAgICAgIFwiRmVhdHVyZSBtb3VudCBwb2ludC4gVGhlIG1ldGFkYXRhIGVkaXRvciBjdXJyZW50bHkgb3BlbnMgZnJvbSB0aGUgXCIgK1xyXG4gICAgICAgIFwiXFx1MjAxQ09QTU46IE1ldGFkYXRhIGVkaXRvclxcdTIwMUQgcmliYm9uIGljb24gKGFuZCBjb21tYW5kKS5cIixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiLy8gU2luZ2xlLCBjYW5vbmljYWwgd2F5IHRvIHJlYWNoIHRoZSBEYXRhdmlldyBwbHVnaW4ncyBKYXZhU2NyaXB0IEFQSSBmcm9tXHJcbi8vICpvdXRzaWRlKiBhIGBkYXRhdmlld2pzYCBjb2RlIGJsb2NrLlxyXG4vL1xyXG4vLyBJbnNpZGUgYSBgZGF0YXZpZXdqc2AgYmxvY2sgeW91IHdlcmUgaGFuZGVkIGEgYGR2YCBvYmplY3QgKGFcclxuLy8gRGF0YXZpZXdJbmxpbmVBcGkpLiBGcm9tIGEgcGx1Z2luIHdlIGluc3RlYWQgZ3JhYiB0aGUgZ2xvYmFsIERhdGF2aWV3IEFQSVxyXG4vLyAoYSBEYXRhdmlld0FwaSkuIEl0IGV4cG9zZXMgdGhlIHF1ZXJ5IGhlbHBlcnMgd2UgcmVseSBvbiAtLSBgZHYucGFnZXMoLi4uKWAsXHJcbi8vIGBkdi5wYWdlKHBhdGgpYCwgYGR2LnBhZ2VQYXRocyguLi4pYCwgYGR2LmluZGV4YCAtLSBidXQgTk9UIHRoZSByZW5kZXJpbmdcclxuLy8gaGVscGVycyAoYGR2LmVsYCwgYGR2LnRhYmxlYCwgLi4uKS4gV2UgZG9uJ3QgbmVlZCB0aG9zZSBhbnltb3JlOiBpbiBhIHBsdWdpblxyXG4vLyB3ZSBidWlsZCBET00gd2l0aCB0aGUgZWxlbWVudCdzIG93biBgY3JlYXRlRWwoLi4uKWAgaW5zdGVhZC5cclxuLy9cclxuLy8gUmV0dXJucyBgbnVsbGAgd2hlbiBEYXRhdmlldyBpcyBub3QgaW5zdGFsbGVkIC8gbm90IHlldCBsb2FkZWQsIHNvIGNhbGxlcnNcclxuLy8gY2FuIHNob3cgYSBmcmllbmRseSBtZXNzYWdlIGluc3RlYWQgb2YgY3Jhc2hpbmcuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRhdmlld0FwaShhcHApIHtcclxuICByZXR1cm4gYXBwPy5wbHVnaW5zPy5wbHVnaW5zPy5kYXRhdmlldz8uYXBpID8/IG51bGw7XHJcbn1cclxuXHJcbiIsICJpbXBvcnQgeyBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBnZXREYXRhdmlld0FwaSB9IGZyb20gXCIuL2R2QXBpLmpzXCI7XHJcbmltcG9ydCB7IG1ldGFkYXRhRWRpdG9yIH0gZnJvbSBcIi4uL2ZlYXR1cmVzL21ldGFkYXRhRWRpdG9yL21ldGFkYXRhRWRpdG9yLmpzXCI7XHJcblxyXG4vLyBBIG1vZGFsIGRpYWxvZyB0aGF0IGhvc3RzIHRoZSBgbWV0YWRhdGFFZGl0b3JgIGZlYXR1cmUuIGB0aGlzLmNvbnRlbnRFbGAgaXNcclxuLy8gdGhlIG1vZGFsIGJvZHkgYW5kIGlzIGhhbmRlZCB0byB0aGUgZmVhdHVyZSBhcyBpdHMgbW91bnQgZWxlbWVudCwgdG9nZXRoZXJcclxuLy8gd2l0aCB0aGUgRGF0YXZpZXcgQVBJICh1c2VkIGZvciB0aGUgcXVlcmllcyB0aGUgZmVhdHVyZSBydW5zKS5cclxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhRWRpdG9yTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XHJcbiAgb25PcGVuKCkge1xyXG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJNZXRhZGF0YSBlZGl0b3JcIik7XHJcblxyXG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuXHJcbiAgICBjb25zdCBkdiA9IGdldERhdGF2aWV3QXBpKHRoaXMuYXBwKTtcclxuICAgIGlmICghZHYpIHtcclxuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XHJcbiAgICAgICAgdGV4dDpcclxuICAgICAgICAgIFwiRGF0YXZpZXcgQVBJIG5vdCBmb3VuZC4gTWFrZSBzdXJlIHRoZSBEYXRhdmlldyBwbHVnaW4gaXMgaW5zdGFsbGVkIFwiICtcclxuICAgICAgICAgIFwiYW5kIGVuYWJsZWQuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVuZGVyIHRoZSBmZWF0dXJlLiBXcmFwcGVkIHNvIGEgcnVudGltZSBlcnJvciBzaG93cyBpbnNpZGUgdGhlIG1vZGFsXHJcbiAgICAvLyBpbnN0ZWFkIG9mIGZhaWxpbmcgc2lsZW50bHkuXHJcbiAgICB0cnkge1xyXG4gICAgICBtZXRhZGF0YUVkaXRvcihkdiwgY29udGVudEVsKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIltPUE1OXSBtZXRhZGF0YUVkaXRvciBmYWlsZWQ6XCIsIGUpO1xyXG4gICAgICBjb25zdCBlcnIgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xyXG4gICAgICAgIHRleHQ6IFwibWV0YWRhdGFFZGl0b3IgZXJyb3I6XFxuXCIgKyAoZSAmJiBlLnN0YWNrID8gZS5zdGFjayA6IFN0cmluZyhlKSksXHJcbiAgICAgIH0pO1xyXG4gICAgICBlcnIuc3R5bGUuY29sb3IgPSBcInZhcigtLXRleHQtZXJyb3IpXCI7XHJcbiAgICAgIGVyci5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmUtd3JhcFwiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25DbG9zZSgpIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgfVxyXG59XHJcbiIsICJcclxuLy8vL1xyXG4vLyBGVVpaWSBTRVJWSUNFIChtaW5pbWFsKVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNjb3JlRnV6enkodXNlcklucHV0U3RyaW5nLCBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyKSB7XHJcbiAgICBcclxuICAgIGlmICghdXNlcklucHV0U3RyaW5nIHx8ICFzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyKSByZXR1cm4gMDtcclxuXHJcbiAgICBjb25zdCBxVG9rZW5zID0gdXNlcklucHV0U3RyaW5nLnRvTG93ZXJDYXNlKCkudHJpbSgpLnNwbGl0KC9cXHMrLyk7XHJcbiAgICBjb25zdCByYXdUZXh0ID0gc2VhcmNoYWJsZUZpZWxkc09mUGFnZVN0cjtcclxuICAgIGNvbnN0IHQgPSBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlU3RyLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gMS4gU1RSVUNUVVJFLUFXQVJFIE1BVENIXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IHQuc3BsaXQoXCIgXyBcIikubWFwKHMgPT4gcy50cmltKCkpO1xyXG5cclxuICAgIGxldCBzZWdJbmRleCA9IDA7XHJcbiAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgbGV0IG1hdGNoZWRBbGwgPSB0cnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgcVRva2Vucykge1xyXG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB3aGlsZSAoc2VnSW5kZXggPCBzZWdtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKHNlZ21lbnRzW3NlZ0luZGV4XS5pbmNsdWRlcyh0b2tlbikpIHtcclxuICAgICAgICAgICAgICAgIHNjb3JlICs9IDIwOyAvLyBzdHJvbmcgd2VpZ2h0IGZvciBzdHJ1Y3R1cmFsIG1hdGNoXHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzZWdJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VnSW5kZXgrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgbWF0Y2hlZEFsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZnVsbCBzdHJ1Y3R1cmVkIHN1Y2Nlc3MgXHUyMTkyIHJldHVybiBlYXJseVxyXG4gICAgaWYgKG1hdGNoZWRBbGwpIHtcclxuICAgICAgICByZXR1cm4gc2NvcmUgKyA1MDsgLy8gc3Ryb25nIGJvbnVzIGZvciBmdWxsIHBhdGggbWF0Y2hcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyAyLiBGQUxMQkFDSyBGVVpaWSBNQVRDSFxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIHJlc2V0IGZvciBmYWxsYmFja1xyXG4gICAgbGV0IHBvcyA9IDA7XHJcbiAgICBsZXQgZmFsbGJhY2tTY29yZSA9IDA7XHJcblxyXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiBxVG9rZW5zKSB7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gdC5pbmRleE9mKHRva2VuLCBwb3MpO1xyXG4gICAgICAgIGlmIChpZHggPT09IC0xKSByZXR1cm4gMDtcclxuXHJcbiAgICAgICAgZmFsbGJhY2tTY29yZSArPSA1O1xyXG4gICAgICAgIHBvcyA9IGlkeCArIHRva2VuLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsbGJhY2tTY29yZTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByYW5rRnV6enkoXHJcbiAgICAgICAgdXNlcklucHV0U3RyaW5nLCBcclxuICAgICAgICBlbnRUeXBlQ2FuZGlkYXRlUGFnZXMsXHJcbiAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvclxyXG4gICAgKXtcclxuICAgIFxyXG4gICAgaWYgKCF1c2VySW5wdXRTdHJpbmcpXHJcbiAgICAgICAgcmV0dXJuIGVudFR5cGVDYW5kaWRhdGVQYWdlcztcclxuXHJcbiAgICBjb25zdCBzY29yZWQgPSBlbnRUeXBlQ2FuZGlkYXRlUGFnZXMubWFwKGVudFBhZ2UgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VTdHIgPSBcclxuICAgICAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvcihlbnRQYWdlKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpdGVtOiBlbnRQYWdlLFxyXG4gICAgICAgICAgICBzY29yZTogc2NvcmVGdXp6eSh1c2VySW5wdXRTdHJpbmcsIHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VTdHIpXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzY29yZWRcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5zY29yZSA+IDApXHJcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlKVxyXG4gICAgICAgIC5tYXAoeCA9PiB4Lml0ZW0pO1xyXG59XHJcblxyXG4iLCAiXHJcblxyXG4vKipcclxuICogV2FuZGVsdCBXZXJ0IGluIFN0cmluZyB1bS5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9TdHJpbmdWYWx1ZSh2YWwpIHtcclxuICAgIGlmICh2YWwgPT0gbnVsbCkgcmV0dXJuIFwiXCI7XHJcblxyXG4gICAgaWYgKCBcclxuICAgICAgICAodHlwZW9mIHZhbCAgPT09IFwic3RyaW5nXCIgJiYgdmFsLmluY2x1ZGVzKFwiW1tcIikpIFxyXG4gICAgICAgIHx8ICh0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiICYmIHZhbC5wYXRoKVxyXG4gICAgKSByZXR1cm4gdmFsLnBhdGg7XHJcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHZhbDtcclxuICAgIGlmICh0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsLCBudWxsLCAyKTtcclxuICAgIHJldHVybiBTdHJpbmcodmFsKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBXYW5kZWx0IFdlcnQgaW4gYWJnZWZsYWNodGVuIEFycmF5IHVtIChvcHRpb25hbDogYWxsZSBlbnRoYWx0ZW5lbiBcclxuICogV2VydGUgYWxzIFN0cmluZ3MpXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkoeCwgYXNTdHJpbmcgPSBmYWxzZSkge1xyXG4gICAgaWYgKCF4KSByZXR1cm4gW107XHJcbiAgICBsZXQgYXJyID0gQXJyYXkuaXNBcnJheSh4KSBcclxuICAgICAgICA/IChBcnJheS5pc0FycmF5KHhbMF0pIFxyXG4gICAgICAgICAgICA/IHguZmxhdChJbmZpbml0eSkgXHJcbiAgICAgICAgICAgIDogeCkgXHJcbiAgICAgICAgOiBbeF07XHJcbiAgICBpZiAoYXNTdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gYXJyLm1hcCh2ID0+IHRvU3RyaW5nVmFsdWUodikpLmZpbHRlcihCb29sZWFuKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IHRvQXJyYXkgfSBmcm9tIFwiLi4vdXRpbHMvdmFsdWVVdGlscy5qc1wiO1xyXG5cclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIEVpbnplbG5lbiBGZWxkd2VydCBhYmZyYWdlbi4gV2lyZCB2ZXJ3ZW5kZXQgaW4gZHZMaW5rU3VjaGVBdXNmdWVocmVuLiBcclxuICogV2VpXHUwMERGIG5pY2h0LCBvYiBkYXMgZWluZW4gVW50ZXJzY2hpZWQgbWFjaGVuIHdcdTAwRkNyZGUsIHN0YXR0ZGVzc2VuXHJcbiAqIGVpbnplbG5lckZlbGRXZXJ0VmVyc2NoYWNodGVsdCB6dSB2ZXJ3ZW5kZW4gKHVtIGRpZSBoaWVyIGxcdTAwRjZzY2hlbiB6dSBrXHUwMEY2bm5lbikuXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVpbnplbG5lckZlbGRXZXJ0KGR2UGFnZSwgZmVsZCkge1xyXG4gIHJldHVybiBmZWxkLnNwbGl0KFwiLlwiKS5yZWR1Y2UoKG8sIGspID0+IG8/LltrXSwgZHZQYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBMaXN0ZSB2b24gRmVsZGVybiBhYmZyYWdlbiA9PiBMaXN0ZSB2b24gV2VydGVuIHp1clx1MDBGQ2NrLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbGxlRmVsZFdlcnRlKGR2LCBkdlBhZ2UsIGZlbGRMaXN0ZSkge1xyXG5cdCAgaWYgKCAhQXJyYXkuaXNBcnJheShmZWxkTGlzdGUpICkgcmV0dXJuIFtdO1xyXG5cdCAgcmV0dXJuIGZlbGRMaXN0ZVxyXG5cdCAgICAuZmxhdE1hcChmID0+IHRvQXJyYXkoIGVpbnplbG5lckZlbGRXZXJ0VmVyc2NoYWNodGVsdChkdiwgZHZQYWdlLCBmKSApKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZWluemVsbmVyRmVsZFdlcnRWZXJzY2hhY2h0ZWx0KGR2LCBzZWl0ZSwgZmVsZCkge1xyXG4gIGlmICghc2VpdGUpIHJldHVybiBbXTtcclxuICBjb25zdCBrZXlzID0gZmVsZC5zcGxpdChcIi5cIik7XHJcbiAgbGV0IGN1cnJlbnQgPSBbc2VpdGVdOyAvLyBhbHdheXMgd29yayB3aXRoIGFycmF5c1xyXG4gIFxyXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcclxuICAgIGN1cnJlbnQgPSBjdXJyZW50LmZsYXRNYXAoaXRlbSA9PiB7XHJcbiAgICAgIGlmICghaXRlbSkgcmV0dXJuIFtdO1xyXG4gICAgICAvLyByZXNvbHZlIGxpbmsgdG8gcGFnZVxyXG4gICAgICBpZiAoaXRlbT8ucGF0aCAmJiBpdGVtPy50eXBlID09PSBcImZpbGVcIikge1xyXG4gICAgICAgIGNvbnN0IHAgPSBkdi5wYWdlKGl0ZW0ucGF0aCk7XHJcbiAgICAgICAgaWYgKCFwKSByZXR1cm4gW107XHJcbiAgICAgICAgaXRlbSA9IHA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHZhbCA9IGl0ZW1ba2V5XTtcclxuICAgICAgaWYgKCF2YWwpIHJldHVybiBbXTtcclxuICAgICAgaWYgKHZhbD8ucGF0aCAmJiB2YWw/LnR5cGUgPT09IFwiZmlsZVwiKSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGR2LnBhZ2UodmFsLnBhdGgpOyAvLyBpZiB2YWwgaXMgYSBsaW5rLCByZXNvbHZlIHRvIHBhZ2VcclxuICAgICAgICByZXR1cm4gcCA/IFtwXSA6IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbCkgPyB2YWwgOiBbdmFsXTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gdG9BcnJheShjdXJyZW50KTtcclxufVxyXG5cclxuXHJcbi8qKiBcclxuICogV2FocnNjaGVpbmxpY2ggXHUwMEZDYmVyZmxcdTAwRkNzc2luZywgd2VpbCBpY2ggXHUwMEZDYmVyYWxsIGR2IHBhZ2UtT2JqZWt0IFxyXG4gKiB2ZXJ3ZW5kZW4gd2lsbC4uLlxyXG4gKiBTY2hyZWlidCBiZWxpZWJpZ2UgV2VydGUgaW4gZWluIE1ldGFkYXRlbmZlbGQgZWluZXIgU2VpdGUgKHBhdGgpXHJcbiAqIChhdWNoIHZlcnNjaGFjaHRlbHRlIEZlbGRlciB3aWUgbWVkLnRpdGVsKVxyXG4gKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVGaWVsZEJ5UGF0aChmUGF0aCwgZmllbGRQYXRoLCB2YWx1ZSkge1xyXG4gICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGZQYXRoKTtcclxuICAgIGlmICghZmlsZSkgcmV0dXJuO1xyXG5cclxuICAgIGF3YWl0IHVwZGF0ZUZpZWxkKGZpbGUsIGZpZWxkUGF0aCwgdmFsdWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFNjaHJlaWJ0IGJlbGllYmlnZSBXZXJ0ZSBpbiBlaW4gTWV0YWRhdGVuZmVsZCBlaW5lciBTZWl0ZSAoZHZQYWdlLU9iamVrdClcclxuICogKGF1Y2ggdmVyc2NoYWNodGVsdGUgRmVsZGVyIHdpZSBtZWQudGl0ZWwpXHJcbiAqL1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUZpZWxkQnlEVlBhZ2UoZHZQYWdlLCBmaWVsZFBhdGgsIHZhbHVlKSB7XHJcbiAgICBjb25zdCBmUGF0aCA9IGR2UGFnZT8uZmlsZT8ucGF0aDtcclxuICAgIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChmUGF0aCk7XHJcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcclxuXHJcbiAgICBhd2FpdCB1cGRhdGVGaWVsZChmaWxlLCBmaWVsZFBhdGgsIHZhbHVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBTY2hyZWlidCBiZWxpZWJpZ2UgV2VydGUgaW4gZWluIE1ldGFkYXRlbmZlbGQgZWluZXIgU2VpdGUgKFRGaWxlKVxyXG4gKiAoYXVjaCB2ZXJzY2hhY2h0ZWx0ZSBGZWxkZXIgd2llIG1lZC50aXRlbClcclxuICovXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlRmllbGQodEZpbGUsIGZpZWxkUGF0aCwgdmFsdWUpIHtcclxuICAgIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIodEZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBrZXlzID0gZmllbGRQYXRoLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICBjb25zdCBsYXN0S2V5ID0ga2V5cy5wb3AoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0ga2V5cy5yZWR1Y2UoKG9iaiwga2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghb2JqW2tleV0pIHsgb2JqW2tleV0gPSB7fTsgfVxyXG4gICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XHJcbiAgICAgICAgfSwgZnJvbnRtYXR0ZXIpO1xyXG5cclxuICAgICAgICB0YXJnZXRbbGFzdEtleV0gPSB2YWx1ZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIExcdTAwRjZzY2h0IHZvcmhhbmRlbmUgRnJvbnRtYXR0ZXItTWV0YWRhdGVuIHZvbGxzdFx1MDBFNG5kaWcgdW5kIGVyc2V0enQgc2llXHJcbiAqIGR1cmNoIGdlZ2ViZW5lIG5ldWUgKE1ldGFkYXRlbi1PYmpla3QpLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVFbnRpcmVGcm9udG1hdHRlcihmaWxlLCBuZXdGcm9udE9iaiA9IHt9KSB7XHJcbiAgICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZyb250bWF0dGVyKSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcImlkXCIpIGRlbGV0ZSBmcm9udG1hdHRlcltrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBPYmplY3QuYXNzaWduKGZyb250bWF0dGVyLCBuZXdGcm9udE9iaik7XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVGaWVsZEJ5RFZQYWdlKGR2UGFnZSwgZmllbGRQYXRoKSB7XHJcbiAgICBjb25zdCBwYWdlUGF0aCA9IGR2UGFnZT8uZmlsZT8ucGF0aDtcclxuICAgIGNvbnN0IHRGaWxlID0gYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgocGFnZVBhdGgpO1xyXG4gICAgaWYgKCF0RmlsZSkgcmV0dXJuO1xyXG5cclxuICAgIGF3YWl0IGRlbGV0ZUZpZWxkKHRGaWxlLCBmaWVsZFBhdGgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIExcdTAwRjZzY2h0IGJlbGllYmlnZXMgRmVsZCBlaW5lciBTZWl0ZS5cclxuICogV0FSTklOR1xyXG4gKiBoaWRkZW4gYnVnIGluIHlvdXIgZGVsZXRlRmllbGQoKVxyXG4gKiBUaGlzIGlzIGRhbmdlcm91czpcclxuICogaWYgKCFvYmpba2V5XSkgeyBvYmpba2V5XSA9IHt9OyB9XHJcbiAqIGJlY2F1c2UgZGVsZXRpb24gc2hvdWxkIG5ldmVyIGNyZWF0ZSBtaXNzaW5nIHN0cnVjdHVyZXMuXHJcbiAqIFxyXG4gKiBCZXNzZXI6XHJcbiBcclxuICAgICAgICBjb25zdCB0YXJnZXQgPSBrZXlzLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFvYmpba2V5XSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICB9LCBmcm9udG1hdHRlcik7XHJcblxyXG4gICAgICAgIGlmICghdGFyZ2V0KSByZXR1cm47XHJcblxyXG4gICAgICAgIGRlbGV0ZSB0YXJnZXRbbGFzdEtleV07XHJcblxyXG4gKlxyXG4gKi9cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUZpZWxkKHRGaWxlLCBmaWVsZFBhdGgpIHtcclxuICAgIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIodEZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGtleXMgPSBmaWVsZFBhdGguc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGNvbnN0IGxhc3RLZXkgPSBrZXlzLnBvcCgpO1xyXG5cclxuICAgICAgICBjb25zdCB0YXJnZXQgPSBrZXlzLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFvYmpba2V5XSkgeyBvYmpba2V5XSA9IHt9OyB9XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICB9LCBmcm9udG1hdHRlcik7XHJcblxyXG4gICAgICAgIGRlbGV0ZSB0YXJnZXRbbGFzdEtleV07XHJcbiAgICB9KVxyXG59XHJcblxyXG4iLCAiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3BsaXROYW1lKHN0cikge1xyXG4gICAgaWYgKHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiO1xyXG4gICAgY29uc3Qgc3BsaXRBcnIgPSBzdHIuc3BsaXQoXCIgXyBcIik7XHJcbiAgICByZXR1cm4gc3BsaXRBcnJbc3BsaXRBcnIubGVuZ3RoLTFdO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUXHJcblxyXG5pbXBvcnQgeyBzcGxpdE5hbWUgfSBmcm9tIFwiLi4vdXRpbHMvbmFtaW5nVXRpbHMuanNcIjtcclxuXHJcblxyXG4vKipcclxuICogU2VpdGVubGluayBiZW5lbm5lbiB1bmQgYW56ZWlnZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhZ2VEaXNwbGF5TmFtZShkdiwgcGFnZVJlZikge1xyXG5cdFxyXG4gICAgY29uc3QgZHZQYWdlID0gcGFnZVJlZi5kdlBhZ2U7XHJcbiAgICBcclxuICAgIGlmICghZHZQYWdlPy5maWxlPy5wYXRoKSBcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogbnVsbCxcclxuICAgICAgICAgICAgZGlzcGxheU5hbWVTb3VyY2U6IG51bGxcclxuICAgICAgICB9O1xyXG5cdFxyXG5cdGNvbnN0IGZpZWxkSXN0ID0gZHZQYWdlLmlzdDtcclxuXHRjb25zdCBmaWVsZFRpdGVsID0gZHZQYWdlLnRpdGVsO1xyXG5cdGNvbnN0IGZpZWxkTWVkVGl0ZWwgPSBkdlBhZ2UubWVkPy50aXRlbDtcclxuXHRjb25zdCBwYWdlTmFtZSA9IGR2UGFnZS5maWxlLm5hbWU7XHJcblx0Y29uc3QgbmFtZUlEb25seSA9IC9eXFxkezR9LVxcZHsyfS1cXGR7Mn0gXyBcXGR7Mn0tXFxkezJ9LVxcZHsyfSQvLnRlc3QocGFnZU5hbWUpO1xyXG5cdFxyXG5cdGxldCBkaXNwbGF5TmFtZSwgZGlzcGxheU5hbWVTb3VyY2U7XHJcblxyXG5cdGlmIChuYW1lSURvbmx5KSB7XHJcblxyXG5cdFx0aWYgKGZpZWxkVGl0ZWwgJiYgdHlwZW9mIGZpZWxkVGl0ZWwgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRUaXRlbDtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJ0aXRlbFwiO1xyXG5cdFx0fSBcclxuXHRcdFxyXG5cdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmaWVsZE1lZFRpdGVsKSAmJiBmaWVsZE1lZFRpdGVsLmxlbmd0aCA+IDApIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRNZWRUaXRlbFswXTtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJtZWQuaW4udGl0ZWxcIjtcclxuXHRcdH0gXHJcblx0XHRcclxuXHRcdGVsc2UgaWYgKGZpZWxkTWVkVGl0ZWwpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRNZWRUaXRlbDtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJtZWQuaW4udGl0ZWxcIjtcclxuXHRcdH0gXHJcblx0XHRcclxuXHRcdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZmllbGRJc3QpICYmIGZpZWxkSXN0Lmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0ZGlzcGxheU5hbWUgPSBmaWVsZElzdFswXS5wYXRoO1xyXG5cdFx0ZGlzcGxheU5hbWVTb3VyY2UgPSBcImlzdFwiO1xyXG5cdFx0fSBcclxuXHRcdFxyXG5cdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmaWVsZElzdCkpIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gZmllbGRJc3RcclxuXHRcdFx0Lm1hcChpc3RWYWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzdFZhbD8uZmlsZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNwbGl0TmFtZShpc3RWYWwuZmlsZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRmVobGVyXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblx0XHRcdH0pLmpvaW4oXCIsIFwiKTtcclxuXHRcdFxyXG5cdFx0XHRkaXNwbGF5TmFtZVNvdXJjZSA9IFwiaXN0XCI7XHJcblx0XHR9IFxyXG5cdFx0XHJcblx0XHRlbHNlIHtcclxuXHRcdCAgICBkaXNwbGF5TmFtZSA9IFwiTm90aXpcIjtcclxuXHRcdH07XHJcblx0fSBcclxuXHRcclxuXHRlbHNlIHtcclxuXHRcdGRpc3BsYXlOYW1lID0gc3BsaXROYW1lKHBhZ2VOYW1lKTtcclxuXHRcdGRpc3BsYXlOYW1lU291cmNlID0gXCJmaWxlLm5hbWVcIjtcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0ZGlzcGxheU5hbWUsXHJcblx0XHRkaXNwbGF5TmFtZVNvdXJjZVxyXG5cdH07XHJcbn1cclxuXHJcbiIsICJcclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1dpa2lMaW5rKHBhZ2VSZWYpIHtcclxuICAgIGlmICghcGFnZVJlZj8ucGF0aCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGBbWyR7cGFnZVJlZi5wYXRoLnJlcGxhY2UoL1xcLm1kJC8sIFwiXCIpfV1dYDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1dpa2lMaW5rV2l0aEFsaWFzKHBhZ2VSZWYsIGFsaWFzKSB7XHJcbiAgICBpZiAoIXBhZ2VSZWY/LnBhdGgpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiBcclxuICAgIGlmICghYWxpYXMgfHwgdHlwZW9mIGFsaWFzICE9PSBcInN0cmluZ1wiKSBcclxuICAgICAgICByZXR1cm4gdG9XaWtpTGluayhwYWdlUmVmKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGBbWyR7cGFnZVJlZi5wYXRoLnJlcGxhY2UoL1xcLm1kJC8sIFwiXCIpfXwke2FsaWFzfV1dYDtcclxufVxyXG5cclxuIiwgIlxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQYWdlUmVmZXJlbmNlKGR2LCBwKSB7XHJcblxyXG4gICAgbGV0IHBhdGggPSBudWxsO1xyXG5cclxuICAgIGlmIChwPy5maWxlPy5wYXRoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gRFYgcGFnZVxyXG4gICAgICAgIHBhdGggPSBwLmZpbGUucGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIGlmIChwPy5wYXRoICYmIHA/LnR5cGUgPT09IFwiZmlsZVwiKSB7ICAgLy8gRFYgbGlua1xyXG4gICAgICAgIHBhdGggPSBwLnBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHAgPT09IFwic3RyaW5nXCIpIHsgICAgICAgLy8gcGF0aCBzdHJpbmdcclxuICAgICAgICBwYXRoID0gcDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBleGlzdHMgPSAhIShcclxuICAgICAgICBwYXRoICYmXHJcbiAgICAgICAgZHYucGFnZShwYXRoKT8uZmlsZT8ucGF0aFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGV4aXN0cyxcclxuXHJcbiAgICAgICAgcGF0aDogZXhpc3RzXHJcbiAgICAgICAgICAgID8gZHYucGFnZShwYXRoKS5maWxlLnBhdGhcclxuICAgICAgICAgICAgOiBudWxsLFxyXG5cclxuICAgICAgICBuYW1lOiBleGlzdHNcclxuICAgICAgICA/IGR2LnBhZ2UocGF0aCkuZmlsZS5uYW1lXHJcbiAgICAgICAgOiBudWxsLFxyXG5cclxuICAgICAgICBnZXQgZHZQYWdlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhcclxuICAgICAgICAgICAgPyBkdi5wYWdlKHRoaXMucGF0aClcclxuICAgICAgICAgICAgOiBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0IHRGaWxlKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXRoXHJcbiAgICAgICAgICAgICAgICA/IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRoaXMucGF0aClcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUXHJcblxyXG5pbXBvcnQgeyBnZXRQYWdlRGlzcGxheU5hbWUgfSBmcm9tIFwiLi9wYWdlRGlzcGxheU5hbWVTZXJ2aWNlLmpzXCI7XHJcbmltcG9ydCB7IHRvV2lraUxpbmssIHRvV2lraUxpbmtXaXRoQWxpYXMgfSBmcm9tIFwiLi9wYWdlTGlua1NlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgcmVzb2x2ZVBhZ2VSZWZlcmVuY2UgfSBmcm9tIFwiLi9wYWdlUmVmZXJlbmNlU2VydmljZS5qc1wiO1xyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkge1xyXG5cclxuICAgIGNvbnN0IHBhZ2VSZWYgPSByZXNvbHZlUGFnZVJlZmVyZW5jZShkdiwgcCk7XHJcblxyXG4gICAgY29uc3Qgbm9ybU9iamVjdCA9IHtcclxuICAgICAgICByZWY6IG51bGwsXHJcbiAgICAgICAgZ2V0IGR2UGFnZSgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmPy5kdlBhZ2UgPz8gbnVsbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIHBhdGg6IG51bGwsXHJcbiAgICAgICAgZGlzcGxheU5hbWU6IG51bGwsXHJcbiAgICAgICAgd2lraUxpbms6IG51bGwsXHJcbiAgICAgICAgZGlzcGxheUxpbms6IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFwYWdlUmVmLmV4aXN0cykgXHJcbiAgICAgICAgcmV0dXJuIG5vcm1PYmplY3Q7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IHBhZ2VSZWYubmFtZTtcclxuICAgIGNvbnN0IHBhdGggPSBwYWdlUmVmLnBhdGg7XHJcbiAgICBjb25zdCBkaXNwbGF5TmFtZSA9IGdldFBhZ2VEaXNwbGF5TmFtZShkdiwgcGFnZVJlZikuZGlzcGxheU5hbWU7XHJcbiAgICBub3JtT2JqZWN0LnJlZiA9IHBhZ2VSZWY7XHJcbiAgICBub3JtT2JqZWN0Lm5hbWUgPSBuYW1lO1xyXG4gICAgbm9ybU9iamVjdC5wYXRoID0gcGF0aDtcclxuICAgIG5vcm1PYmplY3QuZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZTtcclxuICAgIG5vcm1PYmplY3Qud2lraUxpbmsgPSB0b1dpa2lMaW5rKHBhZ2VSZWYpO1xyXG4gICAgbm9ybU9iamVjdC5kaXNwbGF5TGluayA9IHRvV2lraUxpbmtXaXRoQWxpYXMocGFnZVJlZiwgZGlzcGxheU5hbWUpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbm9ybU9iamVjdDtcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgdG9BcnJheSB9IGZyb20gXCIuLi91dGlscy92YWx1ZVV0aWxzLmpzXCI7XHJcbmltcG9ydCB7IGVpbnplbG5lckZlbGRXZXJ0IH0gZnJvbSBcIi4vbWV0YWRhdGFTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLy8vLyBcclxuLy8gTElOSy1SXHUwMERDQ0tXXHUwMEM0UlRTU1VDSEVcclxuXHJcbi8qKiBcclxuICogRGllIGJlclx1MDBGQ2htdGUgTGluay1SXHUwMEZDY2t3XHUwMEU0cnRzc3VjaGVcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZMaW5rU3VjaGUoXHJcbiAgICAgICAgZHYsIFxyXG4gICAgICAgIGxpc3RlU3VjaFNlaXRlbiwgXHJcbiAgICAgICAgbGlzdGVTdWNoRmVsZGVyLCBcclxuICAgICAgICBzdWNodGllZmUsIFxyXG4gICAgICAgIHVuZE9kZXJPcHRpb24gICAgICAvLyBmYWxzZSA9IG9kZXIsIHRydWUgPSB1bmRcclxuICAgICkge1xyXG4gICAgaWYgKCFsaXN0ZVN1Y2hTZWl0ZW4/Lmxlbmd0aCB8fCAhbGlzdGVTdWNoRmVsZGVyPy5sZW5ndGgpIHJldHVybiBbXTtcclxuICAgIGNvbnN0IGxpbmtTdWNoZUVyZ2VibmlzID0gbGlzdGVTdWNoU2VpdGVuXHJcbiAgICAgICAgLm1hcChzdHIgPT4gZHYucGFnZShzdHIpKVxyXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgICAgICAubWFwKHNvYmogPT4gZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgICAgICBkdixcclxuICAgICAgICAgICAgc29iaixcclxuICAgICAgICAgICAgbGlzdGVTdWNoRmVsZGVyLFxyXG4gICAgICAgICAgICBzdWNodGllZmVcclxuICAgICAgICApKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHVuZE9kZXJBdXN3ZXJ0ZW4obGlua1N1Y2hlRXJnZWJuaXMsIHVuZE9kZXJPcHRpb24pO1xyXG59XHJcblxyXG5cclxuLyoqIFxyXG4gKiB3aXJkIHZvbiBkdkxpbmtTdWNoZSBhdWZnZXJ1ZmVuXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgIGR2LFxyXG4gICAgICAgIHBhZ2UsXHJcbiAgICAgICAgc2ZpZWxkcyxcclxuICAgICAgICBzdWNodGllZmUsXHJcbiAgICAgICAgZGVwdGggPSAwLFxyXG4gICAgICAgIHNlZW4gPSBuZXcgU2V0KClcclxuICAgICkge1xyXG5cclxuICAgIGlmICghcGFnZSB8fCBkZXB0aCA+IHN1Y2h0aWVmZSB8fCBzZWVuLmhhcyhwYWdlLmZpbGUucGF0aCkpIHJldHVybiBbXTtcclxuICAgIHNlZW4uYWRkKHBhZ2UuZmlsZS5wYXRoKTsgICAgIFxyXG5cclxuICAgIGNvbnN0IGJhY2tsaW5rcyA9IHBhZ2UuZmlsZS5pbmxpbmtzXHJcbiAgICAgICAgLm1hcChsID0+IGR2LnBhZ2UobC5wYXRoKSkgICAgICAgIC8vIHBhZ2Ugb2JqZWN0IGZyb20gbGlua1xyXG4gICAgICAgIC5maWx0ZXIocCA9PiBwICYmIHAuZmlsZSkgICAgICAgICAvLyBlbnN1cmUgZnVsbHkgaHlkcmF0ZWRcclxuICAgICAgICAuc29ydCgoYSwgYikgPT4gICAgICAgICAgICAgICAgICAgLy8gY2Fub25pY2FsIG9yZGVyXHJcbiAgICAgICAgICAgIGEuZmlsZT8ucGF0aD8ubG9jYWxlQ29tcGFyZShiLmZpbGU/LnBhdGgpIFxyXG4gICAgICAgICk7IFxyXG4gICAgXHJcbiAgICBsZXQgc3VjaGVyZ2Vibmlzc2UgPSBbXTtcclxuICAgIFxyXG4gICAgZm9yIChjb25zdCBicCBvZiBiYWNrbGlua3MpIHtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IHRyZWZmZXIgPSBzZmllbGRzLnNvbWUoZmllbGQgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGVpbnplbG5lckZlbGRXZXJ0KGJwLCBmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRvQXJyYXkodmFsdWUpLnNvbWUodiA9PiB2Py5wYXRoID09PSBwYWdlLmZpbGUucGF0aCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBpZiAodHJlZmZlcikge1xyXG4gICAgICAgICAgICBzdWNoZXJnZWJuaXNzZS5wdXNoKGJwLmZpbGUucGF0aCk7XHJcbiAgICAgICAgICAgIHN1Y2hlcmdlYm5pc3NlLnB1c2goLi4uZHZMaW5rU3VjaGVBdXNmdWVocmVuKFxyXG4gICAgICAgICAgICAgICAgZHYsXHJcbiAgICAgICAgICAgICAgICBicCxcclxuICAgICAgICAgICAgICAgIHNmaWVsZHMsXHJcbiAgICAgICAgICAgICAgICBzdWNodGllZmUsXHJcbiAgICAgICAgICAgICAgICBkZXB0aCArIDEsXHJcbiAgICAgICAgICAgICAgICBzZWVuKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VjaGVyZ2Vibmlzc2U7XHJcbn1cclxuXHJcblxyXG4vKiogXHJcbiAqIFZlcmJpbmRldCBMaXN0ZW4gdm9uIFNlaXRlbnBmYWRlbiBnZW1cdTAwRTRcdTAwREYgdHJ1ZS9mYWxzZSA9IHVuZC9vZGVyXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gdW5kT2RlckF1c3dlcnRlbihwZmFkTGlzdGVuLCB1b09wdGlvbikge1xyXG4gICAgaWYgKCFwZmFkTGlzdGVuLmxlbmd0aCkgcmV0dXJuIFtdO1xyXG4gICAgbGV0IHJlc3VsdDtcclxuXHJcbiAgICBpZiAoIXVvT3B0aW9uKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gWy4uLm5ldyBTZXQoW10uY29uY2F0KC4uLnBmYWRMaXN0ZW4pKV07IC8vIE9SOiB1bmlvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBzZXRzID0gcGZhZExpc3Rlbi5tYXAobCA9PiBuZXcgU2V0KGwpKTtcclxuICAgICAgICByZXN1bHQgPSBbLi4uc2V0cy5yZWR1Y2UoKGEsIHMpID0+IFxyXG4gICAgICAgICAgICBuZXcgU2V0KFsuLi5hXS5maWx0ZXIoeCA9PiBzLmhhcyh4KSkpKV07IC8vIEFORDogaW50ZXJzZWN0aW9uXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpOyAvLyBjYW5vbmljYWwgb3JkZXJcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgZHZMaW5rU3VjaGUgfSBmcm9tIFwiLi9xdWVyeVNlcnZpY2UuanNcIjtcclxuXHJcblxyXG4vLy8vXHJcbi8vIEVOVElUXHUwMEM0VEVOXHJcblxyXG5leHBvcnQgY29uc3QgRU5USVRZX1RZUEVTID0gW1xyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJrYXRcIixcclxuICAgICAgICBsYWJlbDogXCJLYXRlZ29yaWVcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUthdFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwidGhlXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiVGhlbWFcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeVRoZVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiZXJlXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiRXJlaWduaXNcIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUVyZVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiaW5oXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiSW5oYWx0XCIsXHJcbiAgICAgICAgcXVlcnk6IGR2UXVlcnlJbmhcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAga2V5OiBcImdlblwiLFxyXG4gICAgICAgIGxhYmVsOiBcIkdlbnJlXCIsXHJcbiAgICAgICAgcXVlcnk6IGR2UXVlcnlHZW5cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAga2V5OiBcInBlclwiLFxyXG4gICAgICAgIGxhYmVsOiBcIlBlcnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5OiBkdlF1ZXJ5UGVyXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJvcmdcIixcclxuICAgICAgICBsYWJlbDogXCJPcmdhbmlzYXRpb25cIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeU9yZ1xyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBrZXk6IFwiZ2VnXCIsXHJcbiAgICAgICAgbGFiZWw6IFwiR2VnZW5zdGFuZFwiLFxyXG4gICAgICAgIHF1ZXJ5OiBkdlF1ZXJ5R2VnXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIGtleTogXCJnZW9cIixcclxuICAgICAgICBsYWJlbDogXCJHZW9cIixcclxuICAgICAgICBxdWVyeTogZHZRdWVyeUdlb1xyXG4gICAgfVxyXG5dO1xyXG5cclxuXHJcbi8vLy9cclxuLy8gUVVFUklFU1xyXG5cclxuLyoqXHJcbiAqIEhhdXB0LUVudGl0XHUwMEU0dGVuOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjAgenUgXCJBdXN3YWhsIEVudFwiIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeU1haW5FbnRzKGR2KSB7XHJcbiAgICByZXR1cm4gZHZMaW5rU3VjaGUoZHYsIFtcIkF1c3dhaGwgRW50XCJdLCBbXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEthdGVnb3JpZTogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdLYXRlZ29yaWUnIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUthdChkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxuICAgIC8vIGNvbnN0IGthdFN1Y2hlID0gZHZMaW5rU3VjaGUoZHYsIFtcIkthdGVnb3JpZVwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG4gICAgLy8gcmV0dXJuIFsuLi5rYXRTdWNoZSwgXCJLYXRlZ29yaWUubWRcIl07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkdlF1ZXJ5S2F0QWxsZShkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbiAgICAvLyBjb25zdCBrYXRTdWNoZSA9IGR2TGlua1N1Y2hlKGR2LCBbXCJLYXRlZ29yaWVcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxuICAgIC8vIHJldHVybiBbLi4ua2F0U3VjaGUsIFwiS2F0ZWdvcmllLm1kXCJdO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFRoZW1hOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjIgenUgJ1RoZW1hJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlUaGUoZHYpIHtcclxuICAgIGNvbnN0IHRoZVN1Y2hlID0gZHZMaW5rU3VjaGUoZHYsIFtcIlRoZW1hXCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbiAgICByZXR1cm4gWy4uLnRoZVN1Y2hlLCBcIlRoZW1hLm1kXCJdO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEVyZWlnbmlzOiBTZWl0ZW4sIGRpZSB2aWEgaXN0KjIgenUgJ0VyZWlnbmlzJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlFcmUoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiRXJlaWduaXNcIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbmhhbHQ6IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnSW5oYWx0JyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlJbmgoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiSW5oYWx0XCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2VucmU6IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnR2VucmUnIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUdlbihkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJHZW5yZVwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFBlcnNvbjogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdQZXJzb24nIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeVBlcihkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJQZXJzb25cIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBPcmdhbmlzYXRpb246IFNlaXRlbiwgZGllIHZpYSBpc3QqMiB6dSAnT3JnYW5pc2F0aW9uJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlPcmcoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiT3JnYW5pc2F0aW9uXCIsIFwiRGF0ZW5iYW5raW50ZXJuZSBFbnRpdFx1MDBFNHRcIl0sIFtcImlzdFwiLCBcImlzdGRpblwiXSwgMCwgdHJ1ZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2VnZW5zdGFuZDogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdHZWdlbnN0YW5kJyBsaW5rZW4uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR2UXVlcnlHZWcoZHYpIHtcclxuICAgIHJldHVybiBkdkxpbmtTdWNoZShkdiwgW1wiR2VnZW5zdGFuZFwiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdlbzogU2VpdGVuLCBkaWUgdmlhIGlzdCoyIHp1ICdHZW8nIGxpbmtlbi5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHZRdWVyeUdlbyhkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJHZW9cIiwgXCJEYXRlbmJhbmtpbnRlcm5lIEVudGl0XHUwMEU0dFwiXSwgW1wiaXN0XCIsIFwiaXN0ZGluXCJdLCAwLCB0cnVlKTtcclxufVxyXG5cclxuIiwgIlxyXG4vLy8vXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgRU5USVRZX1RZUEVTIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9lbnRpdHlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlCdXR0b25zKGJ0bkJveCwgYnRuQ2FsbGJhY2tGbikge1xyXG5cclxuICAgIEVOVElUWV9UWVBFUy5mb3JFYWNoKGVudFR5cGUgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBidG4gPSBidG5Cb3guY3JlYXRlRWwoXCJidXR0b25cIiwge1xyXG4gICAgICAgICAgICB0ZXh0OiBlbnRUeXBlLmxhYmVsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBidG5DYWxsYmFja0ZuKGVudFR5cGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IHJhbmtGdXp6eSB9IGZyb20gXCIuLi8uLi9zaGFyZWQvc2VydmljZXMvZnV6enlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cykge1xyXG5cclxuICAgIGZ1enp5Qm94LmlubmVySFRNTCA9IFwiXCI7XHJcblxyXG4gICAgY29uc3QgaW5wdXQgPSBmdXp6eUJveC5jcmVhdGVFbChcImlucHV0XCIpO1xyXG4gICAgLy8gY29uc3QgcmVzdWx0VGFibGUgPSBmdXp6eUJveC5jcmVhdGVFbChcInRhYmxlXCIpO1xyXG5cclxuICAgIC8vIFdlbm4gZWluemVsbmUgQmF1c3RlaW5lIGFuZGVyZSBLcml0ZXJpZW4gdmVyd2VuZGVuIHNvbGxlblxyXG4gICAgLy8gYHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VFeHRyYWN0b3JgIGF1c2xhZ2VybiB1bmQgYW4gYGZ1enp5U2VhcmNoYFxyXG4gICAgLy8gYWxzIHdlaXRlcmVzIEFyZ3VtZW50IHdlaXRlcnJlaWNoZW4gKHdpcmQgdm9uIGhpZXIgYXVjaCBudXJcclxuICAgIC8vIGFuIGByYW5rRnV6enlgIHdlaXRlcmdlcmVpY2h0KS5cclxuICAgIC8qY29uc3Qgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvciA9IChlbnRDYW5kaWRhdGVQYWdlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZS5uYW1lLFxyXG4gICAgICAgICAgICAuLi4oZW50Q2FuZGlkYXRlUGFnZS5kdlBhZ2U/LmluID8/IFtdKSxcclxuICAgICAgICAgICAgLi4uKGVudENhbmRpZGF0ZVBhZ2UuZHZQYWdlPy5pc3QgPz8gW10pXHJcbiAgICAgICAgXS5qb2luKFwiIFwiKTtcclxuICAgIH07Ki9cclxuXHJcbiAgICAvKmNvbnN0IHJlbmRlciA9ICh1c2VySW5wdXRTdHJpbmcpID0+IHtcclxuICAgICAgICByZXN1bHRUYWJsZS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgICAgICBjb25zdCByYW5rZWQgPSBcclxuICAgICAgICAgICAgcmFua0Z1enp5KFxyXG4gICAgICAgICAgICAgICAgdXNlcklucHV0U3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZXMsXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlRXh0cmFjdG9yXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJhbmtlZC5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0FyclxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcigocCwgaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA+MCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoLTEpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFBhZ2VzU3RyID0gcGFyZW50UGFnZXNGbHQuam9pbihcIiAvIFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdFJvdyA9IHJlc3VsdFRhYmxlLmNyZWF0ZUVsKFwidHJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdENoZWNrQ2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDaGVja2JveCA9IHJlc3VsdENoZWNrQ2VsbC5jcmVhdGVFbChcImlucHV0XCIsIHt0eXBlOiBcImNoZWNrYm94XCJ9KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIsIHsgXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBgJHtwYXJlbnRQYWdlc0ZsdC5sZW5ndGggPiAwIFxyXG4gICAgICAgICAgICAgICAgICAgID8gcGFyZW50UGFnZXNTdHIrXCIgL1wiIFxyXG4gICAgICAgICAgICAgICAgICAgIDogXCJcIn1cclxuICAgICAgICAgICAgICAgICAgICAke3AuZGlzcGxheU5hbWV9YCBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlc3VsdENoZWNrQ2VsbC5zdHlsZS5wYWRkaW5nID0gXCI2cHhcIjtcclxuICAgICAgICAgICAgcmVzdWx0Q2VsbC5zdHlsZS5wYWRkaW5nID0gXCI2cHhcIjtcclxuICAgICAgICB9KTtcclxuICAgIH07Ki9cclxuXHJcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKGUpID0+IHtcclxuICAgICAgICByZW5kZXJSZXN1bHRzKGUudGFyZ2V0LnZhbHVlKTsgLy8gZS50YXJnZXQudmFsdWUgPT4gdXNlcklucHV0U3RyaW5nXHJcbiAgICB9KTtcclxuXHJcbiAgICByZW5kZXJSZXN1bHRzKFwiXCIpO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy9cclxuLy8gSU1QT1JUICAgICAgICAgICAgICAgICAgICAgLy8gRlJPTVxyXG5cclxuaW1wb3J0IHsgcmFua0Z1enp5IH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgYWxsZUZlbGRXZXJ0ZSB9ICAgICAgZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9tZXRhZGF0YVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZ2V0UGFnZU5vcm1PYmplY3QgfSAgZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9wYWdlTm9ybVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgdG9TdHJpbmdWYWx1ZSB9ICAgICAgZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlscy92YWx1ZVV0aWxzLmpzXCI7XHJcbmltcG9ydCB7IGVudGl0eUJ1dHRvbnMgfSAgICAgIGZyb20gXCIuL2VudGl0eUJ1dHRvbnMuanNcIjtcclxuaW1wb3J0IHsgZnV6enlTZWFyY2ggfSAgICAgICAgZnJvbSBcIi4vZnV6enlTZWFyY2guanNcIjtcclxuXHJcblxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZlbGRJc3RFZGl0b3IoZHYsIGNvbnRhaW5lciwgbWV0YUVkaXRTdGF0ZSkge1xyXG5cclxuICAgIGNvbnN0IHN0YXRlSW50ZXJuID0ge1xyXG4gICAgICAgIGJveE9wZW46IHRydWUsXHJcbiAgICAgICAgYWN0aXZlRW50aXR5VHlwZTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBoZWFkZXJUZXh0ID0gXCJpc3RcIjtcclxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogaGVhZGVyVGV4dCB9KTtcclxuICAgIGhlYWRlci5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcclxuXHJcbiAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICBzdGF0ZUludGVybi5ib3hPcGVuID0gIXN0YXRlSW50ZXJuLmJveE9wZW47XHJcbiAgICAgICAgYm94LnN0eWxlLmRpc3BsYXkgPSBzdGF0ZUludGVybi5ib3hPcGVuID8gXCJcIiA6IFwibm9uZVwiO1xyXG4gICAgICAgIGhlYWRlci50ZXh0Q29udGVudCA9IHN0YXRlSW50ZXJuLmJveE9wZW4gPyBgJHtoZWFkZXJUZXh0fSAoLSlgIDogYCR7aGVhZGVyVGV4dH0gKCspYDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGJveCA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGJ0bkJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGZ1enp5Qm94ID0gYm94LmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG4gICAgY29uc3QgcmVzdWx0Qm94ID0gYm94LmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG5cclxuICAgIGNvbnN0IHNlYXJjaGFibGVGaWVsZHNPZlBhZ2VFeHRyYWN0b3IgPSAocCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHAubmFtZSxcclxuICAgICAgICAgICAgLi4uKHAuZHZQYWdlPy5pbiA/PyBbXSksXHJcbiAgICAgICAgICAgIC4uLihwLmR2UGFnZT8uaXN0ID8/IFtdKVxyXG4gICAgICAgIF0uam9pbihcIiBcIik7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHJlbmRlclJlc3VsdHMgPSAodXNlcklucHV0U3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGVudFR5cGVDYW5kaWRhdGVQYWdlcyA9XHJcbiAgICAgICAgICAgIHN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGVcclxuICAgICAgICAgICAgICAgIC5xdWVyeShkdilcclxuICAgICAgICAgICAgICAgIC5tYXAocCA9PiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzdFAgPSBwLmR2UGFnZS5pc3Q/LmpvaW4oXCIgXCIpPy5pbmNsdWRlcyhcIlN0YXR1cyBfIHAubWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ldGFFZGl0U3RhdGUucFN0YXR1cy5hY3RpdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyBpc3RQIDogIWlzdFA7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmFua2VkID1cclxuICAgICAgICAgICAgcmFua0Z1enp5KFxyXG4gICAgICAgICAgICAgICAgdXNlcklucHV0U3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgZW50VHlwZUNhbmRpZGF0ZVBhZ2VzLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvclxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICByZXN1bHRCb3guaW5uZXJIVE1MID0gXCJcIjtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0VGFibGUgPSByZXN1bHRCb3guY3JlYXRlRWwoXCJ0YWJsZVwiKTtcclxuXHJcbiAgICAgICAgcmFua2VkLmZvckVhY2gocCA9PiB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0Fyci5maWx0ZXIoKF8sIGkpID0+XHJcbiAgICAgICAgICAgICAgICBpID4gMCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc1N0ciA9IHBhcmVudFBhZ2VzRmx0LmpvaW4oXCIgLyBcIik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRSb3cgPSByZXN1bHRUYWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja0NlbGwgPSByZXN1bHRSb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgICAgICAgICAgY29uc3QgY2hlY2tJbnB1dEJveCA9IGNoZWNrQ2VsbC5jcmVhdGVFbChcImlucHV0XCIsIHt0eXBlOiBcImNoZWNrYm94XCJ9KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2VsbCA9IHJlc3VsdFJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogXHJcbiAgICAgICAgICAgICAgICAocGFyZW50UGFnZXNGbHQubGVuZ3RoID4gMCA/IHBhcmVudFBhZ2VzU3RyICsgXCIgLyBcIiA6IFwiXCIpICtcclxuICAgICAgICAgICAgICAgICAgICBwLmRpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCByZW5kZXJGdXp6eSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoIXN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGUpIHJldHVybjtcclxuICAgICAgICBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGVudGl0eUJ1dHRvbnMoYnRuQm94LCAoZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgIHN0YXRlSW50ZXJuLmFjdGl2ZUVudGl0eVR5cGUgPSBlbnRpdHlUeXBlO1xyXG4gICAgICAgIHJlbmRlckZ1enp5KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVuZGVyRnV6enk7XHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IGR2TGlua1N1Y2hlIH0gZnJvbSBcIi4vcXVlcnlTZXJ2aWNlLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkdlF1ZXJ5UFN0YXR1cyhkdikge1xyXG4gICAgcmV0dXJuIGR2TGlua1N1Y2hlKGR2LCBbXCJwLVN0YXR1c1wiLCBcIkRhdGVuYmFua2ludGVybmUgRW50aXRcdTAwRTR0XCJdLCBbXCJpc3RcIiwgXCJpc3RkaW5cIl0sIDAsIHRydWUpO1xyXG59XHJcblxyXG4iLCAiXHJcbi8vLy8gXHJcbi8vIElNUE9SVFxyXG5cclxuaW1wb3J0IHsgcmFua0Z1enp5IH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9zZXJ2aWNlcy9mdXp6eVNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZ2V0UGFnZU5vcm1PYmplY3QgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3NlcnZpY2VzL3BhZ2VOb3JtU2VydmljZS5qc1wiO1xyXG5pbXBvcnQgeyBkdlF1ZXJ5UFN0YXR1cyB9IGZyb20gXCIuLi8uLi9zaGFyZWQvc2VydmljZXMvcFN0YXR1c1NlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgZnV6enlTZWFyY2ggfSBmcm9tIFwiLi9mdXp6eVNlYXJjaC5qc1wiO1xyXG5cclxuXHJcblxyXG4vKipcclxuICogXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBTdGF0dXNFZGl0b3IoZHYsIGNvbnRhaW5lciwgbWV0YUVkaXRTdGF0ZSwgcmVmcmVzaENhbGxiYWNrKSB7XHJcbiAgICBjb25zdCBoZWFkZXJUZXh0ID0gXCJwLVN0YXR1c1wiO1xyXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwge3RleHQ6IGAke2hlYWRlclRleHR9YH0pO1xyXG4gICAgaGVhZGVyLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgY29uc3Qgc3RhdGVJbnRlcm4gPSB7XHJcbiAgICAgICAgYm94T3BlbjogdHJ1ZVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgc3RhdGVJbnRlcm4uYm94T3BlbiA9ICFzdGF0ZUludGVybi5ib3hPcGVuO1xyXG4gICAgICAgIGJveC5zdHlsZS5kaXNwbGF5ID0gc3RhdGVJbnRlcm4uYm94T3BlbiBcclxuICAgICAgICAgICAgPyBcIlwiIDogXCJub25lXCI7XHJcbiAgICAgICAgaGVhZGVyLnRleHRDb250ZW50ID0gc3RhdGVJbnRlcm4uYm94T3BlbiBcclxuICAgICAgICAgICAgPyBgJHtoZWFkZXJUZXh0fSAoLSlgIDogYCR7aGVhZGVyVGV4dH0gKCspYFxyXG4gICAgfSlcclxuICAgIGNvbnN0IGJveCA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IGNoZWNrQm94SW5wdXQgPSBib3guY3JlYXRlRWwoXCJpbnB1dFwiLCB7dHlwZTogXCJjaGVja2JveFwifSk7XHJcbiAgICBjb25zdCBmdXp6eUJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgIGNvbnN0IHJlc3VsdEJveCA9IGJveC5jcmVhdGVFbChcImRpdlwiKTtcclxuXHJcbiAgICBjaGVja0JveElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgIGlmIChjaGVja0JveElucHV0LmNoZWNrZWQpIHtcclxuICAgICAgICAgICAgcmVzdWx0Qm94LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICBtZXRhRWRpdFN0YXRlLnBTdGF0dXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVuZGVyRnV6enkoKTtcclxuICAgICAgICB9IGVsc2UgeyBcclxuICAgICAgICAgICAgcmVzdWx0Qm94LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgbWV0YUVkaXRTdGF0ZS5wU3RhdHVzLmFjdGl2ZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hDYWxsYmFjaygpO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBwU3RhdFJlc3VsdHMgPSAoZHZRdWVyeVBTdGF0dXMoZHYpID8/IFtdKVxyXG4gICAgICAgIC5tYXAocCA9PiBnZXRQYWdlTm9ybU9iamVjdChkdiwgcCkpO1xyXG5cclxuICAgIGNvbnN0IHJlbmRlckZ1enp5ID0gKCkgPT4ge1xyXG4gICAgICAgIGlmIChjaGVja0JveElucHV0LmNoZWNrZWQpIFxyXG4gICAgICAgICAgICBmdXp6eVNlYXJjaChmdXp6eUJveCwgcmVuZGVyUmVzdWx0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VhcmNoYWJsZUZpZWxkc09mUGFnZUV4dHJhY3RvciA9IChlbnRDYW5kaWRhdGVQYWdlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgZW50Q2FuZGlkYXRlUGFnZS5uYW1lLFxyXG4gICAgICAgICAgICAuLi4oZW50Q2FuZGlkYXRlUGFnZS5kdlBhZ2U/LmluID8/IFtdKSxcclxuICAgICAgICAgICAgLi4uKGVudENhbmRpZGF0ZVBhZ2UuZHZQYWdlPy5pc3QgPz8gW10pXHJcbiAgICAgICAgXS5qb2luKFwiIFwiKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgcmVzdWx0VGFibGUgPSByZXN1bHRCb3guY3JlYXRlRWwoXCJ0YWJsZVwiKTtcclxuXHJcbiAgICBjb25zdCByZW5kZXJSZXN1bHRzID0gKHVzZXJJbnB1dFN0cmluZykgPT4ge1xyXG5cclxuICAgICAgICBcclxuICAgICAgICByZXN1bHRUYWJsZS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgICAgICBjb25zdCByYW5rZWQgPVxyXG4gICAgICAgICAgICByYW5rRnV6enkoXHJcbiAgICAgICAgICAgICAgICB1c2VySW5wdXRTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwU3RhdFJlc3VsdHMsXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hhYmxlRmllbGRzT2ZQYWdlRXh0cmFjdG9yXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJhbmtlZC5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc0FyciA9IHAubmFtZS5zcGxpdChcIiBfIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50UGFnZXNGbHQgPSBwYXJlbnRQYWdlc0Fyci5maWx0ZXIoKF8sIGkpID0+XHJcbiAgICAgICAgICAgICAgICBpID4gMCAmJiBpIDwgcGFyZW50UGFnZXNBcnIubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQYWdlc1N0ciA9IHBhcmVudFBhZ2VzRmx0LmpvaW4oXCIgLyBcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRSb3cgPSByZXN1bHRUYWJsZS5jcmVhdGVFbChcInRyXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDaGVja0NlbGwgPSByZXN1bHRSb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0Q2hlY2tib3ggPSByZXN1bHRDaGVja0NlbGwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcclxuICAgICAgICAgICAgaWYgKHAubmFtZSA9PT0gXCJTdGF0dXMgXyBwXCIpIHJlc3VsdENoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRDZWxsID0gcmVzdWx0Um93LmNyZWF0ZUVsKFwidGRcIiwge1xyXG4gICAgICAgICAgICAgICAgdGV4dDpcclxuICAgICAgICAgICAgICAgICAgICAocGFyZW50UGFnZXNGbHQubGVuZ3RoID4gMCA/IHBhcmVudFBhZ2VzU3RyICsgXCIgLyBcIiA6IFwiXCIpICtcclxuICAgICAgICAgICAgICAgICAgICBwLmRpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0Q2hlY2tDZWxsLnN0eWxlLnBhZGRpbmcgPSBcIjZweFwiO1xyXG4gICAgICAgICAgICByZXN1bHRDZWxsLnN0eWxlLnBhZGRpbmcgPSBcIjZweFwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbiIsICJcclxuLy8vL1xyXG4vLyBJTVBPUlRcclxuXHJcbmltcG9ydCB7IGZlbGRJc3RFZGl0b3IgfSBmcm9tIFwiLi9mZWxkSXN0RWRpdG9yLmpzXCI7XHJcbmltcG9ydCB7IHBTdGF0dXNFZGl0b3IgfSBmcm9tIFwiLi9wU3RhdHVzRWRpdG9yLmpzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKi9cclxuXHJcbi8vIGBtb3VudEVsYCBpcyB0aGUgRE9NIGVsZW1lbnQgdGhlIGZlYXR1cmUgcmVuZGVycyBpbnRvLiBQcmV2aW91c2x5IHRoZSB0d29cclxuLy8gcm9vdCBjb250YWluZXJzIHdlcmUgY3JlYXRlZCB2aWEgYGR2LmVsKC4uLilgICh3aGljaCBib3RoIGNyZWF0ZXMgdGhlIGVsZW1lbnRcclxuLy8gQU5EIGFwcGVuZHMgaXQgdG8gdGhlIHN1cnJvdW5kaW5nIGRhdGF2aWV3anMgb3V0cHV0KS4gT3V0c2lkZSBhIGRhdGF2aWV3anNcclxuLy8gYmxvY2sgdGhlcmUgaXMgbm8gc3VjaCBvdXRwdXQgY29udGV4dCwgc28gdGhlIGNhbGxlciBwYXNzZXMgaW4gYW4gZWxlbWVudFxyXG4vLyAoZS5nLiBhIG1vZGFsJ3MgY29udGVudEVsKSBhbmQgd2UgYnVpbGQgaW50byBpdCB3aXRoIGBjcmVhdGVFbCguLi4pYC5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YUVkaXRvcihkdiwgbW91bnRFbCkge1xyXG5cclxuICAgIGNvbnN0IG1ldGFFZGl0U3RhdGUgPSB7XHJcbiAgICAgICAgZmVhdHVyZUJveEFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICBwU3RhdHVzOiB7XHJcbiAgICAgICAgICAgIGFjdGl2ZTogbnVsbCxcclxuICAgICAgICAgICAgYXVzd2FobDogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzdDoge1xyXG4gICAgICAgICAgICBhdXN3YWhsOiBbXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5pQ29udGFpbmVyID0gbW91bnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IHRleHQ6IFwiU2VpdGUgYmVhcmJlaXRlbiAoKylcIiB9KTtcclxuICAgIG1pbmlDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgbWluaUNvbnRhaW5lci5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IG1vdW50RWwuY3JlYXRlRWwoXCJkaXZcIik7XHJcbiAgICBcclxuICAgIGNvbnN0IHJlbmRlckFjdGl2ZUNvbnRhaW5lciA9ICgpID0+IHtcclxuICAgICAgICBpZiAobWV0YUVkaXRTdGF0ZS5mZWF0dXJlQm94QWN0aXZlKSB7XHJcbiAgICAgICAgICAgIG1pbmlDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgbWluaUNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc3QgYm94ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG5cclxuICAgIGNvbnN0IHRhYmxlID0gY29udGFpbmVyLmNyZWF0ZUVsKFwidGFibGVcIik7XHJcbiAgICBjb25zdCByb3dBID0gdGFibGUuY3JlYXRlRWwoXCJ0clwiKTtcclxuICAgIGNvbnN0IGNlbGxBMSA9IHJvd0EuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgIGNlbGxBMS5jb2xTcGFuID0gMztcclxuICAgIGNvbnN0IGhlYWRlciA9IGNlbGxBMS5jcmVhdGVFbChcImg0XCIsIHt0ZXh0OiBcIlNlaXRlbmVkaXRvciAoLSlcIn0pO1xyXG4gICAgaGVhZGVyLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xyXG4gICAgW21pbmlDb250YWluZXIsIGhlYWRlcl0uZm9yRWFjaChlbCA9PiB7XHJcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgbWV0YUVkaXRTdGF0ZS5mZWF0dXJlQm94QWN0aXZlID0gIW1ldGFFZGl0U3RhdGUuZmVhdHVyZUJveEFjdGl2ZTtcclxuICAgICAgICAgICAgcmVuZGVyQWN0aXZlQ29udGFpbmVyKCk7XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBjb25zdCByb3dCID0gdGFibGUuY3JlYXRlRWwoXCJ0clwiKTtcclxuICAgIGNvbnN0IGNlbGxCMSA9IHJvd0IuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgIGNvbnN0IGNlbGxCMiA9IHJvd0IuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgIGNvbnN0IGNlbGxCMyA9IHJvd0IuY3JlYXRlRWwoXCJ0ZFwiKTtcclxuICAgIGNlbGxCMS5zdHlsZSA9IFwid2lkdGg6MjAwcHhcIjtcclxuICAgIGNlbGxCMi5zdHlsZSA9IFwid2lkdGg6MzUwcHhcIjtcclxuICAgIGNlbGxCMy5zdHlsZSA9IFwid2lkdGg6ODBweFwiO1xyXG5cclxuICAgIGxldCByZW5kZXJGZWxkSXN0ID0gKCkgPT4ge307ICAgICAgICAgICAvLyBQbGF0emhhbHRlciwgdW0gZWluZSBDYWxsYmFja0ZuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW4gYHBTdGF0dXNFZGl0b3JgIHp1IFx1MDBGQ2JlcmdlYmVuLFxyXG4gICAgcFN0YXR1c0VkaXRvciggICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9id29obCBgZmVsZElzdEVkaXRvcmAsIHdvIGRpZSBcclxuICAgICAgICBkdiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsYmFja0ZuIGVpZ2VudGxpY2ggZGVmaW5pZXJ0IHdpcmQsIFxyXG4gICAgICAgIGNlbGxCMSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vY2ggbmljaHQgIGVyemV1Z3Qgd3VyZGUgKGRhIGluIGRlciBcclxuICAgICAgICBtZXRhRWRpdFN0YXRlLCAgICAgICAgICAgICAgICAgICAgICAvLyBVSSBgcFN0YXR1c0VkaXRvcmAgdm9yIGBmZWxkSXN0RWRpdG9yYCBcclxuICAgICAgICAoKSA9PiByZW5kZXJGZWxkSXN0KCkgICAgICAgICAgICAgICAvLyBrb21tZW4gc29sbC5cclxuICAgICk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgIHJlbmRlckZlbGRJc3QgPSBmZWxkSXN0RWRpdG9yKCAgICAgICAgICAvLyBnaWJ0IHNlaW5lIHJlbmRlci1GdW5rdGlvbiB6dXJcdTAwRkNjayxcclxuICAgICAgICBkdiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGByZW5kZXJGdXp6eWAgLT4gZGFzIGlzdCBkYW5uXHJcbiAgICAgICAgY2VsbEIyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGllIENhbGxiYWNrRm4sIGRpZSBhbiBgcFN0YXR1c0VkaXRvcmBcclxuICAgICAgICBtZXRhRWRpdFN0YXRlICAgICAgICAgICAgICAgICAgICAgICAvLyBcdTAwRkNiZXJnZWJlbiB1bmQgZG9ydCBiZWltIEFua2xpY2tlbiBcclxuICAgICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkZXIgQ2hlY2tib3ggYXVzZ2VmXHUwMEZDaHJ0IHdpcmQuXHJcbn1cclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXVCOzs7QUNBdkIsc0JBQXlCOzs7QUNZbEIsU0FBUyxlQUFlQyxNQUFLO0FBWnBDO0FBYUUsVUFBTyx1QkFBQUEsUUFBQSxnQkFBQUEsS0FBSyxZQUFMLG1CQUFjLFlBQWQsbUJBQXVCLGFBQXZCLG1CQUFpQyxRQUFqQyxZQUF3QztBQUNqRDs7O0FEWE8sSUFBTSxpQkFBaUI7QUFNdkIsSUFBTSxXQUFOLGNBQXVCLHlCQUFTO0FBQUEsRUFDckMsY0FBYztBQUNaLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxpQkFBaUI7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsVUFBVTtBQUNSLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLFNBQVM7QUFDYixTQUFLLE9BQU87QUFBQSxFQUNkO0FBQUEsRUFFQSxNQUFNLFVBQVU7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxTQUFTO0FBQ1AsVUFBTSxPQUFPLEtBQUs7QUFDbEIsU0FBSyxNQUFN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R0FBRztBQUNsQyxRQUFJLENBQUMsSUFBSTtBQUNQLGdCQUFVLFNBQVMsS0FBSztBQUFBLFFBQ3RCLE1BQ0U7QUFBQSxNQUVKLENBQUM7QUFDRDtBQUFBLElBQ0Y7QUFJQSxRQUFJO0FBQ0YscUJBQWUsSUFBSSxTQUFTO0FBQUEsSUFDOUIsU0FBUyxHQUFHO0FBQ1YsY0FBUSxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hELFlBQU0sTUFBTSxVQUFVLFNBQVMsT0FBTztBQUFBLFFBQ3BDLE1BQU0sNkJBQTZCLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxPQUFPLENBQUM7QUFBQSxNQUN0RSxDQUFDO0FBQ0QsVUFBSSxNQUFNLFFBQVE7QUFDbEIsVUFBSSxNQUFNLGFBQWE7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFVBQVU7QUFDUixTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQ0Y7OztBSGxDQSxJQUFxQixhQUFyQixjQUF3Qyx3QkFBTztBQUFBLEVBQzdDLE1BQU0sU0FBUztBQUViLFNBQUssYUFBYSxnQkFBZ0IsQ0FBQyxTQUFTLElBQUksU0FBUyxJQUFJLENBQUM7QUFHOUQsU0FBSyxjQUFjLG9CQUFvQixhQUFhLE1BQU07QUFDeEQsV0FBSyxhQUFhO0FBQUEsSUFDcEIsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLEtBQUssYUFBYTtBQUFBLElBQ3BDLENBQUM7QUFHRCxTQUFLLGNBQWMsb0JBQW9CLDhCQUE4QixNQUFNO0FBQ3pFLFVBQUksb0JBQW9CLEtBQUssR0FBRyxFQUFFLEtBQUs7QUFBQSxJQUN6QyxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sSUFBSSxvQkFBb0IsS0FBSyxHQUFHLEVBQUUsS0FBSztBQUFBLElBQ3pELENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxXQUFXO0FBQUEsRUFBQztBQUFBO0FBQUE7QUFBQSxFQUlaLE1BQU0sZUFBZTtBQUNuQixVQUFNLEVBQUUsVUFBVSxJQUFJLEtBQUs7QUFFM0IsUUFBSSxPQUFPLFVBQVUsZ0JBQWdCLGNBQWMsRUFBRSxDQUFDO0FBQ3RELFFBQUksQ0FBQyxNQUFNO0FBQ1QsYUFBTyxVQUFVLFFBQVEsSUFBSTtBQUM3QixZQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sZ0JBQWdCLFFBQVEsS0FBSyxDQUFDO0FBQUEsSUFDaEU7QUFFQSxjQUFVLFdBQVcsSUFBSTtBQUFBLEVBQzNCO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJhcHAiLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIl0KfQo=
