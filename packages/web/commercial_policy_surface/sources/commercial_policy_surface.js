(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("commercial policy surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function toIntegerId(value) {
    return Number.parseInt(String(value || 0), 10) || 0;
  }

  function defaultNormalizeMany2one(value) {
    if (typeof window.normalizeMany2one === "function") {
      var normalized = window.normalizeMany2one(value) || {};
      return {
        id: toIntegerId(normalized.id),
        label: normalizeText(normalized.label || normalized.display_name || normalized.displayName || ""),
      };
    }
    if (Array.isArray(value) && value.length) {
      return {
        id: toIntegerId(value[0]),
        label: normalizeText(value[1] || ""),
      };
    }
    if (value && typeof value === "object") {
      return {
        id: toIntegerId(value.id || value.resId || value.res_id),
        label: normalizeText(value.display_name || value.displayName || value.name || value.label || ""),
      };
    }
    return {
      id: toIntegerId(value),
      label: "",
    };
  }

  function defaultResolveOrmService() {
    if (typeof window.resolveOrmService === "function") {
      return window.resolveOrmService();
    }
    var surfaceLayerApi = requireSurfaceLayerApi();
    if (typeof surfaceLayerApi.resolveOdooService === "function") {
      return surfaceLayerApi.resolveOdooService("orm");
    }
    return Promise.resolve(null);
  }

  function defaultResolveRecordRoot() {
    if (typeof window.resolveVisibleFormController === "function") {
      var genericController = window.resolveVisibleFormController();
      if (genericController && genericController.model && genericController.model.root) {
        return genericController.model.root;
      }
    }
    return null;
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
    var spec = rawSpec && typeof rawSpec === "object" ? rawSpec : {};
    var normalizeMany2one = typeof spec.normalizeMany2one === "function"
      ? spec.normalizeMany2one
      : defaultNormalizeMany2one;
    var watchedFieldNames = (Array.isArray(spec.watchedFieldNames) ? spec.watchedFieldNames : [])
      .map(normalizeText)
      .filter(Boolean);
    var sourcePreviewMappings = Array.isArray(spec.sourcePreviewMappings) ? spec.sourcePreviewMappings : [];
    var targetPreviewMappings = Array.isArray(spec.targetPreviewMappings) ? spec.targetPreviewMappings : [];
    var saveButtonLabels = (Array.isArray(spec.saveButtonLabels) ? spec.saveButtonLabels : ["save"])
      .map(function (label) {
        return normalizeText(label).toLowerCase();
      })
      .filter(Boolean);
    var state = {
      installed: false,
      syncTimer: 0,
      syncToken: 0,
      lastFocusedField: "",
      lastTargetSignature: "",
      lastSourceSignature: "",
    };

    function resolveRecordRoot() {
      return typeof spec.resolveRecordRoot === "function"
        ? spec.resolveRecordRoot()
        : defaultResolveRecordRoot();
    }

    function resolveVisibleModel() {
      return readRecordRootModel(resolveRecordRoot());
    }

    function resolveVisibleRecordId() {
      return readRecordRootId(resolveRecordRoot());
    }

    function resolveManagedRecordId() {
      if (typeof spec.resolveManagedRecordId === "function") {
        return toIntegerId(spec.resolveManagedRecordId());
      }
      return resolveVisibleModel() === normalizeText(spec.targetModel)
        ? resolveVisibleRecordId()
        : 0;
    }

    function resolveSourceActionId() {
      if (typeof spec.resolveSourceActionId === "function") {
        return toIntegerId(spec.resolveSourceActionId());
      }
      return toIntegerId(spec.sourceActionId);
    }

    function resolveSelectedAssignmentId() {
      var recordRoot = resolveRecordRoot();
      var fieldName = normalizeText(spec.targetAssignmentFieldName);
      if (!recordRoot || !fieldName) {
        return 0;
      }
      return readMany2oneIdFromCandidates(
        readRecordRootFieldCandidates(recordRoot, fieldName),
        normalizeMany2one
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
      if (typeof spec.suppressObserverMutations === "function") {
        spec.suppressObserverMutations(300);
      }
      await ormService.call(
        "ir.actions.server",
        "run",
        [[actionId]],
        {
          context: {
            active_model: normalizeText(spec.sourceModel),
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
        spec.sourceModel,
        [["id", "=", sourceId]],
        Array.isArray(spec.sourceFields) ? spec.sourceFields : ["id", "display_name"],
        { limit: 1, order: "id asc" }
      );
    }

    function resolveSourceLabel(sourceRow) {
      var rawLabel = readRecordFieldValue(sourceRow, spec.sourceLabelFields || ["display_name", "name"]);
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
      if (typeof spec.setPreviewValue !== "function") {
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
        if (spec.setPreviewValue(mapping.fieldName, value, mapping.options || {}) !== false) {
          applied = true;
        }
      });
      return applied;
    }

    async function syncVisibleSourceRecordSurface(ormService) {
      if (resolveVisibleModel() !== normalizeText(spec.sourceModel)) {
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
      var programValue = normalizeMany2one(readRecordFieldValue(sourceRow, spec.sourceProgramFieldName));
      var percentValue = readNumericRecordValue(sourceRow, spec.sourcePercentFieldName);
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
      if (typeof spec.isManagedRoute === "function" && !spec.isManagedRoute()) {
        return false;
      }
      var targetId = resolveManagedRecordId();
      var assignmentId = resolveSelectedAssignmentId();
      if (!(assignmentId > 0) && targetId > 0 && spec.targetAssignmentFieldName) {
        var targetRow = await searchReadSingle(
          ormService,
          spec.targetModel,
          [["id", "=", targetId]],
          ["id", spec.targetAssignmentFieldName],
          { limit: 1, order: "id asc" }
        );
        assignmentId = normalizeMany2one(targetRow && targetRow[spec.targetAssignmentFieldName]).id;
      }
      if (!(assignmentId > 0)) {
        state.lastTargetSignature = "";
        return false;
      }
      await runSourceAction(ormService, assignmentId);
      var sourceRow = await fetchSourceRow(ormService, assignmentId);
      if (!sourceRow) {
        return false;
      }
      var label = resolveSourceLabel(sourceRow);
      var programValue = normalizeMany2one(readRecordFieldValue(sourceRow, spec.sourceProgramFieldName));
      var percentValue = readNumericRecordValue(sourceRow, spec.sourcePercentFieldName);
      var signature = buildSignature([
        String(targetId || 0),
        String(assignmentId || 0),
        label,
        String(percentValue || 0),
      ]);
      if (signature === state.lastTargetSignature) {
        return false;
      }

      if (targetId > 0 && spec.targetModel && spec.targetWriteBackFields && typeof ormService.call === "function") {
        var payload = {};
        if (spec.targetWriteBackFields.assignment) {
          payload[spec.targetWriteBackFields.assignment] = assignmentId;
        }
        if (spec.targetWriteBackFields.program) {
          payload[spec.targetWriteBackFields.program] = programValue.id || false;
        }
        if (spec.targetWriteBackFields.percent) {
          payload[spec.targetWriteBackFields.percent] = percentValue || 0;
        }
        if (typeof spec.buildWritePayload === "function") {
          payload = Object.assign(payload, spec.buildWritePayload({
            targetId: targetId,
            sourceId: assignmentId,
            row: sourceRow,
            label: label,
            programValue: programValue,
            percentValue: percentValue,
          }) || {});
        }
        if (Object.keys(payload).length) {
          await ormService.call(spec.targetModel, "write", [[targetId], payload], {}).catch(function () {
            return false;
          });
        }
      }

      applyPreviewMappings(targetPreviewMappings, {
        targetId: targetId,
        sourceId: assignmentId,
        label: label,
        programId: programValue.id || 0,
        programLabel: programValue.label || "",
        percent: percentValue,
        row: sourceRow,
      });
      state.lastTargetSignature = signature;

      if (typeof spec.afterTargetSync === "function") {
        await spec.afterTargetSync({
          ormService: ormService,
          targetId: targetId,
          sourceId: assignmentId,
          row: sourceRow,
          label: label,
          programValue: programValue,
          percentValue: percentValue,
        });
      }
      return true;
    }

    async function sync(force) {
      var ormService = await (
        typeof spec.resolveOrmService === "function"
          ? spec.resolveOrmService()
          : defaultResolveOrmService()
      );
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

  var surfaceLayerApi = requireSurfaceLayerApi();
  surfaceLayerApi.buildCommercialPolicySurfaceBridge = buildCommercialPolicySurfaceBridge;
  surfaceLayerApi.installCommercialPolicySurfaceBridge = function (spec) {
    var bridge = buildCommercialPolicySurfaceBridge(spec);
    bridge.install();
    return bridge;
  };
})();
