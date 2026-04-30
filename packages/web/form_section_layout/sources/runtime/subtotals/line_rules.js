(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/line_rules.js

  function normalizeSubtotalLineType(rawType, sourceField, label) {
    var typeName = cleanText(rawType || "").toLowerCase();
    var fieldKey = normalizeKey(sourceField || "");
    var labelKey = normalizeSubtotalLabel(label || "");
    if (fieldKey === "amount_untaxed" || labelKey.indexOf("untaxed") >= 0 || labelKey.indexOf("subtotal") >= 0) {
      return "base";
    }
    if (fieldKey === "amount_tax" || labelKey === "tax" || labelKey === "taxes" || labelKey.indexOf("tax_amount") >= 0) {
      return "tax";
    }
    if (fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total") {
      return "total";
    }
    if (fieldKey.indexOf("delivery_charge") >= 0) {
      return "charge";
    }
    if (fieldKey.indexOf("terp_amount") >= 0) {
      return "tax";
    }
    if (fieldKey.indexOf("ldw_amount") >= 0) {
      return "charge";
    }
    if (typeName === "charge" || typeName === "tax" || typeName === "special") {
      return typeName;
    }
    if (labelKey.indexOf("charge") >= 0 || labelKey.indexOf("fee") >= 0 || labelKey.indexOf("surcharge") >= 0) {
      return "charge";
    }
    if (labelKey.indexOf("tax") >= 0) {
      return "tax";
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
      fieldKey === "x_terp_amount" ||
      fieldKey === "x_ldw_amount"
    ) {
      return true;
    }
    return false;
  }

  v2.isAutoManagedSubtotalSourceField = isAutoManagedSubtotalSourceField;

  function isTaxSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey === "amount_tax") {
      return true;
    }
    if (lineKey === "amount_tax") {
      return true;
    }
    return normalizedLabel === "tax" || normalizedLabel === "taxes" || normalizedLabel.indexOf("tax_amount") >= 0;
  }

  v2.isTaxSubtotalLine = isTaxSubtotalLine;

  function isTerpSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey.indexOf("terp_amount") >= 0 || lineKey.indexOf("terp_amount") >= 0) {
      return true;
    }
    return normalizedLabel.indexOf("terp") >= 0;
  }

  v2.isTerpSubtotalLine = isTerpSubtotalLine;

  function isLdwSubtotalLine(labelText, sourceField, lineId) {
    var normalizedLabel = normalizeSubtotalLabel(labelText);
    var fieldKey = normalizeKey(sourceField || "");
    var lineKey = normalizeKey(lineId || "");
    if (fieldKey.indexOf("ldw_amount") >= 0 || lineKey.indexOf("ldw_amount") >= 0) {
      return true;
    }
    return normalizedLabel.indexOf("ldw") >= 0 || normalizedLabel.indexOf("loss_damage_waiver") >= 0;
  }

  v2.isLdwSubtotalLine = isLdwSubtotalLine;

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
      sourceKey === "x_terp_amount" ||
      sourceKey === "x_ldw_amount" ||
      idKey === "amount_untaxed" ||
      idKey === "amount_tax" ||
      idKey === "amount_total" ||
      idKey === "x_terp_amount" ||
      idKey === "x_ldw_amount"
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

  function sanitizeSubtotalLine(line, fallbackId) {
    if (!line || typeof line !== "object") {
      return null;
    }
    var lineId = cleanText(line.id || fallbackId || "");
    if (!lineId) {
      return null;
    }
    var label = cleanText(line.label || "");
    var formula = cleanText(line.formula || "");
    var sourceField = normalizeSubtotalSourceField(line.sourceField || "");
    var lineType = normalizeSubtotalLineType(line.lineType, sourceField, label);
    var terpLine = isTerpSubtotalLine(label, sourceField, lineId);
    var ldwLine = isLdwSubtotalLine(label, sourceField, lineId);
    if (!sourceField) {
      if (terpLine) {
        sourceField = "x_terp_amount";
      } else if (ldwLine) {
        sourceField = "x_ldw_amount";
      } else
        if (lineType === "base" || isUntaxedSubtotalLine(label, sourceField, lineId)) {
          sourceField = "amount_untaxed";
        } else if (lineType === "tax" || isTaxSubtotalLine(label, sourceField, lineId)) {
          sourceField = "amount_tax";
        } else if (lineType === "total") {
          sourceField = "amount_total";
        }
    }
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
