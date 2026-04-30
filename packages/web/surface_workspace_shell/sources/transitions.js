(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var shared = surfaceLayerApi._shared || (surfaceLayerApi._shared = {});
  var resolveElement = surfaceLayerApi.resolveElement;
  var getTransitionShell = surfaceLayerApi.getTransitionShell;
  var SURFACE_BREADCRUMB_LINK_ATTR = "data-surface-breadcrumb-link";
  var SURFACE_BREADCRUMB_ACTION_PROP = "__surfaceBreadcrumbAction";
  var transitionBreadcrumbFramesByShellId =
    shared.transitionBreadcrumbFramesByShellId || (shared.transitionBreadcrumbFramesByShellId = Object.create(null));
  var breadcrumbActionsInspectionCounterKey = "surfaceBreadcrumbActionsInspectionCounter";

  function isModalRootNode(node) {
    return !!(
      node instanceof HTMLElement &&
      node.matches(".modal, .o_dialog, .o_technical_modal")
    );
  }

  function isModalOnlyMutation(mutations) {
    var entries = Array.isArray(mutations) ? mutations : [];
    if (!entries.length) {
      return false;
    }
    return entries.every(function (mutation) {
      return Array.prototype.slice.call(mutation.addedNodes || []).every(isModalRootNode) &&
        Array.prototype.slice.call(mutation.removedNodes || []).every(isModalRootNode);
    });
  }

  function hasOpenModal() {
    return !!document.querySelector(".modal.show, .o_dialog, .o_technical_modal");
  }

  function resolveBreadcrumbRoot(rootNode) {
    var resolvedRoot = resolveElement(rootNode);
    if (resolvedRoot instanceof HTMLElement) {
      if (resolvedRoot.matches("ol.breadcrumb")) {
        return resolvedRoot.closest(".o_breadcrumb") || resolvedRoot;
      }
      return resolvedRoot.closest(".o_breadcrumb") || resolvedRoot;
    }
    resolvedRoot = document.querySelector(".o_control_panel .o_breadcrumb");
    if (resolvedRoot instanceof HTMLElement) {
      return resolvedRoot;
    }
    resolvedRoot = document.querySelector(".o_control_panel ol.breadcrumb, .o_control_panel .breadcrumb");
    if (!(resolvedRoot instanceof HTMLElement)) {
      return null;
    }
    return resolvedRoot.closest(".o_breadcrumb") || resolvedRoot;
  }

  function normalizeBreadcrumbRootPresentation(rootNode, listNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    if (rootNode === listNode) {
      rootNode.className = "breadcrumb flex-nowrap text-nowrap lh-sm o_surface_breadcrumb_root o_surface_breadcrumb_list";
      rootNode.setAttribute("data-surface-breadcrumb-root", "1");
      rootNode.setAttribute("data-surface-breadcrumb-list", "1");
      return;
    }
    rootNode.className = "o_breadcrumb d-flex align-items-center gap-1 text-truncate min-w-0 o_surface_breadcrumb_root";
    rootNode.setAttribute("data-surface-breadcrumb-root", "1");
    if (listNode instanceof HTMLElement) {
      listNode.setAttribute("data-surface-breadcrumb-list", "1");
      listNode.className = String(listNode.className || "").replace(/\s+/g, " ").trim();
      if (!listNode.classList.contains("o_surface_breadcrumb_list")) {
        listNode.classList.add("o_surface_breadcrumb_list");
      }
    }
  }

  function normalizeBreadcrumbActionsPresentation(actionsNode) {
    if (!(actionsNode instanceof HTMLElement)) {
      return;
    }
    actionsNode.className = "o_control_panel_breadcrumbs_actions d-inline-flex d-print-none o_surface_breadcrumb_actions";
  }

  function cleanBreadcrumbActionLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isVisibleBreadcrumbActionElement(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var rect = node.getBoundingClientRect();
    return (
      window.getComputedStyle(node).display !== "none" &&
      window.getComputedStyle(node).visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function isMeaningfulBreadcrumbActionLabel(value) {
    var label = cleanBreadcrumbActionLabel(value);
    if (!label) {
      return false;
    }
    return !/^(no hay reportes disponibles\.?|no reports available\.?|sin acciones disponibles\.?|no actions available\.?)$/i.test(label);
  }

  function findBreadcrumbActionsToggle(actionsNode) {
    if (!(actionsNode instanceof HTMLElement)) {
      return null;
    }
    return actionsNode.querySelector(".dropdown-toggle, button[aria-label], button, .btn");
  }

  function collectVisibleBreadcrumbActionMenus(toggleNode) {
    if (!(toggleNode instanceof HTMLElement)) {
      return [];
    }
    var toggleRect = toggleNode.getBoundingClientRect();
    return Array.prototype.slice.call(document.querySelectorAll(
      ".o_popover.o-dropdown--menu, .o-dropdown--menu[role='menu'], .dropdown-menu"
    )).filter(function (node) {
      return isVisibleBreadcrumbActionElement(node);
    }).map(function (node) {
      var rect = node.getBoundingClientRect();
      var distanceX = Math.abs(rect.left - toggleRect.left);
      var distanceY = Math.abs(rect.top - toggleRect.bottom);
      return {
        menuNode: node,
        score: (distanceX * 2) + distanceY,
      };
    }).sort(function (left, right) {
      return left.score - right.score;
    }).map(function (entry) {
      return entry.menuNode;
    });
  }

  function menuHasMeaningfulBreadcrumbActions(menuNode) {
    if (!(menuNode instanceof HTMLElement)) {
      return false;
    }
    var items = Array.prototype.slice.call(menuNode.querySelectorAll(
      ".dropdown-item, .o-dropdown-item, [role='menuitem']"
    )).filter(function (node) {
      if (!(node instanceof HTMLElement) || !isVisibleBreadcrumbActionElement(node)) {
        return false;
      }
      if (
        node.hasAttribute("disabled") ||
        node.getAttribute("aria-disabled") === "true" ||
        node.classList.contains("disabled")
      ) {
        return false;
      }
      return true;
    });
    return items.some(function (node) {
      return isMeaningfulBreadcrumbActionLabel(node.textContent || "");
    });
  }

  function setBreadcrumbActionsAvailability(actionsNode, available) {
    if (!(actionsNode instanceof HTMLElement)) {
      return;
    }
    actionsNode.dataset.surfaceBreadcrumbActionsAvailable = available ? "1" : "0";
    actionsNode.dataset.surfaceBreadcrumbActionsResolved = "1";
  }

  function setBreadcrumbActionsInspectionState(active) {
    var body = document.body;
    if (!(body instanceof HTMLElement)) {
      return;
    }
    var nextCount = Math.max(Number(shared[breadcrumbActionsInspectionCounterKey] || 0) || 0, 0);
    nextCount += active ? 1 : -1;
    nextCount = Math.max(nextCount, 0);
    shared[breadcrumbActionsInspectionCounterKey] = nextCount;
    if (nextCount > 0) {
      body.setAttribute("data-surface-breadcrumb-actions-inspecting", "1");
      return;
    }
    body.removeAttribute("data-surface-breadcrumb-actions-inspecting");
  }

  function inspectBreadcrumbActionsAvailability(actionsNode, attempt) {
    if (!(actionsNode instanceof HTMLElement) || !actionsNode.isConnected) {
      return;
    }
    var retryCount = Math.max(Number(attempt || 0) || 0, 0);
    var toggleNode = findBreadcrumbActionsToggle(actionsNode);
    if (!(toggleNode instanceof HTMLElement)) {
      setBreadcrumbActionsAvailability(actionsNode, false);
      return;
    }
    if (!isVisibleBreadcrumbActionElement(actionsNode) || !isVisibleBreadcrumbActionElement(toggleNode)) {
      if (retryCount < 5) {
        actionsNode._surfaceBreadcrumbActionsTimer = window.setTimeout(function () {
          actionsNode._surfaceBreadcrumbActionsTimer = 0;
          inspectBreadcrumbActionsAvailability(actionsNode, retryCount + 1);
        }, 80 + (retryCount * 40));
        return;
      }
      setBreadcrumbActionsAvailability(actionsNode, true);
      return;
    }
    var wasExpanded = toggleNode.getAttribute("aria-expanded") === "true";
    setBreadcrumbActionsInspectionState(true);
    if (!wasExpanded) {
      toggleNode.click();
    }
    window.setTimeout(function () {
      try {
        var menus = collectVisibleBreadcrumbActionMenus(toggleNode);
        if (!menus.length) {
          if (!wasExpanded && toggleNode.isConnected && toggleNode.getAttribute("aria-expanded") === "true") {
            toggleNode.click();
          }
          if (retryCount < 5) {
            actionsNode._surfaceBreadcrumbActionsTimer = window.setTimeout(function () {
              actionsNode._surfaceBreadcrumbActionsTimer = 0;
              inspectBreadcrumbActionsAvailability(actionsNode, retryCount + 1);
            }, 90 + (retryCount * 40));
            return;
          }
          setBreadcrumbActionsAvailability(actionsNode, true);
          return;
        }
        var available = menus.some(menuHasMeaningfulBreadcrumbActions);
        if (!wasExpanded && toggleNode.isConnected && toggleNode.getAttribute("aria-expanded") === "true") {
          toggleNode.click();
        }
        setBreadcrumbActionsAvailability(actionsNode, available);
      } catch (_error) {
        setBreadcrumbActionsAvailability(actionsNode, true);
      } finally {
        setBreadcrumbActionsInspectionState(false);
      }
    }, 90);
  }

  function scheduleBreadcrumbActionsAvailabilitySync(actionsNode) {
    if (!(actionsNode instanceof HTMLElement)) {
      return;
    }
    var routeKey = cleanBreadcrumbActionLabel(window.location.pathname + window.location.search + window.location.hash);
    if (
      actionsNode.dataset.surfaceBreadcrumbActionsResolved === "1" &&
      actionsNode.dataset.surfaceBreadcrumbActionsRouteKey === routeKey
    ) {
      return;
    }
    if (actionsNode._surfaceBreadcrumbActionsTimer) {
      window.clearTimeout(actionsNode._surfaceBreadcrumbActionsTimer);
      actionsNode._surfaceBreadcrumbActionsTimer = 0;
    }
    actionsNode.dataset.surfaceBreadcrumbActionsResolved = "0";
    actionsNode.dataset.surfaceBreadcrumbActionsRouteKey = routeKey;
    actionsNode._surfaceBreadcrumbActionsTimer = window.setTimeout(function () {
      actionsNode._surfaceBreadcrumbActionsTimer = 0;
      inspectBreadcrumbActionsAvailability(actionsNode, 0);
    }, 30);
  }

  function ensureBreadcrumbListScaffold(config) {
    var settings = config && typeof config === "object" ? config : {};
    var root = resolveBreadcrumbRoot(settings.rootNode || settings.root || settings.breadcrumbContainer);
    if (!(root instanceof HTMLElement)) {
      return null;
    }
    var actionsSelector = String(settings.actionsSelector || ".o_control_panel_breadcrumbs_actions").trim();
    var rootNode = root;
    var actionsNode = rootNode.querySelector(actionsSelector);
    var listNode = rootNode.matches("ol.breadcrumb")
      ? rootNode
      : rootNode.querySelector(String(settings.listSelector || "ol.breadcrumb").trim());
    if (!(listNode instanceof HTMLElement)) {
      listNode = document.createElement(String(settings.listTagName || "ol").trim() || "ol");
      if (actionsNode instanceof HTMLElement && actionsNode.parentNode === rootNode) {
        rootNode.insertBefore(listNode, actionsNode);
      } else {
        rootNode.appendChild(listNode);
      }
    }
    listNode.className = String(settings.listClassName || "breadcrumb flex-nowrap text-nowrap lh-sm").trim();
    normalizeBreadcrumbRootPresentation(rootNode, listNode);
    rootNode.setAttribute("data-surface-breadcrumb-managed", "1");
    listNode.setAttribute("data-surface-breadcrumb-managed", "1");
    if (
      actionsNode instanceof HTMLElement &&
      rootNode !== listNode &&
      actionsNode.parentElement !== rootNode
    ) {
      rootNode.appendChild(actionsNode);
    }
    normalizeBreadcrumbActionsPresentation(actionsNode);
    scheduleBreadcrumbActionsAvailabilitySync(actionsNode);
    if (rootNode !== listNode) {
      reconcileOrderedChildren(
        rootNode,
        [listNode].concat(actionsNode instanceof HTMLElement ? [actionsNode] : [])
      );
    }
    installManagedAnchorNavigationBehavior({
      rootNode: rootNode,
      selector: "a[data-surface-breadcrumb-link='1']",
      boundFlag: "surfaceBreadcrumbLinksBound",
    });
    return {
      rootNode: rootNode,
      actionsNode: actionsNode instanceof HTMLElement ? actionsNode : null,
      listNode: listNode,
    };
  }

  function collectCanonicalBreadcrumbScaffolds(scopeNode, config) {
    var settings = config && typeof config === "object" ? config : {};
    var scope = resolveElement(scopeNode);
    var searchRoot = scope instanceof HTMLElement ? scope : document;
    var scaffolds = [];
    var roots = [];
    Array.prototype.slice.call(searchRoot.querySelectorAll(".o_breadcrumb, ol.breadcrumb")).forEach(function (candidate) {
      if (!(candidate instanceof HTMLElement)) {
        return;
      }
      var canonicalRoot = resolveBreadcrumbRoot(candidate);
      if (!(canonicalRoot instanceof HTMLElement)) {
        return;
      }
      if (roots.indexOf(canonicalRoot) !== -1) {
        return;
      }
      roots.push(canonicalRoot);
    });
    if (scope instanceof HTMLElement && (scope.matches(".o_breadcrumb") || scope.matches("ol.breadcrumb"))) {
      var scopeRoot = resolveBreadcrumbRoot(scope);
      if (scopeRoot instanceof HTMLElement && roots.indexOf(scopeRoot) === -1) {
        roots.push(scopeRoot);
      }
    }
    if (!roots.length) {
      var fallbackRoot = resolveBreadcrumbRoot(settings.rootNode || settings.root || settings.breadcrumbContainer);
      if (fallbackRoot instanceof HTMLElement) {
        roots.push(fallbackRoot);
      }
    }
    roots.forEach(function (rootNode) {
      var scaffold = ensureBreadcrumbListScaffold(Object.assign({}, settings, {
        rootNode: rootNode,
      }));
      if (
        scaffold &&
        scaffold.rootNode instanceof HTMLElement &&
        scaffold.listNode instanceof HTMLElement &&
        scaffolds.indexOf(scaffold) === -1
      ) {
        scaffolds.push(scaffold);
      }
    });
    return scaffolds;
  }

  function reconcileOrderedChildren(parentNode, desiredChildren) {
    if (!(parentNode instanceof HTMLElement)) {
      return;
    }
    var children = Array.isArray(desiredChildren) ? desiredChildren : [];
    children.forEach(function (child) {
      if (!(child instanceof HTMLElement)) {
        return;
      }
      if (child.parentElement !== parentNode) {
        parentNode.appendChild(child);
      }
    });
    children.forEach(function (child, index) {
      if (!(child instanceof HTMLElement)) {
        return;
      }
      if (parentNode.children[index] !== child) {
        parentNode.insertBefore(child, parentNode.children[index] || null);
      }
    });
    Array.prototype.slice.call(parentNode.children).forEach(function (child) {
      if (children.indexOf(child) === -1) {
        child.remove();
      }
    });
  }

  function installManagedAnchorNavigationBehavior(config) {
    var settings = config && typeof config === "object" ? config : {};
    var root = resolveElement(settings.rootNode || settings.root);
    if (!(root instanceof HTMLElement)) {
      return false;
    }
    var boundFlag = String(settings.boundFlag || "surfaceManagedLinksBound").trim();
    if (root.dataset[boundFlag] === "1") {
      return true;
    }
    root.dataset[boundFlag] = "1";
    var selector = String(settings.selector || "a").trim();
    root.addEventListener("click", function (event) {
      var link = event.target instanceof HTMLElement ? event.target.closest(selector) : null;
      if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) {
        return;
      }
      if (link.getAttribute("data-surface-breadcrumb-menu-activator") === "1") {
        return;
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) {
        return;
      }
      var href = "";
      if (typeof settings.getHref === "function") {
        try {
          href = String(settings.getHref(link, event, settings) || "").trim();
        } catch (_error) {
          href = "";
        }
      } else {
        href = String(link.getAttribute("href") || "").trim();
      }
      if (!href) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      try {
        window.location.assign(new URL(href, window.location.origin).toString());
      } catch (_error) {
        window.location.assign(href);
      }
    }, true);
    return true;
  }

  function isModalDismissTrigger(target) {
    var node = target instanceof HTMLElement ? target : null;
    return !!(
      node &&
      node.closest(
        ".modal .btn-close, .modal [data-bs-dismiss='modal'], .o_dialog .btn-close, .o_dialog .modal-footer .btn, .o_technical_modal .btn-close"
      )
    );
  }

  function cancelTransitionBreadcrumbSync(shellId) {
    var normalizedShellId = String(shellId || "").trim();
    if (!normalizedShellId) {
      return;
    }
    var frameId = transitionBreadcrumbFramesByShellId[normalizedShellId];
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
    delete transitionBreadcrumbFramesByShellId[normalizedShellId];
  }

  function ensureManagedCurrentBreadcrumbLabelNode(lastItem) {
    if (!(lastItem instanceof HTMLElement)) {
      return null;
    }
    var actionsNode = lastItem.querySelector(":scope > .o_control_panel_breadcrumbs_actions");
    if (!(actionsNode instanceof HTMLElement)) {
      actionsNode = lastItem.querySelector(".o_control_panel_breadcrumbs_actions");
    }
    if (actionsNode instanceof HTMLElement && actionsNode.parentElement !== lastItem) {
      lastItem.appendChild(actionsNode);
    }
    var labelNode = lastItem.querySelector(":scope > [data-surface-breadcrumb-current-label='1']");
    Array.prototype.slice.call(lastItem.childNodes || []).forEach(function (childNode) {
      if (childNode === actionsNode || childNode === labelNode) {
        return;
      }
      if (childNode && childNode.parentNode === lastItem) {
        lastItem.removeChild(childNode);
      }
    });
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = document.createElement("span");
    }
    labelNode.className = "o_surface_breadcrumb_label min-w-0 text-truncate";
    labelNode.setAttribute("data-surface-breadcrumb-current-label", "1");
    if (actionsNode instanceof HTMLElement) {
      if (labelNode.parentElement !== lastItem || labelNode.nextSibling !== actionsNode) {
        lastItem.insertBefore(labelNode, actionsNode);
      }
      return labelNode;
    }
    if (labelNode.parentElement !== lastItem) {
      lastItem.appendChild(labelNode);
    }
    return labelNode;
  }

  function setBreadcrumbLabel(lastItem, label) {
    if (!(lastItem instanceof HTMLElement)) {
      return;
    }
    var normalizedLabel = String(label || "").replace(/\s+/g, " ").trim();
    var labelNode = ensureManagedCurrentBreadcrumbLabelNode(lastItem);
    if (labelNode instanceof HTMLElement) {
      labelNode.textContent = normalizedLabel;
      return;
    }
    lastItem.textContent = normalizedLabel;
  }

  function syncCurrentBreadcrumbMetadata(lastItem, entry) {
    if (!(lastItem instanceof HTMLElement)) {
      return;
    }
    var normalizedEntry = normalizeBreadcrumbEntry(entry);
    if (normalizedEntry.key) {
      lastItem.dataset.surfaceBreadcrumbKey = normalizedEntry.key;
    } else {
      delete lastItem.dataset.surfaceBreadcrumbKey;
    }
    if (normalizedEntry.workspaceHint) {
      lastItem.dataset.surfaceBreadcrumbHint = normalizedEntry.workspaceHint;
    } else {
      delete lastItem.dataset.surfaceBreadcrumbHint;
    }
    if (normalizedEntry.home) {
      lastItem.dataset.surfaceBreadcrumbHomeItem = "1";
    } else {
      delete lastItem.dataset.surfaceBreadcrumbHomeItem;
    }
  }

  function ensureLastBreadcrumbItem(root) {
    if (!(root instanceof HTMLElement)) {
      return null;
    }
    var lastItem = root.querySelector(".o_last_breadcrumb_item");
    if (lastItem instanceof HTMLElement) {
      return lastItem;
    }
    lastItem = document.createElement(root.matches("ol.breadcrumb") ? "li" : "div");
    lastItem.className = "o_last_breadcrumb_item active d-flex min-w-0 align-items-center";
    var textNode = document.createElement("span");
    textNode.className = "o_surface_breadcrumb_label min-w-0 text-truncate";
    textNode.setAttribute("data-surface-breadcrumb-current-label", "1");
    lastItem.appendChild(textNode);
    root.appendChild(lastItem);
    return lastItem;
  }

  function clearSyntheticBreadcrumbItems(root) {
    if (!(root instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(root.querySelectorAll("[data-surface-breadcrumb-synthetic='1']")).forEach(function (node) {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    });
  }

  function normalizeBreadcrumbLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeBreadcrumbKey(value) {
    var rawValue = String(value || "").trim();
    if (!rawValue) {
      return "";
    }
    return rawValue
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._:/-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  function resolveBreadcrumbEntryKey(item) {
    if (!(item && typeof item === "object" && !Array.isArray(item))) {
      return "";
    }
    var explicitKey = normalizeBreadcrumbKey(item.key || "");
    if (explicitKey) {
      return explicitKey;
    }
    var workspaceHintKey = normalizeBreadcrumbKey(item.workspaceHint || "");
    if (workspaceHintKey) {
      return "hint:" + workspaceHintKey;
    }
    if (typeof item.action === "string" || typeof item.action === "number") {
      return "action:" + normalizeBreadcrumbKey(String(item.action));
    }
    var href = String(item.href || "").trim();
    if (href) {
      return "href:" + normalizeBreadcrumbKey(href);
    }
    return "";
  }

  function isHomeBreadcrumbEntry(entry) {
    var normalizedEntry = entry && typeof entry === "object" ? entry : {};
    if (normalizedEntry.home === true) {
      return true;
    }
    if (normalizeBreadcrumbKey(normalizedEntry.key || "") === "home") {
      return true;
    }
    return String(normalizedEntry.href || "").trim() === "/odoo";
  }

  function normalizeBreadcrumbEntry(item) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      var menuEntries = Array.isArray(item.menu) ? item.menu.map(normalizeBreadcrumbEntry).filter(function (entry) {
        return !!(entry && entry.label);
      }) : [];
      return {
        key: resolveBreadcrumbEntryKey(item),
        label: normalizeBreadcrumbLabel(item.label),
        href: String(item.href || "").trim(),
        action: item.action || null,
        target: String(item.target || "").trim(),
        workspaceHint: String(item.workspaceHint || "").trim(),
        home: item.home === true || isHomeBreadcrumbEntry(item),
        current: !!item.current,
        menu: menuEntries,
      };
    }
    return {
      key: "",
      label: normalizeBreadcrumbLabel(item),
      href: "",
      action: null,
      target: "",
      workspaceHint: "",
      home: false,
      current: false,
      menu: [],
    };
  }

  function resolveCanonicalBreadcrumbModel(config) {
    var settings = config && typeof config === "object" ? config : {};
    var explicitLabel = normalizeBreadcrumbLabel(settings.label);
    var entries = (Array.isArray(settings.items) ? settings.items : []).map(normalizeBreadcrumbEntry).filter(function (entry) {
      return !!(entry && entry.label);
    });
    var currentEntry = null;
    entries.forEach(function (entry) {
      if (entry.current) {
        currentEntry = entry;
      }
    });
    return {
      label: explicitLabel || (currentEntry ? currentEntry.label : ""),
      items: entries.filter(function (entry) {
        return !entry.current;
      }),
      current: currentEntry,
    };
  }

  function createBreadcrumbLabelNode(entry, className) {
    var normalizedEntry = normalizeBreadcrumbEntry(entry);
    if (!normalizedEntry.label) {
      return null;
    }
    var node = normalizedEntry.href
      ? document.createElement("a")
      : document.createElement("span");
    node.className = String(className || "min-w-0 text-truncate").trim();
    node.textContent = normalizedEntry.label;
    if (normalizedEntry.key) {
      node.dataset.surfaceBreadcrumbKey = normalizedEntry.key;
    }
    if (normalizedEntry.workspaceHint) {
      node.dataset.surfaceBreadcrumbHint = normalizedEntry.workspaceHint;
    }
    if (normalizedEntry.home) {
      node.dataset.surfaceBreadcrumbHome = "1";
      node.setAttribute("aria-label", "Home");
      node.title = "Home";
    }
    if (node instanceof HTMLAnchorElement) {
      node.href = normalizedEntry.href;
      node.setAttribute("data-surface-breadcrumb-link", "1");
      node.classList.add("o_surface_breadcrumb_link");
      if (normalizedEntry.target) {
        node.target = normalizedEntry.target;
        if (normalizedEntry.target === "_blank") {
          node.rel = "noopener noreferrer";
        }
      }
      if (normalizedEntry.action != null) {
        node.__surfaceBreadcrumbAction = normalizedEntry.action;
      }
    }
    return node;
  }

  function createBreadcrumbMenuToggle(_label, direction) {
    var normalizedDirection = String(direction || "down").trim().toLowerCase() === "right"
      ? "right"
      : "down";
    var toggleNode = document.createElement("button");
    toggleNode.type = "button";
    toggleNode.className =
      "o_surface_breadcrumb_menu_toggle btn btn-link btn-sm p-0 border-0 shadow-none text-decoration-none o_surface_breadcrumb_menu_toggle--" +
      normalizedDirection;
    toggleNode.setAttribute("data-surface-breadcrumb-menu-toggle", "1");
    toggleNode.setAttribute("aria-expanded", "false");
    toggleNode.setAttribute("aria-haspopup", "menu");
    toggleNode.setAttribute("aria-label", "Abrir submenu");
    toggleNode.setAttribute("data-surface-breadcrumb-menu-direction", normalizedDirection);
    toggleNode.textContent = normalizedDirection === "right" ? "\u203A" : "\u25BE";
    return toggleNode;
  }

  function isBreadcrumbMenuActivator(node) {
    return !!(
      node instanceof HTMLElement &&
      node.getAttribute("data-surface-breadcrumb-menu-activator") === "1"
    );
  }

  function getDirectBreadcrumbMenu(node) {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    return Array.prototype.slice.call(node.children || []).find(function (child) {
      return child instanceof HTMLElement && child.getAttribute("data-surface-breadcrumb-menu") === "1";
    }) || null;
  }

  function getBreadcrumbMenuToggle(node) {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    return node.querySelector("[data-surface-breadcrumb-menu-toggle='1']");
  }

  function setBreadcrumbMenuVisibility(menuNode, visible) {
    if (!(menuNode instanceof HTMLElement)) {
      return;
    }
    menuNode.hidden = !visible;
    menuNode.style.display = visible ? "block" : "none";
    menuNode.classList.toggle("show", !!visible);
    menuNode.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function hideBreadcrumbMenuBranch(branchNode) {
    if (!(branchNode instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(branchNode.querySelectorAll("[data-surface-breadcrumb-menu-branch='1']")).forEach(function (childBranch) {
      if (childBranch instanceof HTMLElement && childBranch !== branchNode) {
        hideBreadcrumbMenuBranch(childBranch);
      }
    });
    branchNode.classList.remove("show");
    branchNode.removeAttribute("data-surface-breadcrumb-menu-open");
    var menuNode = getDirectBreadcrumbMenu(branchNode);
    if (menuNode instanceof HTMLElement) {
      setBreadcrumbMenuVisibility(menuNode, false);
    }
    var toggleNode = getBreadcrumbMenuToggle(branchNode);
    if (toggleNode instanceof HTMLElement) {
      toggleNode.setAttribute("aria-expanded", "false");
    }
  }

  function hideAllBreadcrumbMenus(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(rootNode.querySelectorAll("[data-surface-breadcrumb-menu-branch='1'].show")).forEach(function (branchNode) {
      if (branchNode instanceof HTMLElement) {
        hideBreadcrumbMenuBranch(branchNode);
      }
    });
  }

  function cancelBreadcrumbMenuHide(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    if (rootNode._surfaceBreadcrumbHideTimer) {
      window.clearTimeout(rootNode._surfaceBreadcrumbHideTimer);
      rootNode._surfaceBreadcrumbHideTimer = 0;
    }
  }

  function scheduleBreadcrumbMenuHide(rootNode, delayMs) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    cancelBreadcrumbMenuHide(rootNode);
    rootNode._surfaceBreadcrumbHideTimer = window.setTimeout(function () {
      rootNode._surfaceBreadcrumbHideTimer = 0;
      hideAllBreadcrumbMenus(rootNode);
    }, Math.max(Number(delayMs || 0) || 0, 0));
  }

  function closeSiblingBreadcrumbMenuBranches(branchNode) {
    if (!(branchNode instanceof HTMLElement) || !(branchNode.parentElement instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(branchNode.parentElement.children || []).forEach(function (siblingNode) {
      if (
        siblingNode instanceof HTMLElement &&
        siblingNode !== branchNode &&
        siblingNode.getAttribute("data-surface-breadcrumb-menu-branch") === "1"
      ) {
        hideBreadcrumbMenuBranch(siblingNode);
      }
    });
  }

  function showBreadcrumbMenuBranch(branchNode) {
    if (!(branchNode instanceof HTMLElement)) {
      return;
    }
    var menuNode = getDirectBreadcrumbMenu(branchNode);
    if (!(menuNode instanceof HTMLElement)) {
      return;
    }
    closeSiblingBreadcrumbMenuBranches(branchNode);
    branchNode.classList.add("show");
    branchNode.setAttribute("data-surface-breadcrumb-menu-open", "1");
    setBreadcrumbMenuVisibility(menuNode, true);
    var toggleNode = getBreadcrumbMenuToggle(branchNode);
    if (toggleNode instanceof HTMLElement) {
      toggleNode.setAttribute("aria-expanded", "true");
    }
  }

  function resolveBreadcrumbBranchTarget(rootNode, eventTarget) {
    if (!(rootNode instanceof HTMLElement) || !(eventTarget instanceof HTMLElement)) {
      return null;
    }
    var branchNode = eventTarget.closest("[data-surface-breadcrumb-menu-branch='1']");
    if (!(branchNode instanceof HTMLElement) || !rootNode.contains(branchNode)) {
      return null;
    }
    return branchNode;
  }

  function installManagedBreadcrumbMenuBehavior(config) {
    var settings = config && typeof config === "object" ? config : {};
    var rootNode = resolveElement(settings.rootNode || settings.root);
    if (!(rootNode instanceof HTMLElement)) {
      return false;
    }
    if (rootNode.dataset.surfaceBreadcrumbMenusBound === "1") {
      return true;
    }
    rootNode.dataset.surfaceBreadcrumbMenusBound = "1";
    rootNode.addEventListener("mouseover", function (event) {
      cancelBreadcrumbMenuHide(rootNode);
      var branchNode = resolveBreadcrumbBranchTarget(rootNode, event.target instanceof HTMLElement ? event.target : null);
      if (!(branchNode instanceof HTMLElement)) {
        return;
      }
      showBreadcrumbMenuBranch(branchNode);
    });
    rootNode.addEventListener("mouseleave", function (event) {
      var relatedTarget = event && event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (relatedTarget && rootNode.contains(relatedTarget)) {
        return;
      }
      cancelBreadcrumbMenuHide(rootNode);
    });
    rootNode.addEventListener("click", function (event) {
      cancelBreadcrumbMenuHide(rootNode);
      var toggleNode = event.target instanceof HTMLElement
        ? event.target.closest("[data-surface-breadcrumb-menu-toggle='1']")
        : null;
      var activatorNode = event.target instanceof HTMLElement
        ? event.target.closest("[data-surface-breadcrumb-menu-activator='1']")
        : null;
      var interactiveNode = toggleNode instanceof HTMLElement
        ? toggleNode
        : (isBreadcrumbMenuActivator(activatorNode) ? activatorNode : null);
      if (!(interactiveNode instanceof HTMLElement) || !rootNode.contains(interactiveNode)) {
        var insideMenu = event.target instanceof HTMLElement
          ? event.target.closest("[data-surface-breadcrumb-menu='1']")
          : null;
        if (!(insideMenu instanceof HTMLElement)) {
          hideAllBreadcrumbMenus(rootNode);
        }
        return;
      }
      var branchNode = interactiveNode.closest("[data-surface-breadcrumb-menu-branch='1']");
      if (!(branchNode instanceof HTMLElement)) {
        return;
      }
      var menuNode = getDirectBreadcrumbMenu(branchNode);
      if (!(menuNode instanceof HTMLElement)) {
        return;
      }
      if (interactiveNode !== toggleNode && interactiveNode.matches("a[href]")) {
        event.preventDefault();
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      if (menuNode.classList.contains("show")) {
        if (interactiveNode !== toggleNode) {
          showBreadcrumbMenuBranch(branchNode);
          return;
        }
        hideBreadcrumbMenuBranch(branchNode);
        return;
      }
      showBreadcrumbMenuBranch(branchNode);
    }, true);
    rootNode.addEventListener("focusin", function (event) {
      cancelBreadcrumbMenuHide(rootNode);
      var branchNode = resolveBreadcrumbBranchTarget(rootNode, event.target instanceof HTMLElement ? event.target : null);
      if (!(branchNode instanceof HTMLElement)) {
        return;
      }
      showBreadcrumbMenuBranch(branchNode);
    });
    rootNode.addEventListener("focusout", function () {
      cancelBreadcrumbMenuHide(rootNode);
    });
    rootNode.addEventListener("keydown", function (event) {
      var branchNode = event.target instanceof HTMLElement
        ? event.target.closest("[data-surface-breadcrumb-menu-branch='1']")
        : null;
      if (!(branchNode instanceof HTMLElement) || !rootNode.contains(branchNode)) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hideBreadcrumbMenuBranch(branchNode);
        var branchToggle = getBreadcrumbMenuToggle(branchNode);
        if (branchToggle instanceof HTMLElement && typeof branchToggle.focus === "function") {
          branchToggle.focus();
        }
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        var branchMenu = getDirectBreadcrumbMenu(branchNode);
        if (!(branchMenu instanceof HTMLElement)) {
          return;
        }
        event.preventDefault();
        showBreadcrumbMenuBranch(branchNode);
        var firstMenuItem = branchMenu.querySelector("[data-surface-breadcrumb-link='1'], [data-surface-breadcrumb-menu-toggle='1'], [role='menuitem']");
        if (firstMenuItem instanceof HTMLElement && typeof firstMenuItem.focus === "function") {
          firstMenuItem.focus();
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        var parentBranch = branchNode.parentElement instanceof HTMLElement
          ? branchNode.parentElement.closest("[data-surface-breadcrumb-menu-branch='1']")
          : null;
        if (!(parentBranch instanceof HTMLElement)) {
          return;
        }
        event.preventDefault();
        hideBreadcrumbMenuBranch(branchNode);
        var parentToggle = getBreadcrumbMenuToggle(parentBranch);
        if (parentToggle instanceof HTMLElement && typeof parentToggle.focus === "function") {
          parentToggle.focus();
        }
      }
    });
    document.addEventListener("pointerdown", function (event) {
      if (!(event.target instanceof Node) || rootNode.contains(event.target)) {
        return;
      }
      cancelBreadcrumbMenuHide(rootNode);
      hideAllBreadcrumbMenus(rootNode);
    }, true);
    document.addEventListener("mouseover", function (event) {
      var branchNode = resolveBreadcrumbBranchTarget(rootNode, event.target instanceof HTMLElement ? event.target : null);
      if (!(branchNode instanceof HTMLElement)) {
        return;
      }
      cancelBreadcrumbMenuHide(rootNode);
      showBreadcrumbMenuBranch(branchNode);
    }, true);
    return true;
  }

  function buildBreadcrumbMenu(menuEntries, level) {
    var entries = (Array.isArray(menuEntries) ? menuEntries : []).map(normalizeBreadcrumbEntry).filter(function (entry) {
      return !!(entry && entry.label);
    });
    if (!entries.length) {
      return null;
    }
    var normalizedLevel = Math.max(Number(level || 0) || 0, 0);
    var menuNode = document.createElement("div");
    menuNode.className = "o_surface_breadcrumb_menu o_surface_breadcrumb_menu--level-" + String(normalizedLevel);
    menuNode.setAttribute("data-surface-breadcrumb-synthetic", "1");
    menuNode.setAttribute("data-surface-breadcrumb-menu", "1");
    menuNode.setAttribute("data-surface-breadcrumb-menu-level", String(normalizedLevel));
    menuNode.setAttribute("role", "menu");
    menuNode.style.position = "absolute";
    menuNode.style.left = normalizedLevel > 0 ? "calc(100% + 0.18rem)" : "0";
    menuNode.style.top = normalizedLevel > 0 ? "-0.22rem" : "calc(100% - 0.14rem)";
    menuNode.style.zIndex = String(1050 + normalizedLevel);
    setBreadcrumbMenuVisibility(menuNode, false);
    entries.forEach(function (entry) {
      var branchNode = document.createElement("div");
      branchNode.className = "o_surface_breadcrumb_menu_branch position-relative";
      branchNode.setAttribute("data-surface-breadcrumb-synthetic", "1");
      branchNode.setAttribute("data-surface-breadcrumb-menu-branch", "1");
      branchNode.setAttribute("data-surface-breadcrumb-menu-level", String(normalizedLevel + 1));
      branchNode.style.position = "relative";
      if (entry.key) {
        branchNode.dataset.surfaceBreadcrumbKey = entry.key;
      }
      if (entry.menu.length) {
        branchNode.dataset.surfaceBreadcrumbHasMenu = "1";
      }
      var entryContainerNode = document.createElement("div");
      entryContainerNode.className = "o_surface_breadcrumb_menu_entry";
      var entryNode = entry.href
        ? document.createElement("a")
        : document.createElement("button");
      if (entryNode instanceof HTMLAnchorElement) {
        entryNode.href = entry.href;
        entryNode.setAttribute("data-surface-breadcrumb-link", "1");
        if (entry.key) {
          entryNode.dataset.surfaceBreadcrumbKey = entry.key;
        }
        if (entry.workspaceHint) {
          entryNode.dataset.surfaceBreadcrumbHint = entry.workspaceHint;
        }
        if (entry.action != null) {
          entryNode.__surfaceBreadcrumbAction = entry.action;
        }
      }
      if (entryNode instanceof HTMLButtonElement) {
        entryNode.type = "button";
      }
      entryNode.className = "d-inline-flex align-items-center gap-2 o_surface_breadcrumb_menu_link";
      entryNode.setAttribute("role", "menuitem");
      if (entry.current) {
        entryNode.classList.add("active");
      }
      var textNode = document.createElement("span");
      textNode.className = "o_surface_breadcrumb_menu_text min-w-0 text-truncate";
      textNode.textContent = entry.label;
      entryNode.appendChild(textNode);
      entryContainerNode.appendChild(entryNode);
      if (entry.menu.length && entryNode instanceof HTMLButtonElement) {
        entryNode.setAttribute("data-surface-breadcrumb-menu-activator", "1");
      }
      if (entry.menu.length) {
        entryContainerNode.appendChild(createBreadcrumbMenuToggle(entry.label, "right"));
      }
      branchNode.appendChild(entryContainerNode);
      if (entry.menu.length) {
        var childMenuNode = buildBreadcrumbMenu(entry.menu, normalizedLevel + 1);
        if (childMenuNode instanceof HTMLElement) {
          branchNode.appendChild(childMenuNode);
        }
      }
      menuNode.appendChild(branchNode);
    });
    return menuNode;
  }

  function buildSyntheticBreadcrumbItems(root, items) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }
    var tagName = root.matches("ol.breadcrumb") ? "li" : "div";
    return (Array.isArray(items) ? items : []).map(function (item) {
      var entry = normalizeBreadcrumbEntry(item);
      if (!entry.label) {
        return null;
      }
      var node = document.createElement(tagName);
      node.className = "o_surface_breadcrumb_item d-flex min-w-0 align-items-center";
      node.setAttribute("data-surface-breadcrumb-synthetic", "1");
      var contentNode = document.createElement("span");
      contentNode.className = "o_surface_breadcrumb_content d-inline-flex min-w-0 align-items-center gap-1";
      if (entry.menu.length) {
        node.dataset.surfaceBreadcrumbHasMenu = "1";
        node.setAttribute("data-surface-breadcrumb-menu-branch", "1");
        node.setAttribute("data-surface-breadcrumb-menu-level", "0");
        node.style.position = "relative";
      }
      if (entry.key) {
        node.dataset.surfaceBreadcrumbKey = entry.key;
      }
      if (entry.workspaceHint) {
        node.dataset.surfaceBreadcrumbHint = entry.workspaceHint;
      }
      var labelNode = createBreadcrumbLabelNode(entry, "o_surface_breadcrumb_label min-w-0 text-truncate");
      if (labelNode instanceof HTMLElement) {
        if (labelNode.dataset.surfaceBreadcrumbHome === "1") {
          node.dataset.surfaceBreadcrumbHomeItem = "1";
        }
        if (labelNode instanceof HTMLAnchorElement) {
          labelNode.classList.add("o_surface_breadcrumb_link");
        }
        contentNode.appendChild(labelNode);
      }
      if (entry.menu.length) {
        if (labelNode instanceof HTMLButtonElement) {
          labelNode.setAttribute("data-surface-breadcrumb-menu-activator", "1");
        }
        contentNode.appendChild(createBreadcrumbMenuToggle(entry.label, "down"));
      }
      node.appendChild(contentNode);
      if (entry.menu.length) {
        var menuNode = buildBreadcrumbMenu(entry.menu, 0);
        if (menuNode instanceof HTMLElement) {
          node.appendChild(menuNode);
        }
      }
      return node;
    }).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  function normalizeBreadcrumbItemPresentation(node, isLast) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    node.className = isLast
      ? "o_last_breadcrumb_item o_surface_breadcrumb_item o_surface_breadcrumb_item--current active d-flex min-w-0 align-items-center"
      : "o_surface_breadcrumb_item d-flex min-w-0 align-items-center";
  }

  function getBreadcrumbLabelText(root) {
    if (!(root instanceof HTMLElement)) {
      return "";
    }
    var searchRoot = root.matches("ol.breadcrumb")
      ? root
      : root.querySelector("ol.breadcrumb") || root;
    var lastItem = searchRoot.querySelector(".o_last_breadcrumb_item");
    return lastItem instanceof HTMLElement ? String(lastItem.textContent || "").trim() : "";
  }

  function restoreTransitionBreadcrumbGuard(config) {
    var settings = config && typeof config === "object" ? config : {};
    var guardAttr = String(settings.transitionHiddenAttr || "data-surface-transition-breadcrumb-hidden").trim();
    Array.prototype.slice.call(document.querySelectorAll("[" + guardAttr + "='1']")).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      node.style.removeProperty("visibility");
      node.removeAttribute(guardAttr);
    });
  }

  function syncTransitionBreadcrumbGuard(config) {
    var settings = config && typeof config === "object" ? config : {};
    var controlPanel = resolveElement(settings.controlPanel);
    var model = resolveCanonicalBreadcrumbModel(settings);
    var label = String(model.label || "").trim();
    var guardAttr = String(settings.transitionHiddenAttr || "data-surface-transition-breadcrumb-hidden").trim();
    var shell = getTransitionShell(settings);
    if (!(controlPanel instanceof HTMLElement) || !label) {
      restoreTransitionBreadcrumbGuard(settings);
      return;
    }
    var shouldGuardMismatch =
      shell instanceof HTMLElement &&
      !shell.hidden;
    collectCanonicalBreadcrumbScaffolds(controlPanel, settings).forEach(function (scaffold) {
      if (!(scaffold && scaffold.rootNode instanceof HTMLElement)) {
        return;
      }
      var root = scaffold.rootNode;
      var listNode = scaffold.listNode instanceof HTMLElement ? scaffold.listNode : root;
      var currentLabel = getBreadcrumbLabelText(root);
      if (shouldGuardMismatch && currentLabel && currentLabel !== label) {
        root.style.visibility = "hidden";
        root.setAttribute(guardAttr, "1");
        return;
      }
      listNode.style.removeProperty("visibility");
      listNode.removeAttribute(guardAttr);
      root.style.removeProperty("visibility");
      root.removeAttribute(guardAttr);
    });
  }

  function restoreCanonicalBreadcrumb(config) {
    var settings = config && typeof config === "object" ? config : {};
    var hiddenAttr = String(settings.hiddenAttr || "data-surface-breadcrumb-hidden").trim();
    Array.prototype.slice.call(document.querySelectorAll(".o_last_breadcrumb_item[data-surface-breadcrumb-original-label]")).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      setBreadcrumbLabel(node, String(node.dataset.surfaceBreadcrumbOriginalLabel || "").trim());
      delete node.dataset.surfaceBreadcrumbOriginalLabel;
    });
    collectCanonicalBreadcrumbScaffolds(null, settings).forEach(function (scaffold) {
      if (scaffold && scaffold.rootNode instanceof HTMLElement) {
        clearSyntheticBreadcrumbItems(scaffold.rootNode);
      }
    });
    Array.prototype.slice.call(document.querySelectorAll("[" + hiddenAttr + "='1']")).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      node.style.removeProperty("display");
      node.removeAttribute(hiddenAttr);
    });
  }

  function buildCanonicalBreadcrumbKeepMap(root, config) {
    var settings = config && typeof config === "object" ? config : {};
    var keepMap = new WeakMap();
    if (!(root instanceof HTMLElement)) {
      return keepMap;
    }
    var preserveAncestors = settings.preserveAncestors !== false;
    Array.prototype.slice.call(
      root.querySelectorAll(".o_last_breadcrumb_item, .o_control_panel_breadcrumbs_actions")
    ).forEach(function (node) {
      var current = node instanceof HTMLElement ? node : null;
      while (current && current !== root) {
        keepMap.set(current, true);
        if (!preserveAncestors && !current.classList.contains("o_control_panel_breadcrumbs_actions")) {
          break;
        }
        current = current.parentElement;
      }
    });
    return keepMap;
  }

  function reconcileCanonicalBreadcrumbListOrder(listNode, visibleChildren) {
    if (!(listNode instanceof HTMLElement)) {
      return;
    }
    var leadingChildren = (Array.isArray(visibleChildren) ? visibleChildren : []).filter(function (child) {
      return child instanceof HTMLElement;
    });
    if (!leadingChildren.length) {
      return;
    }
    var trailingChildren = Array.prototype.slice.call(listNode.children || []).filter(function (child) {
      return child instanceof HTMLElement && leadingChildren.indexOf(child) === -1;
    });
    reconcileOrderedChildren(listNode, leadingChildren.concat(trailingChildren));
  }

  function syncLeadingBreadcrumbItem(listNode) {
    if (!(listNode instanceof HTMLElement)) {
      return;
    }
    Array.prototype.slice.call(listNode.children || []).forEach(function (child) {
      if (child instanceof HTMLElement) {
        child.removeAttribute("data-surface-breadcrumb-leading-item");
      }
    });
    var firstVisibleItem = Array.prototype.slice.call(listNode.children || []).find(function (child) {
      if (!(child instanceof HTMLElement)) {
        return false;
      }
      if (
        child.getAttribute("data-surface-breadcrumb-hidden") === "1" ||
        child.getAttribute("data-surface-transition-breadcrumb-hidden") === "1"
      ) {
        return false;
      }
      var styles = window.getComputedStyle(child);
      if (styles.display === "none" || styles.visibility === "hidden") {
        return false;
      }
      return (
        child.classList.contains("o_surface_breadcrumb_item") ||
        child.classList.contains("o_last_breadcrumb_item") ||
        child.classList.contains("breadcrumb-item")
      );
    });
    if (firstVisibleItem instanceof HTMLElement) {
      firstVisibleItem.setAttribute("data-surface-breadcrumb-leading-item", "1");
    }
  }

  function syncCanonicalBreadcrumb(config) {
    var settings = config && typeof config === "object" ? config : {};
    var controlPanel = resolveElement(settings.controlPanel);
    var model = resolveCanonicalBreadcrumbModel(settings);
    var label = String(model.label || "").trim();
    var items = Array.isArray(model.items) ? model.items : [];
    var hiddenAttr = String(settings.hiddenAttr || "data-surface-breadcrumb-hidden").trim();
    if (!(controlPanel instanceof HTMLElement) || !label) {
      return;
    }
    collectCanonicalBreadcrumbScaffolds(controlPanel, settings).forEach(function (scaffold) {
      if (!scaffold || !(scaffold.rootNode instanceof HTMLElement) || !(scaffold.listNode instanceof HTMLElement)) {
        return;
      }
      var root = scaffold.rootNode;
      var listNode = scaffold.listNode;
      var actionsNode = scaffold.actionsNode;
      clearSyntheticBreadcrumbItems(root);
      var lastItem = ensureLastBreadcrumbItem(listNode);
      if (!(lastItem instanceof HTMLElement)) {
        return;
      }
      normalizeBreadcrumbItemPresentation(lastItem, true);
      if (!String(lastItem.dataset.surfaceBreadcrumbOriginalLabel || "").trim()) {
        lastItem.dataset.surfaceBreadcrumbOriginalLabel = getBreadcrumbLabelText(listNode) || label;
      }
      var syntheticItems = buildSyntheticBreadcrumbItems(listNode, items);
      syntheticItems.forEach(function (node) {
        normalizeBreadcrumbItemPresentation(node, false);
      });
      syntheticItems.forEach(function (node) {
        listNode.insertBefore(node, lastItem);
      });
      setBreadcrumbLabel(lastItem, label);
      syncCurrentBreadcrumbMetadata(lastItem, model.current);
      Array.prototype.slice.call(listNode.children || []).forEach(function (child) {
        if (!(child instanceof HTMLElement)) {
          return;
        }
        var keepVisible = child === lastItem || syntheticItems.indexOf(child) !== -1;
        if (keepVisible) {
          child.style.removeProperty("display");
          child.removeAttribute(hiddenAttr);
          return;
        }
        child.style.display = "none";
        child.setAttribute(hiddenAttr, "1");
      });
      reconcileCanonicalBreadcrumbListOrder(listNode, syntheticItems.concat([lastItem]));
      syncLeadingBreadcrumbItem(listNode);
      if (root !== listNode) {
        Array.prototype.slice.call(root.children || []).forEach(function (child) {
          if (!(child instanceof HTMLElement)) {
            return;
          }
          var keepVisible = child === listNode || child === actionsNode;
          if (keepVisible) {
            child.style.removeProperty("display");
            child.removeAttribute(hiddenAttr);
            return;
          }
          child.style.display = "none";
          child.setAttribute(hiddenAttr, "1");
        });
      }
      installManagedBreadcrumbMenuBehavior({
        rootNode: root,
      });
    });
  }

  function scheduleTransitionBreadcrumbSync(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shellId = String(settings.shellId || "").trim();
    var model = resolveCanonicalBreadcrumbModel(settings);
    var label = String(model.label || "").trim();
    if (!shellId || !label) {
      return;
    }
    cancelTransitionBreadcrumbSync(shellId);
    syncCanonicalBreadcrumb(settings);
    syncTransitionBreadcrumbGuard(settings);
    var durationMs = Math.max(Number(settings.transitionBreadcrumbMs || 0) || 0, 0);
    if (!durationMs) {
      return;
    }
    var deadline = Date.now() + durationMs;
    var tick = function () {
      var shell = document.getElementById(shellId);
      if (!(shell instanceof HTMLElement) || shell.hidden) {
        cancelTransitionBreadcrumbSync(shellId);
        restoreTransitionBreadcrumbGuard(settings);
        return;
      }
      syncTransitionBreadcrumbGuard(settings);
      syncCanonicalBreadcrumb(settings);
      syncTransitionBreadcrumbGuard(settings);
      if (Date.now() >= deadline) {
        cancelTransitionBreadcrumbSync(shellId);
        restoreTransitionBreadcrumbGuard(settings);
        return;
      }
      transitionBreadcrumbFramesByShellId[shellId] = window.requestAnimationFrame(tick);
    };
    transitionBreadcrumbFramesByShellId[shellId] = window.requestAnimationFrame(tick);
  }

  function clearTransientFramePump(handle) {
    var target = handle && typeof handle === "object" ? handle : null;
    if (!target) {
      return target;
    }
    (Array.isArray(target.timers) ? target.timers : []).forEach(function (timerId) {
      window.clearTimeout(timerId);
    });
    target.timers = [];
    if (target.frameId) {
      window.cancelAnimationFrame(target.frameId);
      target.frameId = 0;
    }
    return target;
  }

  function scheduleTransientFramePump(config) {
    var settings = config && typeof config === "object" ? config : {};
    var handle = clearTransientFramePump(settings.handle || { timers: [], frameId: 0 }) || {
      timers: [],
      frameId: 0,
    };
    var onTick = typeof settings.onTick === "function" ? settings.onTick : null;
    if (!onTick) {
      return handle;
    }
    var durationMs = Math.max(Number(settings.durationMs || 0) || 0, 0);
    var deadline = Date.now() + durationMs;
    var timerDelays = Array.isArray(settings.timerDelays) ? settings.timerDelays : [];

    function runTick() {
      try {
        onTick(handle, settings);
      } catch (_error) {}
    }

    function pumpFrames() {
      runTick();
      if (Date.now() >= deadline) {
        handle.frameId = 0;
        return;
      }
      handle.frameId = window.requestAnimationFrame(pumpFrames);
    }

    runTick();
    if (durationMs > 0) {
      handle.frameId = window.requestAnimationFrame(pumpFrames);
    }
    timerDelays.forEach(function (delay) {
      var timerId = window.setTimeout(runTick, Math.max(Number(delay || 0) || 0, 0));
      handle.timers.push(timerId);
    });
    return handle;
  }

  Object.assign(surfaceLayerApi, {
    isModalRootNode: isModalRootNode,
    isModalOnlyMutation: isModalOnlyMutation,
    hasOpenModal: hasOpenModal,
    isModalDismissTrigger: isModalDismissTrigger,
    clearTransientFramePump: clearTransientFramePump,
    scheduleTransientFramePump: scheduleTransientFramePump,
    resolveBreadcrumbRoot: resolveBreadcrumbRoot,
    ensureBreadcrumbListScaffold: ensureBreadcrumbListScaffold,
    reconcileOrderedChildren: reconcileOrderedChildren,
    installManagedAnchorNavigationBehavior: installManagedAnchorNavigationBehavior,
    syncCanonicalBreadcrumb: syncCanonicalBreadcrumb,
    restoreCanonicalBreadcrumb: restoreCanonicalBreadcrumb,
    scheduleTransitionBreadcrumbSync: scheduleTransitionBreadcrumbSync,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
