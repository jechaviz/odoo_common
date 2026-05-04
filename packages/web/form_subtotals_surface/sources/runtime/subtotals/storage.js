(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/storage.js

  function readSubtotalLayoutState(scopeKey, containerKey) {
    var key = subtotalLayoutEntryKey(scopeKey, containerKey);
    var raw = _state.formLayoutState.subtotalLayouts[key];
    if (!raw || typeof raw !== "object") {
      return { lines: [], order: [] };
    }
    var lines = [];
    if (Array.isArray(raw.lines)) {
      raw.lines.forEach(function (line, index) {
        var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
        if (cleaned) {
          lines.push(cleaned);
        }
      });
    }
    var order = Array.isArray(raw.order)
      ? dedupeKeys(
        raw.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    return {
      lines: lines,
      order: order,
    };
  }

  v2.readSubtotalLayoutState = readSubtotalLayoutState;

  function writeSubtotalLayoutState(scopeKey, containerKey, layout) {
    var key = subtotalLayoutEntryKey(scopeKey, containerKey);
    var lines = [];
    if (layout && Array.isArray(layout.lines)) {
      layout.lines.forEach(function (line, index) {
        var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
        if (cleaned) {
          lines.push(cleaned);
        }
      });
    }
    var order = Array.isArray(layout && layout.order)
      ? dedupeKeys(
        layout.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    _state.formLayoutState.subtotalLayouts[key] = {
      lines: lines,
      order: order,
    };
  }

  v2.writeSubtotalLayoutState = writeSubtotalLayoutState;

  function subtotalEditStateKey(scopeKey, containerKey) {
    return scopeKey + "|" + containerKey;
  }

  v2.subtotalEditStateKey = subtotalEditStateKey;

  function validateSubtotalLayoutForSave(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var lineIds = normalized.lines
      .map(function (line) {
        return cleanText((line && line.id) || "").toLowerCase();
      })
      .filter(Boolean);
    for (var index = 0; index < normalized.lines.length; index += 1) {
      var line = normalized.lines[index];
      var formulaSeed = line && line.formula ? line.formula : line && line.sourceField ? "{field:" + line.sourceField + "}" : "";
      var check = validateSubtotalFormula(formulaSeed, lineIds);
      if (!check.valid) {
        return {
          valid: false,
          reason: check.reason || "invalid_formula",
        };
      }
    }
    return { valid: true };
  }

  v2.validateSubtotalLayoutForSave = validateSubtotalLayoutForSave;

  function collectActiveSubtotalEditContexts() {
    var contexts = [];
    document.querySelectorAll("." + SUBTOTAL_CONTAINER_CLASS).forEach(function (containerNode) {
      if (!(containerNode instanceof HTMLElement)) {
        return;
      }
      var scopeKey = cleanText(containerNode.dataset.libSubtotalScope || "");
      var containerKey = cleanText(containerNode.dataset.libSubtotalKey || "");
      if (!scopeKey || !containerKey) {
        return;
      }
      var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
      if (!_state.subtotalEditModes[editStateKey]) {
        return;
      }
      var formNode = containerNode.closest(FORM_ROOT_SELECTOR);
      if (!(formNode instanceof HTMLElement)) {
        return;
      }
      contexts.push({
        formNode: formNode,
        containerNode: containerNode,
        scopeKey: scopeKey,
        containerKey: containerKey,
        editStateKey: editStateKey,
      });
    });
    return contexts;
  }

  v2.collectActiveSubtotalEditContexts = collectActiveSubtotalEditContexts;

  function cloneSubtotalLayout(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    return {
      lines: normalized.lines.map(function (line) {
        return {
          id: line.id,
          label: line.label,
          formula: line.formula,
          sourceField: line.sourceField,
          removable: line.removable !== false,
          formulaLocked: line.formulaLocked === true,
          lineType: line.lineType,
          sign: line.sign,
        };
      }),
      order: normalized.order.slice(),
    };
  }

  v2.cloneSubtotalLayout = cloneSubtotalLayout;

  function subtotalLayoutSignature(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    return JSON.stringify({
      lines: normalized.lines.map(function (line) {
        return {
          id: line.id,
          label: line.label,
          formula: line.formula,
          sourceField: line.sourceField,
          removable: line.removable !== false,
          formulaLocked: line.formulaLocked === true,
          lineType: line.lineType,
          sign: line.sign,
        };
      }),
      order: normalized.order.slice(),
    });
  }

  v2.subtotalLayoutSignature = subtotalLayoutSignature;

  function findSubtotalContainers(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return [];
    }
    var containers = Array.prototype.slice.call(formNode.querySelectorAll("[data-lib-subtotal-container='1']"));
    return containers.filter(function (container) {
      return container instanceof HTMLElement;
    });
  }

  v2.findSubtotalContainers = findSubtotalContainers;

  function syncSubtotalRecordBinding(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return false;
    }
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var recordKey = modelName && recordId ? String(modelName) + "|" + String(recordId) : "";
    var previousKey = String(formNode.dataset.libSubtotalRecordKey || "");
    if (previousKey && previousKey !== recordKey) {
      delete _state.subtotalToggleStateSignatureByRecord[previousKey];
    }
    if (recordKey && previousKey !== recordKey) {
      formNode.dataset.libSubtotalRecordKey = recordKey;
      delete _state.subtotalToggleStateSignatureByRecord[recordKey];
      return true;
    }
    if (!recordKey && previousKey) {
      formNode.dataset.libSubtotalRecordKey = "";
      return true;
    }
    return false;
  }

  v2.syncSubtotalRecordBinding = syncSubtotalRecordBinding;

  async function writeBooleanFieldToBackend(formNode, fieldName, checked) {
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    if (!modelName || !recordId || !fieldName) {
      return false;
    }
    var values = {};
    values[String(fieldName)] = Boolean(checked);
    await callKw(modelName, "write", [[recordId], values], { context: rpcUserContext() });
    return true;
  }

  v2.writeBooleanFieldToBackend = writeBooleanFieldToBackend;

  async function syncBooleanFieldWidgets(formNode, fieldName, checked) {
    var nextChecked = Boolean(checked);
    if (!readFormRecordId(formNode)) {
      return false;
    }
    applyBooleanFieldWidgets(formNode, fieldName, nextChecked, false);
    writeBooleanFieldCache(formNode, fieldName, nextChecked);
    try {
      var persisted = await writeBooleanFieldToBackend(formNode, fieldName, nextChecked);
      if (!persisted) {
        return false;
      }
      await refreshSubtotalToggleStateFromBackend(formNode, true);
      window.setTimeout(function () {
        refreshSubtotalToggleStateFromBackend(formNode, true);
      }, 220);
      return true;
    } catch (_err) {
      return false;
    }
  }

  v2.syncBooleanFieldWidgets = syncBooleanFieldWidgets;

  function subtotalToggleMetaForSource(sourceField) {
    var normalized = normalizeSubtotalSourceField(sourceField || "");
    if (!normalized) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, normalized)) {
      return SUBTOTAL_TOGGLE_BY_SOURCE[normalized];
    }
    return null;
  }

  v2.subtotalToggleMetaForSource = subtotalToggleMetaForSource;

  function subtotalToggleMetaForLine(line) {
    if (!(line && typeof line === "object")) {
      return null;
    }
    var sourceField = normalizeSubtotalSourceField(line.sourceField || "");
    if (!sourceField) {
      var formulaMatch = String(line.formula || "").match(/^\{field:([^}]+)\}$/i);
      if (formulaMatch && formulaMatch[1]) {
        sourceField = normalizeSubtotalSourceField(formulaMatch[1]);
      }
    }
    var bySource = subtotalToggleMetaForSource(sourceField);
    if (bySource) {
      return bySource;
    }
    return null;
  }

  v2.subtotalToggleMetaForLine = subtotalToggleMetaForLine;

  function hideStandaloneSubtotalToggleFields(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    formNode.querySelectorAll("[data-lib-subtotal-toggle-proxy='1']").forEach(function (wrapper) {
      if (wrapper instanceof HTMLElement) {
        wrapper.classList.add(SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS);
      }
    });
  }

  v2.hideStandaloneSubtotalToggleFields = hideStandaloneSubtotalToggleFields;

  function formatSubtotalValue(formNode, amount) {
    var currencySymbol = cleanText(formNode && formNode.getAttribute("data-lib-currency-symbol") || "") || "$";
    var numeric = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return currencySymbol + " " + numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  v2.formatSubtotalValue = formatSubtotalValue;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
