(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/settings_panel_shell.js

  function closeSectionSettingsPanel() {
    if (!(_state.settingsPanelState.panelNode instanceof HTMLElement)) {
      return;
    }
    _state.settingsPanelState.panelNode.classList.remove(SETTINGS_PANEL_OPEN_CLASS);
    _state.settingsPanelState.currentForm = null;
    _state.settingsPanelState.currentScopeKey = "";
    _state.settingsPanelState.focusSectionKey = "";
    _state.settingsPanelState.focusLayoutKey = "";
  }

  v2.closeSectionSettingsPanel = closeSectionSettingsPanel;

  function ensureSectionSettingsPanel() {
    var cachedPanel = _state.settingsPanelState.panelNode;
    var cachedBody = _state.settingsPanelState.bodyNode;
    var cachedPanelIsConnected =
      cachedPanel instanceof HTMLElement &&
      document.body instanceof HTMLElement &&
      document.body.contains(cachedPanel);

    if (
      cachedPanelIsConnected &&
      cachedBody instanceof HTMLElement &&
      cachedPanel.contains(cachedBody)
    ) {
      return cachedPanel;
    }

    _state.settingsPanelState.panelNode = null;
    _state.settingsPanelState.bodyNode = null;

    var panel = document.createElement("div");
    panel.id = SETTINGS_PANEL_ID;
    panel.className = "o_lib_section_settings_panel";
    panel.innerHTML =
      '<div class="' +
      SETTINGS_PANEL_BACKDROP_CLASS +
      '"></div>' +
      '<div class="o_lib_section_settings_dialog">' +
      '  <div class="o_lib_section_settings_header">' +
      '    <strong class="o_lib_section_settings_title">Section Settings</strong>' +
      '    <button type="button" class="' +
      SETTINGS_PANEL_CLOSE_CLASS +
      '" aria-label="Close">x</button>' +
      "  </div>" +
      '  <div class="o_lib_section_settings_body"></div>' +
      "</div>";

    panel.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.classList.contains(SETTINGS_PANEL_BACKDROP_CLASS) || target.classList.contains(SETTINGS_PANEL_CLOSE_CLASS)) {
        closeSectionSettingsPanel();
      }
    });

    document.body.appendChild(panel);
    _state.settingsPanelState.panelNode = panel;
    _state.settingsPanelState.bodyNode = panel.querySelector(".o_lib_section_settings_body");
    return panel;
  }

  v2.ensureSectionSettingsPanel = ensureSectionSettingsPanel;

  function resolveSectionDisplayLabel(formNode, sectionKey) {
    if (!(formNode instanceof HTMLElement) || !sectionKey) {
      return "";
    }
    var groups = getSectionGroups(formNode);
    for (var i = 0; i < groups.length; i += 1) {
      var group = groups[i];
      if (!(group instanceof HTMLElement)) {
        continue;
      }
      var key = cleanText(group.dataset.libSectionKey || "");
      if (key !== sectionKey) {
        continue;
      }
      var headerNode = findSectionHeader(group);
      return cleanText(
        (headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel) ||
        (headerNode && headerNode.textContent) ||
        sectionKey
      );
    }
    return sectionKey;
  }

  v2.resolveSectionDisplayLabel = resolveSectionDisplayLabel;

  function resolveLayoutDisplayLabel(formNode, scopeKey, layoutKey) {
    if (!(formNode instanceof HTMLElement) || !layoutKey) {
      return "";
    }
    var metas = Array.isArray(formNode.__libLayoutMeta) ? formNode.__libLayoutMeta : collectLayoutContainers(formNode, scopeKey);
    for (var i = 0; i < metas.length; i += 1) {
      var meta = metas[i];
      var key = cleanText((meta && meta.key) || "");
      if (key === layoutKey) {
        return cleanText((meta && meta.label) || layoutKey);
      }
    }
    return layoutKey;
  }

  v2.resolveLayoutDisplayLabel = resolveLayoutDisplayLabel;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
