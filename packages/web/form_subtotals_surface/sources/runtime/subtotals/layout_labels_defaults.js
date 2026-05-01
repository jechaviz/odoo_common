(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/layout_labels_defaults.js

  function normalizeSubtotalLabel(rawValue) {
    return normalizeKey(cleanText(rawValue || "").replace(/[:?]/g, " "));
  }

  v2.normalizeSubtotalLabel = normalizeSubtotalLabel;

  function normalizeSubtotalSourceField(rawFieldName) {
    var sourceField = cleanText(rawFieldName || "");
    if (!sourceField) {
      return "";
    }
    var lowered = normalizeKey(sourceField);
    if (!lowered) {
      return "";
    }
    if (
      lowered.indexOf("o_field_input_") === 0 ||
      lowered.indexOf("o_input_") === 0 ||
      lowered.indexOf("field_input_") === 0
    ) {
      return "";
    }
    var normalized = sourceField;
    if (/^(x_[a-z0-9_]+)_\d+$/i.test(normalized)) {
      normalized = normalized.replace(/^(x_[a-z0-9_]+)_\d+$/i, "$1");
    } else if (/^(amount_[a-z0-9_]+)_\d+$/i.test(normalized)) {
      normalized = normalized.replace(/^(amount_[a-z0-9_]+)_\d+$/i, "$1");
    }
    return cleanText(normalized || "");
  }

  v2.normalizeSubtotalSourceField = normalizeSubtotalSourceField;

  function deriveSubtotalSourceField(row, labelText) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var labelNode = row.querySelector("label");
    var labelForValue = cleanText((labelNode && labelNode.getAttribute && labelNode.getAttribute("for")) || "");
    var sourceField = "";
    var fieldNode = row.querySelector("[name], [data-name]");
    if (fieldNode instanceof HTMLElement) {
      sourceField = cleanText(fieldNode.getAttribute("name") || fieldNode.getAttribute("data-name") || "");
    }
    if (!sourceField) {
      sourceField = labelForValue;
    }
    sourceField = normalizeSubtotalSourceField(sourceField) || normalizeSubtotalSourceField(labelForValue);

    var normalizedLabel = normalizeSubtotalLabel(labelText);
    if (!sourceField && (normalizedLabel === "total" || normalizedLabel === "grand_total")) {
      return "amount_total";
    }
    if (
      !sourceField &&
      (normalizedLabel === "tax" ||
        normalizedLabel === "taxes" ||
        normalizedLabel.indexOf("tax_amount") >= 0 ||
        normalizedLabel.indexOf("tax") >= 0)
    ) {
      return "amount_tax";
    }
    if (!sourceField && (normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0)) {
      return "amount_untaxed";
    }
    return normalizeSubtotalSourceField(sourceField);
  }

  v2.deriveSubtotalSourceField = deriveSubtotalSourceField;

  function isCoreSubtotalLine(labelText, sourceField) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    if (normalizedLabel.indexOf("margin") >= 0 || fieldKey.indexOf("margin") >= 0) {
      return true;
    }
    return false;
  }

  v2.isCoreSubtotalLine = isCoreSubtotalLine;

  function isUntaxedSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_untaxed") {
      return true;
    }
    if (lineKey === "amount_untaxed") {
      return true;
    }
    return normalizedLabel.indexOf("untaxed") >= 0 || normalizedLabel.indexOf("subtotal") >= 0;
  }

  v2.isUntaxedSubtotalLine = isUntaxedSubtotalLine;

  function shouldSeedSubtotalLine(row, labelText, sourceField) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    if (!labelText) {
      return false;
    }
    if (isUntaxedSubtotalLine(labelText, sourceField)) {
      return true;
    }
    if (isCoreSubtotalLine(labelText, sourceField)) {
      return false;
    }
    var fieldKey = normalizeKey(sourceField || "");
    if (fieldKey.indexOf("tax_totals") >= 0) {
      return false;
    }
    if (fieldKey === "amount_tax" || isTaxSubtotalLine(labelText, sourceField)) {
      return true;
    }
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    return (
      normalizedLabel.indexOf("charge") >= 0 ||
      fieldKey === "amount_total" ||
      normalizedLabel === "total" ||
      normalizedLabel === "grand_total"
    );
  }

  v2.shouldSeedSubtotalLine = shouldSeedSubtotalLine;

  function buildDefaultSubtotalLayout(nativeRows) {
    var layout = { lines: [], order: [] };
    if (!Array.isArray(nativeRows)) {
      return layout;
    }
    nativeRows.forEach(function (row, index) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      var labelText = extractSubtotalRowLabelText(row);
      var sourceField = deriveSubtotalSourceField(row, labelText);
      if (!shouldSeedSubtotalLine(row, labelText, sourceField)) {
        return;
      }
      var isUntaxed = isUntaxedSubtotalLine(labelText, sourceField);
      var isTax = isTaxSubtotalLine(labelText, sourceField);
      var isTotal = normalizeKey(sourceField || "") === "amount_total" || normalizeSubtotalLabel(labelText) === "total";
      var normalizedSourceField = sourceField || (isUntaxed ? "amount_untaxed" : isTax ? "amount_tax" : isTotal ? "amount_total" : "");
      var lineId = normalizeKey(normalizedSourceField || labelText) || "line_" + String(index + 1);
      var line = sanitizeSubtotalLine(
        {
          id: lineId,
          label: labelText.replace(/[:?]$/, ""),
          sourceField: normalizedSourceField,
          formula: normalizedSourceField ? "{field:" + normalizedSourceField + "}" : "{subtotal}",
          removable: isUntaxed || isTax || isTotal ? false : true,
          formulaLocked: isUntaxed || isTax || isTotal,
          lineType: isUntaxed ? "base" : isTax ? "tax" : isTotal ? "total" : normalizeSubtotalLineType("", normalizedSourceField, labelText),
          sign: "positive",
        },
        lineId
      );
      if (!line) {
        return;
      }
      layout.lines.push(line);
      layout.order.push(line.id);
    });
    return normalizeSubtotalLayout(layout);
  }

  v2.buildDefaultSubtotalLayout = buildDefaultSubtotalLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
