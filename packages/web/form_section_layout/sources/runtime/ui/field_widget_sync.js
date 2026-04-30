(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_widget_sync.js

  function applyBooleanFieldWidgets(formNode, fieldName, checked, dispatchEvents) {
    var nodes = findFieldNodes(formNode, fieldName);
    var applied = false;
    var shouldDispatch = Boolean(dispatchEvents);
    var targetValue = Boolean(checked);

    nodes.forEach(function (node) {
      var candidates = [];
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        candidates.push(node);
      } else if (node instanceof HTMLElement) {
        node.querySelectorAll("input[type='checkbox']").forEach(function (checkboxNode) {
          if (checkboxNode instanceof HTMLInputElement) {
            candidates.push(checkboxNode);
          }
        });
      }
      candidates.forEach(function (checkboxNode) {
        if (!(checkboxNode instanceof HTMLInputElement)) {
          return;
        }
        if (checkboxNode.checked !== targetValue) {
          checkboxNode.checked = targetValue;
          applied = true;
        }
        if (shouldDispatch) {
          checkboxNode.dispatchEvent(new Event("input", { bubbles: true }));
          checkboxNode.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
    return applied;
  }

  v2.applyBooleanFieldWidgets = applyBooleanFieldWidgets;

  function findEditableBooleanInput(formNode, fieldName) {
    var nodes = findFieldNodes(formNode, fieldName);
    var fallback = null;
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      var checkbox = null;
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        checkbox = node;
      } else if (node instanceof HTMLElement) {
        checkbox = node.querySelector("input[type='checkbox']");
      }
      if (!(checkbox instanceof HTMLInputElement)) {
        continue;
      }
      if (!checkbox.disabled) {
        return checkbox;
      }
      if (!fallback) {
        fallback = checkbox;
      }
    }
    return fallback;
  }

  v2.findEditableBooleanInput = findEditableBooleanInput;

  function syncBooleanFieldViaNativeForm(formNode, fieldName, checked) {
    var checkbox = findEditableBooleanInput(formNode, fieldName);
    if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) {
      return false;
    }
    var nextChecked = Boolean(checked);
    if (Boolean(checkbox.checked) !== nextChecked) {
      checkbox.click();
    }
    writeBooleanFieldCache(formNode, fieldName, nextChecked);
    window.setTimeout(function () {
      scheduleRefresh();
    }, 120);
    window.setTimeout(function () {
      scheduleRefresh();
    }, 320);
    return true;
  }

  v2.syncBooleanFieldViaNativeForm = syncBooleanFieldViaNativeForm;

  function applyNumericFieldWidgets(formNode, fieldName, numericValue) {
    var nodes = findFieldNodes(formNode, fieldName);
    var applied = false;
    var textValue = String(numericValue);
    nodes.forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        if (String(node.value || "") !== textValue) {
          node.value = textValue;
          applied = true;
        }
      }
      if (node.getAttribute("value") !== textValue) {
        node.setAttribute("value", textValue);
        applied = true;
      }
      var textTargets = [];
      if (node.childElementCount === 0) {
        textTargets.push(node);
      } else {
        node.querySelectorAll(".o_field_monetary, .oe_currency_value, span").forEach(function (childNode) {
          if (childNode instanceof HTMLElement) {
            textTargets.push(childNode);
          }
        });
      }
      textTargets.forEach(function (textNode) {
        if (!(textNode instanceof HTMLElement)) {
          return;
        }
        textNode.dataset.libNumericValue = textValue;
      });
    });
    return applied;
  }

  v2.applyNumericFieldWidgets = applyNumericFieldWidgets;

  async function refreshSubtotalToggleStateFromBackend(formNode, forceRefresh) {
    if (!(formNode instanceof HTMLElement)) {
      return false;
    }
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    if (!modelName || !recordId) {
      return false;
    }
    var recordKey = String(modelName) + "|" + String(recordId);
    if (!forceRefresh && _state.subtotalToggleStateSignatureByRecord[recordKey] === "ready") {
      return false;
    }
    if (_state.subtotalToggleStateLoadByRecord[recordKey]) {
      return _state.subtotalToggleStateLoadByRecord[recordKey];
    }
    var fieldNames = SUBTOTAL_REFRESH_FIELDS.slice();
    _state.subtotalToggleStateLoadByRecord[recordKey] = callKw(modelName, "read", [[recordId], fieldNames], {
      context: rpcUserContext(),
    })
      .then(function (records) {
        var row = Array.isArray(records) && records.length && records[0] && typeof records[0] === "object" ? records[0] : null;
        if (!row) {
          return false;
        }
        _state.subtotalToggleStateSignatureByRecord[recordKey] = "ready";
        var changed = false;
        fieldNames.forEach(function (fieldName) {
          if (!Object.prototype.hasOwnProperty.call(row, fieldName)) {
            return;
          }
          if (SUBTOTAL_TOGGLE_FIELDS.indexOf(fieldName) >= 0) {
            var nextBooleanValue = parseBooleanFieldValue(row[fieldName], true);
            var cachedBooleanValue = readBooleanFieldCache(formNode, fieldName);
            if (cachedBooleanValue === null || Boolean(cachedBooleanValue) !== nextBooleanValue) {
              changed = true;
            }
            writeBooleanFieldCache(formNode, fieldName, nextBooleanValue);
            if (applyBooleanFieldWidgets(formNode, fieldName, nextBooleanValue, false)) {
              changed = true;
            }
            return;
          }
          var nextNumericValue = Number(row[fieldName]);
          if (!Number.isFinite(nextNumericValue)) {
            nextNumericValue = 0;
          }
          var cachedNumericValue = readNumericFieldCache(formNode, fieldName);
          if (cachedNumericValue === null || Number(cachedNumericValue) !== nextNumericValue) {
            changed = true;
          }
          writeNumericFieldCache(formNode, fieldName, nextNumericValue);
          if (applyNumericFieldWidgets(formNode, fieldName, nextNumericValue)) {
            changed = true;
          }
        });
        if (changed) {
          scheduleRefresh();
        }
        return changed;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        delete _state.subtotalToggleStateLoadByRecord[recordKey];
      });
    return _state.subtotalToggleStateLoadByRecord[recordKey];
  }

  v2.refreshSubtotalToggleStateFromBackend = refreshSubtotalToggleStateFromBackend;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
