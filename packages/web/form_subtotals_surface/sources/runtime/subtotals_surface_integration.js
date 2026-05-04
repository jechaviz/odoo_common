(function (v2) {
  "use strict";

  var _state = v2.state = v2.state || {};

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("form subtotals surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

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

  function readArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function resolveFormSubtotalsRoot(rawOptions) {
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

  function normalizeFormSubtotalsSurfaceSpec(rawSpec) {
    var spec = readOptions(rawSpec);
    var root = asElement(spec.root);
    var selector = normalizeScalarText(spec.selector);
    var resolveRoot = readFunction(spec.resolveRoot);
    if (!(root || selector || resolveRoot)) {
      throw new Error("form subtotals surface spec.root, spec.selector, or spec.resolveRoot is required.");
    }
    var scopeKey = normalizeScalarText(spec.scopeKey);
    var resolveScopeKey = readFunction(spec.resolveScopeKey);
    if (!(scopeKey || resolveScopeKey)) {
      throw new Error("form subtotals surface spec.scopeKey or spec.resolveScopeKey is required.");
    }
    return {
      root: root,
      selector: selector,
      resolveRoot: resolveRoot,
      scopeKey: scopeKey,
      resolveScopeKey: resolveScopeKey,
      fieldDisplayNormalizers: readArray(spec.fieldDisplayNormalizers),
      beforeProcess: readFunction(spec.beforeProcess),
      afterProcess: readFunction(spec.afterProcess),
    };
  }

  function buildFormSubtotalsRuntimeSpec(spec, rawOptions) {
    var options = readOptions(rawOptions);
    return {
      root: asElement(options.root) || spec.root,
      selector: normalizeScalarText(options.selector || spec.selector),
      resolveRoot: readFunction(options.resolveRoot) || spec.resolveRoot,
      scopeKey: normalizeScalarText(options.scopeKey || spec.scopeKey),
      resolveScopeKey: readFunction(options.resolveScopeKey) || spec.resolveScopeKey,
      fieldDisplayNormalizers: readArray(options.fieldDisplayNormalizers).length
        ? readArray(options.fieldDisplayNormalizers)
        : readArray(spec.fieldDisplayNormalizers),
      beforeProcess: readFunction(options.beforeProcess) || spec.beforeProcess,
      afterProcess: readFunction(options.afterProcess) || spec.afterProcess,
    };
  }

  function resolveFormSubtotalsScopeKey(spec, formNode, rawOptions) {
    if (typeof spec.resolveScopeKey === "function") {
      var resolvedScopeKey = spec.resolveScopeKey(formNode, readOptions(rawOptions));
      return normalizeScalarText(resolvedScopeKey);
    }
    return normalizeScalarText(spec.scopeKey);
  }

  function processFormSubtotals(formNode, scopeKey) {
    if (!(formNode instanceof HTMLElement)) {
      return;
    }
    if (typeof v2.refreshSubtotalToggleStateFromBackend === "function") {
      v2.refreshSubtotalToggleStateFromBackend(formNode, v2.syncSubtotalRecordBinding(formNode));
    } else {
      v2.syncSubtotalRecordBinding(formNode);
    }
    v2.decorateSubtotalContainers(formNode, scopeKey);
    return true;
  }

  function bindSubtotalSurfaceRuntime() {
    if (_state.subtotalRuntimeBindingsReady) {
      return;
    }
    _state.subtotalRuntimeBindingsReady = true;
    document.addEventListener(
      "click",
      function (event) {
        var actionButton = v2.resolveFormActionButton(event.target);
        if (!(actionButton instanceof HTMLElement)) {
          return;
        }
        if (actionButton.dataset.libSubtotalAutoResumed === "1") {
          actionButton.dataset.libSubtotalAutoResumed = "";
          return;
        }
        var activeContexts = v2.collectActiveSubtotalEditContexts();
        var hasPendingSave = Boolean(_state.formLayoutSavePromise);
        if (!activeContexts.length && !hasPendingSave) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        var persistPromise = activeContexts.length ? v2.persistActiveSubtotalEdits(activeContexts) : Promise.resolve(true);
        persistPromise.then(function (ok) {
          if (!ok) {
            return;
          }
          var waitForSave = _state.formLayoutSavePromise || Promise.resolve();
          waitForSave.finally(function () {
            actionButton.dataset.libSubtotalAutoResumed = "1";
            window.setTimeout(function () {
              actionButton.click();
            }, 0);
          });
        });
      },
      true
    );
  }

  function buildFormSubtotalsSurfaceAdapter(rawSpec) {
    var spec = normalizeFormSubtotalsSurfaceSpec(rawSpec);

    function install() {
      bindSubtotalSurfaceRuntime();
      return true;
    }

    function process(rawOptions) {
      var runtimeSpec = buildFormSubtotalsRuntimeSpec(spec, rawOptions);
      var formNode = resolveFormSubtotalsRoot(runtimeSpec);
      if (!(formNode instanceof HTMLElement)) {
        return false;
      }
      var scopeKey = resolveFormSubtotalsScopeKey(runtimeSpec, formNode, rawOptions);
      install();
      if (typeof runtimeSpec.beforeProcess === "function") {
        runtimeSpec.beforeProcess(formNode, scopeKey, readOptions(rawOptions));
      }
      if (
        runtimeSpec.fieldDisplayNormalizers.length &&
        typeof v2.normalizeFieldDisplayValues === "function"
      ) {
        v2.normalizeFieldDisplayValues(formNode, runtimeSpec.fieldDisplayNormalizers);
      }
      var processed = !!processFormSubtotals(formNode, scopeKey);
      if (typeof runtimeSpec.afterProcess === "function") {
        runtimeSpec.afterProcess(formNode, scopeKey, processed, readOptions(rawOptions));
      }
      return processed;
    }

    function readState() {
      return {
        selector: spec.selector,
        scopeKey: spec.scopeKey,
        fieldDisplayNormalizerCount: spec.fieldDisplayNormalizers.length,
      };
    }

    return {
      install: install,
      process: process,
      readState: readState,
    };
  }

  v2.processFormSubtotals = processFormSubtotals;
  v2.bindSubtotalSurfaceRuntime = bindSubtotalSurfaceRuntime;
  var surfaceLayers = requireSurfaceLayerApi();
  surfaceLayers.resolveFormSubtotalsRoot = resolveFormSubtotalsRoot;
  surfaceLayers.normalizeFormSubtotalsSurfaceSpec = normalizeFormSubtotalsSurfaceSpec;
  surfaceLayers.buildFormSubtotalsSurfaceAdapter = buildFormSubtotalsSurfaceAdapter;
  window.OdooSurfaceLayers = surfaceLayers;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
