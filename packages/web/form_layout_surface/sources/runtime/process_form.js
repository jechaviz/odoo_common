(function (v2) {
  "use strict";

  function processFormNode(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }

    var scopeKey = v2.computeScopeKey(formNode);
    var groups = v2.getSectionGroups(formNode);

    groups.forEach(function (group, index) {
      if (!(group instanceof HTMLElement)) {
        return;
      }
      var explicitKey = v2.normalizeKey(v2.findSectionKeyFromClass(group));
      var header = v2.findSectionHeader(group);
      var labelSeed = v2.normalizeKey((header && header.textContent) || group.dataset.libSectionKey || "");
      var sectionKey = explicitKey || (labelSeed ? "auto_" + labelSeed : "auto_section_" + index);
      group.dataset.libSectionKey = sectionKey;
      group.dataset.libScopeKey = scopeKey;
      group.classList.add(v2.COLLAPSIBLE_GROUP_CLASS);
    });

    if (groups.length) {
      v2.applySavedOrderForForm(formNode, scopeKey);
    }

    var layoutMetas = v2.collectLayoutContainers(formNode, scopeKey);
    formNode.__libLayoutMeta = layoutMetas;
    layoutMetas.forEach(function (layoutMeta) {
      v2.applyLayoutVisibility(layoutMeta, scopeKey);
    });

    if (typeof v2.processFormSubtotals === "function") {
      v2.processFormSubtotals(formNode, scopeKey);
    }
  }

  v2.processFormNode = processFormNode;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
