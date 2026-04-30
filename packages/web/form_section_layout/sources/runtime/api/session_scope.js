(function (v2) {
  "use strict";
  v2.api = v2.api || {};
  var _state = v2.state = v2.state || {};

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
