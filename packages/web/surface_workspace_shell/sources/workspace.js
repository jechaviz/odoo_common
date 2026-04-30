(function () {
  "use strict";

  var surfaceLayers = window.OdooSurfaceLayers || {};
  var shared = surfaceLayers._shared && typeof surfaceLayers._shared === "object"
    ? surfaceLayers._shared
    : (surfaceLayers._shared = {});
  var workspaceApi = surfaceLayers.workspaceRuntime && typeof surfaceLayers.workspaceRuntime === "object"
    ? surfaceLayers.workspaceRuntime
    : {};
  var handlesByKey = workspaceApi._handlesByKey && typeof workspaceApi._handlesByKey === "object"
    ? workspaceApi._handlesByKey
    : Object.create(null);
  var MANAGED_ATTR = "data-surface-managed";
  var BREADCRUMB_LINK_ATTR = "data-surface-breadcrumb-link";
  var SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS = "o_surface_topbar_breadcrumb_host";
  var SURFACE_RETURN_FOCUS_CLASS = "o_surface_return_focus";
  var WORKSPACE_HINT_STORAGE_KEY = "odoo.surface.workspaceHint";
  var LIST_RETURN_STORAGE_KEY_PREFIX = "odoo.surface.return.";
  var breadcrumbBridgeInstalled = false;

  function getManagedFormEnhancerRegistry() {
    if (!Array.isArray(shared.surfaceManagedFormEnhancers)) {
      shared.surfaceManagedFormEnhancers = [];
    }
    return shared.surfaceManagedFormEnhancers;
  }

  function cloneManagedFormEnhancers(rawEntries) {
    return (Array.isArray(rawEntries) ? rawEntries : []).map(function (entry) {
      return entry && typeof entry === "object" ? Object.assign({}, entry) : null;
    }).filter(Boolean);
  }

  function registerManagedFormEnhancer(definition) {
    if (!(definition && typeof definition === "object")) {
      return false;
    }
    var key = String(definition.key || "").trim();
    var sync = typeof definition.sync === "function"
      ? definition.sync
      : null;
    if (!key || !sync) {
      return false;
    }
    var registry = getManagedFormEnhancerRegistry().filter(function (entry) {
      return !(entry && typeof entry === "object" && String(entry.key || "").trim() === key);
    });
    registry.push({
      key: key,
      sync: sync,
    });
    shared.surfaceManagedFormEnhancers = registry;
    return true;
  }

  function syncManagedFormEnhancers(config, state) {
    if (!(state && state.isForm && state.formRoot instanceof HTMLElement)) {
      return false;
    }
    var registry = getManagedFormEnhancerRegistry();
    if (!registry.length) {
      return false;
    }
    var executed = false;
    registry.forEach(function (entry) {
      if (!(entry && typeof entry === "object") || typeof entry.sync !== "function") {
        return;
      }
      executed = true;
      try {
        var result = entry.sync(config, state);
        if (result && typeof result.then === "function") {
          result.catch(function () {});
        }
      } catch (_error) {}
    });
    return executed;
  }

  function resolveMutationElement(node) {
    if (node instanceof HTMLElement) {
      return node;
    }
    return node && node.parentElement instanceof HTMLElement
      ? node.parentElement
      : null;
  }

  function hasManagedMarker(element) {
    return !!(
      element instanceof HTMLElement &&
      element.getAttribute(MANAGED_ATTR) === "1"
    );
  }

  function setManagedMarker(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (element.getAttribute(MANAGED_ATTR) !== "1") {
      element.setAttribute(MANAGED_ATTR, "1");
    }
  }

  function isManagedWorkspaceElement(node, config) {
    var element = resolveMutationElement(node);
    var toolbarId = String(config && config.toolbarId || "").trim();
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (
      Math.max(Number(shared.surfaceBreadcrumbActionsInspectionCounter || 0) || 0, 0) > 0 &&
      (
        element.closest(".o_popover.o-dropdown--menu") ||
        element.closest(".o-dropdown--menu[role='menu']") ||
        element.closest(".dropdown-menu") ||
        element.closest(".o_control_panel_breadcrumbs_actions")
      )
    ) {
      return true;
    }
    if (
      element.closest("[data-surface-breadcrumb-managed='1']") ||
      element.closest("[data-surface-breadcrumb-root='1']") ||
      element.closest("[data-surface-breadcrumb-synthetic='1']") ||
      element.closest("." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS)
    ) {
      return true;
    }
    if (element.closest("[" + MANAGED_ATTR + "='1']")) {
      return true;
    }
    return !!(
      toolbarId &&
      element.closest("#" + toolbarId)
    );
  }

  function isManagedWorkspaceMutation(mutations, config) {
    var entries = Array.isArray(mutations) ? mutations : [];
    if (!entries.length) {
      return false;
    }
    return entries.every(function (mutation) {
      if (!(mutation && typeof mutation === "object")) {
        return false;
      }
      var mutationTarget = resolveMutationElement(mutation.target);
      if (isManagedWorkspaceElement(mutationTarget, config)) {
        return true;
      }
      if (mutation.type === "attributes") {
        if (mutationTarget === document.body) {
          return true;
        }
        return isManagedWorkspaceElement(mutation.target, config);
      }
      var changedNodes = Array.prototype.slice.call(mutation.addedNodes || [])
        .concat(Array.prototype.slice.call(mutation.removedNodes || []));
      if (!changedNodes.length) {
        return false;
      }
      return changedNodes.every(function (node) {
        return isManagedWorkspaceElement(node, config);
      });
    });
  }

  function escapeHtml(value) {
    if (typeof surfaceLayers.escapeHtml === "function") {
      return String(surfaceLayers.escapeHtml(value) || "");
    }
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseSearchParams(rawValue) {
    if (typeof surfaceLayers.parseSearchParams === "function") {
      return surfaceLayers.parseSearchParams(rawValue);
    }
    try {
      return new URLSearchParams(String(rawValue || ""));
    } catch (_error) {
      return new URLSearchParams("");
    }
  }

  function normalizePathname(pathname) {
    return String(surfaceLayers.normalizePathname(pathname) || "/");
  }

  function readCurrentUrl() {
    try {
      return new URL(String(window.location.href || ""), window.location.origin);
    } catch (_error) {
      return null;
    }
  }

  function readCurrentViewType(url) {
    var sourceUrl = url || readCurrentUrl();
    var searchParams = sourceUrl ? sourceUrl.searchParams : parseSearchParams(window.location.search || "");
    var hashParams = parseSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    return String(searchParams.get("view_type") || hashParams.get("view_type") || "").trim().toLowerCase();
  }

  function readCurrentRecordId(url) {
    var sourceUrl = url || readCurrentUrl();
    var pathname = normalizePathname(sourceUrl ? sourceUrl.pathname : window.location.pathname || "");
    var segments = pathname.split("/").filter(Boolean);
    for (var index = segments.length - 1; index >= 0; index -= 1) {
      var segment = String(segments[index] || "").trim();
      if (/^\d+$/.test(segment)) {
        return Number.parseInt(segment, 10) || 0;
      }
    }
    var searchParams = sourceUrl ? sourceUrl.searchParams : parseSearchParams(window.location.search || "");
    var hashParams = parseSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    return Number.parseInt(String(hashParams.get("id") || searchParams.get("id") || 0), 10) || 0;
  }

  function hasExplicitWorkspaceRoute(url) {
    return getActionIdsFromUrl(url).length > 0;
  }

  function getActionIdsFromUrl(url) {
    var sourceUrl = url || readCurrentUrl();
    var ids = [];
    var pathname = normalizePathname(sourceUrl ? sourceUrl.pathname : window.location.pathname || "");
    if (typeof surfaceLayers.extractActionIdsFromPathname === "function") {
      ids = ids.concat(surfaceLayers.extractActionIdsFromPathname(pathname));
    } else {
      ids = ids.concat(
        Array.from(String(pathname || "").matchAll(/action-(\d+)/g)).map(function (entry) {
          return Number.parseInt(String(entry && entry[1] || ""), 10) || 0;
        })
      );
    }
    [sourceUrl ? sourceUrl.searchParams : parseSearchParams(window.location.search || ""), parseSearchParams(String(window.location.hash || "").replace(/^#/, ""))]
      .forEach(function (searchParams) {
        var actionId = Number.parseInt(String(searchParams.get("action") || ""), 10) || 0;
        if (actionId > 0) {
          ids.push(actionId);
        }
      });
    return ids.filter(function (actionId) {
      return actionId > 0;
    });
  }

  function getCurrentActionIdFromUrl(url) {
    var sourceUrl = url || readCurrentUrl();
    var pathname = normalizePathname(sourceUrl ? sourceUrl.pathname : window.location.pathname || "");
    var searchParams = sourceUrl ? sourceUrl.searchParams : parseSearchParams(window.location.search || "");
    var hashParams = parseSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    var pathnameActionId = typeof surfaceLayers.resolveCurrentActionIdFromUrl === "function"
      ? Number.parseInt(String(surfaceLayers.resolveCurrentActionIdFromUrl(sourceUrl || undefined) || 0), 10) || 0
      : 0;
    var searchActionId = Number.parseInt(String(searchParams.get("action") || 0), 10) || 0;
    var hashActionId = Number.parseInt(String(hashParams.get("action") || 0), 10) || 0;
    return hashActionId || searchActionId || pathnameActionId || 0;
  }

  function isElementVisible(node) {
    if (typeof surfaceLayers.isElementVisible === "function") {
      return !!surfaceLayers.isElementVisible(node);
    }
    if (!(node instanceof HTMLElement) || node.hidden) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    return styles.display !== "none" && styles.visibility !== "hidden";
  }

  function isElementInsideModal(node) {
    if (typeof surfaceLayers.isElementInsideModal === "function") {
      return !!surfaceLayers.isElementInsideModal(node);
    }
    return !!(
      node instanceof HTMLElement &&
      node.closest(".modal, .o_dialog, .o_technical_modal, .modal-backdrop, .o_modal_backdrop")
    );
  }

  function findVisibleListTable() {
    if (typeof surfaceLayers.findVisibleListTable === "function") {
      return surfaceLayers.findVisibleListTable({
        selector: "table.o_list_table",
      });
    }
    var tables = Array.prototype.slice.call(document.querySelectorAll("table.o_list_table"));
    return tables.find(function (table) {
      return table instanceof HTMLElement && !isElementInsideModal(table) && isElementVisible(table);
    }) || null;
  }

  function findVisibleForm(config, options) {
    if (typeof surfaceLayers.findVisibleForm === "function") {
      return surfaceLayers.findVisibleForm(
        Object.assign({}, config && typeof config === "object" ? config : {}, options && typeof options === "object" ? options : {})
      );
    }
    return null;
  }

  function resolveHostNode(rootNode) {
    return rootNode instanceof HTMLElement
      ? (rootNode.closest(".o_action, .o_view_controller, .o_content, .o_action_manager") || rootNode)
      : null;
  }

  function resolveControlPanel(hostNode) {
    if (typeof surfaceLayers.resolveScopedControlPanel === "function") {
      return surfaceLayers.resolveScopedControlPanel({
        hostNode: hostNode,
        selector: ".o_control_panel",
        fallbackSelector: ".o_control_panel",
      });
    }
    var scoped = hostNode instanceof HTMLElement ? hostNode.querySelector(".o_control_panel") : null;
    return scoped instanceof HTMLElement ? scoped : document.querySelector(".o_control_panel");
  }

  function readWorkspaceHint() {
    try {
      return String(window.sessionStorage.getItem(WORKSPACE_HINT_STORAGE_KEY) || "").trim().toLowerCase();
    } catch (_error) {
      return "";
    }
  }

  function writeWorkspaceHint(value) {
    try {
      var normalized = String(value || "").trim().toLowerCase();
      if (!normalized) {
        window.sessionStorage.removeItem(WORKSPACE_HINT_STORAGE_KEY);
        return;
      }
      window.sessionStorage.setItem(WORKSPACE_HINT_STORAGE_KEY, normalized);
    } catch (_error) {}
  }

  function hasManagedBreadcrumb(controlPanel) {
    var managedRoot = resolveManagedBreadcrumbRoot(controlPanel);
    if (managedRoot instanceof HTMLElement) {
      return true;
    }
    return !!document.querySelector(
      ".o_main_navbar ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS + " [data-surface-breadcrumb-root='1'], " +
      ".o_control_panel [data-surface-breadcrumb-root='1'], " +
      ".o_main_navbar ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS + " [data-surface-breadcrumb-managed='1'], " +
      ".o_control_panel [data-surface-breadcrumb-managed='1']"
    );
  }

  function readBreadcrumbTrail(controlPanel) {
    var root = controlPanel instanceof HTMLElement ? controlPanel : document;
    var candidates = Array.prototype.slice.call(
      root.querySelectorAll(".o_surface_breadcrumb_item, .breadcrumb-item, .o_breadcrumb_item, .o_last_breadcrumb_item, .breadcrumb li")
    );
    return candidates.map(function (node) {
      return node instanceof HTMLElement ? String(node.textContent || "").replace(/\s+/g, " ").trim() : "";
    }).filter(Boolean);
  }

  function matchesActionTrail(config, breadcrumbTrail) {
    var labels = (Array.isArray(config.actionLabels) ? config.actionLabels : []).map(function (label) {
      return String(label || "").replace(/\s+/g, " ").trim();
    }).filter(Boolean);
    var trail = Array.isArray(breadcrumbTrail) ? breadcrumbTrail : [];
    if (!labels.length || !trail.length) {
      return false;
    }
    var lastLabel = String(trail[trail.length - 1] || "").trim();
    if (labels.indexOf(lastLabel) !== -1) {
      return true;
    }
    if (trail.length < 2) {
      return false;
    }
    return labels.indexOf(String(trail[trail.length - 2] || "").trim()) !== -1;
  }

  function findNativeCreateButton(controlPanel, toolbarId) {
    if (typeof surfaceLayers.findNativeCreateButton === "function") {
      return surfaceLayers.findNativeCreateButton({
        controlPanel: controlPanel,
        toolbarId: toolbarId,
      });
    }
    return null;
  }

  function relabelNativeCreateButton(button, label) {
    if (typeof surfaceLayers.relabelNativeCreateButton === "function") {
      surfaceLayers.relabelNativeCreateButton(button, label);
    }
  }

  function readFieldText(formRoot, names) {
    var root = formRoot instanceof HTMLElement ? formRoot : document;
    var candidates = Array.isArray(names) ? names : [names];
    for (var index = 0; index < candidates.length; index += 1) {
      var name = String(candidates[index] || "").trim();
      if (!name) {
        continue;
      }
      var fieldRoot = root.querySelector("[name='" + name + "'], [data-name='" + name + "']");
      if (!(fieldRoot instanceof HTMLElement)) {
        continue;
      }
      var input = fieldRoot.matches("input, textarea, select")
        ? fieldRoot
        : fieldRoot.querySelector("input, textarea, select");
      var value = String(
        (input && "value" in input && input.value) ||
        fieldRoot.getAttribute("data-value") ||
        fieldRoot.textContent ||
        ""
      ).replace(/\s+/g, " ").trim();
      if (value) {
        return value;
      }
    }
    return "";
  }

  function buildActionFromFactory(factory, state, config) {
    if (typeof factory !== "function") {
      return null;
    }
    try {
      return factory(state, config, workspaceApi) || null;
    } catch (_error) {
      return null;
    }
  }

  function cloneSurfaceNavItems(rawItems) {
    return (Array.isArray(rawItems) ? rawItems : []).map(function (item) {
      return item && typeof item === "object" ? Object.assign({}, item) : null;
    }).filter(Boolean);
  }

  function cloneSurfaceNavActions(actionFactories) {
    return actionFactories && typeof actionFactories === "object"
      ? Object.assign({}, actionFactories)
      : {};
  }

  function buildSurfaceWorkspaceShellConfig(options) {
    var settings = options && typeof options === "object" ? options : {};
    var shellSettings = settings.shell && typeof settings.shell === "object" ? settings.shell : {};
    var normalized = Object.assign({}, settings);
    delete normalized.shell;
    normalized.navItems = cloneSurfaceNavItems(
      Array.isArray(settings.navItems) ? settings.navItems : shellSettings.navItems
    );
    normalized.navActions = cloneSurfaceNavActions(
      settings.navActions && typeof settings.navActions === "object"
        ? settings.navActions
        : shellSettings.navActions
    );
    normalized.managedFormEnhancers = cloneManagedFormEnhancers(
      Array.isArray(settings.managedFormEnhancers)
        ? settings.managedFormEnhancers
        : shellSettings.managedFormEnhancers
    );
    if (!Object.prototype.hasOwnProperty.call(normalized, "showSecondary")) {
      normalized.showSecondary = false;
    }
    if (!Object.prototype.hasOwnProperty.call(normalized, "preserveListFocus")) {
      normalized.preserveListFocus = true;
    }
    if (!Object.prototype.hasOwnProperty.call(normalized, "sidebarSectionKey")) {
      normalized.sidebarSectionKey = String(shellSettings.sidebarSectionKey || "").trim();
    }
    if (
      !Object.prototype.hasOwnProperty.call(normalized, "getChips") &&
      shellSettings.emptyChips !== false
    ) {
      normalized.getChips = function () { return []; };
    }
    return normalized;
  }

  function resolveToolbarText(config, state, propertyName, resolverName, fallback) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings[resolverName] === "function") {
      try {
        var resolved = String(settings[resolverName](state, settings, workspaceApi) || "").trim();
        if (resolved) {
          return resolved;
        }
      } catch (_error) {}
    }
    var configured = String(settings[propertyName] || "").trim();
    return configured || String(fallback || "").trim();
  }

  function normalizeBreadcrumbText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function buildBreadcrumbItem(label, options) {
    if (typeof surfaceLayers.buildSurfaceBreadcrumbItem === "function") {
      return surfaceLayers.buildSurfaceBreadcrumbItem(label, options);
    }
    var normalizedLabel = normalizeBreadcrumbText(label);
    var settings = options && typeof options === "object" ? options : {};
    if (!normalizedLabel) {
      return null;
    }
    return Object.assign({ label: normalizedLabel }, settings);
  }

  function buildHomeBreadcrumbItem(options) {
    if (typeof surfaceLayers.buildSurfaceHomeBreadcrumbItem === "function") {
      return surfaceLayers.buildSurfaceHomeBreadcrumbItem(options);
    }
    var settings = options && typeof options === "object" ? options : {};
    return buildBreadcrumbItem("Home", Object.assign({ href: "/odoo" }, settings));
  }

  function buildWorkspaceActionHref(actionRequest, options) {
    if (typeof surfaceLayers.buildSurfaceActionHref === "function") {
      return surfaceLayers.buildSurfaceActionHref(actionRequest, options);
    }
    return "";
  }

  function resolveBreadcrumbHref(item, state, config, actionRequest) {
    var entry = item && typeof item === "object" ? item : null;
    if (!entry) {
      return "";
    }
    var explicitHref = "";
    if (typeof entry.getHref === "function") {
      try {
        explicitHref = String(entry.getHref(state, config, workspaceApi, actionRequest) || "").trim();
      } catch (_error) {
        explicitHref = "";
      }
    } else if (typeof entry.href === "function") {
      try {
        explicitHref = String(entry.href(state, config, workspaceApi, actionRequest) || "").trim();
      } catch (_error) {
        explicitHref = "";
      }
    } else {
      explicitHref = String(entry.href || "").trim();
    }
    if (explicitHref) {
      return explicitHref;
    }
    if (actionRequest != null && typeof workspaceApi.buildWorkspaceActionHref === "function") {
      var hrefOptions = entry.hrefOptions && typeof entry.hrefOptions === "object"
        ? entry.hrefOptions
        : {
            viewType: entry.viewType,
            resId: entry.resId,
          };
      return String(workspaceApi.buildWorkspaceActionHref(actionRequest, {
        viewType: hrefOptions.viewType,
        resId: hrefOptions.resId,
      }) || "").trim();
    }
    return "";
  }

  function normalizeBreadcrumbItem(item, state, config) {
    if (!(item && typeof item === "object") || Array.isArray(item)) {
      var primitiveLabel = normalizeBreadcrumbText(item);
      return primitiveLabel
        ? { label: primitiveLabel, href: "", action: null, workspaceHint: "", target: "" }
        : null;
    }
    var label = "";
    if (typeof item.getLabel === "function") {
      try {
        label = normalizeBreadcrumbText(item.getLabel(state, config, workspaceApi));
      } catch (_error) {
        label = "";
      }
    } else {
      label = normalizeBreadcrumbText(item.label);
    }
    if (!label) {
      return null;
    }
    var actionRequest = null;
    if (typeof item.getAction === "function") {
      try {
        actionRequest = item.getAction(state, config, workspaceApi) || null;
      } catch (_error) {
        actionRequest = null;
      }
    } else if (typeof item.actionFactory === "function") {
      actionRequest = buildActionFromFactory(item.actionFactory, state, config);
    } else if (typeof item.action === "function") {
      actionRequest = buildActionFromFactory(item.action, state, config);
    } else {
      actionRequest = item.action;
    }
    var href = resolveBreadcrumbHref(item, state, config, actionRequest);
    if (href && item.preferAction !== true) {
      actionRequest = null;
    }
    return {
      label: label,
      href: href,
      action: actionRequest,
      workspaceHint: normalizeBreadcrumbText(item.workspaceHint),
      target: String(item.target || "").trim(),
      current: !!item.current,
      menu: Array.isArray(item.menu)
        ? item.menu.map(function (entry) {
            return normalizeBreadcrumbItem(entry, state, config);
          }).filter(function (entry) {
            return !!(entry && entry.label);
          })
        : [],
    };
  }

  function resolveBreadcrumbItems(config, state) {
    var settings = config && typeof config === "object" ? config : {};
    var items = [];
    if (typeof settings.getBreadcrumbItems === "function") {
      try {
        items = settings.getBreadcrumbItems(state, settings, workspaceApi);
      } catch (_error) {
        items = [];
      }
    } else if (Array.isArray(settings.breadcrumbItems)) {
      items = settings.breadcrumbItems;
    }
    return (Array.isArray(items) ? items : []).map(function (item) {
      return normalizeBreadcrumbItem(item, state, settings);
    }).filter(function (item) {
      return !!(item && item.label);
    });
  }

  function resolveBreadcrumbLabel(config, state) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.getBreadcrumbLabel === "function") {
      try {
        var resolved = String(settings.getBreadcrumbLabel(state, settings, workspaceApi) || "").trim();
        if (resolved) {
          return resolved;
        }
      } catch (_error) {}
    }
    return state && state.recordLabel
      ? String(state.recordLabel || "").trim()
      : String(settings.title || "").trim();
  }

  async function resolveActionService() {
    if (typeof surfaceLayers.resolveOdooService === "function") {
      return surfaceLayers.resolveOdooService("action");
    }
    return null;
  }

  async function performAction(actionRequest) {
    if (actionRequest == null) {
      return false;
    }
    var actionService = await resolveActionService();
    if (!(actionService && typeof actionService.doAction === "function")) {
      return false;
    }
    try {
      await actionService.doAction(actionRequest);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function installBreadcrumbBridge() {
    if (breadcrumbBridgeInstalled) {
      return;
    }
    breadcrumbBridgeInstalled = true;
    document.addEventListener("click", function (event) {
      var target = event.target instanceof HTMLElement
        ? event.target.closest(
            "[" + BREADCRUMB_LINK_ATTR + "='1']"
          )
        : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var workspaceHint = normalizeBreadcrumbText(target.dataset.surfaceBreadcrumbHint || "");
      if (workspaceHint) {
        writeWorkspaceHint(workspaceHint);
      }
      var actionRequest = target.__surfaceBreadcrumbAction;
      if (actionRequest == null) {
        return;
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      performAction(actionRequest).catch(function () {});
    }, true);
  }

  function shouldShowWorkspaceNav() {
    return !(
      document.body instanceof HTMLElement &&
      document.body.classList.contains("o_surface_sidebar_shell_active") &&
      window.innerWidth >= 1200
    );
  }

  function buildToolbarMarkup(config, state) {
    var navItems = Array.isArray(config.navItems) ? config.navItems : [];
    var showWorkspaceNav = !state.isForm && shouldShowWorkspaceNav() && navItems.length;
    var showSecondary = !!(state.isForm && config.showSecondary !== false);
    var secondaryLabel = resolveToolbarText(config, state, "secondaryLabel", "getSecondaryLabel", "Volver al listado");
    if (!showWorkspaceNav && !showSecondary) {
      return "";
    }
    return (
      '<div class="o_surface_workspace_toolbar__bar">' +
      (showWorkspaceNav
        ? '<div class="o_surface_workspace_toolbar__nav" role="tablist">' +
          navItems.map(function (item) {
            var key = String(item && item.key || "").trim();
            var label = String(item && item.label || "").trim();
            var isActive = key && key === config.key;
            return (
              '<button type="button" class="o_surface_workspace_toolbar__nav_item' +
              (isActive ? " is-active" : "") +
              '" data-surface-nav="' + escapeHtml(key) +
              '" aria-selected="' + (isActive ? "true" : "false") + '">' +
              escapeHtml(label) +
              "</button>"
            );
          }).join("") +
          "</div>"
        : "") +
      (showSecondary
        ? '<div class="o_surface_workspace_toolbar__actions">' +
          '<button type="button" class="btn btn-secondary o_surface_workspace_toolbar__button o_surface_workspace_toolbar__button--secondary" data-surface-intent="list">' + escapeHtml(secondaryLabel) + "</button>" +
          "</div>"
        : "") +
      "</div>"
    );
  }

  function dispatchToolbarInteraction(config, state, handle, toolbar, target, event) {
    if (!(target instanceof HTMLElement) || typeof config.handleToolbarInteraction !== "function") {
      return false;
    }
    try {
      return config.handleToolbarInteraction({
        config: config,
        state: state,
        handle: handle,
        toolbar: toolbar,
        target: target,
        event: event,
        performAction: performAction,
        buildActionFromFactory: buildActionFromFactory,
        writeWorkspaceHint: writeWorkspaceHint,
        workspaceApi: workspaceApi,
      }) === true;
    } catch (_error) {
      return false;
    }
  }

  function ensureToolbar(config, state, handle) {
    var controlPanel = state.controlPanel;
    if (!(controlPanel instanceof HTMLElement)) {
      return null;
    }
    var toolbar = document.getElementById(config.toolbarId);
    var contentNode = null;
    if (!(toolbar instanceof HTMLElement)) {
      toolbar = document.createElement("div");
      toolbar.id = config.toolbarId;
      toolbar.className = "o_surface_workspace_toolbar o_surface_workspace_toolbar--" + config.key;
      setManagedMarker(toolbar);
      var handleToolbarEvent = function (event) {
        var target = event.target instanceof HTMLElement
          ? event.target.closest("[data-surface-intent], [data-surface-nav], [data-surface-tab], [data-surface-filter], [data-surface-toolbar-control]")
          : null;
        if (!(target instanceof HTMLElement) || !toolbar.contains(target)) {
          return;
        }
        if (dispatchToolbarInteraction(config, handle.lastState || state, handle, toolbar, target, event)) {
          return;
        }
        var intent = String(target.dataset.surfaceIntent || "").trim();
        if (intent === "create") {
          event.preventDefault();
          writeWorkspaceHint(config.key);
          performAction(buildActionFromFactory(config.buildCreateAction, handle.lastState || state, config)).catch(function () {});
          return;
        }
        if (intent === "list") {
          event.preventDefault();
          writeWorkspaceHint(config.key);
          performAction(buildActionFromFactory(config.buildListAction, handle.lastState || state, config)).catch(function () {});
          return;
        }
        var navKey = String(target.dataset.surfaceNav || "").trim();
        if (!navKey || navKey === config.key) {
          return;
        }
        var navActions = config.navActions && typeof config.navActions === "object" ? config.navActions : {};
        event.preventDefault();
        writeWorkspaceHint(navKey);
        removeToolbar(config);
        performAction(buildActionFromFactory(navActions[navKey], handle.lastState || state, config)).catch(function () {});
      };
      toolbar.addEventListener("click", handleToolbarEvent, true);
      toolbar.addEventListener("change", handleToolbarEvent, true);
    }
    var toolbarAnchor = controlPanel.querySelector(".o_control_panel_main");
    if (
      toolbar.parentElement !== controlPanel ||
      (
        toolbarAnchor instanceof HTMLElement &&
        toolbar.previousElementSibling !== toolbarAnchor
      )
    ) {
      if (toolbarAnchor instanceof HTMLElement && toolbarAnchor.parentElement === controlPanel) {
        toolbarAnchor.insertAdjacentElement("afterend", toolbar);
      } else {
        controlPanel.appendChild(toolbar);
      }
    }
    setManagedMarker(toolbar);
    contentNode = toolbar.querySelector(".o_surface_workspace_toolbar__content");
    if (!(contentNode instanceof HTMLElement)) {
      contentNode = document.createElement("div");
      contentNode.className = "o_surface_workspace_toolbar__content";
      setManagedMarker(contentNode);
      var movableNodes = Array.prototype.slice.call(toolbar.childNodes).filter(function (node) {
        return !(
          node instanceof HTMLElement &&
          node.classList.contains("o_surface_workspace_toolbar__console")
        );
      });
      toolbar.insertBefore(contentNode, toolbar.firstChild || null);
      movableNodes.forEach(function (node) {
        contentNode.appendChild(node);
      });
    } else if (!hasManagedMarker(contentNode)) {
      setManagedMarker(contentNode);
    }
    var markup = buildToolbarMarkup(config, state);
    var consoleNode = toolbar.querySelector(".o_surface_workspace_toolbar__console");
    if (
      state.isForm &&
      !markup &&
      config.preserveEmptyFormToolbar !== true &&
      !(consoleNode instanceof HTMLElement && String(consoleNode.innerHTML || "").trim())
    ) {
      removeToolbar(config);
      return null;
    }
    if (contentNode.innerHTML !== markup) {
      contentNode.innerHTML = markup;
    }
    return toolbar;
  }

  function resolveToolbarNode(toolbarRef) {
    if (toolbarRef instanceof HTMLElement) {
      return toolbarRef;
    }
    var toolbarId = String(toolbarRef || "").trim();
    if (!toolbarId) {
      return null;
    }
    var toolbar = document.getElementById(toolbarId);
    return toolbar instanceof HTMLElement ? toolbar : null;
  }

  function syncWorkspaceToolbarConsole(options) {
    var settings = options && typeof options === "object" ? options : {};
    var toolbar = resolveToolbarNode(settings.toolbar || settings.toolbarId);
    if (!(toolbar instanceof HTMLElement)) {
      return null;
    }
    var consoleNode = toolbar.querySelector(".o_surface_workspace_toolbar__console");
    if (settings.active === false) {
      if (consoleNode instanceof HTMLElement) {
        consoleNode.remove();
      }
      return null;
    }
    if (!(consoleNode instanceof HTMLElement)) {
      consoleNode = document.createElement("div");
      consoleNode.className = "o_surface_workspace_toolbar__console";
      toolbar.appendChild(consoleNode);
    }
    if (!hasManagedMarker(consoleNode)) {
      setManagedMarker(consoleNode);
    }
    var markup = "";
    if (typeof settings.buildMarkup === "function") {
      try {
        markup = String(settings.buildMarkup(toolbar, workspaceApi) || "");
      } catch (_error) {
        markup = "";
      }
    } else {
      markup = String(settings.markup || "");
    }
    if (consoleNode.innerHTML !== markup) {
      consoleNode.innerHTML = markup;
    }
    return consoleNode;
  }

  function clearWorkspaceToolbarConsole(toolbarRef) {
    var toolbar = resolveToolbarNode(toolbarRef);
    if (!(toolbar instanceof HTMLElement)) {
      return false;
    }
    var consoleNode = toolbar.querySelector(".o_surface_workspace_toolbar__console");
    if (!(consoleNode instanceof HTMLElement)) {
      return false;
    }
    consoleNode.remove();
    return true;
  }

  function removeToolbar(config) {
    var toolbar = document.getElementById(config.toolbarId);
    if (toolbar instanceof HTMLElement) {
      toolbar.remove();
    }
  }

  function buildDefaultChips(config, state) {
    var chips = [];
    chips.push(state.isForm ? "Formulario" : "Lista");
    if (state.recordLabel) {
      chips.push(state.recordLabel);
    }
    if (config.chipLabel) {
      chips.push(String(config.chipLabel));
    }
    return chips;
  }

  function normalizeControlPanelLayout(state) {
    if (typeof surfaceLayers.normalizeControlPanelBreadcrumbLayout !== "function") {
      return;
    }
    surfaceLayers.normalizeControlPanelBreadcrumbLayout({
      controlPanel: state && state.controlPanel instanceof HTMLElement ? state.controlPanel : null,
      managedAttr: MANAGED_ATTR,
      shouldPromote: !!(
        state &&
        state.active &&
        document.body instanceof HTMLElement &&
        document.body.classList.contains("o_surface_sidebar_shell_active") &&
        window.innerWidth >= 1200
      ),
    });
  }

  function resolveManagedBreadcrumbRoot(controlPanel) {
    if (typeof surfaceLayers.resolveManagedBreadcrumbRootNode === "function") {
      return surfaceLayers.resolveManagedBreadcrumbRootNode({
        controlPanel: controlPanel,
      });
    }
    return null;
  }

  function deriveRouteState(config) {
    var url = readCurrentUrl();
    var href = String((url && url.href) || window.location.href || "");
    var pathname = normalizePathname(url ? url.pathname : window.location.pathname || "");
    var currentActionId = getCurrentActionIdFromUrl(url);
    var controlPanel = resolveControlPanel(null);
    var breadcrumbTrail = readBreadcrumbTrail(controlPanel);
    var workspaceHint = readWorkspaceHint();
    var hasManagedTrail = hasManagedBreadcrumb(controlPanel);
    var configuredActionIds = (Array.isArray(config.actionIds) ? config.actionIds : []).filter(function (actionId) {
      return Number(actionId || 0) > 0;
    }).map(function (actionId) {
      return Number.parseInt(String(actionId || 0), 10) || 0;
    });
    var matchesAction = configuredActionIds.some(function (actionId) {
      return currentActionId > 0 && actionId === currentActionId;
    });
    var modelName = String(config.model || "").trim();
    var matchesModel = modelName
      ? href.indexOf("model=" + modelName) >= 0 || pathname.indexOf("/" + modelName) >= 0
      : false;
    var hasWorkspaceRoute = hasExplicitWorkspaceRoute(url) || matchesModel;
    var matchesTrail = matchesActionTrail(config, breadcrumbTrail);
    var actionScoped = currentActionId > 0 && configuredActionIds.length
      ? !!matchesAction
      : hasWorkspaceRoute && hasManagedTrail && workspaceHint
      ? workspaceHint === config.key
      : hasWorkspaceRoute && breadcrumbTrail.length
      ? !!matchesTrail
      : !!(matchesAction || matchesModel);
    var formRoot = findVisibleForm(config, { allowFallback: actionScoped });
    var listTable = findVisibleListTable();
    var implicitFormAllowed =
      config.allowImplicitFormActivation !== false &&
      (!(formRoot instanceof HTMLElement) || !currentActionId || !configuredActionIds.length || !!matchesAction);
    var active = !!(
      actionScoped ||
      (formRoot instanceof HTMLElement && implicitFormAllowed)
    );
    var viewType = readCurrentViewType(url);
    var recordId = active ? readCurrentRecordId(url) : 0;
    var isForm = !!(active && formRoot instanceof HTMLElement);
    var isList = !!(active && !isForm && listTable instanceof HTMLElement);
    var hostNode = resolveHostNode(formRoot || listTable);
    controlPanel = resolveControlPanel(hostNode) || controlPanel;
    var recordLabel = typeof config.getRecordLabel === "function"
      ? String(config.getRecordLabel({
          active: active,
          isForm: isForm,
          isList: isList,
          formRoot: formRoot,
          listTable: listTable,
          controlPanel: controlPanel,
          recordId: recordId,
          href: href,
        }, workspaceApi) || "").trim()
      : "";
    var chips = typeof config.getChips === "function"
      ? config.getChips({
          active: active,
          isForm: isForm,
          isList: isList,
          formRoot: formRoot,
          listTable: listTable,
          controlPanel: controlPanel,
          recordId: recordId,
          recordLabel: recordLabel,
          href: href,
        }, workspaceApi)
      : buildDefaultChips(config, { isForm: isForm, recordLabel: recordLabel });
    return {
      active: active,
      isForm: isForm,
      isList: isList,
      formRoot: formRoot,
      listTable: listTable,
      hostNode: hostNode,
      controlPanel: controlPanel,
      recordId: recordId,
      recordLabel: recordLabel,
      chips: Array.isArray(chips) ? chips.filter(Boolean) : buildDefaultChips(config, { isForm: isForm, recordLabel: recordLabel }),
    };
  }

  function computeAggregateBodyState(activeKey, activeState) {
    var states = Object.keys(handlesByKey).map(function (key) {
      if (key === activeKey) {
        return activeState;
      }
      var handle = handlesByKey[key];
      return handle && handle.lastState && typeof handle.lastState === "object"
        ? handle.lastState
        : null;
    }).filter(function (state) {
      return !!(state && typeof state === "object");
    });
    return {
      active: states.some(function (state) {
        return !!state.active;
      }),
      isList: states.some(function (state) {
        return !!(state.active && state.isList);
      }),
      isForm: states.some(function (state) {
        return !!(state.active && state.isForm);
      }),
    };
  }

  function applyBodyClasses(config, state) {
    if (!(document.body instanceof HTMLElement)) {
      return;
    }
    var aggregate = computeAggregateBodyState(config.key, state);
    document.body.classList.toggle("o_surface_workspace_active", aggregate.active);
    document.body.classList.toggle("o_surface_workspace_list", aggregate.active && aggregate.isList);
    document.body.classList.toggle("o_surface_workspace_form", aggregate.active && aggregate.isForm);
    if (aggregate.active && state.active) {
      var sectionKey = normalizeBreadcrumbText(config.sidebarSectionKey);
      if (sectionKey) {
        shared.sidebarShellCurrentSectionKey = sectionKey.toLowerCase();
      } else if (shared.sidebarShellCurrentSectionKey && state.isForm === false && state.isList === false) {
        delete shared.sidebarShellCurrentSectionKey;
      }
      return;
    }
    if (!aggregate.active && shared.sidebarShellCurrentSectionKey) {
      delete shared.sidebarShellCurrentSectionKey;
    }
  }

  function syncPreservedListFocus(config, state) {
    if (
      !config.preserveListFocus ||
      !(state && state.isList && state.listTable instanceof HTMLElement)
    ) {
      return null;
    }
    var storageKey = String(
      config.listReturnStateKey ||
      (LIST_RETURN_STORAGE_KEY_PREFIX + String(config.key || "").trim())
    ).trim();
    if (!storageKey) {
      return null;
    }
    if (typeof surfaceLayers.installListReturnStateBridge === "function") {
      surfaceLayers.installListReturnStateBridge({
        table: state.listTable,
        storageKey: storageKey,
        rowSelector: config.listReturnRowSelector,
        referenceSelector: config.listReturnReferenceSelector,
        referenceSelectors: config.listReturnReferenceSelectors,
        ignoredReferences: config.listReturnIgnoredReferences,
      });
    }
    if (typeof surfaceLayers.restoreListReturnState !== "function") {
      return null;
    }
    return surfaceLayers.restoreListReturnState({
      table: state.listTable,
      storageKey: storageKey,
      rowSelector: config.listReturnRowSelector,
      referenceSelector: config.listReturnReferenceSelector,
      referenceSelectors: config.listReturnReferenceSelectors,
      ignoredReferences: config.listReturnIgnoredReferences,
      focusClassName: String(
        config.listReturnFocusClassName || SURFACE_RETURN_FOCUS_CLASS
      ).trim(),
      scrollBlock: "nearest",
      scrollInline: "nearest",
    });
  }

  function armPreservedListFocus(config, state) {
    if (!config.preserveListFocus) {
      return null;
    }
    var storageKey = String(
      config.listReturnStateKey ||
      (LIST_RETURN_STORAGE_KEY_PREFIX + String(config.key || "").trim())
    ).trim();
    if (!storageKey) {
      return null;
    }
    var armedPayload =
      typeof surfaceLayers.armListReturnState === "function"
        ? surfaceLayers.armListReturnState({
            storageKey: storageKey,
            recordId: state && state.isForm ? state.recordId : 0,
            reference: state && state.isForm ? state.recordLabel : "",
            ignoredReferences: config.listReturnIgnoredReferences,
          })
        : null;
    if (armedPayload) {
      return armedPayload;
    }
    if (
      state &&
      state.isForm &&
      state.recordLabel &&
      typeof surfaceLayers.seedListReturnState === "function"
    ) {
      return surfaceLayers.seedListReturnState({
        storageKey: storageKey,
        recordId: state.recordId,
        reference: state.recordLabel,
        ignoredReferences: config.listReturnIgnoredReferences,
      });
    }
    return null;
  }

  function syncConfiguredToolbarConsole(config, state, handle) {
    if (typeof syncWorkspaceToolbarConsole !== "function" || typeof config.buildToolbarConsoleMarkup !== "function") {
      return null;
    }
    var active = true;
    if (typeof config.shouldShowToolbarConsole === "function") {
      try {
        active = config.shouldShowToolbarConsole(state, handle, workspaceApi) !== false;
      } catch (_error) {
        active = true;
      }
    }
    return syncWorkspaceToolbarConsole({
      toolbarId: config.toolbarId,
      active: !!active,
      buildMarkup: function () {
        try {
          return String(config.buildToolbarConsoleMarkup(state, handle, workspaceApi) || "");
        } catch (_error) {
          return "";
        }
      },
    });
  }

  function syncWorkspace(config, handle) {
    var state = deriveRouteState(config);
    handle.lastState = state;
    applyBodyClasses(config, state);
    if (!state.active) {
      var aggregate = computeAggregateBodyState(config.key, state);
      if (!aggregate.active) {
        normalizeControlPanelLayout(state);
      }
      if (typeof config.buildToolbarConsoleMarkup === "function") {
        clearWorkspaceToolbarConsole(config.toolbarId);
      }
      removeToolbar(config);
      if (!aggregate.active && typeof surfaceLayers.restoreCanonicalBreadcrumb === "function") {
        surfaceLayers.restoreCanonicalBreadcrumb({
          controlPanel: state.controlPanel,
          rootNode: resolveManagedBreadcrumbRoot(state.controlPanel),
        });
      }
      if (typeof config.onInactive === "function") {
        try {
          config.onInactive(state, handle, workspaceApi);
        } catch (_error) {}
      }
      return;
    }
    ensureToolbar(config, state, handle);
    syncConfiguredToolbarConsole(config, state, handle);
    var breadcrumbItems = resolveBreadcrumbItems(config, state);
    var breadcrumbLabel = resolveBreadcrumbLabel(config, state);
    if (typeof surfaceLayers.syncCanonicalBreadcrumb === "function") {
      surfaceLayers.syncCanonicalBreadcrumb({
        controlPanel: state.controlPanel,
        rootNode: resolveManagedBreadcrumbRoot(state.controlPanel),
        label: breadcrumbLabel,
        items: breadcrumbItems,
      });
    }
    normalizeControlPanelLayout(state);
    if (state.isList) {
      relabelNativeCreateButton(
        findNativeCreateButton(state.controlPanel, config.toolbarId),
        resolveToolbarText(config, state, "primaryLabel", "getPrimaryLabel", "Nuevo")
      );
      syncPreservedListFocus(config, state);
    } else if (state.isForm) {
      armPreservedListFocus(config, state);
      syncManagedFormEnhancers(config, state);
    }
    if (typeof config.onSync === "function") {
      try {
        config.onSync(state, handle, workspaceApi);
      } catch (_error) {}
    }
  }

  function scheduleSync(config, handle) {
    if (handle.syncTimer) {
      return;
    }
    handle.syncTimer = window.setTimeout(function () {
      handle.syncTimer = 0;
      syncWorkspace(config, handle);
    }, 60);
  }

  function installLifecycleHooks(config, handle) {
    if (handle.installed) {
      return;
    }
    handle.installed = true;
    ["hashchange", "popstate", "pageshow", "resize"].forEach(function (eventName) {
      window.addEventListener(eventName, function () {
        scheduleSync(config, handle);
      });
    });
    if (typeof surfaceLayers.installPreservedHistoryPatch === "function") {
      surfaceLayers.installPreservedHistoryPatch({
        key: "surface-workspace-" + config.key,
        onAfterChange: function () {
          scheduleSync(config, handle);
        },
      });
    }
    if (document.documentElement instanceof HTMLElement) {
      handle.observer = new MutationObserver(function (mutations) {
        if (typeof surfaceLayers.isModalOnlyMutation === "function" && surfaceLayers.isModalOnlyMutation(mutations)) {
          return;
        }
        if (isManagedWorkspaceMutation(mutations, config)) {
          return;
        }
        scheduleSync(config, handle);
      });
      handle.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", MANAGED_ATTR],
      });
    }
  }

  function registerWorkspace(config) {
    var settings = config && typeof config === "object" ? config : {};
    var key = String(settings.key || "").trim();
    if (!key) {
      return;
    }
    var normalized = Object.assign({}, settings, {
      key: key,
      toolbarId: String(settings.toolbarId || ("o_surface_toolbar_" + key)).trim(),
      primaryLabel: String(settings.primaryLabel || "Nuevo").trim(),
      secondaryLabel: String(settings.secondaryLabel || "Volver al listado").trim(),
      showSecondary: settings.showSecondary !== false,
      preserveEmptyFormToolbar: settings.preserveEmptyFormToolbar === true,
      preserveListFocus: settings.preserveListFocus === true,
      listReturnStateKey: String(settings.listReturnStateKey || "").trim(),
      listReturnRowSelector: String(settings.listReturnRowSelector || "").trim(),
      listReturnReferenceSelector: String(settings.listReturnReferenceSelector || "").trim(),
      listReturnReferenceSelectors: Array.isArray(settings.listReturnReferenceSelectors)
        ? settings.listReturnReferenceSelectors.slice()
        : [],
      listReturnIgnoredReferences: Array.isArray(settings.listReturnIgnoredReferences)
        ? settings.listReturnIgnoredReferences.slice()
        : [],
      listReturnFocusClassName: String(settings.listReturnFocusClassName || "").trim(),
      buildToolbarConsoleMarkup: typeof settings.buildToolbarConsoleMarkup === "function"
        ? settings.buildToolbarConsoleMarkup
        : null,
      shouldShowToolbarConsole: typeof settings.shouldShowToolbarConsole === "function"
        ? settings.shouldShowToolbarConsole
        : null,
      navItems: Array.isArray(settings.navItems) ? settings.navItems : [],
      navActions: settings.navActions && typeof settings.navActions === "object" ? settings.navActions : {},
      actionIds: Array.isArray(settings.actionIds) ? settings.actionIds : [],
      managedFormEnhancers: cloneManagedFormEnhancers(settings.managedFormEnhancers),
    });
    var handle = handlesByKey[key] || {
      installed: false,
      syncTimer: 0,
      observer: null,
      lastState: null,
    };
    handlesByKey[key] = handle;
    installBreadcrumbBridge();
    installLifecycleHooks(normalized, handle);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        scheduleSync(normalized, handle);
      }, { once: true });
      return;
    }
    scheduleSync(normalized, handle);
  }

  Object.assign(surfaceLayers, {
    cloneManagedFormEnhancers: cloneManagedFormEnhancers,
    registerManagedFormEnhancer: registerManagedFormEnhancer,
    syncManagedFormEnhancers: syncManagedFormEnhancers,
  });

  Object.assign(workspaceApi, {
    _handlesByKey: handlesByKey,
    escapeHtml: escapeHtml,
    parseSearchParams: parseSearchParams,
    normalizePathname: normalizePathname,
    readFieldText: readFieldText,
    resolveActionService: resolveActionService,
    performAction: performAction,
    buildBreadcrumbItem: buildBreadcrumbItem,
    buildHomeBreadcrumbItem: buildHomeBreadcrumbItem,
    buildWorkspaceActionHref: buildWorkspaceActionHref,
    buildSurfaceWorkspaceShellConfig: buildSurfaceWorkspaceShellConfig,
    cloneManagedFormEnhancers: cloneManagedFormEnhancers,
    registerManagedFormEnhancer: registerManagedFormEnhancer,
    syncManagedFormEnhancers: syncManagedFormEnhancers,
    syncWorkspaceToolbarConsole: syncWorkspaceToolbarConsole,
    clearWorkspaceToolbarConsole: clearWorkspaceToolbarConsole,
    registerWorkspace: registerWorkspace,
  });
  surfaceLayers._shared = shared;
  surfaceLayers.workspaceRuntime = workspaceApi;
  window.OdooSurfaceLayers = surfaceLayers;
})();
