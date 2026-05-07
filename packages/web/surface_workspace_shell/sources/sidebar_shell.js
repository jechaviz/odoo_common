(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;
  if (!(surfaceLayerApi && typeof surfaceLayerApi === "object")) {
    throw new Error("OdooSurfaceLayers must be initialized before surface_workspace_shell sidebar runtime.");
  }
  var shared = surfaceLayerApi._shared;
  if (!(shared && typeof shared === "object")) {
    throw new Error("OdooSurfaceLayers._shared must be initialized before surface_workspace_shell sidebar runtime.");
  }
  var SIDEBAR_SHELL_BODY_CLASS = "o_surface_sidebar_shell_active";
  var SIDEBAR_SHELL_COLLAPSED_CLASS = "o_surface_sidebar_shell_collapsed";
  var SIDEBAR_SHELL_COLLAPSED_STORAGE_KEY = "odoo.surface.sidebarCollapsed";
  var SIDEBAR_SHELL_ROOT_TRIGGER_SELECTOR =
    ".o_main_navbar .o_menu_sections > :not(.o_menu_sections_more)[aria-haspopup='menu'], " +
    ".o_main_navbar .o_menu_sections > :not(.o_menu_sections_more).dropdown-toggle";
  var SIDEBAR_SHELL_NESTED_TRIGGER_SELECTOR =
    ".o_surface_sidebar_shell_menu_popover [role='menuitem'][aria-haspopup='menu'], " +
    ".o_surface_sidebar_shell_menu_popover .dropdown-toggle[role='menuitem'], " +
    ".o_surface_sidebar_shell_menu_popover button.dropdown-toggle[aria-haspopup='menu'], " +
    ".o_surface_sidebar_shell_menu_popover .dropdown-item.dropdown-toggle[aria-haspopup='menu']";
  var SIDEBAR_SHELL_TRIGGER_SELECTOR =
    SIDEBAR_SHELL_ROOT_TRIGGER_SELECTOR + ", " + SIDEBAR_SHELL_NESTED_TRIGGER_SELECTOR;
  var SIDEBAR_SHELL_MENU_SELECTOR =
    ".o_popover.o-dropdown--menu.dropdown-menu[role='menu'], " +
    ".o-dropdown--menu.dropdown-menu[role='menu']";
  var SIDEBAR_SHELL_MENU_ITEM_SELECTOR =
    ".dropdown-item, .o-dropdown-item, [role='menuitem']";
  var SIDEBAR_SHELL_GROUP_HEADER_SELECTOR =
    ".dropdown-menu_group.dropdown-header";
  var SIDEBAR_SHELL_OPEN_DELAY_MS = 30;
  var SIDEBAR_SHELL_CLOSE_DELAY_MS = 180;
  var SIDEBAR_SHELL_MENU_GAP_PX = 4;
  var SIDEBAR_SHELL_MAX_NESTED_GAP_PX = 8;
  var SIDEBAR_SHELL_VIEWPORT_MARGIN_PX = 8;
  var SIDEBAR_SHELL_POPOVER_Z_INDEX_BASE = 44;
  var readSessionValue = surfaceLayerApi.readSessionValue;
  var writeSessionValue = surfaceLayerApi.writeSessionValue;
  var normalizePathname = surfaceLayerApi.normalizePathname;
  var normalizeLabel = surfaceLayerApi.normalizeLabel;

  function normalizeSidebarShellKey(value) {
    return normalizeLabel(String(value || "").trim());
  }

  function getSidebarShellSectionTreeRegistry() {
    if (!(shared.sidebarShellSectionTrees && typeof shared.sidebarShellSectionTrees === "object")) {
      shared.sidebarShellSectionTrees = {};
    }
    return shared.sidebarShellSectionTrees;
  }

  function getSidebarShellRootSectionKeyEntries() {
    if (!Array.isArray(shared.sidebarShellRootSectionKeyEntries)) {
      shared.sidebarShellRootSectionKeyEntries = [];
    }
    return shared.sidebarShellRootSectionKeyEntries;
  }

  surfaceLayerApi.registerSidebarShellSectionTree = function (sectionKey, treeEntries) {
    var normalizedSectionKey = normalizeSidebarShellKey(sectionKey);
    if (!normalizedSectionKey) {
      return false;
    }
    var registry = getSidebarShellSectionTreeRegistry();
    if (Array.isArray(treeEntries) && treeEntries.length) {
      registry[normalizedSectionKey] = treeEntries.slice();
      return true;
    }
    delete registry[normalizedSectionKey];
    return false;
  };

  surfaceLayerApi.registerSidebarShellSectionResolver = function (resolver) {
    if (typeof resolver === "function") {
      shared.sidebarShellSectionResolver = resolver;
      scheduleSidebarShellStateSync();
      return true;
    }
    delete shared.sidebarShellSectionResolver;
    scheduleSidebarShellStateSync();
    return false;
  };

  surfaceLayerApi.registerSidebarShellRootSectionKeys = function (entries) {
    shared.sidebarShellRootSectionKeyEntries = [];
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      if (!(entry && typeof entry === "object")) {
        return;
      }
      var key = normalizeSidebarShellKey(entry.key || "");
      var selector = String(entry.selector || entry.rootSelector || "").trim();
      var label = normalizeSidebarShellKey(entry.label || entry.text || entry.name || "");
      if (!key || (!selector && !label)) {
        return;
      }
      shared.sidebarShellRootSectionKeyEntries.push({
        key: key,
        selector: selector,
        label: label,
      });
    });
    scheduleSidebarShellStateSync();
    return shared.sidebarShellRootSectionKeyEntries.length > 0;
  };

  function hasBackendHomeMenu() {
    return !!document.querySelector(".o_home_menu, .o_home_menu_background, .o_apps_menu");
  }

  function shouldActivateSidebarShell() {
    if (!(document.body instanceof HTMLElement) || window.innerWidth < 1200) {
      return false;
    }
    var pathname = normalizePathname(window.location.pathname || "");
    if (pathname === "/odoo" || hasBackendHomeMenu()) {
      return false;
    }
    return !!document.querySelector(".o_main_navbar .o_menu_sections, .o_main_navbar .o_menu_systray");
  }

  function readSidebarShellCollapsed() {
    return readSessionValue(SIDEBAR_SHELL_COLLAPSED_STORAGE_KEY) === "1";
  }

  function writeSidebarShellCollapsed(collapsed) {
    writeSessionValue(SIDEBAR_SHELL_COLLAPSED_STORAGE_KEY, collapsed ? "1" : "");
  }

  function canUseSidebarShellHoverMenus() {
    if (!shouldActivateSidebarShell() || readSidebarShellCollapsed()) {
      return false;
    }
    if (!(typeof window.matchMedia === "function")) {
      return true;
    }
    try {
      return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    } catch (_error) {
      return true;
    }
  }

  function getSidebarShellMenuSections() {
    var menuSections = document.querySelector(".o_main_navbar .o_menu_sections");
    return menuSections instanceof HTMLElement ? menuSections : null;
  }

  function getSidebarShellPopoverObservers() {
    if (!(shared.sidebarShellPopoverObservers instanceof WeakMap)) {
      shared.sidebarShellPopoverObservers = new WeakMap();
    }
    return shared.sidebarShellPopoverObservers;
  }

  function getSidebarShellPendingTriggerQueue() {
    if (!Array.isArray(shared.sidebarShellPendingTriggerQueue)) {
      shared.sidebarShellPendingTriggerQueue = [];
    }
    return shared.sidebarShellPendingTriggerQueue;
  }

  function ensureSidebarShellTriggerId(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    if (!String(node.dataset.surfaceSidebarTriggerId || "").trim()) {
      shared.sidebarShellTriggerIdSequence = Number(shared.sidebarShellTriggerIdSequence || 0) + 1;
      node.dataset.surfaceSidebarTriggerId = "sidebar-trigger-" + String(shared.sidebarShellTriggerIdSequence);
    }
    return String(node.dataset.surfaceSidebarTriggerId || "").trim();
  }

  function findSidebarShellTriggerById(triggerId) {
    var normalizedTriggerId = String(triggerId || "").trim();
    if (!normalizedTriggerId) {
      return null;
    }
    var node = document.querySelector('[data-surface-sidebar-trigger-id="' + normalizedTriggerId + '"]');
    return node instanceof HTMLElement ? node : null;
  }

  function queueSidebarShellPendingTrigger(triggerNode) {
    var triggerId = ensureSidebarShellTriggerId(triggerNode);
    if (!triggerId) {
      return "";
    }
    var queue = getSidebarShellPendingTriggerQueue();
    shared.sidebarShellPendingTriggerQueue = queue.filter(function (queuedTriggerId) {
      return queuedTriggerId !== triggerId;
    });
    shared.sidebarShellPendingTriggerQueue.push(triggerId);
    return triggerId;
  }

  function shiftSidebarShellPendingTrigger() {
    var queue = getSidebarShellPendingTriggerQueue();
    while (queue.length) {
      var queuedTriggerId = String(queue.shift() || "").trim();
      var queuedTriggerNode = findSidebarShellTriggerById(queuedTriggerId);
      if (queuedTriggerNode instanceof HTMLElement && isSidebarShellTriggerExpanded(queuedTriggerNode)) {
        return queuedTriggerNode;
      }
    }
    return null;
  }

  function pruneSidebarShellPendingTriggers() {
    var queue = getSidebarShellPendingTriggerQueue();
    shared.sidebarShellPendingTriggerQueue = queue.filter(function (queuedTriggerId) {
      var queuedTriggerNode = findSidebarShellTriggerById(queuedTriggerId);
      return queuedTriggerNode instanceof HTMLElement && queuedTriggerNode.isConnected;
    });
  }

  function scheduleSidebarShellStateSync() {
    if (shared.sidebarShellSyncTimer) {
      return;
    }
    shared.sidebarShellSyncTimer = window.setTimeout(function () {
      shared.sidebarShellSyncTimer = 0;
      syncSidebarShellState();
    }, 60);
  }

  function scheduleSidebarShellSyncBurst() {
    scheduleSidebarShellStateSync();
    window.requestAnimationFrame(scheduleSidebarShellStateSync);
    window.setTimeout(scheduleSidebarShellStateSync, 90);
  }

  function clearSidebarShellHoverTimer(key) {
    if (!shared[key]) {
      return;
    }
    window.clearTimeout(shared[key]);
    shared[key] = 0;
  }

  function clearSidebarShellHoverState() {
    clearSidebarShellHoverTimer("sidebarShellOpenTimer");
    clearSidebarShellHoverTimer("sidebarShellCloseTimer");
    shared.sidebarShellHoveredTrigger = null;
    shared.sidebarShellHoveredPopover = null;
    shared.sidebarShellPendingTriggerQueue = [];
  }

  function handleSidebarShellToggleClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    writeSidebarShellCollapsed(!readSidebarShellCollapsed());
    scheduleSidebarShellStateSync();
  }

  function ensureSidebarShellToggle(active, collapsed) {
    var menuToggle = document.querySelector(".o_main_navbar .o_menu_toggle");
    if (!(menuToggle instanceof HTMLElement)) {
      return null;
    }
    var toggleButton = menuToggle.querySelector(".o_surface_sidebar_shell_toggle");
    if (!active) {
      if (toggleButton instanceof HTMLElement) {
        toggleButton.remove();
      }
      return null;
    }
    if (!(toggleButton instanceof HTMLButtonElement)) {
      toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = "o_surface_sidebar_shell_toggle";
      toggleButton.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
      toggleButton.addEventListener("click", handleSidebarShellToggleClick, true);
      menuToggle.appendChild(toggleButton);
    }
    toggleButton.setAttribute("aria-label", collapsed ? "Expandir menu lateral" : "Colapsar menu lateral");
    toggleButton.setAttribute("title", collapsed ? "Expandir menu lateral" : "Colapsar menu lateral");
    return toggleButton;
  }

  function getSidebarShellRootSectionNodes() {
    return Array.prototype.slice.call(
      document.querySelectorAll(".o_main_navbar .o_menu_sections > :not(.o_menu_sections_more)")
    ).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  function readExplicitSidebarShellSectionKeyFromNode(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return normalizeSidebarShellKey(
      node.dataset.surfaceSidebarSectionKey ||
      node.dataset.surfaceSidebarItemKey ||
      node.getAttribute("data-section") ||
      node.dataset.section
    );
  }

  function readNativeSidebarShellSectionKeyFromNode(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return normalizeSidebarShellKey(
      (node.dataset.surfaceSidebarSectionKeySource ? "" : node.dataset.surfaceSidebarSectionKey) ||
      node.dataset.surfaceSidebarItemKey ||
      node.getAttribute("data-section") ||
      node.dataset.section
    );
  }

  function resolveSidebarShellSectionKeyFromRegistry(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    var entries = getSidebarShellRootSectionKeyEntries();
    for (var index = 0; index < entries.length; index += 1) {
      var entry = entries[index];
      try {
        if (entry && entry.selector && node.matches(entry.selector)) {
          return normalizeSidebarShellKey(entry.key);
        }
        if (entry && entry.label && normalizeSidebarShellKey(resolveSidebarShellMenuItemLabel(node)) === entry.label) {
          return normalizeSidebarShellKey(entry.key);
        }
      } catch (_error) {}
    }
    return "";
  }

  function resolveSidebarShellSectionKeyFromProvider(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    if (typeof shared.sidebarShellSectionResolver === "function") {
      try {
        return normalizeSidebarShellKey(shared.sidebarShellSectionResolver({
          node: node,
          explicitKey: readNativeSidebarShellSectionKeyFromNode(node),
        }));
      } catch (_error) {}
    }
    return "";
  }

  function readSidebarShellSectionKeyFromNode(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    var explicitKey = readExplicitSidebarShellSectionKeyFromNode(node);
    if (explicitKey) {
      return explicitKey;
    }
    var providedKey = resolveSidebarShellSectionKeyFromProvider(node);
    if (providedKey) {
      return providedKey;
    }
    var scopedNode = node.querySelector("[data-section]");
    return normalizeSidebarShellKey(
      scopedNode instanceof HTMLElement
        ? (scopedNode.getAttribute("data-section") || scopedNode.dataset.section || "")
        : ""
    );
  }

  function readSidebarShellSectionKey() {
    var explicitSectionKey = normalizeSidebarShellKey(shared.sidebarShellCurrentSectionKey || "");
    if (explicitSectionKey) {
      return explicitSectionKey;
    }
    var breadcrumbSectionKey = readSidebarShellBreadcrumbSectionKey();
    if (breadcrumbSectionKey) {
      return breadcrumbSectionKey;
    }
    return "";
  }

  function readSidebarShellBreadcrumbSectionKey() {
    return normalizeSidebarShellKey(shared.surfaceBreadcrumbSectionKey || "");
  }

  function syncSidebarShellRootSectionKeys() {
    getSidebarShellRootSectionNodes().forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      var explicitKey = readNativeSidebarShellSectionKeyFromNode(node);
      var resolverKey = resolveSidebarShellSectionKeyFromProvider(node);
      var registryKey = resolverKey ? "" : resolveSidebarShellSectionKeyFromRegistry(node);
      var sectionKey = resolverKey || registryKey;
      if (sectionKey && (!explicitKey || node.dataset.surfaceSidebarSectionKeySource)) {
        node.dataset.surfaceSidebarSectionKey = sectionKey;
        node.dataset.surfaceSidebarSectionKeySource = resolverKey ? "resolver" : "registry";
      } else if (node.dataset.surfaceSidebarSectionKeySource) {
        delete node.dataset.surfaceSidebarSectionKey;
        delete node.dataset.surfaceSidebarSectionKeySource;
      }
    });
  }

  function syncSidebarShellCurrentSection(active) {
    syncSidebarShellRootSectionKeys();
    var items = getSidebarShellRootSectionNodes();
    var currentKey = active ? readSidebarShellSectionKey() : "";
    items.forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      var sectionKey = readSidebarShellSectionKeyFromNode(node);
      node.classList.toggle("o_surface_shell_current", !!(currentKey && sectionKey === currentKey));
      if (currentKey && sectionKey === currentKey) {
        node.setAttribute("aria-current", "page");
      } else if (node.getAttribute("aria-current") === "page") {
        node.removeAttribute("aria-current");
      }
    });
  }

  function isSidebarShellMenuPopover(node) {
    return node instanceof HTMLElement && !!node.querySelector("[data-section]");
  }

  function resolveSidebarShellHoverTrigger(node) {
    var triggerNode = node instanceof Element
      ? node.closest(SIDEBAR_SHELL_TRIGGER_SELECTOR)
      : null;
    return triggerNode instanceof HTMLElement ? triggerNode : null;
  }

  function resolveSidebarShellMenuPopover(node) {
    var popoverNode = node instanceof Element
      ? node.closest(SIDEBAR_SHELL_MENU_SELECTOR)
      : null;
    if (!(popoverNode instanceof HTMLElement)) {
      return null;
    }
    return isSidebarShellMenuPopover(popoverNode) ? popoverNode : null;
  }

  function resolveSidebarShellMenuItemLabel(node) {
    return String(node instanceof HTMLElement ? node.textContent : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resolveSidebarShellPopoverOwnerLabel(popoverNode, triggerNode) {
    var triggerLabel = resolveSidebarShellMenuItemLabel(triggerNode);
    if (triggerLabel) {
      return triggerLabel;
    }
    return String(popoverNode instanceof HTMLElement ? popoverNode.dataset.surfaceSidebarOwnerLabel || "" : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resolveSidebarShellMenuItemKey(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    var explicitKey = normalizeSidebarShellKey(
      node.dataset.surfaceSidebarItemKey ||
      node.dataset.surfaceSidebarOwnerKey ||
      node.dataset.surfaceSidebarSectionKey ||
      node.getAttribute("data-section") ||
      node.dataset.section
    );
    if (explicitKey) {
      return explicitKey;
    }
    var nestedSectionNode = node.querySelector("[data-section]");
    if (nestedSectionNode instanceof HTMLElement) {
      return normalizeSidebarShellKey(
        nestedSectionNode.getAttribute("data-section") || nestedSectionNode.dataset.section || ""
      );
    }
    var linkNode = node.matches("a[href]")
      ? node
      : node.querySelector("a[href]");
    if (linkNode instanceof HTMLAnchorElement) {
      try {
        return normalizeSidebarShellKey(
          normalizePathname(new URL(String(linkNode.href || "").trim(), window.location.origin).pathname)
        );
      } catch (_error) {}
    }
    return "";
  }

  function isSidebarShellMenuBranchItem(node) {
    return !!(
      node instanceof HTMLElement &&
      (
        node.getAttribute("aria-haspopup") === "menu" ||
        node.classList.contains("dropdown-toggle")
      )
    );
  }

  function isSidebarShellDirectMenuItem(popoverNode, itemNode) {
    if (!(popoverNode instanceof HTMLElement) || !(itemNode instanceof HTMLElement)) {
      return false;
    }
    var current = itemNode.parentElement;
    while (current && current !== popoverNode) {
      if (
        current.matches &&
        current.matches(SIDEBAR_SHELL_MENU_ITEM_SELECTOR)
      ) {
        return false;
      }
      if (
        current !== popoverNode &&
        current instanceof HTMLElement &&
        current.classList.contains("o_surface_sidebar_shell_menu_popover")
      ) {
        return false;
      }
      current = current.parentElement;
    }
    return current === popoverNode;
  }

  function isSidebarShellHiddenMenuItem(itemNode) {
    return itemNode instanceof HTMLElement &&
      (
        itemNode.dataset.surfaceSidebarOwnerDuplicateHidden === "1" ||
        itemNode.dataset.surfaceSidebarDuplicateHidden === "1"
      );
  }

  function getSidebarShellMenuItems(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return [];
    }
    return Array.prototype.slice.call(
      popoverNode.querySelectorAll(SIDEBAR_SHELL_MENU_ITEM_SELECTOR)
    ).filter(function (itemNode) {
      return isSidebarShellDirectMenuItem(popoverNode, itemNode) &&
        !isSidebarShellHiddenMenuItem(itemNode);
    });
  }

  function suppressSidebarShellOwnerDuplicateItems(popoverNode, ownerLabel) {
    if (!(popoverNode instanceof HTMLElement)) {
      return;
    }
    var ownerKey = normalizeSidebarShellKey(ownerLabel || "");
    var directItems = Array.prototype.slice.call(
      popoverNode.querySelectorAll(SIDEBAR_SHELL_MENU_ITEM_SELECTOR)
    ).filter(function (itemNode) {
      return isSidebarShellDirectMenuItem(popoverNode, itemNode);
    });
    directItems.forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement) || itemNode.dataset.surfaceSidebarOwnerDuplicateHidden !== "1") {
        return;
      }
      itemNode.hidden = false;
      itemNode.style.removeProperty("display");
      itemNode.removeAttribute("aria-hidden");
      delete itemNode.dataset.surfaceSidebarOwnerDuplicateHidden;
      delete itemNode.dataset.surfaceSidebarItemKind;
    });
    if (!ownerKey || directItems.length <= 1) {
      return;
    }
    directItems.forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement)) {
        return;
      }
      if (normalizeSidebarShellKey(itemNode.textContent || "") !== ownerKey) {
        return;
      }
      itemNode.dataset.surfaceSidebarOwnerDuplicateHidden = "1";
      itemNode.dataset.surfaceSidebarItemKind = "redundant-owner";
      itemNode.setAttribute("aria-hidden", "true");
      itemNode.hidden = true;
      itemNode.style.setProperty("display", "none", "important");
    });
  }

  function restoreSidebarShellDuplicateSiblingItems(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return [];
    }
    var directItems = Array.prototype.slice.call(
      popoverNode.querySelectorAll(SIDEBAR_SHELL_MENU_ITEM_SELECTOR)
    ).filter(function (itemNode) {
      return isSidebarShellDirectMenuItem(popoverNode, itemNode);
    });
    directItems.forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement) || itemNode.dataset.surfaceSidebarDuplicateHidden !== "1") {
        return;
      }
      itemNode.hidden = false;
      itemNode.style.removeProperty("display");
      itemNode.removeAttribute("aria-hidden");
      delete itemNode.dataset.surfaceSidebarDuplicateHidden;
      if (itemNode.dataset.surfaceSidebarItemKind === "duplicate-menu-label") {
        delete itemNode.dataset.surfaceSidebarItemKind;
      }
    });
    return directItems;
  }

  function suppressSidebarShellDuplicateSiblingItems(popoverNode) {
    var directItems = restoreSidebarShellDuplicateSiblingItems(popoverNode);
    if (directItems.length <= 1) {
      return;
    }
    var seenKeys = Object.create(null);
    directItems.forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement) || isSidebarShellHiddenMenuItem(itemNode)) {
        return;
      }
      var itemKey = resolveSidebarShellMenuItemKey(itemNode) ||
        normalizeSidebarShellKey(resolveSidebarShellMenuItemLabel(itemNode));
      if (!itemKey) {
        return;
      }
      if (!seenKeys[itemKey]) {
        seenKeys[itemKey] = true;
        return;
      }
      itemNode.dataset.surfaceSidebarDuplicateHidden = "1";
      itemNode.dataset.surfaceSidebarItemKind = "duplicate-menu-label";
      itemNode.setAttribute("aria-hidden", "true");
      itemNode.hidden = true;
      itemNode.style.setProperty("display", "none", "important");
    });
  }

  function getSidebarShellDirectChildNodes(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return [];
    }
    return Array.prototype.slice.call(popoverNode.children || []).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  function isSidebarShellGroupHeaderNode(node) {
    return !!(
      node instanceof HTMLElement &&
      node.matches(SIDEBAR_SHELL_GROUP_HEADER_SELECTOR)
    );
  }

  function getSidebarShellDirectGroupHeaders(popoverNode) {
    return getSidebarShellDirectChildNodes(popoverNode).filter(isSidebarShellGroupHeaderNode);
  }

  function resetSidebarShellSyntheticPopover(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(popoverNode.querySelectorAll(":scope > [data-surface-sidebar-synthetic-branch='1']")).forEach(function (branchNode) {
      if (!(branchNode instanceof HTMLElement)) {
        return;
      }
      Array.prototype.slice.call(branchNode.querySelectorAll("[data-surface-sidebar-restored='1']")).forEach(function (itemNode) {
        if (!(itemNode instanceof HTMLElement)) {
          return;
        }
        itemNode.removeAttribute("data-surface-sidebar-restored");
        itemNode.style.removeProperty("display");
        itemNode.style.removeProperty("padding-left");
        popoverNode.appendChild(itemNode);
      });
      branchNode.remove();
    });
    delete popoverNode.dataset.surfaceSidebarSyntheticGroups;
    delete popoverNode.dataset.surfaceSidebarSyntheticTree;
  }

  function createSidebarShellSyntheticBranch(popoverNode, entry, kind) {
    var branchEntry = entry && typeof entry === "object" ? entry : {};
    var label = String(branchEntry.label || "").trim();
    var itemKey = normalizeSidebarShellKey(branchEntry.key || "");
    var branchNode = document.createElement("div");
    branchNode.className = "o_surface_sidebar_shell_group_branch position-relative";
    branchNode.dataset.surfaceSidebarSyntheticBranch = "1";
    branchNode.dataset.surfaceSidebarSyntheticKind = String(kind || "group").trim() || "group";
    if (itemKey) {
      branchNode.dataset.surfaceSidebarItemKey = itemKey;
    }

    var triggerNode = document.createElement("button");
    triggerNode.type = "button";
    triggerNode.className = "o-dropdown-item dropdown-item dropdown-toggle o_surface_sidebar_shell_group_trigger";
    triggerNode.setAttribute("role", "menuitem");
    triggerNode.setAttribute("tabindex", "0");
    triggerNode.setAttribute("aria-haspopup", "menu");
    triggerNode.setAttribute("aria-expanded", "false");
    triggerNode.dataset.surfaceSidebarItemKind = "branch";
    triggerNode.dataset.surfaceSidebarSyntheticGroupTrigger = "1";
    triggerNode.textContent = String(label || "").trim();
    if (itemKey) {
      triggerNode.dataset.surfaceSidebarItemKey = itemKey;
    }
    var triggerId = ensureSidebarShellTriggerId(triggerNode);

    var nestedPopover = document.createElement("div");
    nestedPopover.className = "o_popover o-dropdown--menu dropdown-menu mx-0 o_surface_sidebar_shell_menu_popover";
    nestedPopover.classList.add(
      String(kind || "").trim() === "tree"
        ? "o_surface_sidebar_shell_menu_popover--synthetic-tree"
        : "o_surface_sidebar_shell_menu_popover--synthetic-group"
    );
    nestedPopover.setAttribute("role", "menu");
    if (itemKey) {
      nestedPopover.dataset.surfaceSidebarOwnerKey = itemKey;
    }
    if (label) {
      nestedPopover.dataset.surfaceSidebarOwnerLabel = label;
    }
    nestedPopover.dataset.surfaceSidebarOwnerTriggerId = triggerId;
    nestedPopover.dataset.surfaceSidebarLevel = String(
      Math.max(Number(popoverNode.dataset.surfaceSidebarLevel || 1) || 1, 1) + 1
    );
    nestedPopover.style.display = "block";

    triggerNode.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      var shouldOpen = triggerNode.getAttribute("aria-expanded") !== "true";
      Array.prototype.slice.call(popoverNode.querySelectorAll(":scope > [data-surface-sidebar-synthetic-branch='1']")).forEach(function (siblingBranchNode) {
        if (!(siblingBranchNode instanceof HTMLElement) || siblingBranchNode === branchNode) {
          return;
        }
        collapseSidebarShellSyntheticBranch(siblingBranchNode);
      });
      triggerNode.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      triggerNode.classList.toggle("show", shouldOpen);
      if (!shouldOpen) {
        collapseSidebarShellSyntheticBranch(branchNode);
        return;
      }
      nestedPopover.classList.add("show");
      positionSidebarShellPopover(nestedPopover);
    }, true);

    branchNode.appendChild(triggerNode);
    branchNode.appendChild(nestedPopover);
    return {
      branchNode: branchNode,
      nestedPopover: nestedPopover,
      triggerId: triggerId,
      triggerNode: triggerNode,
    };
  }

  function collapseSidebarShellSyntheticBranch(branchNode) {
    if (!(branchNode instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(branchNode.querySelectorAll("[data-surface-sidebar-synthetic-group-trigger='1']")).forEach(function (triggerNode) {
      if (!(triggerNode instanceof HTMLElement)) {
        return;
      }
      triggerNode.setAttribute("aria-expanded", "false");
      triggerNode.classList.remove("show");
    });
    Array.prototype.slice.call(branchNode.querySelectorAll(".o_surface_sidebar_shell_menu_popover")).forEach(function (popoverNode) {
      if (!(popoverNode instanceof HTMLElement)) {
        return;
      }
      popoverNode.classList.remove("show");
      delete popoverNode.dataset.surfaceSidebarPositioned;
    });
  }

  function normalizeSidebarShellTreeEntries(rawEntries, parentKey) {
    return (Array.isArray(rawEntries) ? rawEntries : []).map(function (rawEntry, index) {
      var lineageKey = String(parentKey || "").trim();
      var positionalKey = lineageKey
        ? lineageKey + "." + String(index + 1)
        : "tree." + String(index + 1);
      if (typeof rawEntry === "string") {
        return null;
      }
      if (!(rawEntry && typeof rawEntry === "object")) {
        return null;
      }
      var label = String(rawEntry.label || "").trim();
      var configuredKey = normalizeSidebarShellKey(rawEntry.key || "");
      var entryKey = configuredKey || positionalKey;
      var children = normalizeSidebarShellTreeEntries(rawEntry.children, entryKey);
      if (!label) {
        return null;
      }
      entryKey = configuredKey || (children.length ? positionalKey : normalizeSidebarShellKey(label));
      return { key: entryKey, label: label, children: children };
    }).filter(function (entry) {
      return !!(entry && entry.label);
    });
  }

  function collectSidebarShellTreeLeaves(entries, bucket) {
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      if (!(entry && typeof entry === "object")) {
        return;
      }
      if (Array.isArray(entry.children) && entry.children.length) {
        collectSidebarShellTreeLeaves(entry.children, bucket);
        return;
      }
      bucket.push(entry);
    });
    return bucket;
  }

  function pushSidebarShellItemBucketEntry(bucketMap, bucketKey, itemNode) {
    var normalizedBucketKey = normalizeSidebarShellKey(bucketKey);
    if (!normalizedBucketKey || !(itemNode instanceof HTMLElement)) {
      return;
    }
    if (!Array.isArray(bucketMap[normalizedBucketKey])) {
      bucketMap[normalizedBucketKey] = [];
    }
    if (bucketMap[normalizedBucketKey].indexOf(itemNode) !== -1) {
      return;
    }
    bucketMap[normalizedBucketKey].push(itemNode);
  }

  function pushSidebarShellItemBucketEntries(bucketMap, itemNode) {
    if (!(itemNode instanceof HTMLElement)) {
      return;
    }
    pushSidebarShellItemBucketEntry(bucketMap, resolveSidebarShellMenuItemKey(itemNode), itemNode);
    pushSidebarShellItemBucketEntry(bucketMap, resolveSidebarShellMenuItemLabel(itemNode), itemNode);
  }

  function consumeSidebarShellItemBucketEntry(bucketMap, bucketKey, consumedItems) {
    var normalizedBucketKey = normalizeSidebarShellKey(bucketKey);
    if (!normalizedBucketKey || !Array.isArray(bucketMap[normalizedBucketKey])) {
      return null;
    }
    for (var index = 0; index < bucketMap[normalizedBucketKey].length; index += 1) {
      var itemNode = bucketMap[normalizedBucketKey][index];
      if (itemNode instanceof HTMLElement && consumedItems.indexOf(itemNode) === -1) {
        return itemNode;
      }
    }
    return null;
  }

  function bindSidebarShellTreeLeafNodes(treeEntries, directItems) {
    var leafEntries = collectSidebarShellTreeLeaves(treeEntries, []);
    if (leafEntries.length !== directItems.length) {
      return null;
    }
    var itemsByKey = Object.create(null);
    directItems.forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement)) {
        return;
      }
      pushSidebarShellItemBucketEntries(itemsByKey, itemNode);
    });
    var consumedItems = [];
    for (var index = 0; index < leafEntries.length; index += 1) {
      var leafEntry = leafEntries[index];
      var expectedKey = normalizeSidebarShellKey(leafEntry && leafEntry.key || "");
      var matchedItem = consumeSidebarShellItemBucketEntry(itemsByKey, expectedKey, consumedItems);
      if (!(matchedItem instanceof HTMLElement)) {
        return null;
      }
      if (expectedKey) {
        matchedItem.dataset.surfaceSidebarItemKey = expectedKey;
      }
      leafEntry.itemNode = matchedItem;
      consumedItems.push(matchedItem);
    }
    return leafEntries;
  }

  function getSidebarShellRegisteredTree(popoverNode, triggerNode) {
    var registry = getSidebarShellSectionTreeRegistry();
    var ownerKey = resolveSidebarShellMenuItemKey(triggerNode) || String(popoverNode instanceof HTMLElement ? popoverNode.dataset.surfaceSidebarOwnerKey || "" : "").trim();
    var normalizedOwnerKey = normalizeSidebarShellKey(ownerKey);
    if (!normalizedOwnerKey) {
      return [];
    }
    return normalizeSidebarShellTreeEntries(registry[normalizedOwnerKey], normalizedOwnerKey);
  }

  function buildSidebarShellTreeNodes(containerPopover, entries) {
    (Array.isArray(entries) ? entries : []).forEach(function (entry, index) {
      if (!(entry && typeof entry === "object")) {
        return;
      }
      if (Array.isArray(entry.children) && entry.children.length) {
        var syntheticBranch = createSidebarShellSyntheticBranch(containerPopover, entry, "tree");
        syntheticBranch.branchNode.dataset.surfaceSidebarGroupIndex = String(index + 1);
        buildSidebarShellTreeNodes(syntheticBranch.nestedPopover, entry.children);
        containerPopover.appendChild(syntheticBranch.branchNode);
        return;
      }
      if (!(entry.itemNode instanceof HTMLElement)) {
        return;
      }
      entry.itemNode.dataset.surfaceSidebarRestored = "1";
      entry.itemNode.style.removeProperty("display");
      entry.itemNode.style.removeProperty("padding-left");
      containerPopover.appendChild(entry.itemNode);
    });
  }

  function materializeSidebarShellTreePopover(popoverNode, triggerNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return false;
    }
    var treeEntries = getSidebarShellRegisteredTree(popoverNode, triggerNode);
    if (!treeEntries.length) {
      if (popoverNode.dataset.surfaceSidebarSyntheticTree === "1") {
        resetSidebarShellSyntheticPopover(popoverNode);
      }
      return false;
    }
    if (
      popoverNode.dataset.surfaceSidebarSyntheticTree === "1" &&
      popoverNode.querySelector(":scope > [data-surface-sidebar-synthetic-branch='1']")
    ) {
      return true;
    }
    var directItems = getSidebarShellMenuItems(popoverNode).filter(function (itemNode) {
      return itemNode instanceof HTMLElement;
    });
    if (!directItems.length || directItems.some(isSidebarShellMenuBranchItem)) {
      if (popoverNode.dataset.surfaceSidebarSyntheticTree === "1") {
        resetSidebarShellSyntheticPopover(popoverNode);
      }
      return false;
    }
    var leafEntries = bindSidebarShellTreeLeafNodes(treeEntries, directItems);
    if (!Array.isArray(leafEntries) || !leafEntries.length) {
      if (popoverNode.dataset.surfaceSidebarSyntheticTree === "1") {
        resetSidebarShellSyntheticPopover(popoverNode);
      }
      return false;
    }
    resetSidebarShellSyntheticPopover(popoverNode);
    buildSidebarShellTreeNodes(popoverNode, treeEntries);
    popoverNode.dataset.surfaceSidebarSyntheticTree = "1";
    return true;
  }

  function materializeSidebarShellGroupedPopover(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return false;
    }
    if (popoverNode.dataset.surfaceSidebarSyntheticGroup === "1") {
      return false;
    }
    var groupHeaders = getSidebarShellDirectGroupHeaders(popoverNode);
    if (!groupHeaders.length) {
      if (popoverNode.dataset.surfaceSidebarSyntheticGroups === "1") {
        resetSidebarShellSyntheticPopover(popoverNode);
      }
      return false;
    }
    resetSidebarShellSyntheticPopover(popoverNode);
    var directChildren = getSidebarShellDirectChildNodes(popoverNode);
    var groups = [];
    var currentGroup = null;
    directChildren.forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (isSidebarShellGroupHeaderNode(node)) {
        currentGroup = {
          label: resolveSidebarShellMenuItemLabel(node),
          nodes: [],
        };
        groups.push(currentGroup);
        return;
      }
      if (!currentGroup) {
        return;
      }
      if (node.matches(SIDEBAR_SHELL_MENU_ITEM_SELECTOR) && isSidebarShellDirectMenuItem(popoverNode, node)) {
        currentGroup.nodes.push(node);
      }
    });
    var viableGroups = groups.filter(function (group) {
      return String(group && group.label || "").trim() && Array.isArray(group.nodes) && group.nodes.length;
    });
    if (viableGroups.length < 2) {
      return false;
    }
    viableGroups.forEach(function (group, index) {
      var syntheticBranch = createSidebarShellSyntheticBranch(popoverNode, {
        key: "group." + String(index + 1),
        label: group.label,
      }, "group");
      var branchNode = syntheticBranch.branchNode;
      var triggerNode = syntheticBranch.triggerNode;
      var nestedPopover = syntheticBranch.nestedPopover;

      group.nodes.forEach(function (itemNode) {
        if (!(itemNode instanceof HTMLElement)) {
          return;
        }
        itemNode.dataset.surfaceSidebarRestored = "1";
        itemNode.style.setProperty("display", "");
        itemNode.style.setProperty("padding-left", "");
        nestedPopover.appendChild(itemNode);
      });
      branchNode.dataset.surfaceSidebarSyntheticGroup = "1";
      popoverNode.appendChild(branchNode);
    });

    groupHeaders.forEach(function (headerNode) {
      if (headerNode instanceof HTMLElement) {
        headerNode.remove();
      }
    });
    popoverNode.dataset.surfaceSidebarSyntheticGroups = "1";
    return true;
  }

  function ensureSidebarShellPopoverHeader(popoverNode, ownerLabel, level) {
    if (!(popoverNode instanceof HTMLElement)) {
      return null;
    }
    var headerNode = popoverNode.querySelector(":scope > .o_surface_sidebar_shell_menu_header");
    // Keep nested flyouts compact; the hovered trigger already provides context.
    var shouldShowHeader = false;
    if (!shouldShowHeader) {
      if (headerNode instanceof HTMLElement) {
        headerNode.remove();
      }
      return null;
    }
    if (!(headerNode instanceof HTMLElement)) {
      headerNode = document.createElement("div");
      headerNode.className = "o_surface_sidebar_shell_menu_header";
      headerNode.setAttribute("aria-hidden", "true");
      popoverNode.insertBefore(headerNode, popoverNode.firstChild || null);
    }
    headerNode.textContent = String(ownerLabel || "").trim();
    return headerNode;
  }

  function annotateSidebarShellPopoverHierarchy(popoverNode, triggerNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return;
    }
    var depth = Math.max(Number(popoverNode.dataset.surfaceSidebarLevel || 1) || 1, 1);
    var ownerKey = resolveSidebarShellMenuItemKey(triggerNode) || String(popoverNode.dataset.surfaceSidebarOwnerKey || "").trim();
    if (ownerKey) {
      popoverNode.dataset.surfaceSidebarOwnerKey = ownerKey;
    } else {
      delete popoverNode.dataset.surfaceSidebarOwnerKey;
    }
    var ownerLabel = resolveSidebarShellPopoverOwnerLabel(popoverNode, triggerNode);
    if (ownerLabel) {
      popoverNode.dataset.surfaceSidebarOwnerLabel = ownerLabel;
    } else {
      delete popoverNode.dataset.surfaceSidebarOwnerLabel;
    }
    ensureSidebarShellPopoverHeader(popoverNode, ownerLabel, depth);
    suppressSidebarShellOwnerDuplicateItems(popoverNode, ownerLabel);
    suppressSidebarShellDuplicateSiblingItems(popoverNode);
    var items = getSidebarShellMenuItems(popoverNode);
    if (!items.length) {
      delete popoverNode.dataset.surfaceSidebarHierarchy;
      delete popoverNode.dataset.surfaceSidebarBranchCount;
      delete popoverNode.dataset.surfaceSidebarGroupCount;
      delete popoverNode.dataset.surfaceSidebarGroupedChildren;
      return;
    }
    var currentBranchKey = "";
    var currentGroupIndex = 0;
    var branchCount = 0;
    var groupedChildrenCount = 0;
    items.forEach(function (itemNode, index) {
      if (!(itemNode instanceof HTMLElement)) {
        return;
      }
      [
        "data-surface-sidebar-item-kind",
        "data-surface-sidebar-item-index",
        "data-surface-sidebar-item-depth",
        "data-surface-sidebar-group-index",
        "data-surface-sidebar-owned-by",
        "data-surface-sidebar-has-owned-children",
        "data-surface-sidebar-group-role",
        "data-surface-sidebar-child-index",
        "data-surface-sidebar-child-count",
        "data-surface-sidebar-child-position",
      ].forEach(function (attributeName) {
        itemNode.removeAttribute(attributeName);
      });
      itemNode.dataset.surfaceSidebarItemIndex = String(index + 1);
      itemNode.dataset.surfaceSidebarItemDepth = String(depth);
      if (isSidebarShellMenuBranchItem(itemNode)) {
        currentGroupIndex += 1;
        branchCount += 1;
        currentBranchKey = resolveSidebarShellMenuItemKey(itemNode);
        itemNode.dataset.surfaceSidebarItemKind = "branch";
        itemNode.dataset.surfaceSidebarGroupIndex = String(currentGroupIndex);
        return;
      }
      itemNode.dataset.surfaceSidebarItemKind = "leaf";
      if (currentBranchKey) {
        groupedChildrenCount += 1;
        itemNode.dataset.surfaceSidebarOwnedBy = currentBranchKey;
        itemNode.dataset.surfaceSidebarGroupIndex = String(currentGroupIndex);
      }
    });
    var hasOwnedChildren = false;
    items.forEach(function (itemNode, index) {
      if (!(itemNode instanceof HTMLElement) || itemNode.dataset.surfaceSidebarItemKind !== "branch") {
        return;
      }
      var ownedChildrenCount = 0;
      for (var cursor = index + 1; cursor < items.length; cursor += 1) {
        var nextNode = items[cursor];
        if (!(nextNode instanceof HTMLElement)) {
          continue;
        }
        if (nextNode.dataset.surfaceSidebarItemKind === "branch") {
          break;
        }
        if (nextNode.dataset.surfaceSidebarGroupIndex === itemNode.dataset.surfaceSidebarGroupIndex) {
          ownedChildrenCount += 1;
        }
      }
      if (ownedChildrenCount > 0) {
        hasOwnedChildren = true;
        itemNode.dataset.surfaceSidebarHasOwnedChildren = "1";
        itemNode.dataset.surfaceSidebarGroupRole = "parent";
      } else {
        itemNode.dataset.surfaceSidebarGroupRole = "standalone";
      }
      if (ownedChildrenCount > 0) {
        var childCursor = 0;
        for (var childIndex = index + 1; childIndex < items.length; childIndex += 1) {
          var ownedNode = items[childIndex];
          if (!(ownedNode instanceof HTMLElement)) {
            continue;
          }
          if (ownedNode.dataset.surfaceSidebarItemKind === "branch") {
            break;
          }
          if (ownedNode.dataset.surfaceSidebarGroupIndex !== itemNode.dataset.surfaceSidebarGroupIndex) {
            continue;
          }
          childCursor += 1;
          ownedNode.dataset.surfaceSidebarGroupRole = "owned-child";
          ownedNode.dataset.surfaceSidebarChildIndex = String(childCursor);
          ownedNode.dataset.surfaceSidebarChildCount = String(ownedChildrenCount);
          ownedNode.dataset.surfaceSidebarChildPosition =
            ownedChildrenCount === 1
              ? "only"
              : childCursor === 1
                ? "start"
                : childCursor === ownedChildrenCount
                  ? "end"
                  : "middle";
        }
      }
    });
    popoverNode.dataset.surfaceSidebarBranchCount = String(branchCount);
    popoverNode.dataset.surfaceSidebarGroupCount = String(currentGroupIndex);
    popoverNode.dataset.surfaceSidebarHierarchy =
      hasOwnedChildren
        ? "grouped"
        : branchCount > 0
          ? "branched"
          : "flat";
    popoverNode.dataset.surfaceSidebarGroupedChildren = String(groupedChildrenCount);
  }

  function isSidebarShellTriggerExpanded(triggerNode) {
    return triggerNode instanceof HTMLElement &&
      (triggerNode.classList.contains("show") || triggerNode.getAttribute("aria-expanded") === "true");
  }

  function getSidebarShellExpandedTriggers() {
    return Array.prototype.slice.call(document.querySelectorAll(SIDEBAR_SHELL_TRIGGER_SELECTOR)).filter(function (node) {
      return isSidebarShellTriggerExpanded(node);
    });
  }

  function getSidebarShellTriggerContainer(triggerNode) {
    if (!(triggerNode instanceof HTMLElement)) {
      return null;
    }
    var parentPopover = resolveSidebarShellMenuPopover(triggerNode.parentElement);
    if (parentPopover instanceof HTMLElement) {
      return parentPopover;
    }
    return getSidebarShellMenuSections();
  }

  function resolveSidebarShellParentPopover(triggerNode, fallbackNode) {
    var parentPopover = triggerNode instanceof Element
      ? triggerNode.closest(".o_surface_sidebar_shell_menu_popover")
      : null;
    if (parentPopover instanceof HTMLElement) {
      return parentPopover;
    }
    if (
      fallbackNode instanceof HTMLElement &&
      fallbackNode.classList.contains("o_surface_sidebar_shell_menu_popover")
    ) {
      return fallbackNode;
    }
    return null;
  }

  function isSidebarShellVisibleRect(rect) {
    return !!(rect && rect.width > 0 && rect.height > 0);
  }

  function resolveSidebarShellPopoverColumnRect(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return null;
    }
    return popoverNode.getBoundingClientRect();
  }

  function clampSidebarShellNestedHorizontalGap(left, parentRect, side) {
    if (!isSidebarShellVisibleRect(parentRect) || side !== "right") {
      return left;
    }
    var compactLeft = Math.round(parentRect.right + SIDEBAR_SHELL_MENU_GAP_PX);
    if (left - compactLeft > SIDEBAR_SHELL_MAX_NESTED_GAP_PX) {
      return compactLeft;
    }
    return left;
  }

  function resolveSidebarShellFixedContainingBlockRect(popoverNode, parentPopover) {
    if (
      !(popoverNode instanceof HTMLElement) ||
      !(parentPopover instanceof HTMLElement) ||
      !parentPopover.contains(popoverNode)
    ) {
      return null;
    }
    return parentPopover.getBoundingClientRect();
  }

  function getSidebarShellPopoverLevelForTrigger(triggerNode) {
    var containerNode = getSidebarShellTriggerContainer(triggerNode);
    if (!(containerNode instanceof HTMLElement)) {
      return 1;
    }
    if (containerNode.classList.contains("o_menu_sections")) {
      return 1;
    }
    return Math.max(Number(containerNode.dataset.surfaceSidebarLevel || 1) || 1, 1) + 1;
  }

  function closeSidebarShellExpandedTriggersInContainer(containerNode, exceptTriggerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return;
    }
    getSidebarShellExpandedTriggers().forEach(function (triggerNode) {
      if (!(triggerNode instanceof HTMLElement) || triggerNode === exceptTriggerNode) {
        return;
      }
      if (getSidebarShellTriggerContainer(triggerNode) !== containerNode) {
        return;
      }
      closeSidebarShellTrigger(triggerNode);
    });
  }

  function getSidebarShellTriggerNode() {
    return document.querySelector(
      ".o_main_navbar .o_menu_sections > :not(.o_menu_sections_more).show, " +
      ".o_main_navbar .o_menu_sections > :not(.o_menu_sections_more)[aria-expanded='true']"
    );
  }

  function closeSidebarShellTrigger(triggerNode) {
    if (!isSidebarShellTriggerExpanded(triggerNode) || typeof triggerNode.click !== "function") {
      return false;
    }
    triggerNode.click();
    scheduleSidebarShellSyncBurst();
    return true;
  }

  function openSidebarShellTrigger(triggerNode) {
    if (!(triggerNode instanceof HTMLElement) || typeof triggerNode.click !== "function") {
      return false;
    }
    closeSidebarShellExpandedTriggersInContainer(getSidebarShellTriggerContainer(triggerNode), triggerNode);
    queueSidebarShellPendingTrigger(triggerNode);
    if (!isSidebarShellTriggerExpanded(triggerNode)) {
      triggerNode.click();
    }
    scheduleSidebarShellSyncBurst();
    return true;
  }

  function scheduleSidebarShellTriggerOpen(triggerNode) {
    if (!(triggerNode instanceof HTMLElement) || !canUseSidebarShellHoverMenus()) {
      return;
    }
    queueSidebarShellPendingTrigger(triggerNode);
    clearSidebarShellHoverTimer("sidebarShellCloseTimer");
    if (shared.sidebarShellHoveredTrigger === triggerNode && isSidebarShellTriggerExpanded(triggerNode)) {
      scheduleSidebarShellSyncBurst();
      return;
    }
    shared.sidebarShellHoveredTrigger = triggerNode;
    clearSidebarShellHoverTimer("sidebarShellOpenTimer");
    shared.sidebarShellOpenTimer = window.setTimeout(function () {
      shared.sidebarShellOpenTimer = 0;
      if (shared.sidebarShellHoveredTrigger !== triggerNode || !canUseSidebarShellHoverMenus()) {
        return;
      }
      openSidebarShellTrigger(triggerNode);
    }, SIDEBAR_SHELL_OPEN_DELAY_MS);
  }

  function scheduleSidebarShellTriggerClose() {
    clearSidebarShellHoverTimer("sidebarShellOpenTimer");
    clearSidebarShellHoverTimer("sidebarShellCloseTimer");
    shared.sidebarShellCloseTimer = window.setTimeout(function () {
      shared.sidebarShellCloseTimer = 0;
      if (shared.sidebarShellHoveredTrigger || shared.sidebarShellHoveredPopover || !canUseSidebarShellHoverMenus()) {
        return;
      }
      closeSidebarShellTrigger(getSidebarShellTriggerNode());
    }, SIDEBAR_SHELL_CLOSE_DELAY_MS);
  }

  function resolveSidebarShellPopoverOwnerTrigger(popoverNode) {
    if (!(popoverNode instanceof HTMLElement)) {
      return null;
    }
    var existingOwnerTrigger = findSidebarShellTriggerById(popoverNode.dataset.surfaceSidebarOwnerTriggerId);
    if (existingOwnerTrigger instanceof HTMLElement && isSidebarShellTriggerExpanded(existingOwnerTrigger)) {
      return existingOwnerTrigger;
    }
    var pendingTrigger = shiftSidebarShellPendingTrigger();
    if (pendingTrigger instanceof HTMLElement) {
      popoverNode.dataset.surfaceSidebarOwnerTriggerId = ensureSidebarShellTriggerId(pendingTrigger);
      popoverNode.dataset.surfaceSidebarLevel = String(getSidebarShellPopoverLevelForTrigger(pendingTrigger));
      return pendingTrigger;
    }
    delete popoverNode.dataset.surfaceSidebarOwnerTriggerId;
    delete popoverNode.dataset.surfaceSidebarLevel;
    return null;
  }

  function positionSidebarShellPopover(node) {
    var popover = node instanceof HTMLElement ? node : null;
    var triggerNode = resolveSidebarShellPopoverOwnerTrigger(popover);
    if (popover instanceof HTMLElement) {
      if (!materializeSidebarShellTreePopover(popover, triggerNode)) {
        materializeSidebarShellGroupedPopover(popover);
      }
      annotateSidebarShellPopoverHierarchy(popover, triggerNode);
    }
    var containerNode = getSidebarShellTriggerContainer(triggerNode);
    if (!(popover instanceof HTMLElement) || !(containerNode instanceof HTMLElement) || !(triggerNode instanceof HTMLElement)) {
      if (popover instanceof HTMLElement) {
        delete popover.dataset.surfaceSidebarPositioned;
      }
      return false;
    }
    var containerRect = containerNode.getBoundingClientRect();
    var triggerRect = triggerNode.getBoundingClientRect();
    var depth = Math.max(Number(popover.dataset.surfaceSidebarLevel || 1) || 1, 1);
    var parentPopover = depth > 1
      ? resolveSidebarShellParentPopover(triggerNode, containerNode)
      : null;
    var parentRect = parentPopover instanceof HTMLElement
      ? resolveSidebarShellPopoverColumnRect(parentPopover)
      : null;
    var viewportWidth = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 0);
    var viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 0);
    var popoverWidth = Math.max(popover.offsetWidth || 0, 0);
    var popoverHeight = Math.max(popover.offsetHeight || 0, 0);
    var viewportMargin = SIDEBAR_SHELL_VIEWPORT_MARGIN_PX;
    var top = Math.max(viewportMargin, Math.round(triggerRect.top));
    if (viewportHeight > 0 && popoverHeight > 0) {
      top = Math.min(top, Math.max(viewportMargin, viewportHeight - popoverHeight - viewportMargin));
    }
    var anchorRight = depth > 1
      ? (parentRect && isSidebarShellVisibleRect(parentRect) ? parentRect.right : containerRect.right)
      : Math.max(containerRect.right, triggerRect.right);
    var anchorLeft = depth > 1
      ? (parentRect && isSidebarShellVisibleRect(parentRect) ? parentRect.left : containerRect.left)
      : Math.min(containerRect.left, triggerRect.left);
    var left = Math.round(anchorRight + SIDEBAR_SHELL_MENU_GAP_PX);
    var side = "right";
    if (viewportWidth > 0 && popoverWidth > 0) {
      var minViewportLeft = viewportMargin;
      var maxViewportLeft = Math.max(minViewportLeft, viewportWidth - popoverWidth - viewportMargin);
      var preferredRightLeft = left;
      var overflowsRight = preferredRightLeft + popoverWidth > viewportWidth - viewportMargin;
      if (depth > 1 && overflowsRight) {
        var preferredLeftLeft = Math.round(anchorLeft - popoverWidth - SIDEBAR_SHELL_MENU_GAP_PX);
        if (preferredLeftLeft >= minViewportLeft) {
          left = preferredLeftLeft;
          side = "left";
        } else {
          left = Math.min(preferredRightLeft, maxViewportLeft);
        }
      } else {
        left = Math.min(preferredRightLeft, maxViewportLeft);
      }
      left = Math.max(minViewportLeft, left);
    }
    left = clampSidebarShellNestedHorizontalGap(left, parentRect, side);
    var containingBlockRect = resolveSidebarShellFixedContainingBlockRect(popover, parentPopover);
    var styleLeft = isSidebarShellVisibleRect(containingBlockRect)
      ? left - containingBlockRect.left
      : left;
    var styleTop = isSidebarShellVisibleRect(containingBlockRect)
      ? top - containingBlockRect.top
      : top;
    var leftValue = Math.round(styleLeft) + "px";
    var topValue = Math.round(styleTop) + "px";
    if (popover.style.left !== leftValue) {
      popover.style.setProperty("left", leftValue, "important");
    }
    if (popover.style.top !== topValue) {
      popover.style.setProperty("top", topValue, "important");
    }
    if (popover.style.transform !== "none") {
      popover.style.setProperty("transform", "none", "important");
    }
    popover.style.setProperty(
      "z-index",
      String(SIDEBAR_SHELL_POPOVER_Z_INDEX_BASE + depth),
      "important"
    );
    popover.dataset.surfaceSidebarDepth = String(depth);
    popover.dataset.surfaceSidebarSide = side;
    popover.dataset.surfaceSidebarAnchor = depth > 1 ? "parent-popover" : "sidebar";
    popover.dataset.surfaceSidebarAnchorGap = String(SIDEBAR_SHELL_MENU_GAP_PX);
    popover.dataset.surfaceSidebarMaxNestedGap = String(SIDEBAR_SHELL_MAX_NESTED_GAP_PX);
    popover.dataset.surfaceSidebarViewportLeft = String(Math.round(left));
    popover.dataset.surfaceSidebarViewportTop = String(Math.round(top));
    popover.dataset.surfaceSidebarPositioned = "1";
    return true;
  }

  function ensureSidebarShellPopoverObserver(node) {
    var popover = node instanceof HTMLElement ? node : null;
    if (!(popover instanceof HTMLElement)) {
      return null;
    }
    var observers = getSidebarShellPopoverObservers();
    if (observers.has(popover)) {
      return observers.get(popover);
    }
    var observer = new MutationObserver(function () {
      if (!popover.isConnected || !document.body.classList.contains(SIDEBAR_SHELL_BODY_CLASS)) {
        return;
      }
      window.requestAnimationFrame(function () {
        positionSidebarShellPopover(popover);
      });
    });
    observer.observe(popover, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    observers.set(popover, observer);
    return observer;
  }

  function syncSidebarShellPopovers(active) {
    var sidebarPopovers = [];
    Array.prototype.slice.call(
      document.querySelectorAll(".o_popover.o-dropdown--menu.dropdown-menu[role='menu'], .o-dropdown--menu.dropdown-menu[role='menu']")
    ).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      var isSidebarPopover = isSidebarShellMenuPopover(node);
      node.classList.toggle("o_surface_sidebar_shell_menu_popover", !!(active && isSidebarPopover));
      if (active && isSidebarPopover) {
        sidebarPopovers.push(node);
        return;
      }
      delete node.dataset.surfaceSidebarPositioned;
      delete node.dataset.surfaceSidebarOwnerTriggerId;
      delete node.dataset.surfaceSidebarLevel;
      delete node.dataset.surfaceSidebarSide;
    });
    if (!active) {
      return;
    }
    pruneSidebarShellPendingTriggers();
    sidebarPopovers.forEach(function (node) {
      resolveSidebarShellPopoverOwnerTrigger(node);
      ensureSidebarShellPopoverObserver(node);
    });
    sidebarPopovers.forEach(function (node) {
      positionSidebarShellPopover(node);
    });
  }

  function installSidebarShellHoverBridge() {
    if (shared.sidebarShellHoverBridgeInstalled) {
      return;
    }
    shared.sidebarShellHoverBridgeInstalled = true;
    document.addEventListener("pointerover", function (event) {
      if (!canUseSidebarShellHoverMenus()) {
        clearSidebarShellHoverState();
        return;
      }
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (triggerNode instanceof HTMLElement) {
        if (!(event.relatedTarget instanceof Node) || !triggerNode.contains(event.relatedTarget)) {
          var parentPopover = resolveSidebarShellMenuPopover(triggerNode.parentElement);
          if (parentPopover instanceof HTMLElement) {
            shared.sidebarShellHoveredPopover = parentPopover;
          }
          scheduleSidebarShellTriggerOpen(triggerNode);
        }
        return;
      }
      var popoverNode = resolveSidebarShellMenuPopover(event.target);
      if (!(popoverNode instanceof HTMLElement)) {
        return;
      }
      if (!(event.relatedTarget instanceof Node) || !popoverNode.contains(event.relatedTarget)) {
        shared.sidebarShellHoveredPopover = popoverNode;
        clearSidebarShellHoverTimer("sidebarShellCloseTimer");
        closeSidebarShellExpandedTriggersInContainer(popoverNode, null);
        scheduleSidebarShellSyncBurst();
      }
    }, true);
    document.addEventListener("pointerout", function (event) {
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (triggerNode instanceof HTMLElement) {
        if (!(event.relatedTarget instanceof Node) || !triggerNode.contains(event.relatedTarget)) {
          if (shared.sidebarShellHoveredTrigger === triggerNode) {
            shared.sidebarShellHoveredTrigger = null;
          }
          scheduleSidebarShellTriggerClose();
        }
        return;
      }
      var popoverNode = resolveSidebarShellMenuPopover(event.target);
      if (!(popoverNode instanceof HTMLElement)) {
        return;
      }
      if (!(event.relatedTarget instanceof Node) || !popoverNode.contains(event.relatedTarget)) {
        if (shared.sidebarShellHoveredPopover === popoverNode) {
          shared.sidebarShellHoveredPopover = null;
        }
        scheduleSidebarShellTriggerClose();
      }
    }, true);
    document.addEventListener("pointerdown", function (event) {
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (triggerNode instanceof HTMLElement) {
        queueSidebarShellPendingTrigger(triggerNode);
        return;
      }
      if (resolveSidebarShellMenuPopover(event.target)) {
        return;
      }
      clearSidebarShellHoverState();
      closeSidebarShellTrigger(getSidebarShellTriggerNode());
    }, true);
    document.addEventListener("focusin", function (event) {
      if (!canUseSidebarShellHoverMenus()) {
        return;
      }
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (triggerNode instanceof HTMLElement) {
        scheduleSidebarShellTriggerOpen(triggerNode);
        return;
      }
      var popoverNode = resolveSidebarShellMenuPopover(event.target);
      if (popoverNode instanceof HTMLElement) {
        shared.sidebarShellHoveredPopover = popoverNode;
        clearSidebarShellHoverTimer("sidebarShellCloseTimer");
      }
    }, true);
    document.addEventListener("focusout", function () {
      if (!canUseSidebarShellHoverMenus()) {
        return;
      }
      window.setTimeout(function () {
        var activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          (resolveSidebarShellHoverTrigger(activeElement) instanceof HTMLElement ||
          resolveSidebarShellMenuPopover(activeElement) instanceof HTMLElement)
        ) {
          return;
        }
        shared.sidebarShellHoveredTrigger = null;
        shared.sidebarShellHoveredPopover = null;
        scheduleSidebarShellTriggerClose();
      }, 0);
    }, true);
    document.addEventListener("click", function (event) {
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (!(triggerNode instanceof HTMLElement)) {
        return;
      }
      queueSidebarShellPendingTrigger(triggerNode);
      scheduleSidebarShellSyncBurst();
    }, true);
    document.addEventListener("keydown", function (event) {
      var triggerNode = resolveSidebarShellHoverTrigger(event.target);
      if (!(triggerNode instanceof HTMLElement) || !canUseSidebarShellHoverMenus()) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSidebarShellTrigger(triggerNode);
        return;
      }
      if (event.key === "Escape" || event.key === "ArrowLeft") {
        event.preventDefault();
        closeSidebarShellTrigger(triggerNode);
      }
    }, true);
  }

  function syncSidebarShellState() {
    if (!(document.body instanceof HTMLElement)) {
      return false;
    }
    var active = shouldActivateSidebarShell();
    var collapsed = active && readSidebarShellCollapsed();
    if (!active || collapsed) {
      clearSidebarShellHoverState();
    }
    ensureSidebarShellToggle(active, collapsed);
    document.body.classList.toggle(SIDEBAR_SHELL_BODY_CLASS, active);
    document.body.classList.toggle(SIDEBAR_SHELL_COLLAPSED_CLASS, collapsed);
    syncSidebarShellCurrentSection(active);
    syncSidebarShellPopovers(active);
    return active;
  }

  function installSidebarShellLifecycle() {
    if (shared.sidebarShellLifecycleInstalled) {
      scheduleSidebarShellStateSync();
      return;
    }
    shared.sidebarShellLifecycleInstalled = true;
    ["resize", "hashchange", "popstate", "pageshow"].forEach(function (eventName) {
      window.addEventListener(eventName, scheduleSidebarShellStateSync);
    });
    if (document.documentElement instanceof HTMLElement) {
      shared.sidebarShellObserver = new MutationObserver(function () {
        scheduleSidebarShellStateSync();
      });
      shared.sidebarShellObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleSidebarShellStateSync, { once: true });
    }
    scheduleSidebarShellStateSync();
  }

  installSidebarShellHoverBridge();
  installSidebarShellLifecycle();
})();
