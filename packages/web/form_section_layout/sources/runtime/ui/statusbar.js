(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/statusbar.js

  function resolveStatusbarFieldName(containerNode, fallbackIndex) {
    if (!(containerNode instanceof HTMLElement)) {
      return "statusbar_" + String(fallbackIndex + 1);
    }
    var directName = cleanText(containerNode.getAttribute("name") || containerNode.dataset.name || "");
    if (directName) {
      return directName;
    }
    var owner = containerNode.closest(".o_field_widget[name], .o_field_widget[data-name], [name]");
    if (owner instanceof HTMLElement) {
      var ownerName = cleanText(owner.getAttribute("name") || owner.dataset.name || "");
      if (ownerName) {
        return ownerName;
      }
    }
    return "statusbar_" + String(fallbackIndex + 1);
  }

  v2.resolveStatusbarFieldName = resolveStatusbarFieldName;

  function collectStatusbarMetas(formNode, scopeKey) {
    if (!(formNode instanceof HTMLElement)) {
      return [];
    }
    var metas = [];
    var seenContainers = new Set();
    var seenKeys = new Set();
    var ordinal = 0;

    formNode.querySelectorAll(".o_field_statusbar, .o_statusbar_status").forEach(function (candidate) {
      if (!(candidate instanceof HTMLElement)) {
        return;
      }
      var containerNode = candidate.classList.contains("o_field_statusbar")
        ? candidate
        : candidate.closest(".o_field_statusbar") || candidate;
      if (!(containerNode instanceof HTMLElement) || seenContainers.has(containerNode)) {
        return;
      }
      seenContainers.add(containerNode);
      containerNode.classList.add(STATUSBAR_CONTAINER_CLASS);

      var fieldName = resolveStatusbarFieldName(containerNode, ordinal);
      var rawStatusbarKey = normalizeKey(fieldName) || "statusbar_" + String(ordinal + 1);
      var statusbarKey = rawStatusbarKey;
      var suffix = 2;
      while (seenKeys.has(statusbarKey)) {
        statusbarKey = rawStatusbarKey + "_" + String(suffix);
        suffix += 1;
      }
      seenKeys.add(statusbarKey);

      var itemNodes = [];
      var itemSeen = new Set();
      containerNode.querySelectorAll(".o_arrow_button, .o_statusbar_status_item, .o_statusbar_item, [data-value]").forEach(function (node) {
        if (!(node instanceof HTMLElement) || itemSeen.has(node)) {
          return;
        }
        if (!(node.closest(".o_statusbar_status, .o_field_statusbar") === containerNode || containerNode.contains(node))) {
          return;
        }
        var label = cleanText(extractLayoutItemLabel(node) || node.textContent || "");
        if (!label || /^[.>|\-\u2026]+$/.test(label)) {
          return;
        }
        var itemKeySeed = cleanText(node.dataset.libStatusbarItemKey || node.getAttribute("data-value") || "");
        if (!itemKeySeed) {
          itemKeySeed = normalizeKey(label) || "value_" + String(itemNodes.length + 1);
        }
        var itemKey = normalizeKey(itemKeySeed) || "value_" + String(itemNodes.length + 1);
        if (itemNodes.some(function (itemMeta) { return itemMeta.key === itemKey; })) {
          return;
        }
        var baseLabel = cleanText(node.dataset.libStatusbarBaseLabel || "");
        if (!baseLabel) {
          baseLabel = label;
          node.dataset.libStatusbarBaseLabel = baseLabel;
        }
        node.dataset.libStatusbarItemKey = itemKey;
        itemSeen.add(node);
        itemNodes.push({
          node: node,
          key: itemKey,
          baseLabel: baseLabel,
        });
      });

      if (!itemNodes.length) {
        ordinal += 1;
        return;
      }

      metas.push({
        key: statusbarKey,
        fieldName: fieldName,
        label: prettifyFieldName(fieldName),
        node: containerNode,
        scopeKey: scopeKey,
        items: itemNodes,
      });
      ordinal += 1;
    });

    return metas;
  }

  v2.collectStatusbarMetas = collectStatusbarMetas;

  function applyStatusbarMetaLabels(statusbarMeta, scopeKey) {
    if (!(statusbarMeta && Array.isArray(statusbarMeta.items))) {
      return;
    }
    var currentStatusbarLabel = "";
    statusbarMeta.items.forEach(function (itemMeta) {
      if (!(itemMeta && itemMeta.node instanceof HTMLElement)) {
        return;
      }
      var overrideLabel = statusbarLabelValue(scopeKey, statusbarMeta.key, itemMeta.key);
      var fallbackLabel = cleanText(itemMeta.baseLabel || itemMeta.node.dataset.libStatusbarBaseLabel || "");
      var nextLabel = overrideLabel || fallbackLabel;
      if (!nextLabel) {
        return;
      }
      var labelHost =
        itemMeta.node.querySelector(".o_arrow_button_text, .o_statusbar_status_label, .o_statusbar_label") || itemMeta.node;
      replaceNodeTextContent(labelHost, nextLabel);
      if (
        itemMeta.node.classList.contains("o_arrow_button_current") ||
        cleanText(itemMeta.node.getAttribute("aria-current") || "").toLowerCase() === "step" ||
        cleanText(itemMeta.node.getAttribute("aria-checked") || "").toLowerCase() === "true"
      ) {
        currentStatusbarLabel = nextLabel;
      }
    });
    if (!currentStatusbarLabel) {
      return;
    }
    var collapsedToggle = statusbarMeta.node.querySelector(
      ":scope > .o_statusbar_status > .dropdown-toggle:not(.o_arrow_button), :scope > .dropdown-toggle:not(.o_arrow_button)"
    );
    if (!(collapsedToggle instanceof HTMLElement)) {
      return;
    }
    replaceNodeTextContent(collapsedToggle, currentStatusbarLabel);
  }

  v2.applyStatusbarMetaLabels = applyStatusbarMetaLabels;

  function onStatusbarSettingsClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!_state.formIsAdminUser) {
      return;
    }
    var formNode = button.closest(".o_form_view");
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var statusbarKey = cleanText(button.dataset.libStatusbarKey || "");
    if (!statusbarKey) {
      return;
    }
    openSectionSettingsPanel(formNode, "", STATUSBAR_FOCUS_PREFIX + statusbarKey);
  }

  v2.onStatusbarSettingsClick = onStatusbarSettingsClick;

  function decorateStatusbarContainer(statusbarMeta, scopeKey) {
    if (!(statusbarMeta && statusbarMeta.node instanceof HTMLElement)) {
      return;
    }
    var containerNode = statusbarMeta.node;
    var trigger = containerNode.querySelector(":scope > ." + STATUSBAR_SETTINGS_TRIGGER_CLASS);
    if (!(trigger instanceof HTMLElement)) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = STATUSBAR_SETTINGS_TRIGGER_CLASS;
      containerNode.appendChild(trigger);
    }
    applySettingsTriggerIcon(trigger, "Statusbar labels");
    trigger.dataset.libStatusbarKey = statusbarMeta.key;
    trigger.dataset.libScopeKey = scopeKey;
    if (trigger.dataset.libStatusbarSettingsBound !== "1") {
      trigger.dataset.libStatusbarSettingsBound = "1";
      trigger.addEventListener("click", onStatusbarSettingsClick);
    }
    trigger.hidden = !_state.formIsAdminUser;
  }

  v2.decorateStatusbarContainer = decorateStatusbarContainer;

  function cleanupStaleStatusbarTriggers(formNode, statusbarMetas) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var validParents = new Set();
    if (Array.isArray(statusbarMetas)) {
      statusbarMetas.forEach(function (meta) {
        if (!(meta && meta.node instanceof HTMLElement)) {
          return;
        }
        validParents.add(meta.node);
      });
    }
    formNode.querySelectorAll("." + STATUSBAR_SETTINGS_TRIGGER_CLASS).forEach(function (triggerNode) {
      if (!(triggerNode instanceof HTMLElement)) {
        return;
      }
      var parentNode = triggerNode.parentElement;
      if (!(parentNode instanceof HTMLElement) || !validParents.has(parentNode)) {
        triggerNode.remove();
      }
    });
  }

  v2.cleanupStaleStatusbarTriggers = cleanupStaleStatusbarTriggers;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
