(function () {
  "use strict";

  if (!window.OdooSurfaceLayers || !window.OdooSurfaceLayers._shared) {
    throw new Error("form totals surface requires the canonical OdooSurfaceLayers bootstrap.");
  }

  var layers = window.OdooSurfaceLayers;

  function normalizeScalarText(value) {
    return typeof value === "string" ? value.trim() : String(value == null ? "" : value).trim();
  }

  function normalizeAmount(value) {
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function formatFormTotalsMonetaryValue(amountValue, options) {
    var settings = options && typeof options === "object" ? options : {};
    var normalizedAmount = normalizeAmount(amountValue);
    var locale = normalizeScalarText(settings.locale) || "en-US";
    var currencySymbol = normalizeScalarText(settings.currencySymbol) || "$";
    var negativePrefix = Object.prototype.hasOwnProperty.call(settings, "negativePrefix")
      ? String(settings.negativePrefix)
      : "-";
    var positivePrefix = Object.prototype.hasOwnProperty.call(settings, "positivePrefix")
      ? String(settings.positivePrefix)
      : "";
    var numberText = Math.abs(normalizedAmount).toLocaleString(locale, {
      minimumFractionDigits: Number.isFinite(Number(settings.minimumFractionDigits))
        ? Number(settings.minimumFractionDigits)
        : 2,
      maximumFractionDigits: Number.isFinite(Number(settings.maximumFractionDigits))
        ? Number(settings.maximumFractionDigits)
        : 2,
    });
    var signPrefix = normalizedAmount < 0 ? negativePrefix : positivePrefix;
    return signPrefix + currencySymbol + " " + numberText;
  }

  function normalizeFormTotalsPayload(value) {
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

  function readTaxGroupLabel(group, settings) {
    var labelKeys = Array.isArray(settings && settings.labelKeys) && settings.labelKeys.length
      ? settings.labelKeys
      : ["group_label", "group_name", "name", "tax_group_name"];
    for (var index = 0; index < labelKeys.length; index += 1) {
      var key = labelKeys[index];
      var label = normalizeScalarText(group && group[key]);
      if (label) {
        return label;
      }
    }
    return "Tax Amount";
  }

  function readTaxGroupAmount(group, settings) {
    var amountKeys = Array.isArray(settings && settings.amountKeys) && settings.amountKeys.length
      ? settings.amountKeys
      : ["tax_amount_currency", "tax_amount"];
    for (var index = 0; index < amountKeys.length; index += 1) {
      var key = amountKeys[index];
      if (group && group[key] !== undefined && group[key] !== null) {
        return normalizeAmount(group[key]);
      }
    }
    return 0;
  }

  function collectFormTotalsTaxRows(taxTotals, options) {
    var payload = normalizeFormTotalsPayload(taxTotals);
    if (!payload) {
      return [];
    }
    var settings = options && typeof options === "object" ? options : {};
    var rows = [];
    var seenKeys = Object.create(null);

    function appendTaxGroup(group) {
      if (!group || typeof group !== "object") {
        return;
      }
      var label = readTaxGroupLabel(group, settings);
      var amount = readTaxGroupAmount(group, settings);
      var rowKey = label + "::" + amount.toFixed(2);
      if (seenKeys[rowKey]) {
        return;
      }
      seenKeys[rowKey] = true;
      rows.push({
        label: label,
        amount: Math.round(amount * 100) / 100,
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

  function resolveElementList(root, selector) {
    if (!(root instanceof HTMLElement) || !normalizeScalarText(selector)) {
      return [];
    }
    return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  function setNodeText(node, text, replaceText) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (typeof replaceText === "function") {
      replaceText(node, text);
      return;
    }
    node.textContent = text;
  }

  function setRowVisible(row, visible) {
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

  function buildFormTotalsSurface(spec) {
    var settings = spec && typeof spec === "object" ? spec : {};
    var root = settings.root instanceof HTMLElement ? settings.root : null;
    var rowSelector = normalizeScalarText(settings.rowSelector);
    var fallbackSelector = normalizeScalarText(settings.fallbackSelector);
    var labelSelector = normalizeScalarText(settings.labelSelector) || "[data-surface-tax-label='1']";
    var amountSelector = normalizeScalarText(settings.amountSelector) || "[data-surface-tax-amount='1']";
    var replaceText = typeof settings.replaceText === "function" ? settings.replaceText : null;
    var formatAmount = typeof settings.formatAmount === "function"
      ? settings.formatAmount
      : function (value) {
          return formatFormTotalsMonetaryValue(value, settings.money);
        };

    function clear() {
      resolveElementList(root, rowSelector).forEach(function (row) {
        setNodeText(row.querySelector(labelSelector), "", replaceText);
        var amountNode = row.querySelector(amountSelector);
        setNodeText(amountNode, "", replaceText);
        if (amountNode instanceof HTMLElement) {
          amountNode.removeAttribute("title");
        }
        setRowVisible(row, false);
      });
    }

    function syncFallback(visible) {
      resolveElementList(root, fallbackSelector).forEach(function (row) {
        setRowVisible(row, visible);
      });
    }

    function sync(taxTotals, fallbackAmount, options) {
      var rowNodes = resolveElementList(root, rowSelector);
      if (!rowNodes.length) {
        return false;
      }
      clear();
      var rows = collectFormTotalsTaxRows(taxTotals, options || settings.rows);
      rows.slice(0, rowNodes.length).forEach(function (taxRow, index) {
        var row = rowNodes[index];
        var formattedAmount = formatAmount(taxRow.amount);
        setNodeText(row.querySelector(labelSelector), normalizeScalarText(taxRow.label) || "Tax Amount", replaceText);
        var amountNode = row.querySelector(amountSelector);
        setNodeText(amountNode, formattedAmount, replaceText);
        if (amountNode instanceof HTMLElement) {
          amountNode.setAttribute("title", formattedAmount);
        }
        setRowVisible(row, true);
      });
      var showFallback = !rows.length && Math.abs(normalizeAmount(fallbackAmount)) > 0.00001;
      syncFallback(showFallback);
      if (!showFallback) {
        window.requestAnimationFrame(function () {
          syncFallback(false);
        });
      }
      return rows.length > 0;
    }

    return {
      clear: clear,
      sync: sync,
      syncFallback: syncFallback,
    };
  }

  layers.formatFormTotalsMonetaryValue = formatFormTotalsMonetaryValue;
  layers.normalizeFormTotalsPayload = normalizeFormTotalsPayload;
  layers.collectFormTotalsTaxRows = collectFormTotalsTaxRows;
  layers.buildFormTotalsSurface = buildFormTotalsSurface;
})();
