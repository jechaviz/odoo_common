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
    if (!(button.closest(".o_form_view") instanceof HTMLElement)) {
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

    formNode.querySelectorAll("." + COLLAPSIBLE_GROUP_CLASS).forEach(function (node) {
      if (!(node instanceof HTMLElement) || byNode.has(node)) {
        return;
      }
      byNode.add(node);
      groups.push(node);
    });

    formNode.querySelectorAll(".o_group").forEach(function (node) {
      if (!(node instanceof HTMLElement) || byNode.has(node)) {
        return;
      }
      if (node.closest("." + COLLAPSIBLE_GROUP_CLASS)) {
        return;
      }
      var header = findSectionHeader(node);
      if (!(header instanceof HTMLElement)) {
        return;
      }
      if (header.closest(".o_group") !== node) {
        return;
      }
      node.classList.add(COLLAPSIBLE_GROUP_CLASS);
      byNode.add(node);
      groups.push(node);
    });

    return groups;
  }

  v2.getSectionGroups = getSectionGroups;

  function findSectionHeader(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return null;
    }

    for (var i = 0; i < groupNode.children.length; i += 1) {
      var child = groupNode.children[i];
      if (child instanceof HTMLElement && child.classList.contains("o_horizontal_separator")) {
        return child;
      }
    }

    var nested = groupNode.querySelector(".o_horizontal_separator");
    if (nested instanceof HTMLElement) {
      return nested;
    }

    return null;
  }

  v2.findSectionHeader = findSectionHeader;

  function findSectionKeyFromClass(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return "";
    }
    for (var i = 0; i < groupNode.classList.length; i += 1) {
      var token = groupNode.classList.item(i) || "";
      if (token.indexOf(SECTION_KEY_CLASS_PREFIX) === 0) {
        return token.slice(SECTION_KEY_CLASS_PREFIX.length);
      }
    }
    return "";
  }

  v2.findSectionKeyFromClass = findSectionKeyFromClass;

  function prettifyFieldName(fieldName) {
    return String(fieldName || "")
      .replace(/^x_/, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^\w)/, function (letter) {
        return letter.toUpperCase();
      });
  }

  v2.prettifyFieldName = prettifyFieldName;

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  v2.cleanText = cleanText;

  function resolveNativeSettingsIconClass() {
    if (_state.nativeSettingsIconClass) {
      return _state.nativeSettingsIconClass;
    }
    var iconNode = document.querySelector(
      ".o_optional_columns_dropdown_toggle i, .o_optional_columns_dropdown .dropdown-toggle i, .o_optional_columns_dropdown i"
    );
    var className = cleanText((iconNode && iconNode.getAttribute && iconNode.getAttribute("class")) || "");
    _state.nativeSettingsIconClass = className || SETTINGS_ICON_FALLBACK_CLASS;
    return _state.nativeSettingsIconClass;
  }

  v2.resolveNativeSettingsIconClass = resolveNativeSettingsIconClass;

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
    iconNode.className = cleanText(iconClass || "") || SETTINGS_ICON_FALLBACK_CLASS;
    iconNode.setAttribute("aria-hidden", "true");
  }

  v2.applyButtonIcon = applyButtonIcon;

  function applySettingsTriggerIcon(button, ariaLabel) {
    applyButtonIcon(button, resolveNativeSettingsIconClass(), ariaLabel);
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
