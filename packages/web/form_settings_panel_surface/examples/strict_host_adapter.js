(function () {
  "use strict";

  const surface = window.OdooCommonFormSettingsPanelSurface;
  if (!surface || typeof surface.install !== "function") {
    throw new Error("form-settings-panel-surface runtime is not loaded");
  }

  const state = Object.create(null);

  surface.install({
    getState: function () {
      return state;
    },
    queueStatePersist: function () {},
    processFormNode: function () {},
    computeScopeKey: function (formNode) {
      return formNode.getAttribute("data-lib-scope-key");
    },
    canAccessSectionSettings: function () {
      return true;
    },
    canAccessLayoutSettings: function () {
      return true;
    },
    getSectionGroups: function () {
      return [];
    },
    findSectionHeader: function () {
      return null;
    },
    collectSectionFieldMeta: function () {
      return [];
    },
    sectionVisibilityEntryKey: function (scopeKey, sectionKey) {
      return scopeKey + ":section:" + sectionKey + ":visible";
    },
    sectionSettingsRoleEntryKey: function (scopeKey, sectionKey) {
      return scopeKey + ":section:" + sectionKey + ":roles";
    },
    sectionIsVisible: function () {
      return true;
    },
    sectionSettingsRoleIds: function () {
      return [];
    },
    fieldVisibilityEntryKey: function (scopeKey, fieldName) {
      return scopeKey + ":field:" + fieldName + ":visible";
    },
    fieldDefaultEntryKey: function (scopeKey, fieldName) {
      return scopeKey + ":field:" + fieldName + ":default";
    },
    fieldIsVisible: function () {
      return true;
    },
    fieldDefaultValue: function () {
      return "";
    },
    fieldAllowsDefaultEditor: function () {
      return false;
    },
    createFieldDefaultEditor: function () {
      return null;
    },
    updateFieldDefaultExpandedState: function () {},
    backendFieldMetaFor: function () {
      return null;
    },
    computeModelName: function (formNode) {
      return formNode.getAttribute("data-res-model") || "";
    },
    ensureFieldDefinitionsLoadedForForm: function () {},
    ensureRelationFieldOptionsLoaded: function () {},
    collectLayoutContainers: function () {
      return [];
    },
    layoutDefaultEntryKey: function (scopeKey, layoutKey) {
      return scopeKey + ":layout:" + layoutKey + ":default";
    },
    layoutDefaultItemKey: function (scopeKey, layoutKey) {
      return scopeKey + ":layout:" + layoutKey + ":item";
    },
    layoutItemVisibilityEntryKey: function (scopeKey, itemKey) {
      return scopeKey + ":layout-item:" + itemKey + ":visible";
    },
    layoutItemIsVisible: function () {
      return true;
    },
    layoutSettingsRoleEntryKey: function (scopeKey, layoutKey) {
      return scopeKey + ":layout:" + layoutKey + ":roles";
    },
    layoutSettingsRoleIds: function () {
      return [];
    },
    collectStatusbarMetas: function () {
      return [];
    },
    currentLocaleCode: function () {
      return "en_US";
    },
    statusbarLabelEntryKey: function (scopeKey, statusbarKey) {
      return scopeKey + ":statusbar:" + statusbarKey + ":label";
    },
    statusbarLabelValue: function () {
      return "";
    },
    applyStatusbarMetaLabels: function () {},
  });
})();
