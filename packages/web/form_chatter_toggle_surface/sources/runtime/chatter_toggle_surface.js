(function (surface) {
  "use strict";

  surface.hostApi = surface.hostApi || null;
  surface.state = surface.state || {
    chatterCollapsed: true
  };

  surface.CHATTER_HOST_SELECTOR =
    ".o-mail-ChatterContainer, .o-mail-Form-chatterContainer, .o_FormRenderer_chatterContainer, .o_ChatterContainer, .o-mail-Form-chatter, .oe_chatter, .o-mail-Chatter";
  surface.CHATTER_SELECTORS = [
    ".o-mail-ChatterContainer",
    ".o-mail-Form-chatterContainer",
    ".o_FormRenderer_chatterContainer",
    ".o_ChatterContainer",
    ".o-mail-Form-chatter",
    ".oe_chatter",
    ".o-mail-Chatter"
  ];
  surface.CHATTER_HIDDEN_CLASS = "o_lib_chatter_hidden";
  surface.FORM_CHATTER_COLLAPSED_CLASS = "o_lib_form_chatter_collapsed";
  surface.BODY_CHATTER_COLLAPSED_CLASS = "o_lib_global_chatter_collapsed";
  surface.CHATTER_PARENT_COLLAPSED_CLASS = "o_lib_chatter_parent_collapsed";
  surface.CHATTER_TOGGLE_ID = "o_lib_global_chatter_toggle";
  surface.CHATTER_TOGGLE_CLASS = "o_lib_chatter_toggle_global";
  surface.CHATTER_TOGGLE_ACTIVE_CLASS = "o_lib_chatter_toggle_is_active";
  surface.CHATTER_TOGGLE_COLLAPSED_CLASS = "o_lib_chatter_toggle_is_collapsed";

  function readObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function hostCall(methodName, args, fallbackValue) {
    var hostApi = surface.hostApi;
    if (!(hostApi && typeof hostApi[methodName] === "function")) {
      return fallbackValue;
    }
    return hostApi[methodName].apply(hostApi, Array.isArray(args) ? args : []);
  }

  function install(hostApi) {
    surface.hostApi = readObject(hostApi);
    var externalCollapsed = hostCall("getCollapsed", [], null);
    if (typeof externalCollapsed === "boolean") {
      surface.state.chatterCollapsed = externalCollapsed;
    }
    return surface;
  }

  function autoInstallFromWindow() {
    var hostApi = window.OdooCommonFormChatterToggleSurfaceHost;
    if (hostApi && typeof hostApi === "object") {
      install(hostApi);
    }
    return surface;
  }

  function isChatterCollapsed() {
    var externalCollapsed = hostCall("getCollapsed", [], null);
    if (typeof externalCollapsed === "boolean") {
      surface.state.chatterCollapsed = externalCollapsed;
    }
    return Boolean(surface.state.chatterCollapsed);
  }

  function setChatterCollapsed(collapsed) {
    surface.state.chatterCollapsed = Boolean(collapsed);
    hostCall("setCollapsed", [surface.state.chatterCollapsed], null);
    hostCall("onCollapsedChange", [surface.state.chatterCollapsed], null);
    surface.applyChatterVisibility();
  }

  surface.hostCall = hostCall;
  surface.install = install;
  surface.autoInstallFromWindow = autoInstallFromWindow;
  surface.isChatterCollapsed = isChatterCollapsed;
  surface.setChatterCollapsed = setChatterCollapsed;
})(window.OdooCommonFormChatterToggleSurface = window.OdooCommonFormChatterToggleSurface || {});
