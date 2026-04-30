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
