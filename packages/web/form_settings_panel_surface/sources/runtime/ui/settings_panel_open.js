(function (surface) {
  "use strict";

  function openSectionSettingsPanel(formNode, focusSectionKey, focusLayoutKey) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var state = surface.panelState();
    var scopeKey = surface.cleanText(surface.hostCall("computeScopeKey", [formNode], ""));
    if (focusSectionKey && !surface.hostCall("canAccessSectionSettings", [scopeKey, focusSectionKey], true)) {
      return;
    }
    var normalizedLayoutFocus = surface.cleanText(focusLayoutKey || "");
    if (
      normalizedLayoutFocus &&
      normalizedLayoutFocus.indexOf(surface.STATUSBAR_FOCUS_PREFIX) === 0 &&
      !surface.isAdminUser()
    ) {
      return;
    }
    if (normalizedLayoutFocus && !surface.hostCall("canAccessLayoutSettings", [scopeKey, normalizedLayoutFocus], true)) {
      return;
    }
    state.currentForm = formNode;
    state.currentScopeKey = scopeKey;
    state.focusSectionKey = surface.cleanText(focusSectionKey || "");
    state.focusLayoutKey = normalizedLayoutFocus;
    if (state.focusSectionKey) {
      state.focusLayoutKey = "";
    }
    surface.renderSectionSettingsPanel(formNode, scopeKey, focusSectionKey, normalizedLayoutFocus);
    var panel = surface.ensureSectionSettingsPanel();
    if (panel instanceof HTMLElement) {
      panel.classList.add(surface.PANEL_OPEN_CLASS);
    }
  }

  surface.openSectionSettingsPanel = openSectionSettingsPanel;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
