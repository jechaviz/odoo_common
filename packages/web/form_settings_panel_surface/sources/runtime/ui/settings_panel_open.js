(function (surface) {
  "use strict";

  function openSectionSettingsPanel(formNode, focusSectionKey, focusLayoutKey) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    var state = surface.panelState();
    var scopeKey = surface.requireText(surface.hostCall("computeScopeKey", [formNode]), "computeScopeKey()");
    var normalizedSectionFocus = surface.cleanText(focusSectionKey || "");
    if (
      normalizedSectionFocus &&
      !surface.requireBoolean(
        surface.hostCall("canAccessSectionSettings", [scopeKey, normalizedSectionFocus]),
        "canAccessSectionSettings(" + scopeKey + ", " + normalizedSectionFocus + ")"
      )
    ) {
      return;
    }
    var normalizedLayoutFocus = surface.cleanText(focusLayoutKey || "");
    var isStatusbarFocus = normalizedLayoutFocus.indexOf(surface.STATUSBAR_FOCUS_PREFIX) === 0;
    if (
      normalizedLayoutFocus &&
      isStatusbarFocus &&
      !surface.isAdminUser()
    ) {
      return;
    }
    if (
      normalizedLayoutFocus &&
      !isStatusbarFocus &&
      !surface.requireBoolean(
        surface.hostCall("canAccessLayoutSettings", [scopeKey, normalizedLayoutFocus]),
        "canAccessLayoutSettings(" + scopeKey + ", " + normalizedLayoutFocus + ")"
      )
    ) {
      return;
    }
    state.currentForm = formNode;
    state.currentScopeKey = scopeKey;
    state.focusSectionKey = normalizedSectionFocus;
    state.focusLayoutKey = normalizedLayoutFocus;
    if (state.focusSectionKey) {
      state.focusLayoutKey = "";
    }
    surface.renderSectionSettingsPanel(formNode, scopeKey, normalizedSectionFocus, normalizedLayoutFocus);
    var panel = surface.ensureSectionSettingsPanel();
    if (panel instanceof HTMLElement) {
      panel.classList.add(surface.PANEL_OPEN_CLASS);
    }
  }

  surface.openSectionSettingsPanel = openSectionSettingsPanel;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
