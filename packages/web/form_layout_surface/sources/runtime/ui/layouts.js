(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};
  var FORM_ROOT_SELECTOR = v2.FORM_ROOT_SELECTOR || "[data-lib-scope-key]";
  var LAYOUT_CONTAINER_CLASS = v2.LAYOUT_CONTAINER_CLASS || "o_lib_layout_container";
  var LAYOUT_ITEM_HIDDEN_CLASS = v2.LAYOUT_ITEM_HIDDEN_CLASS || "o_lib_layout_item_hidden";
  var LAYOUT_SETTINGS_TRIGGER_CLASS = v2.LAYOUT_SETTINGS_TRIGGER_CLASS || "o_lib_layout_settings_trigger";
  var SECTION_SETTINGS_TRIGGER_CLASS = v2.SECTION_SETTINGS_TRIGGER_CLASS || "o_lib_section_settings_trigger";
  var cleanText = v2.cleanText || function (value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  };
  var layoutDefaultItemKey = v2.layoutDefaultItemKey || function () {
    return "";
  };
  var layoutItemIsVisible = v2.layoutItemIsVisible || function () {
    return true;
  };
  var canAccessLayoutSettings = v2.canAccessLayoutSettings || function () {
    return false;
  };
  var openSectionSettingsPanel = v2.openSectionSettingsPanel || function () {};
  var applySettingsTriggerIcon = v2.applySettingsTriggerIcon || function () {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/layouts.js

  function extractLayoutItemLabel(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute("data-lib-layout-item-label") || node.dataset.libLayoutItemLabel || "");
  }

  v2.extractLayoutItemLabel = extractLayoutItemLabel;

  function readLayoutItemKey(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute("data-lib-layout-item-key") || node.dataset.libLayoutItemKey || "");
  }

  v2.readLayoutItemKey = readLayoutItemKey;

  function readLayoutContainerKey(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute("data-lib-layout-key") || node.dataset.libLayoutKey || "");
  }

  v2.readLayoutContainerKey = readLayoutContainerKey;

  function readLayoutContainerType(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute("data-lib-layout-type") || node.dataset.libLayoutType || "").toLowerCase();
  }

  v2.readLayoutContainerType = readLayoutContainerType;

  function readLayoutContainerLabel(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute("data-lib-layout-label") || node.dataset.libLayoutLabel || "");
  }

  v2.readLayoutContainerLabel = readLayoutContainerLabel;

  function shouldIgnoreLayoutItemNode(node) {
    if (!(node instanceof HTMLElement)) {
      return true;
    }
    if (
      node.classList.contains(LAYOUT_SETTINGS_TRIGGER_CLASS) ||
      node.closest("." + LAYOUT_SETTINGS_TRIGGER_CLASS)
    ) {
      return true;
    }
    if (
      node.classList.contains(SECTION_SETTINGS_TRIGGER_CLASS) ||
      node.closest("." + SECTION_SETTINGS_TRIGGER_CLASS)
    ) {
      return true;
    }
    return false;
  }

  v2.shouldIgnoreLayoutItemNode = shouldIgnoreLayoutItemNode;

  function resolveLayoutItemActivator(itemNode) {
    if (!(itemNode instanceof HTMLElement)) {
      return null;
    }
    if (itemNode.hasAttribute("data-lib-layout-item-activator")) {
      return itemNode;
    }
    var explicitActivator = itemNode.querySelector("[data-lib-layout-item-activator]");
    if (explicitActivator instanceof HTMLElement) {
      return explicitActivator;
    }
    if (itemNode.matches("a, button")) {
      return itemNode;
    }
    var nativeActivator = itemNode.querySelector("a, button");
    return nativeActivator instanceof HTMLElement ? nativeActivator : itemNode;
  }

  v2.resolveLayoutItemActivator = resolveLayoutItemActivator;

  function collectExplicitLayoutItems(containerNode) {
    var items = [];
    var seen = new Set();
    containerNode.querySelectorAll("[data-lib-layout-item-key]").forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement)) {
        return;
      }
      var ownerNode = itemNode.closest("[data-lib-layout-key]");
      if (ownerNode !== containerNode) {
        return;
      }
      if (shouldIgnoreLayoutItemNode(itemNode)) {
        return;
      }
      var itemKey = readLayoutItemKey(itemNode);
      if (!itemKey || seen.has(itemKey)) {
        return;
      }
      seen.add(itemKey);
      var activatorNode = resolveLayoutItemActivator(itemNode);
      var label = extractLayoutItemLabel(itemNode) || itemKey;
      items.push({
        node: itemNode,
        activator: activatorNode,
        key: itemKey,
        label: label,
      });
    });
    return items;
  }

  v2.collectExplicitLayoutItems = collectExplicitLayoutItems;

  function collectLayoutItemsFromTabs(containerNode) {
    return collectExplicitLayoutItems(containerNode);
  }

  v2.collectLayoutItemsFromTabs = collectLayoutItemsFromTabs;

  function collectLayoutItemsFromButtons(containerNode) {
    return collectExplicitLayoutItems(containerNode);
  }

  v2.collectLayoutItemsFromButtons = collectLayoutItemsFromButtons;

  function makeLayoutMeta(containerNode, layoutType, scopeKey) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var resolvedType = cleanText(layoutType || readLayoutContainerType(containerNode)).toLowerCase();
    if (resolvedType !== "tabs" && resolvedType !== "actions") {
      return null;
    }
    var layoutKey = readLayoutContainerKey(containerNode);
    if (!layoutKey) {
      return null;
    }
    var items = resolvedType === "tabs" ? collectLayoutItemsFromTabs(containerNode) : collectLayoutItemsFromButtons(containerNode);
    if (!items.length) {
      return null;
    }
    var containerLabel = readLayoutContainerLabel(containerNode) || layoutKey;
    containerNode.dataset.libLayoutKey = layoutKey;
    containerNode.dataset.libLayoutType = resolvedType;
    containerNode.classList.add(LAYOUT_CONTAINER_CLASS);

    items.forEach(function (item) {
      item.scopeKey = scopeKey;
      item.layoutKey = layoutKey;
    });

    return {
      key: layoutKey,
      type: resolvedType,
      label: containerLabel,
      node: containerNode,
      items: items,
    };
  }

  v2.makeLayoutMeta = makeLayoutMeta;

  function collectLayoutContainers(formNode, scopeKey) {
    if (!(formNode instanceof HTMLElement)) {
      return [];
    }
    var metas = [];
    var seen = new Set();

    function push(containerNode, layoutType) {
      if (!(containerNode instanceof HTMLElement) || seen.has(containerNode)) {
        return;
      }
      seen.add(containerNode);
      var meta = makeLayoutMeta(containerNode, layoutType, scopeKey);
      if (!meta || !meta.items.length) {
        return;
      }
      metas.push(meta);
    }

    formNode.querySelectorAll("[data-lib-layout-key][data-lib-layout-type]").forEach(function (node) {
      push(node, readLayoutContainerType(node));
    });

    return metas;
  }

  v2.collectLayoutContainers = collectLayoutContainers;

  function setLayoutItemVisible(itemMeta, visible) {
    if (!itemMeta || !(itemMeta.node instanceof HTMLElement)) {
      return;
    }
    itemMeta.node.classList.toggle(LAYOUT_ITEM_HIDDEN_CLASS, !visible);
  }

  v2.setLayoutItemVisible = setLayoutItemVisible;

  function ensureLayoutDefaultState(layoutMeta, scopeKey) {
    if (!layoutMeta || layoutMeta.type !== "tabs") {
      return;
    }
    var defaultItemKey = layoutDefaultItemKey(scopeKey, layoutMeta.key);
    if (!defaultItemKey) {
      return;
    }
    var defaultItem = layoutMeta.items.find(function (item) {
      return item.key === defaultItemKey && !item.node.classList.contains(LAYOUT_ITEM_HIDDEN_CLASS);
    });
    if (!defaultItem || !(defaultItem.activator instanceof HTMLElement)) {
      return;
    }
    var activeItem = layoutMeta.items.find(function (item) {
      return (
        item.node.classList.contains("active") ||
        (item.activator instanceof HTMLElement && item.activator.classList.contains("active"))
      );
    });
    if (activeItem && activeItem.key === defaultItem.key) {
      return;
    }
    window.requestAnimationFrame(function () {
      defaultItem.activator.click();
    });
  }

  v2.ensureLayoutDefaultState = ensureLayoutDefaultState;

  function applyLayoutVisibility(layoutMeta, scopeKey) {
    if (!layoutMeta || !Array.isArray(layoutMeta.items)) {
      return;
    }
    layoutMeta.items.forEach(function (itemMeta) {
      var visible = layoutItemIsVisible(scopeKey, layoutMeta.key, itemMeta.key);
      setLayoutItemVisible(itemMeta, visible);
    });
    ensureLayoutDefaultState(layoutMeta, scopeKey);
  }

  v2.applyLayoutVisibility = applyLayoutVisibility;

  function onLayoutSettingsClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var formNode = button.closest(FORM_ROOT_SELECTOR);
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    openSectionSettingsPanel(formNode, "", cleanText(button.dataset.libLayoutKey || ""));
  }

  v2.onLayoutSettingsClick = onLayoutSettingsClick;

  function decorateLayoutContainer(layoutMeta, scopeKey) {
    if (!layoutMeta || !(layoutMeta.node instanceof HTMLElement)) {
      return;
    }
    var containerNode = layoutMeta.node;
    if (layoutMeta.type !== "tabs") {
      var staleTrigger = containerNode.querySelector("." + LAYOUT_SETTINGS_TRIGGER_CLASS);
      if (staleTrigger instanceof HTMLElement) {
        staleTrigger.remove();
      }
      return;
    }
    var trigger = containerNode.querySelector("." + LAYOUT_SETTINGS_TRIGGER_CLASS);
    if (!(trigger instanceof HTMLElement)) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = LAYOUT_SETTINGS_TRIGGER_CLASS;
      containerNode.appendChild(trigger);
    }
    applySettingsTriggerIcon(trigger, "Layout settings");
    trigger.dataset.libLayoutKey = layoutMeta.key;
    trigger.dataset.libScopeKey = scopeKey;
    if (trigger.dataset.libLayoutSettingsBound !== "1") {
      trigger.dataset.libLayoutSettingsBound = "1";
      trigger.addEventListener("click", onLayoutSettingsClick);
    }
    trigger.hidden = !canAccessLayoutSettings(scopeKey, layoutMeta.key);
  }

  v2.decorateLayoutContainer = decorateLayoutContainer;

  function cleanupStaleLayoutTriggers(formNode, layoutMetas) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var validParents = new Set();
    if (Array.isArray(layoutMetas)) {
      layoutMetas.forEach(function (layoutMeta) {
        if (!layoutMeta || layoutMeta.type !== "tabs" || !(layoutMeta.node instanceof HTMLElement)) {
          return;
        }
        validParents.add(layoutMeta.node);
      });
    }
    var parentWithKeptTrigger = new Set();
    formNode.querySelectorAll("." + LAYOUT_SETTINGS_TRIGGER_CLASS).forEach(function (triggerNode) {
      if (!(triggerNode instanceof HTMLElement)) {
        return;
      }
      var parentNode = triggerNode.parentElement;
      if (!(parentNode instanceof HTMLElement) || !validParents.has(parentNode) || parentWithKeptTrigger.has(parentNode)) {
        triggerNode.remove();
        return;
      }
      parentWithKeptTrigger.add(parentNode);
    });
  }

  v2.cleanupStaleLayoutTriggers = cleanupStaleLayoutTriggers;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
