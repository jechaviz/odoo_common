(function () {
  "use strict";

  var surfaceLayers = window.OdooSurfaceLayers;
  if (!(surfaceLayers && typeof surfaceLayers === "object")) {
    throw new Error("surface workspace runtime requires the canonical OdooSurfaceLayers bootstrap.");
  }
  var shared = surfaceLayers._shared;
  if (!(shared && typeof shared === "object")) {
    throw new Error("surface workspace runtime requires the canonical shared surface state.");
  }
  var workspaceApi = Object.create(null);
  var resolveSurfaceWorkspaceOwnership = surfaceLayers.resolveSurfaceWorkspaceOwnership;
  var handlesByKey = Object.create(null);
  var MANAGED_ATTR = "data-surface-managed";
  var BREADCRUMB_LINK_ATTR = "data-surface-breadcrumb-link";
  var SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS = "o_surface_topbar_breadcrumb_host";
  var SURFACE_RETURN_FOCUS_CLASS = "o_surface_return_focus";
  var LIST_RETURN_STORAGE_KEY_PREFIX = "odoo.surface.return.";
  var breadcrumbBridgeInstalled = false;

  if (typeof resolveSurfaceWorkspaceOwnership !== "function") {
    throw new Error("surface workspace runtime requires the canonical route ownership resolver.");
  }

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

  function readCurrentActionRecordId() {
    try {
      var root = window.odoo && window.odoo.__WOWL_DEBUG__ && window.odoo.__WOWL_DEBUG__.root;
      var actionService = root && root.env && root.env.services ? root.env.services.action : null;
      var currentController = actionService && actionService.currentController ? actionService.currentController : null;
      var candidates = [
        currentController && currentController.props ? currentController.props.resId : 0,
        currentController && currentController.currentState ? currentController.currentState.resId : 0,
        currentController && currentController.state ? currentController.state.resId : 0,
        currentController && currentController.config ? currentController.config.resId : 0,
        currentController && currentController.state && currentController.state.model && currentController.state.model.root
          ? currentController.state.model.root.resId
          : 0,
      ];
      for (var index = 0; index < candidates.length; index += 1) {
        var recordId = Number.parseInt(String(candidates[index] || 0), 10) || 0;
        if (recordId > 0) {
          return recordId;
        }
      }
    } catch (_error) {}
    return 0;
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
    return Number.parseInt(String(hashParams.get("id") || searchParams.get("id") || 0), 10) ||
      (!(url instanceof URL) || (sourceUrl instanceof URL && String(sourceUrl.href || "") === String(window.location.href || ""))
        ? readCurrentActionRecordId()
        : 0);
  }

  function readCurrentActionModel() {
    if (typeof surfaceLayers.readCurrentActionModel === "function") {
      return String(surfaceLayers.readCurrentActionModel() || "").trim();
    }
    return "";
  }

  function readConfiguredWorkspaceModels(config) {
    var settings = config && typeof config === "object" ? config : {};
    var models = [];
    function addModel(value) {
      var normalized = String(value || "").trim().toLowerCase();
      if (normalized && models.indexOf(normalized) < 0) {
        models.push(normalized);
      }
    }
    addModel(settings.model);
    [
      settings.models,
      settings.allowedModels,
      settings.workspaceModels,
    ].forEach(function (values) {
      (Array.isArray(values) ? values : []).forEach(addModel);
    });
    return models;
  }

  function currentActionModelMatchesWorkspace(config) {
    var workspaceModels = readConfiguredWorkspaceModels(config);
    var currentModel = readCurrentActionModel().toLowerCase();
    return !workspaceModels.length || !currentModel || workspaceModels.indexOf(currentModel) >= 0;
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

  function hasListOwnershipHints(config) {
    return Array.isArray(config && config.listFieldHints) && config.listFieldHints.length > 0;
  }

  function matchesListFieldHints(table, config) {
    var settings = config && typeof config === "object" ? config : {};
    var hints = Array.isArray(settings.listFieldHints) ? settings.listFieldHints : [];
    var hintMode = String(settings.listFieldHintMode || "any").trim().toLowerCase();
    if (!(table instanceof HTMLElement)) {
      return false;
    }
    if (!hints.length) {
      return true;
    }
    var matcher = hintMode === "all" ? "every" : "some";
    return hints[matcher](function (fieldName) {
      var normalized = String(fieldName || "").trim();
      return !!(
        normalized &&
        table.querySelector("[name='" + normalized + "'], [data-name='" + normalized + "']")
      );
    });
  }

  function findVisibleForm(config, options) {
    if (typeof surfaceLayers.findVisibleForm === "function") {
      return surfaceLayers.findVisibleForm(
        Object.assign({}, config && typeof config === "object" ? config : {}, options && typeof options === "object" ? options : {})
      );
    }
    return null;
  }

  function findVisibleFormWithoutMarker(config, options) {
    var markerSelector = String(config && config.formMarkerSelector || "").trim();
    if (!markerSelector) {
      return null;
    }
    return findVisibleForm(Object.assign({}, config || {}, {
      formMarkerSelector: "",
    }), options);
  }

  function hasFormOwnershipHints(config) {
    return Array.isArray(config && config.formFieldHints) && config.formFieldHints.length > 0;
  }

  function readVisibleBreadcrumbLabels(options) {
    if (typeof surfaceLayers.readSurfaceBreadcrumbTrail === "function") {
      try {
        return surfaceLayers.readSurfaceBreadcrumbTrail(Object.assign({
          includeHome: true,
          maxSegments: 20,
        }, options || {}));
      } catch (_error) {}
    }
    return [];
  }

  function normalizeBreadcrumbLabelList(labels) {
    var normalized = [];
    (Array.isArray(labels) ? labels : []).forEach(function (label) {
      var text = normalizeBreadcrumbText(label);
      if (text && normalized[normalized.length - 1] !== text) {
        normalized.push(text);
      }
    });
    return normalized;
  }

  function cloneManagedBreadcrumbAction(action) {
    if (action && typeof action === "object" && !Array.isArray(action)) {
      return Object.assign({}, action);
    }
    return action == null ? null : action;
  }

  function cloneManagedBreadcrumbMenu(menu) {
    return (Array.isArray(menu) ? menu : []).map(function (entry) {
      return cloneManagedBreadcrumbItem(entry);
    }).filter(function (entry) {
      return !!entry;
    });
  }

  function cloneManagedBreadcrumbItem(item) {
    if (!(item && typeof item === "object") || Array.isArray(item)) {
      return null;
    }
    var label = normalizeBreadcrumbText(item.label);
    if (!label) {
      return null;
    }
    var clone = {
      label: label,
      href: String(item.href || "").trim(),
      action: cloneManagedBreadcrumbAction(item.action),
      preferAction: item.preferAction === true,
      workspaceKey: normalizeBreadcrumbText(item.workspaceKey),
      sectionKey: normalizeBreadcrumbText(item.sectionKey),
      target: String(item.target || "").trim(),
      current: !!item.current,
      menu: cloneManagedBreadcrumbMenu(item.menu),
    };
    var key = normalizeBreadcrumbText(item.key);
    if (key) {
      clone.key = key;
    }
    if (item.home === true) {
      clone.home = true;
    }
    return clone;
  }

  function normalizeManagedBreadcrumbItems(items) {
    var normalized = [];
    (Array.isArray(items) ? items : []).forEach(function (item) {
      var clone = cloneManagedBreadcrumbItem(item);
      var label = normalizeBreadcrumbText(clone && clone.label);
      if (label && normalizeBreadcrumbText(normalized.length ? normalized[normalized.length - 1].label : "") !== label) {
        normalized.push(clone);
      }
    });
    return normalized;
  }

  function readBreadcrumbLabelsFromItems(items) {
    return normalizeBreadcrumbLabelList((Array.isArray(items) ? items : []).map(function (item) {
      return item && item.label;
    }));
  }

  function readInheritedBreadcrumbLabels() {
    var rememberedItems = normalizeManagedBreadcrumbItems(shared.surfaceLastManagedBreadcrumbItems);
    var rememberedLabels = rememberedItems.length
      ? readBreadcrumbLabelsFromItems(rememberedItems)
      : normalizeBreadcrumbLabelList(shared.surfaceLastManagedBreadcrumbLabels);
    if (rememberedLabels.length) {
      return rememberedLabels;
    }
    return normalizeBreadcrumbLabelList(readVisibleBreadcrumbLabels());
  }

  function readInheritedBreadcrumbItems() {
    var rememberedItems = normalizeManagedBreadcrumbItems(shared.surfaceLastManagedBreadcrumbItems);
    if (rememberedItems.length) {
      return rememberedItems;
    }
    return buildBreadcrumbItemsFromLabels(readVisibleBreadcrumbLabels());
  }

  function buildBreadcrumbItemsFromLabels(labels) {
    return normalizeBreadcrumbLabelList(labels).map(function (label, index) {
      return index === 0 && label.toLowerCase() === "home"
        ? buildHomeBreadcrumbItem()
        : buildBreadcrumbItem(label);
    }).filter(function (item) {
      return !!item;
    });
  }

  function readCurrentBreadcrumbHref() {
    var href = window.location.pathname + window.location.search + window.location.hash;
    if (typeof surfaceLayers.normalizeSurfaceHistoryUrl === "function") {
      try {
        return String(surfaceLayers.normalizeSurfaceHistoryUrl(href) || href).trim();
      } catch (_error) {}
    }
    return String(href || "").trim();
  }

  function rememberManagedBreadcrumbTrail(items, label) {
    var managedItems = normalizeManagedBreadcrumbItems(items);
    var labels = readBreadcrumbLabelsFromItems(managedItems);
    var currentLabel = normalizeBreadcrumbText(label);
    if (currentLabel && labels[labels.length - 1] !== currentLabel) {
      managedItems.push(cloneManagedBreadcrumbItem(buildBreadcrumbItem(currentLabel, {
        href: readCurrentBreadcrumbHref(),
      })));
    }
    shared.surfaceLastManagedBreadcrumbItems = normalizeManagedBreadcrumbItems(managedItems);
    shared.surfaceLastManagedBreadcrumbLabels = readBreadcrumbLabelsFromItems(shared.surfaceLastManagedBreadcrumbItems);
    return shared.surfaceLastManagedBreadcrumbLabels.slice();
  }

  function resolveRoutePresentationSourceHref(config, state) {
    if (!(state && (state.isList || state.isForm))) {
      return "";
    }
    var configuredActionIds = (Array.isArray(config && config.actionIds) ? config.actionIds : []).map(function (actionId) {
      return Number.parseInt(String(actionId || 0), 10) || 0;
    }).filter(function (actionId) {
      return actionId > 0;
    });
    var currentActionId = typeof surfaceLayers.readCurrentActionId === "function"
      ? Number.parseInt(String(surfaceLayers.readCurrentActionId() || 0), 10) || 0
      : 0;
    if (
      currentActionId > 0 &&
      configuredActionIds.length &&
      configuredActionIds.indexOf(currentActionId) < 0
    ) {
      return "";
    }
    var actionId = currentActionId > 0
      ? currentActionId
      : configuredActionIds.length
      ? configuredActionIds[0]
      : 0;
    if (!(actionId > 0)) {
      return "";
    }
    var recordId = state && state.isForm
      ? Number.parseInt(String(state.recordId || 0), 10) || 0
      : 0;
    return "/odoo/action-" + String(actionId) + (recordId > 0 ? "/" + String(recordId) : "");
  }

  function syncCurrentRoutePresentation(labels, state, workspaceConfig) {
    if (
      typeof surfaceLayers.readSurfaceRoutePresentationConfig !== "function" ||
      typeof surfaceLayers.syncCurrentSurfaceRoutePresentation !== "function"
    ) {
      return;
    }
    var managedLabels = normalizeBreadcrumbLabelList(labels);
    var sourceHref = resolveRoutePresentationSourceHref(workspaceConfig, state);
    function sync() {
      try {
        var config = surfaceLayers.readSurfaceRoutePresentationConfig();
        if (managedLabels.length) {
          config = Object.assign({}, config, { labels: managedLabels });
        }
        if (sourceHref) {
          config = Object.assign({}, config, { sourceHref: sourceHref });
        }
        surfaceLayers.syncCurrentSurfaceRoutePresentation(config);
      } catch (_error) {}
    }
    sync();
    [80, 300].forEach(function (delayMs) {
      window.setTimeout(sync, delayMs);
    });
  }

  function resolveHostNode(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return null;
    }
    var actionHost = rootNode.closest(".o_action");
    if (actionHost instanceof HTMLElement) {
      return actionHost;
    }
    var controllerHost = rootNode.closest(".o_view_controller");
    if (controllerHost instanceof HTMLElement) {
      return controllerHost;
    }
    var managerHost = rootNode.closest(".o_action_manager");
    if (managerHost instanceof HTMLElement) {
      return managerHost;
    }
    var contentHost = rootNode.closest(".o_content");
    if (contentHost instanceof HTMLElement) {
      var promotedHost = contentHost.parentElement;
      while (promotedHost instanceof HTMLElement) {
        if (promotedHost.matches(".o_action, .o_view_controller, .o_action_manager")) {
          return promotedHost;
        }
        promotedHost = promotedHost.parentElement;
      }
      return contentHost;
    }
    return rootNode;
  }

  function resolveControlPanel(hostNode) {
    if (typeof surfaceLayers.resolveScopedControlPanel === "function") {
      return surfaceLayers.resolveScopedControlPanel({
        hostNode: hostNode,
        selector: ".o_control_panel",
      });
    }
    var scoped = hostNode instanceof HTMLElement ? hostNode.querySelector(".o_control_panel") : null;
    return scoped instanceof HTMLElement ? scoped : null;
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

  function readCurrentBreadcrumbWorkspaceKey(controlPanel) {
    var root = controlPanel instanceof HTMLElement ? controlPanel : document;
    var currentItem = root.querySelector(".o_last_breadcrumb_item");
    return currentItem instanceof HTMLElement
      ? normalizeBreadcrumbText(currentItem.dataset.surfaceBreadcrumbWorkspaceKey || "")
      : "";
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

  function buildWorkspaceBreadcrumbTrail(state, options) {
    var settings = options && typeof options === "object" ? options : {};
    var inheritedItems = state && state.isForm
      ? normalizeManagedBreadcrumbItems(state.inheritedBreadcrumbItems)
      : [];
    var inheritedLabels = state && state.isForm
      ? normalizeBreadcrumbLabelList(state.inheritedBreadcrumbLabels)
      : [];
    var trail = inheritedItems.length
      ? inheritedItems
      : inheritedLabels.length
      ? buildBreadcrumbItemsFromLabels(inheritedLabels)
      : [buildHomeBreadcrumbItem(settings.homeOptions)];
    if (!inheritedItems.length && !inheritedLabels.length) {
      var rootItems = Array.isArray(settings.rootItems) ? settings.rootItems : [];
      rootItems.forEach(function (item) {
        if (item) {
          trail.push(item);
        }
      });
    }
    if (!(state && state.isForm)) {
      return trail;
    }
    var currentItems = Array.isArray(settings.currentItems)
      ? settings.currentItems
      : settings.currentItem
      ? [settings.currentItem]
      : [];
    currentItems.forEach(function (item) {
      if (item) {
        var label = normalizeBreadcrumbText(item.label);
        var previous = trail.length ? normalizeBreadcrumbText(trail[trail.length - 1].label) : "";
        if (!label || label !== previous) {
          trail.push(item);
        }
      }
    });
    return trail;
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
    if (actionRequest != null) {
      var hrefOptions = entry.hrefOptions && typeof entry.hrefOptions === "object"
        ? entry.hrefOptions
        : {
            viewType: entry.viewType,
            resId: entry.resId,
          };
      return String(buildWorkspaceActionHref(actionRequest, {
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
        ? { label: primitiveLabel, href: "", action: null, workspaceKey: "", sectionKey: "", target: "" }
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
      preferAction: item.preferAction === true,
      workspaceKey: normalizeBreadcrumbText(item.workspaceKey),
      sectionKey: normalizeBreadcrumbText(item.sectionKey),
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
          performAction(buildActionFromFactory(config.buildCreateAction, handle.lastState || state, config)).catch(function () {});
          return;
        }
        if (intent === "list") {
          event.preventDefault();
          performAction(buildActionFromFactory(config.buildListAction, handle.lastState || state, config)).catch(function () {});
          return;
        }
        var navKey = String(target.dataset.surfaceNav || "").trim();
        if (!navKey || navKey === config.key) {
          return;
        }
        var navActions = config.navActions && typeof config.navActions === "object" ? config.navActions : {};
        event.preventDefault();
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

  function deriveRouteState(config, handle) {
    var url = readCurrentUrl();
    var controlPanel = resolveControlPanel(null);
    var breadcrumbTrail = readBreadcrumbTrail(controlPanel);
    var currentBreadcrumbWorkspaceKey = readCurrentBreadcrumbWorkspaceKey(controlPanel);
    var hasManagedTrail = hasManagedBreadcrumb(controlPanel);
    var routeOwnership = resolveSurfaceWorkspaceOwnership(config, {
      url: url,
      breadcrumbTrail: breadcrumbTrail,
      currentBreadcrumbWorkspaceKey: currentBreadcrumbWorkspaceKey,
      hasManagedTrail: hasManagedTrail,
    });
    var href = routeOwnership.href;
    var currentActionId = routeOwnership.currentActionId;
    var actionScoped = routeOwnership.owned;
    var strictFormRoot = findVisibleForm(config, { allowFallback: false });
    if (
      !(strictFormRoot instanceof HTMLElement) &&
      routeOwnership.matchesAction &&
      hasFormOwnershipHints(config)
    ) {
      strictFormRoot = findVisibleFormWithoutMarker(config, { allowFallback: false });
    }
    var hasCurrentActionModelMismatch = !currentActionModelMatchesWorkspace(config);
    var hasActionModelMismatchedForm = !!(
      strictFormRoot instanceof HTMLElement &&
      hasCurrentActionModelMismatch
    );
    if (hasActionModelMismatchedForm) {
      strictFormRoot = null;
    }
    var anyVisibleFormRoot = strictFormRoot instanceof HTMLElement
      ? strictFormRoot
      : findVisibleForm({}, { allowFallback: true });
    var hasVisibleMismatchedForm = !!(
      actionScoped &&
      hasFormOwnershipHints(config) &&
      anyVisibleFormRoot instanceof HTMLElement &&
      !(strictFormRoot instanceof HTMLElement)
    );
    var formRoot = strictFormRoot instanceof HTMLElement
      ? strictFormRoot
      : hasVisibleMismatchedForm
      ? null
      : hasActionModelMismatchedForm
      ? null
      : findVisibleForm(config, { allowFallback: actionScoped });
    var visibleListTable = findVisibleListTable();
    var strictListTable = visibleListTable instanceof HTMLElement && hasListOwnershipHints(config) && matchesListFieldHints(visibleListTable, config)
      ? visibleListTable
      : null;
    var hasVisibleMismatchedList = !!(
      actionScoped &&
      hasListOwnershipHints(config) &&
      visibleListTable instanceof HTMLElement &&
      !(strictListTable instanceof HTMLElement)
    );
    var listTable = strictListTable instanceof HTMLElement
      ? strictListTable
      : hasVisibleMismatchedList
      ? null
      : visibleListTable;
    var implicitFormAllowed =
      config.allowImplicitFormActivation !== false &&
      (strictFormRoot instanceof HTMLElement
        ? true
        : (!(formRoot instanceof HTMLElement) || !currentActionId || !routeOwnership.configuredActionIds.length || !!routeOwnership.matchesAction));
    var active = !!(
      (actionScoped && !hasVisibleMismatchedForm && !hasVisibleMismatchedList) ||
      (strictListTable instanceof HTMLElement) ||
      (formRoot instanceof HTMLElement && implicitFormAllowed)
    );
    var viewType = readCurrentViewType(url);
    var previousState = handle && handle.lastState && typeof handle.lastState === "object" ? handle.lastState : null;
    var previousInheritedItems = previousState && previousState.inheritedRoute
      ? normalizeManagedBreadcrumbItems(previousState.inheritedBreadcrumbItems)
      : [];
    var previousInheritedLabels = previousState && previousState.inheritedRoute
      ? normalizeBreadcrumbLabelList(previousState.inheritedBreadcrumbLabels)
      : [];
    var inheritedBreadcrumbItems = active && strictFormRoot instanceof HTMLElement && !routeOwnership.matchesAction
      ? previousInheritedItems.length
        ? previousInheritedItems
        : previousInheritedLabels.length
        ? buildBreadcrumbItemsFromLabels(previousInheritedLabels)
        : readInheritedBreadcrumbItems()
      : [];
    var inheritedBreadcrumbLabels = inheritedBreadcrumbItems.length
      ? readBreadcrumbLabelsFromItems(inheritedBreadcrumbItems)
      : active && strictFormRoot instanceof HTMLElement && !routeOwnership.matchesAction
      ? readInheritedBreadcrumbLabels()
      : [];
    var recordId = active && (routeOwnership.matchesAction || actionScoped) ? readCurrentRecordId(url) : 0;
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
      inheritedBreadcrumbLabels: inheritedBreadcrumbLabels,
      inheritedBreadcrumbItems: inheritedBreadcrumbItems,
      inheritedRoute: inheritedBreadcrumbLabels.length > 0,
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
      document.body.dataset.surfaceWorkspaceKey = String(config.key || "").trim();
      var sectionKey = normalizeBreadcrumbText(config.sidebarSectionKey);
      if (sectionKey) {
        shared.sidebarShellCurrentSectionKey = sectionKey.toLowerCase();
        shared.surfaceBreadcrumbSectionKey = sectionKey.toLowerCase();
      } else if (shared.sidebarShellCurrentSectionKey && state.isForm === false && state.isList === false) {
        delete shared.sidebarShellCurrentSectionKey;
        delete shared.surfaceBreadcrumbSectionKey;
      }
      return;
    }
    if (!aggregate.active && shared.sidebarShellCurrentSectionKey) {
      delete shared.sidebarShellCurrentSectionKey;
    }
    if (!aggregate.active && shared.surfaceBreadcrumbSectionKey) {
      delete shared.surfaceBreadcrumbSectionKey;
    }
    if (!aggregate.active) {
      delete document.body.dataset.surfaceWorkspaceKey;
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

  function buildManagedPreviewWorkspaceHooks(config) {
    var settings = config && typeof config === "object" ? config : {};
    var previewController = settings.previewController && typeof settings.previewController === "object"
      ? settings.previewController
      : null;
    if (!(previewController && typeof previewController.sync === "function" && typeof previewController.clear === "function" && typeof previewController.installBridge === "function")) {
      throw new Error("buildManagedPreviewWorkspaceHooks requires a previewController with sync, clear, and installBridge.");
    }
    function callPreviewController(methodName, state, handle, runtimeApi) {
      var result = previewController[methodName](
        state,
        handle,
        runtimeApi && typeof runtimeApi === "object" ? runtimeApi : workspaceApi
      );
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
      return result;
    }

    function clearPreviewWorkspace(state, handle, runtimeApi) {
      return callPreviewController("clear", state, handle, runtimeApi);
    }

    function syncPreviewWorkspace(state, handle, runtimeApi) {
      callPreviewController("installBridge", state, handle, runtimeApi);
      if (!(state && state.isList)) {
        clearPreviewWorkspace(state, handle, runtimeApi);
        return null;
      }
      return callPreviewController("sync", state, handle, runtimeApi);
    }

    return {
      previewController: previewController,
      clear: clearPreviewWorkspace,
      onSync: syncPreviewWorkspace,
      onInactive: clearPreviewWorkspace,
    };
  }

  function syncWorkspace(config, handle) {
    var state = deriveRouteState(config, handle);
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
    var managedBreadcrumbLabels = rememberManagedBreadcrumbTrail(breadcrumbItems, breadcrumbLabel);
    syncCurrentRoutePresentation(managedBreadcrumbLabels, state, config);
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

  function scheduleSyncBurst(config, handle) {
    scheduleSync(config, handle);
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        scheduleSync(config, handle);
      });
    }
    [250, 900, 2200, 5000, 8000].forEach(function (delayMs) {
      window.setTimeout(function () {
        scheduleSync(config, handle);
      }, delayMs);
    });
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
          scheduleSyncBurst(config, handle);
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
      listFieldHints: Array.isArray(settings.listFieldHints) ? settings.listFieldHints : [],
      listFieldHintMode: String(settings.listFieldHintMode || "any").trim().toLowerCase() === "all" ? "all" : "any",
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
    readFieldText: readFieldText,
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
    buildWorkspaceBreadcrumbTrail: buildWorkspaceBreadcrumbTrail,
    buildWorkspaceActionHref: buildWorkspaceActionHref,
    buildSurfaceWorkspaceShellConfig: buildSurfaceWorkspaceShellConfig,
    cloneManagedFormEnhancers: cloneManagedFormEnhancers,
    registerManagedFormEnhancer: registerManagedFormEnhancer,
    syncManagedFormEnhancers: syncManagedFormEnhancers,
    syncWorkspaceToolbarConsole: syncWorkspaceToolbarConsole,
    clearWorkspaceToolbarConsole: clearWorkspaceToolbarConsole,
    buildManagedPreviewWorkspaceHooks: buildManagedPreviewWorkspaceHooks,
    registerWorkspace: registerWorkspace,
  });
  surfaceLayers._shared = shared;
  surfaceLayers.workspaceRuntime = workspaceApi;
  window.OdooSurfaceLayers = surfaceLayers;
})();
