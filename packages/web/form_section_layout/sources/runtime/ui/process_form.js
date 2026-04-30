(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  function processFormNode(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }

    v2.ensureFieldDefinitionsLoadedForForm(formNode);
    var scopeKey = v2.computeScopeKey(formNode);
    var groups = v2.getSectionGroups(formNode);

    groups.forEach(function (group, index) {
      var header = v2.findSectionHeader(group);
      if (!(header instanceof HTMLElement)) {
        return;
      }

      var explicitKey = v2.normalizeKey(v2.findSectionKeyFromClass(group));
      var labelSeed = v2.normalizeKey(header.dataset.libSectionLabel || header.textContent || "");
      var sectionKey = explicitKey || (labelSeed ? "auto_" + labelSeed : "auto_section_" + index);

      group.dataset.libSectionKey = sectionKey;
      group.dataset.libScopeKey = scopeKey;
      v2.decorateSectionHeader(group, header, sectionKey, scopeKey);
    });

    if (groups.length) {
      v2.applySavedOrderForForm(formNode, scopeKey);
    }

    v2.getSectionGroups(formNode).forEach(function (group) {
      var header = v2.findSectionHeader(group);
      if (!(header instanceof HTMLElement)) {
        return;
      }
      var sectionKey = String(group.dataset.libSectionKey || "").trim();
      if (!sectionKey) {
        return;
      }
      var visible = v2.sectionIsVisible(scopeKey, sectionKey);
      v2.setSectionVisible(group, visible);
      if (!visible) {
        return;
      }
      var collapsed = Boolean(_state.formLayoutState.collapsed[v2.collapsedEntryKey(scopeKey, sectionKey)]);
      v2.setGroupCollapsed(group, header, collapsed);
      v2.applySectionFieldLayout(group, scopeKey, sectionKey);
    });

    var layoutMetas = v2.collectLayoutContainers(formNode, scopeKey);
    formNode.__libLayoutMeta = layoutMetas;
    layoutMetas.forEach(function (layoutMeta) {
      v2.applyLayoutVisibility(layoutMeta, scopeKey);
      v2.decorateLayoutContainer(layoutMeta, scopeKey);
    });
    v2.cleanupStaleLayoutTriggers(formNode, layoutMetas);

    var statusbarMetas = v2.collectStatusbarMetas(formNode, scopeKey);
    formNode.__libStatusbarMeta = statusbarMetas;
    statusbarMetas.forEach(function (statusbarMeta) {
      v2.applyStatusbarMetaLabels(statusbarMeta, scopeKey);
      v2.decorateStatusbarContainer(statusbarMeta, scopeKey);
    });
    v2.cleanupStaleStatusbarTriggers(formNode, statusbarMetas);

    v2.normalizeAssetNumberFieldDisplays(formNode);
    if (typeof v2.refreshSubtotalToggleStateFromBackend === "function") {
      v2.refreshSubtotalToggleStateFromBackend(formNode, v2.syncSubtotalRecordBinding(formNode));
    } else {
      v2.syncSubtotalRecordBinding(formNode);
    }
    v2.decorateSubtotalContainers(formNode, scopeKey);
  }

  v2.processFormNode = processFormNode;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
