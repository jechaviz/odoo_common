(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace line picker.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before surface workspace line picker."
      );
    }
    return candidate;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var normalizeSurfaceLabel = requireSurfaceLayerFunction(surfaceLayerApi, "normalizeLabel");
  var registerManagedFormEnhancer = requireSurfaceLayerFunction(surfaceLayerApi, "registerManagedFormEnhancer");
  var AUTO_OPEN_DELAY_MS = 70;
  var AUTO_OPEN_TIMEOUT_MS = 3200;
  var ENTRY_PICKER_ENHANCER_KEY = "entryPicker";
  var DEFAULT_ENTRY_TRIGGER_LABELS = [
    "Agregar una línea",
    "Agregar una linea",
    "Add a line",
    "Add line",
  ];

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

  function normalizeLabel(value) {
    return String(normalizeSurfaceLabel(value) || "");
  }

  function readText(node) {
    return normalizeLabel(node instanceof HTMLElement ? node.textContent || "" : "");
  }

  function buildLinePickerConfig(rawConfig) {
    var raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    var addLineLabels = (Array.isArray(raw.addLineLabels) ? raw.addLineLabels : [])
      .map(function (label) {
        return String(label || "").trim();
      })
      .filter(Boolean);
    if (!addLineLabels.length) {
      addLineLabels = DEFAULT_ENTRY_TRIGGER_LABELS.slice();
    }
    return {
      enhancerKey: ENTRY_PICKER_ENHANCER_KEY,
      x2manyField: String(raw.x2manyField || raw.fieldName || "").trim(),
      itemField: String(raw.itemField || raw.primaryField || "").trim(),
      addLineLabels: addLineLabels,
      fieldSelector: String(raw.fieldSelector || "").trim(),
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
      return !!entry.itemField;
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
      selectors.push(
        ".o_field_x2many[name='" + config.x2manyField + "']",
        ".o_field_x2many[data-name='" + config.x2manyField + "']",
        "[name='" + config.x2manyField + "'].o_field_x2many",
        "[data-name='" + config.x2manyField + "'].o_field_x2many"
      );
    }
    if (!selectors.length) {
      selectors.push(".o_field_x2many");
    }
    for (var index = 0; index < selectors.length; index += 1) {
      var match = scopeRoot.querySelector(selectors[index]);
      if (match instanceof HTMLElement && isVisible(match)) {
        return match;
      }
    }
    return null;
  }

  function resolveAddLineTrigger(fieldRoot, config) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return null;
    }
    var triggers = Array.prototype.slice.call(
      fieldRoot.querySelectorAll(".o_field_x2many_list_row_add a, .o_field_x2many_list_row_add button")
    ).filter(function (node) {
      return node instanceof HTMLElement && isVisible(node);
    });
    if (!triggers.length) {
      return null;
    }
    var preferredLabels = config.addLineLabels.map(normalizeLabel);
    var preferredTrigger = triggers.find(function (node) {
      return preferredLabels.indexOf(readText(node)) >= 0;
    });
    if (preferredTrigger instanceof HTMLElement) {
      return preferredTrigger;
    }
    var fallbackTrigger = triggers.find(function (node) {
      var label = readText(node);
      return label.indexOf("agregar una linea") >= 0 ||
        label.indexOf("agregar linea") >= 0 ||
        label.indexOf("add a line") >= 0 ||
        label.indexOf("add line") >= 0;
    });
    return fallbackTrigger instanceof HTMLElement ? fallbackTrigger : triggers[0];
  }

  function resolveEditableRow(fieldRoot) {
    if (!(fieldRoot instanceof HTMLElement)) {
      return null;
    }
    var candidates = [
      "tr.o_data_row.o_selected_row",
      "tr.o_selected_row",
      "tr.o_data_row:last-of-type",
    ];
    for (var index = 0; index < candidates.length; index += 1) {
      var row = fieldRoot.querySelector(candidates[index]);
      if (row instanceof HTMLElement && isVisible(row)) {
        return row;
      }
    }
    return null;
  }

  function findLinePickerInput(row, config) {
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    var selectors = [];
    if (config.itemField) {
      selectors.push(
        "[name='" + config.itemField + "'] .o-autocomplete--input",
        "[data-name='" + config.itemField + "'] .o-autocomplete--input",
        "td[name='" + config.itemField + "'] .o-autocomplete--input",
        "td[data-name='" + config.itemField + "'] .o-autocomplete--input",
        "[name='" + config.itemField + "'] input[role='combobox']",
        "[data-name='" + config.itemField + "'] input[role='combobox']",
        "[name='" + config.itemField + "'] [role='combobox']",
        "[data-name='" + config.itemField + "'] [role='combobox']",
        "td[name='" + config.itemField + "'] input",
        "td[data-name='" + config.itemField + "'] input",
        "div[name='" + config.itemField + "'] input",
        "div[data-name='" + config.itemField + "'] input"
      );
    }
    selectors.push(".o-autocomplete--input[role='combobox']", "input[role='combobox']");
    for (var index = 0; index < selectors.length; index += 1) {
      var input = row.querySelector(selectors[index]);
      if (input instanceof HTMLElement && isVisible(input)) {
        return input;
      }
    }
    return null;
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
      var row = resolveEditableRow(fieldRoot);
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
        var row = target.closest("tr.o_data_row, tr.o_selected_row");
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
