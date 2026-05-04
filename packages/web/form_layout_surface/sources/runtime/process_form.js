(function (v2) {
  "use strict";

  function processFormNode(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }

    var scopeKey = v2.computeScopeKey(formNode);
    var groups = v2.getSectionGroups(formNode);

    groups.forEach(function (group) {
      if (!(group instanceof HTMLElement)) {
        return;
      }
      var sectionKey = v2.readSectionKey(group);
      if (!sectionKey) {
        return;
      }
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
