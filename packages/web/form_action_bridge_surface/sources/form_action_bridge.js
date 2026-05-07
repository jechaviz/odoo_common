(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before form action bridge surface.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before form action bridge surface."
      );
    }
    return candidate;
  }

  var FORM_ACTION_BRIDGE_ENHANCER_KEY = "formActionBridge";
  var DEFAULT_BRIDGE_KEY = "form-action-bridge";
  var DEFAULT_FORM_SELECTOR = ".o_form_view";
  var DEFAULT_ACTION_BUTTON_SELECTOR = "button[type='action'], a[type='action'], [type='action'][role='button']";
  var DEFAULT_SAVE_BUTTON_SELECTOR = ".o_form_button_save";
  var DEFAULT_BUSY_ATTR = "data-surface-form-action-running";
  var DEFAULT_CONTEXT_ATTR = "context";
  var DEFAULT_WAIT_FOR_PERSIST_MS = 15000;
  var MIN_WAIT_FOR_PERSIST_MS = 1000;
  var RECORD_MATERIALIZATION_POLL_MS = 160;
  var ODOO_ACTION_SERVICE = "action";
  var ODOO_ORM_SERVICE = "orm";
  var SERVER_ACTION_MODEL = "ir.actions.server";
  var SERVER_ACTION_METHOD = "run";
  var URL_ACTION_TYPE = "ir.actions.act_url";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function toInteger(value) {
    return Number.parseInt(String(value || 0), 10) || 0;
  }

  function readObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function readFunction(value) {
    return typeof value === "function" ? value : null;
  }

  function closestElement(target, selector) {
    var normalizedSelector = normalizeText(selector);
    if (!(target instanceof HTMLElement) || !normalizedSelector) {
      return null;
    }
    try {
      var candidate = target.closest(normalizedSelector);
      return candidate instanceof HTMLElement ? candidate : null;
    } catch (_error) {
      return null;
    }
  }

  function querySelectorElement(root, selector) {
    var normalizedSelector = normalizeText(selector);
    if (!(root instanceof HTMLElement) || !normalizedSelector) {
      return null;
    }
    try {
      var candidate = root.querySelector(normalizedSelector);
      return candidate instanceof HTMLElement ? candidate : null;
    } catch (_error) {
      return null;
    }
  }

  function readBooleanFlag(source, key, fallbackValue) {
    if (!source || !Object.prototype.hasOwnProperty.call(source, key)) {
      return !!fallbackValue;
    }
    return !!source[key];
  }

  function normalizeActionRequest(value) {
    if (value == null || value === "") {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "number") {
      var numericValue = toInteger(value);
      return numericValue > 0 ? numericValue : null;
    }
    var actionText = normalizeText(value);
    if (!actionText) {
      return null;
    }
    if (/^\d+$/.test(actionText)) {
      var numericActionId = toInteger(actionText);
      return numericActionId > 0 ? numericActionId : null;
    }
    return actionText;
  }

  function getDebugRoot() {
    try {
      return window.odoo && window.odoo.__WOWL_DEBUG__ && window.odoo.__WOWL_DEBUG__.root;
    } catch (_error) {
      return null;
    }
  }

  function collectFormControllers() {
    var root = getDebugRoot();
    var controllers = [];
    function walk(node) {
      if (!node || !node.component) {
        return;
      }
      if (node.component.constructor && node.component.constructor.name === "FormController") {
        controllers.push(node.component);
      }
      var children = node.children || {};
      Object.keys(children).forEach(function (key) {
        var child = children[key];
        if (Array.isArray(child)) {
          child.forEach(walk);
          return;
        }
        walk(child);
      });
    }
    if (root && root.__owl__) {
      walk(root.__owl__);
    }
    return controllers;
  }

  function findActionButton(target, adapter) {
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    return closestElement(target, adapter.buttonSelector || DEFAULT_ACTION_BUTTON_SELECTOR);
  }

  function isButtonVisible(button) {
    if (!(button instanceof HTMLElement) || button.hidden) {
      return false;
    }
    var styles = window.getComputedStyle(button);
    if (styles.display === "none" || styles.visibility === "hidden") {
      return false;
    }
    if ((button instanceof HTMLButtonElement || button instanceof HTMLInputElement) && button.disabled) {
      return false;
    }
    return String(button.getAttribute("aria-disabled") || "").trim().toLowerCase() !== "true";
  }

  function normalizeFormActionBridgeSpec(rawSpec) {
    var spec = readObject(rawSpec);
    var explicitActionRequest = Object.prototype.hasOwnProperty.call(spec, "actionRequest")
      ? normalizeActionRequest(spec.actionRequest)
      : normalizeActionRequest(spec.actionId);
    return {
      enhancerKey: FORM_ACTION_BRIDGE_ENHANCER_KEY,
      bridgeKey: normalizeText(spec.bridgeKey || DEFAULT_BRIDGE_KEY),
      formSelector: normalizeText(spec.formSelector || DEFAULT_FORM_SELECTOR),
      buttonSelector: normalizeText(spec.buttonSelector || DEFAULT_ACTION_BUTTON_SELECTOR),
      saveButtonSelector: normalizeText(spec.saveButtonSelector || DEFAULT_SAVE_BUTTON_SELECTOR),
      busyAttr: normalizeText(spec.busyAttr || DEFAULT_BUSY_ATTR),
      contextAttribute: normalizeText(spec.contextAttribute || DEFAULT_CONTEXT_ATTR),
      actionRequest: explicitActionRequest,
      parseButtonContext: readBooleanFlag(spec, "parseButtonContext", true),
      persistBeforeAction: readBooleanFlag(spec, "persistBeforeAction", true),
      runServerActions: readBooleanFlag(spec, "runServerActions", true),
      waitForPersistMs: Math.max(toInteger(spec.waitForPersistMs || DEFAULT_WAIT_FOR_PERSIST_MS), MIN_WAIT_FOR_PERSIST_MS),
      acceptButton: readFunction(spec.acceptButton),
      resolveActionRequest: readFunction(spec.resolveActionRequest),
      resolveAdditionalContext: readFunction(spec.resolveAdditionalContext),
      shouldPersistBeforeAction: readFunction(spec.shouldPersistBeforeAction),
      onBeforeRun: readFunction(spec.onBeforeRun),
      onAfterRun: readFunction(spec.onAfterRun),
      onError: readFunction(spec.onError),
    };
  }

  function buildFormActionBridgeConfig(rawSpec) {
    return normalizeFormActionBridgeSpec(rawSpec);
  }

  function resolveFormRoot(runtimeContext, adapter) {
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var explicitFormRoot = asElement(context.formRoot);
    if (explicitFormRoot instanceof HTMLElement) {
      return explicitFormRoot;
    }
    return findVisibleForm({
      formSelector: adapter.formSelector,
      allowFallback: false,
    });
  }

  function resolveButtonController(button, runtimeContext) {
    var target = asElement(button);
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var explicitController = context.controller && typeof context.controller === "object" ? context.controller : null;
    if (explicitController && explicitController.el instanceof HTMLElement && target instanceof HTMLElement && explicitController.el.contains(target)) {
      return explicitController;
    }
    var actionService = context.actionService && typeof context.actionService === "object" ? context.actionService : null;
    var currentController = actionService && actionService.currentController ? actionService.currentController : null;
    var candidates = [];
    if (currentController) {
      candidates.push(currentController);
    }
    collectFormControllers().forEach(function (controller) {
      if (controller && candidates.indexOf(controller) === -1) {
        candidates.push(controller);
      }
    });
    return candidates.find(function (controller) {
      return !!(
        controller &&
        controller.el instanceof HTMLElement &&
        target instanceof HTMLElement &&
        controller.el.contains(target)
      );
    }) || currentController || null;
  }

  function resolveRecordIdFromController(controller) {
    var modelRoot = controller && controller.model && controller.model.root ? controller.model.root : null;
    var action = controller && controller.action ? controller.action : null;
    return toInteger(
      (modelRoot &&
        (modelRoot.resId ||
          modelRoot.res_id ||
          modelRoot.currentId ||
          modelRoot.id ||
          (modelRoot.data && modelRoot.data.id) ||
          0)) ||
      (controller && controller.props && controller.props.resId) ||
      (action && action.res_id) ||
      0
    );
  }

  function resolveModelNameFromController(controller) {
    var modelRoot = controller && controller.model && controller.model.root ? controller.model.root : null;
    var action = controller && controller.action ? controller.action : null;
    return normalizeText(
      (modelRoot &&
        (modelRoot.resModel ||
          modelRoot.model ||
          modelRoot.modelName ||
          (modelRoot._config && modelRoot._config.resModel))) ||
      (controller && controller.props && controller.props.resModel) ||
      (action && action.res_model) ||
      ""
    );
  }

  function resolveManagedFormActionMeta(button, runtimeContext) {
    var controller = resolveButtonController(button, runtimeContext);
    var modelRoot = controller && controller.model && controller.model.root ? controller.model.root : null;
    var action = controller && controller.action ? controller.action : null;
    return {
      controller: controller,
      modelRoot: modelRoot,
      action: action,
      modelName: resolveModelNameFromController(controller),
      recordId: resolveRecordIdFromController(controller),
    };
  }

  function resolveManagedFormActionRequest(button, adapter, runtimeContext, meta) {
    if (adapter.resolveActionRequest) {
      try {
        return normalizeActionRequest(adapter.resolveActionRequest(button, runtimeContext || {}, meta || {}, adapter));
      } catch (_error) {
        return null;
      }
    }
    var explicitActionRequest = normalizeActionRequest(adapter.actionRequest);
    if (explicitActionRequest != null && explicitActionRequest !== "") {
      return explicitActionRequest;
    }
    return null;
  }

  function parseButtonContextValue(buttonContext, token) {
    var matcher = new RegExp("['\"]" + token + "['\"]\\s*:\\s*(\\d+|id)\\b", "i");
    var match = String(buttonContext || "").match(matcher);
    return match && match[1] ? normalizeText(match[1]) : "";
  }

  function parseButtonContextModel(buttonContext) {
    var match = String(buttonContext || "").match(/['"]active_model['"]\s*:\s*['"]([^'"]+)['"]/i);
    return match && match[1] ? normalizeText(match[1]) : "";
  }

  function parseAdditionalContextFromButton(button, meta, adapter) {
    var normalizedAdapter = adapter && typeof adapter === "object" ? adapter : {};
    if (!(button instanceof HTMLElement) || normalizedAdapter.parseButtonContext === false) {
      return {};
    }
    var contextText = String(button.getAttribute(normalizedAdapter.contextAttribute || DEFAULT_CONTEXT_ATTR) || "").trim();
    if (!contextText) {
      return {};
    }
    var activeModel = parseButtonContextModel(contextText);
    var activeIdToken = parseButtonContextValue(contextText, "active_id");
    var activeIdsToken = parseButtonContextValue(contextText, "active_ids");
    var parsedContext = {};
    if (activeModel) {
      parsedContext.active_model = activeModel;
    }
    if (activeIdToken) {
      parsedContext.active_id = activeIdToken === "id" ? toInteger(meta && meta.recordId) : toInteger(activeIdToken);
    }
    if (activeIdsToken) {
      parsedContext.active_ids = [
        activeIdsToken === "id" ? toInteger(meta && meta.recordId) : toInteger(activeIdsToken),
      ].filter(function (value) {
        return value > 0;
      });
    }
    return parsedContext;
  }

  function resolveManagedFormAdditionalContext(button, adapter, runtimeContext, meta) {
    var controller = meta && meta.controller ? meta.controller : null;
    var action = meta && meta.action ? meta.action : null;
    var mergedContext = Object.assign({}, (action && action.context) || {}, parseAdditionalContextFromButton(button, meta, adapter));
    if (adapter.resolveAdditionalContext) {
      try {
        mergedContext = Object.assign(
          {},
          mergedContext,
          readObject(adapter.resolveAdditionalContext(button, runtimeContext || {}, meta || {}, adapter))
        );
      } catch (_error) {}
    }
    var modelName = normalizeText(mergedContext.active_model || (meta && meta.modelName) || "");
    var recordId = toInteger(mergedContext.active_id || (meta && meta.recordId) || 0);
    if (modelName) {
      mergedContext.active_model = modelName;
    }
    if (recordId > 0) {
      mergedContext.active_id = recordId;
      mergedContext.active_ids = [recordId];
    }
    return mergedContext;
  }

  function shouldPersistBeforeAction(button, actionRequest, adapter, runtimeContext, meta) {
    if (adapter.shouldPersistBeforeAction) {
      try {
        return adapter.shouldPersistBeforeAction(button, actionRequest, meta || {}, runtimeContext || {}, adapter) !== false;
      } catch (_error) {
        return true;
      }
    }
    if (adapter.persistBeforeAction === false) {
      return false;
    }
    var controller = meta && meta.controller ? meta.controller : null;
    var modelRoot = meta && meta.modelRoot ? meta.modelRoot : null;
    var hasSaveHook = !!(
      (modelRoot && typeof modelRoot.save === "function") ||
      (controller && typeof controller.save === "function")
    );
    return !(meta && meta.recordId > 0) || hasSaveHook;
  }

  function findNativeSaveButton(meta, formRoot, adapter) {
    var roots = [];
    if (meta && meta.controller && meta.controller.el instanceof HTMLElement) {
      roots.push(meta.controller.el);
    }
    if (formRoot instanceof HTMLElement && roots.indexOf(formRoot) === -1) {
      roots.push(formRoot);
    }
    for (var index = 0; index < roots.length; index += 1) {
      var candidate = querySelectorElement(roots[index], adapter.saveButtonSelector);
      if (isButtonVisible(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  function waitForRecordMaterialization(button, runtimeContext, previousRecordId, timeoutMs) {
    var initialRecordId = toInteger(previousRecordId);
    var resolvedTimeoutMs = Math.max(toInteger(timeoutMs || DEFAULT_WAIT_FOR_PERSIST_MS), MIN_WAIT_FOR_PERSIST_MS);
    return new Promise(function (resolve) {
      var settled = false;
      var intervalId = 0;
      var timeoutId = 0;
      function finish(recordId) {
        if (settled) {
          return;
        }
        settled = true;
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        resolve(toInteger(recordId));
      }
      function readRecordId() {
        var nextMeta = resolveManagedFormActionMeta(button, runtimeContext);
        return toInteger(nextMeta && nextMeta.recordId);
      }
      function check() {
        var recordId = readRecordId();
        if (recordId > 0 && (!(initialRecordId > 0) || recordId !== initialRecordId)) {
          finish(recordId);
        }
      }
      timeoutId = window.setTimeout(function () {
        finish(readRecordId());
      }, resolvedTimeoutMs);
      intervalId = window.setInterval(check, RECORD_MATERIALIZATION_POLL_MS);
      check();
    });
  }

  async function persistManagedFormChanges(button, adapter, runtimeContext, meta) {
    if (!(meta && typeof meta === "object")) {
      return false;
    }
    var modelRoot = meta.modelRoot || null;
    if (modelRoot && typeof modelRoot.save === "function") {
      try {
        await modelRoot.save();
        return true;
      } catch (_error) {
        return false;
      }
    }
    var controller = meta.controller || null;
    if (controller && typeof controller.save === "function") {
      try {
        await controller.save();
        return true;
      } catch (_error) {
        return false;
      }
    }
    var formRoot = resolveFormRoot(runtimeContext, adapter);
    var saveButton = findNativeSaveButton(meta, formRoot, adapter);
    if (!(saveButton instanceof HTMLElement)) {
      return false;
    }
    try {
      saveButton.click();
      var materializedRecordId = await waitForRecordMaterialization(
        button,
        runtimeContext,
        meta.recordId,
        adapter.waitForPersistMs
      );
      return materializedRecordId > 0 || toInteger(meta.recordId) > 0;
    } catch (_error) {
      return false;
    }
  }

  async function executeResolvedAction(actionRequest, additionalContext, actionService) {
    if (!actionRequest) {
      return true;
    }
    if (
      actionRequest &&
      typeof actionRequest === "object" &&
      normalizeText(actionRequest.type) === URL_ACTION_TYPE &&
      normalizeText(actionRequest.url)
    ) {
      var resolvedUrl = new URL(String(actionRequest.url || ""), window.location.origin).toString();
      if (normalizeText(actionRequest.target).toLowerCase() === "new") {
        window.open(resolvedUrl, "_blank", "noopener");
      } else {
        window.location.assign(resolvedUrl);
      }
      return true;
    }
    await actionService.doAction(actionRequest, {
      additionalContext: additionalContext || {},
    });
    return true;
  }

  async function runManagedFormAction(button, rawSpec, runtimeContext) {
    var adapter = normalizeFormActionBridgeSpec(rawSpec);
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var actionService = context.actionService && typeof context.actionService === "object"
      ? context.actionService
      : await resolveOdooService(ODOO_ACTION_SERVICE);
    var ormService = context.ormService && typeof context.ormService === "object"
      ? context.ormService
      : await resolveOdooService(ODOO_ORM_SERVICE);
    if (!(button instanceof HTMLElement) || !(actionService && typeof actionService.doAction === "function")) {
      return false;
    }
    var meta = resolveManagedFormActionMeta(button, Object.assign({}, context, { actionService: actionService }));
    if (adapter.acceptButton) {
      try {
        if (adapter.acceptButton(button, context, meta, adapter) === false) {
          return false;
        }
      } catch (_error) {
        return false;
      }
    }
    var actionRequest = resolveManagedFormActionRequest(button, adapter, context, meta);
    if (actionRequest == null || actionRequest === "") {
      return false;
    }
    if (adapter.onBeforeRun) {
      try {
        adapter.onBeforeRun({
          button: button,
          adapter: adapter,
          runtimeContext: context,
          meta: meta,
          actionRequest: actionRequest,
        });
      } catch (_error) {}
    }
    if (shouldPersistBeforeAction(button, actionRequest, adapter, context, meta)) {
      var persisted = await persistManagedFormChanges(
        button,
        adapter,
        Object.assign({}, context, { actionService: actionService, ormService: ormService }),
        meta
      );
      if (!persisted) {
        if (adapter.onError) {
          try {
            adapter.onError({
              button: button,
              adapter: adapter,
              runtimeContext: context,
              meta: meta,
              stage: "persist",
            });
          } catch (_error) {}
        }
        return false;
      }
      meta = resolveManagedFormActionMeta(button, Object.assign({}, context, { actionService: actionService }));
    }
    var additionalContext = resolveManagedFormAdditionalContext(button, adapter, context, meta);
    try {
      if (typeof actionRequest === "number" && adapter.runServerActions !== false && ormService && typeof ormService.call === "function") {
        var returnedAction = await ormService.call(
          SERVER_ACTION_MODEL,
          SERVER_ACTION_METHOD,
          [[actionRequest]],
          { context: additionalContext }
        ).catch(function () {
          return null;
        });
        if (returnedAction) {
          await executeResolvedAction(returnedAction, additionalContext, actionService);
          if (adapter.onAfterRun) {
            try {
              adapter.onAfterRun({
                button: button,
                adapter: adapter,
                runtimeContext: context,
                meta: meta,
                actionRequest: actionRequest,
                returnedAction: returnedAction,
              });
            } catch (_error) {}
          }
          return true;
        }
      }
      await executeResolvedAction(actionRequest, additionalContext, actionService);
      if (adapter.onAfterRun) {
        try {
          adapter.onAfterRun({
            button: button,
            adapter: adapter,
            runtimeContext: context,
            meta: meta,
            actionRequest: actionRequest,
          });
        } catch (_error) {}
      }
      return true;
    } catch (_error) {
      if (adapter.onError) {
        try {
          adapter.onError({
            button: button,
            adapter: adapter,
            runtimeContext: context,
            meta: meta,
            actionRequest: actionRequest,
            stage: "execute",
            error: _error,
          });
        } catch (__error) {}
      }
      return false;
    }
  }

  function bindManagedFormActionBridge(formRoot, adapter, runtimeContext) {
    if (!(formRoot instanceof HTMLElement)) {
      return false;
    }
    var state = readObject(formRoot._surfaceFormActionBridgeState);
    var entries = Array.isArray(state.entries) ? state.entries.slice() : [];
    entries = entries.filter(function (entry) {
      return !(entry && typeof entry === "object" && entry.bridgeKey === adapter.bridgeKey);
    });
    entries.push({
      bridgeKey: adapter.bridgeKey,
      adapter: adapter,
      runtimeContext: runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {},
    });
    state.entries = entries;
    formRoot._surfaceFormActionBridgeState = state;
    if (formRoot.dataset.surfaceFormActionBridgeBound === "1") {
      return true;
    }
    formRoot.dataset.surfaceFormActionBridgeBound = "1";
    formRoot.addEventListener("click", function (event) {
      var target = event && event.target instanceof HTMLElement ? event.target : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var liveState = readObject(formRoot._surfaceFormActionBridgeState);
      var liveEntries = Array.isArray(liveState.entries) ? liveState.entries : [];
      for (var index = 0; index < liveEntries.length; index += 1) {
        var entry = liveEntries[index];
        if (!(entry && typeof entry === "object" && entry.adapter && typeof entry.adapter === "object")) {
          continue;
        }
        var adapterValue = entry.adapter;
        var button = findActionButton(target, adapterValue);
        if (!(button instanceof HTMLElement) || !isButtonVisible(button)) {
          continue;
        }
        if (button.getAttribute(adapterValue.busyAttr) === "1") {
          return;
        }
        var meta = resolveManagedFormActionMeta(button, Object.assign({}, entry.runtimeContext));
        if (adapterValue.acceptButton) {
          try {
            if (adapterValue.acceptButton(button, entry.runtimeContext || {}, meta, adapterValue) === false) {
              continue;
            }
          } catch (_error) {
            continue;
          }
        }
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        button.setAttribute(adapterValue.busyAttr, "1");
        Promise.resolve(
          runManagedFormAction(button, adapterValue, Object.assign({}, entry.runtimeContext))
        ).catch(function () {
          return false;
        }).finally(function () {
          button.removeAttribute(adapterValue.busyAttr);
        });
        return;
      }
    }, true);
    return true;
  }

  function normalizeManagedFormActionBridgeConfigs(rawConfigs) {
    var configs = Array.isArray(rawConfigs)
      ? rawConfigs
      : rawConfigs && typeof rawConfigs === "object"
      ? [rawConfigs]
      : [];
    return configs.filter(function (entry) {
      return entry && typeof entry === "object" && String(entry.enhancerKey || "").trim().toLowerCase() === FORM_ACTION_BRIDGE_ENHANCER_KEY.toLowerCase();
    }).map(normalizeFormActionBridgeSpec);
  }

  function readFormActionBridgeState(formRoot) {
    if (!(formRoot instanceof HTMLElement)) {
      return {
        entries: [],
      };
    }
    var state = readObject(formRoot._surfaceFormActionBridgeState);
    return {
      entries: Array.isArray(state.entries) ? state.entries.slice() : [],
    };
  }

  function syncManagedFormActionBridges(config, state) {
    if (!(state && state.isForm && state.formRoot instanceof HTMLElement)) {
      return false;
    }
    var adapters = normalizeManagedFormActionBridgeConfigs(config && config.managedFormEnhancers);
    if (!adapters.length) {
      return false;
    }
    adapters.forEach(function (adapter) {
      bindManagedFormActionBridge(state.formRoot, adapter, {
        formRoot: state.formRoot,
        controlPanel: state.controlPanel,
      });
    });
    return true;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var registerManagedFormEnhancer = requireSurfaceLayerFunction(surfaceLayerApi, "registerManagedFormEnhancer");
  var resolveOdooService = requireSurfaceLayerFunction(surfaceLayerApi, "resolveOdooService");
  var findVisibleForm = requireSurfaceLayerFunction(surfaceLayerApi, "findVisibleForm");

  Object.assign(surfaceLayerApi, {
    buildFormActionBridgeConfig: buildFormActionBridgeConfig,
    normalizeFormActionBridgeSpec: normalizeFormActionBridgeSpec,
    readFormActionBridgeState: readFormActionBridgeState,
    resolveManagedFormActionMeta: resolveManagedFormActionMeta,
    resolveManagedFormActionRequest: resolveManagedFormActionRequest,
    runManagedFormAction: runManagedFormAction,
    syncManagedFormActionBridges: syncManagedFormActionBridges,
  });

  registerManagedFormEnhancer({
    key: FORM_ACTION_BRIDGE_ENHANCER_KEY,
    sync: syncManagedFormActionBridges,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
