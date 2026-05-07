"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..", "..");
const sourcesRoot = path.join(packageRoot, "sources");
const manifestPath = path.join(packageRoot, "manifest.json");
const catalogPath = path.join(repoRoot, "catalog", "components.json");

const expectedPublishOrder = [
  "bootstrap.js",
  "sidebar_shell.js",
  "dom.js",
  "values.js",
  "debug.js",
  "menu.js",
  "chrome.js",
  "transitions.js",
  "route.js",
  "workspace.js",
  "state.js",
  "rows.js",
  "data.js",
  "filters.js",
  "layout.js",
  "actions.js",
  "markup.js",
  "table.js",
  "surface_layers.css",
];

const premiumCssPrimitives = [
  ".o_surface_premium_command_bar",
  ".o_surface_premium_metric_strip",
  ".o_surface_premium_metric",
  ".o_surface_premium_smart_table_shell",
  ".o_surface_premium_smart_table",
  ".o_surface_premium_inspector",
  ".o_surface_premium_code_modal",
  ".o_surface_premium_status_chip",
  ".o_surface_premium_validation_rail",
  ".o_surface_premium_empty_state",
];

const premiumCssHelperHooks = [
  ".o_surface_premium_command_bar__description",
  ".o_surface_premium_smart_table__cell--actions",
];

const dualWorkspaceRuntimeExports = [
  "buildPremiumWorkspaceToolbarConsoleMarkup",
  "buildPremiumWorkspaceListConsoleMarkup",
  "buildPremiumWorkspaceToolbarConsoleController",
];

const premiumPrimitiveExports = {
  "actions.js": [
    "ensureActionSlotHost",
    "ensurePreviewActionSlotHost",
    "buildIconActionButtonMarkup",
    "buildPreviewActionButtonMarkup",
    "buildPreviewActionGroupMarkup",
    "mountPreviewActionSlots",
    "openSurfaceUrl",
  ],
  "chrome.js": [
    "buildSelectFilterToolbarMarkup",
    "buildSelectFilterWorkspaceConsoleMarkup",
    "getKeyedPortal",
    "ensureKeyedPortalItem",
    "positionKeyedPortalItem",
    "pruneKeyedPortalItems",
    "buildSurfaceBreadcrumbItem",
    "ensureBreadcrumbTopbarHost",
    "normalizeControlPanelBreadcrumbLayout",
    "syncManagedTransitionShell",
    "showManagedTransitionShell",
    "hideManagedTransitionShell",
    "clearManagedTransitionShell",
    "scheduleManagedTransitionShellHide",
  ],
  "data.js": [
    "buildScopedStateCacheKey",
    "normalizeDependentSelectOptions",
    "searchReadInBatches",
    "buildInlineTextDataUrl",
    "hydrateBinaryAttachmentUrls",
  ],
  "filters.js": [
    "normalizeScopedFilterState",
    "areNormalizedStatesEqual",
    "buildYearMonthRange",
    "hasDomainCondition",
  ],
  "layout.js": [
    "captureColumnRatios",
    "captureResponsiveSpecRatios",
    "measureCellContentWidth",
    "applyTableColumnWidths",
    "getElementContentWidth",
    "scaleColumnWidthsToFit",
  ],
  "menu.js": [
    "ensureMenuAppContext",
    "scheduleMenuAppContextRefresh",
  ],
  "markup.js": [
    "buildActionStripMarkup",
    "buildDetailTableMarkup",
    "buildPremiumButtonMarkup",
    "buildPremiumStatusChipMarkup",
    "buildPremiumCommandBarMarkup",
    "buildPremiumMetricMarkup",
    "buildPremiumMetricStripMarkup",
    "buildPremiumEmptyStateMarkup",
    "buildPremiumValidationRailMarkup",
  ],
  "route.js": [
    "installSurfaceRoutePresentation",
    "uninstallSurfaceRoutePresentation",
    "buildSurfacePresentedUrl",
    "buildSurfaceRouteSlugPath",
    "buildSurfaceActionHref",
    "normalizeSurfaceQueryState",
    "readSurfaceQueryState",
    "buildSurfaceQueryUrl",
    "replaceSurfaceQueryState",
    "pushSurfaceQueryState",
    "mergeSurfaceQueryStateIntoUrl",
    "installPreservedHistoryPatch",
    "uninstallPreservedHistoryPatch",
  ],
  "rows.js": [
    "rememberListReturnState",
    "restoreListReturnState",
    "syncFocusedDataRow",
  ],
  "sidebar_shell.js": [
    "registerSidebarShellSectionTree",
    "registerSidebarShellSectionResolver",
    "registerSidebarShellRootSectionKeys",
  ],
  "state.js": [
    "buildActionBackedSelectionController",
    "buildActionBackedToolbarSelectionController",
    "buildWorkspaceToolbarInteractionHandler",
    "buildTabbedMonthListStateController",
    "saveTimedSessionPayload",
    "readTimedSessionPayload",
    "captureInitialQueryState",
  ],
  "table.js": [
    "ensureManagedActionColumn",
    "clearManagedActionColumn",
    "ensureManagedPreviewActionColumn",
    "clearManagedPreviewActionColumn",
    "buildManagedPreviewButtonMarkup",
    "buildManagedPreviewActionsMarkup",
    "buildManagedPreviewColumnController",
    "normalizePremiumSmartTableColumns",
    "buildPremiumSmartTableStatusCellMarkup",
    "buildPremiumSmartTableRowActionsMarkup",
    "buildPremiumSmartTableMarkup",
  ],
  "transitions.js": [
    "scheduleTransientFramePump",
    "syncCanonicalBreadcrumb",
    "restoreCanonicalBreadcrumb",
    "scheduleTransitionBreadcrumbSync",
  ],
  "workspace.js": [
    "buildSurfaceWorkspaceShellConfig",
    "syncWorkspaceToolbarConsole",
    "clearWorkspaceToolbarConsole",
    "buildManagedPreviewWorkspaceHooks",
    "registerWorkspace",
    "registerManagedFormEnhancer",
    "syncManagedFormEnhancers",
    "buildPremiumWorkspaceToolbarConsoleMarkup",
    "buildPremiumWorkspaceListConsoleMarkup",
    "buildPremiumWorkspaceToolbarConsoleController",
  ],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function unique(values) {
  return Array.from(new Set(values));
}

function listSourceFiles() {
  return fs.readdirSync(sourcesRoot)
    .filter((fileName) => fs.statSync(path.join(sourcesRoot, fileName)).isFile())
    .sort();
}

function normalizeRelativePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function extractSurfaceApiExports(fileName) {
  return new Set([
    ...extractObjectAssignExports(fileName, "surfaceLayerApi"),
    ...extractObjectAssignExports(fileName, "surfaceLayers"),
    ...extractObjectAssignExports(fileName, "workspaceApi"),
  ]);
}

function extractObjectAssignExports(fileName, targetName) {
  const source = fs.readFileSync(path.join(sourcesRoot, fileName), "utf8");
  const exported = new Set();
  const objectAssignPattern = new RegExp(
    "Object\\.assign\\(\\s*" + targetName + "\\s*,\\s*\\{([\\s\\S]*?)\\}\\s*\\);",
    "g"
  );
  let match = objectAssignPattern.exec(source);

  while (match) {
    const body = match[1];
    const propertyPattern = /^\s*([A-Za-z_$][\w$]*)\s*:/gm;
    let propertyMatch = propertyPattern.exec(body);
    while (propertyMatch) {
      exported.add(propertyMatch[1]);
      propertyMatch = propertyPattern.exec(body);
    }
    match = objectAssignPattern.exec(source);
  }

  if (targetName === "surfaceLayerApi") {
    const directAssignmentPattern = /surfaceLayerApi\.([A-Za-z_$][\w$]*)\s*=/g;
    let directMatch = directAssignmentPattern.exec(source);
    while (directMatch) {
      exported.add(directMatch[1]);
      directMatch = directAssignmentPattern.exec(source);
    }
  }

  return exported;
}

function assertSameMembers(actual, expected, label) {
  assert.deepEqual(
    unique(actual).sort(),
    unique(expected).sort(),
    label
  );
  assert.equal(actual.length, unique(actual).length, `${label} must not contain duplicates`);
}

const manifest = readJson(manifestPath);
const catalog = readJson(catalogPath);
const sourceFiles = listSourceFiles();

assert.equal(manifest.key, "surface-workspace-shell");
assert.equal(manifest.language, "web");
assert.equal(manifest.sync_root, "sources");
assert.equal(manifest.sync_mode, "tree");

assertSameMembers(manifest.exports, sourceFiles, "manifest exports must match source files");
assert.deepEqual(manifest.publish_order, expectedPublishOrder, "publish_order is the Premium Surface Kit load contract");
assertSameMembers(manifest.publish_order, manifest.exports, "publish_order must cover every exported file");

const catalogComponent = catalog.find((component) => component.key === manifest.key);
assert.ok(catalogComponent, "catalog must include surface-workspace-shell");
assert.equal(catalogComponent.runtime, manifest.language);
assert.equal(catalogComponent.status, manifest.status);
assert.equal(
  normalizeRelativePath(catalogComponent.package_path),
  "packages/web/surface_workspace_shell"
);
assert.ok(
  (catalogComponent.origins || []).some((origin) => origin.project === manifest.origin_project),
  "catalog origins must include the manifest origin_project"
);

for (const [fileName, expectedExports] of Object.entries(premiumPrimitiveExports)) {
  assert.ok(manifest.exports.includes(fileName), `${fileName} must be exported by the package manifest`);
  const actualExports = extractSurfaceApiExports(fileName);
  for (const exportName of expectedExports) {
    assert.ok(
      actualExports.has(exportName),
      `${fileName} must expose ${exportName} through OdooSurfaceLayers`
    );
  }
}

const workspaceSurfaceExports = extractObjectAssignExports("workspace.js", "surfaceLayers");
const workspaceRuntimeExports = extractObjectAssignExports("workspace.js", "workspaceApi");
const workspaceSource = fs.readFileSync(path.join(sourcesRoot, "workspace.js"), "utf8");
const markupSource = fs.readFileSync(path.join(sourcesRoot, "markup.js"), "utf8");
const tableSource = fs.readFileSync(path.join(sourcesRoot, "table.js"), "utf8");
for (const exportName of dualWorkspaceRuntimeExports) {
  assert.ok(
    workspaceSurfaceExports.has(exportName),
    `workspace.js must expose ${exportName} on window.OdooSurfaceLayers`
  );
  assert.ok(
    workspaceRuntimeExports.has(exportName),
    `workspace.js must expose ${exportName} on workspaceRuntime`
  );
}

for (const expectedToken of [
  'role="tab"',
  'data-surface-tab="1"',
  "data-surface-tab-key",
  "data-surface-tab-state",
  "data-surface-toolbar-control=\"tab\"",
]) {
  assert.ok(
    workspaceSource.includes(expectedToken),
    `workspace toolbar nav must expose accessible tab token ${expectedToken}`
  );
}
for (const expectedToken of [
  "function normalizePremiumWorkspaceToolbarConfig(commandBar, toolbar)",
  "delete normalized.commandBar.tabs",
  "delete normalized.commandBar.filters",
  'normalized.toolbar.tabs = commandBar.tabs',
  'normalized.toolbar.filters = commandBar.filters',
  "surfaceLayers.buildSelectFilterWorkspaceConsoleMarkup(toolbarConfig.toolbar)",
]) {
  assert.ok(
    workspaceSource.includes(expectedToken),
    `premium workspace console must route command-bar navigation through toolbar console token ${expectedToken}`
  );
}

assert.ok(
  markupSource.includes('<strong class="o_surface_premium_metric__value">'),
  "premium metric values must use semantic strong elements for live auditability"
);
for (const expectedToken of [
  'tabAttributes.role = "tab"',
  'tabAttributes.tabindex = entry.active === true ? "0" : "-1"',
  "tabData.surfaceTab = \"1\"",
  "tabData.surfaceTabKey = tabKey",
  'tabData.surfaceTabState = entry.active === true ? "active" : "inactive"',
  'tabData.surfaceToolbarControl = "tab"',
  'tabData.surfaceIntent = "tab"',
  'tabData.surfaceNav = "tab"',
]) {
  assert.ok(
    markupSource.includes(expectedToken),
    `premium command-bar tabs must expose accessible tab token ${expectedToken}`
  );
}
for (const expectedToken of [
  "result.header.dataset.surfacePreviewOwner = ownerKey",
  "cell.dataset.surfacePreviewOwner = ownerKey",
  "node.dataset.surfacePreviewOwner === ownerKey",
  "ownerKey: bridgeKey",
]) {
  assert.ok(
    tableSource.includes(expectedToken),
    `managed preview columns must be scoped by owner token ${expectedToken}`
  );
}

const surfaceLayerStyles = fs.readFileSync(path.join(sourcesRoot, "surface_layers.css"), "utf8");
assert.ok(
  manifest.exports.includes("surface_layers.css"),
  "Premium Surface Kit CSS must be exported by the package manifest"
);
for (const selector of premiumCssPrimitives) {
  assert.ok(
    surfaceLayerStyles.includes(selector),
    `surface_layers.css must expose ${selector}`
  );
}
for (const selector of premiumCssHelperHooks) {
  assert.ok(
    surfaceLayerStyles.includes(selector),
    `surface_layers.css must style helper-emitted ${selector}`
  );
}
for (const expectedToken of [
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_surface_workspace_toolbar__console > .o_surface_premium_command_bar",
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_surface_workspace_toolbar__console > .o_surface_premium_metric_strip",
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_surface_workspace_console__tab",
  'grid-template-areas:',
  '"main metrics"',
  "grid-area: metrics",
  "grid-area: main",
]) {
  assert.ok(
    surfaceLayerStyles.includes(expectedToken),
    `surface_layers.css must keep compact list-shell ownership scoped by ${expectedToken}`
  );
}

const oversizedRadiusMatches = Array.from(surfaceLayerStyles.matchAll(/border-radius:\s*([^;]+);/g))
  .map((match) => String(match[1] || "").trim())
  .filter((value) => {
    if (!/(?:px|rem)\b/.test(value) || value.includes("var(")) {
      return false;
    }
    if (value === "999px") {
      return false;
    }
    const pixelValues = Array.from(value.matchAll(/(\d+(?:\.\d+)?)px/g)).map((pixelMatch) => Number(pixelMatch[1]));
    const remValues = Array.from(value.matchAll(/(\d+(?:\.\d+)?)rem/g)).map((remMatch) => Number(remMatch[1]) * 16);
    return pixelValues.concat(remValues).some((pixelValue) => pixelValue > 8);
  });
assert.deepEqual(
  oversizedRadiusMatches,
  [],
  "Premium Surface Kit must route non-pill radii through the <=8px design token"
);

for (const forbiddenDecorativeToken of [
  "box-shadow: 0 16px",
  "box-shadow: 0 20px",
  "background: rgba(15, 23, 42",
]) {
  assert.ok(
    !surfaceLayerStyles.includes(forbiddenDecorativeToken),
    `surface_layers.css must not reintroduce heavy local decoration token ${forbiddenDecorativeToken}`
  );
}

console.log("OK: surface workspace shell contracts passed");
