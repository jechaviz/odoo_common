(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/persist.js

  async function persistActiveSubtotalEdits(contexts) {
    var editContexts = Array.isArray(contexts) ? contexts : collectActiveSubtotalEditContexts();
    if (!editContexts.length) {
      return true;
    }

    for (var index = 0; index < editContexts.length; index += 1) {
      var contextItem = editContexts[index];
      var currentLayout = normalizeSubtotalLayout(readSubtotalLayoutState(contextItem.scopeKey, contextItem.containerKey));
      var validation = validateSubtotalLayoutForSave(currentLayout);
      if (!validation.valid) {
        renderSubtotalLayout(
          contextItem.containerNode,
          contextItem.formNode,
          contextItem.scopeKey,
          contextItem.containerKey
        );
        window.alert("Fix invalid formulas before saving.");
        return false;
      }
      _state.subtotalEditSnapshots[contextItem.editStateKey] = cloneSubtotalLayout(currentLayout);
    }

    var firstContext = editContexts[0];
    await queueStatePersist({
      scopeKey: firstContext.scopeKey,
      containerKey: firstContext.containerKey,
    });

    editContexts.forEach(function (contextItem) {
      setSubtotalEditMode(
        contextItem.containerNode,
        contextItem.formNode,
        contextItem.scopeKey,
        contextItem.containerKey,
        false,
        true
      );
    });
    return true;
  }

  v2.persistActiveSubtotalEdits = persistActiveSubtotalEdits;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
