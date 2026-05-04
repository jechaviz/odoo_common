(function (surface) {
  "use strict";

  function renderSectionSettingsPanel(formNode, scopeKey, focusSectionKey, focusLayoutKey) {
    var panel = surface.ensureSectionSettingsPanel();
    var state = surface.panelState();
    if (!(panel instanceof HTMLElement) || !(state.bodyNode instanceof HTMLElement)) {
      return;
    }

    surface.hostCall("ensureFieldDefinitionsLoadedForForm", [formNode]);

    var focusState = surface.runtime.resolveSettingsPanelFocusState(focusSectionKey, focusLayoutKey);
    var titleNode = panel.querySelector(".o_lib_section_settings_title");
    if (titleNode instanceof HTMLElement) {
      titleNode.textContent = surface.runtime.resolveSettingsPanelTitle(formNode, scopeKey, focusState);
    }

    var bodyNode = state.bodyNode;
    bodyNode.innerHTML = "";
    var pendingRelationOptionsLoads = [];

    var sectionRows = surface.runtime.renderSectionSettingsRows(
      formNode,
      scopeKey,
      focusState,
      bodyNode,
      pendingRelationOptionsLoads
    );
    var layoutRows = surface.runtime.renderLayoutSettingsRows(formNode, scopeKey, focusState, bodyNode);
    var statusbarRows = surface.runtime.renderStatusbarSettingsRows(formNode, scopeKey, focusState, bodyNode);

    surface.runtime.scrollSettingsPanelToFocus(focusState, sectionRows, layoutRows, statusbarRows);
    surface.runtime.rerenderSettingsPanelAfterRelationLoads(formNode, scopeKey, pendingRelationOptionsLoads);
  }

  surface.renderSectionSettingsPanel = renderSectionSettingsPanel;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
