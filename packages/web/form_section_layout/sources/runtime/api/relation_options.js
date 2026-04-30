(function (v2) {
  "use strict";
  v2.api = v2.api || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/api/relation_options.js

  function relationFieldOptionsKey(modelName, fieldName) {
    return String(modelName || "") + "|" + String(fieldName || "");
  }

  v2.relationFieldOptionsKey = relationFieldOptionsKey;

  function readRelationFieldOptions(modelName, fieldName) {
    var key = relationFieldOptionsKey(modelName, fieldName);
    var options = _state.relationFieldOptionsByKey[key];
    return Array.isArray(options) ? options : [];
  }

  v2.readRelationFieldOptions = readRelationFieldOptions;

  function rpcUserContext() {
    var info = getSessionInfo();
    if (info && info.user_context && typeof info.user_context === "object") {
      return info.user_context;
    }
    if (info && info.context && typeof info.context === "object") {
      return info.context;
    }
    return {};
  }

  v2.rpcUserContext = rpcUserContext;

  function currentLocaleCode() {
    var userContext = rpcUserContext();
    var contextLang = cleanText((userContext && (userContext.lang || userContext.locale)) || "");
    if (contextLang) {
      return contextLang;
    }
    var info = getSessionInfo();
    var infoLang = cleanText((info && (info.lang || (info.user_context && info.user_context.lang))) || "");
    return infoLang || "en_US";
  }

  v2.currentLocaleCode = currentLocaleCode;

  function parseRelationOptionsFromNameSearch(rows) {
    if (!Array.isArray(rows)) {
      return [];
    }
    var options = [];
    var seen = new Set();
    rows.forEach(function (row) {
      var recordId = 0;
      var displayName = "";
      if (Array.isArray(row) && row.length >= 2) {
        recordId = Number(row[0] || 0) || 0;
        displayName = cleanText(row[1] || "");
      } else if (row && typeof row === "object") {
        recordId = Number(row.id || row.res_id || 0) || 0;
        displayName = cleanText(row.display_name || row.name || row.label || row.value || "");
      }
      var seenKey = recordId > 0 ? "id:" + String(recordId) : "name:" + displayName;
      if (!displayName || seen.has(seenKey)) {
        return;
      }
      seen.add(seenKey);
      options.push({
        value: displayName,
        label: displayName,
        id: recordId,
      });
    });
    return options;
  }

  v2.parseRelationOptionsFromNameSearch = parseRelationOptionsFromNameSearch;

  function parseRelationOptionsFromSearchRead(rows) {
    var options = [];
    var seen = new Set();
    if (!Array.isArray(rows)) {
      return options;
    }
    rows.forEach(function (row) {
      var label = cleanText((row && (row.display_name || row.name)) || "");
      var recordId = Number((row && row.id) || 0) || 0;
      var seenKey = recordId > 0 ? "id:" + String(recordId) : "name:" + label;
      if (!label || seen.has(seenKey)) {
        return;
      }
      seen.add(seenKey);
      options.push({
        value: label,
        label: label,
        id: recordId,
      });
    });
    return options;
  }

  v2.parseRelationOptionsFromSearchRead = parseRelationOptionsFromSearchRead;

  function relationModelForField(modelName, fieldName, uiFieldMeta) {
    var definitions = readLoadedFieldDefinitions(modelName);
    var backendMeta = definitions[String(fieldName || "")];
    if (backendMeta && typeof backendMeta === "object") {
      var fieldType = cleanText(backendMeta.type || "").toLowerCase();
      if (fieldType === "many2one") {
        var backendRelation = cleanText(backendMeta.relation || "");
        if (backendRelation) {
          return backendRelation;
        }
      }
    }

    if (!(uiFieldMeta && typeof uiFieldMeta === "object" && Array.isArray(uiFieldMeta.widgets))) {
      return "";
    }

    for (var index = 0; index < uiFieldMeta.widgets.length; index += 1) {
      var widget = uiFieldMeta.widgets[index];
      if (!(widget instanceof HTMLElement)) {
        continue;
      }
      if (!widget.classList.contains("o_field_many2one")) {
        continue;
      }
      var inferredRelation = cleanText(
        widget.getAttribute("data-relation") ||
        widget.getAttribute("relation") ||
        widget.getAttribute("data-relation-model") ||
        widget.getAttribute("data-res-model") ||
        ""
      );
      if (inferredRelation) {
        return inferredRelation;
      }
    }
    return "";
  }

  v2.relationModelForField = relationModelForField;

  function searchRelationFieldOptions(modelName, fieldName, queryText, limit, uiFieldMeta) {
    var relationModel = relationModelForField(modelName, fieldName, uiFieldMeta);
    if (!relationModel) {
      return Promise.resolve(readRelationFieldOptions(modelName, fieldName));
    }
    var query = String(queryText || "").trim();
    var normalizedLimit = Number(limit || 120);
    if (!Number.isFinite(normalizedLimit) || normalizedLimit <= 0) {
      normalizedLimit = 120;
    }
    var userContext = rpcUserContext();

    function fallbackSearchRead() {
      var domain = query
        ? ["|", ["display_name", "ilike", query], ["name", "ilike", query]]
        : [];
      return callKw(
        relationModel,
        "search_read",
        [domain],
        {
          fields: ["display_name", "name"],
          limit: normalizedLimit,
          order: "display_name asc",
          context: userContext,
        }
      )
        .then(function (rows) {
          var parsed = parseRelationOptionsFromSearchRead(rows);
          if (parsed.length) {
            return parsed;
          }
          var cached = readRelationFieldOptions(modelName, fieldName);
          return Array.isArray(cached) ? cached : [];
        })
        .catch(function () {
          var cached = readRelationFieldOptions(modelName, fieldName);
          return Array.isArray(cached) ? cached : [];
        });
    }

    return callKw(
      relationModel,
      "name_search",
      [query, [], "ilike", normalizedLimit],
      { context: userContext }
    )
      .then(function (rows) {
        var parsed = parseRelationOptionsFromNameSearch(rows);
        if (parsed.length) {
          return parsed;
        }
        return fallbackSearchRead();
      })
      .catch(function () {
        return fallbackSearchRead();
      });
  }

  v2.searchRelationFieldOptions = searchRelationFieldOptions;

  function ensureRelationFieldOptionsLoaded(modelName, fieldName) {
    var key = relationFieldOptionsKey(modelName, fieldName);
    if (Array.isArray(_state.relationFieldOptionsByKey[key])) {
      return null;
    }
    if (_state.relationFieldOptionsLoadByKey[key]) {
      return _state.relationFieldOptionsLoadByKey[key];
    }

    var definitions = readLoadedFieldDefinitions(modelName);
    var fieldMeta = definitions[String(fieldName || "")];
    var relationModel = cleanText((fieldMeta && fieldMeta.relation) || "");
    var fieldType = cleanText((fieldMeta && fieldMeta.type) || "").toLowerCase();
    if (!relationModel || fieldType !== "many2one") {
      _state.relationFieldOptionsByKey[key] = [];
      return null;
    }

    var userContext = rpcUserContext();

    function fallbackSearchRead() {
      return callKw(
        relationModel,
        "search_read",
        [[]],
        {
          fields: ["display_name", "name"],
          limit: 120,
          order: "display_name asc",
          context: userContext,
        }
      )
        .then(function (rows) {
          var options = parseRelationOptionsFromSearchRead(rows);
          _state.relationFieldOptionsByKey[key] = options;
          return options;
        })
        .catch(function () {
          _state.relationFieldOptionsByKey[key] = [];
          return [];
        });
    }

    _state.relationFieldOptionsLoadByKey[key] = callKw(
      relationModel,
      "name_search",
      ["", [], "ilike", 120],
      { context: userContext }
    )
      .then(function (rows) {
        var options = parseRelationOptionsFromNameSearch(rows);
        if (options.length) {
          _state.relationFieldOptionsByKey[key] = options;
          return options;
        }
        return fallbackSearchRead();
      })
      .catch(function () {
        return fallbackSearchRead();
      })
      .finally(function () {
        delete _state.relationFieldOptionsLoadByKey[key];
      });

    return _state.relationFieldOptionsLoadByKey[key];
  }

  v2.ensureRelationFieldOptionsLoaded = ensureRelationFieldOptionsLoaded;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
