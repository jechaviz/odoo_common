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

  var REQUIRED_HOST_METHODS = [
    "applyStatusbarMetaLabels",
    "backendFieldMetaFor",
    "canAccessLayoutSettings",
    "canAccessSectionSettings",
    "collectLayoutContainers",
    "collectSectionFieldMeta",
    "collectStatusbarMetas",
    "computeModelName",
    "computeScopeKey",
    "createFieldDefaultEditor",
    "currentLocaleCode",
    "ensureFieldDefinitionsLoadedForForm",
    "ensureRelationFieldOptionsLoaded",
    "fieldAllowsDefaultEditor",
    "fieldDefaultEntryKey",
    "fieldDefaultValue",
    "fieldIsVisible",
    "fieldVisibilityEntryKey",
    "findSectionHeader",
    "getSectionGroups",
    "getState",
    "layoutDefaultEntryKey",
    "layoutDefaultItemKey",
    "layoutItemIsVisible",
    "layoutItemVisibilityEntryKey",
    "layoutSettingsRoleEntryKey",
    "layoutSettingsRoleIds",
    "processFormNode",
    "queueStatePersist",
    "sectionIsVisible",
    "sectionSettingsRoleEntryKey",
    "sectionSettingsRoleIds",
    "sectionVisibilityEntryKey",
    "statusbarLabelEntryKey",
    "statusbarLabelValue",
    "updateFieldDefaultExpandedState"
  ];

  surface.hostApi = surface.hostApi || null;
  surface.runtime = surface.runtime || {};
  surface.state = surface.state || {};
  surface.state.panel = surface.state.panel || Object.assign({}, DEFAULT_PANEL_STATE);

  function cleanText(value) {
    if (value === null || typeof value === "undefined") {
      return "";
    }
    return String(value).replace(/\s+/g, " ").trim();
  }

  function requireText(value, contractName) {
    var text = cleanText(value);
    if (!text) {
      throw new Error("Form Settings Panel Surface requires " + contractName + ".");
    }
    return text;
  }

  function requireArray(value, contractName) {
    if (!Array.isArray(value)) {
      throw new Error("Form Settings Panel Surface requires " + contractName + " to be an array.");
    }
    return value;
  }

  function requireBoolean(value, contractName) {
    if (typeof value !== "boolean") {
      throw new Error("Form Settings Panel Surface requires " + contractName + " to be a boolean.");
    }
    return value;
  }

  function requireObject(value, contractName) {
    if (!(value && typeof value === "object") || Array.isArray(value)) {
      throw new Error("Form Settings Panel Surface requires " + contractName + " to be an object.");
    }
    return value;
  }

  function requireHostMethods(hostApi, methodNames) {
    var missing = methodNames.filter(function (methodName) {
      return !(hostApi && typeof hostApi[methodName] === "function");
    });
    if (missing.length) {
      throw new Error("Form Settings Panel Surface host adapter is missing: " + missing.join(", ") + ".");
    }
  }

  function hostCall(methodName, args) {
    var hostApi = surface.hostApi;
    if (!(hostApi && typeof hostApi[methodName] === "function")) {
      throw new Error("Form Settings Panel Surface host adapter is missing: " + methodName + ".");
    }
    return hostApi[methodName].apply(hostApi, Array.isArray(args) ? args : []);
  }

  function hostState() {
    return requireObject(hostCall("getState", []), "getState()");
  }

  function hostLayoutState() {
    var state = hostState();
    return requireObject(state.formLayoutState, "getState().formLayoutState");
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
    return requireBoolean(hostState().formIsAdminUser, "getState().formIsAdminUser");
  }

  function availableRoleOptions() {
    return requireArray(hostState().availableRoleOptions, "getState().availableRoleOptions");
  }

  function queuePersist() {
    hostCall("queueStatePersist", []);
  }

  function processFormNode(formNode) {
    hostCall("processFormNode", [formNode]);
  }

  function install(hostApi) {
    var nextHostApi = requireObject(hostApi, "a host adapter object");
    requireHostMethods(nextHostApi, REQUIRED_HOST_METHODS);
    surface.hostApi = nextHostApi;
    return surface;
  }

  function resetPanelState() {
    surface.state.panel = Object.assign({}, DEFAULT_PANEL_STATE);
    return surface.state.panel;
  }

  surface.REQUIRED_HOST_METHODS = REQUIRED_HOST_METHODS.slice();
  surface.cleanText = cleanText;
  surface.requireText = requireText;
  surface.requireArray = requireArray;
  surface.requireBoolean = requireBoolean;
  surface.requireObject = requireObject;
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
  surface.resetPanelState = resetPanelState;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
