(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/formulas.js

  function resolveFormulaValue(formNode, line, lineValuesById, nativeFieldValues, lineById) {
    if (!(line && typeof line === "object")) {
      return 0;
    }
    var lineIdKey = cleanText((line && line.id) || "").toLowerCase();
    var lineTypeName = subtotalLineType(line);
    var toggleMeta = subtotalToggleMetaForLine(line);
    if (toggleMeta && toggleMeta.toggleField) {
      var lineEnabled = readFieldBooleanValue(formNode, toggleMeta.toggleField, true);
      if (!lineEnabled) {
        return 0;
      }
    }
    var baseFormula = cleanText(line.formula || "");
    if (!baseFormula && line.sourceField) {
      baseFormula = "{field:" + cleanText(line.sourceField) + "}";
    }
    if (!baseFormula) {
      return 0;
    }

    var fallbackUntaxed = Number(nativeFieldValues && nativeFieldValues.amount_untaxed);
    var fallbackTax = Number(nativeFieldValues && nativeFieldValues.amount_tax);
    var fallbackTotal = Number(nativeFieldValues && nativeFieldValues.amount_total);
    var subtotalAmount = readFieldNumericValue(formNode, "amount_untaxed");
    var taxAmount = readFieldNumericValue(formNode, "amount_tax");
    var totalAmount = readFieldNumericValue(formNode, "amount_total");
    if (subtotalAmount === 0 && Number.isFinite(fallbackUntaxed)) {
      subtotalAmount = fallbackUntaxed;
    }
    if (taxAmount === 0 && Number.isFinite(fallbackTax)) {
      taxAmount = fallbackTax;
    }
    if (totalAmount === 0 && Number.isFinite(fallbackTotal)) {
      totalAmount = fallbackTotal;
    }
    if (
      taxAmount === 0 &&
      Number.isFinite(totalAmount) &&
      Number.isFinite(subtotalAmount) &&
      Number(totalAmount) >= Number(subtotalAmount)
    ) {
      taxAmount = totalAmount - subtotalAmount;
    }

    if (lineTypeName === "base") {
      return Number.isFinite(Number(subtotalAmount)) ? Number(subtotalAmount) : 0;
    }
    if (lineTypeName === "tax" && isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
      return Number.isFinite(Number(taxAmount)) ? Number(taxAmount) : 0;
    }
    if (lineTypeName === "total") {
      var dynamicTotal = Number.isFinite(Number(subtotalAmount)) ? Number(subtotalAmount) : 0;
      dynamicTotal += Number.isFinite(Number(taxAmount)) ? Number(taxAmount) : 0;
      if (lineValuesById && typeof lineValuesById === "object") {
        Object.keys(lineValuesById).forEach(function (key) {
          var normalizedKey = cleanText(key || "").toLowerCase();
          if (!normalizedKey || normalizedKey === lineIdKey) {
            return;
          }
          var sourceLine = lineById && lineById[normalizedKey];
          if (!(sourceLine && typeof sourceLine === "object")) {
            return;
          }
          var sourceType = subtotalLineType(sourceLine);
          if (sourceType === "base" || sourceType === "tax" || sourceType === "total") {
            return;
          }
          dynamicTotal += Number(lineValuesById[normalizedKey] || 0);
        });
      }
      return dynamicTotal;
    }

    var rendered = baseFormula.replace(/\{([^}]+)\}/g, function (_match, token) {
      var key = cleanText(token || "").toLowerCase();
      if (!key) {
        return "0";
      }
      if (key === "subtotal" || key === "untaxed") {
        return String(subtotalAmount);
      }
      if (key === "tax" || key === "taxes") {
        return String(taxAmount);
      }
      if (key === "total") {
        return String(totalAmount);
      }
      if (key.indexOf("field:") === 0) {
        var fieldName = cleanText(key.slice(6));
        var fieldValue = readFieldNumericValue(formNode, fieldName);
        if (
          fieldName === "amount_tax" &&
          fieldValue === 0 &&
          Number.isFinite(Number(totalAmount)) &&
          Number.isFinite(Number(subtotalAmount)) &&
          Number(totalAmount) >= Number(subtotalAmount)
        ) {
          fieldValue = Number(totalAmount) - Number(subtotalAmount);
        }
        if (fieldValue === 0 && nativeFieldValues && Object.prototype.hasOwnProperty.call(nativeFieldValues, fieldName)) {
          fieldValue = Number(nativeFieldValues[fieldName] || 0);
        }
        return String(fieldValue);
      }
      if (lineValuesById && typeof lineValuesById === "object" && Object.prototype.hasOwnProperty.call(lineValuesById, key)) {
        return String(Number(lineValuesById[key] || 0));
      }
      return "0";
    });

    if (!/^[0-9+\-*/().\s]+$/.test(rendered)) {
      return 0;
    }
    try {
      var evaluated = Function('"use strict"; return (' + rendered + ");")();
      var numericValue = Number.isFinite(Number(evaluated)) ? Number(evaluated) : 0;
      var signMultiplier = subtotalLineSignMultiplier(line);
      if (lineTypeName === "charge" || lineTypeName === "tax" || lineTypeName === "special") {
        numericValue *= signMultiplier;
      }
      return numericValue;
    } catch (_err) {
      return 0;
    }
  }

  v2.resolveFormulaValue = resolveFormulaValue;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
