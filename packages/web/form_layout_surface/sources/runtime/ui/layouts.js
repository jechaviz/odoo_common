(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/layouts.js

  function extractLayoutItemLabel(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    var raw = cleanText(node.textContent || "");
    if (raw) {
      return raw;
    }
    var ariaLabel = cleanText(node.getAttribute("aria-label") || node.getAttribute("title") || "");
    return ariaLabel;
  }

  v2.extractLayoutItemLabel = extractLayoutItemLabel;

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

  function collectLayoutItemsFromTabs(containerNode) {
    var items = [];
    var seen = new Set();
    var links = containerNode.querySelectorAll("a, button");
    links.forEach(function (linkNode) {
      if (!(linkNode instanceof HTMLElement)) {
        return;
      }
      if (shouldIgnoreLayoutItemNode(linkNode)) {
        return;
      }
      var rootItem = linkNode.closest("li, .nav-item, .o_notebook_header");
      var itemNode = rootItem instanceof HTMLElement ? rootItem : linkNode;
      if (shouldIgnoreLayoutItemNode(itemNode)) {
        return;
      }
      if (seen.has(itemNode)) {
        return;
      }
      seen.add(itemNode);
      var label = extractLayoutItemLabel(linkNode) || extractLayoutItemLabel(itemNode);
      if (!label) {
        return;
      }
      items.push({
        node: itemNode,
        activator: linkNode,
        label: label,
      });
    });
    return items;
  }

  v2.collectLayoutItemsFromTabs = collectLayoutItemsFromTabs;

  function collectLayoutItemsFromButtons(containerNode) {
    var items = [];
    var seen = new Set();
    containerNode.querySelectorAll("a, button").forEach(function (itemNode) {
      if (!(itemNode instanceof HTMLElement) || seen.has(itemNode)) {
        return;
      }
      if (shouldIgnoreLayoutItemNode(itemNode)) {
        return;
      }
      var label = extractLayoutItemLabel(itemNode);
      if (!label) {
        return;
      }
      seen.add(itemNode);
      items.push({
        node: itemNode,
        activator: itemNode,
        label: label,
      });
    });
    return items;
  }

  v2.collectLayoutItemsFromButtons = collectLayoutItemsFromButtons;

  function makeLayoutMeta(containerNode, layoutType, scopeKey, ordinal) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var items = layoutType === "tabs" ? collectLayoutItemsFromTabs(containerNode) : collectLayoutItemsFromButtons(containerNode);
    if (!items.length) {
      return null;
    }
    var containerLabel = cleanText(containerNode.getAttribute("data-name") || containerNode.getAttribute("name") || "");
    if (!containerLabel) {
      containerLabel = items
        .slice(0, 3)
        .map(function (item) {
          return item.label;
        })
        .join(" / ");
    }
    var layoutKeySeed = normalizeKey(layoutType + "_" + containerLabel + "_" + ordinal);
    var layoutKey = layoutKeySeed || layoutType + "_" + ordinal;
    containerNode.dataset.libLayoutKey = layoutKey;
    containerNode.dataset.libLayoutType = layoutType;
    containerNode.classList.add(LAYOUT_CONTAINER_CLASS);

    var itemKeys = new Set();
    items.forEach(function (item, index) {
      var rawKey = normalizeKey(item.label) || "item_" + index;
      var finalKey = rawKey;
      while (itemKeys.has(finalKey)) {
        finalKey = rawKey + "_" + index;
      }
      itemKeys.add(finalKey);
      item.key = finalKey;
      item.scopeKey = scopeKey;
      item.layoutKey = layoutKey;
    });

    return {
      key: layoutKey,
      type: layoutType,
      label: layoutType === "tabs" ? "Tabs: " + containerLabel : "Actions: " + containerLabel,
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
    var ordinal = 0;

    function push(containerNode, layoutType) {
      if (!(containerNode instanceof HTMLElement) || seen.has(containerNode)) {
        return;
      }
      seen.add(containerNode);
      var meta = makeLayoutMeta(containerNode, layoutType, scopeKey, ordinal);
      ordinal += 1;
      if (!meta || !meta.items.length) {
        return;
      }
      if (layoutType !== "tabs" && meta.items.length < 2) {
        return;
      }
      metas.push(meta);
    }

    formNode.querySelectorAll(".o_notebook").forEach(function (notebookNode) {
      if (!(notebookNode instanceof HTMLElement)) {
        return;
      }
      var preferredNode = null;
      notebookNode.querySelectorAll(".o_notebook_headers, .nav-tabs").forEach(function (node) {
        if (!(node instanceof HTMLElement) || node.closest(".o_notebook") !== notebookNode) {
          return;
        }
        if (!(preferredNode instanceof HTMLElement) || node.classList.contains("nav-tabs")) {
          preferredNode = node;
        }
      });
      push(preferredNode, "tabs");
    });

    formNode.querySelectorAll(".o_notebook_headers").forEach(function (node) {
      if (!(node instanceof HTMLElement) || node.closest(".o_notebook")) {
        return;
      }
      push(node, "tabs");
    });

    formNode
      .querySelectorAll(
        ".o_field_x2many .o_field_x2many_list_row_add, .o_field_x2many .o_control_panel .o_cp_buttons, .o_form_sheet .btn-group"
      )
      .forEach(function (node) {
        push(node, "actions");
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
    var formNode = button.closest(".o_form_view");
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
