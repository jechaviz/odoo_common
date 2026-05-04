(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/native_rows.js

  function validateSubtotalFormula(formulaText, availableLineIds) {
    var formula = cleanText(formulaText || "");
    if (!formula) {
      return {
        valid: false,
        message: "Formula is required.",
      };
    }
    var known = new Set(
      (Array.isArray(availableLineIds) ? availableLineIds : []).map(function (value) {
        return cleanText(value || "").toLowerCase();
      })
    );
    var hasTokenError = false;
    var rendered = formula.replace(/\{([^}]+)\}/g, function (_match, token) {
      var key = cleanText(token || "").toLowerCase();
      if (!key) {
        hasTokenError = true;
        return "0";
      }
      if (key === "subtotal" || key === "untaxed" || key === "total" || key === "tax" || key === "taxes") {
        return "1";
      }
      if (key.indexOf("field:") === 0) {
        var fieldName = cleanText(key.slice(6));
        if (!fieldName) {
          hasTokenError = true;
        }
        return "1";
      }
      if (known.has(key)) {
        return "1";
      }
      hasTokenError = true;
      return "0";
    });
    if (hasTokenError) {
      return {
        valid: false,
        message: "Unknown token in formula.",
      };
    }
    if (!/^[0-9+\-*/().\s]+$/.test(rendered)) {
      return {
        valid: false,
        message: "Only numbers and + - * / ( ) are allowed.",
      };
    }
    try {
      var evaluated = Function('"use strict"; return (' + rendered + ");")();
      if (!Number.isFinite(Number(evaluated))) {
        return {
          valid: false,
          message: "Formula did not produce a finite number.",
        };
      }
    } catch (_err) {
      return {
        valid: false,
        message: "Invalid formula syntax.",
      };
    }
    return { valid: true, message: "" };
  }

  v2.validateSubtotalFormula = validateSubtotalFormula;

  function collectSubtotalNativeRows(containerNode, includeHidden) {
    if (!(containerNode instanceof HTMLElement)) {
      return [];
    }
    var includeHiddenRows = Boolean(includeHidden);
    return Array.prototype.slice.call(containerNode.children).filter(function (child) {
      if (!(child instanceof HTMLElement)) {
        return false;
      }
      if (
        child.classList.contains(SUBTOTAL_LINES_WRAP_CLASS) ||
        child.classList.contains(SUBTOTAL_CONFIG_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_RESTORE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_SAVE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_ERROR_ICON_CLASS)
      ) {
        return false;
      }
      if (!includeHiddenRows && child.classList.contains(SUBTOTAL_NATIVE_HIDDEN_CLASS)) {
        return false;
      }
      if (cleanText(child.getAttribute("data-lib-subtotal-seed") || "").toLowerCase() === "1") {
        return true;
      }
      return Boolean(normalizeSubtotalSourceField(child.getAttribute("data-lib-subtotal-source-field") || ""));
    });
  }

  v2.collectSubtotalNativeRows = collectSubtotalNativeRows;

  function findExplicitSubtotalWrapInsertionAnchor(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var selector = cleanText(containerNode.getAttribute("data-lib-subtotal-anchor-selector") || "");
    if (selector) {
      var selectedAnchor = containerNode.querySelector(selector);
      if (selectedAnchor instanceof HTMLElement) {
        return selectedAnchor;
      }
    }
    var markedAnchor = containerNode.querySelector("[data-lib-subtotal-anchor='1']");
    return markedAnchor instanceof HTMLElement ? markedAnchor : null;
  }

  function findSubtotalWrapInsertionAnchor(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    return findExplicitSubtotalWrapInsertionAnchor(containerNode);
  }

  v2.findSubtotalWrapInsertionAnchor = findSubtotalWrapInsertionAnchor;
  v2.findExplicitSubtotalWrapInsertionAnchor = findExplicitSubtotalWrapInsertionAnchor;

  function extractSubtotalRowLabelText(row) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    return cleanText(row.getAttribute("data-lib-subtotal-label") || "");
  }

  v2.extractSubtotalRowLabelText = extractSubtotalRowLabelText;

  function seedSubtotalLayoutFromNativeRows(layout, nativeRows) {
    if (!layout || !Array.isArray(layout.lines) || layout.lines.length || !Array.isArray(nativeRows) || !nativeRows.length) {
      return false;
    }
    var defaults = buildDefaultSubtotalLayout(nativeRows);
    layout.lines = Array.isArray(defaults.lines) ? defaults.lines : [];
    layout.order = Array.isArray(defaults.order) ? defaults.order : [];
    return layout.lines.length > 0;
  }

  v2.seedSubtotalLayoutFromNativeRows = seedSubtotalLayoutFromNativeRows;

  function extractSubtotalRowNumericValue(row) {
    if (!(row instanceof HTMLElement)) {
      return 0;
    }
    var explicitValue = cleanText(row.getAttribute("data-lib-subtotal-value") || "");
    if (explicitValue) {
      return parseNumericText(explicitValue);
    }
    var sourceField = deriveSubtotalSourceField(row, extractSubtotalRowLabelText(row));
    if (!sourceField) {
      return 0;
    }
    var escaped = sourceField.replace(/'/g, "\\'");
    var node = row.querySelector("[name='" + escaped + "'], [data-name='" + escaped + "']");
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
      return parseNumericText(node.value);
    }
    if (node instanceof HTMLElement) {
      return parseNumericText(node.getAttribute("value") || node.textContent || "");
    }
    return 0;
  }

  v2.extractSubtotalRowNumericValue = extractSubtotalRowNumericValue;

  function buildSubtotalNativeFieldValueIndex(nativeRows) {
    var values = {};
    if (!Array.isArray(nativeRows)) {
      return values;
    }
    nativeRows.forEach(function (row) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      var label = extractSubtotalRowLabelText(row);
      var sourceField = deriveSubtotalSourceField(row, label);
      var fieldKey = cleanText(sourceField || "").toLowerCase();
      if (!fieldKey) {
        return;
      }
      var value = extractSubtotalRowNumericValue(row);
      if (!Number.isFinite(Number(value))) {
        return;
      }
      values[fieldKey] = Number(value);
    });
    return values;
  }

  v2.buildSubtotalNativeFieldValueIndex = buildSubtotalNativeFieldValueIndex;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
