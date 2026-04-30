(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/visibility_access.js

  function sectionIsVisible(scopeKey, sectionKey) {
    var key = sectionVisibilityEntryKey(scopeKey, sectionKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.sectionVisible, key)) {
      return Boolean(_state.formLayoutState.sectionVisible[key]);
    }
    return true;
  }

  v2.sectionIsVisible = sectionIsVisible;

  function fieldIsVisible(scopeKey, sectionKey, fieldKey) {
    var key = fieldVisibilityEntryKey(scopeKey, sectionKey, fieldKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.fieldVisible, key)) {
      return Boolean(_state.formLayoutState.fieldVisible[key]);
    }
    return true;
  }

  v2.fieldIsVisible = fieldIsVisible;

  function fieldDefaultValue(scopeKey, sectionKey, fieldKey) {
    var key = fieldDefaultEntryKey(scopeKey, sectionKey, fieldKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.fieldDefaults, key)) {
      return String(_state.formLayoutState.fieldDefaults[key] || "");
    }
    return "";
  }

  v2.fieldDefaultValue = fieldDefaultValue;

  function sectionSettingsRoleIds(scopeKey, sectionKey) {
    var key = sectionSettingsRoleEntryKey(scopeKey, sectionKey);
    var rawValue = _state.formLayoutState.settingsRoles[key];
    if (!Array.isArray(rawValue)) {
      return [];
    }
    return rawValue
      .map(function (value) {
        return Number(value || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
  }

  v2.sectionSettingsRoleIds = sectionSettingsRoleIds;

  function canAccessSectionSettings(scopeKey, sectionKey) {
    if (_state.formIsAdminUser) {
      return true;
    }
    var roleIds = sectionSettingsRoleIds(scopeKey, sectionKey);
    if (!roleIds.length) {
      return true;
    }
    var currentGroups = new Set(
      (_state.currentUserGroupIds || []).map(function (id) {
        return Number(id || 0);
      })
    );
    for (var i = 0; i < roleIds.length; i += 1) {
      if (currentGroups.has(Number(roleIds[i] || 0))) {
        return true;
      }
    }
    return false;
  }

  v2.canAccessSectionSettings = canAccessSectionSettings;

  function layoutItemIsVisible(scopeKey, layoutKey, itemKey) {
    var key = layoutItemVisibilityEntryKey(scopeKey, layoutKey, itemKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.layoutItemVisible, key)) {
      return Boolean(_state.formLayoutState.layoutItemVisible[key]);
    }
    return true;
  }

  v2.layoutItemIsVisible = layoutItemIsVisible;

  function layoutSettingsRoleIds(scopeKey, layoutKey) {
    var key = layoutSettingsRoleEntryKey(scopeKey, layoutKey);
    var rawValue = _state.formLayoutState.settingsRoles[key];
    if (!Array.isArray(rawValue)) {
      return [];
    }
    return rawValue
      .map(function (value) {
        return Number(value || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
  }

  v2.layoutSettingsRoleIds = layoutSettingsRoleIds;

  function canAccessLayoutSettings(scopeKey, layoutKey) {
    var rawLayoutKey = cleanText(layoutKey || "");
    if (rawLayoutKey && rawLayoutKey.indexOf(STATUSBAR_FOCUS_PREFIX) === 0) {
      return _state.formIsAdminUser;
    }
    if (_state.formIsAdminUser) {
      return true;
    }
    var roleIds = layoutSettingsRoleIds(scopeKey, layoutKey);
    if (!roleIds.length) {
      return true;
    }
    var currentGroups = new Set(
      (_state.currentUserGroupIds || []).map(function (id) {
        return Number(id || 0);
      })
    );
    for (var i = 0; i < roleIds.length; i += 1) {
      if (currentGroups.has(Number(roleIds[i] || 0))) {
        return true;
      }
    }
    return false;
  }

  v2.canAccessLayoutSettings = canAccessLayoutSettings;

  function layoutDefaultItemKey(scopeKey, layoutKey) {
    var key = layoutDefaultEntryKey(scopeKey, layoutKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.layoutDefaults, key)) {
      return String(_state.formLayoutState.layoutDefaults[key] || "");
    }
    return "";
  }

  v2.layoutDefaultItemKey = layoutDefaultItemKey;

  function statusbarLabelValue(scopeKey, statusbarKey, itemKey) {
    var key = statusbarLabelEntryKey(scopeKey, statusbarKey, itemKey);
    if (Object.prototype.hasOwnProperty.call(_state.formLayoutState.statusbarLabels, key)) {
      return cleanText(_state.formLayoutState.statusbarLabels[key] || "");
    }
    var fallbackKey = statusbarLabelEntryKey(scopeKey, statusbarKey, itemKey, "en_us");
    if (!Object.prototype.hasOwnProperty.call(_state.formLayoutState.statusbarLabels, fallbackKey)) {
      return "";
    }
    return cleanText(_state.formLayoutState.statusbarLabels[fallbackKey] || "");
  }

  v2.statusbarLabelValue = statusbarLabelValue;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
