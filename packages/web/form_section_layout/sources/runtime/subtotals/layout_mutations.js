(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/layout_mutations.js

  function normalizeSubtotalLayout(layout) {
    var lines = Array.isArray(layout && layout.lines) ? layout.lines : [];
    var cleanedLines = [];
    lines.forEach(function (line, index) {
      var cleaned = sanitizeSubtotalLine(line, "line_" + String(index + 1));
      if (cleaned) {
        cleanedLines.push(cleaned);
      }
    });
    var byId = new Set(
      cleanedLines.map(function (line) {
        return line.id;
      })
    );
    var requestedOrder = Array.isArray(layout && layout.order)
      ? dedupeKeys(
        layout.order.map(function (value) {
          return cleanText(value);
        })
      )
      : [];
    var finalOrder = [];
    requestedOrder.forEach(function (lineId) {
      if (byId.has(lineId)) {
        finalOrder.push(lineId);
        byId.delete(lineId);
      }
    });
    cleanedLines.forEach(function (line) {
      if (byId.has(line.id)) {
        finalOrder.push(line.id);
        byId.delete(line.id);
      }
    });
    return {
      lines: cleanedLines,
      order: finalOrder,
    };
  }

  v2.normalizeSubtotalLayout = normalizeSubtotalLayout;

  function enforceCoreSubtotalLineRules(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var changed = false;
    normalized.lines.forEach(function (line) {
      if (!line || typeof line !== "object") {
        return;
      }
      if (isUntaxedSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "amount_untaxed") {
          line.sourceField = "amount_untaxed";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_untaxed}") {
          line.formula = "{field:amount_untaxed}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "base") {
          line.lineType = "base";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isTerpSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "x_terp_amount") {
          line.sourceField = "x_terp_amount";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:x_terp_amount}") {
          line.formula = "{field:x_terp_amount}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.lineType !== "tax") {
          line.lineType = "tax";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isLdwSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "x_ldw_amount") {
          line.sourceField = "x_ldw_amount";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:x_ldw_amount}") {
          line.formula = "{field:x_ldw_amount}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.lineType !== "charge") {
          line.lineType = "charge";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      if (isTaxSubtotalLine(line.label, line.sourceField, line.id)) {
        if (cleanText(line.sourceField || "") !== "amount_tax") {
          line.sourceField = "amount_tax";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_tax}") {
          line.formula = "{field:amount_tax}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "tax") {
          line.lineType = "tax";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      var fieldKey = normalizeKey(line.sourceField || "");
      var labelKey = normalizeSubtotalLabel(line.label);
      if (fieldKey === "amount_total" || labelKey === "total" || labelKey === "grand_total") {
        if (cleanText(line.sourceField || "") !== "amount_total") {
          line.sourceField = "amount_total";
          changed = true;
        }
        if (cleanText(line.formula || "") !== "{field:amount_total}") {
          line.formula = "{field:amount_total}";
          changed = true;
        }
        if (line.formulaLocked !== true) {
          line.formulaLocked = true;
          changed = true;
        }
        if (line.removable !== false) {
          line.removable = false;
          changed = true;
        }
        if (line.lineType !== "total") {
          line.lineType = "total";
          changed = true;
        }
        if (line.sign !== "positive") {
          line.sign = "positive";
          changed = true;
        }
        return;
      }
      var inferredType = normalizeSubtotalLineType(line.lineType, line.sourceField, line.label);
      if (line.lineType !== inferredType) {
        line.lineType = inferredType;
        changed = true;
      }
      var inferredSign = normalizeSubtotalLineSign(line.sign);
      if (line.sign !== inferredSign) {
        line.sign = inferredSign;
        changed = true;
      }
    });
    return { layout: normalized, changed: changed };
  }

  v2.enforceCoreSubtotalLineRules = enforceCoreSubtotalLineRules;

  function createSubtotalCustomLine() {
    var newId = "custom_" + String(Date.now()) + "_" + String(Math.floor(Math.random() * 10000));
    return sanitizeSubtotalLine(
      {
        id: newId,
        label: "Custom line",
        formula: "{subtotal}",
        sourceField: "",
        removable: true,
        lineType: "special",
        sign: "positive",
      },
      newId
    );
  }

  v2.createSubtotalCustomLine = createSubtotalCustomLine;

  function insertCustomSubtotalLine(layout, beforeLineId) {
    var nextLayout = normalizeSubtotalLayout(layout);
    var newLine = createSubtotalCustomLine();
    if (!newLine) {
      return nextLayout;
    }
    nextLayout.lines.push(newLine);
    var nextOrder = nextLayout.order.slice();
    var beforeKey = cleanText(beforeLineId || "");
    var insertAt = beforeKey ? nextOrder.indexOf(beforeKey) : -1;
    if (insertAt < 0) {
      nextOrder.push(newLine.id);
    } else {
      nextOrder.splice(insertAt, 0, newLine.id);
    }
    nextLayout.order = nextOrder;
    return nextLayout;
  }

  v2.insertCustomSubtotalLine = insertCustomSubtotalLine;

  function moveSubtotalLine(layout, sourceLineId, targetLineId, dropBefore) {
    var nextLayout = normalizeSubtotalLayout(layout);
    var sourceKey = cleanText(sourceLineId || "");
    var targetKey = cleanText(targetLineId || "");
    if (!sourceKey || !targetKey || sourceKey === targetKey) {
      return nextLayout;
    }
    var nextOrder = nextLayout.order.slice();
    var sourceIndex = nextOrder.indexOf(sourceKey);
    var targetIndex = nextOrder.indexOf(targetKey);
    if (sourceIndex < 0 || targetIndex < 0) {
      return nextLayout;
    }
    nextOrder.splice(sourceIndex, 1);
    var insertAt = dropBefore ? targetIndex : targetIndex + 1;
    if (sourceIndex < targetIndex) {
      insertAt -= 1;
    }
    if (insertAt < 0) {
      insertAt = 0;
    }
    if (insertAt > nextOrder.length) {
      insertAt = nextOrder.length;
    }
    nextOrder.splice(insertAt, 0, sourceKey);
    nextLayout.order = nextOrder;
    return nextLayout;
  }

  v2.moveSubtotalLine = moveSubtotalLine;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
