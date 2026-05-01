(function (surface) {
  "use strict";

  var DEFAULT_PANEL_STATE = {
    panelNode: null,
    bodyNode: null,
    currentForm: null,
    currentScopeKey: "",
    focusSectionKey: "",
    focusLayoutKey: ""
  };

  surface.hostApi = surface.hostApi || null;
  surface.runtime = surface.runtime || {};
  surface.state = surface.state || {};
  surface.state.panel = surface.state.panel || Object.assign({}, DEFAULT_PANEL_STATE);

  function readObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function cleanText(value) {
    if (surface.hostApi && typeof surface.hostApi.cleanText === "function") {
      return String(surface.hostApi.cleanText(value) || "");
    }
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function readArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function hostCall(methodName, args, fallbackValue) {
    var hostApi = surface.hostApi;
    if (!(hostApi && typeof hostApi[methodName] === "function")) {
      return fallbackValue;
    }
    return hostApi[methodName].apply(hostApi, Array.isArray(args) ? args : []);
  }

  function hostState() {
    return readObject(hostCall("getState", [], surface.hostApi && surface.hostApi.state));
  }

  function hostLayoutState() {
    var state = hostState();
    return readObject(state.formLayoutState);
  }

  function panelState() {
    return surface.state.panel;
  }

  function ensureLayoutStateBucket(bucketName) {
    var layoutState = hostLayoutState();
    if (!layoutState[bucketName] || typeof layoutState[bucketName] !== "object") {
      layoutState[bucketName] = {};
    }
    return layoutState[bucketName];
  }

  function isAdminUser() {
    return Boolean(hostState().formIsAdminUser);
  }

  function availableRoleOptions() {
    return readArray(hostState().availableRoleOptions);
  }

  function queuePersist() {
    hostCall("queueStatePersist", [], null);
  }

  function processFormNode(formNode) {
    hostCall("processFormNode", [formNode], null);
  }

  function install(hostApi) {
    surface.hostApi = readObject(hostApi);
    return surface;
  }

  function autoInstallFromWindow() {
    var hostApi = window.OdooCommonFormSettingsPanelSurfaceHost;
    if (hostApi && typeof hostApi === "object") {
      install(hostApi);
    }
    return surface;
  }

  function resetPanelState() {
    surface.state.panel = Object.assign({}, DEFAULT_PANEL_STATE);
    return surface.state.panel;
  }

  surface.cleanText = cleanText;
  surface.readArray = readArray;
  surface.hostCall = hostCall;
  surface.hostState = hostState;
  surface.hostLayoutState = hostLayoutState;
  surface.panelState = panelState;
  surface.ensureLayoutStateBucket = ensureLayoutStateBucket;
  surface.isAdminUser = isAdminUser;
  surface.availableRoleOptions = availableRoleOptions;
  surface.queuePersist = queuePersist;
  surface.processFormNode = processFormNode;
  surface.install = install;
  surface.autoInstallFromWindow = autoInstallFromWindow;
  surface.resetPanelState = resetPanelState;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
