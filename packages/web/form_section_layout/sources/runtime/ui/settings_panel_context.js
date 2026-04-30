(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function resolveSettingsPanelFocusState(focusSectionKey, focusLayoutKey) {
    var activeSectionKey = v2.cleanText(
      typeof focusSectionKey === "string" ? focusSectionKey : _state.settingsPanelState.focusSectionKey || ""
    );
    var activeLayoutCandidate = v2.cleanText(
      typeof focusLayoutKey === "string" ? focusLayoutKey : _state.settingsPanelState.focusLayoutKey || ""
    );
    var activeStatusbarKey = "";
    var activeLayoutKey = activeLayoutCandidate;
    if (activeLayoutKey && activeLayoutKey.indexOf(v2.STATUSBAR_FOCUS_PREFIX) === 0) {
      activeStatusbarKey = v2.cleanText(activeLayoutKey.slice(v2.STATUSBAR_FOCUS_PREFIX.length));
      activeLayoutKey = "";
    }
    if (activeSectionKey) {
      activeLayoutKey = "";
      activeStatusbarKey = "";
    }
    return {
      activeSectionKey: activeSectionKey,
      activeLayoutKey: activeLayoutKey,
      activeStatusbarKey: activeStatusbarKey,
    };
  }

  settingsPanelRuntime.resolveSettingsPanelFocusState = resolveSettingsPanelFocusState;

  function resolveSettingsPanelTitle(formNode, scopeKey, focusState) {
    var activeSectionKey = v2.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = v2.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = v2.cleanText((focusState && focusState.activeStatusbarKey) || "");
    var panelTitle = "Section Settings";

    if (activeSectionKey) {
      var sectionTitle = v2.resolveSectionDisplayLabel(formNode, activeSectionKey);
      if (sectionTitle) {
        return sectionTitle + " settings";
      }
      return panelTitle;
    }
    if (activeLayoutKey) {
      var layoutTitle = v2.resolveLayoutDisplayLabel(formNode, scopeKey, activeLayoutKey);
      if (layoutTitle) {
        return layoutTitle + " settings";
      }
      return panelTitle;
    }
    if (!activeStatusbarKey) {
      return panelTitle;
    }

    var statusbarTitle = "Statusbar labels";
    var knownStatusbars = Array.isArray(formNode.__libStatusbarMeta)
      ? formNode.__libStatusbarMeta
      : v2.collectStatusbarMetas(formNode, scopeKey);
    for (var statusbarIndex = 0; statusbarIndex < knownStatusbars.length; statusbarIndex += 1) {
      var statusbarMeta = knownStatusbars[statusbarIndex];
      if (v2.cleanText((statusbarMeta && statusbarMeta.key) || "") === activeStatusbarKey) {
        statusbarTitle = v2.cleanText((statusbarMeta && statusbarMeta.label) || statusbarTitle);
        break;
      }
    }
    return statusbarTitle + " settings";
  }

  settingsPanelRuntime.resolveSettingsPanelTitle = resolveSettingsPanelTitle;

  function scrollSettingsPanelToFocus(focusState, sectionRows, layoutRows, statusbarRows) {
    var activeSectionKey = v2.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = v2.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = v2.cleanText((focusState && focusState.activeStatusbarKey) || "");

    if (activeSectionKey) {
      var focusedSection = (sectionRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libSectionKey || "") === activeSectionKey;
      });
      if (focusedSection instanceof HTMLElement) {
        focusedSection.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (activeLayoutKey) {
      var focusedLayout = (layoutRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libLayoutKey || "") === activeLayoutKey;
      });
      if (focusedLayout instanceof HTMLElement) {
        focusedLayout.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (!activeStatusbarKey) {
      return;
    }
    var focusedStatusbar = (statusbarRows || []).find(function (rowNode) {
      return String(rowNode.dataset.libStatusbarKey || "") === activeStatusbarKey;
    });
    if (focusedStatusbar instanceof HTMLElement) {
      focusedStatusbar.scrollIntoView({ block: "nearest" });
    }
  }

  settingsPanelRuntime.scrollSettingsPanelToFocus = scrollSettingsPanelToFocus;

  function rerenderSettingsPanelAfterRelationLoads(formNode, scopeKey, pendingRelationOptionsLoads) {
    if (!Array.isArray(pendingRelationOptionsLoads) || !pendingRelationOptionsLoads.length) {
      return;
    }
    Promise.all(pendingRelationOptionsLoads)
      .then(function () {
        if (
          _state.settingsPanelState.currentForm === formNode &&
          _state.settingsPanelState.panelNode instanceof HTMLElement &&
          _state.settingsPanelState.panelNode.classList.contains(v2.SETTINGS_PANEL_OPEN_CLASS)
        ) {
          v2.renderSectionSettingsPanel(
            formNode,
            scopeKey,
            _state.settingsPanelState.focusSectionKey || "",
            _state.settingsPanelState.focusLayoutKey || ""
          );
        }
      })
      .catch(function () {
        // Keep current panel state if relation options cannot be loaded.
      });
  }

  settingsPanelRuntime.rerenderSettingsPanelAfterRelationLoads = rerenderSettingsPanelAfterRelationLoads;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
