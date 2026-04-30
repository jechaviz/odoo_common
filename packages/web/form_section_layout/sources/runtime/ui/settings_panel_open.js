(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

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
