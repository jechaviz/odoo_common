(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("commercial policy surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerMethod(surfaceLayerApi, methodName) {
    if (typeof surfaceLayerApi[methodName] !== "function") {
      throw new Error("OdooSurfaceLayers." + methodName + " is required by commercial_policy_surface.js.");
    }
    return surfaceLayerApi[methodName];
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function toIntegerId(value) {
    return Number.parseInt(String(value || 0), 10) || 0;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var normalizeMany2oneValue = requireSurfaceLayerMethod(surfaceLayerApi, "normalizeMany2oneValue");
  var resolveOdooService = requireSurfaceLayerMethod(surfaceLayerApi, "resolveOdooService");

  function readSpecObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function requireSpecObject(value, path) {
    var objectValue = readSpecObject(value);
    if (!Object.keys(objectValue).length) {
      throw new Error(path + " is required.");
    }
    return objectValue;
  }

  function requireSpecString(value, path) {
    var normalizedValue = normalizeText(value);
    if (!normalizedValue) {
      throw new Error(path + " is required.");
    }
    return normalizedValue;
  }

  function normalizeStringList(values, fallbackValues) {
    var rawValues = Array.isArray(values) ? values : Array.isArray(fallbackValues) ? fallbackValues : [];
    var seen = Object.create(null);
    var result = [];
    rawValues.forEach(function (value) {
      var normalizedValue = normalizeText(value);
      if (!normalizedValue || seen[normalizedValue]) {
        return;
      }
      seen[normalizedValue] = true;
      result.push(normalizedValue);
    });
    return result;
  }

  function normalizeMany2oneRecord(value) {
    var normalized = normalizeMany2oneValue(value) || {};
    return {
      id: toIntegerId(normalized.id),
      label: normalizeText(normalized.label || normalized.display_name || normalized.displayName || ""),
    };
  }

  function normalizePreviewMappings(values) {
    return (Array.isArray(values) ? values : []).filter(function (mapping) {
      return !!(mapping && typeof mapping === "object" && normalizeText(mapping.fieldName));
    });
  }

  function normalizeCommercialPolicyCopy(rawCopy) {
    var copy = readSpecObject(rawCopy);
    return {
      referenceFallback: normalizeText(copy.referenceFallback || "Tarifa base"),
      referenceMetaFallback: normalizeText(copy.referenceMetaFallback || "Sin reglas"),
      conditionFallback: normalizeText(copy.conditionFallback || "Sin default"),
      conditionMetaFallback: normalizeText(copy.conditionMetaFallback || "Sin override"),
      noteWithReferenceAndItems: normalizeText(copy.noteWithReferenceAndItems || "La referencia comercial ya tiene reglas activas."),
      noteWithReferenceNoItems: normalizeText(copy.noteWithReferenceNoItems || "La referencia comercial existe, pero aun no tiene reglas activas."),
      noteWithoutReference: normalizeText(copy.noteWithoutReference || "Este registro usa la politica comercial base."),
      changedConditionLabel: normalizeText(copy.changedConditionLabel || "Ajustado en este registro"),
      inheritedConditionLabel: normalizeText(copy.inheritedConditionLabel || "Heredado del contacto"),
      explicitConditionLabel: normalizeText(copy.explicitConditionLabel || "Definido en este registro"),
    };
  }

  function buildCommercialPolicyNoteRenderer(rawCopy) {
    var copy = normalizeCommercialPolicyCopy(rawCopy);
    return function renderCommercialPolicyNote(data) {
      var normalizedData = readSpecObject(data);
      var referenceLabel = normalizeText(normalizedData.reference);
      var itemCount = Number(normalizedData.referenceItemCount || 0) || 0;
      if (referenceLabel && itemCount > 0) {
        return copy.noteWithReferenceAndItems;
      }
      if (referenceLabel) {
        return copy.noteWithReferenceNoItems;
      }
      return copy.noteWithoutReference;
    };
  }

  function normalizeCommercialPolicySurfaceSpec(rawSpec) {
    var spec = requireSpecObject(rawSpec, "commercial policy surface spec");
    var recordSpec = requireSpecObject(spec.record, "commercial policy surface spec.record");
    var sourceSpec = requireSpecObject(spec.source, "commercial policy surface spec.source");
    var targetSpec = requireSpecObject(spec.target, "commercial policy surface spec.target");
    var actionsSpec = readSpecObject(spec.actions);
    var previewSpec = readSpecObject(spec.preview);
    var behaviorSpec = readSpecObject(spec.behavior);
    var sourcePolicyFieldMap = readSpecObject(sourceSpec.policyFieldMap);
    var targetWriteBackFieldMap = readSpecObject(targetSpec.writeBackFieldMap);
    var labelFields = normalizeStringList(sourceSpec.labelFields, ["display_name", "name"]);
    var sourceFields = normalizeStringList(
      []
        .concat(Array.isArray(sourceSpec.fields) ? sourceSpec.fields : ["id", "display_name"])
        .concat(labelFields)
        .concat(sourcePolicyFieldMap.program || [])
        .concat(sourcePolicyFieldMap.percent || [])
    );

    if (typeof recordSpec.resolveRoot !== "function") {
      throw new Error("commercial policy surface spec.record.resolveRoot is required.");
    }
    if (previewSpec.setValue && typeof previewSpec.setValue !== "function") {
      throw new Error("commercial policy surface spec.preview.setValue must be a function.");
    }
    if (actionsSpec.resolveSourceActionId && typeof actionsSpec.resolveSourceActionId !== "function") {
      throw new Error("commercial policy surface spec.actions.resolveSourceActionId must be a function.");
    }
    if (recordSpec.resolveManagedId && typeof recordSpec.resolveManagedId !== "function") {
      throw new Error("commercial policy surface spec.record.resolveManagedId must be a function.");
    }
    if (behaviorSpec.isManagedRoute && typeof behaviorSpec.isManagedRoute !== "function") {
      throw new Error("commercial policy surface spec.behavior.isManagedRoute must be a function.");
    }
    if (behaviorSpec.suppressObserverMutations && typeof behaviorSpec.suppressObserverMutations !== "function") {
      throw new Error("commercial policy surface spec.behavior.suppressObserverMutations must be a function.");
    }
    if (behaviorSpec.afterTargetSync && typeof behaviorSpec.afterTargetSync !== "function") {
      throw new Error("commercial policy surface spec.behavior.afterTargetSync must be a function.");
    }
    if (behaviorSpec.buildWritePayload && typeof behaviorSpec.buildWritePayload !== "function") {
      throw new Error("commercial policy surface spec.behavior.buildWritePayload must be a function.");
    }

    return {
      record: {
        resolveRoot: recordSpec.resolveRoot,
        resolveManagedId: typeof recordSpec.resolveManagedId === "function" ? recordSpec.resolveManagedId : null,
      },
      source: {
        model: requireSpecString(sourceSpec.model, "commercial policy surface spec.source.model"),
        fields: sourceFields,
        labelFields: labelFields,
        policyFieldMap: {
          program: sourcePolicyFieldMap.program || "",
          percent: sourcePolicyFieldMap.percent || "",
        },
      },
      target: {
        model: requireSpecString(targetSpec.model, "commercial policy surface spec.target.model"),
        sourceFieldName: normalizeText(targetSpec.sourceFieldName || ""),
        writeBackFieldMap: {
          source: normalizeText(targetWriteBackFieldMap.source || ""),
          program: normalizeText(targetWriteBackFieldMap.program || ""),
          percent: normalizeText(targetWriteBackFieldMap.percent || ""),
        },
      },
      actions: {
        sourceActionId: toIntegerId(actionsSpec.sourceActionId),
        resolveSourceActionId: typeof actionsSpec.resolveSourceActionId === "function"
          ? actionsSpec.resolveSourceActionId
          : null,
      },
      preview: {
        setValue: typeof previewSpec.setValue === "function" ? previewSpec.setValue : null,
        sourceMappings: normalizePreviewMappings(previewSpec.sourceMappings),
        targetMappings: normalizePreviewMappings(previewSpec.targetMappings),
      },
      behavior: {
        watchedFieldNames: normalizeStringList(behaviorSpec.watchedFieldNames),
        saveButtonLabels: normalizeStringList(
          (Array.isArray(behaviorSpec.saveButtonLabels) ? behaviorSpec.saveButtonLabels : ["save"]).map(function (label) {
            return normalizeText(label).toLowerCase();
          })
        ),
        isManagedRoute: typeof behaviorSpec.isManagedRoute === "function" ? behaviorSpec.isManagedRoute : null,
        suppressObserverMutations: typeof behaviorSpec.suppressObserverMutations === "function"
          ? behaviorSpec.suppressObserverMutations
          : null,
        afterTargetSync: typeof behaviorSpec.afterTargetSync === "function" ? behaviorSpec.afterTargetSync : null,
        buildWritePayload: typeof behaviorSpec.buildWritePayload === "function" ? behaviorSpec.buildWritePayload : null,
      },
    };
  }

  function readRecordRootModel(recordRoot) {
    return normalizeText(
      recordRoot &&
        (recordRoot.resModel ||
          recordRoot.model ||
          recordRoot.modelName ||
          (recordRoot._config && recordRoot._config.resModel))
    );
  }

  function readRecordRootId(recordRoot) {
    return toIntegerId(
      recordRoot &&
        (recordRoot.resId ||
          recordRoot.res_id ||
          recordRoot.currentId ||
          recordRoot.id ||
          (recordRoot.data && recordRoot.data.id))
    );
  }

  function readRecordRootFieldCandidates(recordRoot, fieldName) {
    if (!(recordRoot && fieldName)) {
      return [];
    }
    return [
      recordRoot._changes && recordRoot._changes[fieldName],
      recordRoot._values && recordRoot._values[fieldName],
      recordRoot.data && recordRoot.data[fieldName],
    ];
  }

  function readMany2oneIdFromCandidates(candidates, normalizeMany2one) {
    var values = Array.isArray(candidates) ? candidates : [candidates];
    for (var index = 0; index < values.length; index += 1) {
      var normalizedValue = normalizeMany2one(values[index]);
      if (normalizedValue.id > 0) {
        return normalizedValue.id;
      }
    }
    return 0;
  }

  function readRecordFieldValue(record, fieldNameOrList) {
    if (!record) {
      return null;
    }
    if (Array.isArray(fieldNameOrList)) {
      for (var index = 0; index < fieldNameOrList.length; index += 1) {
        var candidateValue = readRecordFieldValue(record, fieldNameOrList[index]);
        if (candidateValue !== null && candidateValue !== undefined && candidateValue !== "") {
          return candidateValue;
        }
      }
      return null;
    }
    var fieldName = normalizeText(fieldNameOrList);
    return fieldName ? record[fieldName] : null;
  }

  function readNumericRecordValue(record, fieldNameOrList) {
    var rawValue = readRecordFieldValue(record, fieldNameOrList);
    return Number(rawValue || 0) || 0;
  }

  function buildSignature(parts) {
    return (Array.isArray(parts) ? parts : []).map(function (part) {
      return normalizeText(part);
    }).join("|");
  }

  function resolveWatchedFieldName(target, watchedFieldNames) {
    if (!(target instanceof HTMLElement)) {
      return "";
    }
    var fieldRoot = target.closest(".o_form_view [name], .o_form_view [data-name]");
    if (!(fieldRoot instanceof HTMLElement)) {
      return "";
    }
    var fieldName = normalizeText(fieldRoot.getAttribute("name") || fieldRoot.getAttribute("data-name") || "");
    return watchedFieldNames.indexOf(fieldName) >= 0 ? fieldName : "";
  }

  function shouldTriggerSaveSync(target, saveButtonLabels) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    var button = target.closest("button, [role='button']");
    var label = normalizeText(
      button && (button.getAttribute("aria-label") || button.textContent || "")
    ).toLowerCase();
    return !!(button && label && saveButtonLabels.indexOf(label) >= 0);
  }

  function buildCommercialPolicySurfaceBridge(rawSpec) {
    var spec = normalizeCommercialPolicySurfaceSpec(rawSpec);
    var watchedFieldNames = spec.behavior.watchedFieldNames;
    var sourcePreviewMappings = spec.preview.sourceMappings;
    var targetPreviewMappings = spec.preview.targetMappings;
    var saveButtonLabels = spec.behavior.saveButtonLabels;
    var state = {
      installed: false,
      syncTimer: 0,
      syncToken: 0,
      lastFocusedField: "",
      lastTargetSignature: "",
      lastSourceSignature: "",
    };

    function resolveRecordRoot() {
      return spec.record.resolveRoot();
    }

    function resolveVisibleModel() {
      return readRecordRootModel(resolveRecordRoot());
    }

    function resolveVisibleRecordId() {
      return readRecordRootId(resolveRecordRoot());
    }

    function resolveManagedRecordId() {
      if (typeof spec.record.resolveManagedId === "function") {
        return toIntegerId(spec.record.resolveManagedId());
      }
      return resolveVisibleModel() === spec.target.model
        ? resolveVisibleRecordId()
        : 0;
    }

    function resolveSourceActionId() {
      if (typeof spec.actions.resolveSourceActionId === "function") {
        return toIntegerId(spec.actions.resolveSourceActionId());
      }
      return spec.actions.sourceActionId;
    }

    function resolveSelectedSourceId() {
      var recordRoot = resolveRecordRoot();
      var fieldName = spec.target.sourceFieldName;
      if (!recordRoot || !fieldName) {
        return 0;
      }
      return readMany2oneIdFromCandidates(
        readRecordRootFieldCandidates(recordRoot, fieldName),
        normalizeMany2oneRecord
      );
    }

    async function searchReadSingle(ormService, modelName, domain, fields, options) {
      if (!ormService || typeof ormService.searchRead !== "function") {
        return null;
      }
      var rows = await ormService.searchRead(
        normalizeText(modelName),
        Array.isArray(domain) ? domain : [],
        Array.isArray(fields) ? fields : [],
        Object.assign({ limit: 1, order: "id asc" }, options && typeof options === "object" ? options : {})
      ).catch(function () {
        return [];
      });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    }

    async function runSourceAction(ormService, sourceId) {
      var actionId = resolveSourceActionId();
      if (!(actionId > 0) || !(sourceId > 0) || !ormService || typeof ormService.call !== "function") {
        return false;
      }
      if (typeof spec.behavior.suppressObserverMutations === "function") {
        spec.behavior.suppressObserverMutations(300);
      }
      await ormService.call(
        "ir.actions.server",
        "run",
        [[actionId]],
        {
          context: {
            active_model: spec.source.model,
            active_id: sourceId,
            active_ids: [sourceId],
          },
        }
      );
      return true;
    }

    async function fetchSourceRow(ormService, sourceId) {
      if (!(sourceId > 0)) {
        return null;
      }
      return searchReadSingle(
        ormService,
        spec.source.model,
        [["id", "=", sourceId]],
        spec.source.fields,
        { limit: 1, order: "id asc" }
      );
    }

    function resolveSourceLabel(sourceRow) {
      var rawLabel = readRecordFieldValue(sourceRow, spec.source.labelFields);
      return normalizeText(rawLabel);
    }

    function resolvePreviewValue(mapping, context) {
      if (mapping && typeof mapping.resolveValue === "function") {
        return mapping.resolveValue(context);
      }
      if (mapping && Object.prototype.hasOwnProperty.call(mapping, "value")) {
        return mapping.value;
      }
      return mapping ? context[mapping.valueKey] : "";
    }

    function applyPreviewMappings(mappings, context) {
      if (typeof spec.preview.setValue !== "function") {
        return false;
      }
      var applied = false;
      (Array.isArray(mappings) ? mappings : []).forEach(function (mapping) {
        if (!(mapping && mapping.fieldName)) {
          return;
        }
        var value = resolvePreviewValue(mapping, context);
        if (value === null || value === undefined || value === "") {
          return;
        }
        if (spec.preview.setValue(mapping.fieldName, value, mapping.options || {}) !== false) {
          applied = true;
        }
      });
      return applied;
    }

    async function syncVisibleSourceRecordSurface(ormService) {
      if (resolveVisibleModel() !== spec.source.model) {
        return false;
      }
      var sourceId = resolveVisibleRecordId();
      if (!(sourceId > 0)) {
        return false;
      }
      var signature = String(sourceId);
      if (signature === state.lastSourceSignature) {
        return false;
      }
      await runSourceAction(ormService, sourceId);
      var sourceRow = await fetchSourceRow(ormService, sourceId);
      var label = resolveSourceLabel(sourceRow);
      var programValue = normalizeMany2oneRecord(
        readRecordFieldValue(sourceRow, spec.source.policyFieldMap.program)
      );
      var percentValue = readNumericRecordValue(sourceRow, spec.source.policyFieldMap.percent);
      applyPreviewMappings(sourcePreviewMappings, {
        sourceId: sourceId,
        label: label,
        programId: programValue.id || 0,
        programLabel: programValue.label || "",
        percent: percentValue,
        row: sourceRow || {},
      });
      state.lastSourceSignature = signature;
      return true;
    }

    async function syncManagedTargetRecordSurface(ormService) {
      if (typeof spec.behavior.isManagedRoute === "function" && !spec.behavior.isManagedRoute()) {
        return false;
      }
      var targetId = resolveManagedRecordId();
      var sourceId = resolveSelectedSourceId();
      if (!(sourceId > 0) && targetId > 0 && spec.target.sourceFieldName) {
        var targetRow = await searchReadSingle(
          ormService,
          spec.target.model,
          [["id", "=", targetId]],
          ["id", spec.target.sourceFieldName],
          { limit: 1, order: "id asc" }
        );
        sourceId = normalizeMany2oneRecord(targetRow && targetRow[spec.target.sourceFieldName]).id;
      }
      if (!(sourceId > 0)) {
        state.lastTargetSignature = "";
        return false;
      }
      await runSourceAction(ormService, sourceId);
      var sourceRow = await fetchSourceRow(ormService, sourceId);
      if (!sourceRow) {
        return false;
      }
      var label = resolveSourceLabel(sourceRow);
      var programValue = normalizeMany2oneRecord(
        readRecordFieldValue(sourceRow, spec.source.policyFieldMap.program)
      );
      var percentValue = readNumericRecordValue(sourceRow, spec.source.policyFieldMap.percent);
      var signature = buildSignature([
        String(targetId || 0),
        String(sourceId || 0),
        label,
        String(percentValue || 0),
      ]);
      if (signature === state.lastTargetSignature) {
        return false;
      }

      if (targetId > 0 && spec.target.model && typeof ormService.call === "function") {
        var payload = {};
        if (spec.target.writeBackFieldMap.source) {
          payload[spec.target.writeBackFieldMap.source] = sourceId;
        }
        if (spec.target.writeBackFieldMap.program) {
          payload[spec.target.writeBackFieldMap.program] = programValue.id || false;
        }
        if (spec.target.writeBackFieldMap.percent) {
          payload[spec.target.writeBackFieldMap.percent] = percentValue || 0;
        }
        if (typeof spec.behavior.buildWritePayload === "function") {
          payload = Object.assign(payload, spec.behavior.buildWritePayload({
            targetId: targetId,
            sourceId: sourceId,
            row: sourceRow,
            label: label,
            programValue: programValue,
            percentValue: percentValue,
          }) || {});
        }
        if (Object.keys(payload).length) {
          await ormService.call(spec.target.model, "write", [[targetId], payload], {}).catch(function () {
            return false;
          });
        }
      }

      applyPreviewMappings(targetPreviewMappings, {
        targetId: targetId,
        sourceId: sourceId,
        label: label,
        programId: programValue.id || 0,
        programLabel: programValue.label || "",
        percent: percentValue,
        row: sourceRow,
      });
      state.lastTargetSignature = signature;

      if (typeof spec.behavior.afterTargetSync === "function") {
        await spec.behavior.afterTargetSync({
          ormService: ormService,
          targetId: targetId,
          sourceId: sourceId,
          row: sourceRow,
          label: label,
          programValue: programValue,
          percentValue: percentValue,
        });
      }
      return true;
    }

    async function sync(force) {
      var ormService = await resolveOdooService("orm");
      if (!ormService || typeof ormService.searchRead !== "function") {
        return false;
      }
      if (force) {
        state.lastSourceSignature = "";
        state.lastTargetSignature = "";
      }
      var sourceSynced = await syncVisibleSourceRecordSurface(ormService);
      var targetSynced = await syncManagedTargetRecordSurface(ormService);
      return !!(sourceSynced || targetSynced);
    }

    function schedule(delayMs, force) {
      if (state.syncTimer) {
        window.clearTimeout(state.syncTimer);
      }
      var syncToken = state.syncToken + 1;
      state.syncToken = syncToken;
      state.syncTimer = window.setTimeout(function () {
        state.syncTimer = 0;
        if (syncToken !== state.syncToken) {
          return;
        }
        sync(!!force).catch(function () {});
      }, Math.max(Number(delayMs || 0) || 0, 0));
    }

    function install() {
      if (state.installed) {
        return api;
      }
      state.installed = true;

      document.addEventListener("focusin", function (event) {
        state.lastFocusedField = resolveWatchedFieldName(
          event && event.target instanceof HTMLElement ? event.target : null,
          watchedFieldNames
        );
      }, true);

      ["input", "change", "focusout"].forEach(function (eventName) {
        document.addEventListener(eventName, function (event) {
          var fieldName = resolveWatchedFieldName(
            event && event.target instanceof HTMLElement ? event.target : null,
            watchedFieldNames
          );
          if (!fieldName) {
            return;
          }
          schedule(eventName === "input" ? 450 : 140, eventName !== "input");
        }, true);
      });

      document.addEventListener("keydown", function (event) {
        var fieldName = resolveWatchedFieldName(
          event && event.target instanceof HTMLElement ? event.target : null,
          watchedFieldNames
        );
        if (!fieldName) {
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          schedule(180, true);
        }
      }, true);

      document.addEventListener("click", function (event) {
        var target = event && event.target instanceof HTMLElement ? event.target : null;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var fieldName = resolveWatchedFieldName(target, watchedFieldNames);
        if (fieldName) {
          state.lastFocusedField = fieldName;
          schedule(180, true);
          return;
        }
        if (
          state.lastFocusedField &&
          target.closest(
            ".o-autocomplete--dropdown-item, .o_m2o_dropdown_option, [role='option'], [role='menuitem'], .dropdown-item, .ui-menu-item"
          )
        ) {
          schedule(220, true);
          return;
        }
        if (shouldTriggerSaveSync(target, saveButtonLabels)) {
          window.setTimeout(function () {
            sync(true).catch(function () {});
          }, 320);
          window.setTimeout(function () {
            sync(true).catch(function () {});
          }, 920);
        }
      }, true);

      return api;
    }

    function reset() {
      state.lastFocusedField = "";
      state.lastSourceSignature = "";
      state.lastTargetSignature = "";
      return api;
    }

    var api = {
      install: install,
      reset: reset,
      schedule: schedule,
      sync: sync,
    };
    return api;
  }

  surfaceLayerApi.buildCommercialPolicySurfaceBridge = buildCommercialPolicySurfaceBridge;
  surfaceLayerApi.normalizeCommercialPolicyCopy = normalizeCommercialPolicyCopy;
  surfaceLayerApi.buildCommercialPolicyNoteRenderer = buildCommercialPolicyNoteRenderer;
  surfaceLayerApi.installCommercialPolicySurfaceBridge = function (spec) {
    var bridge = buildCommercialPolicySurfaceBridge(spec);
    bridge.install();
    return bridge;
  };
})();
