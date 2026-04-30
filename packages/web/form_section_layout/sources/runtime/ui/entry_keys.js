(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/entry_keys.js

  function collapsedEntryKey(scopeKey, sectionKey) {
    return scopeKey + "|" + sectionKey;
  }

  v2.collapsedEntryKey = collapsedEntryKey;

  function sectionVisibilityEntryKey(scopeKey, sectionKey) {
    return "section|" + scopeKey + "|" + sectionKey;
  }

  v2.sectionVisibilityEntryKey = sectionVisibilityEntryKey;

  function fieldVisibilityEntryKey(scopeKey, sectionKey, fieldKey) {
    return "field|" + scopeKey + "|" + sectionKey + "|" + fieldKey;
  }

  v2.fieldVisibilityEntryKey = fieldVisibilityEntryKey;

  function fieldDefaultEntryKey(scopeKey, sectionKey, fieldKey) {
    return "default|" + scopeKey + "|" + sectionKey + "|" + fieldKey;
  }

  v2.fieldDefaultEntryKey = fieldDefaultEntryKey;

  function sectionSettingsRoleEntryKey(scopeKey, sectionKey) {
    return "setting_role|" + scopeKey + "|" + sectionKey;
  }

  v2.sectionSettingsRoleEntryKey = sectionSettingsRoleEntryKey;

  function layoutItemVisibilityEntryKey(scopeKey, layoutKey, itemKey) {
    return "layout_item|" + scopeKey + "|" + layoutKey + "|" + itemKey;
  }

  v2.layoutItemVisibilityEntryKey = layoutItemVisibilityEntryKey;

  function layoutSettingsRoleEntryKey(scopeKey, layoutKey) {
    return "layout_role|" + scopeKey + "|" + layoutKey;
  }

  v2.layoutSettingsRoleEntryKey = layoutSettingsRoleEntryKey;

  function layoutDefaultEntryKey(scopeKey, layoutKey) {
    return "layout_default|" + scopeKey + "|" + layoutKey;
  }

  v2.layoutDefaultEntryKey = layoutDefaultEntryKey;

  function statusbarLabelEntryKey(scopeKey, statusbarKey, itemKey, localeCode) {
    var locale = cleanText(localeCode || currentLocaleCode()).toLowerCase() || "en_us";
    return "statusbar_label|" + locale + "|" + scopeKey + "|" + statusbarKey + "|" + itemKey;
  }

  v2.statusbarLabelEntryKey = statusbarLabelEntryKey;

  function scopeModelFromScopeKey(scopeKey) {
    var raw = cleanText(scopeKey || "");
    if (!raw) {
      return "";
    }
    var delimiterIndex = raw.indexOf("|");
    if (delimiterIndex < 0) {
      return raw;
    }
    return cleanText(raw.slice(0, delimiterIndex));
  }

  v2.scopeModelFromScopeKey = scopeModelFromScopeKey;

  function normalizeStatePersistOptions(options) {
    if (!options || typeof options !== "object") {
      return null;
    }
    var scopeKey = cleanText(options.scopeKey || "");
    var containerKey = cleanText(options.containerKey || "");
    if (!scopeKey || !containerKey) {
      return null;
    }
    return {
      scopeKey: scopeKey,
      containerKey: containerKey,
    };
  }

  v2.normalizeStatePersistOptions = normalizeStatePersistOptions;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
