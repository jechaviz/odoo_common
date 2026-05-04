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
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sourceField)) {
      return "";
    }
    return sourceField;
  }

  v2.normalizeSubtotalSourceField = normalizeSubtotalSourceField;

  function deriveSubtotalSourceField(row, labelText) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    return normalizeSubtotalSourceField(row.getAttribute("data-lib-subtotal-source-field") || "");
  }

  v2.deriveSubtotalSourceField = deriveSubtotalSourceField;

  function isCoreSubtotalLine(labelText, sourceField) {
    return false;
  }

  v2.isCoreSubtotalLine = isCoreSubtotalLine;

  function isUntaxedSubtotalLine(labelText, sourceField, lineId) {
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_untaxed") {
      return true;
    }
    if (lineKey === "amount_untaxed") {
      return true;
    }
    return false;
  }

  v2.isUntaxedSubtotalLine = isUntaxedSubtotalLine;

  function shouldSeedSubtotalLine(row, labelText, sourceField) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    if (!labelText) {
      return false;
    }
    var explicitSeed = cleanText(row.getAttribute("data-lib-subtotal-seed") || "").toLowerCase();
    if (["1", "true", "yes", "y", "on"].indexOf(explicitSeed) >= 0) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].indexOf(explicitSeed) >= 0) {
      return false;
    }
    return false;
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
      var explicitLineType = cleanText(row.getAttribute("data-lib-subtotal-line-type") || "").toLowerCase();
      var isUntaxed = isUntaxedSubtotalLine(labelText, sourceField);
      var isTax = isTaxSubtotalLine(labelText, sourceField);
      var isTotal = normalizeKey(sourceField || "") === "amount_total";
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
          lineType: isUntaxed ? "base" : isTax ? "tax" : isTotal ? "total" : normalizeSubtotalLineType(explicitLineType, normalizedSourceField, labelText),
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
