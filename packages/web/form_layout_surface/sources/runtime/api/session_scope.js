(function (v2) {
  "use strict";
  v2.api = v2.api || {};
  var _state = v2.state = v2.state || {};
  var cleanText = v2.cleanText || function (value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  };

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

  function readNodeDataValue(node, attributeName, datasetName) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return cleanText(node.getAttribute(attributeName) || node.dataset[datasetName] || "");
  }

  v2.readNodeDataValue = readNodeDataValue;

  function computeModelName(formNode) {
    return (
      readNodeDataValue(formNode, "data-res-model", "resModel") ||
      readNodeDataValue(formNode, "data-model", "model")
    );
  }

  v2.computeModelName = computeModelName;

  function computeViewId(formNode) {
    return readNodeDataValue(formNode, "data-view-id", "viewId");
  }

  v2.computeViewId = computeViewId;

  function computeScopeKey(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return "unknown_model|unknown_view";
    }

    var explicitScopeKey = readNodeDataValue(formNode, "data-lib-scope-key", "libScopeKey");
    if (explicitScopeKey) {
      return explicitScopeKey;
    }

    var model = computeModelName(formNode) || "unknown_model";
    var viewId = computeViewId(formNode) || "unknown_view";

    return String(model || "unknown_model") + "|" + String(viewId || "unknown_view");
  }

  v2.computeScopeKey = computeScopeKey;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
