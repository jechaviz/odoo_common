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
    return function (data, _runtimeContext, fallback) {
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
    return function (data, _runtimeContext, fallback) {
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

  function normalizePartnerCommercialFieldMap(rawFieldMap, defaults) {
    var source = rawFieldMap && typeof rawFieldMap === "object" ? rawFieldMap : {};
    var normalized = Object.create(null);
    Object.keys(defaults || {}).forEach(function (key) {
      var fieldName = normalizeRelationalText(source[key] || defaults[key]);
      normalized[key] = fieldName;
    });
    return normalized;
  }

  function buildPartnerCommercialRecordFields(recordFieldMap, extraFields) {
    return mergeRelationalFieldNames(
      extraFields,
      Object.keys(recordFieldMap || {}).map(function (key) {
        return recordFieldMap[key];
      }).filter(Boolean)
    );
  }

  function buildPartnerCommercialPartnerFields(partnerFieldMap, extraFields) {
    return mergeRelationalFieldNames(
      extraFields,
      [
        "commercial_partner_id",
        "display_name",
        "name",
        "street",
        "street2",
        "city",
        "zip",
        "state_id",
        "country_id",
      ].concat(
        Object.keys(partnerFieldMap || {}).map(function (key) {
          return partnerFieldMap[key];
        }).filter(Boolean)
      )
    );
  }

  function readMany2oneFieldValue(record, fieldName, helpers) {
    if (!fieldName) {
      return { id: 0, label: "" };
    }
    return helpers.normalizeMany2oneValue(record && record[fieldName]);
  }

  function readScalarFieldValue(record, fieldName) {
    return fieldName ? normalizeRelationalText(record && record[fieldName]) : "";
  }

  async function resolvePartnerCommercialRecordContextData(spec, runtimeContext, fieldReader) {
    if (typeof surfaceLayerApi.resolveOdooService !== "function") {
      return {};
    }
    var ormService = await surfaceLayerApi.resolveOdooService("orm");
    if (!ormService || typeof ormService.searchRead !== "function") {
      return {};
    }

    var helpers = createRecordContextSourceHelpers(ormService);
    var recordFieldMap = normalizePartnerCommercialFieldMap(spec.recordFieldMap, {
      commercialPartner: "commercial_partner_id",
      billingPartner: "partner_id",
      shippingPartner: "partner_shipping_id",
      currentCondition: "",
    });
    var partnerFieldMap = normalizePartnerCommercialFieldMap(spec.partnerFieldMap, {
      identifier: "vat",
      reference: "property_product_pricelist",
      defaultCondition: "property_payment_term_id",
    });
    var formFieldMap = normalizePartnerCommercialFieldMap(spec.formFieldMap, {
      billing: "partner_id",
      shipping: "partner_shipping_id",
      currentCondition: "",
    });
    var recordFields = buildPartnerCommercialRecordFields(recordFieldMap, spec.recordFields);
    var partnerFields = buildPartnerCommercialPartnerFields(partnerFieldMap, spec.partnerFields);
    var recordId = runtimeContext && runtimeContext.recordId
      ? runtimeContext.recordId
      : resolveRelationalRecordContextRecordId(spec, runtimeContext);
    var formRoot = runtimeContext && runtimeContext.formRoot instanceof HTMLElement
      ? runtimeContext.formRoot
      : null;

    var recordRow = null;
    if (spec.recordModel && recordId > 0) {
      recordRow = await helpers.readRecordById(
        String(spec.recordModel || "").trim(),
        recordId,
        recordFields,
        { limit: 1, order: "id asc" }
      );
    }

    var commercialValue = readMany2oneFieldValue(recordRow, recordFieldMap.commercialPartner, helpers);
    var billingValue = readMany2oneFieldValue(recordRow, recordFieldMap.billingPartner, helpers);
    var shippingValue = readMany2oneFieldValue(recordRow, recordFieldMap.shippingPartner, helpers);
    var currentConditionValue = readMany2oneFieldValue(recordRow, recordFieldMap.currentCondition, helpers);
    var billingLabel = formFieldMap.billing
      ? fieldReader(formRoot, [formFieldMap.billing])
      : "";
    var shippingLabel = formFieldMap.shipping
      ? fieldReader(formRoot, [formFieldMap.shipping])
      : "";
    var currentConditionLabel = currentConditionValue.label || (
      formFieldMap.currentCondition
        ? fieldReader(formRoot, [formFieldMap.currentCondition])
        : ""
    );

    var commercialPartner = commercialValue.id > 0
      ? await helpers.readRecordById("res.partner", commercialValue.id, partnerFields, { limit: 1, order: "id asc" })
      : null;
    var billingPartner = billingValue.id > 0
      ? await helpers.readRecordById("res.partner", billingValue.id, partnerFields, { limit: 1, order: "id asc" })
      : null;
    var shippingPartner = shippingValue.id > 0
      ? await helpers.readRecordById("res.partner", shippingValue.id, partnerFields, { limit: 1, order: "id asc" })
      : null;

    if (!commercialPartner) {
      var partnerRow = await helpers.searchRecordByLabel("res.partner", billingLabel, partnerFields, { limit: 1, order: "id asc" });
      var commercialFallback = helpers.normalizeMany2oneValue(partnerRow && partnerRow.commercial_partner_id);
      commercialPartner = commercialFallback.id > 0
        ? await helpers.readRecordById("res.partner", commercialFallback.id, partnerFields, { limit: 1, order: "id asc" })
        : partnerRow;
      billingPartner = billingPartner || partnerRow;
    }
    if (!billingPartner && commercialPartner) {
      billingPartner = commercialPartner;
    }
    if (!shippingPartner) {
      shippingPartner = await helpers.searchRecordByLabel("res.partner", shippingLabel, partnerFields, { limit: 1, order: "id asc" });
    }

    var referenceValue = readMany2oneFieldValue(commercialPartner, partnerFieldMap.reference, helpers);
    var defaultConditionValue = readMany2oneFieldValue(commercialPartner, partnerFieldMap.defaultCondition, helpers);
    var baseData = {
      primaryName: helpers.formatPartyName(billingPartner),
      primaryDetails: helpers.formatPartyAddress(billingPartner),
      secondaryName: helpers.formatPartyName(shippingPartner),
      secondaryDetails: helpers.formatPartyAddress(shippingPartner),
      identifier: readScalarFieldValue(commercialPartner, partnerFieldMap.identifier),
      reference: referenceValue.label || "",
      referenceId: referenceValue.id || 0,
      condition: currentConditionLabel || defaultConditionValue.label || "",
      conditionId: currentConditionValue.id || 0,
      defaultConditionLabel: defaultConditionValue.label || "",
      defaultConditionId: defaultConditionValue.id || 0,
      commercialPartnerId: commercialValue.id || 0,
      billingPartnerId: billingValue.id || 0,
      shippingPartnerId: shippingValue.id || 0,
    };

    if (typeof spec.enrichData !== "function") {
      return baseData;
    }
    var extraData = await spec.enrichData({
      spec: spec,
      runtimeContext: runtimeContext,
      ormService: ormService,
      helpers: helpers,
      recordId: recordId,
      recordRow: recordRow,
      formRoot: formRoot,
      fieldReader: fieldReader,
      recordFieldMap: recordFieldMap,
      partnerFieldMap: partnerFieldMap,
      formFieldMap: formFieldMap,
      commercialPartner: commercialPartner,
      billingPartner: billingPartner,
      shippingPartner: shippingPartner,
      referenceValue: referenceValue,
      currentConditionValue: currentConditionValue,
      defaultConditionValue: defaultConditionValue,
      baseData: baseData,
    });
    return extraData && typeof extraData === "object"
      ? Object.assign({}, baseData, extraData)
      : baseData;
  }

  function resolveRelationalRecordContextRecordId(spec, runtimeContext) {
    if (typeof spec.recordIdResolver === "function") {
      try {
        return Number.parseInt(
          String(spec.recordIdResolver(
            runtimeContext && runtimeContext.settings ? runtimeContext.settings : {},
            runtimeContext
          ) || 0),
          10
        ) || 0;
      } catch (_error) {
        return 0;
      }
    }
    return readSurfaceRecordIdFromLocation();
  }

  function buildRelationalRecordContextWatch(spec) {
    var watch = spec.watch && typeof spec.watch === "object" ? spec.watch : {};
    var values = [];
    (Array.isArray(watch.values) ? watch.values : []).forEach(function (entry) {
      if (entry !== null && entry !== undefined) {
        values.push(entry);
      }
    });
    return {
      recordId: Object.prototype.hasOwnProperty.call(watch, "recordId")
        ? watch.recordId
        : spec.includeRecordIdInWatch === false
        ? false
        : true,
      fields: mergeRelationalFieldNames(
        watch.fields || watch.fieldNames,
        spec.watchFieldNames
      ),
      values: values,
      partsResolver: typeof watch.partsResolver === "function" ? watch.partsResolver : null,
    };
  }

  async function resolveRelationalRecordContextData(spec, runtimeContext, fieldReader) {
    var buildData = typeof spec.buildData === "function" ? spec.buildData : null;
    if (typeof buildData !== "function" || typeof surfaceLayerApi.resolveOdooService !== "function") {
      return {};
    }
    var ormService = await surfaceLayerApi.resolveOdooService("orm");
    if (!ormService || typeof ormService.searchRead !== "function") {
      return {};
    }
    return buildData({
      spec: spec,
      config: runtimeContext && runtimeContext.settings ? runtimeContext.settings : {},
      settings: runtimeContext && runtimeContext.settings ? runtimeContext.settings : {},
      state: runtimeContext && runtimeContext.state ? runtimeContext.state : {},
      source: runtimeContext && runtimeContext.source ? runtimeContext.source : null,
      ormService: ormService,
      formRoot: runtimeContext && runtimeContext.formRoot instanceof HTMLElement ? runtimeContext.formRoot : null,
      fieldReader: fieldReader,
      readField: runtimeContext && typeof runtimeContext.readField === "function"
        ? runtimeContext.readField
        : function (names) {
            return fieldReader(
              runtimeContext && runtimeContext.formRoot instanceof HTMLElement ? runtimeContext.formRoot : null,
              Array.isArray(names) ? names : [names]
            );
          },
      readFields: runtimeContext && typeof runtimeContext.readFields === "function"
        ? runtimeContext.readFields
        : function (names) {
            return normalizeFieldNameList(names).map(function (fieldName) {
              return {
                name: fieldName,
                value: fieldReader(
                  runtimeContext && runtimeContext.formRoot instanceof HTMLElement ? runtimeContext.formRoot : null,
                  [fieldName]
                ),
              };
            });
          },
      recordId: runtimeContext && runtimeContext.recordId
        ? runtimeContext.recordId
        : resolveRelationalRecordContextRecordId(spec, runtimeContext),
      helpers: createRecordContextSourceHelpers(ormService),
    });
  }

  function buildRelationalRecordContextSource(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var fieldReader = typeof spec.fieldReader === "function"
      ? spec.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    var sourceConfig = {
      cacheScopeKey: spec.cacheScopeKey,
      recordIdResolver: function (runtimeContext) {
        return resolveRelationalRecordContextRecordId(spec, runtimeContext);
      },
      watch: buildRelationalRecordContextWatch(spec),
      load: function (runtimeContext) {
        return resolveRelationalRecordContextData(spec, runtimeContext, fieldReader);
      },
    };
    return typeof surfaceLayerApi.buildRecordContextSource === "function"
      ? surfaceLayerApi.buildRecordContextSource(sourceConfig)
      : sourceConfig;
  }

  function buildRelationalRecordContextAdapter(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var fieldReader = typeof spec.fieldReader === "function"
      ? spec.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    return surfaceLayerApi.buildRecordContextPanelConfig({
      cacheScopeKey: spec.cacheScopeKey,
      panelSelector: spec.panelSelector,
      slots: spec.slots,
      fieldReader: fieldReader,
      source: buildRelationalRecordContextSource(
        Object.assign({}, spec, {
          fieldReader: fieldReader,
        })
      ),
    });
  }

  function buildPartnerCommercialRecordContextSource(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var fieldReader = typeof spec.fieldReader === "function"
      ? spec.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    var formFieldMap = normalizePartnerCommercialFieldMap(spec.formFieldMap, {
      billing: "partner_id",
      shipping: "partner_shipping_id",
      currentCondition: "",
    });
    var sourceConfig = {
      cacheScopeKey: spec.cacheScopeKey,
      recordIdResolver: function (runtimeContext) {
        return resolveRelationalRecordContextRecordId(spec, runtimeContext);
      },
      watch: {
        recordId: spec.includeRecordIdInWatch === false ? false : true,
        fields: mergeRelationalFieldNames(
          spec.watchFieldNames,
          [formFieldMap.billing, formFieldMap.shipping, formFieldMap.currentCondition]
        ),
        values: [],
        partsResolver: spec.watch && typeof spec.watch === "object" && typeof spec.watch.partsResolver === "function"
          ? spec.watch.partsResolver
          : null,
      },
      load: function (runtimeContext) {
        return resolvePartnerCommercialRecordContextData(spec, runtimeContext, fieldReader);
      },
    };
    return typeof surfaceLayerApi.buildRecordContextSource === "function"
      ? surfaceLayerApi.buildRecordContextSource(sourceConfig)
      : sourceConfig;
  }

  function buildPartnerCommercialRecordContextAdapter(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var fieldReader = typeof spec.fieldReader === "function"
      ? spec.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    return surfaceLayerApi.buildRecordContextPanelConfig({
      cacheScopeKey: spec.cacheScopeKey,
      panelSelector: spec.panelSelector,
      slots: spec.slots,
      fieldReader: fieldReader,
      source: buildPartnerCommercialRecordContextSource(
        Object.assign({}, spec, {
          fieldReader: fieldReader,
        })
      ),
    });
  }

  Object.assign(surfaceLayerApi, {
    createRecordContextSourceHelpers: createRecordContextSourceHelpers,
    buildRelationalRecordContextSource: buildRelationalRecordContextSource,
    buildRelationalRecordContextAdapter: buildRelationalRecordContextAdapter,
    buildPartnerCommercialRecordContextSource: buildPartnerCommercialRecordContextSource,
    buildPartnerCommercialRecordContextAdapter: buildPartnerCommercialRecordContextAdapter,
    buildRecordContextSummarySlotRenderer: buildRecordContextSummarySlotRenderer,
    buildRecordContextOverrideSlotRenderer: buildRecordContextOverrideSlotRenderer,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
