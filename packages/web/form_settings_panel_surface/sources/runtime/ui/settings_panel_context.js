(function (surface) {
  "use strict";

  var STATUSBAR_FOCUS_PREFIX = "statusbar::";

  function resolveSettingsPanelFocusState(focusSectionKey, focusLayoutKey) {
    var state = surface.panelState();
    var activeSectionKey = surface.cleanText(
      typeof focusSectionKey === "string" ? focusSectionKey : state.focusSectionKey || ""
    );
    var activeLayoutCandidate = surface.cleanText(
      typeof focusLayoutKey === "string" ? focusLayoutKey : state.focusLayoutKey || ""
    );
    var activeStatusbarKey = "";
    var activeLayoutKey = activeLayoutCandidate;

    if (activeLayoutKey && activeLayoutKey.indexOf(STATUSBAR_FOCUS_PREFIX) === 0) {
      activeStatusbarKey = surface.cleanText(activeLayoutKey.slice(STATUSBAR_FOCUS_PREFIX.length));
      activeLayoutKey = "";
    }
    if (activeSectionKey) {
      activeLayoutKey = "";
      activeStatusbarKey = "";
    }

    return {
      activeSectionKey: activeSectionKey,
      activeLayoutKey: activeLayoutKey,
      activeStatusbarKey: activeStatusbarKey
    };
  }

  function resolveSettingsPanelTitle(formNode, scopeKey, focusState) {
    var activeSectionKey = surface.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = surface.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = surface.cleanText((focusState && focusState.activeStatusbarKey) || "");
    var panelTitle = "Section Settings";

    if (activeSectionKey) {
      var sectionTitle = surface.resolveSectionDisplayLabel(formNode, activeSectionKey);
      return sectionTitle ? sectionTitle + " settings" : panelTitle;
    }
    if (activeLayoutKey) {
      var layoutTitle = surface.resolveLayoutDisplayLabel(formNode, scopeKey, activeLayoutKey);
      return layoutTitle ? layoutTitle + " settings" : panelTitle;
    }
    if (!activeStatusbarKey) {
      return panelTitle;
    }

    var statusbarTitle = "Statusbar labels";
    var knownStatusbars = surface.requireArray(
      Array.isArray(formNode.__libStatusbarMeta)
        ? formNode.__libStatusbarMeta
        : surface.hostCall("collectStatusbarMetas", [formNode, scopeKey]),
      "statusbar metadata"
    );
    for (var index = 0; index < knownStatusbars.length; index += 1) {
      var statusbarMeta = knownStatusbars[index] || {};
      if (surface.cleanText(statusbarMeta.key || "") === activeStatusbarKey) {
        statusbarTitle = surface.requireText(statusbarMeta.label, "statusbarMeta.label for " + activeStatusbarKey);
        break;
      }
    }
    return statusbarTitle + " settings";
  }

  function scrollSettingsPanelToFocus(focusState, sectionRows, layoutRows, statusbarRows) {
    var activeSectionKey = surface.cleanText((focusState && focusState.activeSectionKey) || "");
    var activeLayoutKey = surface.cleanText((focusState && focusState.activeLayoutKey) || "");
    var activeStatusbarKey = surface.cleanText((focusState && focusState.activeStatusbarKey) || "");
    var targetRow = null;

    if (activeSectionKey) {
      targetRow = (sectionRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libSectionKey || "") === activeSectionKey;
      }) || null;
    } else if (activeLayoutKey) {
      targetRow = (layoutRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libLayoutKey || "") === activeLayoutKey;
      }) || null;
    } else if (activeStatusbarKey) {
      targetRow = (statusbarRows || []).find(function (rowNode) {
        return String(rowNode.dataset.libStatusbarKey || "") === activeStatusbarKey;
      }) || null;
    }

    if (targetRow instanceof HTMLElement) {
      targetRow.scrollIntoView({ block: "nearest" });
    }
  }

  function rerenderSettingsPanelAfterRelationLoads(formNode, scopeKey, pendingRelationOptionsLoads) {
    var state = surface.panelState();
    if (!Array.isArray(pendingRelationOptionsLoads) || !pendingRelationOptionsLoads.length) {
      return;
    }
    Promise.all(pendingRelationOptionsLoads)
      .then(function () {
        if (
          state.currentForm === formNode &&
          state.panelNode instanceof HTMLElement &&
          state.panelNode.classList.contains(surface.PANEL_OPEN_CLASS)
        ) {
          surface.renderSectionSettingsPanel(
            formNode,
            scopeKey,
            state.focusSectionKey || "",
            state.focusLayoutKey || ""
          );
        }
      })
      .catch(function (error) {
        window.setTimeout(function () {
          throw error;
        }, 0);
      });
  }

  surface.STATUSBAR_FOCUS_PREFIX = STATUSBAR_FOCUS_PREFIX;
  surface.runtime.resolveSettingsPanelFocusState = resolveSettingsPanelFocusState;
  surface.runtime.resolveSettingsPanelTitle = resolveSettingsPanelTitle;
  surface.runtime.scrollSettingsPanelToFocus = scrollSettingsPanelToFocus;
  surface.runtime.rerenderSettingsPanelAfterRelationLoads = rerenderSettingsPanelAfterRelationLoads;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
