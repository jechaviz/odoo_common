(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    var api = window.OdooSurfaceLayers;
    if (!(api && typeof api === "object")) {
      throw new Error("OdooSurfaceLayers runtime is required before record_context_sources.js.");
    }
    return api;
  }

  function requireSurfaceLayerMethod(api, methodName) {
    var method = api && api[methodName];
    if (typeof method !== "function") {
      throw new Error("OdooSurfaceLayers." + methodName + " is required by record_context_sources.js.");
    }
    return method;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var normalizeMany2oneValue = requireSurfaceLayerMethod(surfaceLayerApi, "normalizeMany2oneValue");
  var resolveOdooService = requireSurfaceLayerMethod(surfaceLayerApi, "resolveOdooService");
  var buildRecordContextSource = requireSurfaceLayerMethod(surfaceLayerApi, "buildRecordContextSource");
  var buildRecordContextPanelConfig = requireSurfaceLayerMethod(surfaceLayerApi, "buildRecordContextPanelConfig");
  var readFieldText = requireSurfaceLayerMethod(surfaceLayerApi, "readFieldText");

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
    var normalized = normalizeMany2oneValue(value) || {};
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

  function normalizeRelationalFieldAliasMap(rawFieldMap, defaults) {
    var source = rawFieldMap && typeof rawFieldMap === "object" ? rawFieldMap : {};
    var normalized = Object.create(null);
    Object.keys(defaults || {}).forEach(function (key) {
      var fieldName = normalizeRelationalText(source[key] || defaults[key]);
      normalized[key] = fieldName;
    });
    return normalized;
  }

  function normalizeRelationalEntitySchema(rawFieldMap, defaults, extraFields, requiredFields) {
    var aliases = normalizeRelationalFieldAliasMap(rawFieldMap, defaults);
    var aliasFields = Object.keys(aliases).map(function (key) {
      return aliases[key];
    }).filter(Boolean);
    return {
      aliases: aliases,
      fields: mergeRelationalFieldNames(
        extraFields,
        [].concat(Array.isArray(requiredFields) ? requiredFields : [], aliasFields)
      ),
    };
  }

  function normalizeRelationalWatchSchema(rawWatch, fallbackFields, includeRecordIdByDefault) {
    var watch = rawWatch && typeof rawWatch === "object" ? rawWatch : {};
    var values = [];
    (Array.isArray(watch.values) ? watch.values : []).forEach(function (entry) {
      if (entry !== null && entry !== undefined) {
        values.push(entry);
      }
    });
    return {
      recordId: Object.prototype.hasOwnProperty.call(watch, "recordId")
        ? watch.recordId
        : includeRecordIdByDefault,
      fields: mergeRelationalFieldNames(
        watch.fields || watch.fieldNames,
        fallbackFields
      ),
      values: values,
      partsResolver: typeof watch.partsResolver === "function" ? watch.partsResolver : null,
    };
  }

  function normalizeRelationalSourceSchema(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    return {
      spec: spec,
      cacheScopeKey: spec.cacheScopeKey,
      fieldReader: typeof spec.fieldReader === "function"
        ? spec.fieldReader
        : readFieldText,
      buildData: typeof spec.buildData === "function" ? spec.buildData : null,
      watch: normalizeRelationalWatchSchema(
        spec.watch,
        spec.watchFieldNames,
        spec.includeRecordIdInWatch === false ? false : true
      ),
      resolveRecordId: function (runtimeContext) {
        return resolveRelationalRecordContextRecordId(spec, runtimeContext);
      },
    };
  }

  function normalizePartnerCommercialSourceSchema(rawSpec) {
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var recordSchema = normalizeRelationalEntitySchema(
      spec.recordFieldMap,
      {
        commercialPartner: "commercial_partner_id",
        billingPartner: "partner_id",
        shippingPartner: "partner_shipping_id",
        currentCondition: "",
      },
      spec.recordFields,
      []
    );
    var partnerSchema = normalizeRelationalEntitySchema(
      spec.partnerFieldMap,
      {
        identifier: "vat",
        reference: "property_product_pricelist",
        defaultCondition: "property_payment_term_id",
      },
      spec.partnerFields,
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
      ]
    );
    var formAliases = normalizeRelationalFieldAliasMap(
      spec.formFieldMap,
      {
        billing: "partner_id",
        shipping: "partner_shipping_id",
        currentCondition: "",
      }
    );
    var watchFields = mergeRelationalFieldNames(
      spec.watchFieldNames,
      [formAliases.billing, formAliases.shipping, formAliases.currentCondition]
    );
    return {
      spec: spec,
      cacheScopeKey: spec.cacheScopeKey,
      fieldReader: typeof spec.fieldReader === "function"
        ? spec.fieldReader
        : readFieldText,
      recordModel: normalizeRelationalText(spec.recordModel),
      enrichData: typeof spec.enrichData === "function" ? spec.enrichData : null,
      resolvePartnerRecord: typeof spec.resolvePartnerRecord === "function" ? spec.resolvePartnerRecord : null,
      record: recordSchema,
      partner: partnerSchema,
      form: {
        aliases: formAliases,
        watchFields: watchFields,
      },
      watch: normalizeRelationalWatchSchema(
        spec.watch,
        watchFields,
        spec.includeRecordIdInWatch === false ? false : true
      ),
      resolveRecordId: function (runtimeContext) {
        return resolveRelationalRecordContextRecordId(spec, runtimeContext);
      },
    };
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

  function selectPartnerCommercialResolver(sourceSchema, role) {
    var spec = sourceSchema && sourceSchema.spec && typeof sourceSchema.spec === "object"
      ? sourceSchema.spec
      : {};
    var resolverName = role === "commercial"
      ? "resolveCommercialPartner"
      : role === "billing"
      ? "resolveBillingPartner"
      : role === "shipping"
      ? "resolveShippingPartner"
      : "";
    return resolverName && typeof spec[resolverName] === "function"
      ? spec[resolverName]
      : sourceSchema && typeof sourceSchema.resolvePartnerRecord === "function"
      ? sourceSchema.resolvePartnerRecord
      : null;
  }

  async function resolvePartnerCommercialRecordFromHook(sourceSchema, role, context) {
    var resolver = selectPartnerCommercialResolver(sourceSchema, role);
    if (typeof resolver !== "function") {
      return null;
    }
    var helpers = context && context.helpers;
    var partnerFields = Array.isArray(context && context.partnerFields) ? context.partnerFields : [];
    try {
      var resolved = resolver(Object.assign({}, context || {}, { role: role }));
      if (resolved && typeof resolved.then === "function") {
        resolved = await resolved;
      }
      if (typeof resolved === "number" || /^\d+$/.test(String(resolved || "").trim())) {
        return helpers.readRecordById("res.partner", resolved, partnerFields, { limit: 1, order: "id asc" });
      }
      if (Array.isArray(resolved)) {
        var many2oneArrayValue = helpers.normalizeMany2oneValue(resolved);
        return many2oneArrayValue.id > 0
          ? helpers.readRecordById("res.partner", many2oneArrayValue.id, partnerFields, { limit: 1, order: "id asc" })
          : null;
      }
      if (resolved && typeof resolved === "object") {
        var hasLoadedField = partnerFields.some(function (fieldName) {
          return Object.prototype.hasOwnProperty.call(resolved, fieldName);
        });
        if (hasLoadedField || resolved.display_name || resolved.name) {
          return resolved;
        }
        var many2oneObjectValue = helpers.normalizeMany2oneValue(resolved);
        return many2oneObjectValue.id > 0
          ? helpers.readRecordById("res.partner", many2oneObjectValue.id, partnerFields, { limit: 1, order: "id asc" })
          : null;
      }
    } catch (_error) {
      return null;
    }
    return null;
  }

  async function resolvePartnerCommercialRecordContextData(sourceSchema, runtimeContext) {
    var ormService = await resolveOdooService("orm");
    if (!ormService || typeof ormService.searchRead !== "function") {
      return {};
    }

    var helpers = createRecordContextSourceHelpers(ormService);
    var fieldReader = sourceSchema && typeof sourceSchema.fieldReader === "function"
      ? sourceSchema.fieldReader
      : readFieldText;
    var spec = sourceSchema && sourceSchema.spec && typeof sourceSchema.spec === "object"
      ? sourceSchema.spec
      : {};
    var recordFieldMap = sourceSchema && sourceSchema.record && sourceSchema.record.aliases
      ? sourceSchema.record.aliases
      : Object.create(null);
    var partnerFieldMap = sourceSchema && sourceSchema.partner && sourceSchema.partner.aliases
      ? sourceSchema.partner.aliases
      : Object.create(null);
    var formFieldMap = sourceSchema && sourceSchema.form && sourceSchema.form.aliases
      ? sourceSchema.form.aliases
      : Object.create(null);
    var recordFields = sourceSchema && sourceSchema.record && Array.isArray(sourceSchema.record.fields)
      ? sourceSchema.record.fields
      : [];
    var partnerFields = sourceSchema && sourceSchema.partner && Array.isArray(sourceSchema.partner.fields)
      ? sourceSchema.partner.fields
      : [];
    var recordId = runtimeContext && runtimeContext.recordId
      ? runtimeContext.recordId
      : sourceSchema.resolveRecordId(runtimeContext);
    var formRoot = runtimeContext && runtimeContext.formRoot instanceof HTMLElement
      ? runtimeContext.formRoot
      : null;

    var recordRow = null;
    if (sourceSchema.recordModel && recordId > 0) {
      recordRow = await helpers.readRecordById(
        sourceSchema.recordModel,
        recordId,
        recordFields,
        { limit: 1, order: "id asc" }
      );
    }

    var commercialValue = readMany2oneFieldValue(recordRow, recordFieldMap.commercialPartner, helpers);
    var billingValue = readMany2oneFieldValue(recordRow, recordFieldMap.billingPartner, helpers);
    var shippingValue = readMany2oneFieldValue(recordRow, recordFieldMap.shippingPartner, helpers);
    var currentConditionValue = readMany2oneFieldValue(recordRow, recordFieldMap.currentCondition, helpers);
    var billingFormValue = formFieldMap.billing
      ? fieldReader(formRoot, [formFieldMap.billing])
      : "";
    var shippingFormValue = formFieldMap.shipping
      ? fieldReader(formRoot, [formFieldMap.shipping])
      : "";
    var currentConditionText = currentConditionValue.label || (
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
      commercialPartner = await resolvePartnerCommercialRecordFromHook(sourceSchema, "commercial", {
        spec: spec,
        schema: sourceSchema,
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
        partnerFields: partnerFields,
        billingFormValue: billingFormValue,
        shippingFormValue: shippingFormValue,
      });
    }
    if (!billingPartner) {
      billingPartner = await resolvePartnerCommercialRecordFromHook(sourceSchema, "billing", {
        spec: spec,
        schema: sourceSchema,
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
        partnerFields: partnerFields,
        billingFormValue: billingFormValue,
        shippingFormValue: shippingFormValue,
        commercialPartner: commercialPartner,
      });
    }
    if (!shippingPartner) {
      shippingPartner = await resolvePartnerCommercialRecordFromHook(sourceSchema, "shipping", {
        spec: spec,
        schema: sourceSchema,
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
        partnerFields: partnerFields,
        billingFormValue: billingFormValue,
        shippingFormValue: shippingFormValue,
        commercialPartner: commercialPartner,
        billingPartner: billingPartner,
      });
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
      condition: currentConditionText || defaultConditionValue.label || "",
      conditionId: currentConditionValue.id || 0,
      defaultConditionLabel: defaultConditionValue.label || "",
      defaultConditionId: defaultConditionValue.id || 0,
      commercialPartnerId: commercialValue.id || Number.parseInt(String(commercialPartner && commercialPartner.id || 0), 10) || 0,
      billingPartnerId: billingValue.id || Number.parseInt(String(billingPartner && billingPartner.id || 0), 10) || 0,
      shippingPartnerId: shippingValue.id || Number.parseInt(String(shippingPartner && shippingPartner.id || 0), 10) || 0,
    };

    if (typeof sourceSchema.enrichData !== "function") {
      return baseData;
    }
    var extraData = await sourceSchema.enrichData({
      spec: spec,
      schema: sourceSchema,
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

  async function resolveRelationalRecordContextData(sourceSchema, runtimeContext) {
    var buildData = sourceSchema && typeof sourceSchema.buildData === "function"
      ? sourceSchema.buildData
      : null;
    var fieldReader = sourceSchema && typeof sourceSchema.fieldReader === "function"
      ? sourceSchema.fieldReader
      : readFieldText;
    if (typeof buildData !== "function") {
      return {};
    }
    var ormService = await resolveOdooService("orm");
    if (!ormService || typeof ormService.searchRead !== "function") {
      return {};
    }
    return buildData({
      spec: sourceSchema.spec,
      schema: sourceSchema,
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
        : sourceSchema.resolveRecordId(runtimeContext),
      helpers: createRecordContextSourceHelpers(ormService),
    });
  }

  function buildRelationalRecordContextSource(rawSpec) {
    var sourceSchema = normalizeRelationalSourceSchema(rawSpec);
    var sourceConfig = {
      cacheScopeKey: sourceSchema.cacheScopeKey,
      recordIdResolver: function (runtimeContext) {
        return sourceSchema.resolveRecordId(runtimeContext);
      },
      watch: sourceSchema.watch,
      load: function (runtimeContext) {
        return resolveRelationalRecordContextData(sourceSchema, runtimeContext);
      },
    };
    return buildRecordContextSource(sourceConfig);
  }

  function buildRelationalRecordContextAdapter(rawSpec) {
    var sourceSchema = normalizeRelationalSourceSchema(rawSpec);
    return buildRecordContextPanelConfig({
      cacheScopeKey: sourceSchema.cacheScopeKey,
      panelSelector: sourceSchema.spec.panelSelector,
      slots: sourceSchema.spec.slots,
      fieldReader: sourceSchema.fieldReader,
      source: buildRelationalRecordContextSource(
        Object.assign({}, sourceSchema.spec, {
          fieldReader: sourceSchema.fieldReader,
        })
      ),
    });
  }

  function buildPartnerCommercialRecordContextSource(rawSpec) {
    var sourceSchema = normalizePartnerCommercialSourceSchema(rawSpec);
    var sourceConfig = {
      cacheScopeKey: sourceSchema.cacheScopeKey,
      recordIdResolver: function (runtimeContext) {
        return sourceSchema.resolveRecordId(runtimeContext);
      },
      watch: Object.assign({}, sourceSchema.watch, {
        fields: sourceSchema.form.watchFields,
      }),
      load: function (runtimeContext) {
        return resolvePartnerCommercialRecordContextData(sourceSchema, runtimeContext);
      },
    };
    return buildRecordContextSource(sourceConfig);
  }

  function buildPartnerCommercialRecordContextAdapter(rawSpec) {
    var sourceSchema = normalizePartnerCommercialSourceSchema(rawSpec);
    return buildRecordContextPanelConfig({
      cacheScopeKey: sourceSchema.cacheScopeKey,
      panelSelector: sourceSchema.spec.panelSelector,
      slots: sourceSchema.spec.slots,
      fieldReader: sourceSchema.fieldReader,
      source: buildPartnerCommercialRecordContextSource(
        Object.assign({}, sourceSchema.spec, {
          fieldReader: sourceSchema.fieldReader,
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
})();
