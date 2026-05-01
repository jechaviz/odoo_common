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
      if (Boolean(await callKw("res.users", "has_group", [ADMIN_GROUP_XMLID], {}))) {
        return true;
      }
    } catch (_err) {
      // Try alternate call signature below.
    }

    var uid = currentUserId();
    if (!uid) {
      return false;
    }
    try {
      if (Boolean(await callKw("res.users", "has_group", [[uid], ADMIN_GROUP_XMLID], {}))) {
        return true;
      }
    } catch (_err) {
      // Fallback to group-id lookup below.
    }

    var groups = [];
    try {
      groups = await loadCurrentUserGroupIds();
    } catch (_groupErr) {
      groups = [];
    }
    if (groups.length) {
      var adminGroupId = await loadSystemAdminGroupId();
      if (adminGroupId && groups.indexOf(adminGroupId) >= 0) {
        return true;
      }
      try {
        var roleRows = await callKw(
          "res.groups",
          "search_read",
          [[["id", "in", groups]]],
          { fields: ["name", "display_name"], limit: 5000 }
        );
        if (Array.isArray(roleRows)) {
          var hasAdminRoleName = roleRows.some(function (row) {
            var name = String((row && (row.display_name || row.name)) || "")
              .trim()
              .toLowerCase();
            if (!name) {
              return false;
            }
            return (
              name === "role / administrator" ||
              name === "rp administrator" ||
              name.indexOf("administrator") >= 0
            );
          });
          if (hasAdminRoleName) {
            return true;
          }
        }
      } catch (_err) {
        // Continue to function fallback below.
      }
    }
    try {
      var functionRows = await callKw("res.users", "read", [[uid], ["function"]], {});
      if (Array.isArray(functionRows) && functionRows.length) {
        var functionValue = String((functionRows[0] && functionRows[0].function) || "")
          .trim()
          .toLowerCase();
        if (functionValue.indexOf("admin") >= 0) {
          return true;
        }
      }
    } catch (_functionErr) {
      // Ignore and fallback to false.
    }
    return false;
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
    try {
      var rows = await callKw(
        "ir.model.fields",
        "search_read",
        [[["model", "=", "res.users"], ["name", "in", ["group_ids", "groups_id"]]]],
        { fields: ["name"], limit: 2 }
      );
      if (Array.isArray(rows) && rows.length) {
        var names = rows
          .map(function (row) {
            return String((row && row.name) || "").trim();
          })
          .filter(Boolean);
        if (names.indexOf("group_ids") >= 0) {
          _state.userGroupsFieldName = "group_ids";
        } else if (names.indexOf("groups_id") >= 0) {
          _state.userGroupsFieldName = "groups_id";
        }
      }
    } catch (_err) {
      // Fallback below.
    }
    if (!_state.userGroupsFieldName) {
      _state.userGroupsFieldName = "group_ids";
    }
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
      var fallbackFieldName = groupsFieldName === "group_ids" ? "groups_id" : "group_ids";
      try {
        var fallbackRows = await callKw("res.users", "read", [[uid], [fallbackFieldName]], {});
        if (!Array.isArray(fallbackRows) || !fallbackRows.length) {
          return [];
        }
        var fallbackGroups = fallbackRows[0] && fallbackRows[0][fallbackFieldName];
        if (!Array.isArray(fallbackGroups)) {
          return [];
        }
        return fallbackGroups
          .map(function (groupId) {
            return Number(groupId || 0);
          })
          .filter(function (groupId) {
            return groupId > 0;
          });
      } catch (_fallbackErr) {
        return [];
      }
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
      try {
        var fallbackRows = await callKw(
          "res.groups",
          "search_read",
          [[]],
          { fields: ["id", "name"], order: "name asc", limit: 5000 }
        );
        if (!Array.isArray(fallbackRows)) {
          return [];
        }
        return fallbackRows
          .map(function (row) {
            var roleId = Number((row && row.id) || 0);
            if (!roleId) {
              return null;
            }
            var roleName = String((row && row.name) || "").trim();
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
      } catch (_fallbackErr) {
        return [];
      }
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
