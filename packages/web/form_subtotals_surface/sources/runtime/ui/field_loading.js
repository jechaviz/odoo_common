(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_loading.js

  async function callKw(model, method, args, kwargs) {
    var payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: model,
        method: method,
        args: Array.isArray(args) ? args : [],
        kwargs: kwargs || {},
      },
    };

    var response = await fetch("/web/dataset/call_kw/" + model + "/" + method, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("rpc_http_" + response.status);
    }

    var raw = await response.json();
    if (raw && raw.error) {
      throw new Error(raw.error.message || "rpc_error");
    }
    return raw ? raw.result : null;
  }

  v2.callKw = callKw;

  async function isCurrentUserAdmin() {
    var info = getSessionInfo();
    if (info && (info.is_admin === true || info.is_system === true || info.is_superuser === true)) {
      return true;
    }

    try {
      return Boolean(await callKw("res.users", "has_group", [ADMIN_GROUP_XMLID], {}));
    } catch (_err) {
      return false;
    }
  }

  v2.isCurrentUserAdmin = isCurrentUserAdmin;

  async function canWriteConfigParameters() {
    var uid = currentUserId();
    if (!uid) {
      return false;
    }
    var probeKey = "odoo.common.form_layout_surface.probe.user_" + String(uid);
    try {
      await callKw("ir.config_parameter", "set_param", [probeKey, String(Date.now())], {});
      return true;
    } catch (_err) {
      return false;
    }
  }

  v2.canWriteConfigParameters = canWriteConfigParameters;

  async function loadUserGroupsFieldName() {
    if (_state.userGroupsFieldName) {
      return _state.userGroupsFieldName;
    }
    _state.userGroupsFieldName = "groups_id";
    return _state.userGroupsFieldName;
  }

  v2.loadUserGroupsFieldName = loadUserGroupsFieldName;

  async function loadSystemAdminGroupId() {
    if (_state.systemAdminGroupId > 0) {
      return _state.systemAdminGroupId;
    }
    try {
      var rows = await callKw(
        "ir.model.data",
        "search_read",
        [[["module", "=", "base"], ["name", "=", "group_system"], ["model", "=", "res.groups"]]],
        {
          fields: ["res_id"],
          limit: 1,
        }
      );
      if (!Array.isArray(rows) || !rows.length) {
        return 0;
      }
      _state.systemAdminGroupId = Number((rows[0] && rows[0].res_id) || 0) || 0;
      return _state.systemAdminGroupId;
    } catch (_err) {
      return 0;
    }
  }

  v2.loadSystemAdminGroupId = loadSystemAdminGroupId;

  async function loadCurrentUserGroupIds() {
    var uid = currentUserId();
    if (!uid) {
      return [];
    }
    var groupsFieldName = await loadUserGroupsFieldName();
    try {
      var rows = await callKw("res.users", "read", [[uid], [groupsFieldName]], {});
      if (!Array.isArray(rows) || !rows.length) {
        return [];
      }
      var groups = rows[0] && rows[0][groupsFieldName];
      if (!Array.isArray(groups)) {
        return [];
      }
      return groups
        .map(function (groupId) {
          return Number(groupId || 0);
        })
        .filter(function (groupId) {
          return groupId > 0;
        });
    } catch (_err) {
      return [];
    }
  }

  v2.loadCurrentUserGroupIds = loadCurrentUserGroupIds;

  async function loadAvailableRoleOptions() {
    if (!_state.formIsAdminUser) {
      return [];
    }
    try {
      var rows = await callKw(
        "res.groups",
        "search_read",
        [[]],
        { fields: ["id", "display_name", "name"], order: "name asc", limit: 5000 }
      );
      if (!Array.isArray(rows)) {
        throw new Error("roles_not_array");
      }
      return rows
        .map(function (row) {
          var roleId = Number((row && row.id) || 0);
          if (!roleId) {
            return null;
          }
          var roleName = String((row && (row.display_name || row.name)) || "").trim();
          if (!roleName) {
            return null;
          }
          return {
            id: roleId,
            name: roleName,
          };
        })
        .filter(function (role) {
          return Boolean(role);
        });
    } catch (_err) {
      return [];
    }
  }

  v2.loadAvailableRoleOptions = loadAvailableRoleOptions;

  function normalizeFieldSelectionOptions(rawSelection) {
    if (!Array.isArray(rawSelection)) {
      return [];
    }
    var options = [];
    var seen = new Set();
    rawSelection.forEach(function (item) {
      var value = "";
      var label = "";
      if (Array.isArray(item) && item.length >= 2) {
        value = String(item[0] == null ? "" : item[0]);
        label = cleanText(item[1] == null ? "" : item[1]);
      } else if (item && typeof item === "object") {
        value = String(item.value == null ? "" : item.value);
        label = cleanText(item.label || item.name || "");
      }
      var key = value + "|" + label;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      options.push({
        value: value,
        label: label || value || "(empty)",
      });
    });
    return options;
  }

  v2.normalizeFieldSelectionOptions = normalizeFieldSelectionOptions;

  function readLoadedFieldDefinitions(modelName) {
    if (!modelName) {
      return {};
    }
    return _state.fieldDefinitionsByModel[modelName] || {};
  }

  v2.readLoadedFieldDefinitions = readLoadedFieldDefinitions;

  function ensureFieldDefinitionsLoadedForModel(modelName) {
    if (!modelName) {
      return Promise.resolve({});
    }
    if (Object.prototype.hasOwnProperty.call(_state.fieldDefinitionsByModel, modelName)) {
      return Promise.resolve(_state.fieldDefinitionsByModel[modelName] || {});
    }
    if (_state.fieldDefinitionsLoadByModel[modelName]) {
      return _state.fieldDefinitionsLoadByModel[modelName];
    }

    _state.fieldDefinitionsLoadByModel[modelName] = callKw(
      modelName,
      "fields_get",
      [[], FIELD_DEFINITION_ATTRIBUTES],
      {}
    )
      .then(function (raw) {
        var parsed = {};
        if (raw && typeof raw === "object") {
          Object.keys(raw).forEach(function (fieldName) {
            var meta = raw[fieldName];
            if (!meta || typeof meta !== "object") {
              return;
            }
            parsed[String(fieldName || "")] = {
              type: cleanText(meta.type || "").toLowerCase(),
              selection: normalizeFieldSelectionOptions(meta.selection),
              string: cleanText(meta.string || ""),
              relation: cleanText(meta.relation || ""),
              readonly: Boolean(meta.readonly),
            };
          });
        }
        _state.fieldDefinitionsByModel[modelName] = parsed;
        return parsed;
      })
      .catch(function () {
        _state.fieldDefinitionsByModel[modelName] = {};
        return {};
      })
      .finally(function () {
        delete _state.fieldDefinitionsLoadByModel[modelName];
      });

    return _state.fieldDefinitionsLoadByModel[modelName];
  }

  v2.ensureFieldDefinitionsLoadedForModel = ensureFieldDefinitionsLoadedForModel;

  function ensureFieldDefinitionsLoadedForForm(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var modelName = computeModelName(formNode);
    if (!modelName) {
      return;
    }
    if (
      Object.prototype.hasOwnProperty.call(_state.fieldDefinitionsByModel, modelName) ||
      Object.prototype.hasOwnProperty.call(_state.fieldDefinitionsLoadByModel, modelName)
    ) {
      return;
    }
    ensureFieldDefinitionsLoadedForModel(modelName).then(function () {
      if (
        _state.settingsPanelState.currentForm === formNode &&
        _state.settingsPanelState.panelNode instanceof HTMLElement &&
        _state.settingsPanelState.panelNode.classList.contains(SETTINGS_PANEL_OPEN_CLASS)
      ) {
        renderSectionSettingsPanel(
          formNode,
          _state.settingsPanelState.currentScopeKey || computeScopeKey(formNode),
          _state.settingsPanelState.focusSectionKey || "",
          _state.settingsPanelState.focusLayoutKey || ""
        );
      }
    });
  }

  v2.ensureFieldDefinitionsLoadedForForm = ensureFieldDefinitionsLoadedForForm;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
