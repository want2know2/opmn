"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// src/dvApi.js
var require_dvApi = __commonJS({
  "src/dvApi.js"(exports2, module2) {
    "use strict";
    function getDataviewApi(app2) {
      var _a, _b, _c, _d;
      return (_d = (_c = (_b = (_a = app2 == null ? void 0 : app2.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b.dataview) == null ? void 0 : _c.api) != null ? _d : null;
    }
    module2.exports = { getDataviewApi };
  }
});

// src/view.js
var require_view = __commonJS({
  "src/view.js"(exports2, module2) {
    "use strict";
    var { ItemView } = require("obsidian");
    var { getDataviewApi } = require_dvApi();
    var VIEW_TYPE_OPMN2 = "opmn-view";
    var OpmnView2 = class extends ItemView {
      getViewType() {
        return VIEW_TYPE_OPMN2;
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
    module2.exports = { OpmnView: OpmnView2, VIEW_TYPE_OPMN: VIEW_TYPE_OPMN2 };
  }
});

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
var init_fuzzyService = __esm({
  "shared/services/fuzzyService.js"() {
  }
});

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
var init_valueUtils = __esm({
  "shared/utils/valueUtils.js"() {
  }
});

// shared/services/metadataService.js
function einzelnerFeldWert(dvPage, feld) {
  return feld.split(".").reduce((o, k) => o == null ? void 0 : o[k], dvPage);
}
var init_metadataService = __esm({
  "shared/services/metadataService.js"() {
    init_valueUtils();
  }
});

// shared/utils/namingUtils.js
function splitName(str) {
  if (typeof str !== "string") return "";
  const splitArr = str.split(" _ ");
  return splitArr[splitArr.length - 1];
}
var init_namingUtils = __esm({
  "shared/utils/namingUtils.js"() {
  }
});

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
var init_pageDisplayNameService = __esm({
  "shared/services/pageDisplayNameService.js"() {
    init_namingUtils();
  }
});

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
var init_pageLinkService = __esm({
  "shared/services/pageLinkService.js"() {
  }
});

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
var init_pageReferenceService = __esm({
  "shared/services/pageReferenceService.js"() {
  }
});

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
var init_pageNormService = __esm({
  "shared/services/pageNormService.js"() {
    init_pageDisplayNameService();
    init_pageLinkService();
    init_pageReferenceService();
  }
});

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
var init_queryService = __esm({
  "shared/services/queryService.js"() {
    init_valueUtils();
    init_metadataService();
  }
});

// shared/services/entityService.js
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
var ENTITY_TYPES;
var init_entityService = __esm({
  "shared/services/entityService.js"() {
    init_queryService();
    ENTITY_TYPES = [
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
  }
});

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
var init_entityButtons = __esm({
  "features/metadataEditor/entityButtons.js"() {
    init_entityService();
  }
});

// features/metadataEditor/fuzzySearch.js
function fuzzySearch(fuzzyBox, renderResults) {
  fuzzyBox.innerHTML = "";
  const input = fuzzyBox.createEl("input");
  input.addEventListener("input", (e) => {
    renderResults(e.target.value);
  });
  renderResults("");
}
var init_fuzzySearch = __esm({
  "features/metadataEditor/fuzzySearch.js"() {
    init_fuzzyService();
  }
});

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
var init_feldIstEditor = __esm({
  "features/metadataEditor/feldIstEditor.js"() {
    init_fuzzyService();
    init_metadataService();
    init_pageNormService();
    init_valueUtils();
    init_entityButtons();
    init_fuzzySearch();
  }
});

// shared/services/pStatusService.js
function dvQueryPStatus(dv) {
  return dvLinkSuche(dv, ["p-Status", "Datenbankinterne Entit\xE4t"], ["ist", "istdin"], 0, true);
}
var init_pStatusService = __esm({
  "shared/services/pStatusService.js"() {
    init_queryService();
  }
});

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
var init_pStatusEditor = __esm({
  "features/metadataEditor/pStatusEditor.js"() {
    init_fuzzyService();
    init_pageNormService();
    init_pStatusService();
    init_fuzzySearch();
  }
});

// features/metadataEditor/metadataEditor.js
var metadataEditor_exports = {};
__export(metadataEditor_exports, {
  metadataEditor: () => metadataEditor
});
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
var init_metadataEditor = __esm({
  "features/metadataEditor/metadataEditor.js"() {
    init_feldIstEditor();
    init_pStatusEditor();
  }
});

// src/metadataEditorModal.js
var require_metadataEditorModal = __commonJS({
  "src/metadataEditorModal.js"(exports2, module2) {
    "use strict";
    var { Modal } = require("obsidian");
    var { getDataviewApi } = require_dvApi();
    var { metadataEditor: metadataEditor2 } = (init_metadataEditor(), __toCommonJS(metadataEditor_exports));
    var MetadataEditorModal2 = class extends Modal {
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
          metadataEditor2(dv, contentEl);
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
    module2.exports = { MetadataEditorModal: MetadataEditorModal2 };
  }
});

// src/main.js
var { Plugin } = require("obsidian");
var { OpmnView, VIEW_TYPE_OPMN } = require_view();
var { MetadataEditorModal } = require_metadataEditorModal();
module.exports = class OpmnPlugin extends Plugin {
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
    this.addRibbonIcon("table-properties", "OPMN: Metadata editor", () => {
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
