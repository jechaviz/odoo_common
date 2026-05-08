"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
  "list_workspace.js",
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
  "buildSurfaceWorkspaceConsoleLayoutMarkup",
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
  "debug.js": [
    "getSurfaceDesignAuditPrinciples",
    "normalizeSurfaceAuditText",
    "auditSurfaceCommandBarRedundancy",
    "auditSurfaceOverlayLegibility",
    "auditSurfaceBreadcrumbGhostState",
    "auditSurfaceListDensity",
    "auditSurfaceMenuDuplicateLabels",
    "auditSurfaceMetricPlacement",
    "auditSurfaceModalControlContrast",
    "auditSurfaceSidebarFlyoutGeometry",
    "auditSurfaceTabGrammar",
    "auditSurfaceMetricSignal",
    "auditSurfaceWorkspaceDesign",
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
  "list_workspace.js": [
    "buildActionBackedListWorkspace",
    "registerActionBackedListWorkspace",
    "buildCanonicalToolbarInteractionHandler",
    "buildTabbedMonthWorkspaceChrome",
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
    "buildSurfaceWorkspaceConsoleLayoutMarkup",
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

function loadWorkspaceRuntimeForMarkupTest(source) {
  const surfaceLayerApi = {
    _shared: {},
    resolveSurfaceWorkspaceOwnership() {
      return null;
    },
    escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    parseSearchParams(value) {
      return new URLSearchParams(String(value || ""));
    },
    normalizePathname(value) {
      return String(value || "/");
    },
    readCurrentActionModel() {
      return "";
    },
    buildSelectFilterWorkspaceConsoleMarkup(config) {
      const settings = config && typeof config === "object" ? config : {};
      return [
        '<div class="o_surface_workspace_console"',
        ` data-surface-console-region="${settings.consoleRegion || ""}"`,
        ` data-layout="${settings.layout || ""}">`,
        "</div>",
      ].join("");
    },
    buildPremiumCommandBarMarkup(config) {
      return `<section class="${config.className || ""}" data-region="${config.data.surfaceConsoleRegion || ""}"></section>`;
    },
    buildPremiumMetricStripMarkup(config) {
      return `<section class="${config.className || ""}" data-region="${config.data.surfaceConsoleRegion || ""}"></section>`;
    },
    buildPremiumSmartTableMarkup(config) {
      return `<section class="${config.className || ""}"></section>`;
    },
    buildPremiumValidationRailMarkup(config) {
      return `<section class="${config.className || ""}" data-region="${config.data.surfaceConsoleRegion || ""}"></section>`;
    },
    buildPremiumEmptyStateMarkup(config) {
      return `<section class="${config.className || ""}" data-region="${config.data.surfaceConsoleRegion || ""}"></section>`;
    },
  };
  const sandbox = {
    URL,
    URLSearchParams,
    window: {
      location: { href: "https://example.test/odoo", pathname: "/odoo", search: "", hash: "" },
      OdooSurfaceLayers: surfaceLayerApi,
      setTimeout() {},
      requestAnimationFrame(callback) {
        if (typeof callback === "function") {
          callback();
        }
      },
    },
  };
  vm.runInNewContext(source, sandbox, { filename: "workspace.js" });
  return sandbox.window.OdooSurfaceLayers;
}

function createSurfaceAuditTestDocument() {
  class MiniElement {
    constructor(tagName) {
      this.tagName = String(tagName || "div").toUpperCase();
      this.children = [];
      this.dataset = {};
      this.parentNode = null;
      this.attributes = {};
      this.className = "";
      this._textContent = "";
      this.style = {};
      this.classList = {
        contains: (className) => this.hasClass(className),
      };
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    setAttribute(name, value) {
      this.attributes[String(name)] = String(value);
    }

    getAttribute(name) {
      return this.attributes[String(name)] || "";
    }

    hasClass(className) {
      return String(this.className || "").split(/\s+/).includes(className);
    }

    get textContent() {
      return [
        this._textContent,
        ...this.children.map((child) => child.textContent),
      ].join("");
    }

    set textContent(value) {
      this._textContent = String(value || "");
    }

    getBoundingClientRect() {
      return this._rect || { left: 0, right: 160, top: 0, bottom: 32, width: 160, height: 32 };
    }

    matches(selector) {
      return selector.split(",").some((part) => this.matchesSimpleSelector(part.trim()));
    }

    matchesSimpleSelector(selector) {
      if (!selector) {
        return false;
      }
      if (selector.startsWith(".")) {
        return this.hasClass(selector.slice(1));
      }
      const roleMatch = selector.match(/^\[role=['"]?([^'"\]]+)['"]?\]$/);
      return roleMatch ? this.getAttribute("role") === roleMatch[1] : false;
    }

    querySelectorAll(selector) {
      if (selector.includes(":scope >")) {
        return this.children.filter((child) => selector.split(",").some((part) => {
          const scopedSelector = part.trim().replace(/^:scope\s*>\s*/, "");
          return child.matchesSimpleSelector(scopedSelector);
        }));
      }
      const results = [];
      const visit = (node) => {
        node.children.forEach((child) => {
          if (child.matches(selector)) {
            results.push(child);
          }
          visit(child);
        });
      };
      visit(this);
      return results;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    closest(selector) {
      let node = this;
      while (node) {
        if (node.matches(selector)) {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    }

    remove() {
      if (!this.parentNode) {
        return;
      }
      this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
      this.parentNode = null;
    }
  }

  class MiniDocument extends MiniElement {
    constructor() {
      super("#document");
      this.documentElement = new MiniElement("html");
      this.body = new MiniElement("body");
      this.appendChild(this.documentElement);
      this.documentElement.appendChild(this.body);
    }

    createElement(tagName) {
      return new MiniElement(tagName);
    }
  }

  return { MiniDocument, MiniElement, document: new MiniDocument() };
}

function loadDebugRuntimeForAuditTest(source) {
  const { MiniDocument, MiniElement, document } = createSurfaceAuditTestDocument();
  const surfaceLayerApi = { _shared: {} };
  const sandbox = {
    Element: MiniElement,
    HTMLElement: MiniElement,
    Document: MiniDocument,
    MutationObserver: class {
      observe() {}
    },
    document,
    window: {
      OdooSurfaceLayers: surfaceLayerApi,
      getComputedStyle() {
        return {
          display: "block",
          visibility: "visible",
          backgroundColor: "rgb(255, 255, 255)",
          boxShadow: "none",
          borderColor: "transparent",
        };
      },
      setTimeout() {
        return 0;
      },
    },
  };
  vm.runInNewContext(source, sandbox, { filename: "debug.js" });
  return { api: sandbox.window.OdooSurfaceLayers, document };
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
const chromeSource = fs.readFileSync(path.join(sourcesRoot, "chrome.js"), "utf8");
const debugSource = fs.readFileSync(path.join(sourcesRoot, "debug.js"), "utf8");
const listWorkspaceSource = fs.readFileSync(path.join(sourcesRoot, "list_workspace.js"), "utf8");
const routeSource = fs.readFileSync(path.join(sourcesRoot, "route.js"), "utf8");
const sidebarSource = fs.readFileSync(path.join(sourcesRoot, "sidebar_shell.js"), "utf8");
const workspaceSource = fs.readFileSync(path.join(sourcesRoot, "workspace.js"), "utf8");
const menuSource = fs.readFileSync(path.join(sourcesRoot, "menu.js"), "utf8");
const markupSource = fs.readFileSync(path.join(sourcesRoot, "markup.js"), "utf8");
const tableSource = fs.readFileSync(path.join(sourcesRoot, "table.js"), "utf8");
for (const expectedToken of [
  "findTableCellAnchor",
  "insertTableCellBefore",
  "hasVisibleManagedPreviewActions",
  "keepEmptyColumn",
  "insertBeforeHeaderSelector",
  "insertBeforeCellSelector",
  "th.o_list_actions_header",
  "td.w-print-0.p-print-0",
]) {
  assert.ok(
    tableSource.includes(expectedToken),
    `table.js must keep preview/action columns aligned before native sticky actions via ${expectedToken}`
  );
}
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
  "var SIDEBAR_SHELL_MENU_GAP_PX = 4;",
  "var SIDEBAR_SHELL_MAX_NESTED_GAP_PX = 8;",
  "var SIDEBAR_SHELL_VIEWPORT_MARGIN_PX = 8;",
  "var SIDEBAR_SHELL_POPOVER_Z_INDEX_BASE = 44;",
  "function resolveSidebarShellParentPopover(triggerNode, fallbackNode)",
  "function resolveSidebarShellPopoverColumnRect(popoverNode)",
  "function clampSidebarShellNestedHorizontalGap(left, parentRect, side)",
  "function resolveSidebarShellFixedContainingBlockRect(popoverNode, parentPopover)",
  "var anchorRight = depth > 1",
  "? (parentRect && isSidebarShellVisibleRect(parentRect) ? parentRect.right : containerRect.right)",
  ": Math.max(containerRect.right, triggerRect.right)",
  "var anchorLeft = depth > 1",
  "? (parentRect && isSidebarShellVisibleRect(parentRect) ? parentRect.left : containerRect.left)",
  ": Math.min(containerRect.left, triggerRect.left)",
  "String(SIDEBAR_SHELL_POPOVER_Z_INDEX_BASE + depth)",
  "popover.dataset.surfaceSidebarAnchor = depth > 1 ? \"parent-popover\" : \"sidebar\";",
  "popover.dataset.surfaceSidebarAnchorGap = String(SIDEBAR_SHELL_MENU_GAP_PX);",
  "popover.dataset.surfaceSidebarMaxNestedGap = String(SIDEBAR_SHELL_MAX_NESTED_GAP_PX);",
  "popover.dataset.surfaceSidebarViewportLeft = String(Math.round(left));",
  "popover.dataset.surfaceSidebarViewportTop = String(Math.round(top));",
  "function suppressSidebarShellOwnerDuplicateItems(popoverNode, ownerLabel)",
  "function suppressSidebarShellDuplicateSiblingItems(popoverNode)",
  "function syncSidebarShellHoverStateFromNode(node)",
  "syncSidebarShellHoverStateFromNode(event.relatedTarget);",
  "surfaceSidebarOwnerDuplicateHidden",
  "surfaceSidebarDuplicateHidden",
  "itemNode.dataset.surfaceSidebarItemKind = \"redundant-owner\";",
  "itemNode.dataset.surfaceSidebarItemKind = \"duplicate-menu-label\";",
  "directItems.length <= 1",
  "suppressSidebarShellOwnerDuplicateItems(popoverNode, ownerLabel);",
  "suppressSidebarShellDuplicateSiblingItems(popoverNode);",
]) {
  assert.ok(
    sidebarSource.includes(expectedToken),
    `sidebar_shell.js must keep cascaded popovers anchored with compact depth geometry token ${expectedToken}`
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
  "var hasCurrentActionIdMismatch",
  "routeOwnership.configuredActionIds.length",
  "!hasCurrentActionIdMismatch &&",
  "!hasCurrentActionIdMismatch && visibleListTable instanceof HTMLElement",
  "findVisibleFormWithoutMarker(config, { allowFallback: false })",
  "var formRoot = strictFormRoot instanceof HTMLElement",
  ": null;",
]) {
  assert.ok(
    workspaceSource.includes(expectedToken),
    `workspace ownership must not activate shared surfaces over mismatched native actions through token ${expectedToken}`
  );
}
for (const forbiddenToken of [
  "targetApp.appID",
  "findVisibleForm({}, { allowFallback: true })",
  "findVisibleForm(config, { allowFallback: actionScoped })",
]) {
  assert.ok(
    !workspaceSource.includes(forbiddenToken) && !menuSource.includes(forbiddenToken),
    `surface workspace shell must not keep legacy ownership fallback token ${forbiddenToken}`
  );
}
for (const expectedToken of [
  "function formMatchesStrictMarker(formRoot, config)",
  "var strictFormMarkerMatched = formMatchesStrictMarker(strictFormRoot, config);",
  "if (hasCurrentActionIdMismatch && !strictFormMarkerMatched)",
  "hasCurrentActionModelMismatch &&",
  "!strictFormMarkerMatched",
  "var strictListTable = !hasCurrentActionIdMismatch && visibleListTable instanceof HTMLElement",
  "function normalizePremiumWorkspaceToolbarConfig(commandBar, toolbar)",
  "delete normalized.commandBar.tabs",
  "delete normalized.commandBar.filters",
  'normalized.toolbar.tabs = commandBar.tabs',
  'normalized.toolbar.filters = commandBar.filters',
  "function buildSurfaceWorkspaceConsoleLayoutMarkup(config)",
  "function buildSurfaceWorkspaceConsoleMainMarkup(config)",
  "function buildSurfaceWorkspaceConsoleMetricsMarkup(metrics)",
  "o_surface_premium_metric_strip--right",
  'consoleRegion: "main"',
  'layout: "tabs-first"',
]) {
  assert.ok(
    workspaceSource.includes(expectedToken),
    `premium workspace console must route command-bar navigation through toolbar console token ${expectedToken}`
  );
}
for (const expectedToken of [
  "data-surface-console-region",
  "o_surface_workspace_console--",
  "regionClassToken",
  'var region = String(settings.consoleRegion || "main").trim() || "main";',
]) {
  assert.ok(
    chromeSource.includes(expectedToken),
    `workspace chrome must stamp declarative console regions through token ${expectedToken}`
  );
}
for (const expectedToken of [
  "function isSurfaceBackendRootNodeVisible(node)",
  "function isSurfaceBackendRootVisible()",
  "function isSurfaceWorkspaceActive()",
  "function shouldCanonicalizeSurfaceRouteActionBase(targetUrl, settings)",
  "preferCurrentActionBase",
  "requireWorkspaceActive",
  'document.querySelectorAll(".o_home_menu, .o_home_menu_background, .o_apps_menu")',
  "some(isSurfaceBackendRootNodeVisible)",
  "if (isSurfaceBackendRootVisible())",
  "settings.requireWorkspaceActive && !isSurfaceWorkspaceActive()",
  'targetUrl.pathname = "/odoo/action-" + String(serviceActionId)',
  "stripSurfaceRouteTail(window.location.pathname || \"/odoo\", settings)",
  "replaceSurfaceCurrentHistoryUrl(rootNextHref)",
  "function mutationTouchesSurfaceBackendRoot(mutations)",
  "mutationTouchesSurfaceBreadcrumb(mutations) || mutationTouchesSurfaceBackendRoot(mutations)",
]) {
  assert.ok(
    routeSource.includes(expectedToken),
    `route presentation must clear stale workspace state at backend root through token ${expectedToken}`
  );
}
for (const expectedToken of [
  "SURFACE_DESIGN_AUDIT_PRINCIPLES",
  "prefer-what-matters",
  "obvious-easy-possible",
  "usable-for-edge-benefits-all",
  "evidence-over-assumption",
  "function getSurfaceDesignAuditPrinciples()",
  "function isSurfaceAuditNodeVisible(node)",
  "function auditSurfaceWorkspaceDesign(rootNode, options)",
  "function auditSurfaceCommandBarRedundancy(rootNode, options)",
  "function auditSurfaceOverlayLegibility(rootNode)",
  "function auditSurfaceBreadcrumbGhostState(rootNode)",
  "function auditSurfaceListDensity(rootNode, options)",
  "listNode.closest && listNode.closest(\".o_form_view\")",
  "rows.length === 1",
  "function auditSurfaceMenuDuplicateLabels(rootNode)",
  "function auditSurfaceMetricPlacement(rootNode, options)",
  "function auditSurfaceModalControlContrast(rootNode)",
  "function auditSurfaceSidebarFlyoutGeometry(rootNode)",
  "function auditSurfaceTabGrammar(rootNode)",
  "function auditSurfaceMetricSignal(rootNode)",
  "command-bar-redundant-title",
  "command-bar-redundant-description",
  "empty-preview-action-column",
  "list-row-overstretched",
  "list-table-inherits-empty-floor",
  "modal-close-filter-inverts-icon",
  "modal-close-low-contrast",
  "overlay-legibility-weak-separation",
  "breadcrumb-ghost-after-workspace-exit",
  "duplicate-menu-label",
  "metric-strip-not-right-anchored",
  "preview-action-column-collapsed",
  "redundant-menu-owner-label",
  "sidebar-flyout-geometry-drift",
  "surface-tab-missing-key",
  "surface-tab-missing-role",
  "surface-tab-flat-hit-target",
  "zero-value-metric-alert",
  "Use compact: true, showHeader: false, or hideTitle: true",
  "Do not render managed preview columns unless at least one visible row has an action",
  "Keep empty-list floor on the renderer/shell",
  "Use the shared white close SVG token and keep filter: none",
  "Provide data-surface-tab-key",
  "Place operational stats in the shared right-side metrics region",
  "Use distinct action labels, keep group headers visible, or nest repeated labels under separate branches.",
  "Rename the grouping label, flatten the action, or move the repeated child to the parent level.",
  "Anchor nested flyouts to the parent popover edge and convert viewport coordinates to local containing-block offsets",
  "Hide the trend chip for neutral zero values",
  "Call restoreCanonicalBreadcrumb on inactive workspace transitions",
]) {
  assert.ok(
    debugSource.includes(expectedToken),
    `debug design audit helper must expose actionable rule token ${expectedToken}`
  );
}
const debugRuntime = loadDebugRuntimeForAuditTest(debugSource);
const ownerFlyout = debugRuntime.document.createElement("div");
ownerFlyout.className = "o_surface_sidebar_shell_menu_popover";
ownerFlyout.dataset.surfaceSidebarOwnerLabel = "Facturas";
const repeatedOwnerItem = debugRuntime.document.createElement("button");
repeatedOwnerItem.className = "dropdown-item";
repeatedOwnerItem.textContent = " Facturas ";
ownerFlyout.appendChild(repeatedOwnerItem);
const siblingItem = debugRuntime.document.createElement("button");
siblingItem.className = "dropdown-item";
siblingItem.textContent = "Crear";
ownerFlyout.appendChild(siblingItem);
debugRuntime.document.body.appendChild(ownerFlyout);
const ownerLabelFindings = debugRuntime.api.auditSurfaceMenuDuplicateLabels(debugRuntime.document);
assert.ok(
  ownerLabelFindings.some((finding) => finding.rule === "redundant-menu-owner-label"),
  "menu audit must flag a visible flyout whose direct child repeats data-surface-sidebar-owner-label"
);
assert.ok(
  debugRuntime.api.auditSurfaceWorkspaceDesign(debugRuntime.document)
    .some((finding) => finding.rule === "redundant-menu-owner-label"),
  "workspace design audit must include the reusable redundant-menu-owner-label rule"
);
const parentFlyout = debugRuntime.document.createElement("div");
parentFlyout.className = "o_surface_sidebar_shell_menu_popover";
parentFlyout.dataset.surfaceSidebarLevel = "1";
parentFlyout._rect = { left: 100, right: 292, top: 20, bottom: 180, width: 192, height: 160 };
const driftingFlyout = debugRuntime.document.createElement("div");
driftingFlyout.className = "o_surface_sidebar_shell_menu_popover";
driftingFlyout.dataset.surfaceSidebarLevel = "2";
driftingFlyout.dataset.surfaceSidebarSide = "right";
driftingFlyout.dataset.surfaceSidebarMaxNestedGap = "8";
driftingFlyout._rect = { left: 360, right: 540, top: 52, bottom: 180, width: 180, height: 128 };
parentFlyout.appendChild(driftingFlyout);
debugRuntime.document.body.appendChild(parentFlyout);
assert.ok(
  debugRuntime.api.auditSurfaceSidebarFlyoutGeometry(debugRuntime.document)
    .some((finding) => finding.rule === "sidebar-flyout-geometry-drift"),
  "menu geometry audit must flag nested flyouts that drift away from the parent popover"
);
for (const expectedToken of [
  "function buildActionBackedListWorkspace(config)",
  "function buildTabbedMonthWorkspaceChrome(config)",
  "var workspaceScaffold = settings.workspaceScaffold",
  "settings.showToolbarHeader !== true",
  "return null;",
  "showDescription: false",
  "buildCommonPremiumWorkspaceToolbarConsoleMarkup({",
  "buildActionBackedToolbarSelectionController({",
  "buildTabbedMonthListStateController({",
  "buildWorkspaceToolbarInteractionHandler({",
  "workspaceApi.buildManagedPreviewWorkspaceHooks({",
  "registerWorkspace(buildWorkspaceConfig())",
  "buildActionBackedListWorkspace: buildActionBackedListWorkspace",
  "registerActionBackedListWorkspace: registerActionBackedListWorkspace",
  "buildTabbedMonthWorkspaceChrome: buildTabbedMonthWorkspaceChrome",
]) {
  assert.ok(
    listWorkspaceSource.includes(expectedToken),
    `common list workspace must own reusable action-backed workspace token ${expectedToken}`
  );
}
for (const forbiddenToken of [
  '"CFDI"',
  '"Facturas"',
  '"Catalogo"',
  '"Configuracion"',
  '"Diseñador"',
  '"Fecha"',
  '"Todo periodo"',
  "settings.coreWorkspace",
  "coreWorkspace",
  "Fiax",
  "fiax_",
]) {
  assert.ok(
    !listWorkspaceSource.includes(forbiddenToken),
    `common list workspace must stay business-neutral and not include ${forbiddenToken}`
  );
}

const workspaceRuntime = loadWorkspaceRuntimeForMarkupTest(workspaceSource);
const consoleLayoutMarkup = workspaceRuntime.buildSurfaceWorkspaceConsoleLayoutMarkup({
  commandBar: { title: "Facturas" },
  toolbar: { layout: "filters-first" },
  metrics: { metrics: [{ label: "Total", value: "$1" }] },
  smartTable: { columns: [], rows: [] },
  validationRail: { title: "Validacion" },
  emptyState: { title: "Sin datos" },
  bodyMarkup: '<aside data-region="body"></aside>',
});
assert.ok(
  !consoleLayoutMarkup.includes("[object Object]"),
  "workspace console layout must render object specs instead of leaking [object Object]"
);
for (const expectedToken of [
  'data-region="command"',
  'data-region="metrics"',
  'data-region="validation"',
  'data-region="empty"',
  'data-layout="filters-first"',
  "o_surface_premium_metric_strip--right",
  "o_surface_workspace_console_region--table",
  "o_surface_workspace_console_region--validation",
  "o_surface_workspace_console_region--empty",
]) {
  assert.ok(
    consoleLayoutMarkup.includes(expectedToken),
    `workspace console layout runtime must emit ${expectedToken}`
  );
}

assert.ok(
  markupSource.includes('<strong class="o_surface_premium_metric__value">'),
  "premium metric values must use semantic strong elements for live auditability"
);
for (const expectedToken of [
  "settings.showHeader !== false",
  "settings.hideDescription === true",
  'mode === "compact"',
  "var meta = String(settings.meta || \"\").trim();",
  "(meta ? '<span>' + escapeHtml(meta) + \"</span>\" : \"\")",
  "o_surface_premium_command_bar--compact",
  "o_surface_premium_command_bar--no-header",
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
  "body.o_surface_workspace_active.o_surface_workspace_list {",
  "--o-surface-modal-close-bg",
  "--o-surface-premium-list-floor",
  "--o-surface-premium-list-floor: clamp(22rem, calc(100vh - 15rem), 42rem);",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_view",
  "min-height: var(--o-surface-premium-list-floor)",
  "min-block-size: var(--o-surface-premium-list-floor)",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer",
  "background: rgba(17, 21, 30, 0.22)",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer.table-responsive",
  "overflow-x: auto !important",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer > table.o_list_table",
  "height: auto !important",
  "min-height: 0 !important",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer > table.o_list_table > tbody > tr.o_data_row > td",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer > table.o_list_table > tbody > tr:not([class])",
  "body.o_surface_workspace_active.o_surface_workspace_list .o_content .o_list_renderer > table.o_list_table > tbody > tr[class=\"\"]",
  "display: none !important",
  "body.o_surface_workspace_active.o_surface_workspace_list {\n    --o-surface-premium-list-floor: clamp(16rem, calc(100dvh - 12rem), 30rem);",
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_surface_workspace_console__tab",
  "body.o_surface_workspace_active :where(.o_dialog .btn-close, .o_technical_modal .btn-close, .modal .btn-close)",
  "background-image: var(--o-surface-modal-close-bg) !important",
  "filter: none !important",
  "opacity: 0.92 !important",
  "--o-surface-tab-font-size-current",
  "--o-surface-tab-min-height-current",
  "font-size: var(--o-surface-tab-font-size-current)",
  "min-height: var(--o-surface-tab-min-height-current)",
  ".o_surface_workspace_toolbar__nav::-webkit-scrollbar",
  "body.o_surface_workspace_active :where(.o_surface_premium_metric_strip--right)",
  "grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));",
  "justify-content: end",
  "width: fit-content",
  "justify-content: flex-end",
  "body.o_surface_workspace_active :where(.o_surface_premium_command_bar--compact, .o_surface_premium_command_bar--no-header)",
  "body.o_surface_workspace_active :where(.o_surface_premium_command_bar--compact .o_surface_premium_command_bar__context, .o_surface_premium_command_bar--no-header .o_surface_premium_command_bar__context)",
  "body.o_surface_workspace_active :where(.o_surface_premium_command_bar--compact .o_surface_premium_cluster, .o_surface_premium_command_bar--no-header .o_surface_premium_cluster)",
  "body.o_surface_workspace_active :where(.o_surface_premium_metric__trend--danger)",
  "body.o_surface_workspace_active :where(.o_surface_premium_metric__trend--warning)",
  "body.o_surface_workspace_active :where(.o_surface_premium_metric__trend--success)",
  "body.o_web_client.o_surface_sidebar_shell_active .o_surface_sidebar_shell_menu_popover",
  "body.o_web_client.o_surface_workspace_active .o_popover.popover:not(.o_surface_sidebar_shell_menu_popover)",
  "width: 5.4rem !important",
  "table.o_list_table:has(.o_list_actions_header) .o_surface_record_preview_header",
  "inset-inline-end: var(--o-surface-record-native-action-width, 2.4rem)",
  "position: sticky",
  "justify-content: center",
  "background: rgb(21, 25, 35) !important",
  "-webkit-backdrop-filter: blur(12px) saturate(1.08)",
  "outline: 1px solid rgba(7, 10, 18, 0.74)",
  "isolation: isolate",
  "color: rgba(244, 246, 251, 0.94) !important",
  "background: rgba(255, 255, 255, 0.115) !important",
  "flex: 1 1 8.5rem",
  "min-width: 8.5rem",
  'grid-template-areas:',
  '"main metrics"',
  "grid-area: metrics",
  "grid-area: main",
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_control_panel .o_control_panel_breadcrumbs:has(> .o_control_panel_main_buttons:not(:empty))",
  "body.o_surface_workspace_active:not(.o_surface_workspace_form) .o_control_panel .o_control_panel_actions:has(.o_selection_container)",
  "min-width: max-content",
  "width: max-content !important",
  "justify-content: flex-start !important",
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
