(function (v2) {
  "use strict";
  v2.state = v2.state || {};
  var _state = v2.state = v2.state || {};

  _state.formLayoutState = v2.emptyLayoutState();

  _state.formLayoutReady = false;

  _state.formLayoutLoadPromise = null;

  _state.formLayoutSavePromise = null;

  _state.formLayoutSaveDirty = false;

  _state.pendingStatePersistOptions = null;

  _state.formCanSaveToDb = false;

  _state.formIsAdminUser = false;

  _state.currentUserGroupIds = [];

  _state.availableRoleOptions = [];

  _state.settingsIconClass = SETTINGS_ICON_CLASS;

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
