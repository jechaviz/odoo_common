(function (v2) {
  "use strict";

  var _state = v2.state = v2.state || {};
  var FORM_ROOT_SELECTOR = v2.FORM_ROOT_SELECTOR || "[data-lib-scope-key]";

  function ensureStateLoaded() {
    if (_state.formLayoutLoadPromise) {
      return _state.formLayoutLoadPromise;
    }

    var uid = 0;
    _state.formLayoutLoadPromise = Promise.resolve()
      .then(async function () {
        if (typeof v2.loadSessionInfo === "function") {
          await v2.loadSessionInfo();
        }
        uid = typeof v2.ensureUserScopedKeys === "function" ? v2.ensureUserScopedKeys() : 0;
        if (_state.formLayoutReady && _state.formLayoutReadyUserId === uid) {
          return _state.formLayoutState;
        }
        var localState = typeof v2.readLocalLayoutState === "function" ? v2.readLocalLayoutState() : v2.emptyLayoutState();
        var globalDbState = v2.emptyLayoutState();
        var userDbState = v2.emptyLayoutState();

        if (typeof v2.canWriteConfigParameters === "function") {
          _state.formCanSaveToDb = await v2.canWriteConfigParameters();
        }

        if (_state.formCanSaveToDb && typeof v2.callKw === "function") {
          try {
            globalDbState = v2.parseLayoutState(await v2.callKw("ir.config_parameter", "get_param", [v2.makeGlobalDbParamKey()], {}) || "");
          } catch (_err) {
            globalDbState = v2.emptyLayoutState();
          }
          try {
            userDbState = v2.parseLayoutState(await v2.callKw("ir.config_parameter", "get_param", [_state.dbParamKey], {}) || "");
          } catch (_err) {
            userDbState = v2.emptyLayoutState();
          }
        }

        _state.formLayoutState = v2.mergeLayoutState(v2.mergeLayoutState(globalDbState, userDbState), localState);
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .catch(function () {
        _state.formLayoutState = v2.emptyLayoutState();
        _state.formCanSaveToDb = false;
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .finally(function () {
        _state.formLayoutLoadPromise = null;
      });

    return _state.formLayoutLoadPromise;
  }

  function hasManagedFormHosts() {
    return document.querySelector(FORM_ROOT_SELECTOR) instanceof HTMLElement;
  }

  function bindGlobalDragHandlers() {
    document.addEventListener("dragstart", v2.onDragStart);
    document.addEventListener("dragover", v2.onDragOver);
    document.addEventListener("drop", v2.onDrop);
    document.addEventListener("dragend", v2.onDragEnd);
  }

  function ensureRuntimeBindings() {
    if (_state.runtimeBindingsReady) {
      return;
    }
    _state.runtimeBindingsReady = true;
    bindGlobalDragHandlers();
    if (typeof v2.bindSubtotalSurfaceRuntime === "function") {
      v2.bindSubtotalSurfaceRuntime();
    }
  }

  function refreshLayout() {
    if (!hasManagedFormHosts()) {
      return;
    }
    ensureRuntimeBindings();
    ensureStateLoaded().then(function () {
      document.querySelectorAll(FORM_ROOT_SELECTOR).forEach(function (formNode) {
        v2.processFormNode(formNode);
      });
    });
  }

  function scheduleRefresh() {
    if (!hasManagedFormHosts() || _state.refreshScheduled) {
      return;
    }
    _state.refreshScheduled = true;
    window.requestAnimationFrame(function () {
      _state.refreshScheduled = false;
      refreshLayout();
    });
  }

  function boot() {
    if (hasManagedFormHosts()) {
      ensureRuntimeBindings();
      scheduleRefresh();
    }

    var observer = new MutationObserver(function (mutations) {
      var hasManagedForms = hasManagedFormHosts();
      if (hasManagedForms) {
        ensureRuntimeBindings();
      }
      var shouldRefresh = false;
      var editingSubtotal = typeof v2.hasActiveSubtotalEditMode === "function" && v2.hasActiveSubtotalEditMode();
      var draggingSection = _state.dragSourceGroup instanceof HTMLElement;
      for (var index = 0; index < mutations.length; index += 1) {
        var mutation = mutations[index];
        var target = mutation && mutation.target;
        if (!hasManagedForms || editingSubtotal || draggingSection) {
          continue;
        }
        if (target instanceof HTMLElement) {
          shouldRefresh = true;
          break;
        }
      }
      if (shouldRefresh) {
        scheduleRefresh();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  v2.ensureStateLoaded = ensureStateLoaded;
  v2.hasManagedFormHosts = hasManagedFormHosts;
  v2.bindGlobalDragHandlers = bindGlobalDragHandlers;
  v2.ensureRuntimeBindings = ensureRuntimeBindings;
  v2.refreshLayout = refreshLayout;
  v2.scheduleRefresh = scheduleRefresh;
  v2.boot = boot;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
