te // BEGIN lib/odoo/web/form_section_layout/constants.js
(function (v2) {
  "use strict";
  v2.constants = v2.constants || {};
  var _state = v2.state = v2.state || {};

  v2.COLLAPSIBLE_GROUP_CLASS = "o_lib_collapsible_group";

  v2.COLLAPSED_GROUP_CLASS = "o_lib_section_is_collapsed";

  v2.HEADER_CLASS = "o_lib_section_header";

  v2.BODY_HIDDEN_CLASS = "o_lib_section_body_hidden";

  v2.TOOLBAR_CLASS = "o_lib_section_toolbar";

  v2.TOGGLE_BUTTON_CLASS = "o_lib_section_toggle";

  v2.TOGGLE_ICON_CLASS = "o_lib_section_toggle_icon";

  v2.TOGGLE_LABEL_CLASS = "o_lib_section_toggle_label";

  v2.DRAG_HANDLE_CLASS = "o_lib_section_drag_handle";

  v2.DRAGGING_CLASS = "o_lib_section_dragging";

  v2.DROP_BEFORE_CLASS = "o_lib_section_drop_before";

  v2.DROP_AFTER_CLASS = "o_lib_section_drop_after";

  v2.SECTION_KEY_CLASS_PREFIX = "o_lib_collapsible_key_";

  v2.SECTION_HIDDEN_CLASS = "o_lib_section_hidden";

  v2.SECTION_CONTROLS_VISIBLE_CLASS = "o_lib_section_controls_visible";

  v2.FIELD_HIDDEN_CLASS = "o_lib_field_hidden";

  v2.CHATTER_HOST_SELECTOR =
    ".o-mail-ChatterContainer, .o-mail-Form-chatterContainer, .o_FormRenderer_chatterContainer, .o_ChatterContainer, .o-mail-Form-chatter, .oe_chatter, .o-mail-Chatter";

  v2.CHATTER_SELECTORS = [
    ".o-mail-ChatterContainer",
    ".o-mail-Form-chatterContainer",
    ".o_FormRenderer_chatterContainer",
    ".o_ChatterContainer",
    ".o-mail-Form-chatter",
    ".oe_chatter",
    ".o-mail-Chatter",
  ];

  v2.CHATTER_HIDDEN_CLASS = "o_lib_chatter_hidden";

  v2.FORM_CHATTER_COLLAPSED_CLASS = "o_lib_form_chatter_collapsed";

  v2.BODY_CHATTER_COLLAPSED_CLASS = "o_lib_global_chatter_collapsed";

  v2.CHATTER_PARENT_COLLAPSED_CLASS = "o_lib_chatter_parent_collapsed";

  v2.CHATTER_TOGGLE_ID = "o_lib_global_chatter_toggle";

  v2.CHATTER_TOGGLE_CLASS = "o_lib_chatter_toggle_global";

  v2.CHATTER_TOGGLE_ACTIVE_CLASS = "o_lib_chatter_toggle_is_active";

  v2.CHATTER_TOGGLE_COLLAPSED_CLASS = "o_lib_chatter_toggle_is_collapsed";

  v2.SECTION_SETTINGS_TRIGGER_CLASS = "o_lib_section_settings_trigger";

  v2.SETTINGS_PANEL_ID = "o_lib_form_section_settings_panel";

  v2.SETTINGS_PANEL_OPEN_CLASS = "o_lib_section_settings_open";

  v2.SETTINGS_PANEL_BACKDROP_CLASS = "o_lib_section_settings_backdrop";

  v2.SETTINGS_PANEL_CLOSE_CLASS = "o_lib_section_settings_close";

  v2.SETTINGS_SECTION_ROW_CLASS = "o_lib_settings_section_row";

  v2.SETTINGS_FIELD_ROW_CLASS = "o_lib_settings_field_row";

  v2.LAYOUT_CONTAINER_CLASS = "o_lib_layout_container";

  v2.LAYOUT_ITEM_HIDDEN_CLASS = "o_lib_layout_item_hidden";

  v2.LAYOUT_SETTINGS_TRIGGER_CLASS = "o_lib_layout_settings_trigger";

  v2.STATUSBAR_CONTAINER_CLASS = "o_lib_statusbar_container";

  v2.STATUSBAR_SETTINGS_TRIGGER_CLASS = "o_lib_statusbar_settings_trigger";

  v2.STATUSBAR_FOCUS_PREFIX = "statusbar::";

  v2.SUBTOTAL_CONTAINER_CLASS = "o_lib_subtotal_container";

  v2.SUBTOTAL_CONFIG_TRIGGER_CLASS = "o_lib_subtotal_config_trigger";

  v2.SUBTOTAL_LINES_WRAP_CLASS = "o_lib_subtotal_lines_wrap";

  v2.SUBTOTAL_LINE_ROW_CLASS = "o_lib_subtotal_line_row";

  v2.SUBTOTAL_LINE_LABEL_CLASS = "o_lib_subtotal_line_label";

  v2.SUBTOTAL_LINE_VALUE_CLASS = "o_lib_subtotal_line_value";

  v2.SUBTOTAL_EDIT_MODE_CLASS = "o_lib_subtotal_edit_mode";

  v2.SUBTOTAL_LINE_DRAGGING_CLASS = "o_lib_subtotal_line_dragging";

  v2.SUBTOTAL_LINE_DROP_BEFORE_CLASS = "o_lib_subtotal_line_drop_before";

  v2.SUBTOTAL_LINE_DROP_AFTER_CLASS = "o_lib_subtotal_line_drop_after";

  v2.SUBTOTAL_NATIVE_HIDDEN_CLASS = "o_lib_subtotal_native_hidden";

  v2.SUBTOTAL_EDIT_ACTIONS_CLASS = "o_lib_subtotal_edit_actions";

  v2.SUBTOTAL_ADD_LINE_CLASS = "o_lib_subtotal_add_line";

  v2.SUBTOTAL_INSERT_LINE_CLASS = "o_lib_subtotal_line_insert";

  v2.SUBTOTAL_CONFIG_ACTIVE_CLASS = "o_lib_subtotal_config_is_active";

  v2.SUBTOTAL_RESTORE_TRIGGER_CLASS = "o_lib_subtotal_restore_trigger";

  v2.SUBTOTAL_SAVE_TRIGGER_CLASS = "o_lib_subtotal_save_trigger";

  v2.SUBTOTAL_ERROR_ICON_CLASS = "o_lib_subtotal_error_icon";

  v2.SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS = "o_lib_subtotal_toggle_proxy_hidden";

  v2.SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS = "o_lib_subtotal_toggle_menu_anchor";

  v2.SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS = "o_lib_subtotal_toggle_menu_trigger";

  v2.SUBTOTAL_TOGGLE_MENU_PANEL_CLASS = "o_lib_subtotal_toggle_menu_panel";

  v2.SUBTOTAL_TOGGLE_MENU_ROW_CLASS = "o_lib_subtotal_toggle_menu_row";

  v2.SUBTOTAL_TOGGLE_MENU_LABEL_CLASS = "o_lib_subtotal_toggle_menu_label";

  v2.SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS = "o_lib_subtotal_toggle_menu_checkbox";

  v2.SUBTOTAL_TOGGLE_MENU_OPEN_CLASS = "o_lib_subtotal_toggle_menu_open";

  v2.SETTINGS_ICON_FALLBACK_CLASS = "fa fa-sliders";

  v2.PENCIL_ICON_CLASS = "fa fa-pencil";

  v2.CHECK_ICON_CLASS = "fa fa-check";

  v2.CHATTER_DEFAULT_COLLAPSED = true;

  v2.LOCAL_STORAGE_PREFIX = "odoo.lib.form_section_layout.v2.user_";

  v2.DB_PARAM_PREFIX = "odoo.lib.form_section_layout.v2.user_";

  v2.DB_GLOBAL_PARAM_KEY = "odoo.lib.form_section_layout.v2.global";

  v2.REPORT_SUBTOTAL_DB_PARAM_PREFIX = "odoo.rpp.report_subtotal_layout.v1.user_";

  v2.REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX = "odoo.rpp.report_subtotal_layout.v1.global.";

  v2.ADMIN_GROUP_XMLID = "base.group_system";

  v2.FIELD_DEFINITION_ATTRIBUTES = ["type", "selection", "string", "relation", "readonly"];

  v2.SUBTOTAL_TOGGLE_BY_SOURCE = {
    x_terp_amount: {
      toggleField: "x_terp_enabled",
      tooltip: "Include TERP in calculations, preview, and templates.",
    },
    x_ldw_amount: {
      toggleField: "x_ldw_enabled",
      tooltip: "Include LDW in calculations, preview, and templates.",
    },
  };

  v2.SUBTOTAL_TOGGLE_FIELDS = ["x_terp_enabled", "x_ldw_enabled"];

  v2.SUBTOTAL_REFRESH_FIELDS = [
    "x_terp_enabled",
    "x_ldw_enabled",
    "x_terp_amount",
    "x_ldw_amount",
    "x_delivery_charge",
    "amount_untaxed",
    "amount_tax",
    "amount_total",
  ];

  v2.SUBTOTAL_TOGGLE_MENU_ITEMS = [
    {
      label: "TERP",
      sourceField: "x_terp_amount",
      toggleField: "x_terp_enabled",
    },
    {
      label: "LDW",
      sourceField: "x_ldw_amount",
      toggleField: "x_ldw_enabled",
    },
  ];


})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/constants.js

// BEGIN lib/odoo/web/shared/asset_number_utils.js
(function (root) {
  "use strict";

  function cleanAssetNumberText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function extractAssetNumberValue(rawValue) {
    var raw = cleanAssetNumberText(rawValue);
    if (!raw) {
      return "";
    }
    if (raw.indexOf("|") >= 0) {
      return cleanAssetNumberText(raw.split("|", 1)[0] || "");
    }
    var bracketMatch = raw.match(/^\[([^\]]+)\]/);
    if (bracketMatch && bracketMatch[1]) {
      return cleanAssetNumberText(bracketMatch[1]);
    }
    var dashedParts = raw.split(/\s+-\s+/, 2);
    if (dashedParts.length > 1 && dashedParts[0]) {
      return cleanAssetNumberText(dashedParts[0]);
    }
    if (raw.indexOf(" ") >= 0) {
      var tokenMatch = raw.match(/^([A-Za-z0-9][A-Za-z0-9._/-]*)/);
      if (tokenMatch && tokenMatch[1]) {
        return cleanAssetNumberText(tokenMatch[1]);
      }
    }
    return raw;
  }

  function bindAssetNumberNormalizeObserver(node, scheduleNormalize) {
    if (!(node instanceof HTMLElement) || typeof MutationObserver === "undefined") {
      return;
    }
    if (node.__libAssetNumberObserverBound) {
      return;
    }
    var observer = new MutationObserver(function () {
      scheduleNormalize();
    });
    observer.observe(node, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["value", "title", "class"],
    });
    node.__libAssetNumberObserverBound = true;
    node.__libAssetNumberObserver = observer;
  }

  function setAssetNumberDisplayText(node, nextText) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var normalizedText = cleanAssetNumberText(nextText);
    if (!normalizedText) {
      return;
    }
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var current = walker.nextNode();
    while (current) {
      if (cleanAssetNumberText(current.nodeValue || "")) {
        textNodes.push(current);
      }
      current = walker.nextNode();
    }
    if (!textNodes.length) {
      node.textContent = normalizedText;
      return;
    }
    textNodes[0].nodeValue = normalizedText;
    for (var index = 1; index < textNodes.length; index += 1) {
      textNodes[index].nodeValue = "";
    }
  }

  root.cleanAssetNumberText = cleanAssetNumberText;
  root.extractAssetNumberValue = extractAssetNumberValue;
  root.bindAssetNumberNormalizeObserver = bindAssetNumberNormalizeObserver;
  root.setAssetNumberDisplayText = setAssetNumberDisplayText;
})(window.__o_lib_asset_number_utils_v1 = window.__o_lib_asset_number_utils_v1 || {});
// END lib/odoo/web/shared/asset_number_utils.js

// BEGIN lib/odoo/web/form_section_layout/runtime/api/session_scope.js
(function (v2) {
  "use strict";
  v2.api = v2.api || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/api/session_scope.js

  function getSessionInfo() {
    if (_state.sessionInfo && typeof _state.sessionInfo === "object") {
      return _state.sessionInfo;
    }
    var rootOdoo = window.odoo || {};
    var info = rootOdoo.__session_info__ || rootOdoo.session_info || null;
    if (info && typeof info === "object") {
      _state.sessionInfo = info;
      return info;
    }
    return null;
  }

  v2.getSessionInfo = getSessionInfo;

  async function loadSessionInfo(forceRefresh) {
    if (!forceRefresh) {
      var existing = getSessionInfo();
      if (existing) {
        return existing;
      }
      if (_state.sessionInfoLoadPromise) {
        return _state.sessionInfoLoadPromise;
      }
    }

    _state.sessionInfoLoadPromise = fetch("/web/session/get_session_info", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {},
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("session_http_" + response.status);
        }
        return response.json();
      })
      .then(function (raw) {
        var info =
          raw && typeof raw === "object" && raw.result && typeof raw.result === "object"
            ? raw.result
            : raw && typeof raw === "object"
              ? raw
              : null;
        if (!info || typeof info !== "object") {
          throw new Error("session_info_missing");
        }
        _state.sessionInfo = info;
        var rootOdoo = window.odoo = window.odoo || {};
        rootOdoo.__session_info__ = info;
        rootOdoo.session_info = info;
        return info;
      })
      .catch(function () {
        return getSessionInfo();
      })
      .finally(function () {
        _state.sessionInfoLoadPromise = null;
      });
    return _state.sessionInfoLoadPromise;
  }

  v2.loadSessionInfo = loadSessionInfo;

  function currentUserId() {
    var info = getSessionInfo();
    if (!info || typeof info !== "object") {
      return 0;
    }
    var rawUid = info.uid;
    if (!rawUid && Array.isArray(info.user_id) && info.user_id.length) {
      rawUid = info.user_id[0];
    }
    if (!rawUid && typeof info.user_id === "number") {
      rawUid = info.user_id;
    }
    return Number(rawUid || 0) || 0;
  }

  v2.currentUserId = currentUserId;

  function inferViewIdFromPathname() {
    var pathname = String(window.location.pathname || "");
    if (!pathname) {
      return "";
    }
    var parts = pathname
      .split("/")
      .map(function (part) {
        return cleanText(part || "");
      })
      .filter(function (part) {
        return Boolean(part) && !/^\d+$/.test(part);
      });
    if (!parts.length) {
      return "";
    }
    return "path_" + parts.slice(0, 4).join("_");
  }

  v2.inferViewIdFromPathname = inferViewIdFromPathname;

  function computeScopeKey(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return "unknown_model|unknown_view";
    }

    var model =
      formNode.getAttribute("data-res-model") ||
      formNode.getAttribute("data-model") ||
      formNode.dataset.resModel ||
      formNode.dataset.model ||
      "";

    model = cleanText(model || "");
    if (!model || model === "unknown_model") {
      model = computeModelName(formNode) || "unknown_model";
    }

    var viewId =
      formNode.getAttribute("data-view-id") ||
      formNode.dataset.viewId ||
      "";

    if (!viewId) {
      try {
        var params = new URLSearchParams(window.location.search || "");
        viewId = params.get("view_id") || params.get("action") || "";
      } catch (_err) {
        viewId = "";
      }
    }

    if (!viewId) {
      var match = String(window.location.pathname || "").match(/action-(\d+)/);
      if (match) {
        viewId = "action_" + match[1];
      }
    }

    if (!viewId) {
      viewId = inferViewIdFromPathname() || "unknown_view";
    }

    return String(model || "unknown_model") + "|" + String(viewId || "unknown_view");
  }

  v2.computeScopeKey = computeScopeKey;

  function computeModelName(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return "";
    }
    var readModelFromNode = function (node) {
      if (!(node instanceof HTMLElement)) {
        return "";
      }
      var candidate =
        node.getAttribute("data-res-model") ||
        node.getAttribute("data-model") ||
        node.dataset.resModel ||
        node.dataset.model ||
        "";
      candidate = cleanText(candidate || "");
      if (!candidate || candidate === "unknown_model") {
        return "";
      }
      return candidate;
    };

    var model = readModelFromNode(formNode);
    if (model) {
      return model;
    }

    var ancestorNode = formNode.closest("[data-res-model], [data-model]");
    model = readModelFromNode(ancestorNode);
    if (model) {
      return model;
    }

    var descendantNode = formNode.querySelector("[data-res-model], [data-model]");
    model = readModelFromNode(descendantNode);
    if (model) {
      return model;
    }

    try {
      var hash = String(window.location.hash || "");
      if (hash) {
        var hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        var hashModel = cleanText(hashParams.get("model") || hashParams.get("res_model") || "");
        if (hashModel && hashModel !== "unknown_model") {
          return hashModel;
        }
      }
    } catch (_hashErr) {
      // Ignore malformed hashes.
    }

    var pathname = String(window.location.pathname || "");
    if (/\/odoo\/rental\/\d+(?:\/|$)/.test(pathname)) {
      return "sale.order";
    }

    if (formNode.querySelector("[name='order_line'], [data-name='order_line']")) {
      return "sale.order";
    }
    if (formNode.querySelector("[name='invoice_line_ids'], [data-name='invoice_line_ids']")) {
      return "account.move";
    }
    return "";
  }

  v2.computeModelName = computeModelName;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/api/session_scope.js

// BEGIN lib/odoo/web/form_section_layout/runtime/api/relation_options.js
(function (v2) {
  "use strict";
  v2.api = v2.api || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var callKw = function () { return v2.callKw.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var getSessionInfo = function () { return v2.getSessionInfo.apply(this, arguments); };
  var readLoadedFieldDefinitions = function () { return v2.readLoadedFieldDefinitions.apply(this, arguments); };


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
// END lib/odoo/web/form_section_layout/runtime/api/relation_options.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/state_storage.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var CHATTER_DEFAULT_COLLAPSED = v2.CHATTER_DEFAULT_COLLAPSED;
  var DB_GLOBAL_PARAM_KEY = v2.DB_GLOBAL_PARAM_KEY;
  var DB_PARAM_PREFIX = v2.DB_PARAM_PREFIX;
  var LOCAL_STORAGE_PREFIX = v2.LOCAL_STORAGE_PREFIX;
  var currentUserId = function () { return v2.currentUserId.apply(this, arguments); };
  var dedupeKeys = function () { return v2.dedupeKeys.apply(this, arguments); };


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
    return String(DB_GLOBAL_PARAM_KEY || "odoo.lib.form_section_layout.v2.global");
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
      chatterCollapsed: null,
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
      chatterCollapsed:
        source && typeof source.chatterCollapsed === "boolean" ? source.chatterCollapsed : CHATTER_DEFAULT_COLLAPSED,
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

    if (typeof source.chatterCollapsed === "boolean") {
      parsed.chatterCollapsed = source.chatterCollapsed;
    } else if (source.chatter && typeof source.chatter === "object" && typeof source.chatter.collapsed === "boolean") {
      parsed.chatterCollapsed = source.chatter.collapsed;
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

    if (dbState && typeof dbState.chatterCollapsed === "boolean") {
      merged.chatterCollapsed = dbState.chatterCollapsed;
    }
    if (localState && typeof localState.chatterCollapsed === "boolean") {
      merged.chatterCollapsed = localState.chatterCollapsed;
    }
    if (typeof merged.chatterCollapsed !== "boolean") {
      merged.chatterCollapsed = CHATTER_DEFAULT_COLLAPSED;
    }

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
// END lib/odoo/web/form_section_layout/runtime/ui/state_storage.js

// BEGIN lib/odoo/web/form_section_layout/state.js
(function (v2) {
  "use strict";
  v2.state = v2.state || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var emptyLayoutState = function () { return v2.emptyLayoutState.apply(this, arguments); };


  _state.formLayoutState = emptyLayoutState();

  _state.formLayoutReady = false;

  _state.formLayoutLoadPromise = null;

  _state.formLayoutSavePromise = null;

  _state.formLayoutSaveDirty = false;

  _state.pendingStatePersistOptions = null;

  _state.formCanSaveToDb = false;

  _state.formIsAdminUser = false;

  _state.currentUserGroupIds = [];

  _state.availableRoleOptions = [];

  _state.nativeSettingsIconClass = "";

  _state.systemAdminGroupId = 0;

  _state.userGroupsFieldName = "";

  _state.fieldDefinitionsByModel = {};

  _state.fieldDefinitionsLoadByModel = {};

  _state.relationFieldOptionsByKey = {};

  _state.relationFieldOptionsLoadByKey = {};

  _state.booleanFieldStateCache = {};

  _state.numericFieldValueCache = {};

  _state.subtotalToggleStateLoadByRecord = {};

  _state.subtotalToggleStateSignatureByRecord = {};

  _state.subtotalToggleMenuOpenAnchor = null;

  _state.subtotalToggleMenuHandlersBound = false;


  _state.hoveredSectionGroup = null;

  _state.sectionHoverRuntimeBound = false;

  _state.lastPointerClientX = null;

  _state.lastPointerClientY = null;


  _state.dragSourceGroup = null;

  _state.dragTargetGroup = null;

  _state.dragDropBefore = true;

  _state.settingsPanelState = {
    panelNode: null,
    bodyNode: null,
    currentForm: null,
    currentScopeKey: "",
    focusSectionKey: "",
    focusLayoutKey: "",
  };

  _state.subtotalEditModes = {};

  _state.subtotalEditSnapshots = {};

  _state.subtotalDragState = {
    sourceKey: "",
    targetKey: "",
    dropBefore: true,
  };


  _state.localStorageKey = "";

  _state.dbParamKey = "";

  _state.stateUserId = -1;

  _state.formLayoutReadyUserId = -1;


  _state.refreshScheduled = false;


})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/state.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_loading.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var ADMIN_GROUP_XMLID = v2.ADMIN_GROUP_XMLID;
  var FIELD_DEFINITION_ATTRIBUTES = v2.FIELD_DEFINITION_ATTRIBUTES;
  var SETTINGS_PANEL_OPEN_CLASS = v2.SETTINGS_PANEL_OPEN_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var computeScopeKey = function () { return v2.computeScopeKey.apply(this, arguments); };
  var currentUserId = function () { return v2.currentUserId.apply(this, arguments); };
  var getSessionInfo = function () { return v2.getSessionInfo.apply(this, arguments); };
  var renderSectionSettingsPanel = function () { return v2.renderSectionSettingsPanel.apply(this, arguments); };


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
    var probeKey = "odoo.rpp.layout_probe.user_" + String(uid);
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
// END lib/odoo/web/form_section_layout/runtime/ui/field_loading.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/entry_keys.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var currentLocaleCode = function () { return v2.currentLocaleCode.apply(this, arguments); };


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
// END lib/odoo/web/form_section_layout/runtime/ui/entry_keys.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/action_helpers.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var CHECK_ICON_CLASS = v2.CHECK_ICON_CLASS;
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS;
  var PENCIL_ICON_CLASS = v2.PENCIL_ICON_CLASS;
  var SECTION_KEY_CLASS_PREFIX = v2.SECTION_KEY_CLASS_PREFIX;
  var SETTINGS_ICON_FALLBACK_CLASS = v2.SETTINGS_ICON_FALLBACK_CLASS;
  var SETTINGS_PANEL_ID = v2.SETTINGS_PANEL_ID;
  var SUBTOTAL_CONTAINER_CLASS = v2.SUBTOTAL_CONTAINER_CLASS;


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
// END lib/odoo/web/form_section_layout/runtime/ui/action_helpers.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/visibility_access.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var STATUSBAR_FOCUS_PREFIX = v2.STATUSBAR_FOCUS_PREFIX;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var fieldDefaultEntryKey = function () { return v2.fieldDefaultEntryKey.apply(this, arguments); };
  var fieldVisibilityEntryKey = function () { return v2.fieldVisibilityEntryKey.apply(this, arguments); };
  var layoutDefaultEntryKey = function () { return v2.layoutDefaultEntryKey.apply(this, arguments); };
  var layoutItemVisibilityEntryKey = function () { return v2.layoutItemVisibilityEntryKey.apply(this, arguments); };
  var layoutSettingsRoleEntryKey = function () { return v2.layoutSettingsRoleEntryKey.apply(this, arguments); };
  var sectionSettingsRoleEntryKey = function () { return v2.sectionSettingsRoleEntryKey.apply(this, arguments); };
  var sectionVisibilityEntryKey = function () { return v2.sectionVisibilityEntryKey.apply(this, arguments); };
  var statusbarLabelEntryKey = function () { return v2.statusbarLabelEntryKey.apply(this, arguments); };


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
// END lib/odoo/web/form_section_layout/runtime/ui/visibility_access.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_targets.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS;
  var SECTION_HIDDEN_CLASS = v2.SECTION_HIDDEN_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var prettifyFieldName = function () { return v2.prettifyFieldName.apply(this, arguments); };
  var readLoadedFieldDefinitions = function () { return v2.readLoadedFieldDefinitions.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_targets.js

  function replaceNodeTextContent(node, nextText) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var normalizedText = cleanText(nextText || "");
    if (!normalizedText) {
      return;
    }
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var current = walker.nextNode();
    while (current) {
      if (cleanText(current.nodeValue || "")) {
        textNodes.push(current);
      }
      current = walker.nextNode();
    }
    if (!textNodes.length) {
      node.textContent = normalizedText;
      return;
    }
    textNodes[0].nodeValue = normalizedText;
    for (var index = 1; index < textNodes.length; index += 1) {
      textNodes[index].nodeValue = "";
    }
  }

  v2.replaceNodeTextContent = replaceNodeTextContent;

  function setSectionVisible(groupNode, visible) {
    if (!(groupNode instanceof HTMLElement)) {
      return;
    }
    var shouldShow = Boolean(visible);
    groupNode.classList.toggle(SECTION_HIDDEN_CLASS, !shouldShow);
  }

  v2.setSectionVisible = setSectionVisible;

  function matchesFieldLabel(fieldName, labelNode) {
    if (!(labelNode instanceof HTMLElement)) {
      return false;
    }
    var labelFor = String(labelNode.getAttribute("for") || "");
    if (!fieldName || !labelFor) {
      return false;
    }
    if (labelFor === fieldName) {
      return true;
    }
    return labelFor.endsWith("_" + fieldName);
  }

  v2.matchesFieldLabel = matchesFieldLabel;

  function resolveFieldTargets(groupNode, widgetNode, fieldName) {
    var targets = [];
    var seen = new Set();

    function push(node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (!groupNode.contains(node) || seen.has(node)) {
        return;
      }
      seen.add(node);
      targets.push(node);
    }

    var fieldContainer = widgetNode.closest(".o_cell, .o_wrap_field, .o_td_field, .o_wrap_input, .o_field_widget");
    if (fieldContainer instanceof HTMLElement) {
      push(fieldContainer);
      var previous = fieldContainer.previousElementSibling;
      if (previous instanceof HTMLElement && (previous.querySelector("label") || previous.classList.contains("o_wrap_label"))) {
        push(previous);
      }
    } else {
      push(widgetNode);
    }

    groupNode.querySelectorAll("label").forEach(function (label) {
      if (!matchesFieldLabel(fieldName, label)) {
        return;
      }
      var labelContainer = label.closest(".o_cell, .o_wrap_label, .o_td_label");
      push(labelContainer || label);
    });

    return targets;
  }

  v2.resolveFieldTargets = resolveFieldTargets;

  function detectFieldLabel(groupNode, widgetNode, fieldName) {
    var fieldContainer = widgetNode.closest(".o_cell, .o_wrap_field, .o_td_field, .o_wrap_input");
    if (fieldContainer instanceof HTMLElement) {
      var previous = fieldContainer.previousElementSibling;
      if (previous instanceof HTMLElement) {
        var previousLabel = previous.querySelector("label");
        if (previousLabel instanceof HTMLElement) {
          var previousText = cleanText(previousLabel.textContent || "");
          if (previousText) {
            return previousText;
          }
        }
      }
    }

    var labels = groupNode.querySelectorAll("label");
    for (var i = 0; i < labels.length; i += 1) {
      var label = labels[i];
      if (!matchesFieldLabel(fieldName, label)) {
        continue;
      }
      var labelText = cleanText(label.textContent || "");
      if (labelText) {
        return labelText;
      }
    }

    return prettifyFieldName(fieldName);
  }

  v2.detectFieldLabel = detectFieldLabel;

  function collectSectionFieldMeta(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return [];
    }

    var byFieldKey = new Map();
    var widgets = groupNode.querySelectorAll(".o_field_widget[name], .o_field_widget[data-name]");
    widgets.forEach(function (widget) {
      if (!(widget instanceof HTMLElement)) {
        return;
      }
      if (widget.closest(".o_field_x2many")) {
        return;
      }
      var ownSection = widget.closest("." + COLLAPSIBLE_GROUP_CLASS);
      if (ownSection !== groupNode) {
        return;
      }
      var fieldName = cleanText(widget.getAttribute("name") || widget.dataset.name || "");
      if (!fieldName) {
        return;
      }
      var fieldKey = normalizeKey(fieldName) || fieldName;
      if (!byFieldKey.has(fieldKey)) {
        byFieldKey.set(fieldKey, {
          key: fieldKey,
          name: fieldName,
          label: detectFieldLabel(groupNode, widget, fieldName),
          widgets: [],
          targets: [],
        });
      }
      var entry = byFieldKey.get(fieldKey);
      entry.widgets.push(widget);
    });

    byFieldKey.forEach(function (entry) {
      var targets = [];
      var seen = new Set();
      entry.widgets.forEach(function (widget) {
        resolveFieldTargets(groupNode, widget, entry.name).forEach(function (node) {
          if (seen.has(node)) {
            return;
          }
          seen.add(node);
          targets.push(node);
        });
      });
      entry.targets = targets;
    });

    return Array.from(byFieldKey.values());
  }

  v2.collectSectionFieldMeta = collectSectionFieldMeta;

  function backendFieldMetaFor(formNode, fieldMeta) {
    if (!(formNode instanceof HTMLElement) || !fieldMeta) {
      return null;
    }
    var fieldName = cleanText(fieldMeta.name || "");
    if (!fieldName) {
      return null;
    }
    var modelName = computeModelName(formNode);
    if (!modelName) {
      return null;
    }
    var definitions = readLoadedFieldDefinitions(modelName);
    var meta = definitions[fieldName];
    if (!meta || typeof meta !== "object") {
      return null;
    }
    return meta;
  }

  v2.backendFieldMetaFor = backendFieldMetaFor;

  function widgetHasEditableControl(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return false;
    }
    if (
      widgetNode.classList.contains("o_readonly_modifier") ||
      widgetNode.getAttribute("readonly") === "1" ||
      widgetNode.getAttribute("readonly") === "true" ||
      widgetNode.getAttribute("aria-readonly") === "true"
    ) {
      return false;
    }

    var controls = widgetNode.querySelectorAll("select, input:not([type='hidden']), textarea");
    for (var i = 0; i < controls.length; i += 1) {
      var control = controls[i];
      if (
        !(control instanceof HTMLInputElement) &&
        !(control instanceof HTMLSelectElement) &&
        !(control instanceof HTMLTextAreaElement)
      ) {
        continue;
      }
      if (control.disabled || control.closest(".o_readonly_modifier")) {
        continue;
      }
      if (control instanceof HTMLInputElement) {
        var inputType = cleanText(control.type || "").toLowerCase();
        if (control.readOnly && inputType !== "checkbox" && inputType !== "radio") {
          continue;
        }
      }
      return true;
    }

    return widgetNode.querySelector("[contenteditable='true']") instanceof HTMLElement;
  }

  v2.widgetHasEditableControl = widgetHasEditableControl;

  function fieldAllowsDefaultEditor(formNode, fieldMeta, backendMeta) {
    var meta = backendMeta || backendFieldMetaFor(formNode, fieldMeta);
    if (meta && meta.readonly) {
      return false;
    }
    if (!fieldMeta || !Array.isArray(fieldMeta.widgets) || !fieldMeta.widgets.length) {
      return false;
    }
    return fieldMeta.widgets.some(function (widgetNode) {
      return widgetHasEditableControl(widgetNode);
    });
  }

  v2.fieldAllowsDefaultEditor = fieldAllowsDefaultEditor;

  function findFieldInputOnWidget(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return null;
    }
    var inputNode = widgetNode.querySelector("select, input:not([type='hidden']), textarea");
    if (
      inputNode instanceof HTMLSelectElement ||
      inputNode instanceof HTMLInputElement ||
      inputNode instanceof HTMLTextAreaElement
    ) {
      return inputNode;
    }
    return null;
  }

  v2.findFieldInputOnWidget = findFieldInputOnWidget;

  function collectSelectOptions(selectNode) {
    if (!(selectNode instanceof HTMLSelectElement)) {
      return [];
    }
    var options = [];
    var seen = new Set();
    selectNode.querySelectorAll("option").forEach(function (optionNode) {
      if (!(optionNode instanceof HTMLOptionElement)) {
        return;
      }
      var rawValue = String(optionNode.value || "");
      var value = rawValue;
      var label = cleanText(optionNode.textContent || "");
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

  v2.collectSelectOptions = collectSelectOptions;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/field_targets.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_editor_meta.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var backendFieldMetaFor = function () { return v2.backendFieldMetaFor.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectSelectOptions = function () { return v2.collectSelectOptions.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var findFieldInputOnWidget = function () { return v2.findFieldInputOnWidget.apply(this, arguments); };
  var readRelationFieldOptions = function () { return v2.readRelationFieldOptions.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_editor_meta.js

  function inferFieldDefaultEditorMetaFromDom(fieldMeta) {
    var fallback = { kind: "text", options: [] };
    if (!fieldMeta || !Array.isArray(fieldMeta.widgets)) {
      return fallback;
    }

    for (var i = 0; i < fieldMeta.widgets.length; i += 1) {
      var widgetNode = fieldMeta.widgets[i];
      if (!(widgetNode instanceof HTMLElement)) {
        continue;
      }

      if (widgetNode.classList.contains("o_field_many2one")) {
        return { kind: "many2one", options: [] };
      }
      if (widgetNode.classList.contains("o_field_text") || widgetNode.classList.contains("o_field_html")) {
        return { kind: "textarea", options: [] };
      }
      if (widgetNode.classList.contains("o_field_date")) {
        return { kind: "date", options: [] };
      }
      if (widgetNode.classList.contains("o_field_datetime")) {
        return { kind: "datetime", options: [] };
      }
      if (widgetNode.classList.contains("o_field_boolean")) {
        return {
          kind: "boolean",
          options: [
            { value: "true", label: "True" },
            { value: "false", label: "False" },
          ],
        };
      }
      if (
        widgetNode.classList.contains("o_field_integer") ||
        widgetNode.classList.contains("o_field_float") ||
        widgetNode.classList.contains("o_field_monetary")
      ) {
        return { kind: "number", options: [] };
      }

      var inputNode = findFieldInputOnWidget(widgetNode);
      if (!(inputNode instanceof HTMLElement)) {
        continue;
      }
      if (inputNode instanceof HTMLSelectElement) {
        return {
          kind: "select",
          options: collectSelectOptions(inputNode),
        };
      }
      if (inputNode instanceof HTMLTextAreaElement) {
        return { kind: "textarea", options: [] };
      }
      if (inputNode instanceof HTMLInputElement) {
        var inputType = cleanText(inputNode.type || "").toLowerCase();
        if (inputType === "checkbox") {
          return {
            kind: "boolean",
            options: [
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ],
          };
        }
        if (inputType === "date") {
          return { kind: "date", options: [] };
        }
        if (inputType === "datetime-local") {
          return { kind: "datetime", options: [] };
        }
        if (inputType === "number") {
          return { kind: "number", options: [] };
        }
      }
    }

    return fallback;
  }

  v2.inferFieldDefaultEditorMetaFromDom = inferFieldDefaultEditorMetaFromDom;

  function mapBackendFieldTypeToEditorMeta(fieldType, selectionOptions) {
    var typeName = cleanText(fieldType || "").toLowerCase();
    if (typeName === "many2one") {
      return { kind: "many2one", options: [] };
    }
    if (typeName === "selection") {
      return {
        kind: "select",
        options: Array.isArray(selectionOptions) ? selectionOptions : [],
      };
    }
    if (typeName === "boolean") {
      return {
        kind: "boolean",
        options: [
          { value: "true", label: "True" },
          { value: "false", label: "False" },
        ],
      };
    }
    if (typeName === "date") {
      return { kind: "date", options: [] };
    }
    if (typeName === "datetime") {
      return { kind: "datetime", options: [] };
    }
    if (typeName === "text" || typeName === "html") {
      return { kind: "textarea", options: [] };
    }
    if (typeName === "integer" || typeName === "float" || typeName === "monetary") {
      return { kind: "number", options: [] };
    }
    return { kind: "text", options: [] };
  }

  v2.mapBackendFieldTypeToEditorMeta = mapBackendFieldTypeToEditorMeta;

  function inferFieldDefaultEditorMeta(formNode, fieldMeta) {
    var domMeta = inferFieldDefaultEditorMetaFromDom(fieldMeta);
    if (!fieldMeta) {
      return domMeta;
    }
    var backendMeta = backendFieldMetaFor(formNode, fieldMeta);
    if (!backendMeta || typeof backendMeta !== "object") {
      return domMeta;
    }

    var mapped = mapBackendFieldTypeToEditorMeta(backendMeta.type, backendMeta.selection);
    if (mapped.kind === "many2one") {
      var modelName = computeModelName(formNode);
      mapped.options = readRelationFieldOptions(modelName, fieldMeta.name);
    }
    if (mapped.kind === "select" && !mapped.options.length && domMeta.kind === "select") {
      mapped.options = Array.isArray(domMeta.options) ? domMeta.options : [];
    }
    if (mapped.kind === "text" && domMeta.kind !== "text") {
      return domMeta;
    }
    return mapped;
  }

  v2.inferFieldDefaultEditorMeta = inferFieldDefaultEditorMeta;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/field_editor_meta.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_editor_runtime.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var FIELD_HIDDEN_CLASS = v2.FIELD_HIDDEN_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectSectionFieldMeta = function () { return v2.collectSectionFieldMeta.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var fieldDefaultValue = function () { return v2.fieldDefaultValue.apply(this, arguments); };
  var fieldIsVisible = function () { return v2.fieldIsVisible.apply(this, arguments); };
  var inferFieldDefaultEditorMeta = function () { return v2.inferFieldDefaultEditorMeta.apply(this, arguments); };
  var searchRelationFieldOptions = function () { return v2.searchRelationFieldOptions.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_editor_runtime.js

  function createFieldDefaultEditor(formNode, fieldMeta, defaultValue) {
    var editorMeta = inferFieldDefaultEditorMeta(formNode, fieldMeta);
    var valueSeed = String(defaultValue || "").trim();

    if (editorMeta.kind === "boolean") {
      var normalized = cleanText(valueSeed).toLowerCase();
      var currentValue = "";
      if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
        currentValue = "true";
      } else if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
        currentValue = "false";
      }

      var group = document.createElement("div");
      group.className = "o_lib_settings_default_choice_group";
      group.setAttribute("data-lib-role", "field-default");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Default boolean value");

      var optionsBool = [
        { value: "", label: "none" },
        { value: "true", label: "true" },
        { value: "false", label: "false" },
      ];

      function applySelectedState() {
        group.querySelectorAll("button[data-lib-value]").forEach(function (buttonNode) {
          if (!(buttonNode instanceof HTMLButtonElement)) {
            return;
          }
          var isActive = String(buttonNode.dataset.libValue || "") === currentValue;
          buttonNode.classList.toggle("o_lib_settings_choice_active", isActive);
          buttonNode.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      }

      optionsBool.forEach(function (item) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "o_lib_settings_choice_btn";
        btn.dataset.libValue = String(item.value || "");
        btn.textContent = item.label;
        btn.addEventListener("click", function () {
          var nextValue = String(btn.dataset.libValue || "");
          if (nextValue === currentValue) {
            return;
          }
          currentValue = nextValue;
          applySelectedState();
          group.dispatchEvent(new Event("change", { bubbles: true }));
        });
        group.appendChild(btn);
      });

      applySelectedState();
      return {
        kind: "boolean",
        node: group,
        readValue: function () {
          return currentValue;
        },
      };
    }

    if (editorMeta.kind === "many2one") {
      var picker = document.createElement("div");
      picker.className = "o_lib_settings_m2o_picker";
      picker.setAttribute("data-lib-role", "field-default");

      var pickerInput = document.createElement("input");
      pickerInput.type = "text";
      pickerInput.className = "o_lib_settings_default_input";
      pickerInput.placeholder = "Search...";
      pickerInput.autocomplete = "off";
      pickerInput.value = valueSeed;
      picker.appendChild(pickerInput);

      var pickerDropdown = document.createElement("div");
      pickerDropdown.className = "o_lib_settings_m2o_dropdown";
      pickerDropdown.hidden = true;
      picker.appendChild(pickerDropdown);

      var optionsCache = Array.isArray(editorMeta.options) ? editorMeta.options.slice(0) : [];
      var searchTimer = null;
      var closedByBlur = false;

      function closeDropdown() {
        picker.classList.remove("o_lib_settings_m2o_open");
        pickerDropdown.hidden = true;
      }

      function openDropdown() {
        picker.classList.add("o_lib_settings_m2o_open");
        pickerDropdown.hidden = false;
      }

      function renderMany2oneOptions(options, queryText) {
        pickerDropdown.innerHTML = "";
        var rows = Array.isArray(options) ? options : [];
        if (!rows.length) {
          var emptyNode = document.createElement("div");
          emptyNode.className = "o_lib_settings_m2o_empty";
          emptyNode.textContent = "No records";
          pickerDropdown.appendChild(emptyNode);
        } else {
          rows.forEach(function (item) {
            var label = cleanText((item && item.label) || (item && item.value) || "");
            if (!label) {
              return;
            }
            var optionNode = document.createElement("button");
            optionNode.type = "button";
            optionNode.className = "o_lib_settings_m2o_option";
            optionNode.textContent = label;
            optionNode.addEventListener("mousedown", function (event) {
              event.preventDefault();
            });
            optionNode.addEventListener("click", function () {
              pickerInput.value = label;
              closeDropdown();
              picker.dispatchEvent(new Event("change", { bubbles: true }));
            });
            pickerDropdown.appendChild(optionNode);
          });
        }

        var searchMore = document.createElement("button");
        searchMore.type = "button";
        searchMore.className = "o_lib_settings_m2o_more";
        searchMore.textContent = "Search more...";
        searchMore.addEventListener("mousedown", function (event) {
          event.preventDefault();
        });
        searchMore.addEventListener("click", function () {
          searchRelationFieldOptions(
            computeModelName(formNode),
            fieldMeta && fieldMeta.name,
            queryText || pickerInput.value,
            400,
            fieldMeta
          ).then(function (results) {
            optionsCache = Array.isArray(results) ? results : [];
            renderMany2oneOptions(optionsCache, queryText || pickerInput.value);
            openDropdown();
          });
        });
        pickerDropdown.appendChild(searchMore);
      }

      function loadAndRenderMany2oneOptions(queryText) {
        var modelName = computeModelName(formNode);
        if (!modelName || !(fieldMeta && fieldMeta.name)) {
          renderMany2oneOptions(optionsCache, queryText);
          openDropdown();
          return;
        }
        searchRelationFieldOptions(modelName, fieldMeta.name, queryText, 120, fieldMeta).then(function (results) {
          optionsCache = Array.isArray(results) ? results : [];
          renderMany2oneOptions(optionsCache, queryText);
          openDropdown();
        });
      }

      pickerInput.addEventListener("focus", function () {
        if (optionsCache.length) {
          renderMany2oneOptions(optionsCache, pickerInput.value);
          openDropdown();
        } else {
          loadAndRenderMany2oneOptions(pickerInput.value);
        }
      });

      pickerInput.addEventListener("input", function () {
        if (searchTimer) {
          window.clearTimeout(searchTimer);
        }
        var query = pickerInput.value;
        searchTimer = window.setTimeout(function () {
          loadAndRenderMany2oneOptions(query);
        }, 140);
      });

      pickerInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeDropdown();
          return;
        }
        if (event.key === "ArrowDown" && pickerDropdown.hidden) {
          loadAndRenderMany2oneOptions(pickerInput.value);
        }
      });

      pickerInput.addEventListener("blur", function () {
        closedByBlur = true;
        window.setTimeout(function () {
          if (!closedByBlur) {
            return;
          }
          closeDropdown();
          picker.dispatchEvent(new Event("change", { bubbles: true }));
        }, 130);
      });

      pickerDropdown.addEventListener("mousedown", function () {
        closedByBlur = false;
      });
      pickerDropdown.addEventListener("mouseup", function () {
        window.setTimeout(function () {
          closedByBlur = true;
        }, 0);
      });

      return {
        kind: "many2one",
        node: picker,
        readValue: function () {
          return cleanText(pickerInput.value);
        },
      };
    }

    if (editorMeta.kind === "select") {
      var select = document.createElement("select");
      select.className = "o_lib_settings_default_input";
      select.setAttribute("data-lib-role", "field-default");

      var emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "-- No default --";
      select.appendChild(emptyOption);

      var options = Array.isArray(editorMeta.options) ? editorMeta.options : [];
      options.forEach(function (item) {
        var option = document.createElement("option");
        option.value = String((item && item.value) || "");
        option.textContent = cleanText((item && item.label) || option.value || "");
        if (!option.textContent) {
          option.textContent = option.value || "(empty)";
        }
        select.appendChild(option);
      });

      var matchedByValue = options.some(function (item) {
        return String((item && item.value) || "") === valueSeed;
      });
      if (!matchedByValue && valueSeed) {
        var matchedByLabel = options.find(function (item) {
          return cleanText((item && item.label) || "") === valueSeed;
        });
        if (matchedByLabel) {
          valueSeed = String(matchedByLabel.value || "");
          matchedByValue = true;
        }
      }

      if (!matchedByValue && valueSeed) {
        var customOption = document.createElement("option");
        customOption.value = valueSeed;
        customOption.textContent = valueSeed;
        select.appendChild(customOption);
      }
      select.value = matchedByValue || valueSeed ? valueSeed : "";

      return {
        kind: editorMeta.kind,
        node: select,
        readValue: function () {
          return String(select.value || "").trim();
        },
      };
    }

    if (editorMeta.kind === "textarea") {
      var textarea = document.createElement("textarea");
      textarea.className = "o_lib_settings_default_input o_lib_settings_default_textarea";
      textarea.setAttribute("data-lib-role", "field-default");
      textarea.placeholder = "Default value";
      textarea.value = valueSeed;
      return {
        kind: "textarea",
        node: textarea,
        readValue: function () {
          return String(textarea.value || "").trim();
        },
      };
    }

    var input = document.createElement("input");
    input.className = "o_lib_settings_default_input";
    input.setAttribute("data-lib-role", "field-default");
    input.placeholder = "Default value";
    input.value = valueSeed;

    if (editorMeta.kind === "date") {
      input.type = "date";
    } else if (editorMeta.kind === "datetime") {
      input.type = "datetime-local";
    } else if (editorMeta.kind === "number") {
      input.type = "number";
      input.step = "any";
    } else {
      input.type = "text";
    }

    return {
      kind: editorMeta.kind || "text",
      node: input,
      readValue: function () {
        return String(input.value || "").trim();
      },
    };
  }

  v2.createFieldDefaultEditor = createFieldDefaultEditor;

  function updateFieldDefaultExpandedState(toggleButton, detailsNode, expanded) {
    if (!(toggleButton instanceof HTMLElement) || !(detailsNode instanceof HTMLElement)) {
      return;
    }
    var isExpanded = Boolean(expanded);
    detailsNode.hidden = !isExpanded;
    toggleButton.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    toggleButton.textContent = isExpanded ? "v" : ">";
  }

  v2.updateFieldDefaultExpandedState = updateFieldDefaultExpandedState;

  function setFieldMetaVisible(fieldMeta, visible) {
    if (!fieldMeta || !Array.isArray(fieldMeta.targets)) {
      return;
    }
    var shouldShow = Boolean(visible);
    fieldMeta.targets.forEach(function (targetNode) {
      if (!(targetNode instanceof HTMLElement)) {
        return;
      }
      targetNode.classList.toggle(FIELD_HIDDEN_CLASS, !shouldShow);
    });
  }

  v2.setFieldMetaVisible = setFieldMetaVisible;

  function parseBooleanValue(rawValue) {
    var normalized = cleanText(rawValue).toLowerCase();
    if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
      return false;
    }
    return null;
  }

  v2.parseBooleanValue = parseBooleanValue;

  function isMany2xWidget(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return false;
    }
    return (
      widgetNode.classList.contains("o_field_many2many") ||
      widgetNode.classList.contains("o_field_one2many")
    );
  }

  v2.isMany2xWidget = isMany2xWidget;

  function applyDefaultValueOnWidget(widgetNode, defaultValue) {
    if (!(widgetNode instanceof HTMLElement) || isMany2xWidget(widgetNode)) {
      return;
    }
    var valueToApply = cleanText(defaultValue);
    if (!valueToApply) {
      return;
    }

    var fieldInput = widgetNode.querySelector("input:not([type='hidden']), textarea, select");
    if (
      !(fieldInput instanceof HTMLInputElement) &&
      !(fieldInput instanceof HTMLTextAreaElement) &&
      !(fieldInput instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (fieldInput instanceof HTMLInputElement && fieldInput.type === "checkbox") {
      var boolValue = parseBooleanValue(valueToApply);
      if (boolValue === null || fieldInput.checked === boolValue) {
        return;
      }
      fieldInput.checked = boolValue;
      fieldInput.dispatchEvent(new Event("input", { bubbles: true }));
      fieldInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    var currentValue = String(fieldInput.value || "");
    if (cleanText(currentValue)) {
      return;
    }
    fieldInput.value = valueToApply;
    fieldInput.dispatchEvent(new Event("input", { bubbles: true }));
    fieldInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  v2.applyDefaultValueOnWidget = applyDefaultValueOnWidget;

  function applySectionFieldLayout(groupNode, scopeKey, sectionKey) {
    var fieldMetas = collectSectionFieldMeta(groupNode);
    groupNode.__libFieldMeta = fieldMetas;

    fieldMetas.forEach(function (fieldMeta) {
      var visible = fieldIsVisible(scopeKey, sectionKey, fieldMeta.key);
      setFieldMetaVisible(fieldMeta, visible);
      var defaultValue = fieldDefaultValue(scopeKey, sectionKey, fieldMeta.key);
      if (!defaultValue) {
        return;
      }
      fieldMeta.widgets.forEach(function (widgetNode) {
        applyDefaultValueOnWidget(widgetNode, defaultValue);
      });
    });
  }

  v2.applySectionFieldLayout = applySectionFieldLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/field_editor_runtime.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/layouts.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var LAYOUT_CONTAINER_CLASS = v2.LAYOUT_CONTAINER_CLASS;
  var LAYOUT_ITEM_HIDDEN_CLASS = v2.LAYOUT_ITEM_HIDDEN_CLASS;
  var LAYOUT_SETTINGS_TRIGGER_CLASS = v2.LAYOUT_SETTINGS_TRIGGER_CLASS;
  var SECTION_SETTINGS_TRIGGER_CLASS = v2.SECTION_SETTINGS_TRIGGER_CLASS;
  var applySettingsTriggerIcon = function () { return v2.applySettingsTriggerIcon.apply(this, arguments); };
  var canAccessLayoutSettings = function () { return v2.canAccessLayoutSettings.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var layoutDefaultItemKey = function () { return v2.layoutDefaultItemKey.apply(this, arguments); };
  var layoutItemIsVisible = function () { return v2.layoutItemIsVisible.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var openSectionSettingsPanel = function () { return v2.openSectionSettingsPanel.apply(this, arguments); };


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
// END lib/odoo/web/form_section_layout/runtime/ui/layouts.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/statusbar.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var STATUSBAR_CONTAINER_CLASS = v2.STATUSBAR_CONTAINER_CLASS;
  var STATUSBAR_FOCUS_PREFIX = v2.STATUSBAR_FOCUS_PREFIX;
  var STATUSBAR_SETTINGS_TRIGGER_CLASS = v2.STATUSBAR_SETTINGS_TRIGGER_CLASS;
  var applySettingsTriggerIcon = function () { return v2.applySettingsTriggerIcon.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var extractLayoutItemLabel = function () { return v2.extractLayoutItemLabel.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var openSectionSettingsPanel = function () { return v2.openSectionSettingsPanel.apply(this, arguments); };
  var prettifyFieldName = function () { return v2.prettifyFieldName.apply(this, arguments); };
  var replaceNodeTextContent = function () { return v2.replaceNodeTextContent.apply(this, arguments); };
  var statusbarLabelValue = function () { return v2.statusbarLabelValue.apply(this, arguments); };


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
// END lib/odoo/web/form_section_layout/runtime/ui/statusbar.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_shell.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SETTINGS_PANEL_BACKDROP_CLASS = v2.SETTINGS_PANEL_BACKDROP_CLASS;
  var SETTINGS_PANEL_CLOSE_CLASS = v2.SETTINGS_PANEL_CLOSE_CLASS;
  var SETTINGS_PANEL_ID = v2.SETTINGS_PANEL_ID;
  var SETTINGS_PANEL_OPEN_CLASS = v2.SETTINGS_PANEL_OPEN_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectLayoutContainers = function () { return v2.collectLayoutContainers.apply(this, arguments); };
  var findSectionHeader = function () { return v2.findSectionHeader.apply(this, arguments); };
  var getSectionGroups = function () { return v2.getSectionGroups.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/settings_panel_shell.js

  function closeSectionSettingsPanel() {
    if (!(_state.settingsPanelState.panelNode instanceof HTMLElement)) {
      return;
    }
    _state.settingsPanelState.panelNode.classList.remove(SETTINGS_PANEL_OPEN_CLASS);
    _state.settingsPanelState.currentForm = null;
    _state.settingsPanelState.currentScopeKey = "";
    _state.settingsPanelState.focusSectionKey = "";
    _state.settingsPanelState.focusLayoutKey = "";
  }

  v2.closeSectionSettingsPanel = closeSectionSettingsPanel;

  function ensureSectionSettingsPanel() {
    var cachedPanel = _state.settingsPanelState.panelNode;
    var cachedBody = _state.settingsPanelState.bodyNode;
    var cachedPanelIsConnected =
      cachedPanel instanceof HTMLElement &&
      document.body instanceof HTMLElement &&
      document.body.contains(cachedPanel);

    if (
      cachedPanelIsConnected &&
      cachedBody instanceof HTMLElement &&
      cachedPanel.contains(cachedBody)
    ) {
      return cachedPanel;
    }

    _state.settingsPanelState.panelNode = null;
    _state.settingsPanelState.bodyNode = null;

    var panel = document.createElement("div");
    panel.id = SETTINGS_PANEL_ID;
    panel.className = "o_lib_section_settings_panel";
    panel.innerHTML =
      '<div class="' +
      SETTINGS_PANEL_BACKDROP_CLASS +
      '"></div>' +
      '<div class="o_lib_section_settings_dialog">' +
      '  <div class="o_lib_section_settings_header">' +
      '    <strong class="o_lib_section_settings_title">Section Settings</strong>' +
      '    <button type="button" class="' +
      SETTINGS_PANEL_CLOSE_CLASS +
      '" aria-label="Close">x</button>' +
      "  </div>" +
      '  <div class="o_lib_section_settings_body"></div>' +
      "</div>";

    panel.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.classList.contains(SETTINGS_PANEL_BACKDROP_CLASS) || target.classList.contains(SETTINGS_PANEL_CLOSE_CLASS)) {
        closeSectionSettingsPanel();
      }
    });

    document.body.appendChild(panel);
    _state.settingsPanelState.panelNode = panel;
    _state.settingsPanelState.bodyNode = panel.querySelector(".o_lib_section_settings_body");
    return panel;
  }

  v2.ensureSectionSettingsPanel = ensureSectionSettingsPanel;

  function resolveSectionDisplayLabel(formNode, sectionKey) {
    if (!(formNode instanceof HTMLElement) || !sectionKey) {
      return "";
    }
    var groups = getSectionGroups(formNode);
    for (var i = 0; i < groups.length; i += 1) {
      var group = groups[i];
      if (!(group instanceof HTMLElement)) {
        continue;
      }
      var key = cleanText(group.dataset.libSectionKey || "");
      if (key !== sectionKey) {
        continue;
      }
      var headerNode = findSectionHeader(group);
      return cleanText(
        (headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel) ||
        (headerNode && headerNode.textContent) ||
        sectionKey
      );
    }
    return sectionKey;
  }

  v2.resolveSectionDisplayLabel = resolveSectionDisplayLabel;

  function resolveLayoutDisplayLabel(formNode, scopeKey, layoutKey) {
    if (!(formNode instanceof HTMLElement) || !layoutKey) {
      return "";
    }
    var metas = Array.isArray(formNode.__libLayoutMeta) ? formNode.__libLayoutMeta : collectLayoutContainers(formNode, scopeKey);
    for (var i = 0; i < metas.length; i += 1) {
      var meta = metas[i];
      var key = cleanText((meta && meta.key) || "");
      if (key === layoutKey) {
        return cleanText((meta && meta.label) || layoutKey);
      }
    }
    return layoutKey;
  }

  v2.resolveLayoutDisplayLabel = resolveLayoutDisplayLabel;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_shell.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_context.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function resolveSettingsPanelFocusState(focusSectionKey, focusLayoutKey) {
    var activeSectionKey = v2.cleanText(
      typeof focusSectionKey === "string" ? focusSectionKey : _state.settingsPanelState.focusSectionKey || ""
    );
    var activeLayoutCandidate = v2.cleanText(
      typeof focusLayoutKey === "string" ? focusLayoutKey : _state.settingsPanelState.focusLayoutKey || ""
    );
    var activeStatusbarKey = "";
    var activeLayoutKey = activeLayoutCandidate;
    if (activeLayoutKey && activeLayoutKey.indexOf(v2.STATUSBAR_FOCUS_PREFIX) === 0) {
      activeStatusbarKey = v2.cleanText(activeLayoutKey.slice(v2.STATUSBAR_FOCUS_PREFIX.length));
      activeLayoutKey = "";
    }
    if (activeSectionKey) {
      activeLayoutKey = "";
      activeStatusbarKey = "";
    }
    return {
      activeSectionKey: activeSectionKey,
      activeLayoutKey: activeLayoutKey,
      activeStatusbarKey: activeStatusbarKey,
    };
  }

  settingsPanelRuntime.resolveSettingsPanelFocusState = resolveSettingsPanelFocusState;

  function resolveSettingsPanelTitle(formNode, scopeKey, focusState) {
    var activeSectionKey = v2.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = v2.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = v2.cleanText((focusState && focusState.activeStatusbarKey) || "");
    var panelTitle = "Section Settings";

    if (activeSectionKey) {
      var sectionTitle = v2.resolveSectionDisplayLabel(formNode, activeSectionKey);
      if (sectionTitle) {
        return sectionTitle + " settings";
      }
      return panelTitle;
    }
    if (activeLayoutKey) {
      var layoutTitle = v2.resolveLayoutDisplayLabel(formNode, scopeKey, activeLayoutKey);
      if (layoutTitle) {
        return layoutTitle + " settings";
      }
      return panelTitle;
    }
    if (!activeStatusbarKey) {
      return panelTitle;
    }

    var statusbarTitle = "Statusbar labels";
    var knownStatusbars = Array.isArray(formNode.__libStatusbarMeta)
      ? formNode.__libStatusbarMeta
      : v2.collectStatusbarMetas(formNode, scopeKey);
    for (var statusbarIndex = 0; statusbarIndex < knownStatusbars.length; statusbarIndex += 1) {
      var statusbarMeta = knownStatusbars[statusbarIndex];
      if (v2.cleanText((statusbarMeta && statusbarMeta.key) || "") === activeStatusbarKey) {
        statusbarTitle = v2.cleanText((statusbarMeta && statusbarMeta.label) || statusbarTitle);
        break;
      }
    }
    return statusbarTitle + " settings";
  }

  settingsPanelRuntime.resolveSettingsPanelTitle = resolveSettingsPanelTitle;

  function scrollSettingsPanelToFocus(focusState, sectionRows, layoutRows, statusbarRows) {
    var activeSectionKey = v2.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = v2.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = v2.cleanText((focusState && focusState.activeStatusbarKey) || "");

    if (activeSectionKey) {
      var focusedSection = (sectionRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libSectionKey || "") === activeSectionKey;
      });
      if (focusedSection instanceof HTMLElement) {
        focusedSection.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (activeLayoutKey) {
      var focusedLayout = (layoutRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libLayoutKey || "") === activeLayoutKey;
      });
      if (focusedLayout instanceof HTMLElement) {
        focusedLayout.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (!activeStatusbarKey) {
      return;
    }
    var focusedStatusbar = (statusbarRows || []).find(function (rowNode) {
      return String(rowNode.dataset.libStatusbarKey || "") === activeStatusbarKey;
    });
    if (focusedStatusbar instanceof HTMLElement) {
      focusedStatusbar.scrollIntoView({ block: "nearest" });
    }
  }

  settingsPanelRuntime.scrollSettingsPanelToFocus = scrollSettingsPanelToFocus;

  function rerenderSettingsPanelAfterRelationLoads(formNode, scopeKey, pendingRelationOptionsLoads) {
    if (!Array.isArray(pendingRelationOptionsLoads) || !pendingRelationOptionsLoads.length) {
      return;
    }
    Promise.all(pendingRelationOptionsLoads)
      .then(function () {
        if (
          _state.settingsPanelState.currentForm === formNode &&
          _state.settingsPanelState.panelNode instanceof HTMLElement &&
          _state.settingsPanelState.panelNode.classList.contains(v2.SETTINGS_PANEL_OPEN_CLASS)
        ) {
          v2.renderSectionSettingsPanel(
            formNode,
            scopeKey,
            _state.settingsPanelState.focusSectionKey || "",
            _state.settingsPanelState.focusLayoutKey || ""
          );
        }
      })
      .catch(function () {
        // Keep current panel state if relation options cannot be loaded.
      });
  }

  settingsPanelRuntime.rerenderSettingsPanelAfterRelationLoads = rerenderSettingsPanelAfterRelationLoads;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_context.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_roles.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function collectRoleIdsFromList(listNode) {
    var selected = [];
    listNode.querySelectorAll("input[type='checkbox']").forEach(function (checkbox) {
      if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) {
        return;
      }
      var roleId = Number(checkbox.value || 0);
      if (roleId > 0 && selected.indexOf(roleId) < 0) {
        selected.push(roleId);
      }
    });
    return selected;
  }

  function createSettingsRoleSelector(options) {
    var config = options && typeof options === "object" ? options : {};
    var rolesWrap = document.createElement("div");
    rolesWrap.className = "o_lib_settings_roles_wrap";

    var rolesTitle = document.createElement("div");
    rolesTitle.className = "o_lib_settings_roles_title";
    rolesTitle.textContent = v2.cleanText(config.title || "Roles for settings button (admin always allowed)");
    rolesWrap.appendChild(rolesTitle);

    var selectedRoleIds = Array.isArray(config.selectedRoleIds) ? config.selectedRoleIds : [];
    if (!_state.formIsAdminUser) {
      var rolesReadonly = document.createElement("div");
      rolesReadonly.className = "o_lib_settings_roles_note";
      rolesReadonly.textContent = selectedRoleIds.length
        ? "Configured by administrator."
        : "No additional roles configured.";
      rolesWrap.appendChild(rolesReadonly);
      return rolesWrap;
    }

    if (!_state.availableRoleOptions.length) {
      var rolesEmpty = document.createElement("div");
      rolesEmpty.className = "o_lib_settings_roles_note";
      rolesEmpty.textContent = v2.cleanText(config.emptyText || "No roles found.");
      rolesWrap.appendChild(rolesEmpty);
      return rolesWrap;
    }

    var rolesList = document.createElement("div");
    rolesList.className = "o_lib_settings_roles_list";

    _state.availableRoleOptions.forEach(function (roleOption) {
      var roleLabel = document.createElement("label");
      roleLabel.className = "o_lib_settings_toggle";
      var roleCheckbox = document.createElement("input");
      roleCheckbox.type = "checkbox";
      roleCheckbox.value = String(roleOption.id);
      roleCheckbox.checked = selectedRoleIds.indexOf(roleOption.id) >= 0;
      var roleSpan = document.createElement("span");
      roleSpan.textContent = roleOption.name;
      roleLabel.appendChild(roleCheckbox);
      roleLabel.appendChild(roleSpan);
      rolesList.appendChild(roleLabel);
    });

    if (typeof config.onChange === "function") {
      rolesList.addEventListener("change", function () {
        config.onChange(collectRoleIdsFromList(rolesList));
      });
    }

    rolesWrap.appendChild(rolesList);
    return rolesWrap;
  }

  settingsPanelRuntime.createSettingsRoleSelector = createSettingsRoleSelector;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_roles.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_sections.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingRelationOptionsLoads) {
    var backendFieldMeta = v2.backendFieldMetaFor(formNode, fieldMeta);
    var backendType = v2.cleanText((backendFieldMeta && backendFieldMeta.type) || "").toLowerCase();
    var modelName = v2.computeModelName(formNode);
    if (!modelName || backendType !== "many2one") {
      return backendFieldMeta;
    }
    var loadPromise = v2.ensureRelationFieldOptionsLoaded(modelName, fieldMeta.name);
    if (loadPromise) {
      pendingRelationOptionsLoads.push(loadPromise);
    }
    return backendFieldMeta;
  }

  function buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingRelationOptionsLoads) {
    var row = document.createElement("div");
    row.className = v2.SETTINGS_FIELD_ROW_CLASS;

    var fieldVisibleKey = v2.fieldVisibilityEntryKey(scopeKey, sectionKey, fieldMeta.key);
    var fieldDefaultKey = v2.fieldDefaultEntryKey(scopeKey, sectionKey, fieldMeta.key);
    var fieldVisible = v2.fieldIsVisible(scopeKey, sectionKey, fieldMeta.key);
    var defaultValue = v2.fieldDefaultValue(scopeKey, sectionKey, fieldMeta.key);
    var fieldLabel = v2.cleanText(fieldMeta.label || fieldMeta.name || fieldMeta.key);
    var backendFieldMeta = enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingRelationOptionsLoads);
    var canEditDefault = v2.fieldAllowsDefaultEditor(formNode, fieldMeta, backendFieldMeta);

    var fieldToggleLabel = document.createElement("label");
    fieldToggleLabel.className = "o_lib_settings_toggle";
    var fieldCheckbox = document.createElement("input");
    fieldCheckbox.type = "checkbox";
    fieldCheckbox.setAttribute("data-lib-role", "field-visible");
    fieldCheckbox.checked = fieldVisible;
    var fieldSpan = document.createElement("span");
    fieldSpan.textContent = fieldLabel;
    fieldToggleLabel.appendChild(fieldCheckbox);
    fieldToggleLabel.appendChild(fieldSpan);

    var rowHeader = document.createElement("div");
    rowHeader.className = "o_lib_settings_field_header";
    rowHeader.appendChild(fieldToggleLabel);
    row.appendChild(rowHeader);

    fieldCheckbox.addEventListener("change", function () {
      _state.formLayoutState.fieldVisible[fieldVisibleKey] = Boolean(fieldCheckbox.checked);
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    if (!canEditDefault) {
      return row;
    }

    var fieldExpand = document.createElement("button");
    fieldExpand.type = "button";
    fieldExpand.className = "o_lib_settings_field_expand";
    fieldExpand.setAttribute("aria-label", "Toggle default value editor");
    rowHeader.appendChild(fieldExpand);

    var defaultWrap = document.createElement("div");
    defaultWrap.className = "o_lib_settings_field_default_wrap";
    var defaultEditor = v2.createFieldDefaultEditor(formNode, fieldMeta, defaultValue);
    defaultWrap.appendChild(defaultEditor.node);
    row.appendChild(defaultWrap);

    var startsExpanded = Boolean(v2.cleanText(defaultValue));
    v2.updateFieldDefaultExpandedState(fieldExpand, defaultWrap, startsExpanded);

    fieldExpand.addEventListener("click", function () {
      var nextState = defaultWrap.hidden;
      v2.updateFieldDefaultExpandedState(fieldExpand, defaultWrap, nextState);
    });

    defaultEditor.node.addEventListener("change", function () {
      var nextValue = defaultEditor.readValue();
      if (nextValue) {
        _state.formLayoutState.fieldDefaults[fieldDefaultKey] = nextValue;
      } else {
        delete _state.formLayoutState.fieldDefaults[fieldDefaultKey];
      }
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    return row;
  }

  function buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingRelationOptionsLoads) {
    var fieldsWrap = document.createElement("div");
    fieldsWrap.className = "o_lib_settings_fields_wrap";

    var fieldMetas = Array.isArray(groupNode.__libFieldMeta) ? groupNode.__libFieldMeta : v2.collectSectionFieldMeta(groupNode);
    if (!fieldMetas.length) {
      var emptyRow = document.createElement("div");
      emptyRow.className = v2.SETTINGS_FIELD_ROW_CLASS;
      emptyRow.textContent = "No fields found in this section.";
      fieldsWrap.appendChild(emptyRow);
      return fieldsWrap;
    }

    fieldMetas.forEach(function (fieldMeta) {
      fieldsWrap.appendChild(buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingRelationOptionsLoads));
    });

    return fieldsWrap;
  }

  function buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingRelationOptionsLoads) {
    var sectionKey = v2.cleanText(groupNode.dataset.libSectionKey || "");
    if (!sectionKey) {
      return null;
    }

    var headerNode = v2.findSectionHeader(groupNode);
    var sectionLabel = v2.cleanText(
      (headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel) ||
      (headerNode && headerNode.textContent) ||
      sectionKey
    );
    var sectionVisibleKey = v2.sectionVisibilityEntryKey(scopeKey, sectionKey);
    var sectionRoleKey = v2.sectionSettingsRoleEntryKey(scopeKey, sectionKey);

    var sectionRow = document.createElement("div");
    sectionRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    sectionRow.dataset.libSectionKey = sectionKey;

    var sectionHeaderRow = document.createElement("div");
    sectionHeaderRow.className = "o_lib_settings_section_header";
    var sectionToggleLabel = document.createElement("label");
    sectionToggleLabel.className = "o_lib_settings_toggle";
    var sectionCheckbox = document.createElement("input");
    sectionCheckbox.type = "checkbox";
    sectionCheckbox.setAttribute("data-lib-role", "section-visible");
    sectionCheckbox.checked = v2.sectionIsVisible(scopeKey, sectionKey);
    var sectionSpan = document.createElement("span");
    sectionSpan.textContent = sectionLabel;
    sectionToggleLabel.appendChild(sectionCheckbox);
    sectionToggleLabel.appendChild(sectionSpan);
    sectionHeaderRow.appendChild(sectionToggleLabel);
    sectionRow.appendChild(sectionHeaderRow);

    sectionCheckbox.addEventListener("change", function () {
      _state.formLayoutState.sectionVisible[sectionVisibleKey] = Boolean(sectionCheckbox.checked);
      v2.queueStatePersist();
      v2.processFormNode(formNode);
      v2.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
    });

    sectionRow.appendChild(
      settingsPanelRuntime.createSettingsRoleSelector({
        title: "Roles for settings button (admin always allowed)",
        selectedRoleIds: v2.sectionSettingsRoleIds(scopeKey, sectionKey),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          if (selectedRoleIds.length) {
            _state.formLayoutState.settingsRoles[sectionRoleKey] = selectedRoleIds;
          } else {
            delete _state.formLayoutState.settingsRoles[sectionRoleKey];
          }
          v2.queueStatePersist();
          v2.processFormNode(formNode);
          v2.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
        },
      })
    );

    sectionRow.appendChild(buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingRelationOptionsLoads));
    return sectionRow;
  }

  function renderSectionSettingsRows(formNode, scopeKey, focusState, bodyNode, pendingRelationOptionsLoads) {
    var sectionRows = [];
    if (v2.cleanText((focusState && focusState.activeLayoutKey) || "") || v2.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return sectionRows;
    }

    v2.getSectionGroups(formNode).forEach(function (groupNode) {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      var sectionKey = v2.cleanText(groupNode.dataset.libSectionKey || "");
      if (!sectionKey) {
        return;
      }
      if (focusState && focusState.activeSectionKey && sectionKey !== focusState.activeSectionKey) {
        return;
      }
      var sectionRow = buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingRelationOptionsLoads);
      if (!(sectionRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(sectionRow);
      sectionRows.push(sectionRow);
    });

    return sectionRows;
  }

  settingsPanelRuntime.renderSectionSettingsRows = renderSectionSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_sections.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_layouts.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function syncLayoutVisibilityLocks(itemCheckboxes) {
    var visibleCount = itemCheckboxes.reduce(function (count, row) {
      return count + (row.checkbox.checked ? 1 : 0);
    }, 0);
    itemCheckboxes.forEach(function (row) {
      var lockChecked = row.checkbox.checked && visibleCount <= 1;
      row.checkbox.disabled = lockChecked;
      row.checkbox.title = lockChecked ? "At least one item must stay visible." : "";
    });
  }

  function buildLayoutDefaultsRow(formNode, scopeKey, layoutMeta, layoutKey) {
    if (layoutMeta.type !== "tabs") {
      return null;
    }
    var defaultWrap = document.createElement("div");
    defaultWrap.className = v2.SETTINGS_FIELD_ROW_CLASS;
    var defaultLabel = document.createElement("label");
    defaultLabel.textContent = "Default tab";
    var defaultSelect = document.createElement("select");
    defaultSelect.className = "o_lib_settings_default_input";

    var emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- No default --";
    defaultSelect.appendChild(emptyOption);

    layoutMeta.items.forEach(function (itemMeta) {
      var optionNode = document.createElement("option");
      optionNode.value = itemMeta.key;
      optionNode.textContent = v2.cleanText(itemMeta.label || itemMeta.key);
      defaultSelect.appendChild(optionNode);
    });

    defaultSelect.value = v2.layoutDefaultItemKey(scopeKey, layoutKey);
    defaultSelect.addEventListener("change", function () {
      var defaultKey = v2.cleanText(defaultSelect.value || "");
      var stateKey = v2.layoutDefaultEntryKey(scopeKey, layoutKey);
      if (defaultKey) {
        _state.formLayoutState.layoutDefaults[stateKey] = defaultKey;
      } else {
        delete _state.formLayoutState.layoutDefaults[stateKey];
      }
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultSelect);
    return defaultWrap;
  }

  function buildLayoutItemsWrap(formNode, scopeKey, layoutMeta, layoutKey) {
    var layoutItemsWrap = document.createElement("div");
    layoutItemsWrap.className = "o_lib_settings_fields_wrap";
    var itemCheckboxes = [];

    if (layoutMeta.type === "tabs") {
      var tabsNote = document.createElement("div");
      tabsNote.className = "o_lib_settings_roles_note";
      tabsNote.textContent = "At least one tab must stay visible.";
      layoutItemsWrap.appendChild(tabsNote);
    }

    var defaultRow = buildLayoutDefaultsRow(formNode, scopeKey, layoutMeta, layoutKey);
    if (defaultRow instanceof HTMLElement) {
      layoutItemsWrap.appendChild(defaultRow);
    }

    layoutMeta.items.forEach(function (itemMeta) {
      var visibilityKey = v2.layoutItemVisibilityEntryKey(scopeKey, layoutKey, itemMeta.key);
      var itemRow = document.createElement("div");
      itemRow.className = v2.SETTINGS_FIELD_ROW_CLASS;
      var itemToggle = document.createElement("label");
      itemToggle.className = "o_lib_settings_toggle";
      var itemCheckbox = document.createElement("input");
      itemCheckbox.type = "checkbox";
      itemCheckbox.checked = v2.layoutItemIsVisible(scopeKey, layoutKey, itemMeta.key);
      var itemLabel = document.createElement("span");
      itemLabel.textContent = v2.cleanText(itemMeta.label || itemMeta.key);
      itemToggle.appendChild(itemCheckbox);
      itemToggle.appendChild(itemLabel);
      itemRow.appendChild(itemToggle);
      layoutItemsWrap.appendChild(itemRow);

      itemCheckboxes.push({
        checkbox: itemCheckbox,
        visibilityKey: visibilityKey,
      });

      itemCheckbox.addEventListener("change", function () {
        if (!itemCheckbox.checked) {
          var otherVisibleCount = itemCheckboxes.reduce(function (count, row) {
            if (row.checkbox === itemCheckbox) {
              return count;
            }
            return count + (row.checkbox.checked ? 1 : 0);
          }, 0);
          if (otherVisibleCount < 1) {
            itemCheckbox.checked = true;
            syncLayoutVisibilityLocks(itemCheckboxes);
            return;
          }
        }
        _state.formLayoutState.layoutItemVisible[visibilityKey] = Boolean(itemCheckbox.checked);
        syncLayoutVisibilityLocks(itemCheckboxes);
        v2.queueStatePersist();
        v2.processFormNode(formNode);
      });
    });

    syncLayoutVisibilityLocks(itemCheckboxes);
    return layoutItemsWrap;
  }

  function buildLayoutSettingsRow(formNode, scopeKey, layoutMeta) {
    var layoutKey = v2.cleanText(layoutMeta.key || "");
    if (!layoutKey) {
      return null;
    }

    var layoutRow = document.createElement("div");
    layoutRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    layoutRow.dataset.libLayoutKey = layoutKey;

    var layoutHeader = document.createElement("div");
    layoutHeader.className = "o_lib_settings_section_header";
    var layoutLabel = document.createElement("div");
    layoutLabel.textContent = v2.cleanText(layoutMeta.label || layoutKey);
    layoutHeader.appendChild(layoutLabel);
    layoutRow.appendChild(layoutHeader);

    var layoutRoleKey = v2.layoutSettingsRoleEntryKey(scopeKey, layoutKey);
    layoutRow.appendChild(
      settingsPanelRuntime.createSettingsRoleSelector({
        title: "Roles for layout settings button (admin always allowed)",
        selectedRoleIds: v2.layoutSettingsRoleIds(scopeKey, layoutKey),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          if (selectedRoleIds.length) {
            _state.formLayoutState.settingsRoles[layoutRoleKey] = selectedRoleIds;
          } else {
            delete _state.formLayoutState.settingsRoles[layoutRoleKey];
          }
          v2.queueStatePersist();
          v2.processFormNode(formNode);
          v2.renderSectionSettingsPanel(formNode, scopeKey, "", layoutKey);
        },
      })
    );

    layoutRow.appendChild(buildLayoutItemsWrap(formNode, scopeKey, layoutMeta, layoutKey));
    return layoutRow;
  }

  function renderLayoutSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var layoutRows = [];
    if (v2.cleanText((focusState && focusState.activeSectionKey) || "") || v2.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return layoutRows;
    }

    var layoutMetas = Array.isArray(formNode.__libLayoutMeta) ? formNode.__libLayoutMeta : v2.collectLayoutContainers(formNode, scopeKey);
    if (!layoutMetas.length) {
      return layoutRows;
    }

    var layoutTitle = document.createElement("div");
    layoutTitle.className = "o_lib_settings_roles_title";
    layoutTitle.textContent = "Layout Settings";
    bodyNode.appendChild(layoutTitle);

    layoutMetas.forEach(function (layoutMeta) {
      var layoutKey = v2.cleanText(layoutMeta.key || "");
      if (!layoutKey) {
        return;
      }
      if (focusState && focusState.activeLayoutKey && layoutKey !== focusState.activeLayoutKey) {
        return;
      }
      var layoutRow = buildLayoutSettingsRow(formNode, scopeKey, layoutMeta);
      if (!(layoutRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(layoutRow);
      layoutRows.push(layoutRow);
    });

    return layoutRows;
  }

  settingsPanelRuntime.renderLayoutSettingsRows = renderLayoutSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_layouts.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_statusbars.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function buildStatusbarSettingsRow(scopeKey, statusbarMeta) {
    var statusbarKey = v2.cleanText((statusbarMeta && statusbarMeta.key) || "");
    if (!statusbarKey) {
      return null;
    }

    var statusbarRow = document.createElement("div");
    statusbarRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    statusbarRow.dataset.libStatusbarKey = statusbarKey;

    var statusbarHeader = document.createElement("div");
    statusbarHeader.className = "o_lib_settings_section_header";
    var statusbarLabel = document.createElement("div");
    statusbarLabel.textContent = v2.cleanText((statusbarMeta && statusbarMeta.label) || statusbarKey);
    statusbarHeader.appendChild(statusbarLabel);
    statusbarRow.appendChild(statusbarHeader);

    var localeNote = document.createElement("div");
    localeNote.className = "o_lib_settings_roles_note";
    localeNote.textContent = "Locale: " + v2.currentLocaleCode();
    statusbarRow.appendChild(localeNote);

    var statusbarItemsWrap = document.createElement("div");
    statusbarItemsWrap.className = "o_lib_settings_fields_wrap";

    (statusbarMeta.items || []).forEach(function (itemMeta) {
      if (!(itemMeta && itemMeta.node instanceof HTMLElement)) {
        return;
      }

      var itemRow = document.createElement("div");
      itemRow.className = v2.SETTINGS_FIELD_ROW_CLASS;

      var rowHeader = document.createElement("div");
      rowHeader.className = "o_lib_settings_field_header";
      var itemLabel = document.createElement("label");
      itemLabel.textContent = v2.cleanText(itemMeta.baseLabel || itemMeta.key);
      rowHeader.appendChild(itemLabel);
      itemRow.appendChild(rowHeader);

      var input = document.createElement("input");
      input.type = "text";
      input.className = "o_lib_settings_default_input";
      input.placeholder = v2.cleanText(itemMeta.baseLabel || itemMeta.key);
      input.value = v2.statusbarLabelValue(scopeKey, statusbarKey, itemMeta.key) || "";
      input.addEventListener("change", function () {
        if (!_state.formIsAdminUser) {
          return;
        }
        var entryKey = v2.statusbarLabelEntryKey(scopeKey, statusbarKey, itemMeta.key);
        var nextValue = v2.cleanText(input.value || "");
        var fallbackValue = v2.cleanText(itemMeta.baseLabel || "");
        if (!nextValue || nextValue === fallbackValue) {
          delete _state.formLayoutState.statusbarLabels[entryKey];
        } else {
          _state.formLayoutState.statusbarLabels[entryKey] = nextValue;
        }
        v2.queueStatePersist();
        v2.applyStatusbarMetaLabels(statusbarMeta, scopeKey);
      });

      itemRow.appendChild(input);
      statusbarItemsWrap.appendChild(itemRow);
    });

    statusbarRow.appendChild(statusbarItemsWrap);
    return statusbarRow;
  }

  function renderStatusbarSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var statusbarRows = [];
    if (!_state.formIsAdminUser) {
      return statusbarRows;
    }
    if (v2.cleanText((focusState && focusState.activeSectionKey) || "") || v2.cleanText((focusState && focusState.activeLayoutKey) || "")) {
      return statusbarRows;
    }

    var statusbarMetas = Array.isArray(formNode.__libStatusbarMeta)
      ? formNode.__libStatusbarMeta
      : v2.collectStatusbarMetas(formNode, scopeKey);
    if (!statusbarMetas.length) {
      return statusbarRows;
    }

    var statusbarTitle = document.createElement("div");
    statusbarTitle.className = "o_lib_settings_roles_title";
    statusbarTitle.textContent = "Statusbar Labels";
    bodyNode.appendChild(statusbarTitle);

    statusbarMetas.forEach(function (statusbarMeta) {
      var statusbarKey = v2.cleanText((statusbarMeta && statusbarMeta.key) || "");
      if (!statusbarKey) {
        return;
      }
      if (focusState && focusState.activeStatusbarKey && statusbarKey !== focusState.activeStatusbarKey) {
        return;
      }
      var statusbarRow = buildStatusbarSettingsRow(scopeKey, statusbarMeta);
      if (!(statusbarRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(statusbarRow);
      statusbarRows.push(statusbarRow);
    });

    return statusbarRows;
  }

  settingsPanelRuntime.renderStatusbarSettingsRows = renderStatusbarSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_statusbars.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_render.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function renderSectionSettingsPanel(formNode, scopeKey, focusSectionKey, focusLayoutKey) {
    var panel = v2.ensureSectionSettingsPanel();
    if (!(panel instanceof HTMLElement) || !(_state.settingsPanelState.bodyNode instanceof HTMLElement)) {
      return;
    }

    v2.ensureFieldDefinitionsLoadedForForm(formNode);

    var focusState = settingsPanelRuntime.resolveSettingsPanelFocusState(focusSectionKey, focusLayoutKey);
    var titleNode = panel.querySelector(".o_lib_section_settings_title");
    if (titleNode instanceof HTMLElement) {
      titleNode.textContent = settingsPanelRuntime.resolveSettingsPanelTitle(formNode, scopeKey, focusState);
    }

    var bodyNode = _state.settingsPanelState.bodyNode;
    bodyNode.innerHTML = "";
    var pendingRelationOptionsLoads = [];

    var sectionRows = settingsPanelRuntime.renderSectionSettingsRows(
      formNode,
      scopeKey,
      focusState,
      bodyNode,
      pendingRelationOptionsLoads
    );
    var layoutRows = settingsPanelRuntime.renderLayoutSettingsRows(formNode, scopeKey, focusState, bodyNode);
    var statusbarRows = settingsPanelRuntime.renderStatusbarSettingsRows(formNode, scopeKey, focusState, bodyNode);

    settingsPanelRuntime.scrollSettingsPanelToFocus(focusState, sectionRows, layoutRows, statusbarRows);
    settingsPanelRuntime.rerenderSettingsPanelAfterRelationLoads(formNode, scopeKey, pendingRelationOptionsLoads);
  }

  v2.renderSectionSettingsPanel = renderSectionSettingsPanel;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_render.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/settings_panel_open.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SETTINGS_PANEL_OPEN_CLASS = v2.SETTINGS_PANEL_OPEN_CLASS;
  var STATUSBAR_FOCUS_PREFIX = v2.STATUSBAR_FOCUS_PREFIX;
  var canAccessLayoutSettings = function () { return v2.canAccessLayoutSettings.apply(this, arguments); };
  var canAccessSectionSettings = function () { return v2.canAccessSectionSettings.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeScopeKey = function () { return v2.computeScopeKey.apply(this, arguments); };
  var ensureSectionSettingsPanel = function () { return v2.ensureSectionSettingsPanel.apply(this, arguments); };
  var renderSectionSettingsPanel = function () { return v2.renderSectionSettingsPanel.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/settings_panel_open.js

  function openSectionSettingsPanel(formNode, focusSectionKey, focusLayoutKey) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var scopeKey = computeScopeKey(formNode);
    if (focusSectionKey && !canAccessSectionSettings(scopeKey, focusSectionKey)) {
      return;
    }
    var normalizedLayoutFocus = cleanText(focusLayoutKey || "");
    if (
      normalizedLayoutFocus &&
      normalizedLayoutFocus.indexOf(STATUSBAR_FOCUS_PREFIX) === 0 &&
      !_state.formIsAdminUser
    ) {
      return;
    }
    if (normalizedLayoutFocus && !canAccessLayoutSettings(scopeKey, normalizedLayoutFocus)) {
      return;
    }
    _state.settingsPanelState.currentForm = formNode;
    _state.settingsPanelState.currentScopeKey = scopeKey;
    _state.settingsPanelState.focusSectionKey = cleanText(focusSectionKey || "");
    _state.settingsPanelState.focusLayoutKey = normalizedLayoutFocus;
    if (_state.settingsPanelState.focusSectionKey) {
      _state.settingsPanelState.focusLayoutKey = "";
    }
    renderSectionSettingsPanel(formNode, scopeKey, focusSectionKey, normalizedLayoutFocus);
    var panel = ensureSectionSettingsPanel();
    if (panel instanceof HTMLElement) {
      panel.classList.add(SETTINGS_PANEL_OPEN_CLASS);
    }
  }

  v2.openSectionSettingsPanel = openSectionSettingsPanel;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/settings_panel_open.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/chatter.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var BODY_CHATTER_COLLAPSED_CLASS = v2.BODY_CHATTER_COLLAPSED_CLASS;
  var CHATTER_DEFAULT_COLLAPSED = v2.CHATTER_DEFAULT_COLLAPSED;
  var CHATTER_HIDDEN_CLASS = v2.CHATTER_HIDDEN_CLASS;
  var CHATTER_HOST_SELECTOR = v2.CHATTER_HOST_SELECTOR;
  var CHATTER_PARENT_COLLAPSED_CLASS = v2.CHATTER_PARENT_COLLAPSED_CLASS;
  var CHATTER_SELECTORS = v2.CHATTER_SELECTORS;
  var CHATTER_TOGGLE_ACTIVE_CLASS = v2.CHATTER_TOGGLE_ACTIVE_CLASS;
  var CHATTER_TOGGLE_CLASS = v2.CHATTER_TOGGLE_CLASS;
  var CHATTER_TOGGLE_COLLAPSED_CLASS = v2.CHATTER_TOGGLE_COLLAPSED_CLASS;
  var CHATTER_TOGGLE_ID = v2.CHATTER_TOGGLE_ID;
  var FORM_CHATTER_COLLAPSED_CLASS = v2.FORM_CHATTER_COLLAPSED_CLASS;
  var queueStatePersist = function () { return v2.queueStatePersist.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/chatter.js

  function isChatterCollapsed() {
    if (typeof _state.formLayoutState.chatterCollapsed === "boolean") {
      return _state.formLayoutState.chatterCollapsed;
    }
    return CHATTER_DEFAULT_COLLAPSED;
  }

  v2.isChatterCollapsed = isChatterCollapsed;

  function setChatterCollapsed(collapsed) {
    _state.formLayoutState.chatterCollapsed = Boolean(collapsed);
    queueStatePersist();
    applyChatterVisibility();
  }

  v2.setChatterCollapsed = setChatterCollapsed;

  function resolveChatterContainer(node) {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    var container = node.closest(CHATTER_HOST_SELECTOR);
    if (!(container instanceof HTMLElement)) {
      return null;
    }

    var outer = container;
    while (outer.parentElement && outer.parentElement.matches(CHATTER_HOST_SELECTOR)) {
      outer = outer.parentElement;
    }
    return outer;
  }

  v2.resolveChatterContainer = resolveChatterContainer;

  function collectChatterContainers() {
    var containers = [];
    var seen = new Set();

    CHATTER_SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        var container = resolveChatterContainer(node);
        if (!(container instanceof HTMLElement)) {
          return;
        }
        if (seen.has(container)) {
          return;
        }
        seen.add(container);
        containers.push(container);
      });
    });

    return containers;
  }

  v2.collectChatterContainers = collectChatterContainers;

  function updateFormChatterClass(collapsed, containers) {
    var formsWithChatter = new Set();
    containers.forEach(function (container) {
      var formNode = container.closest(".o_form_view");
      if (formNode instanceof HTMLElement) {
        formsWithChatter.add(formNode);
      }
    });

    document.querySelectorAll(".o_form_view").forEach(function (formNode) {
      if (!(formNode instanceof HTMLElement)) {
        return;
      }
      var hasChatter = formsWithChatter.has(formNode);
      formNode.classList.toggle(FORM_CHATTER_COLLAPSED_CLASS, hasChatter && collapsed);
    });
  }

  v2.updateFormChatterClass = updateFormChatterClass;

  function applyForcedChatterStyle(container, collapsed) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    if (!collapsed) {
      container.style.removeProperty("display");
      container.style.removeProperty("width");
      container.style.removeProperty("min-width");
      container.style.removeProperty("max-width");
      container.style.removeProperty("flex");
      container.style.removeProperty("padding");
      container.style.removeProperty("margin");
      container.style.removeProperty("border");
      return;
    }

    container.style.setProperty("display", "none", "important");
    container.style.setProperty("width", "0px", "important");
    container.style.setProperty("min-width", "0px", "important");
    container.style.setProperty("max-width", "0px", "important");
    container.style.setProperty("flex", "0 0 0px", "important");
    container.style.setProperty("padding", "0", "important");
    container.style.setProperty("margin", "0", "important");
    container.style.setProperty("border", "0", "important");
  }

  v2.applyForcedChatterStyle = applyForcedChatterStyle;

  function resetChatterHostInlineStyle(container) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    var host = container.parentElement;
    if (!(host instanceof HTMLElement)) {
      return;
    }
    host.style.removeProperty("display");
    host.style.removeProperty("width");
    host.style.removeProperty("min-width");
    host.style.removeProperty("max-width");
    host.style.removeProperty("flex");
    host.style.removeProperty("padding");
    host.style.removeProperty("margin");
    host.style.removeProperty("border");
  }

  v2.resetChatterHostInlineStyle = resetChatterHostInlineStyle;

  function updateChatterParentLayout(collapsed, containers) {
    document.querySelectorAll("." + CHATTER_PARENT_COLLAPSED_CLASS).forEach(function (node) {
      node.classList.remove(CHATTER_PARENT_COLLAPSED_CLASS);
    });

    if (!collapsed) {
      return;
    }

    containers.forEach(function (container) {
      if (!(container instanceof HTMLElement)) {
        return;
      }
      var parent = container.parentElement;
      while (parent instanceof HTMLElement && parent !== document.body) {
        if (parent.querySelector(".o_form_sheet_bg")) {
          parent.classList.add(CHATTER_PARENT_COLLAPSED_CLASS);
          break;
        }
        parent = parent.parentElement;
      }
    });
  }

  v2.updateChatterParentLayout = updateChatterParentLayout;

  function ensureGlobalChatterToggleButton() {
    var button = document.getElementById(CHATTER_TOGGLE_ID);
    if (button instanceof HTMLButtonElement) {
      return button;
    }

    button = document.createElement("button");
    button.type = "button";
    button.id = CHATTER_TOGGLE_ID;
    button.className = CHATTER_TOGGLE_CLASS;
    button.setAttribute("aria-label", "Toggle communication panel");

    button.addEventListener("click", function () {
      setChatterCollapsed(!isChatterCollapsed());
    });

    document.body.appendChild(button);
    return button;
  }

  v2.ensureGlobalChatterToggleButton = ensureGlobalChatterToggleButton;

  function updateGlobalChatterToggleButton(hasChatter) {
    var button = ensureGlobalChatterToggleButton();
    if (!(button instanceof HTMLElement)) {
      return;
    }

    if (!hasChatter) {
      button.hidden = true;
      return;
    }

    var collapsed = isChatterCollapsed();
    button.hidden = false;
    button.classList.toggle(CHATTER_TOGGLE_ACTIVE_CLASS, !collapsed);
    button.classList.toggle(CHATTER_TOGGLE_COLLAPSED_CLASS, collapsed);
    var iconNode = button.querySelector(".o_lib_chatter_toggle_icon");
    if (!(iconNode instanceof HTMLElement)) {
      iconNode = document.createElement("span");
      iconNode.className = "o_lib_chatter_toggle_icon";
      button.innerHTML = "";
      button.appendChild(iconNode);
    }
    iconNode.textContent = collapsed ? ">" : "<";
    button.setAttribute("aria-pressed", collapsed ? "false" : "true");
    button.removeAttribute("title");
  }

  v2.updateGlobalChatterToggleButton = updateGlobalChatterToggleButton;

  function applyChatterVisibility() {
    var containers = collectChatterContainers();
    var collapsed = isChatterCollapsed();

    document.body.classList.toggle(BODY_CHATTER_COLLAPSED_CLASS, collapsed);

    containers.forEach(function (container) {
      resetChatterHostInlineStyle(container);
      container.classList.toggle(CHATTER_HIDDEN_CLASS, collapsed);
      container.hidden = collapsed;
      applyForcedChatterStyle(container, collapsed);
    });

    updateChatterParentLayout(collapsed, containers);
    updateFormChatterClass(collapsed, containers);
    updateGlobalChatterToggleButton(containers.length > 0);
  }

  v2.applyChatterVisibility = applyChatterVisibility;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/chatter.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/section_control_visibility.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS;
  var SECTION_CONTROLS_VISIBLE_CLASS = v2.SECTION_CONTROLS_VISIBLE_CLASS;


  function clearVisibleSectionControls(exceptGroup) {
    document
      .querySelectorAll("." + COLLAPSIBLE_GROUP_CLASS + "." + SECTION_CONTROLS_VISIBLE_CLASS)
      .forEach(function (groupNode) {
        if (groupNode !== exceptGroup) {
          groupNode.classList.remove(SECTION_CONTROLS_VISIBLE_CLASS);
        }
      });
  }

  v2.clearVisibleSectionControls = clearVisibleSectionControls;

  function setVisibleSectionControls(groupNode) {
    var nextGroup = groupNode instanceof HTMLElement ? groupNode : null;
    if (_state.hoveredSectionGroup === nextGroup) {
      if (nextGroup instanceof HTMLElement) {
        nextGroup.classList.add(SECTION_CONTROLS_VISIBLE_CLASS);
      }
      return nextGroup;
    }

    clearVisibleSectionControls(nextGroup);
    _state.hoveredSectionGroup = nextGroup;

    if (nextGroup instanceof HTMLElement) {
      nextGroup.classList.add(SECTION_CONTROLS_VISIBLE_CLASS);
    }

    return nextGroup;
  }

  v2.setVisibleSectionControls = setVisibleSectionControls;

  function resolveSectionGroupFromNode(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    var groupNode = target.closest("." + COLLAPSIBLE_GROUP_CLASS);
    return groupNode instanceof HTMLElement ? groupNode : null;
  }

  v2.resolveSectionGroupFromNode = resolveSectionGroupFromNode;

  function resolveSectionGroupFromPoint(clientX, clientY) {
    if (typeof clientX !== "number" || typeof clientY !== "number") {
      return null;
    }
    return resolveSectionGroupFromNode(document.elementFromPoint(clientX, clientY));
  }

  v2.resolveSectionGroupFromPoint = resolveSectionGroupFromPoint;

  function syncHoveredSectionControlVisibility() {
    var hoveredGroup = resolveSectionGroupFromPoint(_state.lastPointerClientX, _state.lastPointerClientY);
    setVisibleSectionControls(hoveredGroup);
    return hoveredGroup;
  }

  v2.syncHoveredSectionControlVisibility = syncHoveredSectionControlVisibility;

  function bindSectionHoverState(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return;
    }
    if (groupNode === resolveSectionGroupFromPoint(_state.lastPointerClientX, _state.lastPointerClientY)) {
      setVisibleSectionControls(groupNode);
    }
  }

  v2.bindSectionHoverState = bindSectionHoverState;

  function updateSectionControlVisibilityFromEvent(event) {
    if (!(event instanceof MouseEvent)) {
      return;
    }
    _state.lastPointerClientX = event.clientX;
    _state.lastPointerClientY = event.clientY;
    setVisibleSectionControls(resolveSectionGroupFromNode(event.target));
  }

  function clearSectionControlVisibility() {
    _state.lastPointerClientX = null;
    _state.lastPointerClientY = null;
    setVisibleSectionControls(null);
  }

  function bindGlobalSectionControlVisibility() {
    if (_state.sectionHoverRuntimeBound) {
      return;
    }
    _state.sectionHoverRuntimeBound = true;

    document.addEventListener("mousemove", updateSectionControlVisibilityFromEvent, true);
    document.addEventListener(
      "mouseout",
      function (event) {
        if (event && !event.relatedTarget) {
          clearSectionControlVisibility();
        }
      },
      true
    );
    window.addEventListener("blur", clearSectionControlVisibility);
  }

  v2.bindGlobalSectionControlVisibility = bindGlobalSectionControlVisibility;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/section_control_visibility.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/section_headers.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var BODY_HIDDEN_CLASS = v2.BODY_HIDDEN_CLASS;
  var COLLAPSED_GROUP_CLASS = v2.COLLAPSED_GROUP_CLASS;
  var DRAG_HANDLE_CLASS = v2.DRAG_HANDLE_CLASS;
  var FIELD_HIDDEN_CLASS = v2.FIELD_HIDDEN_CLASS;
  var HEADER_CLASS = v2.HEADER_CLASS;
  var LAYOUT_ITEM_HIDDEN_CLASS = v2.LAYOUT_ITEM_HIDDEN_CLASS;
  var SECTION_HIDDEN_CLASS = v2.SECTION_HIDDEN_CLASS;
  var SECTION_SETTINGS_TRIGGER_CLASS = v2.SECTION_SETTINGS_TRIGGER_CLASS;
  var TOGGLE_BUTTON_CLASS = v2.TOGGLE_BUTTON_CLASS;
  var TOGGLE_ICON_CLASS = v2.TOGGLE_ICON_CLASS;
  var TOGGLE_LABEL_CLASS = v2.TOGGLE_LABEL_CLASS;
  var TOOLBAR_CLASS = v2.TOOLBAR_CLASS;
  var applySettingsTriggerIcon = function () { return v2.applySettingsTriggerIcon.apply(this, arguments); };
  var bindSectionHoverState = function () { return v2.bindSectionHoverState.apply(this, arguments); };
  var canAccessSectionSettings = function () { return v2.canAccessSectionSettings.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectSectionFieldMeta = function () { return v2.collectSectionFieldMeta.apply(this, arguments); };
  var findFieldInputOnWidget = function () { return v2.findFieldInputOnWidget.apply(this, arguments); };
  var onSectionSettingsClick = function () { return v2.onSectionSettingsClick.apply(this, arguments); };
  var onToggleSectionClick = function () { return v2.onToggleSectionClick.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/section_headers.js

  function ensureCollapsedSummaryNode(headerNode) {
    if (!(headerNode instanceof HTMLElement)) {
      return null;
    }
    var summaryNode = headerNode.querySelector(":scope > .o_lib_section_collapsed_summary");
    if (summaryNode instanceof HTMLElement) {
      return summaryNode;
    }
    summaryNode = document.createElement("div");
    summaryNode.className = "o_lib_section_collapsed_summary";
    summaryNode.hidden = true;
    headerNode.appendChild(summaryNode);
    return summaryNode;
  }

  function nodeIsVisibleForCollapsedSummary(node, groupNode) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var current = node;
    var collapseHidden = false;
    while (current instanceof HTMLElement) {
      if (current.hidden) {
        return false;
      }
      if (
        current.classList.contains(FIELD_HIDDEN_CLASS) ||
        current.classList.contains(SECTION_HIDDEN_CLASS) ||
        current.classList.contains(LAYOUT_ITEM_HIDDEN_CLASS)
      ) {
        return false;
      }
      if (current.classList.contains(BODY_HIDDEN_CLASS)) {
        collapseHidden = true;
      }
      if (current === groupNode) {
        break;
      }
      current = current.parentElement;
    }
    var style = window.getComputedStyle(node);
    if (!style || style.visibility === "hidden") {
      return false;
    }
    if (!collapseHidden && style.display === "none") {
      return false;
    }
    if (collapseHidden) {
      return true;
    }
    var rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    return true;
  }

  function readCollapsedSummaryValue(groupNode, fieldMeta) {
    if (!(fieldMeta && Array.isArray(fieldMeta.widgets))) {
      return "";
    }
    for (var index = 0; index < fieldMeta.widgets.length; index += 1) {
      var widgetNode = fieldMeta.widgets[index];
      if (!(widgetNode instanceof HTMLElement) || !nodeIsVisibleForCollapsedSummary(widgetNode, groupNode)) {
        continue;
      }
      var inputNode = findFieldInputOnWidget(widgetNode);
      if (inputNode instanceof HTMLSelectElement) {
        var selectedOption = inputNode.selectedOptions && inputNode.selectedOptions[0];
        var selectValue = cleanText(
          (selectedOption && selectedOption.textContent) ||
          (inputNode.options[inputNode.selectedIndex] && inputNode.options[inputNode.selectedIndex].text) ||
          ""
        );
        if (selectValue) {
          return selectValue;
        }
      } else if (inputNode instanceof HTMLInputElement) {
        var inputType = cleanText(inputNode.type || "").toLowerCase();
        if (inputType === "checkbox") {
          if (inputNode.checked) {
            return "Yes";
          }
        } else if (inputType === "radio") {
          if (inputNode.checked) {
            var radioValue = cleanText(inputNode.value || "");
            if (radioValue) {
              return radioValue;
            }
            return "Yes";
          }
        } else {
          var inputValue = cleanText(inputNode.value || "");
          if (inputValue) {
            return inputValue;
          }
        }
      } else if (inputNode instanceof HTMLTextAreaElement) {
        var textAreaValue = cleanText(inputNode.value || "");
        if (textAreaValue) {
          return textAreaValue;
        }
      }

      var passiveValue = cleanText(widgetNode.textContent || "");
      if (passiveValue) {
        return passiveValue;
      }
    }
    return "";
  }

  function updateCollapsedSectionSummary(groupNode, headerNode, collapsed) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }
    var summaryNode = ensureCollapsedSummaryNode(headerNode);
    if (!(summaryNode instanceof HTMLElement)) {
      return;
    }
    if (!collapsed) {
      summaryNode.hidden = true;
      summaryNode.replaceChildren();
      return;
    }

    var summaryItems = collectSectionFieldMeta(groupNode)
      .filter(function (fieldMeta) {
        return (
          Array.isArray(fieldMeta.widgets) &&
          fieldMeta.widgets.some(function (widgetNode) {
            return nodeIsVisibleForCollapsedSummary(widgetNode, groupNode);
          })
        );
      })
      .map(function (fieldMeta) {
        return {
          label: cleanText(fieldMeta.label || fieldMeta.name || ""),
          value: readCollapsedSummaryValue(groupNode, fieldMeta),
        };
      })
      .filter(function (item) {
        return Boolean(item.label && item.value);
      });

    summaryNode.replaceChildren();
    if (!summaryItems.length) {
      summaryNode.hidden = true;
      return;
    }

    summaryItems.slice(0, 6).forEach(function (item) {
      var itemNode = document.createElement("span");
      itemNode.className = "o_lib_section_summary_item";

      var labelNode = document.createElement("span");
      labelNode.className = "o_lib_section_summary_label";
      labelNode.textContent = item.label + ":";

      var valueNode = document.createElement("span");
      valueNode.className = "o_lib_section_summary_value";
      valueNode.textContent = item.value;

      itemNode.appendChild(labelNode);
      itemNode.appendChild(valueNode);
      summaryNode.appendChild(itemNode);
    });

    if (summaryItems.length > 6) {
      var moreNode = document.createElement("span");
      moreNode.className = "o_lib_section_summary_more";
      moreNode.textContent = "+" + String(summaryItems.length - 6) + " more";
      summaryNode.appendChild(moreNode);
    }
    summaryNode.hidden = false;
  }

  function setGroupCollapsed(groupNode, headerNode, collapsed) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }

    var shouldCollapse = Boolean(collapsed);
    updateCollapsedSectionSummary(groupNode, headerNode, shouldCollapse);
    groupNode.classList.toggle(COLLAPSED_GROUP_CLASS, shouldCollapse);

    var toggleButton = headerNode.querySelector("." + TOGGLE_BUTTON_CLASS);
    if (toggleButton instanceof HTMLElement) {
      toggleButton.setAttribute("aria-expanded", shouldCollapse ? "false" : "true");
    }

    var headerPath = new Set();
    var cursor = headerNode;
    while (cursor instanceof HTMLElement && cursor !== groupNode) {
      headerPath.add(cursor);
      cursor = cursor.parentElement;
    }

    groupNode.querySelectorAll("*").forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      var keepVisible = headerPath.has(node) || headerNode.contains(node);
      if (keepVisible) {
        return;
      }
      node.classList.toggle(BODY_HIDDEN_CLASS, shouldCollapse);
    });
  }

  v2.setGroupCollapsed = setGroupCollapsed;

  function decorateSectionHeader(groupNode, headerNode, sectionKey, scopeKey) {
    headerNode.classList.add(HEADER_CLASS);
    bindSectionHoverState(groupNode);

    var labelText =
      String(headerNode.dataset.libSectionLabel || headerNode.textContent || "")
        .replace(/\s+/g, " ")
        .trim() || "Section";
    headerNode.dataset.libSectionLabel = labelText;

    var toolbar = headerNode.querySelector("." + TOOLBAR_CLASS);
    var toggleButton;
    var toggleIcon;
    var toggleLabel;
    var dragHandle;
    var settingsTrigger;

    if (!(toolbar instanceof HTMLElement)) {
      toolbar = document.createElement("div");
      toolbar.className = TOOLBAR_CLASS;

      toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = TOGGLE_BUTTON_CLASS;

      toggleIcon = document.createElement("span");
      toggleIcon.className = TOGGLE_ICON_CLASS;

      toggleLabel = document.createElement("span");
      toggleLabel.className = TOGGLE_LABEL_CLASS;

      toggleButton.appendChild(toggleIcon);
      toggleButton.appendChild(toggleLabel);

      dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = DRAG_HANDLE_CLASS;
      dragHandle.setAttribute("draggable", "true");
      dragHandle.setAttribute("aria-label", "Drag section");
      dragHandle.title = "Drag section";
      dragHandle.textContent = "::";

      settingsTrigger = document.createElement("button");
      settingsTrigger.type = "button";
      settingsTrigger.className = SECTION_SETTINGS_TRIGGER_CLASS;

      headerNode.textContent = "";
      headerNode.appendChild(toolbar);
    } else {
      toggleButton = toolbar.querySelector("." + TOGGLE_BUTTON_CLASS);
      toggleIcon = toolbar.querySelector("." + TOGGLE_ICON_CLASS);
      toggleLabel = toolbar.querySelector("." + TOGGLE_LABEL_CLASS);
      dragHandle = toolbar.querySelector("." + DRAG_HANDLE_CLASS);
      settingsTrigger = toolbar.querySelector("." + SECTION_SETTINGS_TRIGGER_CLASS);
      if (!(settingsTrigger instanceof HTMLElement)) {
        settingsTrigger = document.createElement("button");
        settingsTrigger.type = "button";
        settingsTrigger.className = SECTION_SETTINGS_TRIGGER_CLASS;
        toolbar.appendChild(settingsTrigger);
      }
    }

    if (
      !(toggleButton instanceof HTMLElement) ||
      !(toggleIcon instanceof HTMLElement) ||
      !(toggleLabel instanceof HTMLElement) ||
      !(dragHandle instanceof HTMLElement) ||
      !(settingsTrigger instanceof HTMLElement)
    ) {
      return;
    }

    // Rebuild the toolbar order on every pass so legacy DOM or partial rerenders
    // cannot leave settings before drag.
    toolbar.replaceChildren(toggleButton, dragHandle, settingsTrigger);

    toggleLabel.textContent = labelText;
    toggleIcon.textContent = ">";
    toggleButton.dataset.libSectionKey = sectionKey;
    dragHandle.dataset.libSectionKey = sectionKey;
    settingsTrigger.dataset.libSectionKey = sectionKey;
    applySettingsTriggerIcon(settingsTrigger, "Section settings");

    // Rebind on every pass. Odoo can replace/recycle DOM nodes and preserve
    // data-* flags without preserving event listeners.
    bindSectionButtonActivation(toggleButton, onToggleSectionClick);
    dragHandle.onmousedown = function (event) {
      event.stopPropagation();
    };
    bindSectionButtonActivation(settingsTrigger, onSectionSettingsClick);

    settingsTrigger.hidden = !canAccessSectionSettings(scopeKey, sectionKey);

    var collapsed = groupNode.classList.contains(COLLAPSED_GROUP_CLASS);
    toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
    updateCollapsedSectionSummary(groupNode, headerNode, collapsed);
  }

  v2.decorateSectionHeader = decorateSectionHeader;

  function bindSectionButtonActivation(buttonNode, handler) {
    if (!(buttonNode instanceof HTMLElement) || typeof handler !== "function") {
      return;
    }

    buttonNode.onclick = function (event) {
      var lastPointerActivationAt = Number(buttonNode.dataset.libPointerActivatedAt || 0) || 0;
      if (event && event.type === "click" && lastPointerActivationAt && Date.now() - lastPointerActivationAt < 350) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      return handler.call(this, event);
    };

    buttonNode.onmouseup = function (event) {
      if (!(event instanceof MouseEvent) || event.button !== 0) {
        return;
      }
      buttonNode.dataset.libPointerActivatedAt = String(Date.now());
      event.preventDefault();
      event.stopPropagation();
      return handler.call(this, event);
    };
  }

  v2.bindSectionButtonActivation = bindSectionButtonActivation;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/section_headers.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_values.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_NATIVE_HIDDEN_CLASS = v2.SUBTOTAL_NATIVE_HIDDEN_CLASS;
  var SUBTOTAL_REFRESH_FIELDS = v2.SUBTOTAL_REFRESH_FIELDS;
  var SUBTOTAL_TOGGLE_FIELDS = v2.SUBTOTAL_TOGGLE_FIELDS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var computeScopeKey = function () { return v2.computeScopeKey.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_values.js

  function parseNumericText(rawValue) {
    var value = String(rawValue || "").trim();
    if (!value) {
      return 0;
    }
    var cleaned = value.replace(/[^0-9,.\-]/g, "");
    if (!cleaned) {
      return 0;
    }
    if (cleaned.indexOf(",") >= 0 && cleaned.indexOf(".") >= 0) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.indexOf(",") >= 0) {
      cleaned = cleaned.replace(/,/g, ".");
    }
    var parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  v2.parseNumericText = parseNumericText;

  function readFieldNumericValue(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return 0;
    }
    if (SUBTOTAL_REFRESH_FIELDS.indexOf(String(fieldName || "")) >= 0) {
      var preferredCachedNumber = readNumericFieldCache(formNode, fieldName);
      if (preferredCachedNumber !== null) {
        return Number(preferredCachedNumber);
      }
    }
    var escaped = String(fieldName).replace(/'/g, "\\'");
    var selector = "[name='" + escaped + "'], [data-name='" + escaped + "']";
    var nodes = Array.prototype.slice.call(formNode.querySelectorAll(selector));
    var visibleZero = null;
    var anyZero = null;
    var anyNonZero = null;

    function isVisible(node) {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      if (node.classList.contains(SUBTOTAL_NATIVE_HIDDEN_CLASS)) {
        return false;
      }
      var style = window.getComputedStyle(node);
      if (!style || style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      return true;
    }

    function collectValueCandidates(node) {
      var values = [];
      if (node instanceof HTMLInputElement) {
        var inputType = cleanText(node.type || "").toLowerCase();
        if (inputType !== "hidden") {
          values.push(parseNumericText(node.value));
        }
      } else if (node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        values.push(parseNumericText(node.value));
      }
      values.push(parseNumericText(node.getAttribute("value") || ""));
      values.push(parseNumericText(node.textContent || ""));
      return values;
    }

    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      var visible = isVisible(node);
      var candidates = collectValueCandidates(node);
      for (var valueIndex = 0; valueIndex < candidates.length; valueIndex += 1) {
        var numericValue = Number(candidates[valueIndex] || 0);
        if (!Number.isFinite(numericValue)) {
          continue;
        }
        if (numericValue !== 0) {
          if (visible) {
            return numericValue;
          }
          if (anyNonZero === null) {
            anyNonZero = numericValue;
          }
          continue;
        }
        if (visible && visibleZero === null) {
          visibleZero = 0;
        }
        if (anyZero === null) {
          anyZero = 0;
        }
      }
    }

    if (anyNonZero !== null) {
      return anyNonZero;
    }
    if (visibleZero !== null) {
      return visibleZero;
    }
    if (anyZero !== null) {
      return anyZero;
    }
    return 0;
  }

  v2.readFieldNumericValue = readFieldNumericValue;

  function parseBooleanFieldValue(value, defaultValue) {
    if (value === null || value === undefined || value === "") {
      return Boolean(defaultValue);
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    var normalized = cleanText(value).toLowerCase();
    if (!normalized) {
      return Boolean(defaultValue);
    }
    if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
      return false;
    }
    return Boolean(defaultValue);
  }

  v2.parseBooleanFieldValue = parseBooleanFieldValue;

  function findFieldNodes(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return [];
    }
    var escaped = String(fieldName).replace(/'/g, "\\'");
    var selector = "[name='" + escaped + "'], [data-name='" + escaped + "']";
    return Array.prototype.slice.call(formNode.querySelectorAll(selector)).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  v2.findFieldNodes = findFieldNodes;

  function booleanFieldCacheKey(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return "";
    }
    var normalizedFieldName = String(fieldName || "");
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var requiresRecordBinding =
      SUBTOTAL_TOGGLE_FIELDS.indexOf(normalizedFieldName) >= 0 ||
      SUBTOTAL_REFRESH_FIELDS.indexOf(normalizedFieldName) >= 0;
    if (requiresRecordBinding && !(modelName && recordId)) {
      return "";
    }
    if (modelName && recordId) {
      return [modelName, String(recordId), normalizedFieldName].join("|");
    }
    var scopeKey = computeScopeKey(formNode);
    if (recordId && (modelName || scopeKey)) {
      return [modelName || scopeKey, String(recordId), normalizedFieldName].join("|");
    }
    if (scopeKey) {
      return [scopeKey, normalizedFieldName].join("|");
    }
    return "";
  }

  v2.booleanFieldCacheKey = booleanFieldCacheKey;

  function readBooleanFieldCache(formNode, fieldName) {
    var cacheKey = booleanFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(_state.booleanFieldStateCache, cacheKey)) {
      return null;
    }
    return Boolean(_state.booleanFieldStateCache[cacheKey]);
  }

  v2.readBooleanFieldCache = readBooleanFieldCache;

  function writeBooleanFieldCache(formNode, fieldName, value) {
    var cacheKey = booleanFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return;
    }
    _state.booleanFieldStateCache[cacheKey] = Boolean(value);
  }

  v2.writeBooleanFieldCache = writeBooleanFieldCache;

  function numericFieldCacheKey(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return "";
    }
    var normalizedFieldName = String(fieldName || "");
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var requiresRecordBinding =
      SUBTOTAL_REFRESH_FIELDS.indexOf(normalizedFieldName) >= 0 ||
      SUBTOTAL_TOGGLE_FIELDS.indexOf(normalizedFieldName) >= 0;
    if (requiresRecordBinding && !(modelName && recordId)) {
      return "";
    }
    if (modelName && recordId) {
      return [modelName, String(recordId), normalizedFieldName].join("|");
    }
    var scopeKey = computeScopeKey(formNode);
    if (recordId && (modelName || scopeKey)) {
      return [modelName || scopeKey, String(recordId), normalizedFieldName].join("|");
    }
    if (scopeKey) {
      return [scopeKey, normalizedFieldName].join("|");
    }
    return "";
  }

  v2.numericFieldCacheKey = numericFieldCacheKey;

  function readNumericFieldCache(formNode, fieldName) {
    var cacheKey = numericFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(_state.numericFieldValueCache, cacheKey)) {
      return null;
    }
    var value = Number(_state.numericFieldValueCache[cacheKey]);
    return Number.isFinite(value) ? value : null;
  }

  v2.readNumericFieldCache = readNumericFieldCache;

  function writeNumericFieldCache(formNode, fieldName, value) {
    var cacheKey = numericFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return;
    }
    var numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }
    _state.numericFieldValueCache[cacheKey] = numericValue;
  }

  v2.writeNumericFieldCache = writeNumericFieldCache;

  function readFieldBooleanValue(formNode, fieldName, defaultValue) {
    if (SUBTOTAL_TOGGLE_FIELDS.indexOf(String(fieldName || "")) >= 0) {
      var preferredCacheValue = readBooleanFieldCache(formNode, fieldName);
      if (preferredCacheValue !== null) {
        return Boolean(preferredCacheValue);
      }
    }
    var nodes = findFieldNodes(formNode, fieldName);
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      var checkbox = null;
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        checkbox = node;
      } else if (node instanceof HTMLElement) {
        checkbox = node.querySelector("input[type='checkbox']");
      }
      if (checkbox instanceof HTMLInputElement) {
        var checkboxValue = Boolean(checkbox.checked);
        writeBooleanFieldCache(formNode, fieldName, checkboxValue);
        return checkboxValue;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        var parsedInput = parseBooleanFieldValue(node.value, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedInput);
        return parsedInput;
      }
      var attrValue = node.getAttribute("value");
      if (attrValue !== null) {
        var parsedAttr = parseBooleanFieldValue(attrValue, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedAttr);
        return parsedAttr;
      }
      var textValue = cleanText(node.textContent || "");
      if (textValue) {
        var parsedText = parseBooleanFieldValue(textValue, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedText);
        return parsedText;
      }
    }
    var cachedValue = readBooleanFieldCache(formNode, fieldName);
    if (cachedValue !== null) {
      return Boolean(cachedValue);
    }
    return Boolean(defaultValue);
  }

  v2.readFieldBooleanValue = readFieldBooleanValue;

  function extractAssetNumberOnly(rawValue) {
    return window.__o_lib_asset_number_utils_v1.extractAssetNumberValue(rawValue);
  }

  v2.extractAssetNumberOnly = extractAssetNumberOnly;

  function bindAssetFieldNormalizeObserver(fieldNode, scheduleNormalize) {
    window.__o_lib_asset_number_utils_v1.bindAssetNumberNormalizeObserver(fieldNode, scheduleNormalize);
  }

  v2.bindAssetFieldNormalizeObserver = bindAssetFieldNormalizeObserver;

  function normalizeAssetNumberFieldDisplays(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var fieldNodes = findFieldNodes(formNode, "x_asset_lot_id");
    fieldNodes.forEach(function (fieldNode) {
      if (!(fieldNode instanceof HTMLElement)) {
        return;
      }
      var activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        fieldNode.contains(activeElement) &&
        (activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement.isContentEditable === true)
      ) {
        return;
      }
      if (fieldNode.dataset.libAssetNumberBound !== "1") {
        fieldNode.dataset.libAssetNumberBound = "1";
        var scheduleNormalize = function () {
          window.setTimeout(function () {
            normalizeAssetNumberFieldDisplays(formNode);
          }, 0);
        };
        fieldNode.addEventListener("blur", scheduleNormalize, true);
        fieldNode.addEventListener("change", scheduleNormalize, true);
        bindAssetFieldNormalizeObserver(fieldNode, scheduleNormalize);
      }
      var passiveDisplayValue = cleanText(fieldNode.textContent || "");
      var passiveAssetNumber = extractAssetNumberOnly(passiveDisplayValue);
      if (passiveAssetNumber && passiveAssetNumber !== passiveDisplayValue) {
        fieldNode.textContent = passiveAssetNumber;
      }

    });
  }

  v2.normalizeAssetNumberFieldDisplays = normalizeAssetNumberFieldDisplays;

  function readFormRecordId(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return 0;
    }
    var parseRecordId = function (rawValue) {
      var parsed = Number(rawValue || 0);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.trunc(parsed);
      }
      return 0;
    };
    var directCandidates = [
      formNode.getAttribute("data-res-id"),
      formNode.getAttribute("data-record-id"),
      formNode.getAttribute("data-id"),
      formNode.dataset.resId,
      formNode.dataset.recordId,
      formNode.dataset.id,
    ];
    for (var index = 0; index < directCandidates.length; index += 1) {
      var parsedDirect = parseRecordId(directCandidates[index]);
      if (parsedDirect > 0) {
        return parsedDirect;
      }
    }

    try {
      var pathname = String(window.location.pathname || "");
      var directPathPatterns = [/\/odoo\/rental\/(\d+)(?:\/|$)/];
      for (var directPathIndex = 0; directPathIndex < directPathPatterns.length; directPathIndex += 1) {
        var directPathMatch = pathname.match(directPathPatterns[directPathIndex]);
        if (!directPathMatch || !directPathMatch[1]) {
          continue;
        }
        var parsedDirectPath = parseRecordId(directPathMatch[1]);
        if (parsedDirectPath > 0) {
          return parsedDirectPath;
        }
      }
    } catch (_pathnameErr) {
      // Ignore malformed pathnames.
    }

    var nodeCandidates = [];
    var ancestorNode = formNode.closest("[data-res-id], [data-record-id], [data-id]");
    if (ancestorNode instanceof HTMLElement) {
      nodeCandidates.push(ancestorNode);
    }
    var descendantNode = formNode.querySelector("[data-res-id], [data-record-id], [data-id]");
    if (descendantNode instanceof HTMLElement) {
      nodeCandidates.push(descendantNode);
    }
    for (var nodeIndex = 0; nodeIndex < nodeCandidates.length; nodeIndex += 1) {
      var candidateNode = nodeCandidates[nodeIndex];
      var nodeValues = [
        candidateNode.getAttribute("data-res-id"),
        candidateNode.getAttribute("data-record-id"),
        candidateNode.getAttribute("data-id"),
        candidateNode.dataset.resId,
        candidateNode.dataset.recordId,
        candidateNode.dataset.id,
      ];
      for (var valueIndex = 0; valueIndex < nodeValues.length; valueIndex += 1) {
        var parsedNodeValue = parseRecordId(nodeValues[valueIndex]);
        if (parsedNodeValue > 0) {
          return parsedNodeValue;
        }
      }
    }

    try {
      var hash = String(window.location.hash || "");
      if (hash) {
        var hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        var hashId = parseRecordId(hashParams.get("id") || hashParams.get("res_id"));
        if (hashId > 0) {
          return hashId;
        }
      }
    } catch (_hashErr) {
      // Ignore malformed hashes.
    }

    var idFromField = Number(readFieldNumericValue(formNode, "id") || 0);
    if (Number.isFinite(idFromField) && idFromField > 0) {
      return Math.trunc(idFromField);
    }

    var pathname = String(window.location.pathname || "");
    var pathPatterns = [/\/action-\d+\/(\d+)(?:\/|$)/, /\/odoo\/rental\/(\d+)(?:\/|$)/];
    for (var pathIndex = 0; pathIndex < pathPatterns.length; pathIndex += 1) {
      var pathMatch = pathname.match(pathPatterns[pathIndex]);
      if (!pathMatch || !pathMatch[1]) {
        continue;
      }
      var parsed = Number(pathMatch[1] || 0);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.trunc(parsed);
      }
    }
    return 0;
  }

  v2.readFormRecordId = readFormRecordId;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/field_values.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/field_widget_sync.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_REFRESH_FIELDS = v2.SUBTOTAL_REFRESH_FIELDS;
  var SUBTOTAL_TOGGLE_FIELDS = v2.SUBTOTAL_TOGGLE_FIELDS;
  var callKw = function () { return v2.callKw.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var findFieldNodes = function () { return v2.findFieldNodes.apply(this, arguments); };
  var parseBooleanFieldValue = function () { return v2.parseBooleanFieldValue.apply(this, arguments); };
  var readBooleanFieldCache = function () { return v2.readBooleanFieldCache.apply(this, arguments); };
  var readFormRecordId = function () { return v2.readFormRecordId.apply(this, arguments); };
  var readNumericFieldCache = function () { return v2.readNumericFieldCache.apply(this, arguments); };
  var rpcUserContext = function () { return v2.rpcUserContext.apply(this, arguments); };
  var scheduleRefresh = function () { return v2.scheduleRefresh.apply(this, arguments); };
  var writeBooleanFieldCache = function () { return v2.writeBooleanFieldCache.apply(this, arguments); };
  var writeNumericFieldCache = function () { return v2.writeNumericFieldCache.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_widget_sync.js

  function applyBooleanFieldWidgets(formNode, fieldName, checked, dispatchEvents) {
    var nodes = findFieldNodes(formNode, fieldName);
    var applied = false;
    var shouldDispatch = Boolean(dispatchEvents);
    var targetValue = Boolean(checked);

    nodes.forEach(function (node) {
      var candidates = [];
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        candidates.push(node);
      } else if (node instanceof HTMLElement) {
        node.querySelectorAll("input[type='checkbox']").forEach(function (checkboxNode) {
          if (checkboxNode instanceof HTMLInputElement) {
            candidates.push(checkboxNode);
          }
        });
      }
      candidates.forEach(function (checkboxNode) {
        if (!(checkboxNode instanceof HTMLInputElement)) {
          return;
        }
        if (checkboxNode.checked !== targetValue) {
          checkboxNode.checked = targetValue;
          applied = true;
        }
        if (shouldDispatch) {
          checkboxNode.dispatchEvent(new Event("input", { bubbles: true }));
          checkboxNode.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
    return applied;
  }

  v2.applyBooleanFieldWidgets = applyBooleanFieldWidgets;

  function findEditableBooleanInput(formNode, fieldName) {
    var nodes = findFieldNodes(formNode, fieldName);
    var fallback = null;
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      var checkbox = null;
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        checkbox = node;
      } else if (node instanceof HTMLElement) {
        checkbox = node.querySelector("input[type='checkbox']");
      }
      if (!(checkbox instanceof HTMLInputElement)) {
        continue;
      }
      if (!checkbox.disabled) {
        return checkbox;
      }
      if (!fallback) {
        fallback = checkbox;
      }
    }
    return fallback;
  }

  v2.findEditableBooleanInput = findEditableBooleanInput;

  function syncBooleanFieldViaNativeForm(formNode, fieldName, checked) {
    var checkbox = findEditableBooleanInput(formNode, fieldName);
    if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) {
      return false;
    }
    var nextChecked = Boolean(checked);
    if (Boolean(checkbox.checked) !== nextChecked) {
      checkbox.click();
    }
    writeBooleanFieldCache(formNode, fieldName, nextChecked);
    window.setTimeout(function () {
      scheduleRefresh();
    }, 120);
    window.setTimeout(function () {
      scheduleRefresh();
    }, 320);
    return true;
  }

  v2.syncBooleanFieldViaNativeForm = syncBooleanFieldViaNativeForm;

  function applyNumericFieldWidgets(formNode, fieldName, numericValue) {
    var nodes = findFieldNodes(formNode, fieldName);
    var applied = false;
    var textValue = String(numericValue);
    nodes.forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        if (String(node.value || "") !== textValue) {
          node.value = textValue;
          applied = true;
        }
      }
      if (node.getAttribute("value") !== textValue) {
        node.setAttribute("value", textValue);
        applied = true;
      }
      var textTargets = [];
      if (node.childElementCount === 0) {
        textTargets.push(node);
      } else {
        node.querySelectorAll(".o_field_monetary, .oe_currency_value, span").forEach(function (childNode) {
          if (childNode instanceof HTMLElement) {
            textTargets.push(childNode);
          }
        });
      }
      textTargets.forEach(function (textNode) {
        if (!(textNode instanceof HTMLElement)) {
          return;
        }
        textNode.dataset.libNumericValue = textValue;
      });
    });
    return applied;
  }

  v2.applyNumericFieldWidgets = applyNumericFieldWidgets;

  async function refreshSubtotalToggleStateFromBackend(formNode, forceRefresh) {
    if (!(formNode instanceof HTMLElement)) {
      return false;
    }
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    if (!modelName || !recordId) {
      return false;
    }
    var recordKey = String(modelName) + "|" + String(recordId);
    if (!forceRefresh && _state.subtotalToggleStateSignatureByRecord[recordKey] === "ready") {
      return false;
    }
    if (_state.subtotalToggleStateLoadByRecord[recordKey]) {
      return _state.subtotalToggleStateLoadByRecord[recordKey];
    }
    var fieldNames = SUBTOTAL_REFRESH_FIELDS.slice();
    _state.subtotalToggleStateLoadByRecord[recordKey] = callKw(modelName, "read", [[recordId], fieldNames], {
      context: rpcUserContext(),
    })
      .then(function (records) {
        var row = Array.isArray(records) && records.length && records[0] && typeof records[0] === "object" ? records[0] : null;
        if (!row) {
          return false;
        }
        _state.subtotalToggleStateSignatureByRecord[recordKey] = "ready";
        var changed = false;
        fieldNames.forEach(function (fieldName) {
          if (!Object.prototype.hasOwnProperty.call(row, fieldName)) {
            return;
          }
          if (SUBTOTAL_TOGGLE_FIELDS.indexOf(fieldName) >= 0) {
            var nextBooleanValue = parseBooleanFieldValue(row[fieldName], true);
            var cachedBooleanValue = readBooleanFieldCache(formNode, fieldName);
            if (cachedBooleanValue === null || Boolean(cachedBooleanValue) !== nextBooleanValue) {
              changed = true;
            }
            writeBooleanFieldCache(formNode, fieldName, nextBooleanValue);
            if (applyBooleanFieldWidgets(formNode, fieldName, nextBooleanValue, false)) {
              changed = true;
            }
            return;
          }
          var nextNumericValue = Number(row[fieldName]);
          if (!Number.isFinite(nextNumericValue)) {
            nextNumericValue = 0;
          }
          var cachedNumericValue = readNumericFieldCache(formNode, fieldName);
          if (cachedNumericValue === null || Number(cachedNumericValue) !== nextNumericValue) {
            changed = true;
          }
          writeNumericFieldCache(formNode, fieldName, nextNumericValue);
          if (applyNumericFieldWidgets(formNode, fieldName, nextNumericValue)) {
            changed = true;
          }
        });
        if (changed) {
          scheduleRefresh();
        }
        return changed;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        delete _state.subtotalToggleStateLoadByRecord[recordKey];
      });
    return _state.subtotalToggleStateLoadByRecord[recordKey];
  }

  v2.refreshSubtotalToggleStateFromBackend = refreshSubtotalToggleStateFromBackend;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/field_widget_sync.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/process_persistence.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var COLLAPSED_GROUP_CLASS = v2.COLLAPSED_GROUP_CLASS;
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var cloneLayoutState = function () { return v2.cloneLayoutState.apply(this, arguments); };
  var collapsedEntryKey = function () { return v2.collapsedEntryKey.apply(this, arguments); };
  var computeScopeKey = function () { return v2.computeScopeKey.apply(this, arguments); };
  var dedupeKeys = function () { return v2.dedupeKeys.apply(this, arguments); };
  var ensureUserScopedKeys = function () { return v2.ensureUserScopedKeys.apply(this, arguments); };
  var findSectionHeader = function () { return v2.findSectionHeader.apply(this, arguments); };
  var getSectionGroups = function () { return v2.getSectionGroups.apply(this, arguments); };
  var normalizeStatePersistOptions = function () { return v2.normalizeStatePersistOptions.apply(this, arguments); };
  var openSectionSettingsPanel = function () { return v2.openSectionSettingsPanel.apply(this, arguments); };
  var setGroupCollapsed = function () { return v2.setGroupCollapsed.apply(this, arguments); };
  var writeLocalLayoutState = function () { return v2.writeLocalLayoutState.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/ui/process_persistence.js

  function applySavedOrderForForm(formNode, scopeKey) {
    var desiredOrder = _state.formLayoutState.order[scopeKey];
    if (!Array.isArray(desiredOrder) || !desiredOrder.length) {
      return;
    }

    var groups = getSectionGroups(formNode).filter(function (group) {
      return String(group.dataset.libSectionKey || "").trim();
    });

    if (!groups.length) {
      return;
    }

    var buckets = new Map();
    groups.forEach(function (group) {
      var parent = group.parentElement;
      if (!(parent instanceof HTMLElement)) {
        return;
      }
      if (!buckets.has(parent)) {
        buckets.set(parent, []);
      }
      buckets.get(parent).push(group);
    });

    buckets.forEach(function (bucket, parent) {
      if (!bucket.length) {
        return;
      }

      var byKey = new Map();
      bucket.forEach(function (group) {
        var key = String(group.dataset.libSectionKey || "").trim();
        if (key) {
          byKey.set(key, group);
        }
      });

      if (!byKey.size) {
        return;
      }

      var ordered = [];
      desiredOrder.forEach(function (key) {
        if (byKey.has(key)) {
          ordered.push(byKey.get(key));
          byKey.delete(key);
        }
      });

      bucket.forEach(function (group) {
        var key = String(group.dataset.libSectionKey || "").trim();
        if (key && byKey.has(key)) {
          ordered.push(group);
          byKey.delete(key);
        }
      });

      if (ordered.length !== bucket.length) {
        return;
      }

      var anchor = bucket[bucket.length - 1].nextSibling;
      ordered.forEach(function (group) {
        parent.insertBefore(group, anchor);
      });
    });
  }

  v2.applySavedOrderForForm = applySavedOrderForForm;

  function storeCurrentOrderForForm(formNode, scopeKey) {
    var keys = dedupeKeys(
      getSectionGroups(formNode).map(function (group) {
        return String(group.dataset.libSectionKey || "").trim();
      })
    );

    if (keys.length) {
      _state.formLayoutState.order[scopeKey] = keys;
    }
  }

  v2.storeCurrentOrderForForm = storeCurrentOrderForForm;

  function queueStatePersist(options) {
    var normalizedOptions = normalizeStatePersistOptions(options);
    if (normalizedOptions) {
      _state.pendingStatePersistOptions = normalizedOptions;
    }
    ensureUserScopedKeys();
    var snapshot = cloneLayoutState(_state.formLayoutState);
    writeLocalLayoutState(snapshot);

    if (!_state.formCanSaveToDb) {
      return Promise.resolve(null);
    }

    if (_state.formLayoutSavePromise) {
      _state.formLayoutSaveDirty = true;
      return _state.formLayoutSavePromise;
    }

    var optionsToPersist = _state.pendingStatePersistOptions;
    _state.pendingStatePersistOptions = null;

    _state.formLayoutSavePromise = Promise.resolve()
      .then(function () {
        return v2.callKw("ir.config_parameter", "set_param", [_state.dbParamKey, JSON.stringify(snapshot)], {});
      })
      .catch(function () {
        // Keep local state as fallback for the large layout payload.
      })
      .then(function () {
        return v2.persistAllReportSubtotalLayouts(snapshot, optionsToPersist);
      })
      .catch(function () {
        // Keep local state as fallback.
      })
      .finally(function () {
        _state.formLayoutSavePromise = null;
        if (_state.formLayoutSaveDirty) {
          _state.formLayoutSaveDirty = false;
          queueStatePersist();
        }
      });
    return _state.formLayoutSavePromise;
  }

  v2.queueStatePersist = queueStatePersist;

  function delayMs(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Math.max(0, Number(milliseconds || 0) || 0));
    });
  }

  v2.delayMs = delayMs;

  function onToggleSectionClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }

    var group = button.closest("." + COLLAPSIBLE_GROUP_CLASS);
    var formNode = button.closest(".o_form_view");
    if (!(group instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }

    var sectionKey = String(button.dataset.libSectionKey || group.dataset.libSectionKey || "").trim();
    if (!sectionKey) {
      return;
    }

    var scopeKey = computeScopeKey(formNode);
    var header = findSectionHeader(group);
    if (!(header instanceof HTMLElement)) {
      return;
    }

    var collapsed = !group.classList.contains(COLLAPSED_GROUP_CLASS);
    setGroupCollapsed(group, header, collapsed);
    _state.formLayoutState.collapsed[collapsedEntryKey(scopeKey, sectionKey)] = collapsed;
    queueStatePersist();
  }

  v2.onToggleSectionClick = onToggleSectionClick;

  function onSectionSettingsClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    var group = button.closest("." + COLLAPSIBLE_GROUP_CLASS);
    var formNode = button.closest(".o_form_view");
    if (!(group instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    var sectionKey = cleanText(button.dataset.libSectionKey || group.dataset.libSectionKey || "");
    openSectionSettingsPanel(formNode, sectionKey);
  }

  v2.onSectionSettingsClick = onSectionSettingsClick;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/process_persistence.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/state_keys.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var REPORT_SUBTOTAL_DB_PARAM_PREFIX = v2.REPORT_SUBTOTAL_DB_PARAM_PREFIX;
  var REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX = v2.REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var currentLocaleCode = function () { return v2.currentLocaleCode.apply(this, arguments); };
  var enforceCoreSubtotalLineRules = function () { return v2.enforceCoreSubtotalLineRules.apply(this, arguments); };
  var getSessionInfo = function () { return v2.getSessionInfo.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeStatePersistOptions = function () { return v2.normalizeStatePersistOptions.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/state_keys.js

  function hasActiveSubtotalEditMode() {
    return Object.keys(_state.subtotalEditModes).some(function (key) {
      return Boolean(_state.subtotalEditModes[key]);
    });
  }

  v2.hasActiveSubtotalEditMode = hasActiveSubtotalEditMode;

  function subtotalLayoutEntryKey(scopeKey, containerKey) {
    return "subtotal|" + scopeKey + "|" + containerKey;
  }

  v2.subtotalLayoutEntryKey = subtotalLayoutEntryKey;

  function subtotalLinesInOrder(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var enforced = enforceCoreSubtotalLineRules(normalized).layout;
    var lineById = new Map();
    enforced.lines.forEach(function (line) {
      if (!(line && line.id)) {
        return;
      }
      lineById.set(line.id, line);
    });
    var ordered = [];
    enforced.order.forEach(function (lineId) {
      if (lineById.has(lineId)) {
        ordered.push(lineById.get(lineId));
        lineById.delete(lineId);
      }
    });
    enforced.lines.forEach(function (line) {
      if (lineById.has(line.id)) {
        ordered.push(line);
        lineById.delete(line.id);
      }
    });
    return ordered;
  }

  v2.subtotalLinesInOrder = subtotalLinesInOrder;

  function buildReportSubtotalBaseKey(userId, localeCode, modelName) {
    var localeKey = normalizeKey(localeCode || "en_US") || "en_us";
    var modelKey = normalizeKey(modelName || "");
    if (!modelKey) {
      return "";
    }
    return REPORT_SUBTOTAL_DB_PARAM_PREFIX + String(userId || 0) + ".lang_" + localeKey + ".model_" + modelKey;
  }

  v2.buildReportSubtotalBaseKey = buildReportSubtotalBaseKey;

  function buildGlobalReportSubtotalBaseKey(localeCode, modelName) {
    var localeKey = normalizeKey(localeCode || "en_US") || "en_us";
    var modelKey = normalizeKey(modelName || "");
    if (!modelKey) {
      return "";
    }
    return REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX + "lang_" + localeKey + ".model_" + modelKey;
  }

  v2.buildGlobalReportSubtotalBaseKey = buildGlobalReportSubtotalBaseKey;

  function reportSubtotalLocaleCandidates() {
    var candidates = [];
    candidates.push(currentLocaleCode());
    candidates.push("en_US");
    var info = getSessionInfo();
    if (info && typeof info === "object") {
      candidates.push(cleanText(info.lang || ""));
      if (info.user_context && typeof info.user_context === "object") {
        candidates.push(cleanText(info.user_context.lang || ""));
      }
    }
    if (document && document.documentElement) {
      candidates.push(cleanText(document.documentElement.lang || ""));
    }
    var seen = new Set();
    var output = [];
    candidates.forEach(function (candidate) {
      var normalized = normalizeKey(candidate || "en_US") || "en_us";
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      output.push(candidate || "en_US");
    });
    if (!output.length) {
      output.push("en_US");
    }
    return output;
  }

  v2.reportSubtotalLocaleCandidates = reportSubtotalLocaleCandidates;

  function parseSubtotalLayoutStorageKey(layoutKey) {
    var rawKey = cleanText(layoutKey || "");
    if (!rawKey || rawKey.indexOf("subtotal|") !== 0) {
      return null;
    }
    var payload = rawKey.slice("subtotal|".length);
    if (!payload) {
      return null;
    }
    var separator = payload.lastIndexOf("|");
    if (separator <= 0 || separator >= payload.length - 1) {
      return null;
    }
    var scopeKey = cleanText(payload.slice(0, separator));
    var containerKey = cleanText(payload.slice(separator + 1));
    if (!scopeKey || !containerKey) {
      return null;
    }
    return {
      scopeKey: scopeKey,
      containerKey: containerKey,
    };
  }

  v2.parseSubtotalLayoutStorageKey = parseSubtotalLayoutStorageKey;

  function collectSubtotalPersistTargets(snapshot, preferredOptions) {
    var targets = [];
    var seen = new Set();
    function pushTarget(candidate) {
      var normalized = normalizeStatePersistOptions(candidate);
      if (!normalized) {
        return;
      }
      var key = normalized.scopeKey + "|" + normalized.containerKey;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      targets.push(normalized);
    }

    pushTarget(preferredOptions || null);

    var layouts = snapshot && snapshot.subtotalLayouts && typeof snapshot.subtotalLayouts === "object"
      ? snapshot.subtotalLayouts
      : {};
    Object.keys(layouts).forEach(function (layoutKey) {
      pushTarget(parseSubtotalLayoutStorageKey(layoutKey));
    });
    return targets;
  }

  v2.collectSubtotalPersistTargets = collectSubtotalPersistTargets;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/state_keys.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/line_rules.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var isUntaxedSubtotalLine = function () { return v2.isUntaxedSubtotalLine.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeSubtotalLabel = function () { return v2.normalizeSubtotalLabel.apply(this, arguments); };
  var normalizeSubtotalSourceField = function () { return v2.normalizeSubtotalSourceField.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/line_rules.js

  function normalizeSubtotalLineType(rawType, sourceField, label) {
    var typeName = cleanText(rawType || "").toLowerCase();
    var fieldKey = normalizeKey(sourceField || "");
    var labelKey = normalizeSubtotalLabel(label || "");
    if (fieldKey === "amount_untaxed" || labelKey.indexOf("untaxed") >= 0 || labelKey.indexOf("subtotal") >= 0) {
      return "base";
    }
    if (fieldKey === "amount_tax" || labelKey === "tax" || labelKey === "taxes" || labelKey.indexOf("tax_amount") >= 0) {
      return "tax";
    }
    if (fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total") {
      return "total";
    }
    if (fieldKey.indexOf("delivery_charge") >= 0) {
      return "charge";
    }
    if (fieldKey.indexOf("terp_amount") >= 0) {
      return "tax";
    }
    if (fieldKey.indexOf("ldw_amount") >= 0) {
      return "charge";
    }
    if (typeName === "charge" || typeName === "tax" || typeName === "special") {
      return typeName;
    }
    if (labelKey.indexOf("charge") >= 0 || labelKey.indexOf("fee") >= 0 || labelKey.indexOf("surcharge") >= 0) {
      return "charge";
    }
    if (labelKey.indexOf("tax") >= 0) {
      return "tax";
    }
    return "special";
  }

  v2.normalizeSubtotalLineType = normalizeSubtotalLineType;

  function normalizeSubtotalLineSign(rawSign) {
    var sign = cleanText(rawSign || "").toLowerCase();
    if (sign === "-" || sign === "negative" || sign === "minus") {
      return "negative";
    }
    return "positive";
  }

  v2.normalizeSubtotalLineSign = normalizeSubtotalLineSign;

  function subtotalLineSignMultiplier(line) {
    var sign = normalizeSubtotalLineSign(line && line.sign);
    return sign === "negative" ? -1 : 1;
  }

  v2.subtotalLineSignMultiplier = subtotalLineSignMultiplier;

  function subtotalLineType(line) {
    return normalizeSubtotalLineType(line && line.lineType, line && line.sourceField, line && line.label);
  }

  v2.subtotalLineType = subtotalLineType;

  function isAutoManagedSubtotalSourceField(sourceField) {
    var fieldKey = normalizeKey(sourceField || "");
    if (!fieldKey) {
      return false;
    }
    if (
      fieldKey === "amount_untaxed" ||
      fieldKey === "amount_tax" ||
      fieldKey === "amount_total" ||
      fieldKey === "x_terp_amount" ||
      fieldKey === "x_ldw_amount"
    ) {
      return true;
    }
    return false;
  }

  v2.isAutoManagedSubtotalSourceField = isAutoManagedSubtotalSourceField;

  function isTaxSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_tax") {
      return true;
    }
    if (lineKey === "amount_tax") {
      return true;
    }
    return normalizedLabel === "tax" || normalizedLabel === "taxes" || normalizedLabel.indexOf("tax_amount") >= 0;
  }

  v2.isTaxSubtotalLine = isTaxSubtotalLine;

  function isTerpSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey.indexOf("terp_amount") >= 0 || lineKey.indexOf("terp_amount") >= 0) {
      return true;
    }
    return normalizedLabel.indexOf("terp") >= 0;
  }

  v2.isTerpSubtotalLine = isTerpSubtotalLine;

  function isLdwSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey.indexOf("ldw_amount") >= 0 || lineKey.indexOf("ldw_amount") >= 0) {
      return true;
    }
    return normalizedLabel.indexOf("ldw") >= 0 || normalizedLabel.indexOf("loss_damage_waiver") >= 0;
  }

  v2.isLdwSubtotalLine = isLdwSubtotalLine;

  function isBackendManagedSubtotalLine(line) {
    if (!(line && typeof line === "object")) {
      return false;
    }
    var sourceKey = normalizeKey(line.sourceField || "");
    var idKey = normalizeKey(line.id || "");
    if (
      sourceKey === "amount_untaxed" ||
      sourceKey === "amount_tax" ||
      sourceKey === "amount_total" ||
      sourceKey === "x_terp_amount" ||
      sourceKey === "x_ldw_amount" ||
      idKey === "amount_untaxed" ||
      idKey === "amount_tax" ||
      idKey === "amount_total" ||
      idKey === "x_terp_amount" ||
      idKey === "x_ldw_amount"
    ) {
      return true;
    }
    var lineType = subtotalLineType(line);
    if (lineType === "base" || lineType === "total") {
      return true;
    }
    if (lineType === "tax" && isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
      return true;
    }
    return false;
  }

  v2.isBackendManagedSubtotalLine = isBackendManagedSubtotalLine;

  function sanitizeSubtotalLine(line, fallbackId) {
    if (!line || typeof line !== "object") {
      return null;
    }
    var lineId = cleanText(line.id || fallbackId || "");
    if (!lineId) {
      return null;
    }
    var label = cleanText(line.label || "");
    var formula = cleanText(line.formula || "");
    var sourceField = normalizeSubtotalSourceField(line.sourceField || "");
    var lineType = normalizeSubtotalLineType(line.lineType, sourceField, label);
    var terpLine = isTerpSubtotalLine(label, sourceField, lineId);
    var ldwLine = isLdwSubtotalLine(label, sourceField, lineId);
    if (!sourceField) {
      if (terpLine) {
        sourceField = "x_terp_amount";
      } else if (ldwLine) {
        sourceField = "x_ldw_amount";
      } else
        if (lineType === "base" || isUntaxedSubtotalLine(label, sourceField, lineId)) {
          sourceField = "amount_untaxed";
        } else if (lineType === "tax" || isTaxSubtotalLine(label, sourceField, lineId)) {
          sourceField = "amount_tax";
        } else if (lineType === "total") {
          sourceField = "amount_total";
        }
    }
    lineType = normalizeSubtotalLineType(lineType, sourceField, label);
    if ((!formula || !cleanText(formula)) && sourceField) {
      formula = "{field:" + sourceField + "}";
    }
    var formulaFieldMatch = String(formula || "").match(/^\{field:([^}]+)\}$/i);
    if (formulaFieldMatch && formulaFieldMatch[1]) {
      var normalizedFormulaField = normalizeSubtotalSourceField(formulaFieldMatch[1]);
      if (normalizedFormulaField) {
        formula = "{field:" + normalizedFormulaField + "}";
      }
    }
    var sign = normalizeSubtotalLineSign(line.sign);
    if (lineType === "base" || lineType === "total") {
      sign = "positive";
    }
    var formulaLocked = line.formulaLocked === true;
    if (lineType === "base" || lineType === "tax" || lineType === "total" || isAutoManagedSubtotalSourceField(sourceField)) {
      formulaLocked = true;
    }
    return {
      id: lineId,
      label: label || "Line",
      formula: formula || (sourceField ? "{field:" + sourceField + "}" : ""),
      sourceField: sourceField,
      removable: line.removable !== false,
      formulaLocked: formulaLocked,
      lineType: lineType,
      sign: sign,
    };
  }

  v2.sanitizeSubtotalLine = sanitizeSubtotalLine;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/line_rules.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/storage.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_CONTAINER_CLASS = v2.SUBTOTAL_CONTAINER_CLASS;
  var SUBTOTAL_TOGGLE_BY_SOURCE = v2.SUBTOTAL_TOGGLE_BY_SOURCE;
  var SUBTOTAL_TOGGLE_FIELDS = v2.SUBTOTAL_TOGGLE_FIELDS;
  var SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS = v2.SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS;
  var applyBooleanFieldWidgets = function () { return v2.applyBooleanFieldWidgets.apply(this, arguments); };
  var callKw = function () { return v2.callKw.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var computeModelName = function () { return v2.computeModelName.apply(this, arguments); };
  var dedupeKeys = function () { return v2.dedupeKeys.apply(this, arguments); };
  var findFieldNodes = function () { return v2.findFieldNodes.apply(this, arguments); };
  var normalizeSubtotalLabel = function () { return v2.normalizeSubtotalLabel.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };
  var normalizeSubtotalSourceField = function () { return v2.normalizeSubtotalSourceField.apply(this, arguments); };
  var readFormRecordId = function () { return v2.readFormRecordId.apply(this, arguments); };
  var refreshSubtotalToggleStateFromBackend = function () { return v2.refreshSubtotalToggleStateFromBackend.apply(this, arguments); };
  var rpcUserContext = function () { return v2.rpcUserContext.apply(this, arguments); };
  var sanitizeSubtotalLine = function () { return v2.sanitizeSubtotalLine.apply(this, arguments); };
  var subtotalLayoutEntryKey = function () { return v2.subtotalLayoutEntryKey.apply(this, arguments); };
  var syncBooleanFieldViaNativeForm = function () { return v2.syncBooleanFieldViaNativeForm.apply(this, arguments); };
  var validateSubtotalFormula = function () { return v2.validateSubtotalFormula.apply(this, arguments); };
  var writeBooleanFieldCache = function () { return v2.writeBooleanFieldCache.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/storage.js

  function readSubtotalLayoutState(scopeKey, containerKey) {
    var key = subtotalLayoutEntryKey(scopeKey, containerKey);
    var raw = _state.formLayoutState.subtotalLayouts[key];
    if (!raw || typeof raw !== "object") {
      return { lines: [], order: [] };
    }
    var lines = [];
    if (Array.isArray(raw.lines)) {
      raw.lines.forEach(function (line, index) {
        var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
        if (cleaned) {
          lines.push(cleaned);
        }
      });
    }
    var order = Array.isArray(raw.order)
      ? dedupeKeys(
        raw.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    return {
      lines: lines,
      order: order,
    };
  }

  v2.readSubtotalLayoutState = readSubtotalLayoutState;

  function writeSubtotalLayoutState(scopeKey, containerKey, layout) {
    var key = subtotalLayoutEntryKey(scopeKey, containerKey);
    var lines = [];
    if (layout && Array.isArray(layout.lines)) {
      layout.lines.forEach(function (line, index) {
        var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
        if (cleaned) {
          lines.push(cleaned);
        }
      });
    }
    var order = Array.isArray(layout && layout.order)
      ? dedupeKeys(
        layout.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    _state.formLayoutState.subtotalLayouts[key] = {
      lines: lines,
      order: order,
    };
  }

  v2.writeSubtotalLayoutState = writeSubtotalLayoutState;

  function subtotalEditStateKey(scopeKey, containerKey) {
    return scopeKey + "|" + containerKey;
  }

  v2.subtotalEditStateKey = subtotalEditStateKey;

  function validateSubtotalLayoutForSave(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var lineIds = normalized.lines
      .map(function (line) {
        return cleanText((line && line.id) || "").toLowerCase();
      })
      .filter(Boolean);
    for (var index = 0; index < normalized.lines.length; index += 1) {
      var line = normalized.lines[index];
      var formulaSeed = line && line.formula ? line.formula : line && line.sourceField ? "{field:" + line.sourceField + "}" : "";
      var check = validateSubtotalFormula(formulaSeed, lineIds);
      if (!check.valid) {
        return {
          valid: false,
          reason: check.reason || "invalid_formula",
        };
      }
    }
    return { valid: true };
  }

  v2.validateSubtotalLayoutForSave = validateSubtotalLayoutForSave;

  function collectActiveSubtotalEditContexts() {
    var contexts = [];
    document.querySelectorAll("." + SUBTOTAL_CONTAINER_CLASS).forEach(function (containerNode) {
      if (!(containerNode instanceof HTMLElement)) {
        return;
      }
      var scopeKey = cleanText(containerNode.dataset.libSubtotalScope || "");
      var containerKey = cleanText(containerNode.dataset.libSubtotalKey || "");
      if (!scopeKey || !containerKey) {
        return;
      }
      var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
      if (!_state.subtotalEditModes[editStateKey]) {
        return;
      }
      var formNode = containerNode.closest(".o_form_view");
      if (!(formNode instanceof HTMLElement)) {
        return;
      }
      contexts.push({
        formNode: formNode,
        containerNode: containerNode,
        scopeKey: scopeKey,
        containerKey: containerKey,
        editStateKey: editStateKey,
      });
    });
    return contexts;
  }

  v2.collectActiveSubtotalEditContexts = collectActiveSubtotalEditContexts;

  function cloneSubtotalLayout(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    return {
      lines: normalized.lines.map(function (line) {
        return {
          id: line.id,
          label: line.label,
          formula: line.formula,
          sourceField: line.sourceField,
          removable: line.removable !== false,
          formulaLocked: line.formulaLocked === true,
          lineType: line.lineType,
          sign: line.sign,
        };
      }),
      order: normalized.order.slice(),
    };
  }

  v2.cloneSubtotalLayout = cloneSubtotalLayout;

  function subtotalLayoutSignature(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    return JSON.stringify({
      lines: normalized.lines.map(function (line) {
        return {
          id: line.id,
          label: line.label,
          formula: line.formula,
          sourceField: line.sourceField,
          removable: line.removable !== false,
          formulaLocked: line.formulaLocked === true,
          lineType: line.lineType,
          sign: line.sign,
        };
      }),
      order: normalized.order.slice(),
    });
  }

  v2.subtotalLayoutSignature = subtotalLayoutSignature;

  function findSubtotalContainers(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return [];
    }
    var containers = Array.prototype.slice.call(formNode.querySelectorAll(".oe_subtotal_footer"));
    return containers.filter(function (container) {
      return container instanceof HTMLElement;
    });
  }

  v2.findSubtotalContainers = findSubtotalContainers;

  function syncSubtotalRecordBinding(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return false;
    }
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var recordKey = modelName && recordId ? String(modelName) + "|" + String(recordId) : "";
    var previousKey = String(formNode.dataset.libSubtotalRecordKey || "");
    if (previousKey && previousKey !== recordKey) {
      delete _state.subtotalToggleStateSignatureByRecord[previousKey];
    }
    if (recordKey && previousKey !== recordKey) {
      formNode.dataset.libSubtotalRecordKey = recordKey;
      delete _state.subtotalToggleStateSignatureByRecord[recordKey];
      return true;
    }
    if (!recordKey && previousKey) {
      formNode.dataset.libSubtotalRecordKey = "";
      return true;
    }
    return false;
  }

  v2.syncSubtotalRecordBinding = syncSubtotalRecordBinding;

  async function writeBooleanFieldToBackend(formNode, fieldName, checked) {
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    if (!modelName || !recordId || !fieldName) {
      return false;
    }
    var values = {};
    values[String(fieldName)] = Boolean(checked);
    await callKw(modelName, "write", [[recordId], values], { context: rpcUserContext() });
    return true;
  }

  v2.writeBooleanFieldToBackend = writeBooleanFieldToBackend;

  async function syncBooleanFieldWidgets(formNode, fieldName, checked) {
    var nextChecked = Boolean(checked);
    var recordId = readFormRecordId(formNode);
    if (!recordId && syncBooleanFieldViaNativeForm(formNode, fieldName, nextChecked)) {
      return true;
    }
    applyBooleanFieldWidgets(formNode, fieldName, nextChecked, false);
    writeBooleanFieldCache(formNode, fieldName, nextChecked);
    try {
      var persisted = await writeBooleanFieldToBackend(formNode, fieldName, nextChecked);
      if (!persisted) {
        return false;
      }
      await refreshSubtotalToggleStateFromBackend(formNode, true);
      window.setTimeout(function () {
        refreshSubtotalToggleStateFromBackend(formNode, true);
      }, 220);
      return true;
    } catch (_err) {
      return false;
    }
  }

  v2.syncBooleanFieldWidgets = syncBooleanFieldWidgets;

  function subtotalToggleMetaForSource(sourceField) {
    var normalized = normalizeSubtotalSourceField(sourceField || "");
    if (!normalized) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, normalized)) {
      return SUBTOTAL_TOGGLE_BY_SOURCE[normalized];
    }
    return null;
  }

  v2.subtotalToggleMetaForSource = subtotalToggleMetaForSource;

  function subtotalToggleMetaForLine(line) {
    if (!(line && typeof line === "object")) {
      return null;
    }
    var sourceField = normalizeSubtotalSourceField(line.sourceField || "");
    if (!sourceField) {
      var formulaMatch = String(line.formula || "").match(/^\{field:([^}]+)\}$/i);
      if (formulaMatch && formulaMatch[1]) {
        sourceField = normalizeSubtotalSourceField(formulaMatch[1]);
      }
    }
    var bySource = subtotalToggleMetaForSource(sourceField);
    if (bySource) {
      return bySource;
    }
    var labelKey = normalizeSubtotalLabel(line.label || "");
    if (labelKey.indexOf("terp") >= 0) {
      return SUBTOTAL_TOGGLE_BY_SOURCE.x_terp_amount;
    }
    if (labelKey.indexOf("ldw") >= 0 || labelKey.indexOf("loss damage waiver") >= 0) {
      return SUBTOTAL_TOGGLE_BY_SOURCE.x_ldw_amount;
    }
    return null;
  }

  v2.subtotalToggleMetaForLine = subtotalToggleMetaForLine;

  function hideStandaloneSubtotalToggleFields(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var taxTotalsNode = formNode.querySelector("[name='tax_totals'], [data-name='tax_totals']");
    var subtotalRegion = taxTotalsNode instanceof HTMLElement ? taxTotalsNode.closest(".o_group, .o_inner_group, .oe_subtotal_footer, .o_form_sheet") : null;

    SUBTOTAL_TOGGLE_FIELDS.forEach(function (fieldName) {
      var nodes = findFieldNodes(formNode, fieldName);
      nodes.forEach(function (node) {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        var wrapper =
          node.closest("div.d-flex.float-end") ||
          node.closest(".o_row") ||
          node.closest(".o_td_field") ||
          node.closest(".o_field_widget");
        if (!(wrapper instanceof HTMLElement)) {
          return;
        }
        if (subtotalRegion instanceof HTMLElement && !subtotalRegion.contains(wrapper)) {
          return;
        }
        wrapper.classList.add(SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS);
      });
    });
  }

  v2.hideStandaloneSubtotalToggleFields = hideStandaloneSubtotalToggleFields;

  function formatSubtotalValue(formNode, amount) {
    var currencySymbol = "$";
    var candidates = Array.prototype.slice.call(formNode.querySelectorAll(".o_field_monetary, .o_tax_totals, .oe_subtotal_footer"));
    for (var index = 0; index < candidates.length; index += 1) {
      var text = cleanText(candidates[index].textContent || "");
      if (!text) {
        continue;
      }
      var symbolMatch = text.match(/([$€£¥])/);
      if (symbolMatch && symbolMatch[1]) {
        currencySymbol = symbolMatch[1];
        break;
      }
    }
    var numeric = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return currencySymbol + " " + numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  v2.formatSubtotalValue = formatSubtotalValue;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/storage.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/layout_mutations.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var dedupeKeys = function () { return v2.dedupeKeys.apply(this, arguments); };
  var isLdwSubtotalLine = function () { return v2.isLdwSubtotalLine.apply(this, arguments); };
  var isTaxSubtotalLine = function () { return v2.isTaxSubtotalLine.apply(this, arguments); };
  var isTerpSubtotalLine = function () { return v2.isTerpSubtotalLine.apply(this, arguments); };
  var isUntaxedSubtotalLine = function () { return v2.isUntaxedSubtotalLine.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeSubtotalLabel = function () { return v2.normalizeSubtotalLabel.apply(this, arguments); };
  var normalizeSubtotalLineSign = function () { return v2.normalizeSubtotalLineSign.apply(this, arguments); };
  var normalizeSubtotalLineType = function () { return v2.normalizeSubtotalLineType.apply(this, arguments); };
  var sanitizeSubtotalLine = function () { return v2.sanitizeSubtotalLine.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/layout_mutations.js

  function normalizeSubtotalLayout(layout) {
    var lines = Array.isArray(layout && layout.lines) ? layout.lines : [];
    var cleanedLines = [];
    lines.forEach(function (line, index) {
      var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
      if (cleaned) {
        cleanedLines.push(cleaned);
      }
    });
    var byId = new Set(
      cleanedLines.map(function (line) {
        return line.id;
      })
    );
    var requestedOrder = Array.isArray(layout && layout.order)
      ? dedupeKeys(
        layout.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    var finalOrder = [];
    requestedOrder.forEach(function (lineId) {
      if (byId.has(lineId)) {
        finalOrder.push(lineId);
        byId.delete(lineId);
      }
    });
    cleanedLines.forEach(function (line) {
      if (byId.has(line.id)) {
        finalOrder.push(line.id);
        byId.delete(line.id);
      }
    });
    return {
      lines: cleanedLines,
      order: finalOrder,
    };
  }

  v2.normalizeSubtotalLayout = normalizeSubtotalLayout;

  function enforceCoreSubtotalLineRules(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var changed = false;
    normalized.lines.forEach(function (line) {
      if (!line || typeof line !== "object") {
        return;
      }
      if (isUntaxedSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "amount_untaxed") {
          line.sourceField = "amount_untaxed";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_untaxed}") {
          line.formula = "{field:amount_untaxed}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "base") {
          line.lineType = "base";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isTerpSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "x_terp_amount") {
          line.sourceField = "x_terp_amount";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:x_terp_amount}") {
          line.formula = "{field:x_terp_amount}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.lineType !== "tax") {
          line.lineType = "tax";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isLdwSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "x_ldw_amount") {
          line.sourceField = "x_ldw_amount";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:x_ldw_amount}") {
          line.formula = "{field:x_ldw_amount}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.lineType !== "charge") {
          line.lineType = "charge";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "amount_tax") {
          line.sourceField = "amount_tax";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_tax}") {
          line.formula = "{field:amount_tax}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "tax") {
          line.lineType = "tax";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      var fieldKey = normalizeKey(line.sourceField || "");
      var labelKey = normalizeSubtotalLabel(line.label);
      if (fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total") {
        if (cleanText(line.sourceField || "") !== "amount_total") {
          line.sourceField = "amount_total";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_total}") {
          line.formula = "{field:amount_total}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "total") {
          line.lineType = "total";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      var inferredType = normalizeSubtotalLineType(line.lineType, line.sourceField, line.label);
      if (line.lineType !== inferredType) {
        line.lineType = inferredType;
        changed = true;
      }
      var inferredSign = normalizeSubtotalLineSign(line.sign);
      if (line.sign !== inferredSign) {
        line.sign = inferredSign;
        changed = true;
      }
    });
    return { layout: normalized, changed: changed };
  }

  v2.enforceCoreSubtotalLineRules = enforceCoreSubtotalLineRules;

  function createSubtotalCustomLine() {
    var newId = "custom_" + String(Date.now()) + "_" + String(Math.floor(Math.random() * 10000));
    return sanitizeSubtotalLine(
      {
        id: newId,
        label: "Custom line",
        formula: "{subtotal}",
        sourceField: "",
        removable: true,
        lineType: "special",
        sign: "positive",
      },
      newId
    );
  }

  v2.createSubtotalCustomLine = createSubtotalCustomLine;

  function insertCustomSubtotalLine(layout, beforeLineId) {
    var nextLayout = normalizeSubtotalLayout(layout);
    var newLine = createSubtotalCustomLine();
    if (!newLine) {
      return nextLayout;
    }
    nextLayout.lines.push(newLine);
    var nextOrder = nextLayout.order.slice();
    var beforeKey = cleanText(beforeLineId || "");
    var insertAt = beforeKey ? nextOrder.indexOf(beforeKey) : -1;
    if (insertAt < 0) {
      nextOrder.push(newLine.id);
    } else {
      nextOrder.splice(insertAt, 0, newLine.id);
    }
    nextLayout.order = nextOrder;
    return nextLayout;
  }

  v2.insertCustomSubtotalLine = insertCustomSubtotalLine;

  function moveSubtotalLine(layout, sourceLineId, targetLineId, dropBefore) {
    var nextLayout = normalizeSubtotalLayout(layout);
    var sourceKey = cleanText(sourceLineId || "");
    var targetKey = cleanText(targetLineId || "");
    if (!sourceKey || !targetKey || sourceKey === targetKey) {
      return nextLayout;
    }
    var nextOrder = nextLayout.order.slice();
    var sourceIndex = nextOrder.indexOf(sourceKey);
    var targetIndex = nextOrder.indexOf(targetKey);
    if (sourceIndex < 0 || targetIndex < 0) {
      return nextLayout;
    }
    nextOrder.splice(sourceIndex, 1);
    var insertAt = dropBefore ? targetIndex : targetIndex + 1;
    if (sourceIndex < targetIndex) {
      insertAt -= 1;
    }
    if (insertAt < 0) {
      insertAt = 0;
    }
    if (insertAt > nextOrder.length) {
      insertAt = nextOrder.length;
    }
    nextOrder.splice(insertAt, 0, sourceKey);
    nextLayout.order = nextOrder;
    return nextLayout;
  }

  v2.moveSubtotalLine = moveSubtotalLine;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/layout_mutations.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/layout_labels_defaults.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var extractSubtotalRowLabelText = function () { return v2.extractSubtotalRowLabelText.apply(this, arguments); };
  var isTaxSubtotalLine = function () { return v2.isTaxSubtotalLine.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };
  var normalizeSubtotalLineType = function () { return v2.normalizeSubtotalLineType.apply(this, arguments); };
  var sanitizeSubtotalLine = function () { return v2.sanitizeSubtotalLine.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/layout_labels_defaults.js

  function normalizeSubtotalLabel(rawValue) {
    return normalizeKey(cleanText(rawValue || "").replace(/[:?]/g, " "));
  }

  v2.normalizeSubtotalLabel = normalizeSubtotalLabel;

  function normalizeSubtotalSourceField(rawFieldName) {
    var sourceField = cleanText(rawFieldName || "");
    if (!sourceField) {
      return "";
    }
    var lowered = normalizeKey(sourceField);
    if (!lowered) {
      return "";
    }
    if (
      lowered.indexOf("o_field_input_") === 0 ||
      lowered.indexOf("o_input_") === 0 ||
      lowered.indexOf("field_input_") === 0
    ) {
      return "";
    }
    var normalized = sourceField;
    if (/^(x_[a-z0-9_]+)_\d+$/i.test(normalized)) {
      normalized = normalized.replace(/^(x_[a-z0-9_]+)_\d+$/i, "$1");
    } else if (/^(amount_[a-z0-9_]+)_\d+$/i.test(normalized)) {
      normalized = normalized.replace(/^(amount_[a-z0-9_]+)_\d+$/i, "$1");
    }
    return cleanText(normalized || "");
  }

  v2.normalizeSubtotalSourceField = normalizeSubtotalSourceField;

  function deriveSubtotalSourceField(row, labelText) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var labelNode = row.querySelector("label");
    var labelForValue = cleanText((labelNode && labelNode.getAttribute && labelNode.getAttribute("for")) || "");
    var sourceField = "";
    var fieldNode = row.querySelector("[name], [data-name]");
    if (fieldNode instanceof HTMLElement) {
      sourceField = cleanText(fieldNode.getAttribute("name") || fieldNode.getAttribute("data-name") || "");
    }
    if (!sourceField) {
      sourceField = labelForValue;
    }
    sourceField = normalizeSubtotalSourceField(sourceField) || normalizeSubtotalSourceField(labelForValue);

    var normalizedLabel = normalizeSubtotalLabel(labelText);
    if (!sourceField && normalizedLabel.indexOf("terp") >= 0) {
      return "x_terp_amount";
    }
    if (!sourceField && (normalizedLabel.indexOf("ldw") >= 0 || normalizedLabel.indexOf("loss_damage_waiver") >= 0)) {
      return "x_ldw_amount";
    }
    if (!sourceField && normalizedLabel.indexOf("delivery_charge") >= 0) {
      return "x_delivery_charge";
    }
    if (!sourceField && (normalizedLabel === "total" || normalizedLabel === "grand_total")) {
      return "amount_total";
    }
    if (
      !sourceField &&
      (normalizedLabel === "tax" ||
        normalizedLabel === "taxes" ||
        normalizedLabel.indexOf("tax_amount") >= 0 ||
        normalizedLabel.indexOf("tax") >= 0)
    ) {
      return "amount_tax";
    }
    if (!sourceField && (normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0)) {
      return "amount_untaxed";
    }
    return normalizeSubtotalSourceField(sourceField);
  }

  v2.deriveSubtotalSourceField = deriveSubtotalSourceField;

  function isCoreSubtotalLine(labelText, sourceField) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    if (normalizedLabel.indexOf("margin") >= 0 || fieldKey.indexOf("margin") >= 0) {
      return true;
    }
    return false;
  }

  v2.isCoreSubtotalLine = isCoreSubtotalLine;

  function isUntaxedSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_untaxed") {
      return true;
    }
    if (lineKey === "amount_untaxed") {
      return true;
    }
    return normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0;
  }

  v2.isUntaxedSubtotalLine = isUntaxedSubtotalLine;

  function shouldSeedSubtotalLine(row, labelText, sourceField) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    if (!labelText) {
      return false;
    }
    if (isUntaxedSubtotalLine(labelText, sourceField)) {
      return true;
    }
    if (isCoreSubtotalLine(labelText, sourceField)) {
      return false;
    }
    var fieldKey = normalizeKey(sourceField || "");
    if (fieldKey.indexOf("tax_totals") >= 0) {
      return false;
    }
    if (fieldKey === "amount_tax" || isTaxSubtotalLine(labelText, sourceField)) {
      return true;
    }
    if (fieldKey.indexOf("x_") === 0) {
      return true;
    }
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    if (normalizedLabel.indexOf("amount") >= 0 && (normalizedLabel.indexOf("terp") >= 0 || normalizedLabel.indexOf("ldw") >= 0)) {
      return false;
    }
    return (
      normalizedLabel.indexOf("charge") >= 0 ||
      normalizedLabel.indexOf("terp") >= 0 ||
      normalizedLabel.indexOf("ldw") >= 0 ||
      fieldKey === "amount_total" ||
      normalizedLabel === "total" ||
      normalizedLabel === "grand_total"
    );
  }

  v2.shouldSeedSubtotalLine = shouldSeedSubtotalLine;

  function buildDefaultSubtotalLayout(nativeRows) {
    var layout = { lines: [], order: [] };
    if (!Array.isArray(nativeRows)) {
      return layout;
    }
    nativeRows.forEach(function (row, index) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      var labelText = extractSubtotalRowLabelText(row);
      var sourceField = deriveSubtotalSourceField(row, labelText);
      if (!shouldSeedSubtotalLine(row, labelText, sourceField)) {
        return;
      }
      var isUntaxed = isUntaxedSubtotalLine(labelText, sourceField);
      var isTax = isTaxSubtotalLine(labelText, sourceField);
      var isTotal = normalizeKey(sourceField || "") === "amount_total" || normalizeSubtotalLabel(labelText) === "total";
      var normalizedSourceField = sourceField || (isUntaxed ? "amount_untaxed" : isTax ? "amount_tax" : isTotal ? "amount_total" : "");
      var lineId = normalizeKey(normalizedSourceField || labelText) || "line_" + String(index + 1);
      var line = sanitizeSubtotalLine(
        {
          id: lineId,
          label: labelText.replace(/[:?]$/, ""),
          sourceField: normalizedSourceField,
          formula: normalizedSourceField ? "{field:" + normalizedSourceField + "}" : "{subtotal}",
          removable: isUntaxed || isTax || isTotal ? false : true,
          formulaLocked: isUntaxed || isTax || isTotal,
          lineType: isUntaxed ? "base" : isTax ? "tax" : isTotal ? "total" : normalizeSubtotalLineType("", normalizedSourceField, labelText),
          sign: "positive",
        },
        lineId
      );
      if (!line) {
        return;
      }
      layout.lines.push(line);
      layout.order.push(line.id);
    });
    return normalizeSubtotalLayout(layout);
  }

  v2.buildDefaultSubtotalLayout = buildDefaultSubtotalLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/layout_labels_defaults.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/native_rows.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_CONFIG_TRIGGER_CLASS = v2.SUBTOTAL_CONFIG_TRIGGER_CLASS;
  var SUBTOTAL_ERROR_ICON_CLASS = v2.SUBTOTAL_ERROR_ICON_CLASS;
  var SUBTOTAL_LINES_WRAP_CLASS = v2.SUBTOTAL_LINES_WRAP_CLASS;
  var SUBTOTAL_NATIVE_HIDDEN_CLASS = v2.SUBTOTAL_NATIVE_HIDDEN_CLASS;
  var SUBTOTAL_RESTORE_TRIGGER_CLASS = v2.SUBTOTAL_RESTORE_TRIGGER_CLASS;
  var SUBTOTAL_SAVE_TRIGGER_CLASS = v2.SUBTOTAL_SAVE_TRIGGER_CLASS;
  var buildDefaultSubtotalLayout = function () { return v2.buildDefaultSubtotalLayout.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var deriveSubtotalSourceField = function () { return v2.deriveSubtotalSourceField.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeSubtotalLabel = function () { return v2.normalizeSubtotalLabel.apply(this, arguments); };
  var parseNumericText = function () { return v2.parseNumericText.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/native_rows.js

  function validateSubtotalFormula(formulaText, availableLineIds) {
    var formula = cleanText(formulaText || "");
    if (!formula) {
      return {
        valid: false,
        message: "Formula is required.",
      };
    }
    var known = new Set(
      (Array.isArray(availableLineIds) ? availableLineIds : []).map(function (value) {
        return cleanText(value || "").toLowerCase();
      })
    );
    var hasTokenError = false;
    var rendered = formula.replace(/\{([^}]+)\}/g, function (_match, token) {
      var key = cleanText(token || "").toLowerCase();
      if (!key) {
        hasTokenError = true;
        return "0";
      }
      if (key === "subtotal" || key === "untaxed" || key === "total" || key === "tax" || key === "taxes") {
        return "1";
      }
      if (key.indexOf("field:") === 0) {
        var fieldName = cleanText(key.slice(6));
        if (!fieldName) {
          hasTokenError = true;
        }
        return "1";
      }
      if (known.has(key)) {
        return "1";
      }
      hasTokenError = true;
      return "0";
    });
    if (hasTokenError) {
      return {
        valid: false,
        message: "Unknown token in formula.",
      };
    }
    if (!/^[0-9+\-*/().\s]+$/.test(rendered)) {
      return {
        valid: false,
        message: "Only numbers and + - * / ( ) are allowed.",
      };
    }
    try {
      var evaluated = Function('"use strict"; return (' + rendered + ");")();
      if (!Number.isFinite(Number(evaluated))) {
        return {
          valid: false,
          message: "Formula did not produce a finite number.",
        };
      }
    } catch (_err) {
      return {
        valid: false,
        message: "Invalid formula syntax.",
      };
    }
    return { valid: true, message: "" };
  }

  v2.validateSubtotalFormula = validateSubtotalFormula;

  function collectSubtotalNativeRows(containerNode, includeHidden) {
    if (!(containerNode instanceof HTMLElement)) {
      return [];
    }
    var includeHiddenRows = Boolean(includeHidden);
    return Array.prototype.slice.call(containerNode.children).filter(function (child) {
      if (!(child instanceof HTMLElement)) {
        return false;
      }
      if (
        child.classList.contains(SUBTOTAL_LINES_WRAP_CLASS) ||
        child.classList.contains(SUBTOTAL_CONFIG_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_RESTORE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_SAVE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_ERROR_ICON_CLASS)
      ) {
        return false;
      }
      if (!includeHiddenRows && child.classList.contains(SUBTOTAL_NATIVE_HIDDEN_CLASS)) {
        return false;
      }
      if (!child.matches("div, section, article")) {
        return false;
      }
      if (child.matches("div.d-flex") && child.querySelector("label")) {
        return true;
      }
      if (child.querySelector("label")) {
        return true;
      }
      var text = cleanText(child.textContent || "");
      if (!text) {
        return false;
      }
      var hasValueNode = Boolean(
        child.querySelector(".o_field_monetary, .oe_currency_value, .o_field_widget, [name], [data-name], span")
      );
      return hasValueNode && /[:?]/.test(text);
    });
  }

  v2.collectSubtotalNativeRows = collectSubtotalNativeRows;

  function findSubtotalWrapInsertionAnchor(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var children = Array.prototype.slice.call(containerNode.children);
    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];
      if (!(child instanceof HTMLElement)) {
        continue;
      }
      if (
        child.classList.contains(SUBTOTAL_LINES_WRAP_CLASS) ||
        child.classList.contains(SUBTOTAL_CONFIG_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_RESTORE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_SAVE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_ERROR_ICON_CLASS)
      ) {
        continue;
      }

      var labelText = extractSubtotalRowLabelText(child);
      var sourceField = deriveSubtotalSourceField(child, labelText);
      var sourceKey = normalizeKey(sourceField || "");
      var labelKey = normalizeSubtotalLabel(labelText || "");
      var looksLikeSubtotalRow =
        sourceKey === "amount_untaxed" ||
        sourceKey === "amount_tax" ||
        sourceKey === "amount_total" ||
        sourceKey.indexOf("x_") === 0 ||
        labelKey.indexOf("untaxed") >= 0 ||
        labelKey.indexOf("subtotal") >= 0 ||
        labelKey.indexOf("tax") >= 0 ||
        labelKey === "total" ||
        labelKey === "grand_total" ||
        labelKey.indexOf("charge") >= 0 ||
        labelKey.indexOf("terp") >= 0 ||
        labelKey.indexOf("ldw") >= 0;
      if (looksLikeSubtotalRow) {
        return child;
      }
    }
    return null;
  }

  v2.findSubtotalWrapInsertionAnchor = findSubtotalWrapInsertionAnchor;

  function extractSubtotalRowLabelText(row) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var labelNode = row.querySelector("label");
    if (labelNode instanceof HTMLElement) {
      var fromLabel = cleanText(labelNode.textContent || "");
      if (fromLabel) {
        return fromLabel;
      }
    }

    var rawText = cleanText(row.textContent || "");
    if (!rawText) {
      return "";
    }
    var withoutAmounts = rawText
      .replace(/[$€£¥]\s*[-+]?\d[\d,]*(?:\.\d+)?/g, "")
      .replace(/[-+]?\d[\d,]*(?:\.\d+)?%?/g, "")
      .trim();
    if (!withoutAmounts) {
      return "";
    }
    var colonIndex = withoutAmounts.indexOf(":");
    if (colonIndex > 0) {
      return cleanText(withoutAmounts.slice(0, colonIndex));
    }
    return cleanText(withoutAmounts);
  }

  v2.extractSubtotalRowLabelText = extractSubtotalRowLabelText;

  function seedSubtotalLayoutFromNativeRows(layout, nativeRows) {
    if (!layout || !Array.isArray(layout.lines) || layout.lines.length || !Array.isArray(nativeRows) || !nativeRows.length) {
      return false;
    }
    var defaults = buildDefaultSubtotalLayout(nativeRows);
    layout.lines = Array.isArray(defaults.lines) ? defaults.lines : [];
    layout.order = Array.isArray(defaults.order) ? defaults.order : [];
    return layout.lines.length > 0;
  }

  v2.seedSubtotalLayoutFromNativeRows = seedSubtotalLayoutFromNativeRows;

  function extractSubtotalRowNumericValue(row) {
    if (!(row instanceof HTMLElement)) {
      return 0;
    }
    var candidates = row.querySelectorAll(
      ".o_field_monetary, .oe_currency_value, .o_field_widget, [name], [data-name], span"
    );
    for (var i = 0; i < candidates.length; i += 1) {
      var node = candidates[i];
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      var textValue = parseNumericText(node.textContent || "");
      if (textValue !== 0) {
        return textValue;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        var inputValue = parseNumericText(node.value);
        if (inputValue !== 0) {
          return inputValue;
        }
      }
    }
    return parseNumericText(row.textContent || "");
  }

  v2.extractSubtotalRowNumericValue = extractSubtotalRowNumericValue;

  function buildSubtotalNativeFieldValueIndex(nativeRows) {
    var values = {};
    if (!Array.isArray(nativeRows)) {
      return values;
    }
    nativeRows.forEach(function (row) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      var label = extractSubtotalRowLabelText(row);
      var sourceField = deriveSubtotalSourceField(row, label);
      var fieldKey = cleanText(sourceField || "").toLowerCase();
      var value = extractSubtotalRowNumericValue(row);
      if (!Number.isFinite(Number(value))) {
        return;
      }
      if (fieldKey) {
        values[fieldKey] = Number(value);
      }
      var normalizedLabel = normalizeSubtotalLabel(label || "");
      if ((normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0) && !values.amount_untaxed) {
        values.amount_untaxed = Number(value);
      }
      if (
        normalizedLabel === "tax" ||
        normalizedLabel === "taxes" ||
        normalizedLabel.indexOf("tax_amount") >= 0
      ) {
        values.amount_tax = Number(value);
      }
      if ((normalizedLabel === "total" || normalizedLabel === "grand_total") && !values.amount_total) {
        values.amount_total = Number(value);
      }
    });
    if (
      !Number.isFinite(Number(values.amount_tax)) &&
      Number.isFinite(Number(values.amount_total)) &&
      Number.isFinite(Number(values.amount_untaxed)) &&
      Number(values.amount_total) >= Number(values.amount_untaxed)
    ) {
      values.amount_tax = Number(values.amount_total) - Number(values.amount_untaxed);
    }
    return values;
  }

  v2.buildSubtotalNativeFieldValueIndex = buildSubtotalNativeFieldValueIndex;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/native_rows.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/formulas.js
(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var isTaxSubtotalLine = function () { return v2.isTaxSubtotalLine.apply(this, arguments); };
  var readFieldBooleanValue = function () { return v2.readFieldBooleanValue.apply(this, arguments); };
  var readFieldNumericValue = function () { return v2.readFieldNumericValue.apply(this, arguments); };
  var subtotalLineSignMultiplier = function () { return v2.subtotalLineSignMultiplier.apply(this, arguments); };
  var subtotalLineType = function () { return v2.subtotalLineType.apply(this, arguments); };
  var subtotalToggleMetaForLine = function () { return v2.subtotalToggleMetaForLine.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/formulas.js

  function resolveFormulaValue(formNode, line, lineValuesById, nativeFieldValues, lineById) {
    if (!(line && typeof line === "object")) {
      return 0;
    }
    var lineIdKey = cleanText((line && line.id) || "").toLowerCase();
    var lineTypeName = subtotalLineType(line);
    var toggleMeta = subtotalToggleMetaForLine(line);
    if (toggleMeta && toggleMeta.toggleField) {
      var lineEnabled = readFieldBooleanValue(formNode, toggleMeta.toggleField, true);
      if (!lineEnabled) {
        return 0;
      }
    }
    var baseFormula = cleanText(line.formula || "");
    if (!baseFormula && line.sourceField) {
      baseFormula = "{field:" + cleanText(line.sourceField) + "}";
    }
    if (!baseFormula) {
      return 0;
    }

    var fallbackUntaxed = Number(nativeFieldValues && nativeFieldValues.amount_untaxed);
    var fallbackTax = Number(nativeFieldValues && nativeFieldValues.amount_tax);
    var fallbackTotal = Number(nativeFieldValues && nativeFieldValues.amount_total);
    var subtotalAmount = readFieldNumericValue(formNode, "amount_untaxed");
    var taxAmount = readFieldNumericValue(formNode, "amount_tax");
    var totalAmount = readFieldNumericValue(formNode, "amount_total");
    if (subtotalAmount === 0 && Number.isFinite(fallbackUntaxed)) {
      subtotalAmount = fallbackUntaxed;
    }
    if (taxAmount === 0 && Number.isFinite(fallbackTax)) {
      taxAmount = fallbackTax;
    }
    if (totalAmount === 0 && Number.isFinite(fallbackTotal)) {
      totalAmount = fallbackTotal;
    }
    if (
      taxAmount === 0 &&
      Number.isFinite(totalAmount) &&
      Number.isFinite(subtotalAmount) &&
      Number(totalAmount) >= Number(subtotalAmount)
    ) {
      taxAmount = totalAmount - subtotalAmount;
    }

    if (lineTypeName === "base") {
      return Number.isFinite(Number(subtotalAmount)) ? Number(subtotalAmount) : 0;
    }
    if (lineTypeName === "tax" && isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
      return Number.isFinite(Number(taxAmount)) ? Number(taxAmount) : 0;
    }
    if (lineTypeName === "total") {
      var dynamicTotal = Number.isFinite(Number(subtotalAmount)) ? Number(subtotalAmount) : 0;
      dynamicTotal += Number.isFinite(Number(taxAmount)) ? Number(taxAmount) : 0;
      if (lineValuesById && typeof lineValuesById === "object") {
        Object.keys(lineValuesById).forEach(function (key) {
          var normalizedKey = cleanText(key || "").toLowerCase();
          if (!normalizedKey || normalizedKey === lineIdKey) {
            return;
          }
          var sourceLine = lineById && lineById[normalizedKey];
          if (!(sourceLine && typeof sourceLine === "object")) {
            return;
          }
          var sourceType = subtotalLineType(sourceLine);
          if (sourceType === "base" || sourceType === "tax" || sourceType === "total") {
            return;
          }
          dynamicTotal += Number(lineValuesById[normalizedKey] || 0);
        });
      }
      return dynamicTotal;
    }

    var rendered = baseFormula.replace(/\{([^}]+)\}/g, function (_match, token) {
      var key = cleanText(token || "").toLowerCase();
      if (!key) {
        return "0";
      }
      if (key === "subtotal" || key === "untaxed") {
        return String(subtotalAmount);
      }
      if (key === "tax" || key === "taxes") {
        return String(taxAmount);
      }
      if (key === "total") {
        return String(totalAmount);
      }
      if (key.indexOf("field:") === 0) {
        var fieldName = cleanText(key.slice(6));
        var fieldValue = readFieldNumericValue(formNode, fieldName);
        if (
          fieldName === "amount_tax" &&
          fieldValue === 0 &&
          Number.isFinite(Number(totalAmount)) &&
          Number.isFinite(Number(subtotalAmount)) &&
          Number(totalAmount) >= Number(subtotalAmount)
        ) {
          fieldValue = Number(totalAmount) - Number(subtotalAmount);
        }
        if (fieldValue === 0 && nativeFieldValues && Object.prototype.hasOwnProperty.call(nativeFieldValues, fieldName)) {
          fieldValue = Number(nativeFieldValues[fieldName] || 0);
        }
        return String(fieldValue);
      }
      if (lineValuesById && typeof lineValuesById === "object" && Object.prototype.hasOwnProperty.call(lineValuesById, key)) {
        return String(Number(lineValuesById[key] || 0));
      }
      return "0";
    });

    if (!/^[0-9+\-*/().\s]+$/.test(rendered)) {
      return 0;
    }
    try {
      var evaluated = Function('"use strict"; return (' + rendered + ");")();
      var numericValue = Number.isFinite(Number(evaluated)) ? Number(evaluated) : 0;
      var signMultiplier = subtotalLineSignMultiplier(line);
      if (lineTypeName === "charge" || lineTypeName === "tax" || lineTypeName === "special") {
        numericValue *= signMultiplier;
      }
      return numericValue;
    } catch (_err) {
      return 0;
    }
  }

  v2.resolveFormulaValue = resolveFormulaValue;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/formulas.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/persist.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var cloneSubtotalLayout = function () { return v2.cloneSubtotalLayout.apply(this, arguments); };
  var collectActiveSubtotalEditContexts = function () { return v2.collectActiveSubtotalEditContexts.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };
  var queueStatePersist = function () { return v2.queueStatePersist.apply(this, arguments); };
  var readSubtotalLayoutState = function () { return v2.readSubtotalLayoutState.apply(this, arguments); };
  var renderSubtotalLayout = function () { return v2.renderSubtotalLayout.apply(this, arguments); };
  var setSubtotalEditMode = function () { return v2.setSubtotalEditMode.apply(this, arguments); };
  var validateSubtotalLayoutForSave = function () { return v2.validateSubtotalLayoutForSave.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/persist.js

  async function persistActiveSubtotalEdits(contexts) {
    var editContexts = Array.isArray(contexts) ? contexts : collectActiveSubtotalEditContexts();
    if (!editContexts.length) {
      return true;
    }

    for (var index = 0; index < editContexts.length; index += 1) {
      var contextItem = editContexts[index];
      var currentLayout = normalizeSubtotalLayout(readSubtotalLayoutState(contextItem.scopeKey, contextItem.containerKey));
      var validation = validateSubtotalLayoutForSave(currentLayout);
      if (!validation.valid) {
        renderSubtotalLayout(
          contextItem.containerNode,
          contextItem.formNode,
          contextItem.scopeKey,
          contextItem.containerKey
        );
        window.alert("Fix invalid formulas before saving.");
        return false;
      }
      _state.subtotalEditSnapshots[contextItem.editStateKey] = cloneSubtotalLayout(currentLayout);
    }

    var firstContext = editContexts[0];
    await queueStatePersist({
      scopeKey: firstContext.scopeKey,
      containerKey: firstContext.containerKey,
    });

    editContexts.forEach(function (contextItem) {
      setSubtotalEditMode(
        contextItem.containerNode,
        contextItem.formNode,
        contextItem.scopeKey,
        contextItem.containerKey,
        false,
        true
      );
    });
    return true;
  }

  v2.persistActiveSubtotalEdits = persistActiveSubtotalEdits;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/persist.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/report_persistence.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var buildGlobalReportSubtotalBaseKey = function () { return v2.buildGlobalReportSubtotalBaseKey.apply(this, arguments); };
  var buildReportSubtotalBaseKey = function () { return v2.buildReportSubtotalBaseKey.apply(this, arguments); };
  var callKw = function () { return v2.callKw.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectSubtotalPersistTargets = function () { return v2.collectSubtotalPersistTargets.apply(this, arguments); };
  var currentUserId = function () { return v2.currentUserId.apply(this, arguments); };
  var dedupeKeys = function () { return v2.dedupeKeys.apply(this, arguments); };
  var normalizeStatePersistOptions = function () { return v2.normalizeStatePersistOptions.apply(this, arguments); };
  var normalizeSubtotalLineSign = function () { return v2.normalizeSubtotalLineSign.apply(this, arguments); };
  var normalizeSubtotalLineType = function () { return v2.normalizeSubtotalLineType.apply(this, arguments); };
  var reportSubtotalLocaleCandidates = function () { return v2.reportSubtotalLocaleCandidates.apply(this, arguments); };
  var scopeModelFromScopeKey = function () { return v2.scopeModelFromScopeKey.apply(this, arguments); };
  var subtotalLayoutEntryKey = function () { return v2.subtotalLayoutEntryKey.apply(this, arguments); };
  var subtotalLinesInOrder = function () { return v2.subtotalLinesInOrder.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/report_persistence.js

  async function writeReportSubtotalLayoutToParamBase(baseKey, orderedLines) {
    if (!baseKey) {
      return;
    }
    var lines = Array.isArray(orderedLines) ? orderedLines : [];
    await callKw("ir.config_parameter", "set_param", [baseKey + ".count", String(lines.length)], {});
    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index] || {};
      var lineLabel = cleanText(line.label || "");
      var lineFormula = cleanText(line.formula || "");
      var lineSource = cleanText(line.sourceField || "");
      if (!lineFormula && lineSource) {
        lineFormula = "{field:" + lineSource + "}";
      }
      var lineType = normalizeSubtotalLineType(line.lineType, lineSource, lineLabel);
      var lineSign = normalizeSubtotalLineSign(line.sign);
      var linePayload = [lineLabel, lineFormula, lineSource, lineType, lineSign].join("|~|");
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".label", lineLabel],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".formula", lineFormula],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".source", lineSource],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".type", lineType],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".sign", lineSign],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index), linePayload],
        {}
      );
    }
  }

  v2.writeReportSubtotalLayoutToParamBase = writeReportSubtotalLayoutToParamBase;

  async function persistReportSubtotalLayout(snapshot, options) {
    var normalizedOptions = normalizeStatePersistOptions(options);
    if (!normalizedOptions || !(snapshot && typeof snapshot === "object")) {
      return;
    }

    var modelName = scopeModelFromScopeKey(normalizedOptions.scopeKey);
    var modelCandidates = [];
    if (modelName && modelName !== "unknown_model") {
      modelCandidates.push(modelName);
    } else {
      // Fallback for clients where data-model is unavailable on form root.
      modelCandidates.push("sale_order", "account_move");
    }
    var uniqueModels = dedupeKeys(
      modelCandidates
        .map(function (value) {
          return cleanText(value || "");
        })
        .filter(Boolean)
    );
    if (!uniqueModels.length) {
      return;
    }

    var layoutKey = subtotalLayoutEntryKey(normalizedOptions.scopeKey, normalizedOptions.containerKey);
    var rawLayout = snapshot && snapshot.subtotalLayouts ? snapshot.subtotalLayouts[layoutKey] : null;
    var orderedLines = subtotalLinesInOrder(rawLayout);
    if (!orderedLines.length) {
      return;
    }
    var localeCandidates = reportSubtotalLocaleCandidates();
    for (var idx = 0; idx < uniqueModels.length; idx += 1) {
      var modelKey = uniqueModels[idx];
      for (var localeIdx = 0; localeIdx < localeCandidates.length; localeIdx += 1) {
        var localeCode = localeCandidates[localeIdx];
        var userBaseKey = buildReportSubtotalBaseKey(currentUserId() || 0, localeCode, modelKey);
        var globalBaseKey = buildGlobalReportSubtotalBaseKey(localeCode, modelKey);
        await writeReportSubtotalLayoutToParamBase(userBaseKey, orderedLines);
        await writeReportSubtotalLayoutToParamBase(globalBaseKey, orderedLines);
      }
    }
  }

  v2.persistReportSubtotalLayout = persistReportSubtotalLayout;

  async function persistReportSubtotalLayoutFromLayout(scopeKey, containerKey, layout) {
    var normalizedScope = cleanText(scopeKey || "");
    var normalizedContainer = cleanText(containerKey || "");
    if (!normalizedScope || !normalizedContainer) {
      return;
    }
    var modelName = scopeModelFromScopeKey(normalizedScope);
    var modelCandidates = [];
    if (modelName && modelName !== "unknown_model") {
      modelCandidates.push(modelName);
    } else {
      modelCandidates.push("sale_order", "account_move");
    }
    var uniqueModels = dedupeKeys(
      modelCandidates
        .map(function (value) {
          return cleanText(value || "");
        })
        .filter(Boolean)
    );
    if (!uniqueModels.length) {
      return;
    }

    var orderedLines = subtotalLinesInOrder(layout);
    if (!orderedLines.length) {
      return;
    }
    var localeCandidates = reportSubtotalLocaleCandidates();

    for (var idx = 0; idx < uniqueModels.length; idx += 1) {
      var modelKey = uniqueModels[idx];
      for (var localeIdx = 0; localeIdx < localeCandidates.length; localeIdx += 1) {
        var localeCode = localeCandidates[localeIdx];
        var userBaseKey = buildReportSubtotalBaseKey(currentUserId() || 0, localeCode, modelKey);
        var globalBaseKey = buildGlobalReportSubtotalBaseKey(localeCode, modelKey);
        await writeReportSubtotalLayoutToParamBase(userBaseKey, orderedLines);
        await writeReportSubtotalLayoutToParamBase(globalBaseKey, orderedLines);
      }
    }
  }

  v2.persistReportSubtotalLayoutFromLayout = persistReportSubtotalLayoutFromLayout;

  async function persistAllReportSubtotalLayouts(snapshot, preferredOptions) {
    var targets = collectSubtotalPersistTargets(snapshot, preferredOptions);
    for (var index = 0; index < targets.length; index += 1) {
      await persistReportSubtotalLayout(snapshot, targets[index]);
    }
  }

  v2.persistAllReportSubtotalLayouts = persistAllReportSubtotalLayouts;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/report_persistence.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/render_state.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_CONFIG_ACTIVE_CLASS = v2.SUBTOTAL_CONFIG_ACTIVE_CLASS;
  var SUBTOTAL_CONFIG_TRIGGER_CLASS = v2.SUBTOTAL_CONFIG_TRIGGER_CLASS;
  var SUBTOTAL_CONTAINER_CLASS = v2.SUBTOTAL_CONTAINER_CLASS;
  var SUBTOTAL_EDIT_MODE_CLASS = v2.SUBTOTAL_EDIT_MODE_CLASS;
  var SUBTOTAL_ERROR_ICON_CLASS = v2.SUBTOTAL_ERROR_ICON_CLASS;
  var SUBTOTAL_LINES_WRAP_CLASS = v2.SUBTOTAL_LINES_WRAP_CLASS;
  var SUBTOTAL_NATIVE_HIDDEN_CLASS = v2.SUBTOTAL_NATIVE_HIDDEN_CLASS;
  var SUBTOTAL_RESTORE_TRIGGER_CLASS = v2.SUBTOTAL_RESTORE_TRIGGER_CLASS;
  var applyCheckTriggerIcon = function () { return v2.applyCheckTriggerIcon.apply(this, arguments); };
  var applyPencilTriggerIcon = function () { return v2.applyPencilTriggerIcon.apply(this, arguments); };
  var buildDefaultSubtotalLayout = function () { return v2.buildDefaultSubtotalLayout.apply(this, arguments); };
  var buildSubtotalNativeFieldValueIndex = function () { return v2.buildSubtotalNativeFieldValueIndex.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var collectSubtotalNativeRows = function () { return v2.collectSubtotalNativeRows.apply(this, arguments); };
  var deriveSubtotalSourceField = function () { return v2.deriveSubtotalSourceField.apply(this, arguments); };
  var enforceCoreSubtotalLineRules = function () { return v2.enforceCoreSubtotalLineRules.apply(this, arguments); };
  var extractSubtotalRowLabelText = function () { return v2.extractSubtotalRowLabelText.apply(this, arguments); };
  var findSubtotalWrapInsertionAnchor = function () { return v2.findSubtotalWrapInsertionAnchor.apply(this, arguments); };
  var hideStandaloneSubtotalToggleFields = function () { return v2.hideStandaloneSubtotalToggleFields.apply(this, arguments); };
  var isCoreSubtotalLine = function () { return v2.isCoreSubtotalLine.apply(this, arguments); };
  var isTaxSubtotalLine = function () { return v2.isTaxSubtotalLine.apply(this, arguments); };
  var isUntaxedSubtotalLine = function () { return v2.isUntaxedSubtotalLine.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var normalizeSubtotalLabel = function () { return v2.normalizeSubtotalLabel.apply(this, arguments); };
  var normalizeSubtotalSourceField = function () { return v2.normalizeSubtotalSourceField.apply(this, arguments); };
  var queueStatePersist = function () { return v2.queueStatePersist.apply(this, arguments); };
  var readFieldBooleanValue = function () { return v2.readFieldBooleanValue.apply(this, arguments); };
  var readSubtotalLayoutState = function () { return v2.readSubtotalLayoutState.apply(this, arguments); };
  var resolveFormulaValue = function () { return v2.resolveFormulaValue.apply(this, arguments); };
  var sanitizeSubtotalLine = function () { return v2.sanitizeSubtotalLine.apply(this, arguments); };
  var seedSubtotalLayoutFromNativeRows = function () { return v2.seedSubtotalLayoutFromNativeRows.apply(this, arguments); };
  var subtotalEditStateKey = function () { return v2.subtotalEditStateKey.apply(this, arguments); };
  var subtotalLayoutEntryKey = function () { return v2.subtotalLayoutEntryKey.apply(this, arguments); };
  var subtotalLineType = function () { return v2.subtotalLineType.apply(this, arguments); };
  var subtotalToggleMetaForLine = function () { return v2.subtotalToggleMetaForLine.apply(this, arguments); };
  var subtotalToggleMetaForSource = function () { return v2.subtotalToggleMetaForSource.apply(this, arguments); };
  var validateSubtotalFormula = function () { return v2.validateSubtotalFormula.apply(this, arguments); };
  var writeSubtotalLayoutState = function () { return v2.writeSubtotalLayoutState.apply(this, arguments); };

  var subtotalsRuntime = v2.subtotals_runtime;

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render_state.js

  function persistPreparedSubtotalLayout(scopeKey, containerKey, layout, persistNeeded) {
    writeSubtotalLayoutState(scopeKey, containerKey, layout);
    if (!persistNeeded) {
      return;
    }
    queueStatePersist({
      scopeKey: scopeKey,
      containerKey: containerKey,
    });
  }

  function stripManagedSubtotalLines(layout) {
    var cleanedLines = layout.lines.filter(function (line) {
      var sourceKey = normalizeKey((line && line.sourceField) || "");
      if (isCoreSubtotalLine(line && line.label, line && line.sourceField)) {
        return false;
      }
      if (sourceKey === "tax_totals") {
        return false;
      }
      return true;
    });
    if (cleanedLines.length === layout.lines.length) {
      return false;
    }
    layout.lines = cleanedLines;
    layout.order = layout.order.filter(function (lineId) {
      return cleanedLines.some(function (line) {
        return line.id === lineId;
      });
    });
    cleanedLines.forEach(function (line) {
      if (layout.order.indexOf(line.id) < 0) {
        layout.order.push(line.id);
      }
    });
    return true;
  }

  function dedupeSubtotalLinesBySource(layout) {
    var seenSources = new Set();
    var removedIds = new Set();
    var changed = false;
    layout.lines = layout.lines.filter(function (line) {
      var sourceKey = normalizeKey((line && line.sourceField) || "");
      if (!sourceKey) {
        return true;
      }
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        return true;
      }
      removedIds.add(line.id);
      changed = true;
      return false;
    });
    if (!changed) {
      return false;
    }
    layout.order = layout.order.filter(function (lineId) {
      return !removedIds.has(lineId);
    });
    layout.lines.forEach(function (line) {
      if (layout.order.indexOf(line.id) < 0) {
        layout.order.push(line.id);
      }
    });
    return true;
  }

  function ensureRequiredSubtotalLine(layout, allNativeRows, matcher, fallbackLine, insertAtStart) {
    var hasLine = layout.lines.some(function (line) {
      return matcher(line);
    });
    if (hasLine) {
      return false;
    }
    var defaultLine = buildDefaultSubtotalLayout(allNativeRows).lines.find(matcher);
    if (!defaultLine) {
      defaultLine = sanitizeSubtotalLine(fallbackLine, fallbackLine.id);
    }
    if (!defaultLine) {
      return false;
    }
    layout.lines.push(defaultLine);
    if (layout.order.indexOf(defaultLine.id) < 0) {
      if (insertAtStart) {
        layout.order.unshift(defaultLine.id);
      } else {
        layout.order.push(defaultLine.id);
      }
    }
    return true;
  }

  function prepareSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey) {
    containerNode.classList.add(SUBTOTAL_CONTAINER_CLASS);
    hideStandaloneSubtotalToggleFields(formNode);

    var normalizedCore = enforceCoreSubtotalLineRules(readSubtotalLayoutState(scopeKey, containerKey));
    var layout = normalizedCore.layout;
    var persistNeeded = Boolean(normalizedCore.changed);

    if (stripManagedSubtotalLines(layout)) {
      persistNeeded = true;
    }
    if (dedupeSubtotalLinesBySource(layout)) {
      persistNeeded = true;
    }

    var allNativeRows = collectSubtotalNativeRows(containerNode, true);
    var layoutStateKey = subtotalLayoutEntryKey(scopeKey, containerKey);
    var hasStoredLayout = Object.prototype.hasOwnProperty.call(_state.formLayoutState.subtotalLayouts, layoutStateKey);
    if (!hasStoredLayout && seedSubtotalLayoutFromNativeRows(layout, allNativeRows)) {
      persistNeeded = true;
    }

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          return isUntaxedSubtotalLine(line && line.label, line && line.sourceField, line && line.id);
        },
        {
          id: "amount_untaxed",
          label: "Untaxed Amount",
          sourceField: "amount_untaxed",
          formula: "{field:amount_untaxed}",
          removable: false,
          formulaLocked: true,
        },
        true
      ) || persistNeeded;

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          return isTaxSubtotalLine(line && line.label, line && line.sourceField, line && line.id);
        },
        {
          id: "amount_tax",
          label: "Tax Amount",
          sourceField: "amount_tax",
          formula: "{field:amount_tax}",
          removable: false,
          formulaLocked: true,
          lineType: "tax",
          sign: "positive",
        },
        false
      ) || persistNeeded;

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          var fieldKey = normalizeKey((line && line.sourceField) || "");
          var labelKey = normalizeSubtotalLabel(line && line.label);
          return fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total";
        },
        {
          id: "amount_total",
          label: "Total",
          sourceField: "amount_total",
          formula: "{field:amount_total}",
          removable: false,
          formulaLocked: true,
        },
        false
      ) || persistNeeded;

    persistPreparedSubtotalLayout(scopeKey, containerKey, layout, persistNeeded);
    return {
      layout: layout,
      allNativeRows: allNativeRows,
    };
  }

  function syncNativeSubtotalRowsForRender(allNativeRows, layout) {
    var managedSourceFields = new Set();
    layout.lines.forEach(function (line) {
      var sourceField = normalizeSubtotalSourceField(line && line.sourceField ? line.sourceField : "");
      var sourceKey = normalizeKey(sourceField || "");
      if (sourceKey) {
        managedSourceFields.add(sourceKey);
      }
      var toggleMeta = subtotalToggleMetaForSource(sourceField);
      var toggleKey = normalizeKey(toggleMeta && toggleMeta.toggleField ? toggleMeta.toggleField : "");
      if (toggleKey) {
        managedSourceFields.add(toggleKey);
      }
    });

    allNativeRows.forEach(function (row) {
      var rowLabel = extractSubtotalRowLabelText(row);
      var rowSource = deriveSubtotalSourceField(row, rowLabel);
      var rowSourceKey = normalizeKey(rowSource || "");
      var rowLabelKey = normalizeSubtotalLabel(rowLabel);
      var rowHasCheckbox = Boolean(row.querySelector("input[type='checkbox']"));
      var isToggleProxyRow =
        rowHasCheckbox &&
        (rowSourceKey === "x_terp_enabled" ||
          rowSourceKey === "x_ldw_enabled" ||
          rowLabelKey.indexOf("terp") >= 0 ||
          rowLabelKey.indexOf("ldw") >= 0 ||
          rowLabelKey.indexOf("loss_damage_waiver") >= 0);
      var hideRow = Boolean(rowSourceKey && managedSourceFields.has(rowSourceKey) && !isCoreSubtotalLine(rowLabel, rowSource));
      if (isToggleProxyRow) {
        hideRow = true;
      }
      if (isUntaxedSubtotalLine(rowLabel, rowSource) || isTaxSubtotalLine(rowLabel, rowSource)) {
        hideRow = true;
      }
      if (rowSourceKey === "amount_total" || rowLabelKey === "total" || rowLabelKey === "grand_total") {
        hideRow = true;
      }
      if (rowLabelKey.indexOf("amount") >= 0 && (rowLabelKey.indexOf("terp") >= 0 || rowLabelKey.indexOf("ldw") >= 0)) {
        hideRow = true;
      }
      row.classList.toggle(SUBTOTAL_NATIVE_HIDDEN_CLASS, hideRow);
    });
  }

  function ensureSubtotalRenderWrap(containerNode, scopeKey, containerKey) {
    var wrap = containerNode.querySelector(":scope > ." + SUBTOTAL_LINES_WRAP_CLASS);
    if (!(wrap instanceof HTMLElement)) {
      wrap = document.createElement("div");
      wrap.className = SUBTOTAL_LINES_WRAP_CLASS;
    }
    var insertionAnchor = findSubtotalWrapInsertionAnchor(containerNode);
    if (insertionAnchor instanceof HTMLElement && insertionAnchor !== wrap) {
      containerNode.insertBefore(wrap, insertionAnchor);
    } else if (!(wrap.parentElement instanceof HTMLElement)) {
      containerNode.insertBefore(wrap, containerNode.firstChild);
    }
    wrap.dataset.libSubtotalScope = scopeKey;
    wrap.dataset.libSubtotalKey = containerKey;
    return wrap;
  }

  function updateSubtotalRenderChrome(containerNode, editMode) {
    containerNode.classList.toggle(SUBTOTAL_EDIT_MODE_CLASS, editMode);
    var subtotalTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_CONFIG_TRIGGER_CLASS);
    if (subtotalTrigger instanceof HTMLElement) {
      subtotalTrigger.classList.toggle(SUBTOTAL_CONFIG_ACTIVE_CLASS, editMode);
      if (editMode) {
        applyCheckTriggerIcon(subtotalTrigger, "Save subtotal changes");
      } else {
        applyPencilTriggerIcon(subtotalTrigger, "Edit subtotal");
      }
    }
    var restoreTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_RESTORE_TRIGGER_CLASS);
    if (restoreTrigger instanceof HTMLElement) {
      restoreTrigger.hidden = !editMode;
    }
  }

  function buildOrderedSubtotalRenderContext(formNode, containerNode, scopeKey, containerKey, layout, allNativeRows) {
    var lineById = new Map();
    var lineByIdLookup = {};
    layout.lines.forEach(function (line) {
      lineById.set(line.id, line);
      lineByIdLookup[cleanText((line && line.id) || "").toLowerCase()] = line;
    });

    var orderedLines = [];
    layout.order.forEach(function (lineId) {
      if (lineById.has(lineId)) {
        var orderedLine = lineById.get(lineId);
        orderedLines.push(orderedLine);
        lineById.delete(lineId);
      }
    });
    layout.lines.forEach(function (line) {
      if (lineById.has(line.id)) {
        orderedLines.push(line);
        lineById.delete(line.id);
      }
    });
    var visibleOrderedLines = orderedLines.filter(function (line) {
      var toggleMeta = subtotalToggleMetaForLine(line);
      if (!(toggleMeta && toggleMeta.toggleField)) {
        return true;
      }
      return readFieldBooleanValue(formNode, toggleMeta.toggleField, true);
    });

    var nativeFieldValues = buildSubtotalNativeFieldValueIndex(allNativeRows);
    var lineIds = orderedLines
      .map(function (line) {
        return cleanText((line && line.id) || "").toLowerCase();
      })
      .filter(Boolean);
    var runningValues = {};
    var invalidFormulaCount = 0;

    orderedLines.forEach(function (line) {
      if (subtotalLineType(line) === "total") {
        return;
      }
      var formulaCheck = validateSubtotalFormula(line.formula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""), lineIds);
      if (!formulaCheck.valid) {
        invalidFormulaCount += 1;
      }
      runningValues[cleanText(line.id || "").toLowerCase()] = formulaCheck.valid
        ? resolveFormulaValue(formNode, line, runningValues, nativeFieldValues, lineByIdLookup)
        : 0;
    });
    orderedLines.forEach(function (line) {
      if (subtotalLineType(line) !== "total") {
        return;
      }
      var formulaCheck = validateSubtotalFormula(line.formula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""), lineIds);
      if (!formulaCheck.valid) {
        invalidFormulaCount += 1;
      }
      runningValues[cleanText(line.id || "").toLowerCase()] = formulaCheck.valid
        ? resolveFormulaValue(formNode, line, runningValues, nativeFieldValues, lineByIdLookup)
        : 0;
    });

    var subtotalErrorIcon = containerNode.querySelector(":scope > ." + SUBTOTAL_ERROR_ICON_CLASS);
    if (subtotalErrorIcon instanceof HTMLElement) {
      var editMode = Boolean(_state.subtotalEditModes[subtotalEditStateKey(scopeKey, containerKey)]);
      subtotalErrorIcon.hidden = !editMode || invalidFormulaCount < 1;
      subtotalErrorIcon.title = invalidFormulaCount > 0 ? "Invalid formulas detected. Fix formulas or restore defaults." : "";
    }

    return {
      orderedLines: orderedLines,
      visibleOrderedLines: visibleOrderedLines,
      runningValues: runningValues,
    };
  }

  subtotalsRuntime.prepareSubtotalLayoutForRender = prepareSubtotalLayoutForRender;
  subtotalsRuntime.syncNativeSubtotalRowsForRender = syncNativeSubtotalRowsForRender;
  subtotalsRuntime.ensureSubtotalRenderWrap = ensureSubtotalRenderWrap;
  subtotalsRuntime.updateSubtotalRenderChrome = updateSubtotalRenderChrome;
  subtotalsRuntime.buildOrderedSubtotalRenderContext = buildOrderedSubtotalRenderContext;
  v2.dedupeSubtotalLinesBySource = dedupeSubtotalLinesBySource;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/render_state.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/render_rows.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_ADD_LINE_CLASS = v2.SUBTOTAL_ADD_LINE_CLASS;
  var SUBTOTAL_EDIT_ACTIONS_CLASS = v2.SUBTOTAL_EDIT_ACTIONS_CLASS;
  var SUBTOTAL_INSERT_LINE_CLASS = v2.SUBTOTAL_INSERT_LINE_CLASS;
  var SUBTOTAL_LINE_DRAGGING_CLASS = v2.SUBTOTAL_LINE_DRAGGING_CLASS;
  var SUBTOTAL_LINE_DROP_AFTER_CLASS = v2.SUBTOTAL_LINE_DROP_AFTER_CLASS;
  var SUBTOTAL_LINE_DROP_BEFORE_CLASS = v2.SUBTOTAL_LINE_DROP_BEFORE_CLASS;
  var SUBTOTAL_LINE_LABEL_CLASS = v2.SUBTOTAL_LINE_LABEL_CLASS;
  var SUBTOTAL_LINE_ROW_CLASS = v2.SUBTOTAL_LINE_ROW_CLASS;
  var SUBTOTAL_LINE_VALUE_CLASS = v2.SUBTOTAL_LINE_VALUE_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var clearSubtotalDropMarkers = function () { return v2.clearSubtotalDropMarkers.apply(this, arguments); };
  var formatSubtotalValue = function () { return v2.formatSubtotalValue.apply(this, arguments); };
  var insertCustomSubtotalLine = function () { return v2.insertCustomSubtotalLine.apply(this, arguments); };
  var isBackendManagedSubtotalLine = function () { return v2.isBackendManagedSubtotalLine.apply(this, arguments); };
  var moveSubtotalLine = function () { return v2.moveSubtotalLine.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };
  var normalizeSubtotalLineSign = function () { return v2.normalizeSubtotalLineSign.apply(this, arguments); };
  var readSubtotalLayoutState = function () { return v2.readSubtotalLayoutState.apply(this, arguments); };
  var renderSubtotalLayout = function () { return v2.renderSubtotalLayout.apply(this, arguments); };
  var subtotalLineType = function () { return v2.subtotalLineType.apply(this, arguments); };
  var validateSubtotalFormula = function () { return v2.validateSubtotalFormula.apply(this, arguments); };
  var writeSubtotalLayoutState = function () { return v2.writeSubtotalLayoutState.apply(this, arguments); };

  var subtotalsRuntime = v2.subtotals_runtime;

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render_rows.js

  function mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, mutator) {
    var nextLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
    mutator(nextLayout);
    writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
    renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
  }

  function createSubtotalTextInput(className, value, placeholder, onChange) {
    var input = document.createElement("input");
    input.type = "text";
    input.className = className;
    input.value = value;
    input.placeholder = placeholder;
    input.addEventListener("change", onChange);
    return input;
  }

  function createSubtotalSelect(className, currentValue, options, disabled, title, onChange) {
    var selectNode = document.createElement("select");
    selectNode.className = className;
    options.forEach(function (optMeta) {
      var opt = document.createElement("option");
      opt.value = optMeta.value;
      opt.textContent = optMeta.label;
      selectNode.appendChild(opt);
    });
    selectNode.value = currentValue;
    selectNode.disabled = Boolean(disabled);
    selectNode.title = title || "";
    selectNode.addEventListener("change", onChange);
    return selectNode;
  }

  function bindSubtotalRowDragHandlers(row, dragHandle, containerNode, formNode, scopeKey, containerKey, lineId) {
    dragHandle.addEventListener("dragstart", function (event) {
      event.stopPropagation();
      _state.subtotalDragState.sourceKey = lineId;
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", lineId);
        } catch (_err) {
          // Some browsers block setData for restricted mime-types.
        }
      }
      row.classList.add(SUBTOTAL_LINE_DRAGGING_CLASS);
    });
    dragHandle.addEventListener("dragend", function () {
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      row.classList.remove(SUBTOTAL_LINE_DRAGGING_CLASS);
      clearSubtotalDropMarkers(containerNode);
    });
    row.addEventListener("dragover", function (event) {
      if (!_state.subtotalDragState.sourceKey || _state.subtotalDragState.sourceKey === lineId) {
        return;
      }
      event.preventDefault();
      var rect = row.getBoundingClientRect();
      _state.subtotalDragState.targetKey = lineId;
      _state.subtotalDragState.dropBefore = event.clientY <= rect.top + rect.height / 2;
      clearSubtotalDropMarkers(containerNode);
      row.classList.add(_state.subtotalDragState.dropBefore ? SUBTOTAL_LINE_DROP_BEFORE_CLASS : SUBTOTAL_LINE_DROP_AFTER_CLASS);
    });
    row.addEventListener("drop", function (event) {
      if (!_state.subtotalDragState.sourceKey || !_state.subtotalDragState.targetKey) {
        return;
      }
      event.preventDefault();
      var nextLayout = moveSubtotalLine(
        readSubtotalLayoutState(scopeKey, containerKey),
        _state.subtotalDragState.sourceKey,
        _state.subtotalDragState.targetKey,
        _state.subtotalDragState.dropBefore
      );
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      clearSubtotalDropMarkers(containerNode);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
  }

  function buildSubtotalEditRow(containerNode, formNode, scopeKey, containerKey, line, valueAmount) {
    var row = document.createElement("div");
    row.className = SUBTOTAL_LINE_ROW_CLASS;
    row.dataset.libSubtotalLineId = line.id;
    row.dataset.libSubtotalScope = scopeKey;
    row.dataset.libSubtotalKey = containerKey;
    row.setAttribute("draggable", "false");

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "o_lib_subtotal_line_remove";
    removeBtn.textContent = "-";
    removeBtn.disabled = line.removable === false;
    removeBtn.title = "Remove line";
    removeBtn.addEventListener("click", function () {
      if (line.removable === false || !window.confirm("Remove this line?")) {
        return;
      }
      mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
        nextLayout.lines = nextLayout.lines.filter(function (existing) {
          return existing.id !== line.id;
        });
        nextLayout.order = nextLayout.order.filter(function (lineId) {
          return lineId !== line.id;
        });
      });
    });
    row.appendChild(removeBtn);

    var insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = SUBTOTAL_INSERT_LINE_CLASS;
    insertBtn.textContent = "+";
    insertBtn.title = "Add line above";
    insertBtn.addEventListener("click", function () {
      var nextLayout = insertCustomSubtotalLine(readSubtotalLayoutState(scopeKey, containerKey), line.id);
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
    row.appendChild(insertBtn);

    var dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "o_lib_subtotal_line_drag";
    dragHandle.textContent = "::";
    dragHandle.setAttribute("draggable", "true");
    dragHandle.title = "Drag line";
    row.appendChild(dragHandle);

    row.appendChild(
      createSubtotalTextInput(SUBTOTAL_LINE_LABEL_CLASS, line.label || "", "Label", function (event) {
        mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
          nextLayout.lines.forEach(function (existing) {
            if (existing.id === line.id) {
              existing.label = cleanText(event.target.value) || existing.label;
            }
          });
        });
      })
    );

    var currentLineType = subtotalLineType(line);
    var isCoreLineType = isBackendManagedSubtotalLine(line);
    var nextTypeValue = ["charge", "tax", "special"].indexOf(currentLineType) < 0
      ? (currentLineType === "base" || currentLineType === "total" ? currentLineType : "special")
      : currentLineType;
    var autoManagedFormula = isCoreLineType || line.formulaLocked === true;
    if (autoManagedFormula) {
      var formulaAuto = document.createElement("span");
      formulaAuto.className = "o_lib_subtotal_line_formula_auto";
      formulaAuto.textContent = "Auto";
      formulaAuto.title = "Calculated automatically";
      row.appendChild(formulaAuto);
    } else {
      var formulaInput = createSubtotalTextInput("o_lib_subtotal_line_formula", line.formula || "", "{subtotal}*0.15", function () {
        var candidateFormula = cleanText(formulaInput.value || "");
        var baselineLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
        var availableIds = baselineLayout.lines
          .map(function (existing) {
            return cleanText((existing && existing.id) || "").toLowerCase();
          })
          .filter(Boolean);
        var validation = validateSubtotalFormula(
          candidateFormula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""),
          availableIds
        );
        if (!validation.valid) {
          formulaInput.classList.add("o_lib_subtotal_formula_invalid");
          formulaInput.title = validation.message;
          formulaInput.value = line.formula || "";
          return;
        }
        mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
          nextLayout.lines.forEach(function (existing) {
            if (existing.id === line.id) {
              existing.formula = candidateFormula || existing.formula;
            }
          });
        });
      });
      formulaInput.addEventListener("input", function () {
        formulaInput.classList.remove("o_lib_subtotal_formula_invalid");
        formulaInput.title = "";
      });
      row.appendChild(formulaInput);
    }

    row.appendChild(
      createSubtotalSelect(
        "o_lib_subtotal_line_type",
        nextTypeValue,
        [
          { value: "base", label: "Base" },
          { value: "total", label: "Total" },
          { value: "charge", label: "Charge" },
          { value: "tax", label: "Tax" },
          { value: "special", label: "Special" },
        ],
        isCoreLineType,
        isCoreLineType ? "Type is fixed for this line." : "Type",
        function (event) {
          if (isCoreLineType) {
            return;
          }
          var nextType = cleanText(event.target.value || "special").toLowerCase();
          if (nextType === "base" || nextType === "total") {
            nextType = "special";
            event.target.value = nextType;
          }
          mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
            nextLayout.lines.forEach(function (existing) {
              if (existing.id === line.id) {
                existing.lineType = nextType;
              }
            });
          });
        }
      )
    );
    row.appendChild(
      createSubtotalSelect(
        "o_lib_subtotal_line_sign",
        normalizeSubtotalLineSign(line.sign),
        [
          { value: "positive", label: "+" },
          { value: "negative", label: "-" },
        ],
        isCoreLineType,
        isCoreLineType ? "Sign is fixed for this line." : "Sign",
        function (event) {
          if (isCoreLineType) {
            return;
          }
          mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
            nextLayout.lines.forEach(function (existing) {
              if (existing.id === line.id) {
                existing.sign = normalizeSubtotalLineSign(event.target.value);
              }
            });
          });
        }
      )
    );

    var preview = document.createElement("span");
    preview.className = SUBTOTAL_LINE_VALUE_CLASS;
    preview.textContent = formatSubtotalValue(formNode, valueAmount);
    row.appendChild(preview);

    bindSubtotalRowDragHandlers(row, dragHandle, containerNode, formNode, scopeKey, containerKey, line.id);
    return row;
  }

  function buildSubtotalDisplayRow(formNode, line, valueAmount, scopeKey, containerKey) {
    var row = document.createElement("div");
    row.className = SUBTOTAL_LINE_ROW_CLASS + " o_lib_subtotal_line_plain";
    row.dataset.libSubtotalLineId = line.id;
    row.dataset.libSubtotalScope = scopeKey;
    row.dataset.libSubtotalKey = containerKey;

    var labelWrap = document.createElement("label");
    labelWrap.className = "o_lib_subtotal_line_label_wrap";
    var label = document.createElement("span");
    label.className = SUBTOTAL_LINE_LABEL_CLASS;
    label.textContent = line.label || "Line";
    labelWrap.appendChild(label);
    row.appendChild(labelWrap);

    var value = document.createElement("span");
    value.className = SUBTOTAL_LINE_VALUE_CLASS;
    value.textContent = formatSubtotalValue(formNode, valueAmount);
    row.appendChild(value);
    return row;
  }

  function bindSubtotalWrapDropTargets(wrap, containerNode, formNode, scopeKey, containerKey, editMode) {
    if (!editMode) {
      wrap.ondragover = null;
      wrap.ondrop = null;
      return;
    }
    wrap.ondragover = function (event) {
      if (!_state.subtotalDragState.sourceKey) {
        return;
      }
      var targetRow = event.target instanceof HTMLElement ? event.target.closest("." + SUBTOTAL_LINE_ROW_CLASS) : null;
      if (targetRow && wrap.contains(targetRow)) {
        return;
      }
      var rows = wrap.querySelectorAll("." + SUBTOTAL_LINE_ROW_CLASS);
      if (!rows.length) {
        return;
      }
      event.preventDefault();
      var lastRow = rows[rows.length - 1];
      var lastLineId = cleanText(lastRow.dataset.libSubtotalLineId || "");
      if (!lastLineId || lastLineId === _state.subtotalDragState.sourceKey) {
        return;
      }
      clearSubtotalDropMarkers(containerNode);
      _state.subtotalDragState.targetKey = lastLineId;
      _state.subtotalDragState.dropBefore = false;
      lastRow.classList.add(SUBTOTAL_LINE_DROP_AFTER_CLASS);
    };
    wrap.ondrop = function (event) {
      if (!_state.subtotalDragState.sourceKey || !_state.subtotalDragState.targetKey) {
        return;
      }
      var targetRow = event.target instanceof HTMLElement ? event.target.closest("." + SUBTOTAL_LINE_ROW_CLASS) : null;
      if (targetRow && wrap.contains(targetRow)) {
        return;
      }
      event.preventDefault();
      var nextLayout = moveSubtotalLine(
        readSubtotalLayoutState(scopeKey, containerKey),
        _state.subtotalDragState.sourceKey,
        _state.subtotalDragState.targetKey,
        _state.subtotalDragState.dropBefore
      );
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      clearSubtotalDropMarkers(containerNode);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    };
  }

  function appendSubtotalEditActions(wrap, containerNode, formNode, scopeKey, containerKey) {
    var actions = document.createElement("div");
    actions.className = SUBTOTAL_EDIT_ACTIONS_CLASS;
    var addLineButton = document.createElement("button");
    addLineButton.type = "button";
    addLineButton.className = SUBTOTAL_ADD_LINE_CLASS;
    addLineButton.textContent = "Add line";
    addLineButton.addEventListener("click", function () {
      var nextLayout = insertCustomSubtotalLine(readSubtotalLayoutState(scopeKey, containerKey), "");
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
    actions.appendChild(addLineButton);
    wrap.appendChild(actions);
  }

  subtotalsRuntime.buildSubtotalEditRow = buildSubtotalEditRow;
  subtotalsRuntime.buildSubtotalDisplayRow = buildSubtotalDisplayRow;
  subtotalsRuntime.bindSubtotalWrapDropTargets = bindSubtotalWrapDropTargets;
  subtotalsRuntime.appendSubtotalEditActions = appendSubtotalEditActions;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/render_rows.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/render.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_NATIVE_HIDDEN_CLASS = v2.SUBTOTAL_NATIVE_HIDDEN_CLASS;
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var subtotalEditStateKey = function () { return v2.subtotalEditStateKey.apply(this, arguments); };
  var writeSubtotalLayoutState = function () { return v2.writeSubtotalLayoutState.apply(this, arguments); };

  var subtotalsRuntime = v2.subtotals_runtime;
  var prepareSubtotalLayoutForRender = function () {
    return subtotalsRuntime.prepareSubtotalLayoutForRender.apply(subtotalsRuntime, arguments);
  };
  var syncNativeSubtotalRowsForRender = function () {
    return subtotalsRuntime.syncNativeSubtotalRowsForRender.apply(subtotalsRuntime, arguments);
  };
  var ensureSubtotalRenderWrap = function () {
    return subtotalsRuntime.ensureSubtotalRenderWrap.apply(subtotalsRuntime, arguments);
  };
  var updateSubtotalRenderChrome = function () {
    return subtotalsRuntime.updateSubtotalRenderChrome.apply(subtotalsRuntime, arguments);
  };
  var buildOrderedSubtotalRenderContext = function () {
    return subtotalsRuntime.buildOrderedSubtotalRenderContext.apply(subtotalsRuntime, arguments);
  };
  var buildSubtotalEditRow = function () {
    return subtotalsRuntime.buildSubtotalEditRow.apply(subtotalsRuntime, arguments);
  };
  var buildSubtotalDisplayRow = function () {
    return subtotalsRuntime.buildSubtotalDisplayRow.apply(subtotalsRuntime, arguments);
  };
  var bindSubtotalWrapDropTargets = function () {
    return subtotalsRuntime.bindSubtotalWrapDropTargets.apply(subtotalsRuntime, arguments);
  };
  var appendSubtotalEditActions = function () {
    return subtotalsRuntime.appendSubtotalEditActions.apply(subtotalsRuntime, arguments);
  };

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render.js

  function renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }

    containerNode.querySelectorAll("." + SUBTOTAL_NATIVE_HIDDEN_CLASS).forEach(function (node) {
      node.classList.remove(SUBTOTAL_NATIVE_HIDDEN_CLASS);
    });
    var preparedLayout = prepareSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey);
    var layout = preparedLayout.layout;
    var allNativeRows = preparedLayout.allNativeRows;
    syncNativeSubtotalRowsForRender(allNativeRows, layout);

    var wrap = ensureSubtotalRenderWrap(containerNode, scopeKey, containerKey);
    var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
    var editMode = Boolean(_state.subtotalEditModes[editStateKey]);
    updateSubtotalRenderChrome(containerNode, editMode);

    wrap.innerHTML = "";
    var renderContext = buildOrderedSubtotalRenderContext(formNode, containerNode, scopeKey, containerKey, layout, allNativeRows);
    var visibleLines = Array.isArray(renderContext.visibleOrderedLines)
      ? renderContext.visibleOrderedLines
      : renderContext.orderedLines;
    visibleLines.forEach(function (line) {
      var valueAmount = Number(renderContext.runningValues[cleanText(line.id || "").toLowerCase()] || 0);
      var row = editMode
        ? buildSubtotalEditRow(containerNode, formNode, scopeKey, containerKey, line, valueAmount)
        : buildSubtotalDisplayRow(formNode, line, valueAmount, scopeKey, containerKey);
      wrap.appendChild(row);
    });
    bindSubtotalWrapDropTargets(wrap, containerNode, formNode, scopeKey, containerKey, editMode);
    if (editMode) {
      appendSubtotalEditActions(wrap, containerNode, formNode, scopeKey, containerKey);
    }

    writeSubtotalLayoutState(scopeKey, containerKey, layout);
  }

  v2.renderSubtotalLayout = renderSubtotalLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/render.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/toggle_menu.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS = v2.SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS;
  var SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS = v2.SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS;
  var SUBTOTAL_TOGGLE_MENU_ITEMS = v2.SUBTOTAL_TOGGLE_MENU_ITEMS;
  var SUBTOTAL_TOGGLE_MENU_LABEL_CLASS = v2.SUBTOTAL_TOGGLE_MENU_LABEL_CLASS;
  var SUBTOTAL_TOGGLE_MENU_OPEN_CLASS = v2.SUBTOTAL_TOGGLE_MENU_OPEN_CLASS;
  var SUBTOTAL_TOGGLE_MENU_PANEL_CLASS = v2.SUBTOTAL_TOGGLE_MENU_PANEL_CLASS;
  var SUBTOTAL_TOGGLE_MENU_ROW_CLASS = v2.SUBTOTAL_TOGGLE_MENU_ROW_CLASS;
  var SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS = v2.SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS;
  var applySettingsTriggerIcon = function () { return v2.applySettingsTriggerIcon.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var normalizeKey = function () { return v2.normalizeKey.apply(this, arguments); };
  var readFieldBooleanValue = function () { return v2.readFieldBooleanValue.apply(this, arguments); };
  var renderSubtotalLayout = function () { return v2.renderSubtotalLayout.apply(this, arguments); };


  function closeSubtotalToggleMenus(exceptAnchor) {
    var keepAnchor = exceptAnchor instanceof HTMLElement ? exceptAnchor : null;
    document
      .querySelectorAll("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS + "." + SUBTOTAL_TOGGLE_MENU_OPEN_CLASS)
      .forEach(function (anchorNode) {
        if (!(anchorNode instanceof HTMLElement)) {
          return;
        }
        if (keepAnchor && anchorNode === keepAnchor) {
          return;
        }
        anchorNode.classList.remove(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS);
        var triggerNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS);
        if (triggerNode instanceof HTMLElement) {
          triggerNode.setAttribute("aria-expanded", "false");
        }
      });
    _state.subtotalToggleMenuOpenAnchor = keepAnchor;
  }

  function bindSubtotalToggleMenuGlobalHandlers() {
    if (_state.subtotalToggleMenuHandlersBound) {
      return;
    }
    _state.subtotalToggleMenuHandlersBound = true;
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (target instanceof HTMLElement && target.closest("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS)) {
        return;
      }
      closeSubtotalToggleMenus();
    });
    document.addEventListener("keydown", function (event) {
      if (!(event && event.key === "Escape")) {
        return;
      }
      closeSubtotalToggleMenus();
    });
  }

  function subtotalActionButtonMatchesLabel(textValue) {
    var labelKey = normalizeKey(textValue || "");
    return labelKey === "coupon_code" || labelKey === "reward" || labelKey === "discount";
  }

  function subtotalToggleMenuRetryKey(scopeKey, containerKey) {
    return cleanText(scopeKey || "") + "::" + cleanText(containerKey || "");
  }

  function clearSubtotalToggleMenuRetry(scopeKey, containerKey) {
    _state.subtotalToggleMenuRetryTimers = _state.subtotalToggleMenuRetryTimers || {};
    _state.subtotalToggleMenuRetryCounts = _state.subtotalToggleMenuRetryCounts || {};
    var retryKey = subtotalToggleMenuRetryKey(scopeKey, containerKey);
    var timerId = _state.subtotalToggleMenuRetryTimers[retryKey];
    if (timerId) {
      window.clearTimeout(timerId);
      delete _state.subtotalToggleMenuRetryTimers[retryKey];
    }
    delete _state.subtotalToggleMenuRetryCounts[retryKey];
  }

  function scheduleSubtotalToggleMenuRetry(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    _state.subtotalToggleMenuRetryTimers = _state.subtotalToggleMenuRetryTimers || {};
    _state.subtotalToggleMenuRetryCounts = _state.subtotalToggleMenuRetryCounts || {};
    var retryKey = subtotalToggleMenuRetryKey(scopeKey, containerKey);
    if (_state.subtotalToggleMenuRetryTimers[retryKey]) {
      return;
    }
    var retryCount = Number(_state.subtotalToggleMenuRetryCounts[retryKey] || 0);
    if (retryCount >= 8) {
      return;
    }
    _state.subtotalToggleMenuRetryCounts[retryKey] = retryCount + 1;
    var retryDelay = retryCount < 3 ? 200 : 450;
    _state.subtotalToggleMenuRetryTimers[retryKey] = window.setTimeout(function () {
      delete _state.subtotalToggleMenuRetryTimers[retryKey];
      ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey);
    }, retryDelay);
  }

  function findSubtotalToggleMenuAnchor(scopeKey, containerKey) {
    return document.querySelector("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
      "[data-lib-subtotal-scope='" + cleanText(scopeKey || "") + "']" +
      "[data-lib-subtotal-key='" + cleanText(containerKey || "") + "']");
  }

  function removeDuplicateSubtotalToggleMenuAnchors(anchorNode, hostNode, scopeKey, containerKey) {
    if (!(anchorNode instanceof HTMLElement)) {
      return;
    }
    var keepScopeKey = cleanText(scopeKey || "");
    var keepContainerKey = cleanText(containerKey || "");
    var hostParentNode = hostNode instanceof HTMLElement ? hostNode.parentElement : null;
    var duplicateNodes = [];
    var seenNodes = new Set();

    var registerDuplicate = function (candidateNode) {
      if (!(candidateNode instanceof HTMLElement) || candidateNode === anchorNode || seenNodes.has(candidateNode)) {
        return;
      }
      seenNodes.add(candidateNode);
      duplicateNodes.push(candidateNode);
    };

    document.querySelectorAll("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS).forEach(function (candidateNode) {
      if (!(candidateNode instanceof HTMLElement)) {
        return;
      }
      var candidateScopeKey = cleanText(candidateNode.dataset.libSubtotalScope || "");
      var candidateContainerKey = cleanText(candidateNode.dataset.libSubtotalKey || "");
      if (candidateScopeKey === keepScopeKey && candidateContainerKey === keepContainerKey) {
        registerDuplicate(candidateNode);
        return;
      }
      if (hostParentNode instanceof HTMLElement && candidateNode.parentElement === hostParentNode) {
        registerDuplicate(candidateNode);
      }
    });

    duplicateNodes.forEach(function (candidateNode) {
      if (_state.subtotalToggleMenuOpenAnchor === candidateNode) {
        _state.subtotalToggleMenuOpenAnchor = null;
      }
      candidateNode.remove();
    });
  }

  function removeSubtotalToggleMenuAnchor(scopeKey, containerKey) {
    clearSubtotalToggleMenuRetry(scopeKey, containerKey);
    var anchorNode = findSubtotalToggleMenuAnchor(scopeKey, containerKey);
    if (!(anchorNode instanceof HTMLElement)) {
      return;
    }
    if (_state.subtotalToggleMenuOpenAnchor === anchorNode) {
      closeSubtotalToggleMenus();
    }
    anchorNode.remove();
  }

  function findSubtotalToggleMenuHost(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var roots = [];
    var seenRoots = new Set();
    var pushRoot = function (node) {
      if (!(node instanceof HTMLElement) || seenRoots.has(node)) {
        return;
      }
      seenRoots.add(node);
      roots.push(node);
    };

    pushRoot(containerNode);
    pushRoot(containerNode.parentElement);
    pushRoot(containerNode.closest(".oe_subtotal_footer"));
    pushRoot(containerNode.closest(".o_group, .o_inner_group, .o_form_sheet, .o_form_sheet_bg"));
    var enclosingGroup = containerNode.closest(".o_group, .o_inner_group, .o_form_sheet, .o_form_sheet_bg");
    if (enclosingGroup instanceof HTMLElement) {
      pushRoot(enclosingGroup.parentElement);
    }
    pushRoot(containerNode.closest(".tab-pane, .o_notebook_content, .o_form_sheet"));

    var explicitActionHosts = [];
    var seenExplicitHosts = new Set();
    roots.forEach(function (rootNode) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      rootNode.querySelectorAll("div[name='so_button_below_order_lines']").forEach(function (hostNode) {
        if (!(hostNode instanceof HTMLElement) || seenExplicitHosts.has(hostNode)) {
          return;
        }
        seenExplicitHosts.add(hostNode);
        var actionButtons = Array.prototype.slice
          .call(hostNode.querySelectorAll("button, a, [role='button']"))
          .filter(function (candidateNode) {
            return candidateNode instanceof HTMLElement;
          });
        if (!actionButtons.length) {
          return;
        }
        var matchedActionButtons = actionButtons.filter(function (candidateNode) {
          var textValue = cleanText(
            candidateNode.textContent ||
            candidateNode.getAttribute("aria-label") ||
            candidateNode.getAttribute("title") ||
            ""
          );
          return subtotalActionButtonMatchesLabel(textValue);
        });
        explicitActionHosts.push((matchedActionButtons.length ? matchedActionButtons : actionButtons).slice(-1)[0]);
      });
    });
    if (explicitActionHosts.length) {
      return explicitActionHosts[explicitActionHosts.length - 1];
    }

    var toolbarButtons = [];
    var seenToolbars = new Set();
    roots.forEach(function (rootNode) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      rootNode.querySelectorAll(".o_form_buttons_view").forEach(function (toolbarNode) {
        if (!(toolbarNode instanceof HTMLElement) || seenToolbars.has(toolbarNode)) {
          return;
        }
        seenToolbars.add(toolbarNode);
        var directButtons = Array.prototype.slice.call(toolbarNode.children).filter(function (candidateNode) {
          return candidateNode instanceof HTMLElement && candidateNode.matches("button, a, [role='button']");
        });
        if (!directButtons.length) {
          directButtons = Array.prototype.slice.call(toolbarNode.querySelectorAll("button, a, [role='button']")).filter(function (candidateNode) {
            return candidateNode instanceof HTMLElement;
          });
        }
        if (!directButtons.length) {
          return;
        }
        var matchedToolbarButtons = directButtons.filter(function (candidateNode) {
          if (!(candidateNode instanceof HTMLElement)) {
            return false;
          }
          var textValue = cleanText(
            candidateNode.textContent ||
            candidateNode.getAttribute("aria-label") ||
            candidateNode.getAttribute("title") ||
            ""
          );
          return subtotalActionButtonMatchesLabel(textValue);
        });
        toolbarButtons.push((matchedToolbarButtons.length ? matchedToolbarButtons : directButtons).slice(-1)[0]);
      });
    });
    if (toolbarButtons.length) {
      return toolbarButtons[toolbarButtons.length - 1];
    }

    var matchedButtons = [];
    var seenButtons = new Set();
    roots.forEach(function (rootNode) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      rootNode.querySelectorAll("button, a, [role='button']").forEach(function (candidateNode) {
        if (!(candidateNode instanceof HTMLElement) || seenButtons.has(candidateNode)) {
          return;
        }
        seenButtons.add(candidateNode);
        if (candidateNode.classList.contains(SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS)) {
          return;
        }
        var textValue = cleanText(
          candidateNode.textContent ||
          candidateNode.getAttribute("aria-label") ||
          candidateNode.getAttribute("title") ||
          ""
        );
        if (!subtotalActionButtonMatchesLabel(textValue)) {
          return;
        }
        matchedButtons.push(candidateNode);
      });
    });

    return matchedButtons.length ? matchedButtons[matchedButtons.length - 1] : null;
  }

  function copySubtotalToggleMenuHostClasses(triggerNode, hostNode) {
    if (!(triggerNode instanceof HTMLElement) || !(hostNode instanceof HTMLElement)) {
      return false;
    }
    var copied = false;
    hostNode.classList.forEach(function (token) {
      var className = cleanText(token || "");
      if (!className || !/^btn/.test(className) || className.indexOf("active") >= 0) {
        return;
      }
      triggerNode.classList.add(className);
      copied = true;
    });
    return copied;
  }

  function renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey) {
    if (!(anchorNode instanceof HTMLElement) || !(panelNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    panelNode.innerHTML = "";
    SUBTOTAL_TOGGLE_MENU_ITEMS.forEach(function (itemMeta) {
      var rowNode = document.createElement("label");
      rowNode.className = SUBTOTAL_TOGGLE_MENU_ROW_CLASS;
      rowNode.dataset.libSubtotalToggleField = itemMeta.toggleField;
      rowNode.tabIndex = 0;
      rowNode.setAttribute("role", "button");
      var toggleMeta = v2.subtotalToggleMetaForSource(itemMeta.sourceField) || {};
      if (toggleMeta.tooltip) {
        rowNode.title = toggleMeta.tooltip;
      }

      var labelNode = document.createElement("span");
      labelNode.className = SUBTOTAL_TOGGLE_MENU_LABEL_CLASS;
      labelNode.textContent = itemMeta.label;
      rowNode.appendChild(labelNode);

      var checkboxNode = document.createElement("input");
      checkboxNode.type = "checkbox";
      checkboxNode.className = SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS;
      checkboxNode.checked = readFieldBooleanValue(formNode, itemMeta.toggleField, true);
      checkboxNode.tabIndex = -1;
      checkboxNode.setAttribute("aria-hidden", "true");
      rowNode.setAttribute("aria-pressed", checkboxNode.checked ? "true" : "false");

      var requestToggle = function (event) {
        event.stopPropagation();
        if (event.preventDefault) {
          event.preventDefault();
        }
        if (rowNode.dataset.libToggleBusy === "1") {
          return;
        }
        rowNode.dataset.libToggleBusy = "1";
        var nextChecked = !Boolean(checkboxNode.checked);
        checkboxNode.disabled = true;
        v2.syncBooleanFieldWidgets(formNode, itemMeta.toggleField, nextChecked)
          .then(function (updated) {
            if (!updated) {
              return false;
            }
            renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
            return true;
          })
          .catch(function () {
            return false;
          })
          .then(function () {
            delete rowNode.dataset.libToggleBusy;
            renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
          });
      };
      checkboxNode.addEventListener("click", requestToggle);
      checkboxNode.addEventListener("change", function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
      rowNode.addEventListener("click", requestToggle);
      rowNode.addEventListener("keydown", function (event) {
        if (!(event && (event.key === "Enter" || event.key === " "))) {
          return;
        }
        requestToggle(event);
      });
      rowNode.appendChild(checkboxNode);
      panelNode.appendChild(rowNode);
    });
  }

  function ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return null;
    }
    bindSubtotalToggleMenuGlobalHandlers();
    var hostNode = findSubtotalToggleMenuHost(containerNode);
    var selector =
      "." +
      SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
      "[data-lib-subtotal-scope='" +
      scopeKey +
      "'][data-lib-subtotal-key='" +
      containerKey +
      "']";
    var anchorNode = document.querySelector(selector);
    if (!(hostNode instanceof HTMLElement) || !(hostNode.parentElement instanceof HTMLElement)) {
      scheduleSubtotalToggleMenuRetry(containerNode, formNode, scopeKey, containerKey);
      if (anchorNode instanceof HTMLElement) {
        anchorNode.remove();
      }
      return null;
    }
    clearSubtotalToggleMenuRetry(scopeKey, containerKey);

    if (!(anchorNode instanceof HTMLElement)) {
      anchorNode = document.createElement("span");
      anchorNode.className = SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS;
      anchorNode.dataset.libSubtotalScope = scopeKey;
      anchorNode.dataset.libSubtotalKey = containerKey;
    }
    anchorNode.dataset.libSubtotalScope = scopeKey;
    anchorNode.dataset.libSubtotalKey = containerKey;
    var hostParentNode = hostNode.parentElement;
    if (!(anchorNode.parentElement === hostParentNode && anchorNode.previousElementSibling === hostNode)) {
      hostParentNode.insertBefore(anchorNode, hostNode.nextSibling);
    }
    removeDuplicateSubtotalToggleMenuAnchors(anchorNode, hostNode, scopeKey, containerKey);

    var panelNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_PANEL_CLASS);
    if (!(panelNode instanceof HTMLElement)) {
      panelNode = document.createElement("div");
      panelNode.className = SUBTOTAL_TOGGLE_MENU_PANEL_CLASS;
      panelNode.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      panelNode.addEventListener("mousedown", function (event) {
        event.stopPropagation();
      });
      anchorNode.appendChild(panelNode);
    }

    var triggerNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS);
    if (!(triggerNode instanceof HTMLElement)) {
      triggerNode = document.createElement("button");
      triggerNode.type = "button";
      triggerNode.className = SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS;
      anchorNode.appendChild(triggerNode);
    }
    if (!copySubtotalToggleMenuHostClasses(triggerNode, hostNode)) {
      triggerNode.classList.add("btn", "btn-secondary");
    }
    applySettingsTriggerIcon(triggerNode, "Charge settings");
    triggerNode.setAttribute("aria-label", "Charge settings");
    triggerNode.title = "Charge settings";
    triggerNode.setAttribute(
      "aria-expanded",
      anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS) ? "true" : "false"
    );
    triggerNode.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      var shouldOpen = !anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS);
      closeSubtotalToggleMenus(shouldOpen ? anchorNode : null);
      anchorNode.classList.toggle(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS, shouldOpen);
      triggerNode.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      if (shouldOpen) {
        Promise.resolve(v2.refreshSubtotalToggleStateFromBackend(formNode, true))
          .catch(function () {
            return false;
          })
          .finally(function () {
            renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
          });
      }
    };

    if (!anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS) || !panelNode.children.length) {
      renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
    }
    return anchorNode;
  }

  v2.bindSubtotalToggleMenuGlobalHandlers = bindSubtotalToggleMenuGlobalHandlers;
  v2.clearSubtotalToggleMenuRetry = clearSubtotalToggleMenuRetry;
  v2.scheduleSubtotalToggleMenuRetry = scheduleSubtotalToggleMenuRetry;

  Object.assign(v2, {
    bindSubtotalToggleMenuGlobalHandlers: bindSubtotalToggleMenuGlobalHandlers,
    clearSubtotalToggleMenuRetry: clearSubtotalToggleMenuRetry,
    closeSubtotalToggleMenus: closeSubtotalToggleMenus,
    copySubtotalToggleMenuHostClasses: copySubtotalToggleMenuHostClasses,
    ensureSubtotalToggleMenuAnchor: ensureSubtotalToggleMenuAnchor,
    findSubtotalToggleMenuAnchor: findSubtotalToggleMenuAnchor,
    findSubtotalToggleMenuHost: findSubtotalToggleMenuHost,
    removeSubtotalToggleMenuAnchor: removeSubtotalToggleMenuAnchor,
    renderSubtotalToggleMenuPanel: renderSubtotalToggleMenuPanel,
    scheduleSubtotalToggleMenuRetry: scheduleSubtotalToggleMenuRetry,
    subtotalActionButtonMatchesLabel: subtotalActionButtonMatchesLabel,
  });
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/toggle_menu.js

// BEGIN lib/odoo/web/form_section_layout/runtime/subtotals/edit_mode.js
(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var SUBTOTAL_CONFIG_TRIGGER_CLASS = v2.SUBTOTAL_CONFIG_TRIGGER_CLASS;
  var SUBTOTAL_CONTAINER_CLASS = v2.SUBTOTAL_CONTAINER_CLASS;
  var SUBTOTAL_EDIT_ACTIONS_CLASS = v2.SUBTOTAL_EDIT_ACTIONS_CLASS;
  var SUBTOTAL_EDIT_MODE_CLASS = v2.SUBTOTAL_EDIT_MODE_CLASS;
  var SUBTOTAL_ERROR_ICON_CLASS = v2.SUBTOTAL_ERROR_ICON_CLASS;
  var SUBTOTAL_LINES_WRAP_CLASS = v2.SUBTOTAL_LINES_WRAP_CLASS;
  var SUBTOTAL_RESTORE_TRIGGER_CLASS = v2.SUBTOTAL_RESTORE_TRIGGER_CLASS;
  var SUBTOTAL_SAVE_TRIGGER_CLASS = v2.SUBTOTAL_SAVE_TRIGGER_CLASS;
  var SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS = v2.SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS;
  var applyButtonIcon = function () { return v2.applyButtonIcon.apply(this, arguments); };
  var applyPencilTriggerIcon = function () { return v2.applyPencilTriggerIcon.apply(this, arguments); };
  var buildDefaultSubtotalLayout = function () { return v2.buildDefaultSubtotalLayout.apply(this, arguments); };
  var cleanText = function () { return v2.cleanText.apply(this, arguments); };
  var cloneSubtotalLayout = function () { return v2.cloneSubtotalLayout.apply(this, arguments); };
  var collectSubtotalNativeRows = function () { return v2.collectSubtotalNativeRows.apply(this, arguments); };
  var delayMs = function () { return v2.delayMs.apply(this, arguments); };
  var ensureSubtotalToggleMenuAnchor = function () { return v2.ensureSubtotalToggleMenuAnchor.apply(this, arguments); };
  var findSubtotalContainers = function () { return v2.findSubtotalContainers.apply(this, arguments); };
  var normalizeSubtotalLayout = function () { return v2.normalizeSubtotalLayout.apply(this, arguments); };
  var queueStatePersist = function () { return v2.queueStatePersist.apply(this, arguments); };
  var readSubtotalLayoutState = function () { return v2.readSubtotalLayoutState.apply(this, arguments); };
  var renderSubtotalLayout = function () { return v2.renderSubtotalLayout.apply(this, arguments); };
  var subtotalEditStateKey = function () { return v2.subtotalEditStateKey.apply(this, arguments); };
  var subtotalLayoutSignature = function () { return v2.subtotalLayoutSignature.apply(this, arguments); };
  var validateSubtotalLayoutForSave = function () { return v2.validateSubtotalLayoutForSave.apply(this, arguments); };
  var writeSubtotalLayoutState = function () { return v2.writeSubtotalLayoutState.apply(this, arguments); };


  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/edit_mode.js

  function removeStaleSubtotalRenderArtifacts(containerNode) {
    [
      SUBTOTAL_LINES_WRAP_CLASS,
      SUBTOTAL_CONFIG_TRIGGER_CLASS,
      SUBTOTAL_RESTORE_TRIGGER_CLASS,
      SUBTOTAL_SAVE_TRIGGER_CLASS,
      SUBTOTAL_ERROR_ICON_CLASS,
    ].forEach(function (className) {
      var staleNode = containerNode.querySelector(":scope > ." + className);
      if (staleNode instanceof HTMLElement) {
        staleNode.remove();
      }
    });
    var scopeKey = cleanText(containerNode.dataset.libSubtotalScope || "");
    var containerKey = cleanText(containerNode.dataset.libSubtotalKey || "");
    if (scopeKey && containerKey) {
      var anchorNode = document.querySelector(
        "." +
        SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
        "[data-lib-subtotal-scope='" +
        scopeKey +
        "'][data-lib-subtotal-key='" +
        containerKey +
        "']"
      );
      if (anchorNode instanceof HTMLElement) {
        anchorNode.remove();
      }
    }
    containerNode.classList.remove(SUBTOTAL_CONTAINER_CLASS, SUBTOTAL_EDIT_MODE_CLASS);
  }

  function ensureSubtotalConfigTrigger(containerNode) {
    var trigger = containerNode.querySelector(":scope > ." + SUBTOTAL_CONFIG_TRIGGER_CLASS);
    if (!(trigger instanceof HTMLElement)) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = SUBTOTAL_CONFIG_TRIGGER_CLASS;
      containerNode.insertBefore(trigger, containerNode.firstChild);
    }
    applyPencilTriggerIcon(trigger, "Edit subtotal");
    trigger.hidden = false;
    return trigger;
  }

  function ensureSubtotalRestoreTrigger(containerNode) {
    var restoreTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_RESTORE_TRIGGER_CLASS);
    if (!(restoreTrigger instanceof HTMLElement)) {
      restoreTrigger = document.createElement("button");
      restoreTrigger.type = "button";
      restoreTrigger.className = SUBTOTAL_RESTORE_TRIGGER_CLASS;
      containerNode.insertBefore(restoreTrigger, containerNode.firstChild);
    }
    applyButtonIcon(restoreTrigger, "fa fa-undo", "Restore subtotal defaults");
    restoreTrigger.hidden = true;
    return restoreTrigger;
  }

  function ensureSubtotalErrorIcon(containerNode) {
    var errorIcon = containerNode.querySelector(":scope > ." + SUBTOTAL_ERROR_ICON_CLASS);
    if (!(errorIcon instanceof HTMLElement)) {
      errorIcon = document.createElement("span");
      errorIcon.className = SUBTOTAL_ERROR_ICON_CLASS;
      errorIcon.setAttribute("aria-hidden", "true");
      errorIcon.textContent = "!";
      containerNode.insertBefore(errorIcon, containerNode.firstChild);
    }
    errorIcon.hidden = true;
    errorIcon.title = "";
    return errorIcon;
  }

  function bindSubtotalConfigTrigger(trigger, containerNode, formNode, scopeKey, containerKey) {
    trigger.onclick = async function (event) {
      event.preventDefault();
      event.stopPropagation();
      var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
      var isEditing = Boolean(_state.subtotalEditModes[editStateKey]);
      if (!isEditing) {
        setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, true, false);
        return;
      }

      var currentLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      var validation = validateSubtotalLayoutForSave(currentLayout);
      if (!validation.valid) {
        renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
        window.alert("Fix invalid formulas before saving.");
        return;
      }
      writeSubtotalLayoutState(scopeKey, containerKey, currentLayout);
      _state.subtotalEditSnapshots[editStateKey] = cloneSubtotalLayout(currentLayout);
      setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, false, true);
      trigger.disabled = true;
      var persistPromise = queueStatePersist({
        scopeKey: scopeKey,
        containerKey: containerKey,
      }).catch(function () {
        // Keep local state as fallback.
      });
      try {
        await Promise.race([persistPromise, delayMs(8000)]);
      } finally {
        trigger.disabled = false;
      }
    };
  }

  function bindSubtotalRestoreTrigger(restoreTrigger, containerNode, formNode, scopeKey, containerKey) {
    restoreTrigger.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!window.confirm("Restore subtotal layout to defaults?")) {
        return;
      }
      var defaults = buildDefaultSubtotalLayout(collectSubtotalNativeRows(containerNode, true));
      writeSubtotalLayoutState(scopeKey, containerKey, defaults);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      queueStatePersist({
        scopeKey: scopeKey,
        containerKey: containerKey,
      });
    };
  }

  function setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, enabled, persistChanges) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    var editKey = subtotalEditStateKey(scopeKey, containerKey);
    var nextEnabled = Boolean(enabled);
    if (nextEnabled) {
      _state.subtotalEditModes[editKey] = true;
      _state.subtotalEditSnapshots[editKey] = cloneSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      return;
    }

    var snapshot = _state.subtotalEditSnapshots[editKey];
    if (snapshot && typeof snapshot === "object") {
      var currentLayout = cloneSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      if (!persistChanges && subtotalLayoutSignature(currentLayout) !== subtotalLayoutSignature(snapshot)) {
        writeSubtotalLayoutState(scopeKey, containerKey, snapshot);
      }
      delete _state.subtotalEditSnapshots[editKey];
    }
    _state.subtotalEditModes[editKey] = false;
    renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
  }

  v2.setSubtotalEditMode = setSubtotalEditMode;
  function decorateSubtotalContainers(formNode, scopeKey) {
    var containers = findSubtotalContainers(formNode);
    containers.forEach(function (containerNode, index) {
      var containerKey = "subtotal_" + String(index + 1);
      containerNode.dataset.libSubtotalKey = containerKey;
      containerNode.dataset.libSubtotalScope = scopeKey;

      var existingLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      var hasNativeRows = collectSubtotalNativeRows(containerNode, true).length > 0;
      var hasSavedRows = Array.isArray(existingLayout.lines) && existingLayout.lines.length > 0;
      if (!hasNativeRows && !hasSavedRows) {
        removeStaleSubtotalRenderArtifacts(containerNode);
        return;
      }

      var trigger = ensureSubtotalConfigTrigger(containerNode);
      bindSubtotalConfigTrigger(trigger, containerNode, formNode, scopeKey, containerKey);

      var staleSave = containerNode.querySelector(":scope > ." + SUBTOTAL_SAVE_TRIGGER_CLASS);
      if (staleSave instanceof HTMLElement) {
        staleSave.remove();
      }

      var restoreTrigger = ensureSubtotalRestoreTrigger(containerNode);
      bindSubtotalRestoreTrigger(restoreTrigger, containerNode, formNode, scopeKey, containerKey);
      ensureSubtotalErrorIcon(containerNode);

      if (containerNode.dataset.libSubtotalDblBound !== "1") {
        containerNode.dataset.libSubtotalDblBound = "1";
        containerNode.addEventListener("dblclick", function (event) {
          var target = event.target;
          if (
            target instanceof HTMLElement &&
            (target.closest("input, textarea, select, button, a") || target.closest("." + SUBTOTAL_EDIT_ACTIONS_CLASS))
          ) {
            return;
          }
          var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
          var nextEnabled = !Boolean(_state.subtotalEditModes[editStateKey]);
          setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, nextEnabled, false);
        });
      }

      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey);
    });
  }

  v2.decorateSubtotalContainers = decorateSubtotalContainers;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/subtotals/edit_mode.js

// BEGIN lib/odoo/web/form_section_layout/drag_drop.js
(function (v2) {
  "use strict";
  v2.drag_drop = v2.drag_drop || {};
  var _state = v2.state = v2.state || {};

  // Builder-injected public surface aliases for split runtime parity.
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS;
  var DRAGGING_CLASS = v2.DRAGGING_CLASS;
  var DRAG_HANDLE_CLASS = v2.DRAG_HANDLE_CLASS;
  var DROP_AFTER_CLASS = v2.DROP_AFTER_CLASS;
  var DROP_BEFORE_CLASS = v2.DROP_BEFORE_CLASS;
  var SUBTOTAL_LINE_DROP_AFTER_CLASS = v2.SUBTOTAL_LINE_DROP_AFTER_CLASS;
  var SUBTOTAL_LINE_DROP_BEFORE_CLASS = v2.SUBTOTAL_LINE_DROP_BEFORE_CLASS;
  var SUBTOTAL_LINE_ROW_CLASS = v2.SUBTOTAL_LINE_ROW_CLASS;
  var computeScopeKey = function () { return v2.computeScopeKey.apply(this, arguments); };
  var findSectionHeader = function () { return v2.findSectionHeader.apply(this, arguments); };
  var processFormNode = function () { return v2.processFormNode.apply(this, arguments); };
  var queueStatePersist = function () { return v2.queueStatePersist.apply(this, arguments); };
  var storeCurrentOrderForForm = function () { return v2.storeCurrentOrderForForm.apply(this, arguments); };
  var syncHoveredSectionControlVisibility = function () { return v2.syncHoveredSectionControlVisibility.apply(this, arguments); };


  function clearSubtotalDropMarkers(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return;
    }
    containerNode
      .querySelectorAll("." + SUBTOTAL_LINE_ROW_CLASS + "." + SUBTOTAL_LINE_DROP_BEFORE_CLASS + ", ." + SUBTOTAL_LINE_ROW_CLASS + "." + SUBTOTAL_LINE_DROP_AFTER_CLASS)
      .forEach(function (node) {
        node.classList.remove(SUBTOTAL_LINE_DROP_BEFORE_CLASS, SUBTOTAL_LINE_DROP_AFTER_CLASS);
      });
  }


  v2.clearSubtotalDropMarkers = clearSubtotalDropMarkers;

  function paintDropMarker(group, before) {
    document
      .querySelectorAll("." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_BEFORE_CLASS + ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_AFTER_CLASS)
      .forEach(function (node) {
        node.classList.remove(DROP_BEFORE_CLASS, DROP_AFTER_CLASS);
      });

    group.classList.add(before ? DROP_BEFORE_CLASS : DROP_AFTER_CLASS);
  }


  v2.paintDropMarker = paintDropMarker;

  function resetDragState() {
    _state.dragSourceGroup = null;
    _state.dragTargetGroup = null;
    _state.dragDropBefore = true;

    document
      .querySelectorAll(
        "." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_BEFORE_CLASS +
        ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_AFTER_CLASS +
        ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DRAGGING_CLASS
      )
      .forEach(function (node) {
        node.classList.remove(DROP_BEFORE_CLASS, DROP_AFTER_CLASS, DRAGGING_CLASS);
      });

    if (typeof syncHoveredSectionControlVisibility === "function") {
      syncHoveredSectionControlVisibility();
    }
  }


  v2.resetDragState = resetDragState;

  function onDragStart(event) {
    var handle = event.target instanceof Element ? event.target.closest("." + DRAG_HANDLE_CLASS) : null;
    if (!(handle instanceof HTMLElement)) {
      return;
    }

    var group = handle.closest("." + COLLAPSIBLE_GROUP_CLASS);
    if (!(group instanceof HTMLElement)) {
      return;
    }

    _state.dragSourceGroup = group;
    _state.dragTargetGroup = null;
    _state.dragDropBefore = true;

    group.classList.add(DRAGGING_CLASS);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(group.dataset.libSectionKey || "section"));
    }
  }


  v2.onDragStart = onDragStart;

  function onDragOver(event) {
    if (!(_state.dragSourceGroup instanceof HTMLElement)) {
      return;
    }

    var targetGroup = event.target instanceof Element ? event.target.closest("." + COLLAPSIBLE_GROUP_CLASS) : null;
    if (!(targetGroup instanceof HTMLElement) || targetGroup === _state.dragSourceGroup) {
      return;
    }

    if (targetGroup.parentElement !== _state.dragSourceGroup.parentElement) {
      return;
    }

    event.preventDefault();

    var targetHeader = findSectionHeader(targetGroup) || targetGroup;
    var rect = targetHeader.getBoundingClientRect();
    _state.dragDropBefore = event.clientY <= rect.top + rect.height / 2;
    _state.dragTargetGroup = targetGroup;

    paintDropMarker(targetGroup, _state.dragDropBefore);
  }


  v2.onDragOver = onDragOver;

  function onDrop(event) {
    if (!(_state.dragSourceGroup instanceof HTMLElement) || !(_state.dragTargetGroup instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    event.preventDefault();

    if (_state.dragSourceGroup.parentElement !== _state.dragTargetGroup.parentElement) {
      resetDragState();
      return;
    }

    var parent = _state.dragSourceGroup.parentElement;
    if (!(parent instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    var formNode = _state.dragSourceGroup.closest(".o_form_view");
    if (!(formNode instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    var referenceNode = _state.dragDropBefore ? _state.dragTargetGroup : _state.dragTargetGroup.nextSibling;
    parent.insertBefore(_state.dragSourceGroup, referenceNode);

    var scopeKey = computeScopeKey(formNode);
    storeCurrentOrderForForm(formNode, scopeKey);
    queueStatePersist();
    processFormNode(formNode);
    resetDragState();
  }


  v2.onDrop = onDrop;

  function onDragEnd() {
    resetDragState();
  }


  v2.onDragEnd = onDragEnd;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/drag_drop.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/process_form.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  function processFormNode(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }

    v2.ensureFieldDefinitionsLoadedForForm(formNode);
    var scopeKey = v2.computeScopeKey(formNode);
    var groups = v2.getSectionGroups(formNode);

    groups.forEach(function (group, index) {
      var header = v2.findSectionHeader(group);
      if (!(header instanceof HTMLElement)) {
        return;
      }

      var explicitKey = v2.normalizeKey(v2.findSectionKeyFromClass(group));
      var labelSeed = v2.normalizeKey(header.dataset.libSectionLabel || header.textContent || "");
      var sectionKey = explicitKey || (labelSeed ? "auto_" + labelSeed : "auto_section_" + index);

      group.dataset.libSectionKey = sectionKey;
      group.dataset.libScopeKey = scopeKey;
      v2.decorateSectionHeader(group, header, sectionKey, scopeKey);
    });

    if (groups.length) {
      v2.applySavedOrderForForm(formNode, scopeKey);
    }

    v2.getSectionGroups(formNode).forEach(function (group) {
      var header = v2.findSectionHeader(group);
      if (!(header instanceof HTMLElement)) {
        return;
      }
      var sectionKey = String(group.dataset.libSectionKey || "").trim();
      if (!sectionKey) {
        return;
      }
      var visible = v2.sectionIsVisible(scopeKey, sectionKey);
      v2.setSectionVisible(group, visible);
      if (!visible) {
        return;
      }
      var collapsed = Boolean(_state.formLayoutState.collapsed[v2.collapsedEntryKey(scopeKey, sectionKey)]);
      v2.setGroupCollapsed(group, header, collapsed);
      v2.applySectionFieldLayout(group, scopeKey, sectionKey);
    });

    var layoutMetas = v2.collectLayoutContainers(formNode, scopeKey);
    formNode.__libLayoutMeta = layoutMetas;
    layoutMetas.forEach(function (layoutMeta) {
      v2.applyLayoutVisibility(layoutMeta, scopeKey);
      v2.decorateLayoutContainer(layoutMeta, scopeKey);
    });
    v2.cleanupStaleLayoutTriggers(formNode, layoutMetas);

    var statusbarMetas = v2.collectStatusbarMetas(formNode, scopeKey);
    formNode.__libStatusbarMeta = statusbarMetas;
    statusbarMetas.forEach(function (statusbarMeta) {
      v2.applyStatusbarMetaLabels(statusbarMeta, scopeKey);
      v2.decorateStatusbarContainer(statusbarMeta, scopeKey);
    });
    v2.cleanupStaleStatusbarTriggers(formNode, statusbarMetas);

    v2.normalizeAssetNumberFieldDisplays(formNode);
    if (typeof v2.refreshSubtotalToggleStateFromBackend === "function") {
      v2.refreshSubtotalToggleStateFromBackend(formNode, v2.syncSubtotalRecordBinding(formNode));
    } else {
      v2.syncSubtotalRecordBinding(formNode);
    }
    v2.decorateSubtotalContainers(formNode, scopeKey);
  }

  v2.processFormNode = processFormNode;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/process_form.js

// BEGIN lib/odoo/web/form_section_layout/runtime/ui/process_runtime.js
(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  function ensureStateLoaded() {
    if (_state.formLayoutLoadPromise) {
      return _state.formLayoutLoadPromise;
    }

    var uid = 0;
    _state.formLayoutLoadPromise = Promise.resolve()
      .then(async function () {
        if (typeof v2.loadSessionInfo === "function") {
          await v2.loadSessionInfo();
        }
        uid = v2.ensureUserScopedKeys();
        if (_state.formLayoutReady && _state.formLayoutReadyUserId === uid) {
          return _state.formLayoutState;
        }
        if (_state.formLayoutReady && _state.formLayoutReadyUserId !== uid) {
          _state.formLayoutReady = false;
        }
        var localState = v2.readLocalLayoutState();
        var globalDbState = v2.emptyLayoutState();
        var userDbState = v2.emptyLayoutState();

        _state.currentUserGroupIds = await v2.loadCurrentUserGroupIds();
        _state.formIsAdminUser = await v2.isCurrentUserAdmin();
        _state.formCanSaveToDb = await v2.canWriteConfigParameters();
        _state.availableRoleOptions = await v2.loadAvailableRoleOptions();

        try {
          var globalRaw = await v2.callKw("ir.config_parameter", "get_param", [v2.makeGlobalDbParamKey()], {});
          globalDbState = v2.parseLayoutState(globalRaw || "");
        } catch (_err) {
          globalDbState = v2.emptyLayoutState();
        }

        try {
          var userRaw = await v2.callKw("ir.config_parameter", "get_param", [_state.dbParamKey], {});
          userDbState = v2.parseLayoutState(userRaw || "");
        } catch (_err) {
          userDbState = v2.emptyLayoutState();
        }

        _state.formLayoutState = v2.mergeLayoutState(
          v2.mergeLayoutState(globalDbState, userDbState),
          localState
        );
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .catch(function () {
        _state.formLayoutState = v2.emptyLayoutState();
        _state.formCanSaveToDb = false;
        _state.formIsAdminUser = false;
        _state.currentUserGroupIds = [];
        _state.availableRoleOptions = [];
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .finally(function () {
        _state.formLayoutLoadPromise = null;
      });

    return _state.formLayoutLoadPromise;
  }

  v2.ensureStateLoaded = ensureStateLoaded;

  function hasManagedFormHosts() {
    return document.querySelector(".o_form_view") instanceof HTMLElement;
  }

  v2.hasManagedFormHosts = hasManagedFormHosts;

  function ensureRuntimeBindings() {
    if (_state.runtimeBindingsReady) {
      return;
    }
    _state.runtimeBindingsReady = true;
    bindGlobalDragHandlers();
    v2.bindGlobalSectionControlVisibility();
    bindSubtotalActionAutoSave();
  }

  v2.ensureRuntimeBindings = ensureRuntimeBindings;

  function refreshLayout() {
    if (!hasManagedFormHosts()) {
      if (
        _state.settingsPanelState.currentForm instanceof HTMLElement &&
        !document.body.contains(_state.settingsPanelState.currentForm)
      ) {
        v2.closeSectionSettingsPanel();
      }
      return;
    }
    ensureRuntimeBindings();
    ensureStateLoaded().then(function () {
      document.querySelectorAll(".o_form_view").forEach(function (formNode) {
        v2.processFormNode(formNode);
      });
      v2.applyChatterVisibility();
      if (
        _state.settingsPanelState.currentForm instanceof HTMLElement &&
        document.body.contains(_state.settingsPanelState.currentForm)
      ) {
        return;
      }
      v2.closeSectionSettingsPanel();
    });
  }

  v2.refreshLayout = refreshLayout;

  function scheduleRefresh() {
    if (!hasManagedFormHosts()) {
      return;
    }
    if (_state.refreshScheduled) {
      return;
    }
    _state.refreshScheduled = true;
    window.requestAnimationFrame(function () {
      _state.refreshScheduled = false;
      refreshLayout();
    });
  }

  v2.scheduleRefresh = scheduleRefresh;

  function bindGlobalDragHandlers() {
    document.addEventListener("dragstart", v2.onDragStart);
    document.addEventListener("dragover", v2.onDragOver);
    document.addEventListener("drop", v2.onDrop);
    document.addEventListener("dragend", v2.onDragEnd);
  }

  v2.bindGlobalDragHandlers = bindGlobalDragHandlers;

  function bindSubtotalActionAutoSave() {
    document.addEventListener(
      "click",
      function (event) {
        var actionButton = v2.resolveFormActionButton(event.target);
        if (!(actionButton instanceof HTMLElement)) {
          return;
        }
        if (actionButton.dataset.libSubtotalAutoResumed === "1") {
          actionButton.dataset.libSubtotalAutoResumed = "";
          return;
        }
        var activeContexts = v2.collectActiveSubtotalEditContexts();
        var hasPendingSave = Boolean(_state.formLayoutSavePromise);
        if (!activeContexts.length && !hasPendingSave) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        var persistPromise = activeContexts.length ? v2.persistActiveSubtotalEdits(activeContexts) : Promise.resolve(true);
        persistPromise.then(function (ok) {
          if (!ok) {
            return;
          }
          var waitForSave = _state.formLayoutSavePromise || Promise.resolve();
          waitForSave.finally(function () {
            actionButton.dataset.libSubtotalAutoResumed = "1";
            window.setTimeout(function () {
              actionButton.click();
            }, 0);
          });
        });
      },
      true
    );
  }

  v2.bindSubtotalActionAutoSave = bindSubtotalActionAutoSave;

  function boot() {
    if (hasManagedFormHosts()) {
      ensureRuntimeBindings();
      scheduleRefresh();
    }

    var observer = new MutationObserver(function (mutations) {
      var hasManagedForms = hasManagedFormHosts();
      if (hasManagedForms) {
        ensureRuntimeBindings();
      }
      var shouldRefresh = false;
      var editingSubtotal = v2.hasActiveSubtotalEditMode();
      var draggingSection = _state.dragSourceGroup instanceof HTMLElement;
      for (var i = 0; i < mutations.length; i += 1) {
        var mutation = mutations[i];
        var target = mutation && mutation.target;
        if (target instanceof HTMLElement && target.closest("#" + v2.SETTINGS_PANEL_ID)) {
          continue;
        }
        if (!hasManagedForms) {
          continue;
        }
        if (editingSubtotal || draggingSection) {
          continue;
        }
        shouldRefresh = true;
        break;
      }
      if (shouldRefresh) {
        scheduleRefresh();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("hashchange", scheduleRefresh);
    window.addEventListener("popstate", scheduleRefresh);
    document.addEventListener("keydown", function (event) {
      if (event && event.key === "Escape") {
        v2.closeSectionSettingsPanel();
      }
    });
  }

  v2.boot = boot;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/ui/process_runtime.js

// BEGIN lib/odoo/web/form_section_layout/runtime/bootstrap.js
(function (v2) {
  "use strict";

  function start() {
    if (typeof v2.boot === "function") {
      v2.boot();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
// END lib/odoo/web/form_section_layout/runtime/bootstrap.js
