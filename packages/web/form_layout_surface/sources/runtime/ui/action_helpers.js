(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/action_helpers.js

  function resolveFormActionButton(target) {
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    var button = target.closest("button, a");
    if (!(button instanceof HTMLElement)) {
      return null;
    }
    if (!(button.closest(FORM_ROOT_SELECTOR) instanceof HTMLElement)) {
      return null;
    }
    if (button.className && String(button.className).indexOf("o_lib_") >= 0) {
      return null;
    }
    if (button.closest("#" + SETTINGS_PANEL_ID) || button.closest("." + SUBTOTAL_CONTAINER_CLASS)) {
      return null;
    }
    if (button.closest(".o_statusbar_buttons") || button.closest(".o_form_buttons_edit") || button.closest(".o_form_buttons_view")) {
      return button;
    }
    return null;
  }

  v2.resolveFormActionButton = resolveFormActionButton;

  function dedupeKeys(keys) {
    var seen = new Set();
    var output = [];
    keys.forEach(function (key) {
      var normalized = String(key || "").trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      output.push(normalized);
    });
    return output;
  }

  v2.dedupeKeys = dedupeKeys;

  function getSectionGroups(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return [];
    }
    var byNode = new Set();
    var groups = [];

    formNode.querySelectorAll("[data-lib-section-key]").forEach(function (node) {
      if (!(node instanceof HTMLElement) || byNode.has(node)) {
        return;
      }
      if (!readSectionKey(node)) {
        return;
      }
      node.classList.add(COLLAPSIBLE_GROUP_CLASS);
      byNode.add(node);
      groups.push(node);
    });

    return groups;
  }

  v2.getSectionGroups = getSectionGroups;

  function readSectionKey(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return "";
    }
    return cleanText(groupNode.getAttribute("data-lib-section-key") || groupNode.dataset.libSectionKey || "");
  }

  v2.readSectionKey = readSectionKey;

  function findSectionHeader(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return null;
    }

    for (var i = 0; i < groupNode.children.length; i += 1) {
      var child = groupNode.children[i];
      if (
        child instanceof HTMLElement &&
        (child.hasAttribute("data-lib-section-header") || child.classList.contains(HEADER_CLASS))
      ) {
        return child;
      }
    }

    var nested = groupNode.querySelector("[data-lib-section-header], ." + HEADER_CLASS);
    if (nested instanceof HTMLElement) {
      return nested;
    }

    return null;
  }

  v2.findSectionHeader = findSectionHeader;

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  v2.cleanText = cleanText;

  function resolveSettingsIconClass() {
    var iconClass = cleanText(_state.settingsIconClass || SETTINGS_ICON_CLASS);
    if (!iconClass) {
      throw new Error("settingsIconClass must be configured by the form layout surface");
    }
    return iconClass;
  }

  v2.resolveSettingsIconClass = resolveSettingsIconClass;

  function applyButtonIcon(button, iconClass, ariaLabel) {
    if (!(button instanceof HTMLElement)) {
      return;
    }
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;

    var iconNode = button.querySelector("i");
    if (!(iconNode instanceof HTMLElement)) {
      iconNode = document.createElement("i");
      button.innerHTML = "";
      button.appendChild(iconNode);
    }
    iconNode.className = cleanText(iconClass || "");
    if (!iconNode.className) {
      throw new Error("button icon class must be explicit");
    }
    iconNode.setAttribute("aria-hidden", "true");
  }

  v2.applyButtonIcon = applyButtonIcon;

  function applySettingsTriggerIcon(button, ariaLabel) {
    applyButtonIcon(button, resolveSettingsIconClass(), ariaLabel);
  }

  v2.applySettingsTriggerIcon = applySettingsTriggerIcon;

  function applyPencilTriggerIcon(button, ariaLabel) {
    applyButtonIcon(button, PENCIL_ICON_CLASS, ariaLabel);
  }

  v2.applyPencilTriggerIcon = applyPencilTriggerIcon;

  function applyCheckTriggerIcon(button, ariaLabel) {
    applyButtonIcon(button, CHECK_ICON_CLASS, ariaLabel);
  }

  v2.applyCheckTriggerIcon = applyCheckTriggerIcon;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
