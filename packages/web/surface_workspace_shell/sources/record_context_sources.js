(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};

  function normalizeRelationalText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeFieldNameList(values) {
    var normalized = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var fieldName = normalizeRelationalText(value);
      if (fieldName && normalized.indexOf(fieldName) === -1) {
        normalized.push(fieldName);
      }
    });
    return normalized;
  }

  function normalizeRelationalMany2oneValue(value) {
    var normalized = typeof surfaceLayerApi.normalizeMany2oneValue === "function"
      ? surfaceLayerApi.normalizeMany2oneValue(value) || {}
      : {};
    return {
      id: Number.parseInt(String(normalized.id || 0), 10) || 0,
      label: normalizeRelationalText(normalized.label || normalized.displayName || ""),
    };
  }

  async function searchReadFirst(ormService, modelName, domain, fields, options) {
    if (!ormService || typeof ormService.searchRead !== "function") {
      return null;
    }
    try {
      var rows = await ormService.searchRead(
        normalizeRelationalText(modelName),
        Array.isArray(domain) ? domain : [],
        Array.isArray(fields) ? fields : [],
        Object.assign({ limit: 1, order: "id asc" }, options && typeof options === "object" ? options : {})
      );
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    } catch (_error) {
      return null;
    }
  }

  async function readRelationalRecordById(ormService, modelName, recordId, fields, options) {
    var normalizedRecordId = Number.parseInt(String(recordId || 0), 10) || 0;
    if (!(normalizedRecordId > 0)) {
      return null;
    }
    return searchReadFirst(
      ormService,
      modelName,
      [["id", "=", normalizedRecordId]],
      fields,
      Object.assign({ limit: 1, order: "id asc" }, options && typeof options === "object" ? options : {})
    );
  }

  async function searchRelationalRecordByLabel(ormService, modelName, label, fields, options) {
    var normalizedLabel = normalizeRelationalText(label);
    if (!normalizedLabel) {
      return null;
    }
    var sharedOptions = Object.assign({ limit: 1, order: "id asc" }, options && typeof options === "object" ? options : {});
    var exactDisplay = await searchReadFirst(
      ormService,
      modelName,
      [["display_name", "=", normalizedLabel]],
      fields,
      sharedOptions
    );
    if (exactDisplay) {
      return exactDisplay;
    }
    return searchReadFirst(
      ormService,
      modelName,
      [["name", "=", normalizedLabel]],
      fields,
      sharedOptions
    );
  }

  function mergeRelationalFieldNames(configuredFields, requiredFields) {
    return normalizeFieldNameList([].concat(
      Array.isArray(configuredFields) ? configuredFields : [],
      Array.isArray(requiredFields) ? requiredFields : []
    ));
  }

  function joinRelationalTextParts(parts, separator) {
    return (Array.isArray(parts) ? parts : []).map(normalizeRelationalText).filter(Boolean).join(separator || " ");
  }

  function formatRelationalPartyName(record) {
    return normalizeRelationalText(record && (record.display_name || record.name || ""));
  }

  function formatRelationalPartyAddress(record) {
    if (!(record && typeof record === "object")) {
      return "";
    }
    var stateValue = normalizeRelationalMany2oneValue(record.state_id);
    var countryValue = normalizeRelationalMany2oneValue(record.country_id);
    var lineOne = joinRelationalTextParts([record.street, record.street2], " ");
    var lineTwo = joinRelationalTextParts([record.zip, record.city, stateValue.label], ", ");
    var lineThree = joinRelationalTextParts([countryValue.label], "");
    return [lineOne, lineTwo, lineThree].filter(Boolean).join("\n");
  }

  function readSurfaceRecordIdFromLocation() {
    var pathname = String(window.location.pathname || "");
    var segments = pathname.split("/").filter(Boolean);
    for (var index = segments.length - 1; index >= 0; index -= 1) {
      var segment = normalizeRelationalText(segments[index]);
      if (/^\d+$/.test(segment)) {
        return Number.parseInt(segment, 10) || 0;
      }
    }
    try {
      return Number.parseInt(
        String(new URL(String(window.location.href || ""), window.location.origin).searchParams.get("id") || 0),
        10
      ) || 0;
    } catch (_error) {
      return 0;
    }
  }

  function createRecordContextSourceHelpers(ormService) {
    return {
      normalizeText: normalizeRelationalText,
      normalizeMany2oneValue: normalizeRelationalMany2oneValue,
      mergeFieldNames: mergeRelationalFieldNames,
      formatPartyName: formatRelationalPartyName,
      formatPartyAddress: formatRelationalPartyAddress,
      readRecordIdFromLocation: readSurfaceRecordIdFromLocation,
      searchReadFirst: function (modelName, domain, fields, options) {
        return searchReadFirst(ormService, modelName, domain, fields, options);
      },
      readRecordById: function (modelName, recordId, fields, options) {
        return readRelationalRecordById(ormService, modelName, recordId, fields, options);
      },
      searchRecordByLabel: function (modelName, label, fields, options) {
        return searchRelationalRecordByLabel(ormService, modelName, label, fields, options);
      },
    };
  }

  function buildRecordContextSummarySlotRenderer(rawConfig) {
    var config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    var separator = typeof config.separator === "string" ? config.separator : " | ";
    var parts = Array.isArray(config.parts) ? config.parts.slice() : [];
    return function (data, _settings, fallback) {
      var normalizedData = data && typeof data === "object" ? data : {};
      var rendered = [];
      parts.forEach(function (part) {
        if (!(part && typeof part === "object")) {
          return;
        }
        var key = normalizeRelationalText(part.key);
        var value = key ? normalizedData[key] : "";
        if (typeof part.includeWhen === "function" && !part.includeWhen(value, normalizedData)) {
          return;
        }
        var text = typeof part.format === "function"
          ? part.format(value, normalizedData)
          : value;
        text = normalizeRelationalText(text);
        if (text) {
          rendered.push(text);
        }
      });
      return rendered.join(separator) || normalizeRelationalText(fallback);
    };
  }

  function buildRecordContextOverrideSlotRenderer(rawConfig) {
    var config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    var currentKey = normalizeRelationalText(config.currentKey);
    var defaultKey = normalizeRelationalText(config.defaultKey);
    var changedLabel = normalizeRelationalText(config.changedLabel);
    var inheritedLabel = normalizeRelationalText(config.inheritedLabel);
    var explicitLabel = normalizeRelationalText(config.explicitLabel);
    return function (data, _settings, fallback) {
      var normalizedData = data && typeof data === "object" ? data : {};
      var currentValue = normalizeRelationalText(currentKey ? normalizedData[currentKey] : "");
      var defaultValue = normalizeRelationalText(defaultKey ? normalizedData[defaultKey] : "");
      if (currentValue && defaultValue && currentValue !== defaultValue) {
        return changedLabel || normalizeRelationalText(fallback);
      }
      if (defaultValue) {
        return inheritedLabel || normalizeRelationalText(fallback);
      }
      if (currentValue) {
        return explicitLabel || normalizeRelationalText(fallback);
      }
      return normalizeRelationalText(fallback);
    };
  }

  function buildRelationalRecordContextSignatureParts(spec, settings, fieldReader) {
    var formRoot = settings.formRoot instanceof HTMLElement ? settings.formRoot : null;
    var signatureParts = [
      String(
        (typeof spec.recordIdResolver === "function"
          ? spec.recordIdResolver(settings)
          : readSurfaceRecordIdFromLocation()) || 0
      ),
    ];
    normalizeFieldNameList(spec.signatureFieldNames).forEach(function (fieldName) {
      signatureParts.push(fieldReader(formRoot, [fieldName]));
    });
    return signatureParts;
  }

  function buildRelationalRecordContextAdapter(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var buildData = typeof spec.buildData === "function" ? spec.buildData : null;
    var fieldReader = typeof spec.fieldReader === "function"
      ? spec.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    return surfaceLayerApi.buildRecordContextPanelConfig({
      cacheScopeKey: spec.cacheScopeKey,
      panelSelector: spec.panelSelector,
      selectors: spec.selectors,
      fallbacks: spec.fallbacks,
      slotRenderers: spec.slotRenderers,
      fieldReader: fieldReader,
      signaturePartsResolver: function (settings) {
        return buildRelationalRecordContextSignatureParts(spec, settings, fieldReader);
      },
      dataResolver: async function (settings) {
        if (typeof buildData !== "function" || typeof surfaceLayerApi.resolveOdooService !== "function") {
          return {};
        }
        var ormService = await surfaceLayerApi.resolveOdooService("orm");
        if (!ormService || typeof ormService.searchRead !== "function") {
          return {};
        }
        return buildData({
          spec: spec,
          settings: settings,
          ormService: ormService,
          formRoot: settings.formRoot instanceof HTMLElement ? settings.formRoot : null,
          fieldReader: fieldReader,
          recordId: typeof spec.recordIdResolver === "function"
            ? Number.parseInt(String(spec.recordIdResolver(settings) || 0), 10) || 0
            : readSurfaceRecordIdFromLocation(),
          helpers: createRecordContextSourceHelpers(ormService),
        });
      },
    });
  }

  Object.assign(surfaceLayerApi, {
    buildRelationalRecordContextAdapter: buildRelationalRecordContextAdapter,
    buildRecordContextSummarySlotRenderer: buildRecordContextSummarySlotRenderer,
    buildRecordContextOverrideSlotRenderer: buildRecordContextOverrideSlotRenderer,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
