(function (surface) {
  "use strict";

  surface.hostApi = surface.hostApi || null;
  surface.state = surface.state || {};

  var DEFAULT_ODOO_CHATTER_SELECTORS = [
    ".o-mail-ChatterContainer",
    ".o-mail-Form-chatterContainer",
    ".o-mail-Form-chatter"
  ];
  var REQUIRED_HOST_METHODS = [
    "getCollapsed",
    "setCollapsed"
  ];

  surface.CHATTER_SELECTORS = DEFAULT_ODOO_CHATTER_SELECTORS.slice();
  surface.CHATTER_HOST_SELECTOR = surface.CHATTER_SELECTORS.join(", ");
  surface.CHATTER_HIDDEN_CLASS = "o_lib_chatter_hidden";
  surface.FORM_CHATTER_COLLAPSED_CLASS = "o_lib_form_chatter_collapsed";
  surface.BODY_CHATTER_COLLAPSED_CLASS = "o_lib_global_chatter_collapsed";
  surface.CHATTER_PARENT_COLLAPSED_CLASS = "o_lib_chatter_parent_collapsed";
  surface.CHATTER_TOGGLE_ID = "o_lib_global_chatter_toggle";
  surface.CHATTER_TOGGLE_CLASS = "o_lib_chatter_toggle_global";
  surface.CHATTER_TOGGLE_ACTIVE_CLASS = "o_lib_chatter_toggle_is_active";
  surface.CHATTER_TOGGLE_COLLAPSED_CLASS = "o_lib_chatter_toggle_is_collapsed";

  function requireObject(value, contractName) {
    if (!(value && typeof value === "object") || Array.isArray(value)) {
      throw new Error("Form Chatter Toggle Surface requires " + contractName + " to be an object.");
    }
    return value;
  }

  function requireBoolean(value, contractName) {
    if (typeof value !== "boolean") {
      throw new Error("Form Chatter Toggle Surface requires " + contractName + " to be a boolean.");
    }
    return value;
  }

  function requireHostMethods(hostApi, methodNames) {
    var missing = methodNames.filter(function (methodName) {
      return !(hostApi && typeof hostApi[methodName] === "function");
    });
    if (missing.length) {
      throw new Error("Form Chatter Toggle Surface host adapter is missing: " + missing.join(", ") + ".");
    }
  }

  function normalizeChatterSelectors(selectors) {
    if (!Array.isArray(selectors)) {
      throw new Error("Form Chatter Toggle Surface requires chatterSelectors to be an array.");
    }
    var normalized = selectors
      .map(function (selector) {
        return String(selector || "").trim();
      })
      .filter(function (selector, index, allSelectors) {
        return selector && allSelectors.indexOf(selector) === index;
      });
    if (!normalized.length) {
      throw new Error("Form Chatter Toggle Surface requires at least one chatter selector.");
    }
    return normalized;
  }

  function hostCall(methodName, args) {
    var hostApi = surface.hostApi;
    if (!(hostApi && typeof hostApi[methodName] === "function")) {
      throw new Error("Form Chatter Toggle Surface host adapter is missing: " + methodName + ".");
    }
    return hostApi[methodName].apply(hostApi, Array.isArray(args) ? args : []);
  }

  function optionalHostCall(methodName, args) {
    var hostApi = surface.hostApi;
    if (hostApi && typeof hostApi[methodName] === "function") {
      return hostApi[methodName].apply(hostApi, Array.isArray(args) ? args : []);
    }
    return undefined;
  }

  function install(hostApi) {
    var nextHostApi = requireObject(hostApi, "a host adapter object");
    var selectorSource = Object.prototype.hasOwnProperty.call(nextHostApi, "chatterSelectors")
      ? nextHostApi.chatterSelectors
      : DEFAULT_ODOO_CHATTER_SELECTORS;
    requireHostMethods(nextHostApi, REQUIRED_HOST_METHODS);
    surface.hostApi = nextHostApi;
    surface.CHATTER_SELECTORS = normalizeChatterSelectors(selectorSource);
    surface.CHATTER_HOST_SELECTOR = surface.CHATTER_SELECTORS.join(", ");
    surface.state.chatterCollapsed = requireBoolean(hostCall("getCollapsed", []), "getCollapsed()");
    return surface;
  }

  function isChatterCollapsed() {
    surface.state.chatterCollapsed = requireBoolean(hostCall("getCollapsed", []), "getCollapsed()");
    return surface.state.chatterCollapsed;
  }

  function setChatterCollapsed(collapsed) {
    surface.state.chatterCollapsed = Boolean(collapsed);
    hostCall("setCollapsed", [surface.state.chatterCollapsed]);
    optionalHostCall("onCollapsedChange", [surface.state.chatterCollapsed]);
    surface.applyChatterVisibility();
  }

  surface.DEFAULT_ODOO_CHATTER_SELECTORS = DEFAULT_ODOO_CHATTER_SELECTORS.slice();
  surface.REQUIRED_HOST_METHODS = REQUIRED_HOST_METHODS.slice();
  surface.hostCall = hostCall;
  surface.install = install;
  surface.isChatterCollapsed = isChatterCollapsed;
  surface.setChatterCollapsed = setChatterCollapsed;
})(window.OdooCommonFormChatterToggleSurface = window.OdooCommonFormChatterToggleSurface || {});
