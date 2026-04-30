(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var resolveElement = surfaceLayerApi.resolveElement;
  var escapeHtml = surfaceLayerApi.escapeHtml;
  var toDataAttributeName = surfaceLayerApi.toDataAttributeName;
  var SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS = "o_surface_topbar_breadcrumb_host";

  function buildEscapedDataAttributes(attributeMap) {
    if (!(attributeMap && typeof attributeMap === "object")) {
      return "";
    }
    return Object.keys(attributeMap).reduce(function (markup, attributeName) {
      var normalizedName = String(attributeName || "").trim();
      if (!normalizedName) {
        return markup;
      }
      var rawValue = attributeMap[normalizedName];
      if (rawValue == null || rawValue === false) {
        return markup;
      }
      return markup + ' ' + normalizedName + '="' + escapeHtml(String(rawValue)) + '"';
    }, "");
  }

  function buildSurfaceFilterControlAttributes(filterKey) {
    var normalizedKey = String(filterKey || "").trim();
    if (!normalizedKey) {
      return "";
    }
    return buildEscapedDataAttributes({
      "data-surface-filter": normalizedKey,
      "data-surface-toolbar-control": "filter",
      "data-surface-intent": "filter",
      "data-surface-filter-key": normalizedKey,
      "data-surface-nav": "filter",
    });
  }

  function buildSurfaceTabControlAttributes(tabKey, level, isActive) {
    var normalizedKey = String(tabKey || "").trim();
    if (!normalizedKey) {
      return "";
    }
    var normalizedLevel = String(level || "primary").trim().toLowerCase() === "secondary"
      ? "secondary"
      : "primary";
    return buildEscapedDataAttributes({
      "data-surface-tab": "1",
      "data-surface-tab-key": normalizedKey,
      "data-surface-tab-level": normalizedLevel,
      "data-surface-tab-state": isActive ? "active" : "inactive",
      "data-surface-toolbar-control": "tab",
      "data-surface-intent": "tab",
      "data-surface-nav": "tab",
    });
  }

  function buildSurfaceTabListAttributes(level) {
    var normalizedLevel = String(level || "primary").trim().toLowerCase() === "secondary"
      ? "secondary"
      : "primary";
    return buildEscapedDataAttributes({
      "data-surface-tablist": "1",
      "data-surface-tablist-level": normalizedLevel,
    });
  }

  function isElementAfterReference(node, reference) {
    if (!(node instanceof HTMLElement) || !(reference instanceof HTMLElement)) {
      return false;
    }
    if (node.parentElement !== reference.parentElement) {
      return false;
    }
    return !!(reference.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function getTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shellId = String(settings.shellId || "").trim();
    if (!shellId) {
      return null;
    }
    var shell = document.getElementById(shellId);
    if (shell instanceof HTMLElement) {
      return shell;
    }
    shell = document.createElement(String(settings.tagName || "section").trim() || "section");
    shell.id = shellId;
    shell.className = String(settings.shellClassName || "o_surface_transition_shell").trim();
    shell.hidden = true;
    shell.setAttribute("aria-hidden", "true");
    shell.style.margin = "0";
    if (typeof settings.onClick === "function") {
      shell.addEventListener("click", settings.onClick, true);
    }
    document.body.appendChild(shell);
    return shell;
  }

  function getFootprintHeight(sourceNode) {
    var node = resolveElement(sourceNode);
    if (!(node instanceof HTMLElement)) {
      return 0;
    }
    var rect = node.getBoundingClientRect();
    var styles = window.getComputedStyle(node);
    return Math.ceil(
      rect.height +
      (parseFloat(styles.marginTop) || 0) +
      (parseFloat(styles.marginBottom) || 0)
    );
  }

  function isTransitionSourceInFlow(sourceNode) {
    var node = resolveElement(sourceNode);
    if (!(node instanceof HTMLElement) || !node.isConnected) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    return styles.display !== "none" && styles.position !== "fixed";
  }

  function syncTransitionReservation(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shell = getTransitionShell(settings);
    if (!(shell instanceof HTMLElement)) {
      return;
    }
    var liveNode = resolveElement(settings.liveNode);
    var sourceNode = resolveElement(settings.sourceNode);
    var reserveTarget = resolveElement(settings.reserveTarget || settings.reserveRoot);
    var shouldReserve =
      !shell.hidden &&
      !isTransitionSourceInFlow(liveNode || sourceNode);
    if (!(reserveTarget instanceof HTMLElement) || !shouldReserve) {
      if (reserveTarget instanceof HTMLElement) {
        reserveTarget.style.removeProperty("padding-top");
      }
      return;
    }
    var shellHeight = getFootprintHeight(liveNode) || getFootprintHeight(shell);
    if (!shellHeight) {
      if (reserveTarget instanceof HTMLElement) {
        reserveTarget.style.removeProperty("padding-top");
      }
      return;
    }
    reserveTarget.style.paddingTop = shellHeight + "px";
  }

  function syncTransitionInteractivity(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shell = getTransitionShell(settings);
    if (!(shell instanceof HTMLElement)) {
      return;
    }
    shell.style.pointerEvents = shell.hidden ? "none" : "auto";
  }

  function setTransitionSourceVisibility(config, hidden) {
    var settings = config && typeof config === "object" ? config : {};
    var sourceNode = resolveElement(settings.sourceNode || settings.liveNode);
    if (!(sourceNode instanceof HTMLElement)) {
      return;
    }
    if (hidden) {
      sourceNode.dataset.surfaceTransitionSourceHidden = "1";
      sourceNode.style.visibility = "hidden";
      sourceNode.style.pointerEvents = "none";
      return;
    }
    if (sourceNode.dataset.surfaceTransitionSourceHidden === "1") {
      delete sourceNode.dataset.surfaceTransitionSourceHidden;
    }
    sourceNode.style.removeProperty("visibility");
    sourceNode.style.removeProperty("pointer-events");
  }

  function syncTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shell = getTransitionShell(settings);
    var liveNode = resolveElement(settings.liveNode);
    if (!(shell instanceof HTMLElement) || !(liveNode instanceof HTMLElement)) {
      return null;
    }
    var liveRect = liveNode.getBoundingClientRect();
    shell.style.left = liveRect.left + "px";
    shell.style.top = liveRect.top + "px";
    shell.style.width = liveRect.width + "px";
    shell.style.height = liveRect.height + "px";
    shell.innerHTML = liveNode.innerHTML;
    syncTransitionReservation(settings);
    syncTransitionInteractivity(settings);
    setTransitionSourceVisibility(settings, !shell.hidden);
    return shell;
  }

  function showTransitionShell(config) {
    var shell = syncTransitionShell(config);
    if (!(shell instanceof HTMLElement)) {
      return null;
    }
    setTransitionSourceVisibility(config, true);
    shell.hidden = false;
    shell.setAttribute("aria-hidden", "false");
    syncTransitionInteractivity(config);
    return shell;
  }

  function hideTransitionShell(config) {
    var shell = getTransitionShell(config);
    if (!(shell instanceof HTMLElement)) {
      setTransitionSourceVisibility(config, false);
      return;
    }
    shell.hidden = true;
    shell.setAttribute("aria-hidden", "true");
    setTransitionSourceVisibility(config, false);
    syncTransitionInteractivity(config);
    syncTransitionReservation(config);
  }

  function clearTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var shell = getTransitionShell(settings);
    if (!(shell instanceof HTMLElement)) {
      setTransitionSourceVisibility(settings, false);
      return;
    }
    shell.hidden = true;
    shell.setAttribute("aria-hidden", "true");
    shell.innerHTML = "";
    setTransitionSourceVisibility(settings, false);
    syncTransitionInteractivity(settings);
    var reserveTarget = resolveElement(settings.reserveTarget || settings.reserveRoot);
    if (reserveTarget instanceof HTMLElement) {
      reserveTarget.style.removeProperty("padding-top");
    }
  }

  function resolveManagedTransitionShellConfig(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.transitionConfig === "function") {
      try {
        return settings.transitionConfig(settings) || null;
      } catch (_error) {
        return null;
      }
    }
    return settings.transitionConfig && typeof settings.transitionConfig === "object"
      ? settings.transitionConfig
      : settings;
  }

  function syncManagedTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var transitionConfig = resolveManagedTransitionShellConfig(settings);
    if (!(transitionConfig && typeof transitionConfig === "object")) {
      return null;
    }
    var shell = syncTransitionShell(transitionConfig);
    if (!(shell instanceof HTMLElement)) {
      return null;
    }
    if (typeof settings.syncMarkup === "function") {
      try {
        settings.syncMarkup(shell, settings, transitionConfig);
      } catch (_error) {}
    }
    return shell;
  }

  function showManagedTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var transitionConfig = resolveManagedTransitionShellConfig(settings);
    if (!(transitionConfig && typeof transitionConfig === "object")) {
      return null;
    }
    var shell = showTransitionShell(transitionConfig);
    if (!(shell instanceof HTMLElement)) {
      return null;
    }
    if (typeof settings.syncMarkup === "function") {
      try {
        settings.syncMarkup(shell, settings, transitionConfig);
      } catch (_error) {}
    }
    return shell;
  }

  function hideManagedTransitionShell(config) {
    var transitionConfig = resolveManagedTransitionShellConfig(config);
    if (!(transitionConfig && typeof transitionConfig === "object")) {
      return;
    }
    hideTransitionShell(transitionConfig);
  }

  function clearManagedTransitionShell(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object" ? settings.state : null;
    if (state && state.timer) {
      window.clearTimeout(state.timer);
      state.timer = 0;
    }
    var transitionConfig = resolveManagedTransitionShellConfig(settings);
    if (!(transitionConfig && typeof transitionConfig === "object")) {
      return;
    }
    clearTransitionShell(transitionConfig);
  }

  function scheduleManagedTransitionShellHide(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object"
      ? settings.state
      : (settings.state = { timer: 0 });
    if (state.timer) {
      return state;
    }
    var delayMs = Math.max(Number(settings.delayMs || 0) || 0, 0);
    var retryDelayMs = Math.max(Number(settings.retryDelayMs || delayMs || 0) || 0, 0);
    state.timer = window.setTimeout(function () {
      state.timer = 0;
      var transitionConfig = resolveManagedTransitionShellConfig(settings);
      if (!(transitionConfig && typeof transitionConfig === "object")) {
        return;
      }
      var shell = getTransitionShell(transitionConfig);
      if (!(shell instanceof HTMLElement) || shell.hidden) {
        return;
      }
      var liveNode = resolveElement(transitionConfig.liveNode);
      var isBusy = false;
      if (typeof settings.isBusy === "function") {
        try {
          isBusy = !!settings.isBusy(settings, transitionConfig, liveNode, shell);
        } catch (_error) {
          isBusy = false;
        }
      } else {
        isBusy = !(liveNode instanceof HTMLElement) || !!liveNode.hidden;
      }
      if (isBusy) {
        scheduleManagedTransitionShellHide(Object.assign({}, settings, {
          delayMs: retryDelayMs,
          retryDelayMs: retryDelayMs,
          state: state,
        }));
        return;
      }
      hideTransitionShell(transitionConfig);
    }, delayMs);
    return state;
  }

  function getKeyedPortalConfigValue(settings, key, fallback) {
    var value = settings[key];
    return value == null || value === "" ? fallback : value;
  }

  function getKeyedPortal(config) {
    var settings = config && typeof config === "object" ? config : {};
    var scopeNode = resolveElement(settings.scopeNode);
    if (!(scopeNode instanceof HTMLElement)) {
      return null;
    }
    var selector = String(getKeyedPortalConfigValue(settings, "portalSelector", ":scope > .o_surface_portal")).trim();
    var portal = scopeNode.querySelector(selector);
    if (portal instanceof HTMLElement) {
      return portal;
    }
    portal = document.createElement("div");
    portal.className = String(getKeyedPortalConfigValue(settings, "portalClassName", "o_surface_portal")).trim();
    var placement = String(getKeyedPortalConfigValue(settings, "placement", "prepend")).trim();
    if (placement === "append") {
      scopeNode.appendChild(portal);
    } else {
      scopeNode.insertBefore(portal, scopeNode.firstChild);
    }
    return portal;
  }

  function clearKeyedPortal(config) {
    var settings = config && typeof config === "object" ? config : {};
    var portal = getKeyedPortal(settings);
    if (!(portal instanceof HTMLElement)) {
      return;
    }
    portal.replaceChildren();
  }

  function getKeyedPortalItem(portal, key, config) {
    if (!(portal instanceof HTMLElement)) {
      return null;
    }
    var settings = config && typeof config === "object" ? config : {};
    var dataKey = String(getKeyedPortalConfigValue(settings, "itemDataKey", "surfaceKey")).trim();
    var selector = "[data-" + toDataAttributeName(dataKey) + '="' + escapeHtml(String(key || "").trim()) + '"]';
    return portal.querySelector(selector);
  }

  function ensureKeyedPortalItem(portal, key, config) {
    if (!(portal instanceof HTMLElement)) {
      return null;
    }
    var settings = config && typeof config === "object" ? config : {};
    var portalItem = getKeyedPortalItem(portal, key, settings);
    if (portalItem instanceof HTMLElement) {
      return portalItem;
    }
    portalItem = document.createElement("div");
    portalItem.className = String(getKeyedPortalConfigValue(settings, "itemClassName", "o_surface_portal_item")).trim();
    portalItem.dataset[String(getKeyedPortalConfigValue(settings, "itemDataKey", "surfaceKey")).trim()] = String(key || "").trim();
    portal.appendChild(portalItem);
    return portalItem;
  }

  function positionKeyedPortalItem(portalItem, scopeNode, anchorNode) {
    if (!(portalItem instanceof HTMLElement) || !(scopeNode instanceof HTMLElement) || !(anchorNode instanceof HTMLElement)) {
      return;
    }
    var scopeRect = scopeNode.getBoundingClientRect();
    var anchorRect = anchorNode.getBoundingClientRect();
    portalItem.style.left = Math.round(anchorRect.left - scopeRect.left) + "px";
    portalItem.style.top = Math.round(anchorRect.top - scopeRect.top) + "px";
    portalItem.style.width = Math.round(anchorRect.width) + "px";
    portalItem.style.height = Math.round(anchorRect.height) + "px";
  }

  function pruneKeyedPortalItems(portal, keys, config) {
    if (!(portal instanceof HTMLElement)) {
      return;
    }
    var settings = config && typeof config === "object" ? config : {};
    var dataKey = String(getKeyedPortalConfigValue(settings, "itemDataKey", "surfaceKey")).trim();
    var allowedKeys = (Array.isArray(keys) ? keys : []).reduce(function (result, key) {
      var normalizedKey = String(key || "").trim();
      if (normalizedKey) {
        result[normalizedKey] = true;
      }
      return result;
    }, Object.create(null));
    Array.prototype.slice.call(portal.children).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      var currentKey = String(node.dataset[dataKey] || "").trim();
      if (!currentKey || !allowedKeys[currentKey]) {
        node.remove();
      }
    });
  }

  function normalizeSelectFilterToolbarActiveTabs(config) {
    var settings = config && typeof config === "object" ? config : {};
    var resolved = {
      any: "",
      primary: "",
      secondary: "",
    };
    var activeTabs = settings.activeTabs && typeof settings.activeTabs === "object"
      ? settings.activeTabs
      : null;
    var activeTab = settings.activeTab;
    if (activeTabs) {
      resolved.primary = String(activeTabs.primary || "").trim();
      resolved.secondary = String(activeTabs.secondary || "").trim();
    } else {
      resolved.any = String(activeTab || "").trim();
    }
    return resolved;
  }

  function normalizeSelectFilterToolbarTab(entry, fallbackLevel) {
    if (!entry) {
      return null;
    }
    var tabEntry = entry;
    if (typeof entry === "string") {
      var inlineLabel = String(entry || "").trim();
      if (!inlineLabel) {
        return null;
      }
      tabEntry = {
        key: inlineLabel,
        label: inlineLabel,
      };
    }
    if (!(tabEntry && typeof tabEntry === "object")) {
      return null;
    }
    var key = String(tabEntry.key || tabEntry.value || "").trim();
    var label = String(tabEntry.label || tabEntry.title || key).trim();
    if (!key || !label || tabEntry.hidden) {
      return null;
    }
    var level = String(tabEntry.level || fallbackLevel || "primary").trim().toLowerCase();
    if (level !== "secondary") {
      level = "primary";
    }
    return {
      key: key,
      label: label,
      level: level,
      className: String(tabEntry.className || "").trim(),
      title: String(tabEntry.title || "").trim(),
      disabled: !!tabEntry.disabled,
    };
  }

  function pushSelectFilterToolbarTabs(target, source, fallbackLevel) {
    if (!Array.isArray(source)) {
      return target;
    }
    source.forEach(function (entry) {
      var normalizedEntry = normalizeSelectFilterToolbarTab(entry, fallbackLevel);
      if (!normalizedEntry) {
        return;
      }
      if (normalizedEntry.level === "secondary") {
        target.secondary.push(normalizedEntry);
        return;
      }
      target.primary.push(normalizedEntry);
    });
    return target;
  }

  function resolveSelectFilterToolbarTabs(config) {
    var settings = config && typeof config === "object" ? config : {};
    var groups = {
      primary: [],
      secondary: [],
    };
    var tabs = settings.tabs;
    if (Array.isArray(tabs)) {
      pushSelectFilterToolbarTabs(groups, tabs, "primary");
    } else if (tabs && typeof tabs === "object") {
      pushSelectFilterToolbarTabs(groups, tabs.primary || [], "primary");
      pushSelectFilterToolbarTabs(groups, tabs.secondary || [], "secondary");
    }
    return groups;
  }

  function buildSelectFilterToolbarFiltersMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var className = String(settings.className || "").trim();
    var filters = Array.isArray(settings.filters) ? settings.filters : [];
    return filters.map(function (filter) {
      var entry = filter && typeof filter === "object" ? filter : {};
      var filterKey = String(entry.key || "").trim();
      var filterLabel = String(entry.label || "").trim();
      var filterValue = String(entry.value || "").trim();
      var modifierClass = String(entry.modifierClass || "").trim();
      var emptyLabel = String(entry.emptyLabel || "").trim();
      var options = Array.isArray(entry.options) ? entry.options : [];
      var optionValueKey = String(entry.optionValueKey || "value").trim();
      var optionLabelKey = String(entry.optionLabelKey || "label").trim();
      var optionNodes = [];
      if (!filterKey || !filterLabel) {
        return "";
      }
      if (emptyLabel) {
        optionNodes.push('<option value="">' + escapeHtml(emptyLabel) + "</option>");
      }
      optionNodes = optionNodes.concat(options.map(function (option) {
        var optionEntry = option && typeof option === "object" ? option : {};
        var value = String(optionEntry[optionValueKey] || "").trim();
        var label = String(optionEntry[optionLabelKey] || "").trim();
        return (
          '<option value="' +
          escapeHtml(value) +
          '"' +
          (value === filterValue ? ' selected="selected"' : "") +
          ">" +
          escapeHtml(label) +
          "</option>"
        );
      }));
      return (
        '<label class="' + className + '__filter' + (modifierClass ? " " + modifierClass : "") + '">' +
        '<span class="' + className + '__filter_label">' + escapeHtml(filterLabel) + "</span>" +
        '<select class="' + className + '__select"' + buildSurfaceFilterControlAttributes(filterKey) + ">" +
        optionNodes.join("") +
        "</select>" +
        "</label>"
      );
    }).join("");
  }

  function buildSelectFilterToolbarTabsMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var className = String(settings.className || "").trim();
    var tabs = Array.isArray(settings.tabs) ? settings.tabs : [];
    var activeTabs = settings.activeTabs && typeof settings.activeTabs === "object"
      ? settings.activeTabs
      : {
        any: "",
        primary: "",
        secondary: "",
      };
    var level = String(settings.level || "primary").trim().toLowerCase() === "secondary"
      ? "secondary"
      : "primary";
    var normalizedIdPrefix = String(settings.tabIdPrefix || className || "surface-tabs")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "surface-tabs";
    var tabsHtml = tabs.map(function (tab) {
      var entry = tab && typeof tab === "object" ? tab : null;
      if (!entry) {
        return "";
      }
      var isActive =
        entry.key === activeTabs[level] ||
        entry.key === activeTabs.any;
      var tabKey = String(entry.key || "").trim();
      var tabId = normalizedIdPrefix + "-" + level + "-" + tabKey.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
      return (
        '<button type="button" class="' + className + '__tab ' + className + '__tab--' + level +
        ' o_surface_tab o_surface_tab--' + level +
        (entry.className ? " " + entry.className : "") +
        (isActive ? " is-active" : "") +
        '"' +
        ' id="' + escapeHtml(tabId) + '"' +
        buildSurfaceTabControlAttributes(tabKey, level, isActive) +
        ' role="tab" aria-selected="' + (isActive ? "true" : "false") + '"' +
        (isActive ? ' aria-current="page"' : "") +
        ' tabindex="' + (isActive ? "0" : "-1") + '"' +
        (entry.title ? ' title="' + escapeHtml(entry.title) + '"' : "") +
        (entry.disabled ? ' disabled="disabled" aria-disabled="true"' : "") +
        ">" +
        '<span class="o_surface_tab__label">' + escapeHtml(entry.label) + "</span>" +
        "</button>"
      );
    }).join("");
    if (!tabsHtml) {
      return "";
    }
    return (
      '<div class="' + className + '__tabs ' + className + '__tabs--' + level +
      ' o_surface_tabs o_surface_tabs--' + level + '"' +
      ' role="tablist" aria-orientation="horizontal"' +
      buildSurfaceTabListAttributes(level) + ">" +
      tabsHtml +
      "</div>"
    );
  }

  function buildSelectFilterToolbarRowMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var className = String(settings.className || "").trim();
    var rowName = String(settings.rowName || "").trim();
    var content = String(settings.content || "").trim();
    if (!className || !content) {
      return "";
    }
    return (
      '<div class="' + className + '__row o_surface_toolbar_row' +
      (rowName ? " " + className + '__row--' + rowName + " o_surface_toolbar_row--" + rowName : "") +
      '"' +
      (rowName ? ' data-surface-toolbar-row="' + escapeHtml(rowName) + '"' : "") +
      ">" +
      content +
      "</div>"
    );
  }

  function buildSelectFilterToolbarMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var className = String(settings.className || "").trim();
    var layout = String(settings.layout || "filters-first").trim().toLowerCase();
    var activeTabs = normalizeSelectFilterToolbarActiveTabs(settings);
    var tabGroups = resolveSelectFilterToolbarTabs(settings);
    var filtersMarkup = buildSelectFilterToolbarFiltersMarkup({
      className: className,
      filters: settings.filters,
    });
    var filtersSection = filtersMarkup
      ? '<div class="' + className + '__filters">' + filtersMarkup + "</div>"
      : "";
    var primaryTabsSection = buildSelectFilterToolbarTabsMarkup({
      className: className,
      tabs: tabGroups.primary,
      activeTabs: activeTabs,
      level: "primary",
    });
    var secondaryTabsSection = buildSelectFilterToolbarTabsMarkup({
      className: className,
      tabs: tabGroups.secondary,
      activeTabs: activeTabs,
      level: "secondary",
    });
    var hasPrimaryTabs = !!primaryTabsSection;
    var hasSecondaryTabs = !!secondaryTabsSection;
    if (!filtersSection && !hasPrimaryTabs && !hasSecondaryTabs) {
      return "";
    }
    if (hasPrimaryTabs && hasSecondaryTabs) {
      var secondaryRowContent = filtersSection + secondaryTabsSection;
      return (
        buildSelectFilterToolbarRowMarkup({
          className: className,
          rowName: "tabs-primary",
          content: primaryTabsSection,
        }) +
        buildSelectFilterToolbarRowMarkup({
          className: className,
          rowName: filtersSection ? "tabs-secondary" : "tabs-secondary-only",
          content: secondaryRowContent,
        })
      );
    }
    var flatSections = [];
    if (layout === "tabs-first") {
      if (hasPrimaryTabs || hasSecondaryTabs) {
        flatSections.push(
          buildSelectFilterToolbarRowMarkup({
            className: className,
            rowName: "tabs",
            content: primaryTabsSection || secondaryTabsSection,
          })
        );
      }
      if (filtersSection) {
        flatSections.push(
          buildSelectFilterToolbarRowMarkup({
            className: className,
            rowName: "filters",
            content: filtersSection,
          })
        );
      }
      return flatSections.join("");
    }
    if (filtersSection) {
      flatSections.push(
        buildSelectFilterToolbarRowMarkup({
          className: className,
          rowName: "filters",
          content: filtersSection,
        })
      );
    }
    if (hasPrimaryTabs || hasSecondaryTabs) {
      flatSections.push(
        buildSelectFilterToolbarRowMarkup({
          className: className,
          rowName: "tabs",
          content: primaryTabsSection || secondaryTabsSection,
        })
      );
    }
    return flatSections.join("");
  }

  function normalizeSurfaceBreadcrumbText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function buildSurfaceBreadcrumbItem(label, options) {
    var normalizedLabel = normalizeSurfaceBreadcrumbText(label);
    var settings = options && typeof options === "object" ? options : {};
    if (!normalizedLabel) {
      return null;
    }
    return Object.assign({ label: normalizedLabel }, settings);
  }

  function buildSurfaceHomeBreadcrumbItem(options) {
    var settings = options && typeof options === "object" ? options : {};
    return buildSurfaceBreadcrumbItem("Home", Object.assign({ href: "/odoo" }, settings));
  }

  function ensureManagedMarker(node, managedAttr) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var attrName = String(managedAttr || "data-surface-managed").trim() || "data-surface-managed";
    if (node.getAttribute(attrName) !== "1") {
      node.setAttribute(attrName, "1");
    }
  }

  function ensureBreadcrumbTopbarHost(config) {
    var settings = config && typeof config === "object" ? config : {};
    var systray = document.querySelector(
      String(settings.systraySelector || ".o_main_navbar .o_menu_systray").trim() || ".o_main_navbar .o_menu_systray"
    );
    if (!(systray instanceof HTMLElement)) {
      return null;
    }
    var hostClassName = String(settings.hostClassName || SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS).trim() || SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS;
    var managedAttr = String(settings.managedAttr || "data-surface-managed").trim() || "data-surface-managed";
    var host = systray.querySelector(":scope > ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS) ||
      systray.querySelector(":scope > ." + hostClassName);
    if (!(host instanceof HTMLElement)) {
      host = document.createElement("div");
      host.className = hostClassName;
      systray.insertBefore(host, systray.firstChild || null);
    }
    if (!host.classList.contains(SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS)) {
      host.classList.add(SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS);
    }
    ensureManagedMarker(host, managedAttr);
    return host;
  }

  function resolveManagedBreadcrumbRootNode(config) {
    var settings = config && typeof config === "object" ? config : {};
    var hostClassName = String(settings.hostClassName || SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS).trim() || SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS;
    var topbarSelector = ".o_main_navbar ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS + " > .o_breadcrumb, " +
      ".o_main_navbar ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS + " > .breadcrumb, " +
      ".o_main_navbar ." + hostClassName + " > .o_breadcrumb, " +
      ".o_main_navbar ." + hostClassName + " > .breadcrumb";
    var topbarRoot = document.querySelector(topbarSelector);
    if (topbarRoot instanceof HTMLElement) {
      return topbarRoot;
    }
    var controlPanel = resolveElement(settings.controlPanel);
    if (!(controlPanel instanceof HTMLElement)) {
      return null;
    }
    return controlPanel.querySelector(".o_control_panel_breadcrumbs > .o_breadcrumb") ||
      controlPanel.querySelector(".o_control_panel_breadcrumbs > .breadcrumb");
  }

  function normalizeControlPanelBreadcrumbLayout(config) {
    var settings = config && typeof config === "object" ? config : {};
    var controlPanel = resolveElement(settings.controlPanel);
    if (!(controlPanel instanceof HTMLElement)) {
      return;
    }
    var breadcrumbs = controlPanel.querySelector(".o_control_panel_breadcrumbs");
    if (!(breadcrumbs instanceof HTMLElement)) {
      return;
    }
    var rootBreadcrumb = breadcrumbs.querySelector(":scope > .o_breadcrumb") ||
      breadcrumbs.querySelector(":scope > .breadcrumb");
    if (!(rootBreadcrumb instanceof HTMLElement)) {
      rootBreadcrumb = resolveManagedBreadcrumbRootNode(settings);
    }
    var mainButtons = breadcrumbs.querySelector(":scope > .o_control_panel_main_buttons");
    var spacer = breadcrumbs.querySelector(":scope > .me-auto");
    var actionsNode = rootBreadcrumb instanceof HTMLElement
      ? rootBreadcrumb.querySelector(".o_control_panel_breadcrumbs_actions")
      : null;
    var listNode = rootBreadcrumb instanceof HTMLElement
      ? rootBreadcrumb.querySelector(":scope > .breadcrumb, :scope > ol.breadcrumb")
      : null;
    var lastItem = rootBreadcrumb instanceof HTMLElement
      ? rootBreadcrumb.querySelector(".o_last_breadcrumb_item")
      : null;
    if (!settings.shouldPromote) {
      breadcrumbs.removeAttribute("data-surface-breadcrumb-stacked");
      var existingHost = document.querySelector(".o_main_navbar ." + SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS) ||
        document.querySelector(".o_main_navbar ." + String(settings.hostClassName || SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS).trim());
      if (
        rootBreadcrumb instanceof HTMLElement &&
        actionsNode instanceof HTMLElement &&
        actionsNode.parentElement !== rootBreadcrumb
      ) {
        if (listNode instanceof HTMLElement && listNode.parentElement === rootBreadcrumb) {
          rootBreadcrumb.insertBefore(actionsNode, listNode.nextSibling || null);
        } else {
          rootBreadcrumb.appendChild(actionsNode);
        }
      }
      if (rootBreadcrumb instanceof HTMLElement) {
        var restoreBefore = mainButtons instanceof HTMLElement
          ? mainButtons
          : spacer instanceof HTMLElement
          ? spacer
          : breadcrumbs.firstChild;
        if (rootBreadcrumb.parentElement !== breadcrumbs) {
          breadcrumbs.insertBefore(rootBreadcrumb, restoreBefore || null);
        }
      }
      if (existingHost instanceof HTMLElement) {
        existingHost.remove();
      }
      ["display", "align-items", "position"].forEach(function (propertyName) {
        breadcrumbs.style.removeProperty(propertyName);
      });
      if (spacer instanceof HTMLElement) {
        spacer.style.removeProperty("display");
      }
      return;
    }
    breadcrumbs.dataset.surfaceBreadcrumbStacked = "1";
    breadcrumbs.style.setProperty("display", "flex", "important");
    breadcrumbs.style.setProperty("align-items", "flex-start");
    breadcrumbs.style.setProperty("position", "relative");
    if (rootBreadcrumb instanceof HTMLElement) {
      var host = ensureBreadcrumbTopbarHost(settings);
      if (host instanceof HTMLElement) {
        Array.prototype.slice.call(host.children || []).forEach(function (childNode) {
          if (
            childNode instanceof HTMLElement &&
            childNode !== rootBreadcrumb &&
            (childNode.matches(".o_breadcrumb, .breadcrumb") || childNode.getAttribute("data-surface-breadcrumb-root") === "1")
          ) {
            childNode.remove();
          }
        });
        if (rootBreadcrumb.parentElement !== host) {
          host.appendChild(rootBreadcrumb);
        }
      }
      if (
        lastItem instanceof HTMLElement &&
        actionsNode instanceof HTMLElement &&
        actionsNode.parentElement !== lastItem
      ) {
        lastItem.appendChild(actionsNode);
      }
    }
    if (spacer instanceof HTMLElement) {
      spacer.style.setProperty("display", "none", "important");
    }
  }

  Object.assign(surfaceLayerApi, {
    isElementAfterReference: isElementAfterReference,
    getTransitionShell: getTransitionShell,
    syncTransitionShell: syncTransitionShell,
    syncTransitionReservation: syncTransitionReservation,
    showTransitionShell: showTransitionShell,
    hideTransitionShell: hideTransitionShell,
    clearTransitionShell: clearTransitionShell,
    syncManagedTransitionShell: syncManagedTransitionShell,
    showManagedTransitionShell: showManagedTransitionShell,
    hideManagedTransitionShell: hideManagedTransitionShell,
    clearManagedTransitionShell: clearManagedTransitionShell,
    scheduleManagedTransitionShellHide: scheduleManagedTransitionShellHide,
    getKeyedPortal: getKeyedPortal,
    clearKeyedPortal: clearKeyedPortal,
    getKeyedPortalItem: getKeyedPortalItem,
    ensureKeyedPortalItem: ensureKeyedPortalItem,
    positionKeyedPortalItem: positionKeyedPortalItem,
    pruneKeyedPortalItems: pruneKeyedPortalItems,
    SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS: SURFACE_BREADCRUMB_TOPBAR_HOST_CLASS,
    buildSurfaceBreadcrumbItem: buildSurfaceBreadcrumbItem,
    buildSurfaceHomeBreadcrumbItem: buildSurfaceHomeBreadcrumbItem,
    ensureBreadcrumbTopbarHost: ensureBreadcrumbTopbarHost,
    resolveManagedBreadcrumbRootNode: resolveManagedBreadcrumbRootNode,
    normalizeControlPanelBreadcrumbLayout: normalizeControlPanelBreadcrumbLayout,
    buildSelectFilterToolbarMarkup: buildSelectFilterToolbarMarkup,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
