(function (surface) {
  "use strict";

  var PANEL_ID = "o_common_form_settings_panel";
  var PANEL_OPEN_CLASS = "o_lib_section_settings_open";
  var PANEL_BACKDROP_CLASS = "o_lib_section_settings_backdrop";
  var PANEL_CLOSE_CLASS = "o_lib_section_settings_close";

  function closeSectionSettingsPanel() {
    var state = surface.panelState();
    if (!(state.panelNode instanceof HTMLElement)) {
      return;
    }
    state.panelNode.classList.remove(PANEL_OPEN_CLASS);
    state.currentForm = null;
    state.currentScopeKey = "";
    state.focusSectionKey = "";
    state.focusLayoutKey = "";
  }

  function ensureSectionSettingsPanel() {
    var state = surface.panelState();
    var cachedPanel = state.panelNode;
    var cachedBody = state.bodyNode;
    var isConnected =
      cachedPanel instanceof HTMLElement &&
      document.body instanceof HTMLElement &&
      document.body.contains(cachedPanel) &&
      cachedBody instanceof HTMLElement &&
      cachedPanel.contains(cachedBody);

    if (isConnected) {
      return cachedPanel;
    }

    state.panelNode = null;
    state.bodyNode = null;

    var panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "o_lib_section_settings_panel";
    panel.innerHTML =
      '<div class="' + PANEL_BACKDROP_CLASS + '"></div>' +
      '<div class="o_lib_section_settings_dialog">' +
      '  <div class="o_lib_section_settings_header">' +
      '    <strong class="o_lib_section_settings_title">Section Settings</strong>' +
      '    <button type="button" class="' + PANEL_CLOSE_CLASS + '" aria-label="Close">x</button>' +
      "  </div>" +
      '  <div class="o_lib_section_settings_body"></div>' +
      "</div>";

    panel.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.classList.contains(PANEL_BACKDROP_CLASS) || target.classList.contains(PANEL_CLOSE_CLASS)) {
        closeSectionSettingsPanel();
      }
    });

    document.body.appendChild(panel);
    state.panelNode = panel;
    state.bodyNode = panel.querySelector(".o_lib_section_settings_body");
    return panel;
  }

  function resolveSectionDisplayLabel(formNode, sectionKey) {
    if (!(formNode instanceof HTMLElement) || !sectionKey) {
      return "";
    }
    var groups = surface.requireArray(surface.hostCall("getSectionGroups", [formNode]), "section groups");
    for (var index = 0; index < groups.length; index += 1) {
      var groupNode = groups[index];
      if (!(groupNode instanceof HTMLElement)) {
        continue;
      }
      if (surface.cleanText(groupNode.dataset.libSectionKey || "") !== sectionKey) {
        continue;
      }
      var headerNode = surface.hostCall("findSectionHeader", [groupNode]);
      return surface.requireText(
        headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel,
        "data-lib-section-label for " + sectionKey
      );
    }
    return "";
  }

  function resolveLayoutDisplayLabel(formNode, scopeKey, layoutKey) {
    if (!(formNode instanceof HTMLElement) || !layoutKey) {
      return "";
    }
    var metas = surface.requireArray(
      Array.isArray(formNode.__libLayoutMeta)
        ? formNode.__libLayoutMeta
        : surface.hostCall("collectLayoutContainers", [formNode, scopeKey]),
      "layout metadata"
    );
    for (var index = 0; index < metas.length; index += 1) {
      var meta = metas[index] || {};
      if (surface.cleanText(meta.key || "") === layoutKey) {
        return surface.requireText(meta.label, "layoutMeta.label for " + layoutKey);
      }
    }
    return "";
  }

  surface.PANEL_OPEN_CLASS = PANEL_OPEN_CLASS;
  surface.closeSectionSettingsPanel = closeSectionSettingsPanel;
  surface.ensureSectionSettingsPanel = ensureSectionSettingsPanel;
  surface.resolveSectionDisplayLabel = resolveSectionDisplayLabel;
  surface.resolveLayoutDisplayLabel = resolveLayoutDisplayLabel;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
