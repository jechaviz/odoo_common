(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("commercial_capture_context.js requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerMethod(surfaceLayerApi, methodName) {
    if (typeof surfaceLayerApi[methodName] !== "function") {
      throw new Error("OdooSurfaceLayers." + methodName + " is required by commercial_capture_context.js.");
    }
    return surfaceLayerApi[methodName];
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function toInteger(value) {
    return Number.parseInt(String(value || 0), 10) || 0;
  }

  function readObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function readStringList(values) {
    var seen = Object.create(null);
    var result = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var normalizedValue = normalizeText(value);
      if (!normalizedValue || seen[normalizedValue]) {
        return;
      }
      seen[normalizedValue] = true;
      result.push(normalizedValue);
    });
    return result;
  }

  function mergeSlotDefinitions(baseSlots, overrideSlots) {
    var merged = Object.assign({}, baseSlots);
    Object.keys(readObject(overrideSlots)).forEach(function (slotKey) {
      merged[slotKey] = Object.assign({}, readObject(merged[slotKey]), readObject(overrideSlots[slotKey]));
    });
    return merged;
  }

  function formatTemplate(template, values) {
    var normalizedTemplate = normalizeText(template);
    if (!normalizedTemplate) {
      return "";
    }
    return normalizedTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, function (_match, token) {
      return String(readObject(values)[token] || "");
    });
  }

  function normalizeReferenceMetaSpec(rawReferenceMeta) {
    var referenceMeta = readObject(rawReferenceMeta);
    var model = normalizeText(referenceMeta.model);
    return {
      enabled: !!model,
      model: model,
      nameField: normalizeText(referenceMeta.nameField || "name"),
      currencyField: normalizeText(referenceMeta.currencyField || "currency_id"),
      itemIdsField: normalizeText(referenceMeta.itemIdsField || "item_ids"),
      extraFields: readStringList(referenceMeta.fields),
      currencyLabelKey: "referenceCurrencyLabel",
      itemCountKey: "referenceItemCount",
      includeCurrencyInSummary: Object.prototype.hasOwnProperty.call(referenceMeta, "includeCurrencyInSummary")
        ? !!referenceMeta.includeCurrencyInSummary
        : true,
      includeItemCountInSummary: Object.prototype.hasOwnProperty.call(referenceMeta, "includeItemCountInSummary")
        ? !!referenceMeta.includeItemCountInSummary
        : true,
      summarySeparator: normalizeText(referenceMeta.summarySeparator || " | "),
      itemCountSingularLabel: normalizeText(referenceMeta.itemCountSingularLabel || "1 regla"),
      itemCountPluralTemplate: normalizeText(referenceMeta.itemCountPluralTemplate || "{count} reglas"),
    };
  }

  function normalizeCommercialCaptureCopy(rawCopy) {
    var copy = readObject(rawCopy);
    var policyCopy = normalizeCommercialPolicyCopy(copy);
    return {
      primaryNameFallback: normalizeText(copy.primaryNameFallback || "Registro sin seleccionar"),
      primaryDetailsFallback: normalizeText(copy.primaryDetailsFallback || "Selecciona un contacto para ver el resumen comercial."),
      secondaryNameFallback: normalizeText(copy.secondaryNameFallback || "Mismo destino comercial"),
      secondaryDetailsFallback: normalizeText(copy.secondaryDetailsFallback || "Este documento usa la direccion comercial principal mientras no asignes un destino secundario."),
      identifierFallback: normalizeText(copy.identifierFallback || "-"),
      referenceFallback: policyCopy.referenceFallback,
      referenceMetaFallback: policyCopy.referenceMetaFallback,
      conditionFallback: policyCopy.conditionFallback,
      conditionMetaFallback: policyCopy.conditionMetaFallback,
      noteWithReferenceAndItems: policyCopy.noteWithReferenceAndItems,
      noteWithReferenceNoItems: policyCopy.noteWithReferenceNoItems,
      noteWithoutReference: policyCopy.noteWithoutReference,
      changedConditionLabel: policyCopy.changedConditionLabel,
      inheritedConditionLabel: policyCopy.inheritedConditionLabel,
      explicitConditionLabel: policyCopy.explicitConditionLabel,
    };
  }

  function normalizeCommercialCaptureContextSpec(rawSpec) {
    var spec = readObject(rawSpec);
    return {
      adapterSpec: spec,
      copy: normalizeCommercialCaptureCopy(spec.copy),
      referenceMeta: normalizeReferenceMetaSpec(spec.referenceMeta),
      slotOverrides: readObject(spec.slotOverrides),
      noteRenderer: typeof spec.noteRenderer === "function" ? spec.noteRenderer : null,
    };
  }

  async function readReferenceMeta(helpers, referenceMetaSpec, referenceValue) {
    if (!(referenceMetaSpec.enabled && helpers && typeof helpers.searchReadFirst === "function")) {
      return {};
    }
    var referenceId = referenceValue && referenceValue.id ? toInteger(referenceValue.id) : 0;
    if (!(referenceId > 0)) {
      return {};
    }
    var fields = readStringList(
      [].concat(referenceMetaSpec.extraFields).concat([
        referenceMetaSpec.nameField,
        referenceMetaSpec.currencyField,
        referenceMetaSpec.itemIdsField,
      ])
    );
    var row = await helpers.searchReadFirst(
      referenceMetaSpec.model,
      [["id", "=", referenceId]],
      fields,
      { limit: 1, order: "id asc" }
    );
    var currencyValue = helpers.normalizeMany2oneValue(row && row[referenceMetaSpec.currencyField]);
    var itemIds = Array.isArray(row && row[referenceMetaSpec.itemIdsField]) ? row[referenceMetaSpec.itemIdsField] : [];
    return {
      reference: normalizeText(row && row[referenceMetaSpec.nameField]) || normalizeText(referenceValue && referenceValue.label),
      referenceCurrencyLabel: normalizeText(currencyValue.label),
      referenceItemCount: itemIds.length,
    };
  }

  function buildReferenceMetaSummaryRenderer(copy, referenceMetaSpec, buildRecordContextSummarySlotRenderer) {
    var parts = [];
    if (referenceMetaSpec.includeCurrencyInSummary) {
      parts.push({
        key: referenceMetaSpec.currencyLabelKey,
        includeWhen: function (value) {
          return !!normalizeText(value);
        },
      });
    }
    if (referenceMetaSpec.includeItemCountInSummary) {
      parts.push({
        key: referenceMetaSpec.itemCountKey,
        format: function (value) {
          var itemCount = toInteger(value);
          if (!(itemCount > 0)) {
            return "";
          }
          if (itemCount === 1) {
            return referenceMetaSpec.itemCountSingularLabel;
          }
          return formatTemplate(referenceMetaSpec.itemCountPluralTemplate, { count: itemCount });
        },
      });
    }
    return buildRecordContextSummarySlotRenderer({
      separator: referenceMetaSpec.summarySeparator,
      parts: parts,
    });
  }

  function buildCommercialCaptureContextSlots(rawSpec) {
    var spec = normalizeCommercialCaptureContextSpec(rawSpec);
    var copy = spec.copy;
    var summaryRenderer = buildReferenceMetaSummaryRenderer(copy, spec.referenceMeta, buildRecordContextSummarySlotRenderer);
    var conditionMetaRenderer = buildRecordContextOverrideSlotRenderer({
      currentKey: "condition",
      defaultKey: "defaultConditionLabel",
      changedLabel: copy.changedConditionLabel,
      inheritedLabel: copy.inheritedConditionLabel,
      explicitLabel: copy.explicitConditionLabel,
    });
    var noteRenderer = buildCommercialPolicyNoteRenderer(copy);
    var baseSlots = {
      primaryName: { fallback: copy.primaryNameFallback },
      primaryDetails: { fallback: copy.primaryDetailsFallback },
      secondaryName: { fallback: copy.secondaryNameFallback },
      secondaryDetails: { fallback: copy.secondaryDetailsFallback },
      identifier: { fallback: copy.identifierFallback },
      reference: { fallback: copy.referenceFallback },
      referenceMeta: {
        fallback: copy.referenceMetaFallback,
        render: summaryRenderer,
      },
      condition: { fallback: copy.conditionFallback },
      conditionMeta: {
        fallback: copy.conditionMetaFallback,
        render: conditionMetaRenderer,
      },
      note: {
        render: function (data, runtimeContext, fallback) {
          if (spec.noteRenderer) {
            return spec.noteRenderer(data, runtimeContext, fallback);
          }
          return noteRenderer(data, runtimeContext, fallback);
        },
      },
    };
    return mergeSlotDefinitions(baseSlots, spec.slotOverrides);
  }

  function buildCommercialCaptureContextEnricher(rawSpec) {
    var spec = normalizeCommercialCaptureContextSpec(rawSpec);
    return async function enrichCommercialCaptureContext(context) {
      var helpers = context && context.helpers && typeof context.helpers === "object" ? context.helpers : null;
      var referenceValue = context && context.referenceValue && typeof context.referenceValue === "object"
        ? context.referenceValue
        : { id: 0, label: "" };
      if (!helpers) {
        return {};
      }
      return readReferenceMeta(helpers, spec.referenceMeta, referenceValue);
    };
  }

  function buildCommercialCaptureContextAdapter(rawSpec) {
    var spec = normalizeCommercialCaptureContextSpec(rawSpec);
    return buildPartnerCommercialRecordContextAdapter(Object.assign({}, spec.adapterSpec, {
      slots: buildCommercialCaptureContextSlots(spec.adapterSpec),
      enrichData: buildCommercialCaptureContextEnricher(spec.adapterSpec),
    }));
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var buildPartnerCommercialRecordContextAdapter = requireSurfaceLayerMethod(surfaceLayerApi, "buildPartnerCommercialRecordContextAdapter");
  var buildRecordContextSummarySlotRenderer = requireSurfaceLayerMethod(surfaceLayerApi, "buildRecordContextSummarySlotRenderer");
  var buildRecordContextOverrideSlotRenderer = requireSurfaceLayerMethod(surfaceLayerApi, "buildRecordContextOverrideSlotRenderer");
  var normalizeCommercialPolicyCopy = requireSurfaceLayerMethod(surfaceLayerApi, "normalizeCommercialPolicyCopy");
  var buildCommercialPolicyNoteRenderer = requireSurfaceLayerMethod(surfaceLayerApi, "buildCommercialPolicyNoteRenderer");

  Object.assign(surfaceLayerApi, {
    buildCommercialCaptureContextSlots: buildCommercialCaptureContextSlots,
    buildCommercialCaptureContextEnricher: buildCommercialCaptureContextEnricher,
    buildCommercialCaptureContextAdapter: buildCommercialCaptureContextAdapter,
  });
})();
