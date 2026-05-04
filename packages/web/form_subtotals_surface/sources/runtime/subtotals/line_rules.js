(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/line_rules.js

  function normalizeSubtotalLineType(rawType, sourceField, label) {
    var typeName = cleanText(rawType || "").toLowerCase();
    var fieldKey = normalizeKey(sourceField || "");
    if (fieldKey === "amount_untaxed") {
      return "base";
    }
    if (fieldKey === "amount_tax") {
      return "tax";
    }
    if (fieldKey === "amount_total") {
      return "total";
    }
    if (Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, fieldKey)) {
      return "charge";
    }
    if (typeName === "charge" || typeName === "tax" || typeName === "special") {
      return typeName;
    }
    return "special";
  }

  v2.normalizeSubtotalLineType = normalizeSubtotalLineType;

  function normalizeSubtotalLineSign(rawSign) {
    var sign = cleanText(rawSign || "").toLowerCase();
    if (sign === "-" || sign === "negative" || sign === "minus") {
      return "negative";
    }
    return "positive";
  }

  v2.normalizeSubtotalLineSign = normalizeSubtotalLineSign;

  function subtotalLineSignMultiplier(line) {
    var sign = normalizeSubtotalLineSign(line && line.sign);
    return sign === "negative" ? -1 : 1;
  }

  v2.subtotalLineSignMultiplier = subtotalLineSignMultiplier;

  function subtotalLineType(line) {
    return normalizeSubtotalLineType(line && line.lineType, line && line.sourceField, line && line.label);
  }

  v2.subtotalLineType = subtotalLineType;

  function isAutoManagedSubtotalSourceField(sourceField) {
    var fieldKey = normalizeKey(sourceField || "");
    if (!fieldKey) {
      return false;
    }
    if (
      fieldKey === "amount_untaxed" ||
      fieldKey === "amount_tax" ||
      fieldKey === "amount_total" ||
      Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, fieldKey)
    ) {
      return true;
    }
    return false;
  }

  v2.isAutoManagedSubtotalSourceField = isAutoManagedSubtotalSourceField;

  function isTaxSubtotalLine(labelText, sourceField, lineId) {
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_tax") {
      return true;
    }
    if (lineKey === "amount_tax") {
      return true;
    }
    return false;
  }

  v2.isTaxSubtotalLine = isTaxSubtotalLine;

  function isBackendManagedSubtotalLine(line) {
    if (!(line && typeof line === "object")) {
      return false;
    }
    var sourceKey = normalizeKey(line.sourceField || "");
    var idKey = normalizeKey(line.id || "");
    if (
      sourceKey === "amount_untaxed" ||
      sourceKey === "amount_tax" ||
      sourceKey === "amount_total" ||
      idKey === "amount_untaxed" ||
      idKey === "amount_tax" ||
      idKey === "amount_total" ||
      Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, sourceKey) ||
      Object.prototype.hasOwnProperty.call(SUBTOTAL_TOGGLE_BY_SOURCE, idKey)
    ) {
      return true;
    }
    var lineType = subtotalLineType(line);
    if (lineType === "base" || lineType === "total") {
      return true;
    }
    if (lineType === "tax" && isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
      return true;
    }
    return false;
  }

  v2.isBackendManagedSubtotalLine = isBackendManagedSubtotalLine;

  function sanitizeSubtotalLine(line, defaultId) {
    if (!line || typeof line !== "object") {
      return null;
    }
    var lineId = cleanText(line.id || defaultId || "");
    if (!lineId) {
      return null;
    }
    var label = cleanText(line.label || "");
    var formula = cleanText(line.formula || "");
    var sourceField = normalizeSubtotalSourceField(line.sourceField || "");
    var lineType = normalizeSubtotalLineType(line.lineType, sourceField, label);
    lineType = normalizeSubtotalLineType(lineType, sourceField, label);
    if ((!formula || !cleanText(formula)) && sourceField) {
      formula = "{field:" + sourceField + "}";
    }
    var formulaFieldMatch = String(formula || "").match(/^\{field:([^}]+)\}$/i);
    if (formulaFieldMatch && formulaFieldMatch[1]) {
      var normalizedFormulaField = normalizeSubtotalSourceField(formulaFieldMatch[1]);
      if (normalizedFormulaField) {
        formula = "{field:" + normalizedFormulaField + "}";
      }
    }
    var sign = normalizeSubtotalLineSign(line.sign);
    if (lineType === "base" || lineType === "total") {
      sign = "positive";
    }
    var formulaLocked = line.formulaLocked === true;
    if (lineType === "base" || lineType === "tax" || lineType === "total" || isAutoManagedSubtotalSourceField(sourceField)) {
      formulaLocked = true;
    }
    return {
      id: lineId,
      label: label || "Line",
      formula: formula || (sourceField ? "{field:" + sourceField + "}" : ""),
      sourceField: sourceField,
      removable: line.removable !== false,
      formulaLocked: formulaLocked,
      lineType: lineType,
      sign: sign,
    };
  }

  v2.sanitizeSubtotalLine = sanitizeSubtotalLine;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
