"use strict";

  function formatRentalFormMonetaryPreviewValue(amountValue) {
    var normalizedAmount = Number.isFinite(Number(amountValue)) ? Number(amountValue) : 0;
    return (normalizedAmount < 0 ? "-$ " : "$ ") + Math.abs(normalizedAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function toRentalDiscountDisplayAmount(amountValue) {
    var normalizedAmount = Number.isFinite(Number(amountValue)) ? Number(amountValue) : 0;
    return normalizedAmount > 0 ? -normalizedAmount : normalizedAmount;
  }

  function normalizeRentalFormTaxTotalsPayload(value) {
    var payload = value;
    if (typeof payload === "string") {
      var trimmedPayload = payload.trim();
      if (!trimmedPayload) {
        return null;
      }
      try {
        payload = JSON.parse(trimmedPayload);
      } catch (_error) {
        return null;
      }
    }
    return payload && typeof payload === "object" ? payload : null;
  }

  function collectRentalFormTaxDisplayRows(taxTotals) {
    var payload = normalizeRentalFormTaxTotalsPayload(taxTotals);
    if (!payload) {
      return [];
    }
    var rows = [];
    var seenKeys = Object.create(null);
    function appendTaxGroup(group) {
      if (!group || typeof group !== "object") {
        return;
      }
      var label = String(
        group.group_label ||
        group.group_name ||
        group.name ||
        group.tax_group_name ||
        "Tax Amount"
      ).trim();
      var amountValue = Number(
        group.tax_amount_currency !== undefined && group.tax_amount_currency !== null
          ? group.tax_amount_currency
          : (group.tax_amount || 0)
      );
      var normalizedAmount = Number.isFinite(amountValue) ? amountValue : 0;
      var rowKey = label + "::" + normalizedAmount.toFixed(2);
      if (seenKeys[rowKey]) {
        return;
      }
      seenKeys[rowKey] = true;
      rows.push({
        label: label || "Tax Amount",
        amount: Math.round(normalizedAmount * 100) / 100,
      });
    }

    var subtotals = Array.isArray(payload.subtotals) ? payload.subtotals : [];
    subtotals.forEach(function (subtotalRow) {
      var taxGroups = Array.isArray(subtotalRow && subtotalRow.tax_groups) ? subtotalRow.tax_groups : [];
      taxGroups.forEach(appendTaxGroup);
    });

    if (!rows.length && payload.groups_by_subtotal && typeof payload.groups_by_subtotal === "object") {
      Object.keys(payload.groups_by_subtotal).forEach(function (subtotalKey) {
        var taxGroups = payload.groups_by_subtotal[subtotalKey];
        if (!Array.isArray(taxGroups)) {
          return;
        }
        taxGroups.forEach(appendTaxGroup);
      });
    }
    return rows;
  }

  function getRentalFormTaxFallbackRows() {
    return Array.prototype.slice.call(
      document.querySelectorAll(".o_form_view .o_rp_tax_amount_fallback_row")
    ).filter(function (row) {
      return row instanceof HTMLElement;
    });
  }

  function getRentalFormTaxBreakdownSlots() {
    return Array.prototype.slice.call(
      document.querySelectorAll(".o_form_view tr.o_rp_tax_breakdown_slot")
    ).filter(function (row) {
      return row instanceof HTMLElement;
    });
  }

  function setRentalFormTableRowVisibility(row, visible) {
    if (!(row instanceof HTMLElement)) {
      return;
    }
    row.hidden = !visible;
    if (visible) {
      row.removeAttribute("hidden");
      row.classList.remove("o_invisible_modifier");
      row.style.removeProperty("display");
      return;
    }
    row.classList.add("o_invisible_modifier");
    row.style.setProperty("display", "none", "important");
  }

  function clearRentalFormTaxBreakdownRows() {
    getRentalFormTaxBreakdownSlots().forEach(function (row) {
      var labelNode = row.querySelector(".o_rp_tax_breakdown_label");
      var amountNode = row.querySelector(".o_rp_tax_breakdown_amount");
      if (labelNode instanceof HTMLElement) {
        replaceNodeText(labelNode, "");
      }
      if (amountNode instanceof HTMLElement) {
        replaceNodeText(amountNode, "");
        amountNode.removeAttribute("title");
      }
      setRentalFormTableRowVisibility(row, false);
    });
  }

  function syncRentalFormTaxFallbackRows(visible) {
    getRentalFormTaxFallbackRows().forEach(function (row) {
      setRentalFormTableRowVisibility(row, visible);
    });
  }

  function renderRentalFormTaxBreakdownRows(taxTotals, amountTax) {
    var slotRows = getRentalFormTaxBreakdownSlots();
    if (!slotRows.length) {
      return false;
    }
    clearRentalFormTaxBreakdownRows();
    var taxRows = collectRentalFormTaxDisplayRows(taxTotals);
    taxRows.slice(0, slotRows.length).forEach(function (taxRow, index) {
      var row = slotRows[index];
      var labelNode = row.querySelector(".o_rp_tax_breakdown_label");
      var amountNode = row.querySelector(".o_rp_tax_breakdown_amount");
      var formattedAmount = formatRentalFormMonetaryPreviewValue(taxRow.amount);
      if (labelNode instanceof HTMLElement) {
        replaceNodeText(labelNode, String(taxRow.label || "Tax Amount").trim() || "Tax Amount");
      }
      if (amountNode instanceof HTMLElement) {
        replaceNodeText(amountNode, formattedAmount);
        amountNode.setAttribute("title", formattedAmount);
      }
      setRentalFormTableRowVisibility(row, true);
    });
    var showFallbackRow = !taxRows.length && Math.abs(Number(amountTax || 0)) > 0.00001;
    syncRentalFormTaxFallbackRows(showFallbackRow);
    if (!showFallbackRow) {
      window.requestAnimationFrame(function () {
        syncRentalFormTaxFallbackRows(false);
      });
    }
    return taxRows.length > 0;
  }

  function applyRentalFormTotalsServerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }
    var taxAmount = parseRentalMonetaryValue(snapshot.amount_tax);
    rentalFormTotalsSurfaceState.lastTaxAmount = taxAmount;
    rentalFormTotalsSurfaceState.lastTaxTotals = normalizeRentalFormTaxTotalsPayload(snapshot.tax_totals);
    return applyRentalFormTotalsState(buildRentalFormTotalsState());
  }
