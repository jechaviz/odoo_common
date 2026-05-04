(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_values.js

  function parseNumericText(rawValue) {
    var value = String(rawValue || "").trim();
    if (!value) {
      return 0;
    }
    var cleaned = value.replace(/[^0-9,.\-]/g, "");
    if (!cleaned) {
      return 0;
    }
    if (cleaned.indexOf(",") >= 0 && cleaned.indexOf(".") >= 0) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.indexOf(",") >= 0) {
      cleaned = cleaned.replace(/,/g, ".");
    }
    var parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  v2.parseNumericText = parseNumericText;

  function readFieldNumericValue(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return 0;
    }
    if (SUBTOTAL_REFRESH_FIELDS.indexOf(String(fieldName || "")) >= 0) {
      var preferredCachedNumber = readNumericFieldCache(formNode, fieldName);
      if (preferredCachedNumber !== null) {
        return Number(preferredCachedNumber);
      }
    }
    var escaped = String(fieldName).replace(/'/g, "\\'");
    var selector = "[name='" + escaped + "'], [data-name='" + escaped + "']";
    var nodes = Array.prototype.slice.call(formNode.querySelectorAll(selector));
    var visibleZero = null;
    var anyZero = null;
    var anyNonZero = null;

    function isVisible(node) {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      if (node.classList.contains(SUBTOTAL_NATIVE_HIDDEN_CLASS)) {
        return false;
      }
      var style = window.getComputedStyle(node);
      if (!style || style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      return true;
    }

    function collectValueCandidates(node) {
      var values = [];
      if (node instanceof HTMLInputElement) {
        var inputType = cleanText(node.type || "").toLowerCase();
        if (inputType !== "hidden") {
          values.push(parseNumericText(node.value));
        }
      } else if (node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        values.push(parseNumericText(node.value));
      }
      values.push(parseNumericText(node.getAttribute("value") || ""));
      values.push(parseNumericText(node.textContent || ""));
      return values;
    }

    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      var visible = isVisible(node);
      var candidates = collectValueCandidates(node);
      for (var valueIndex = 0; valueIndex < candidates.length; valueIndex += 1) {
        var numericValue = Number(candidates[valueIndex] || 0);
        if (!Number.isFinite(numericValue)) {
          continue;
        }
        if (numericValue !== 0) {
          if (visible) {
            return numericValue;
          }
          if (anyNonZero === null) {
            anyNonZero = numericValue;
          }
          continue;
        }
        if (visible && visibleZero === null) {
          visibleZero = 0;
        }
        if (anyZero === null) {
          anyZero = 0;
        }
      }
    }

    if (anyNonZero !== null) {
      return anyNonZero;
    }
    if (visibleZero !== null) {
      return visibleZero;
    }
    if (anyZero !== null) {
      return anyZero;
    }
    return 0;
  }

  v2.readFieldNumericValue = readFieldNumericValue;

  function parseBooleanFieldValue(value, defaultValue) {
    if (value === null || value === undefined || value === "") {
      return Boolean(defaultValue);
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    var normalized = cleanText(value).toLowerCase();
    if (!normalized) {
      return Boolean(defaultValue);
    }
    if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
      return false;
    }
    return Boolean(defaultValue);
  }

  v2.parseBooleanFieldValue = parseBooleanFieldValue;

  function findFieldNodes(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return [];
    }
    var escaped = String(fieldName).replace(/'/g, "\\'");
    var selector = "[name='" + escaped + "'], [data-name='" + escaped + "']";
    return Array.prototype.slice.call(formNode.querySelectorAll(selector)).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  v2.findFieldNodes = findFieldNodes;

  function booleanFieldCacheKey(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return "";
    }
    var normalizedFieldName = String(fieldName || "");
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var requiresRecordBinding =
      SUBTOTAL_TOGGLE_FIELDS.indexOf(normalizedFieldName) >= 0 ||
      SUBTOTAL_REFRESH_FIELDS.indexOf(normalizedFieldName) >= 0;
    if (requiresRecordBinding && !(modelName && recordId)) {
      return "";
    }
    if (modelName && recordId) {
      return [modelName, String(recordId), normalizedFieldName].join("|");
    }
    var scopeKey = computeScopeKey(formNode);
    if (recordId && (modelName || scopeKey)) {
      return [modelName || scopeKey, String(recordId), normalizedFieldName].join("|");
    }
    if (scopeKey) {
      return [scopeKey, normalizedFieldName].join("|");
    }
    return "";
  }

  v2.booleanFieldCacheKey = booleanFieldCacheKey;

  function readBooleanFieldCache(formNode, fieldName) {
    var cacheKey = booleanFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(_state.booleanFieldStateCache, cacheKey)) {
      return null;
    }
    return Boolean(_state.booleanFieldStateCache[cacheKey]);
  }

  v2.readBooleanFieldCache = readBooleanFieldCache;

  function writeBooleanFieldCache(formNode, fieldName, value) {
    var cacheKey = booleanFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return;
    }
    _state.booleanFieldStateCache[cacheKey] = Boolean(value);
  }

  v2.writeBooleanFieldCache = writeBooleanFieldCache;

  function numericFieldCacheKey(formNode, fieldName) {
    if (!(formNode instanceof HTMLElement) || !fieldName) {
      return "";
    }
    var normalizedFieldName = String(fieldName || "");
    var modelName = computeModelName(formNode);
    var recordId = readFormRecordId(formNode);
    var requiresRecordBinding =
      SUBTOTAL_REFRESH_FIELDS.indexOf(normalizedFieldName) >= 0 ||
      SUBTOTAL_TOGGLE_FIELDS.indexOf(normalizedFieldName) >= 0;
    if (requiresRecordBinding && !(modelName && recordId)) {
      return "";
    }
    if (modelName && recordId) {
      return [modelName, String(recordId), normalizedFieldName].join("|");
    }
    var scopeKey = computeScopeKey(formNode);
    if (recordId && (modelName || scopeKey)) {
      return [modelName || scopeKey, String(recordId), normalizedFieldName].join("|");
    }
    if (scopeKey) {
      return [scopeKey, normalizedFieldName].join("|");
    }
    return "";
  }

  v2.numericFieldCacheKey = numericFieldCacheKey;

  function readNumericFieldCache(formNode, fieldName) {
    var cacheKey = numericFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(_state.numericFieldValueCache, cacheKey)) {
      return null;
    }
    var value = Number(_state.numericFieldValueCache[cacheKey]);
    return Number.isFinite(value) ? value : null;
  }

  v2.readNumericFieldCache = readNumericFieldCache;

  function writeNumericFieldCache(formNode, fieldName, value) {
    var cacheKey = numericFieldCacheKey(formNode, fieldName);
    if (!cacheKey) {
      return;
    }
    var numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }
    _state.numericFieldValueCache[cacheKey] = numericValue;
  }

  v2.writeNumericFieldCache = writeNumericFieldCache;

  function readFieldBooleanValue(formNode, fieldName, defaultValue) {
    if (SUBTOTAL_TOGGLE_FIELDS.indexOf(String(fieldName || "")) >= 0) {
      var preferredCacheValue = readBooleanFieldCache(formNode, fieldName);
      if (preferredCacheValue !== null) {
        return Boolean(preferredCacheValue);
      }
    }
    var nodes = findFieldNodes(formNode, fieldName);
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      var checkbox = null;
      if (node instanceof HTMLInputElement && cleanText(node.type).toLowerCase() === "checkbox") {
        checkbox = node;
      } else if (node instanceof HTMLElement) {
        checkbox = node.querySelector("input[type='checkbox']");
      }
      if (checkbox instanceof HTMLInputElement) {
        var checkboxValue = Boolean(checkbox.checked);
        writeBooleanFieldCache(formNode, fieldName, checkboxValue);
        return checkboxValue;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        var parsedInput = parseBooleanFieldValue(node.value, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedInput);
        return parsedInput;
      }
      var attrValue = node.getAttribute("value");
      if (attrValue !== null) {
        var parsedAttr = parseBooleanFieldValue(attrValue, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedAttr);
        return parsedAttr;
      }
      var textValue = cleanText(node.textContent || "");
      if (textValue) {
        var parsedText = parseBooleanFieldValue(textValue, defaultValue);
        writeBooleanFieldCache(formNode, fieldName, parsedText);
        return parsedText;
      }
    }
    var cachedValue = readBooleanFieldCache(formNode, fieldName);
    if (cachedValue !== null) {
      return Boolean(cachedValue);
    }
    return Boolean(defaultValue);
  }

  v2.readFieldBooleanValue = readFieldBooleanValue;

  function normalizeFieldDisplaySpecs(rawSpecs) {
    return (Array.isArray(rawSpecs) ? rawSpecs : []).filter(function (entry) {
      return entry && typeof entry === "object" && !Array.isArray(entry);
    });
  }

  v2.normalizeFieldDisplaySpecs = normalizeFieldDisplaySpecs;

  function resolveFieldDisplayNodes(formNode, spec) {
    if (!(formNode instanceof HTMLElement) || !(spec && typeof spec === "object")) {
      return [];
    }
    if (typeof spec.resolveNodes === "function") {
      var resolvedNodes = spec.resolveNodes(formNode, spec);
      if (resolvedNodes instanceof HTMLElement) {
        return [resolvedNodes];
      }
      return Array.prototype.slice.call(resolvedNodes || []).filter(function (node) {
        return node instanceof HTMLElement;
      });
    }
    var selector = cleanText(spec.selector || "");
    if (selector) {
      return Array.prototype.slice.call(formNode.querySelectorAll(selector)).filter(function (node) {
        return node instanceof HTMLElement;
      });
    }
    return findFieldNodes(formNode, cleanText(spec.fieldName || ""));
  }

  v2.resolveFieldDisplayNodes = resolveFieldDisplayNodes;

  function normalizeFieldDisplayValue(rawValue, spec, fieldNode) {
    var value = cleanText(rawValue || "");
    if (typeof spec.normalize === "function") {
      return cleanText(spec.normalize(value, fieldNode, spec) || "");
    }
    return value;
  }

  v2.normalizeFieldDisplayValue = normalizeFieldDisplayValue;

  function fieldDisplayBindingFlag(spec, index) {
    return "data-lib-field-display-normalizer-bound-" + (normalizeKey(spec.key || spec.fieldName || spec.selector || "") || "entry_" + String(index));
  }

  function normalizeFieldDisplayValues(formNode, rawSpecs) {
    if (!(formNode instanceof HTMLElement)) {
      return 0;
    }
    var specs = normalizeFieldDisplaySpecs(rawSpecs);
    var normalizedCount = 0;
    specs.forEach(function (spec, index) {
      var fieldNodes = resolveFieldDisplayNodes(formNode, spec);
      fieldNodes.forEach(function (fieldNode) {
        if (!(fieldNode instanceof HTMLElement)) {
          return;
        }
        var activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          fieldNode.contains(activeElement) &&
          (activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement.isContentEditable === true)
        ) {
          return;
        }
        var bindingFlag = fieldDisplayBindingFlag(spec, index);
        if (fieldNode.getAttribute(bindingFlag) !== "1") {
          fieldNode.setAttribute(bindingFlag, "1");
          var scheduleNormalize = function () {
            window.setTimeout(function () {
              normalizeFieldDisplayValues(formNode, specs);
            }, 0);
          };
          fieldNode.addEventListener("blur", scheduleNormalize, true);
          fieldNode.addEventListener("change", scheduleNormalize, true);
          if (typeof spec.bindObserver === "function") {
            spec.bindObserver(fieldNode, scheduleNormalize, spec);
          } else if (spec.observeMutations === true && typeof MutationObserver === "function") {
            new MutationObserver(scheduleNormalize).observe(fieldNode, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          }
        }
        var passiveDisplayValue = cleanText(fieldNode.textContent || "");
        var normalizedDisplayValue = normalizeFieldDisplayValue(passiveDisplayValue, spec, fieldNode);
        if (normalizedDisplayValue && normalizedDisplayValue !== passiveDisplayValue) {
          fieldNode.textContent = normalizedDisplayValue;
          normalizedCount += 1;
        }
      });
    });
    return normalizedCount;
  }

  v2.normalizeFieldDisplayValues = normalizeFieldDisplayValues;

  function readFormRecordId(formNode) {
    if (!(formNode instanceof HTMLElement)) {
      return 0;
    }
    var parseRecordId = function (rawValue) {
      var parsed = Number(rawValue || 0);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.trunc(parsed);
      }
      return 0;
    };
    var directCandidates = [
      formNode.getAttribute("data-lib-record-id"),
      formNode.dataset.libRecordId,
      formNode.getAttribute("data-res-id"),
      formNode.getAttribute("data-record-id"),
      formNode.dataset.resId,
      formNode.dataset.recordId,
    ];
    for (var index = 0; index < directCandidates.length; index += 1) {
      var parsedDirect = parseRecordId(directCandidates[index]);
      if (parsedDirect > 0) {
        return parsedDirect;
      }
    }

    var idFromField = Number(readFieldNumericValue(formNode, "id") || 0);
    if (Number.isFinite(idFromField) && idFromField > 0) {
      return Math.trunc(idFromField);
    }
    return 0;
  }

  v2.readFormRecordId = readFormRecordId;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
