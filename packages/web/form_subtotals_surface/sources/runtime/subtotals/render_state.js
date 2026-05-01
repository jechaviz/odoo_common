(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};
  var subtotalsRuntime = v2.subtotals_runtime;

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render_state.js

  function persistPreparedSubtotalLayout(scopeKey, containerKey, layout, persistNeeded) {
    writeSubtotalLayoutState(scopeKey, containerKey, layout);
    if (!persistNeeded) {
      return;
    }
    queueStatePersist({
      scopeKey: scopeKey,
      containerKey: containerKey,
    });
  }

  function stripManagedSubtotalLines(layout) {
    var cleanedLines = layout.lines.filter(function (line) {
      var sourceKey = normalizeKey((line && line.sourceField) || "");
      if (isCoreSubtotalLine(line && line.label, line && line.sourceField)) {
        return false;
      }
      if (sourceKey === "tax_totals") {
        return false;
      }
      return true;
    });
    if (cleanedLines.length === layout.lines.length) {
      return false;
    }
    layout.lines = cleanedLines;
    layout.order = layout.order.filter(function (lineId) {
      return cleanedLines.some(function (line) {
        return line.id === lineId;
      });
    });
    cleanedLines.forEach(function (line) {
      if (layout.order.indexOf(line.id) < 0) {
        layout.order.push(line.id);
      }
    });
    return true;
  }

  function dedupeSubtotalLinesBySource(layout) {
    var seenSources = new Set();
    var removedIds = new Set();
    var changed = false;
    layout.lines = layout.lines.filter(function (line) {
      var sourceKey = normalizeKey((line && line.sourceField) || "");
      if (!sourceKey) {
        return true;
      }
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        return true;
      }
      removedIds.add(line.id);
      changed = true;
      return false;
    });
    if (!changed) {
      return false;
    }
    layout.order = layout.order.filter(function (lineId) {
      return !removedIds.has(lineId);
    });
    layout.lines.forEach(function (line) {
      if (layout.order.indexOf(line.id) < 0) {
        layout.order.push(line.id);
      }
    });
    return true;
  }

  function ensureRequiredSubtotalLine(layout, allNativeRows, matcher, fallbackLine, insertAtStart) {
    var hasLine = layout.lines.some(function (line) {
      return matcher(line);
    });
    if (hasLine) {
      return false;
    }
    var defaultLine = buildDefaultSubtotalLayout(allNativeRows).lines.find(matcher);
    if (!defaultLine) {
      defaultLine = sanitizeSubtotalLine(fallbackLine, fallbackLine.id);
    }
    if (!defaultLine) {
      return false;
    }
    layout.lines.push(defaultLine);
    if (layout.order.indexOf(defaultLine.id) < 0) {
      if (insertAtStart) {
        layout.order.unshift(defaultLine.id);
      } else {
        layout.order.push(defaultLine.id);
      }
    }
    return true;
  }

  function prepareSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey) {
    containerNode.classList.add(SUBTOTAL_CONTAINER_CLASS);
    hideStandaloneSubtotalToggleFields(formNode);

    var normalizedCore = enforceCoreSubtotalLineRules(readSubtotalLayoutState(scopeKey, containerKey));
    var layout = normalizedCore.layout;
    var persistNeeded = Boolean(normalizedCore.changed);

    if (stripManagedSubtotalLines(layout)) {
      persistNeeded = true;
    }
    if (dedupeSubtotalLinesBySource(layout)) {
      persistNeeded = true;
    }

    var allNativeRows = collectSubtotalNativeRows(containerNode, true);
    var layoutStateKey = subtotalLayoutEntryKey(scopeKey, containerKey);
    var hasStoredLayout = Object.prototype.hasOwnProperty.call(_state.formLayoutState.subtotalLayouts, layoutStateKey);
    if (!hasStoredLayout && seedSubtotalLayoutFromNativeRows(layout, allNativeRows)) {
      persistNeeded = true;
    }

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          return isUntaxedSubtotalLine(line && line.label, line && line.sourceField, line && line.id);
        },
        {
          id: "amount_untaxed",
          label: "Untaxed Amount",
          sourceField: "amount_untaxed",
          formula: "{field:amount_untaxed}",
          removable: false,
          formulaLocked: true,
        },
        true
      ) || persistNeeded;

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          return isTaxSubtotalLine(line && line.label, line && line.sourceField, line && line.id);
        },
        {
          id: "amount_tax",
          label: "Tax Amount",
          sourceField: "amount_tax",
          formula: "{field:amount_tax}",
          removable: false,
          formulaLocked: true,
          lineType: "tax",
          sign: "positive",
        },
        false
      ) || persistNeeded;

    persistNeeded =
      ensureRequiredSubtotalLine(
        layout,
        allNativeRows,
        function (line) {
          var fieldKey = normalizeKey((line && line.sourceField) || "");
          var labelKey = normalizeSubtotalLabel(line && line.label);
          return fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total";
        },
        {
          id: "amount_total",
          label: "Total",
          sourceField: "amount_total",
          formula: "{field:amount_total}",
          removable: false,
          formulaLocked: true,
        },
        false
      ) || persistNeeded;

    persistPreparedSubtotalLayout(scopeKey, containerKey, layout, persistNeeded);
    return {
      layout: layout,
      allNativeRows: allNativeRows,
    };
  }

  function syncNativeSubtotalRowsForRender(allNativeRows, layout) {
    var managedSourceFields = new Set();
    layout.lines.forEach(function (line) {
      var sourceField = normalizeSubtotalSourceField(line && line.sourceField ? line.sourceField : "");
      var sourceKey = normalizeKey(sourceField || "");
      if (sourceKey) {
        managedSourceFields.add(sourceKey);
      }
      var toggleMeta = subtotalToggleMetaForSource(sourceField);
      var toggleKey = normalizeKey(toggleMeta && toggleMeta.toggleField ? toggleMeta.toggleField : "");
      if (toggleKey) {
        managedSourceFields.add(toggleKey);
      }
    });

    allNativeRows.forEach(function (row) {
      var rowLabel = extractSubtotalRowLabelText(row);
      var rowSource = deriveSubtotalSourceField(row, rowLabel);
      var rowSourceKey = normalizeKey(rowSource || "");
      var rowLabelKey = normalizeSubtotalLabel(rowLabel);
      var rowHasCheckbox = Boolean(row.querySelector("input[type='checkbox']"));
      var isToggleProxyRow =
        rowHasCheckbox &&
        SUBTOTAL_TOGGLE_FIELDS.indexOf(rowSource || "") >= 0;
      var hideRow = Boolean(rowSourceKey && managedSourceFields.has(rowSourceKey) && !isCoreSubtotalLine(rowLabel, rowSource));
      if (isToggleProxyRow) {
        hideRow = true;
      }
      if (isUntaxedSubtotalLine(rowLabel, rowSource) || isTaxSubtotalLine(rowLabel, rowSource)) {
        hideRow = true;
      }
      if (rowSourceKey === "amount_total" || rowLabelKey === "total" || rowLabelKey === "grand_total") {
        hideRow = true;
      }
      row.classList.toggle(SUBTOTAL_NATIVE_HIDDEN_CLASS, hideRow);
    });
  }

  function ensureSubtotalRenderWrap(containerNode, scopeKey, containerKey) {
    var wrap = containerNode.querySelector(":scope > ." + SUBTOTAL_LINES_WRAP_CLASS);
    if (!(wrap instanceof HTMLElement)) {
      wrap = document.createElement("div");
      wrap.className = SUBTOTAL_LINES_WRAP_CLASS;
    }
    var insertionAnchor = findSubtotalWrapInsertionAnchor(containerNode);
    if (insertionAnchor instanceof HTMLElement && insertionAnchor !== wrap) {
      containerNode.insertBefore(wrap, insertionAnchor);
    } else if (!(wrap.parentElement instanceof HTMLElement)) {
      containerNode.insertBefore(wrap, containerNode.firstChild);
    }
    wrap.dataset.libSubtotalScope = scopeKey;
    wrap.dataset.libSubtotalKey = containerKey;
    return wrap;
  }

  function updateSubtotalRenderChrome(containerNode, editMode) {
    containerNode.classList.toggle(SUBTOTAL_EDIT_MODE_CLASS, editMode);
    var subtotalTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_CONFIG_TRIGGER_CLASS);
    if (subtotalTrigger instanceof HTMLElement) {
      subtotalTrigger.classList.toggle(SUBTOTAL_CONFIG_ACTIVE_CLASS, editMode);
      if (editMode) {
        applyCheckTriggerIcon(subtotalTrigger, "Save subtotal changes");
      } else {
        applyPencilTriggerIcon(subtotalTrigger, "Edit subtotal");
      }
    }
    var restoreTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_RESTORE_TRIGGER_CLASS);
    if (restoreTrigger instanceof HTMLElement) {
      restoreTrigger.hidden = !editMode;
    }
  }

  function buildOrderedSubtotalRenderContext(formNode, containerNode, scopeKey, containerKey, layout, allNativeRows) {
    var lineById = new Map();
    var lineByIdLookup = {};
    layout.lines.forEach(function (line) {
      lineById.set(line.id, line);
      lineByIdLookup[cleanText((line && line.id) || "").toLowerCase()] = line;
    });

    var orderedLines = [];
    layout.order.forEach(function (lineId) {
      if (lineById.has(lineId)) {
        var orderedLine = lineById.get(lineId);
        orderedLines.push(orderedLine);
        lineById.delete(lineId);
      }
    });
    layout.lines.forEach(function (line) {
      if (lineById.has(line.id)) {
        orderedLines.push(line);
        lineById.delete(line.id);
      }
    });
    var visibleOrderedLines = orderedLines.filter(function (line) {
      var toggleMeta = subtotalToggleMetaForLine(line);
      if (!(toggleMeta && toggleMeta.toggleField)) {
        return true;
      }
      return readFieldBooleanValue(formNode, toggleMeta.toggleField, true);
    });

    var nativeFieldValues = buildSubtotalNativeFieldValueIndex(allNativeRows);
    var lineIds = orderedLines
      .map(function (line) {
        return cleanText((line && line.id) || "").toLowerCase();
      })
      .filter(Boolean);
    var runningValues = {};
    var invalidFormulaCount = 0;

    orderedLines.forEach(function (line) {
      if (subtotalLineType(line) === "total") {
        return;
      }
      var formulaCheck = validateSubtotalFormula(line.formula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""), lineIds);
      if (!formulaCheck.valid) {
        invalidFormulaCount += 1;
      }
      runningValues[cleanText(line.id || "").toLowerCase()] = formulaCheck.valid
        ? resolveFormulaValue(formNode, line, runningValues, nativeFieldValues, lineByIdLookup)
        : 0;
    });
    orderedLines.forEach(function (line) {
      if (subtotalLineType(line) !== "total") {
        return;
      }
      var formulaCheck = validateSubtotalFormula(line.formula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""), lineIds);
      if (!formulaCheck.valid) {
        invalidFormulaCount += 1;
      }
      runningValues[cleanText(line.id || "").toLowerCase()] = formulaCheck.valid
        ? resolveFormulaValue(formNode, line, runningValues, nativeFieldValues, lineByIdLookup)
        : 0;
    });

    var subtotalErrorIcon = containerNode.querySelector(":scope > ." + SUBTOTAL_ERROR_ICON_CLASS);
    if (subtotalErrorIcon instanceof HTMLElement) {
      var editMode = Boolean(_state.subtotalEditModes[subtotalEditStateKey(scopeKey, containerKey)]);
      subtotalErrorIcon.hidden = !editMode || invalidFormulaCount < 1;
      subtotalErrorIcon.title = invalidFormulaCount > 0 ? "Invalid formulas detected. Fix formulas or restore defaults." : "";
    }

    return {
      orderedLines: orderedLines,
      visibleOrderedLines: visibleOrderedLines,
      runningValues: runningValues,
    };
  }

  subtotalsRuntime.prepareSubtotalLayoutForRender = prepareSubtotalLayoutForRender;
  subtotalsRuntime.syncNativeSubtotalRowsForRender = syncNativeSubtotalRowsForRender;
  subtotalsRuntime.ensureSubtotalRenderWrap = ensureSubtotalRenderWrap;
  subtotalsRuntime.updateSubtotalRenderChrome = updateSubtotalRenderChrome;
  subtotalsRuntime.buildOrderedSubtotalRenderContext = buildOrderedSubtotalRenderContext;
  v2.dedupeSubtotalLinesBySource = dedupeSubtotalLinesBySource;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
