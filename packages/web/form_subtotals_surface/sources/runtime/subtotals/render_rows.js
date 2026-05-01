(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};
  var subtotalsRuntime = v2.subtotals_runtime;

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/render_rows.js

  function mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, mutator) {
    var nextLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
    mutator(nextLayout);
    writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
    renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
  }

  function createSubtotalTextInput(className, value, placeholder, onChange) {
    var input = document.createElement("input");
    input.type = "text";
    input.className = className;
    input.value = value;
    input.placeholder = placeholder;
    input.addEventListener("change", onChange);
    return input;
  }

  function createSubtotalSelect(className, currentValue, options, disabled, title, onChange) {
    var selectNode = document.createElement("select");
    selectNode.className = className;
    options.forEach(function (optMeta) {
      var opt = document.createElement("option");
      opt.value = optMeta.value;
      opt.textContent = optMeta.label;
      selectNode.appendChild(opt);
    });
    selectNode.value = currentValue;
    selectNode.disabled = Boolean(disabled);
    selectNode.title = title || "";
    selectNode.addEventListener("change", onChange);
    return selectNode;
  }

  function bindSubtotalRowDragHandlers(row, dragHandle, containerNode, formNode, scopeKey, containerKey, lineId) {
    dragHandle.addEventListener("dragstart", function (event) {
      event.stopPropagation();
      _state.subtotalDragState.sourceKey = lineId;
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", lineId);
        } catch (_err) {
          // Some browsers block setData for restricted mime-types.
        }
      }
      row.classList.add(SUBTOTAL_LINE_DRAGGING_CLASS);
    });
    dragHandle.addEventListener("dragend", function () {
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      row.classList.remove(SUBTOTAL_LINE_DRAGGING_CLASS);
      clearSubtotalDropMarkers(containerNode);
    });
    row.addEventListener("dragover", function (event) {
      if (!_state.subtotalDragState.sourceKey || _state.subtotalDragState.sourceKey === lineId) {
        return;
      }
      event.preventDefault();
      var rect = row.getBoundingClientRect();
      _state.subtotalDragState.targetKey = lineId;
      _state.subtotalDragState.dropBefore = event.clientY <= rect.top + rect.height / 2;
      clearSubtotalDropMarkers(containerNode);
      row.classList.add(_state.subtotalDragState.dropBefore ? SUBTOTAL_LINE_DROP_BEFORE_CLASS : SUBTOTAL_LINE_DROP_AFTER_CLASS);
    });
    row.addEventListener("drop", function (event) {
      if (!_state.subtotalDragState.sourceKey || !_state.subtotalDragState.targetKey) {
        return;
      }
      event.preventDefault();
      var nextLayout = moveSubtotalLine(
        readSubtotalLayoutState(scopeKey, containerKey),
        _state.subtotalDragState.sourceKey,
        _state.subtotalDragState.targetKey,
        _state.subtotalDragState.dropBefore
      );
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      clearSubtotalDropMarkers(containerNode);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
  }

  function buildSubtotalEditRow(containerNode, formNode, scopeKey, containerKey, line, valueAmount) {
    var row = document.createElement("div");
    row.className = SUBTOTAL_LINE_ROW_CLASS;
    row.dataset.libSubtotalLineId = line.id;
    row.dataset.libSubtotalScope = scopeKey;
    row.dataset.libSubtotalKey = containerKey;
    row.setAttribute("draggable", "false");

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "o_lib_subtotal_line_remove";
    removeBtn.textContent = "-";
    removeBtn.disabled = line.removable === false;
    removeBtn.title = "Remove line";
    removeBtn.addEventListener("click", function () {
      if (line.removable === false || !window.confirm("Remove this line?")) {
        return;
      }
      mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
        nextLayout.lines = nextLayout.lines.filter(function (existing) {
          return existing.id !== line.id;
        });
        nextLayout.order = nextLayout.order.filter(function (lineId) {
          return lineId !== line.id;
        });
      });
    });
    row.appendChild(removeBtn);

    var insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = SUBTOTAL_INSERT_LINE_CLASS;
    insertBtn.textContent = "+";
    insertBtn.title = "Add line above";
    insertBtn.addEventListener("click", function () {
      var nextLayout = insertCustomSubtotalLine(readSubtotalLayoutState(scopeKey, containerKey), line.id);
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
    row.appendChild(insertBtn);

    var dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "o_lib_subtotal_line_drag";
    dragHandle.textContent = "::";
    dragHandle.setAttribute("draggable", "true");
    dragHandle.title = "Drag line";
    row.appendChild(dragHandle);

    row.appendChild(
      createSubtotalTextInput(SUBTOTAL_LINE_LABEL_CLASS, line.label || "", "Label", function (event) {
        mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
          nextLayout.lines.forEach(function (existing) {
            if (existing.id === line.id) {
              existing.label = cleanText(event.target.value) || existing.label;
            }
          });
        });
      })
    );

    var currentLineType = subtotalLineType(line);
    var isCoreLineType = isBackendManagedSubtotalLine(line);
    var nextTypeValue = ["charge", "tax", "special"].indexOf(currentLineType) < 0
      ? (currentLineType === "base" || currentLineType === "total" ? currentLineType : "special")
      : currentLineType;
    var autoManagedFormula = isCoreLineType || line.formulaLocked === true;
    if (autoManagedFormula) {
      var formulaAuto = document.createElement("span");
      formulaAuto.className = "o_lib_subtotal_line_formula_auto";
      formulaAuto.textContent = "Auto";
      formulaAuto.title = "Calculated automatically";
      row.appendChild(formulaAuto);
    } else {
      var formulaInput = createSubtotalTextInput("o_lib_subtotal_line_formula", line.formula || "", "{subtotal}*0.15", function () {
        var candidateFormula = cleanText(formulaInput.value || "");
        var baselineLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
        var availableIds = baselineLayout.lines
          .map(function (existing) {
            return cleanText((existing && existing.id) || "").toLowerCase();
          })
          .filter(Boolean);
        var validation = validateSubtotalFormula(
          candidateFormula || (line.sourceField ? "{field:" + line.sourceField + "}" : ""),
          availableIds
        );
        if (!validation.valid) {
          formulaInput.classList.add("o_lib_subtotal_formula_invalid");
          formulaInput.title = validation.message;
          formulaInput.value = line.formula || "";
          return;
        }
        mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
          nextLayout.lines.forEach(function (existing) {
            if (existing.id === line.id) {
              existing.formula = candidateFormula || existing.formula;
            }
          });
        });
      });
      formulaInput.addEventListener("input", function () {
        formulaInput.classList.remove("o_lib_subtotal_formula_invalid");
        formulaInput.title = "";
      });
      row.appendChild(formulaInput);
    }

    row.appendChild(
      createSubtotalSelect(
        "o_lib_subtotal_line_type",
        nextTypeValue,
        [
          { value: "base", label: "Base" },
          { value: "total", label: "Total" },
          { value: "charge", label: "Charge" },
          { value: "tax", label: "Tax" },
          { value: "special", label: "Special" },
        ],
        isCoreLineType,
        isCoreLineType ? "Type is fixed for this line." : "Type",
        function (event) {
          if (isCoreLineType) {
            return;
          }
          var nextType = cleanText(event.target.value || "special").toLowerCase();
          if (nextType === "base" || nextType === "total") {
            nextType = "special";
            event.target.value = nextType;
          }
          mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
            nextLayout.lines.forEach(function (existing) {
              if (existing.id === line.id) {
                existing.lineType = nextType;
              }
            });
          });
        }
      )
    );
    row.appendChild(
      createSubtotalSelect(
        "o_lib_subtotal_line_sign",
        normalizeSubtotalLineSign(line.sign),
        [
          { value: "positive", label: "+" },
          { value: "negative", label: "-" },
        ],
        isCoreLineType,
        isCoreLineType ? "Sign is fixed for this line." : "Sign",
        function (event) {
          if (isCoreLineType) {
            return;
          }
          mutateSubtotalLayoutForRender(containerNode, formNode, scopeKey, containerKey, function (nextLayout) {
            nextLayout.lines.forEach(function (existing) {
              if (existing.id === line.id) {
                existing.sign = normalizeSubtotalLineSign(event.target.value);
              }
            });
          });
        }
      )
    );

    var preview = document.createElement("span");
    preview.className = SUBTOTAL_LINE_VALUE_CLASS;
    preview.textContent = formatSubtotalValue(formNode, valueAmount);
    row.appendChild(preview);

    bindSubtotalRowDragHandlers(row, dragHandle, containerNode, formNode, scopeKey, containerKey, line.id);
    return row;
  }

  function buildSubtotalDisplayRow(formNode, line, valueAmount, scopeKey, containerKey) {
    var row = document.createElement("div");
    row.className = SUBTOTAL_LINE_ROW_CLASS + " o_lib_subtotal_line_plain";
    row.dataset.libSubtotalLineId = line.id;
    row.dataset.libSubtotalScope = scopeKey;
    row.dataset.libSubtotalKey = containerKey;

    var labelWrap = document.createElement("label");
    labelWrap.className = "o_lib_subtotal_line_label_wrap";
    var label = document.createElement("span");
    label.className = SUBTOTAL_LINE_LABEL_CLASS;
    label.textContent = line.label || "Line";
    labelWrap.appendChild(label);
    row.appendChild(labelWrap);

    var value = document.createElement("span");
    value.className = SUBTOTAL_LINE_VALUE_CLASS;
    value.textContent = formatSubtotalValue(formNode, valueAmount);
    row.appendChild(value);
    return row;
  }

  function bindSubtotalWrapDropTargets(wrap, containerNode, formNode, scopeKey, containerKey, editMode) {
    if (!editMode) {
      wrap.ondragover = null;
      wrap.ondrop = null;
      return;
    }
    wrap.ondragover = function (event) {
      if (!_state.subtotalDragState.sourceKey) {
        return;
      }
      var targetRow = event.target instanceof HTMLElement ? event.target.closest("." + SUBTOTAL_LINE_ROW_CLASS) : null;
      if (targetRow && wrap.contains(targetRow)) {
        return;
      }
      var rows = wrap.querySelectorAll("." + SUBTOTAL_LINE_ROW_CLASS);
      if (!rows.length) {
        return;
      }
      event.preventDefault();
      var lastRow = rows[rows.length - 1];
      var lastLineId = cleanText(lastRow.dataset.libSubtotalLineId || "");
      if (!lastLineId || lastLineId === _state.subtotalDragState.sourceKey) {
        return;
      }
      clearSubtotalDropMarkers(containerNode);
      _state.subtotalDragState.targetKey = lastLineId;
      _state.subtotalDragState.dropBefore = false;
      lastRow.classList.add(SUBTOTAL_LINE_DROP_AFTER_CLASS);
    };
    wrap.ondrop = function (event) {
      if (!_state.subtotalDragState.sourceKey || !_state.subtotalDragState.targetKey) {
        return;
      }
      var targetRow = event.target instanceof HTMLElement ? event.target.closest("." + SUBTOTAL_LINE_ROW_CLASS) : null;
      if (targetRow && wrap.contains(targetRow)) {
        return;
      }
      event.preventDefault();
      var nextLayout = moveSubtotalLine(
        readSubtotalLayoutState(scopeKey, containerKey),
        _state.subtotalDragState.sourceKey,
        _state.subtotalDragState.targetKey,
        _state.subtotalDragState.dropBefore
      );
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      _state.subtotalDragState.sourceKey = "";
      _state.subtotalDragState.targetKey = "";
      _state.subtotalDragState.dropBefore = true;
      clearSubtotalDropMarkers(containerNode);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    };
  }

  function appendSubtotalEditActions(wrap, containerNode, formNode, scopeKey, containerKey) {
    var actions = document.createElement("div");
    actions.className = SUBTOTAL_EDIT_ACTIONS_CLASS;
    var addLineButton = document.createElement("button");
    addLineButton.type = "button";
    addLineButton.className = SUBTOTAL_ADD_LINE_CLASS;
    addLineButton.textContent = "Add line";
    addLineButton.addEventListener("click", function () {
      var nextLayout = insertCustomSubtotalLine(readSubtotalLayoutState(scopeKey, containerKey), "");
      writeSubtotalLayoutState(scopeKey, containerKey, nextLayout);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
    });
    actions.appendChild(addLineButton);
    wrap.appendChild(actions);
  }

  subtotalsRuntime.buildSubtotalEditRow = buildSubtotalEditRow;
  subtotalsRuntime.buildSubtotalDisplayRow = buildSubtotalDisplayRow;
  subtotalsRuntime.bindSubtotalWrapDropTargets = bindSubtotalWrapDropTargets;
  subtotalsRuntime.appendSubtotalEditActions = appendSubtotalEditActions;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
