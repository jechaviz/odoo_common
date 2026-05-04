(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before line picker surface.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before line picker surface."
      );
    }
    return candidate;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var registerManagedFormEnhancer = requireSurfaceLayerFunction(surfaceLayerApi, "registerManagedFormEnhancer");
  var AUTO_OPEN_DELAY_MS = 70;
  var AUTO_OPEN_TIMEOUT_MS = 3200;
  var ENTRY_PICKER_ENHANCER_KEY = "entryPicker";
  var DEFAULT_ADD_LINE_TRIGGER_SELECTOR = ".o_field_x2many_list_row_add a, .o_field_x2many_list_row_add button";
  var DEFAULT_EDITABLE_ROW_SELECTOR = "tr.o_data_row.o_selected_row, tr.o_selected_row";

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function isVisible(node) {
    if (!(node instanceof HTMLElement) || node.hidden) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    var rect = node.getBoundingClientRect();
    return styles.display !== "none" && styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function normalizeSelector(value) {
    return String(value || "").trim();
  }

  function escapeCssAttributeValue(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function queryVisibleElements(root, selector) {
    if (!(root instanceof HTMLElement) || !selector) {
      return [];
    }
    try {
      return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function (node) {
        return node instanceof HTMLElement && isVisible(node);
      });
    } catch (_error) {
      return [];
    }
  }

  function findFirstVisible(root, selectors) {
    for (var index = 0; index < selectors.length; index += 1) {
      var matches = queryVisibleElements(root, selectors[index]);
      if (matches.length) {
        return matches[0];
      }
    }
    return null;
  }

  function closestElement(node, selector) {
    if (!(node instanceof HTMLElement) || !selector) {
      return null;
    }
    try {
      var match = node.closest(selector);
      return match instanceof HTMLElement ? match : null;
    } catch (_error) {
      return null;
    }
  }

  function buildLinePickerConfig(rawConfig) {
    var raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    return {
      enhancerKey: ENTRY_PICKER_ENHANCER_KEY,
      x2manyField: String(raw.x2manyField || raw.fieldName || "").trim(),
      itemField: String(raw.itemField || raw.primaryField || "").trim(),
      fieldSelector: normalizeSelector(raw.fieldSelector),
      addLineSelector: normalizeSelector(raw.addLineSelector || raw.triggerSelector),
      editableRowSelector: normalizeSelector(raw.editableRowSelector || raw.rowSelector),
      itemInputSelector: normalizeSelector(raw.itemInputSelector || raw.inputSelector),
      autoOpenOnAdd: raw.autoOpenOnAdd !== false,
      autoOpenOnFocus: raw.autoOpenOnFocus !== false,
    };
  }

  function normalizePickerConfigs(rawConfigs) {
    var configs = Array.isArray(rawConfigs)
      ? rawConfigs
      : rawConfigs && typeof rawConfigs === "object"
      ? [rawConfigs]
      : [];
    return configs.filter(function (entry) {
      return entry && typeof entry === "object" && String(entry.enhancerKey || "").trim() === ENTRY_PICKER_ENHANCER_KEY;
    }).map(buildLinePickerConfig).filter(function (entry) {
      return !!(entry.itemField && (entry.x2manyField || entry.fieldSelector));
    });
  }

  function findX2manyField(formRoot, config) {
    var scopeRoot = asElement(formRoot);
    if (!(scopeRoot instanceof HTMLElement)) {
      return null;
    }
    var selectors = [];
    if (config.fieldSelector) {
      selectors.push(config.fieldSelector);
    }
    if (config.x2manyField) {
      var fieldName = escapeCssAttributeValue(config.x2manyField);
      selectors.push(
        '.o_field_x2many[name="' + fieldName + '"]',
        '.o_field_x2many[data-name="' + fieldName + '"]',
        '[name="' + fieldName + '"].o_field_x2many',
        '[data-name="' + fieldName + '"].o_field_x2many'
      );
    }
    return findFirstVisible(scopeRoot, selectors);
  }

  function resolveAddLineTrigger(fieldRoot, config) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return null;
    }
    var selector = config.addLineSelector || DEFAULT_ADD_LINE_TRIGGER_SELECTOR;
    var triggers = queryVisibleElements(fieldRoot, selector);
    if (config.addLineSelector) {
      return triggers[0] || null;
    }
    return triggers.length === 1 ? triggers[0] : null;
  }

  function resolveEditableRow(fieldRoot, config) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return null;
    }
    if (config.editableRowSelector) {
      return findFirstVisible(fieldRoot, [config.editableRowSelector]);
    }
    return findFirstVisible(fieldRoot, [DEFAULT_EDITABLE_ROW_SELECTOR]);
  }

  function findLinePickerInput(row, config) {
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    var selectors = [];
    if (config.itemInputSelector) {
      selectors.push(config.itemInputSelector);
    }
    if (config.itemField) {
      var itemField = escapeCssAttributeValue(config.itemField);
      selectors.push(
        '[name="' + itemField + '"] .o-autocomplete--input',
        '[data-name="' + itemField + '"] .o-autocomplete--input',
        'td[name="' + itemField + '"] .o-autocomplete--input',
        'td[data-name="' + itemField + '"] .o-autocomplete--input',
        '[name="' + itemField + '"] input[role="combobox"]',
        '[data-name="' + itemField + '"] input[role="combobox"]',
        '[name="' + itemField + '"] [role="combobox"]',
        '[data-name="' + itemField + '"] [role="combobox"]',
        'td[name="' + itemField + '"] input',
        'td[data-name="' + itemField + '"] input',
        'div[name="' + itemField + '"] input',
        'div[data-name="' + itemField + '"] input'
      );
    }
    return findFirstVisible(row, selectors);
  }

  function openLinePicker(inputNode) {
    var input = asElement(inputNode);
    if (!(input instanceof HTMLElement)) {
      return false;
    }
    var dropdownButton =
      (input.closest(".o_input_dropdown") instanceof HTMLElement
        ? input.closest(".o_input_dropdown").querySelector(".o_dropdown_button")
        : null) ||
      (input.parentElement instanceof HTMLElement ? input.parentElement.querySelector(".o_dropdown_button") : null);
    if (typeof input.focus === "function") {
      input.focus();
    }
    if (typeof input.click === "function") {
      input.click();
    }
    if (dropdownButton instanceof HTMLElement && typeof dropdownButton.click === "function") {
      window.setTimeout(function () {
        dropdownButton.click();
      }, 0);
    }
    return true;
  }

  function scheduleLinePickerAutoOpen(fieldRoot, config) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return;
    }
    if (fieldRoot._surfaceLinePickerTimer) {
      window.clearTimeout(fieldRoot._surfaceLinePickerTimer);
      fieldRoot._surfaceLinePickerTimer = 0;
    }
    var deadline = Date.now() + AUTO_OPEN_TIMEOUT_MS;
    function attemptOpen() {
      if (!(fieldRoot instanceof HTMLElement) || !fieldRoot.isConnected) {
        return;
      }
      var row = resolveEditableRow(fieldRoot, config);
      var picker = findLinePickerInput(row, config);
      if (picker instanceof HTMLElement) {
        if (row instanceof HTMLElement) {
          row.dataset.surfaceLinePickerOpened = "1";
        }
        openLinePicker(picker);
        return;
      }
      if (Date.now() >= deadline) {
        return;
      }
      window.requestAnimationFrame(attemptOpen);
    }
    fieldRoot._surfaceLinePickerTimer = window.setTimeout(function () {
      fieldRoot._surfaceLinePickerTimer = 0;
      attemptOpen();
    }, AUTO_OPEN_DELAY_MS);
  }

  function bindLinePickerField(fieldRoot, config) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return;
    }
    if (!fieldRoot._surfaceLinePickerBound) {
      fieldRoot._surfaceLinePickerBound = "1";
      fieldRoot.addEventListener("focusin", function (event) {
        if (!config.autoOpenOnFocus) {
          return;
        }
        var target = asElement(event.target);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var row = closestElement(target, config.editableRowSelector || "tr.o_data_row, tr.o_selected_row");
        if (!(row instanceof HTMLElement)) {
          return;
        }
        var picker = findLinePickerInput(row, config);
        if (!(picker instanceof HTMLElement) || picker !== target) {
          return;
        }
        if (row.dataset.surfaceLinePickerOpened === "1") {
          return;
        }
        row.dataset.surfaceLinePickerOpened = "1";
        window.setTimeout(function () {
          openLinePicker(picker);
        }, 0);
      }, true);
    }
    var addTrigger = resolveAddLineTrigger(fieldRoot, config);
    if (!(addTrigger instanceof HTMLElement)) {
      return;
    }
    if (addTrigger.dataset.surfaceLinePickerBound === "1") {
      return;
    }
    addTrigger.dataset.surfaceLinePickerBound = "1";
    addTrigger.addEventListener("click", function () {
      if (config.autoOpenOnAdd !== false) {
        scheduleLinePickerAutoOpen(fieldRoot, config);
      }
    }, true);
  }

  function syncManagedLinePickers(config, state) {
    var pickerConfigs = normalizePickerConfigs(config && config.managedFormEnhancers);
    if (!pickerConfigs.length || !(state && state.isForm && state.formRoot instanceof HTMLElement)) {
      return false;
    }
    pickerConfigs.forEach(function (pickerConfig) {
      var fieldRoot = findX2manyField(state.formRoot, pickerConfig);
      if (fieldRoot instanceof HTMLElement) {
        bindLinePickerField(fieldRoot, pickerConfig);
      }
    });
    return true;
  }

  Object.assign(surfaceLayerApi, {
    buildLinePickerConfig: buildLinePickerConfig,
    syncManagedLinePickers: syncManagedLinePickers,
  });
  registerManagedFormEnhancer({
    key: ENTRY_PICKER_ENHANCER_KEY,
    sync: syncManagedLinePickers,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
