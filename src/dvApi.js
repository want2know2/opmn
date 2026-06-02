// Single, canonical way to reach the Dataview plugin's JavaScript API from
// *outside* a `dataviewjs` code block.
//
// Inside a `dataviewjs` block you were handed a `dv` object (a
// DataviewInlineApi). From a plugin we instead grab the global Dataview API
// (a DataviewApi). It exposes the query helpers we rely on -- `dv.pages(...)`,
// `dv.page(path)`, `dv.pagePaths(...)`, `dv.index` -- but NOT the rendering
// helpers (`dv.el`, `dv.table`, ...). We don't need those anymore: in a plugin
// we build DOM with the element's own `createEl(...)` instead.
//
// Returns `null` when Dataview is not installed / not yet loaded, so callers
// can show a friendly message instead of crashing.
export function getDataviewApi(app) {
  return app?.plugins?.plugins?.dataview?.api ?? null;
}

