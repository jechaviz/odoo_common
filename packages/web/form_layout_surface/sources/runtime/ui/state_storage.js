(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/state_storage.js

  function makeLocalStorageKey() {
    return LOCAL_STORAGE_PREFIX + String(currentUserId() || 0);
  }

  v2.makeLocalStorageKey = makeLocalStorageKey;

  function makeDbParamKey() {
    return DB_PARAM_PREFIX + String(currentUserId() || 0);
  }

  v2.makeDbParamKey = makeDbParamKey;

  function makeGlobalDbParamKey() {
    return String(DB_GLOBAL_PARAM_KEY);
  }

  v2.makeGlobalDbParamKey = makeGlobalDbParamKey;

  function ensureUserScopedKeys() {
    var uid = currentUserId();
    if (uid === _state.stateUserId && _state.localStorageKey && _state.dbParamKey) {
      return uid;
    }
    _state.stateUserId = uid;
    _state.localStorageKey = LOCAL_STORAGE_PREFIX + String(uid || 0);
    _state.dbParamKey = DB_PARAM_PREFIX + String(uid || 0);
    return uid;
  }

  v2.ensureUserScopedKeys = ensureUserScopedKeys;

  function normalizeKey(value) {
    var raw = String(value || "").toLowerCase().trim();
    if (!raw) {
      return "";
    }
    try {
      raw = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_err) {
      // Ignore normalize support issues.
    }
    return raw
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
  }

  v2.normalizeKey = normalizeKey;

  function emptyLayoutState() {
    return {
      collapsed: {},
      order: {},
      sectionVisible: {},
      fieldVisible: {},
      fieldDefaults: {},
      layoutItemVisible: {},
      layoutDefaults: {},
      settingsRoles: {},
      statusbarLabels: {},
      subtotalLayouts: {},
    };
  }

  v2.emptyLayoutState = emptyLayoutState;

  function cloneLayoutState(source) {
    return {
      collapsed: Object.assign({}, source && source.collapsed ? source.collapsed : {}),
      order: Object.assign({}, source && source.order ? source.order : {}),
      sectionVisible: Object.assign({}, source && source.sectionVisible ? source.sectionVisible : {}),
      fieldVisible: Object.assign({}, source && source.fieldVisible ? source.fieldVisible : {}),
      fieldDefaults: Object.assign({}, source && source.fieldDefaults ? source.fieldDefaults : {}),
      layoutItemVisible: Object.assign({}, source && source.layoutItemVisible ? source.layoutItemVisible : {}),
      layoutDefaults: Object.assign({}, source && source.layoutDefaults ? source.layoutDefaults : {}),
      settingsRoles: Object.assign({}, source && source.settingsRoles ? source.settingsRoles : {}),
      statusbarLabels: Object.assign({}, source && source.statusbarLabels ? source.statusbarLabels : {}),
      subtotalLayouts: Object.assign({}, source && source.subtotalLayouts ? source.subtotalLayouts : {}),
    };
  }

  v2.cloneLayoutState = cloneLayoutState;

  function parseLayoutState(raw) {
    var source = {};
    try {
      if (typeof raw === "string") {
        source = JSON.parse(raw || "{}") || {};
      } else if (raw && typeof raw === "object") {
        source = raw;
      }
    } catch (_err) {
      source = {};
    }

    var parsed = emptyLayoutState();

    if (source.collapsed && typeof source.collapsed === "object" && !Array.isArray(source.collapsed)) {
      Object.keys(source.collapsed).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        var value = source.collapsed[key];
        if (typeof value === "boolean") {
          parsed.collapsed[normalized] = value;
          return;
        }
        if (value === 1 || value === 0) {
          parsed.collapsed[normalized] = Boolean(value);
        }
      });
    }

    if (source.order && typeof source.order === "object" && !Array.isArray(source.order)) {
      Object.keys(source.order).forEach(function (scopeKey) {
        var normalizedScope = String(scopeKey || "").trim();
        var rawList = source.order[scopeKey];
        if (!normalizedScope || !Array.isArray(rawList)) {
          return;
        }
        var cleaned = dedupeKeys(
          rawList.map(function (item) {
            return String(item || "").trim();
          })
        );
        if (cleaned.length) {
          parsed.order[normalizedScope] = cleaned;
        }
      });
    }

    if (source.sectionVisible && typeof source.sectionVisible === "object" && !Array.isArray(source.sectionVisible)) {
      Object.keys(source.sectionVisible).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        var value = source.sectionVisible[key];
        if (typeof value === "boolean") {
          parsed.sectionVisible[normalized] = value;
          return;
        }
        if (value === 1 || value === 0) {
          parsed.sectionVisible[normalized] = Boolean(value);
        }
      });
    }

    if (source.fieldVisible && typeof source.fieldVisible === "object" && !Array.isArray(source.fieldVisible)) {
      Object.keys(source.fieldVisible).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        var value = source.fieldVisible[key];
        if (typeof value === "boolean") {
          parsed.fieldVisible[normalized] = value;
          return;
        }
        if (value === 1 || value === 0) {
          parsed.fieldVisible[normalized] = Boolean(value);
        }
      });
    }

    if (source.fieldDefaults && typeof source.fieldDefaults === "object" && !Array.isArray(source.fieldDefaults)) {
      Object.keys(source.fieldDefaults).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        parsed.fieldDefaults[normalized] = String(source.fieldDefaults[key] || "");
      });
    }

    if (source.layoutItemVisible && typeof source.layoutItemVisible === "object" && !Array.isArray(source.layoutItemVisible)) {
      Object.keys(source.layoutItemVisible).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        var value = source.layoutItemVisible[key];
        if (typeof value === "boolean") {
          parsed.layoutItemVisible[normalized] = value;
          return;
        }
        if (value === 1 || value === 0) {
          parsed.layoutItemVisible[normalized] = Boolean(value);
        }
      });
    }

    if (source.layoutDefaults && typeof source.layoutDefaults === "object" && !Array.isArray(source.layoutDefaults)) {
      Object.keys(source.layoutDefaults).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        parsed.layoutDefaults[normalized] = String(source.layoutDefaults[key] || "");
      });
    }

    if (source.statusbarLabels && typeof source.statusbarLabels === "object" && !Array.isArray(source.statusbarLabels)) {
      Object.keys(source.statusbarLabels).forEach(function (key) {
        var normalized = String(key || "").trim();
        if (!normalized) {
          return;
        }
        parsed.statusbarLabels[normalized] = String(source.statusbarLabels[key] || "");
      });
    }

    if (source.settingsRoles && typeof source.settingsRoles === "object" && !Array.isArray(source.settingsRoles)) {
      Object.keys(source.settingsRoles).forEach(function (key) {
        var normalized = String(key || "").trim();
        var rawValue = source.settingsRoles[key];
        if (!normalized || !Array.isArray(rawValue)) {
          return;
        }
        var roleIds = rawValue
          .map(function (value) {
            return Number(value || 0);
          })
          .filter(function (value) {
            return value > 0;
          });
        if (roleIds.length) {
          parsed.settingsRoles[normalized] = dedupeKeys(
            roleIds.map(function (roleId) {
              return String(roleId);
            })
          ).map(function (roleId) {
            return Number(roleId);
          });
        }
      });
    }

    if (source.subtotalLayouts && typeof source.subtotalLayouts === "object" && !Array.isArray(source.subtotalLayouts)) {
      Object.keys(source.subtotalLayouts).forEach(function (key) {
        var normalizedKey = String(key || "").trim();
        var rawLayout = source.subtotalLayouts[key];
        if (!normalizedKey || !rawLayout || typeof rawLayout !== "object") {
          return;
        }

        var lines = Array.isArray(rawLayout.lines) ? rawLayout.lines : [];
        var cleanedLines = [];
        lines.forEach(function (line) {
          if (!line || typeof line !== "object") {
            return;
          }
          var lineId = String(line.id || "").trim();
          if (!lineId) {
            return;
          }
          cleanedLines.push({
            id: lineId,
            label: String(line.label || "").trim(),
            formula: String(line.formula || "").trim(),
            sourceField: String(line.sourceField || "").trim(),
            removable: line.removable !== false,
            formulaLocked: line.formulaLocked === true,
            lineType: String(line.lineType || "").trim().toLowerCase(),
            sign: String(line.sign || "").trim().toLowerCase(),
          });
        });

        var order = Array.isArray(rawLayout.order)
          ? dedupeKeys(
            rawLayout.order.map(function (lineId) {
              return String(lineId || "").trim();
            })
          )
          : [];

        parsed.subtotalLayouts[normalizedKey] = {
          lines: cleanedLines,
          order: order,
        };
      });
    }

    return parsed;
  }

  v2.parseLayoutState = parseLayoutState;

  function mergeLayoutState(dbState, localState) {
    var merged = emptyLayoutState();
    Object.assign(merged.collapsed, dbState && dbState.collapsed ? dbState.collapsed : {});
    Object.assign(merged.order, dbState && dbState.order ? dbState.order : {});
    Object.assign(merged.sectionVisible, dbState && dbState.sectionVisible ? dbState.sectionVisible : {});
    Object.assign(merged.fieldVisible, dbState && dbState.fieldVisible ? dbState.fieldVisible : {});
    Object.assign(merged.fieldDefaults, dbState && dbState.fieldDefaults ? dbState.fieldDefaults : {});
    Object.assign(merged.layoutItemVisible, dbState && dbState.layoutItemVisible ? dbState.layoutItemVisible : {});
    Object.assign(merged.layoutDefaults, dbState && dbState.layoutDefaults ? dbState.layoutDefaults : {});
    Object.assign(merged.settingsRoles, dbState && dbState.settingsRoles ? dbState.settingsRoles : {});
    Object.assign(merged.statusbarLabels, dbState && dbState.statusbarLabels ? dbState.statusbarLabels : {});
    Object.assign(merged.subtotalLayouts, dbState && dbState.subtotalLayouts ? dbState.subtotalLayouts : {});
    Object.assign(merged.collapsed, localState && localState.collapsed ? localState.collapsed : {});
    Object.assign(merged.order, localState && localState.order ? localState.order : {});
    Object.assign(merged.sectionVisible, localState && localState.sectionVisible ? localState.sectionVisible : {});
    Object.assign(merged.fieldVisible, localState && localState.fieldVisible ? localState.fieldVisible : {});
    Object.assign(merged.fieldDefaults, localState && localState.fieldDefaults ? localState.fieldDefaults : {});
    Object.assign(merged.layoutItemVisible, localState && localState.layoutItemVisible ? localState.layoutItemVisible : {});
    Object.assign(merged.layoutDefaults, localState && localState.layoutDefaults ? localState.layoutDefaults : {});
    Object.assign(merged.settingsRoles, localState && localState.settingsRoles ? localState.settingsRoles : {});
    Object.assign(merged.statusbarLabels, localState && localState.statusbarLabels ? localState.statusbarLabels : {});
    Object.assign(merged.subtotalLayouts, localState && localState.subtotalLayouts ? localState.subtotalLayouts : {});

    return merged;
  }

  v2.mergeLayoutState = mergeLayoutState;

  function readLocalLayoutState() {
    ensureUserScopedKeys();
    try {
      var raw = window.localStorage.getItem(_state.localStorageKey);
      return parseLayoutState(raw || "");
    } catch (_err) {
      return emptyLayoutState();
    }
  }

  v2.readLocalLayoutState = readLocalLayoutState;

  function writeLocalLayoutState(state) {
    ensureUserScopedKeys();
    try {
      window.localStorage.setItem(_state.localStorageKey, JSON.stringify(state));
    } catch (_err) {
      // Ignore quota/private mode issues.
    }
  }

  v2.writeLocalLayoutState = writeLocalLayoutState;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
