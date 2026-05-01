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
      if (!child.matches("div, section, article")) {
        return false;
      }
      if (child.matches("div.d-flex") && child.querySelector("label")) {
        return true;
      }
      if (child.querySelector("label")) {
        return true;
      }
      var text = cleanText(child.textContent || "");
      if (!text) {
        return false;
      }
      var hasValueNode = Boolean(
        child.querySelector(".o_field_monetary, .oe_currency_value, .o_field_widget, [name], [data-name], span")
      );
      return hasValueNode && /[:?]/.test(text);
    });
  }

  v2.collectSubtotalNativeRows = collectSubtotalNativeRows;

  function findSubtotalWrapInsertionAnchor(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var children = Array.prototype.slice.call(containerNode.children);
    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];
      if (!(child instanceof HTMLElement)) {
        continue;
      }
      if (
        child.classList.contains(SUBTOTAL_LINES_WRAP_CLASS) ||
        child.classList.contains(SUBTOTAL_CONFIG_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_RESTORE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_SAVE_TRIGGER_CLASS) ||
        child.classList.contains(SUBTOTAL_ERROR_ICON_CLASS)
      ) {
        continue;
      }

      var labelText = extractSubtotalRowLabelText(child);
      var sourceField = deriveSubtotalSourceField(child, labelText);
      var sourceKey = normalizeKey(sourceField || "");
      var labelKey = normalizeSubtotalLabel(labelText || "");
      var looksLikeSubtotalRow =
        sourceKey === "amount_untaxed" ||
        sourceKey === "amount_tax" ||
        sourceKey === "amount_total" ||
        sourceKey.indexOf("x_") === 0 ||
        labelKey.indexOf("untaxed") >= 0 ||
        labelKey.indexOf("subtotal") >= 0 ||
        labelKey.indexOf("tax") >= 0 ||
        labelKey === "total" ||
        labelKey === "grand_total" ||
        labelKey.indexOf("charge") >= 0 ||
        labelKey.indexOf("terp") >= 0 ||
        labelKey.indexOf("ldw") >= 0;
      if (looksLikeSubtotalRow) {
        return child;
      }
    }
    return null;
  }

  v2.findSubtotalWrapInsertionAnchor = findSubtotalWrapInsertionAnchor;

  function extractSubtotalRowLabelText(row) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var labelNode = row.querySelector("label");
    if (labelNode instanceof HTMLElement) {
      var fromLabel = cleanText(labelNode.textContent || "");
      if (fromLabel) {
        return fromLabel;
      }
    }

    var rawText = cleanText(row.textContent || "");
    if (!rawText) {
      return "";
    }
    var withoutAmounts = rawText
      .replace(/[$€£¥]\s*[-+]?\d[\d,]*(?:\.\d+)?/g, "")
      .replace(/[-+]?\d[\d,]*(?:\.\d+)?%?/g, "")
      .trim();
    if (!withoutAmounts) {
      return "";
    }
    var colonIndex = withoutAmounts.indexOf(":");
    if (colonIndex > 0) {
      return cleanText(withoutAmounts.slice(0, colonIndex));
    }
    return cleanText(withoutAmounts);
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
    var candidates = row.querySelectorAll(
      ".o_field_monetary, .oe_currency_value, .o_field_widget, [name], [data-name], span"
    );
    for (var i = 0; i < candidates.length; i += 1) {
      var node = candidates[i];
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      var textValue = parseNumericText(node.textContent || "");
      if (textValue !== 0) {
        return textValue;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
        var inputValue = parseNumericText(node.value);
        if (inputValue !== 0) {
          return inputValue;
        }
      }
    }
    return parseNumericText(row.textContent || "");
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
      var value = extractSubtotalRowNumericValue(row);
      if (!Number.isFinite(Number(value))) {
        return;
      }
      if (fieldKey) {
        values[fieldKey] = Number(value);
      }
      var normalizedLabel = normalizeSubtotalLabel(label || "");
      if ((normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0) && !values.amount_untaxed) {
        values.amount_untaxed = Number(value);
      }
      if (
        normalizedLabel === "tax" ||
        normalizedLabel === "taxes" ||
        normalizedLabel.indexOf("tax_amount") >= 0
      ) {
        values.amount_tax = Number(value);
      }
      if ((normalizedLabel === "total" || normalizedLabel === "grand_total") && !values.amount_total) {
        values.amount_total = Number(value);
      }
    });
    if (
      !Number.isFinite(Number(values.amount_tax)) &&
      Number.isFinite(Number(values.amount_total)) &&
      Number.isFinite(Number(values.amount_untaxed)) &&
      Number(values.amount_total) >= Number(values.amount_untaxed)
    ) {
      values.amount_tax = Number(values.amount_total) - Number(values.amount_untaxed);
    }
    return values;
  }

  v2.buildSubtotalNativeFieldValueIndex = buildSubtotalNativeFieldValueIndex;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
