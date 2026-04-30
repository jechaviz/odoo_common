(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};
  var subtotalsRuntime = v2.subtotals_runtime;
  var prepareSubtotalLayoutForRender = function () {
    return subtotalsRuntime.prepareSubtotalLayoutForRender.apply(subtotalsRuntime, arguments);
  };
  var syncNativeSubtotalRowsForRender = function () {
    return subtotalsRuntime.syncNativeSubtotalRowsForRender.apply(subtotalsRuntime, arguments);
  };
  var ensureSubtotalRenderWrap = function () {
    return subtotalsRuntime.ensureSubtotalRenderWrap.apply(subtotalsRuntime, arguments);
  };
  var updateSubtotalRenderChrome = function () {
    return subtotalsRuntime.updateSubtotalRenderChrome.apply(subtotalsRuntime, arguments);
  };
  var buildOrderedSubtotalRenderContext = function () {
    return subtotalsRuntime.buildOrderedSubtotalRenderContext.apply(subtotalsRuntime, arguments);
  };
  var buildSubtotalEditRow = function () {
    return subtotalsRuntime.buildSubtotalEditRow.apply(subtotalsRuntime, arguments);
  };
  var buildSubtotalDisplayRow = function () {
    return subtotalsRuntime.buildSubtotalDisplayRow.apply(subtotalsRuntime, arguments);
  };
  var bindSubtotalWrapDropTargets = function () {
    return subtotalsRuntime.bindSubtotalWrapDropTargets.apply(subtotalsRuntime, arguments);
  };
  var appendSubtotalEditActions = function () {
    return subtotalsRuntime.appendSubtotalEditActions.apply(subtotalsRuntime, arguments);
  };

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render.js

  function renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }

    containerNode.querySelectorAll("." + SUBTOTAL_NATIVE_HIDDEN_CLASS).forEach(function (node) {
      node.classList.remove(SUBTOTAL_NATIVE_HIDDEN_CLASS);
    });
    var preparedLayout = prepareSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey);
    var layout = preparedLayout.layout;
    var allNativeRows = preparedLayout.allNativeRows;
    syncNativeSubtotalRowsForRender(allNativeRows, layout);

    var wrap = ensureSubtotalRenderWrap(containerNode, scopeKey, containerKey);
    var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
    var editMode = Boolean(_state.subtotalEditModes[editStateKey]);
    updateSubtotalRenderChrome(containerNode, editMode);

    wrap.innerHTML = "";
    var renderContext = buildOrderedSubtotalRenderContext(formNode, containerNode, scopeKey, containerKey, layout, allNativeRows);
    var visibleLines = Array.isArray(renderContext.visibleOrderedLines)
      ? renderContext.visibleOrderedLines
      : renderContext.orderedLines;
    visibleLines.forEach(function (line) {
      var valueAmount = Number(renderContext.runningValues[cleanText(line.id || "").toLowerCase()] || 0);
      var row = editMode
        ? buildSubtotalEditRow(containerNode, formNode, scopeKey, containerKey, line, valueAmount)
        : buildSubtotalDisplayRow(formNode, line, valueAmount, scopeKey, containerKey);
      wrap.appendChild(row);
    });
    bindSubtotalWrapDropTargets(wrap, containerNode, formNode, scopeKey, containerKey, editMode);
    if (editMode) {
      appendSubtotalEditActions(wrap, containerNode, formNode, scopeKey, containerKey);
    }

    writeSubtotalLayoutState(scopeKey, containerKey, layout);
  }

  v2.renderSubtotalLayout = renderSubtotalLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
