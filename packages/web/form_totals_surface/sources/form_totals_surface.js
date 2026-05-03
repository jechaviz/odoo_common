(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("form totals surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  var layers = requireSurfaceLayerApi();

  function normalizeScalarText(value) {
    return typeof value === "string" ? value.trim() : String(value == null ? "" : value).trim();
  }

  function readOptions(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function readFunction(value) {
    return typeof value === "function" ? value : null;
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

  function resolveFormTotalsRoot(rawOptions) {
    var options = readOptions(rawOptions);
    if (typeof options.resolveRoot === "function") {
      var resolvedRoot = options.resolveRoot();
      if (resolvedRoot instanceof HTMLElement) {
        return resolvedRoot;
      }
    }
    if (options.root instanceof HTMLElement) {
      return options.root;
    }
    var selector = normalizeScalarText(options.selector);
    if (selector) {
      var selectedRoot = document.querySelector(selector);
      if (selectedRoot instanceof HTMLElement) {
        return selectedRoot;
      }
    }
    return null;
  }

  function normalizeFormTotalsSurfaceSpec(rawSpec) {
    var spec = readOptions(rawSpec);
    var root = asElement(spec.root);
    var selector = normalizeScalarText(spec.selector);
    var resolveRoot = readFunction(spec.resolveRoot);
    if (!(root || selector || resolveRoot)) {
      throw new Error("form totals surface spec.root, spec.selector, or spec.resolveRoot is required.");
    }
    var rowSelector = normalizeScalarText(spec.rowSelector);
    if (!rowSelector) {
      throw new Error("form totals surface spec.rowSelector is required.");
    }
    return {
      root: root,
      selector: selector,
      resolveRoot: resolveRoot,
      fallbackSelector: normalizeScalarText(spec.fallbackSelector),
      rowSelector: rowSelector,
      labelSelector: normalizeScalarText(spec.labelSelector) || "[data-surface-tax-label='1']",
      amountSelector: normalizeScalarText(spec.amountSelector) || "[data-surface-tax-amount='1']",
      replaceText: readFunction(spec.replaceText),
      formatAmount: readFunction(spec.formatAmount),
      money: readOptions(spec.money),
      rows: readOptions(spec.rows),
      beforeSync: readFunction(spec.beforeSync),
      afterSync: readFunction(spec.afterSync),
      visibleWhen: readFunction(spec.visibleWhen),
    };
  }

  function buildFormTotalsSurfaceRuntimeSpec(spec, rawOptions) {
    var options = readOptions(rawOptions);
    return {
      root: asElement(options.root) || spec.root,
      selector: normalizeScalarText(options.selector || spec.selector),
      resolveRoot: readFunction(options.resolveRoot) || spec.resolveRoot,
      fallbackSelector: normalizeScalarText(options.fallbackSelector || spec.fallbackSelector),
      rowSelector: normalizeScalarText(options.rowSelector || spec.rowSelector),
      labelSelector: normalizeScalarText(options.labelSelector || spec.labelSelector) || "[data-surface-tax-label='1']",
      amountSelector: normalizeScalarText(options.amountSelector || spec.amountSelector) || "[data-surface-tax-amount='1']",
      replaceText: readFunction(options.replaceText) || spec.replaceText,
      formatAmount: readFunction(options.formatAmount) || spec.formatAmount,
      money: Object.assign({}, spec.money, readOptions(options.money)),
      rows: Object.assign({}, spec.rows, readOptions(options.rows)),
      beforeSync: readFunction(options.beforeSync) || spec.beforeSync,
      afterSync: readFunction(options.afterSync) || spec.afterSync,
      visibleWhen: readFunction(options.visibleWhen) || spec.visibleWhen,
    };
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

  function normalizeFormTotalsPayloadEnvelope(rawPayload) {
    if (rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)) {
      return {
        taxTotals: Object.prototype.hasOwnProperty.call(rawPayload, "taxTotals")
          ? rawPayload.taxTotals
          : rawPayload.tax_totals,
        fallbackAmount: Object.prototype.hasOwnProperty.call(rawPayload, "fallbackAmount")
          ? rawPayload.fallbackAmount
          : rawPayload.amountTax,
      };
    }
    return {
      taxTotals: rawPayload,
      fallbackAmount: 0,
    };
  }

  function buildFormTotalsSurfaceAdapter(rawSpec) {
    var spec = normalizeFormTotalsSurfaceSpec(rawSpec);

    function buildRuntime(rawOptions) {
      var runtimeSpec = buildFormTotalsSurfaceRuntimeSpec(spec, rawOptions);
      var root = resolveFormTotalsRoot(runtimeSpec);
      if (!(root instanceof HTMLElement)) {
        return null;
      }
      return buildFormTotalsSurface(Object.assign({}, runtimeSpec, { root: root }));
    }

    function clear(rawOptions) {
      var runtime = buildRuntime(rawOptions);
      if (!runtime) {
        return false;
      }
      runtime.clear();
      runtime.syncFallback(false);
      return true;
    }

    function sync(rawPayload, rawOptions) {
      var runtimeSpec = buildFormTotalsSurfaceRuntimeSpec(spec, rawOptions);
      var envelope = normalizeFormTotalsPayloadEnvelope(rawPayload);
      var visible = typeof runtimeSpec.visibleWhen === "function"
        ? !!runtimeSpec.visibleWhen(envelope, readOptions(rawOptions))
        : true;
      if (!visible) {
        clear(rawOptions);
        return false;
      }
      if (typeof runtimeSpec.beforeSync === "function") {
        runtimeSpec.beforeSync(envelope, readOptions(rawOptions));
      }
      var runtime = buildRuntime(rawOptions);
      if (!runtime) {
        return false;
      }
      var hasRows = runtime.sync(envelope.taxTotals, envelope.fallbackAmount, runtimeSpec.rows);
      if (typeof runtimeSpec.afterSync === "function") {
        runtimeSpec.afterSync({
          hasRows: hasRows,
          fallbackAmount: normalizeAmount(envelope.fallbackAmount),
          taxRows: collectFormTotalsTaxRows(envelope.taxTotals, runtimeSpec.rows),
        }, envelope, readOptions(rawOptions));
      }
      return hasRows;
    }

    function readState() {
      return {
        selector: spec.selector,
        rowSelector: spec.rowSelector,
        fallbackSelector: spec.fallbackSelector,
        labelSelector: spec.labelSelector,
        amountSelector: spec.amountSelector,
      };
    }

    return {
      clear: clear,
      readState: readState,
      sync: sync,
    };
  }

  layers.formatFormTotalsMonetaryValue = formatFormTotalsMonetaryValue;
  layers.normalizeFormTotalsPayload = normalizeFormTotalsPayload;
  layers.collectFormTotalsTaxRows = collectFormTotalsTaxRows;
  layers.resolveFormTotalsRoot = resolveFormTotalsRoot;
  layers.normalizeFormTotalsSurfaceSpec = normalizeFormTotalsSurfaceSpec;
  layers.buildFormTotalsSurface = buildFormTotalsSurface;
  layers.buildFormTotalsSurfaceAdapter = buildFormTotalsSurfaceAdapter;
})();
