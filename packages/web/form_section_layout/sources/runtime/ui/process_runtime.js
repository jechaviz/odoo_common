(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

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
        uid = v2.ensureUserScopedKeys();
        if (_state.formLayoutReady && _state.formLayoutReadyUserId === uid) {
          return _state.formLayoutState;
        }
        if (_state.formLayoutReady && _state.formLayoutReadyUserId !== uid) {
          _state.formLayoutReady = false;
        }
        var localState = v2.readLocalLayoutState();
        var globalDbState = v2.emptyLayoutState();
        var userDbState = v2.emptyLayoutState();

        _state.currentUserGroupIds = await v2.loadCurrentUserGroupIds();
        _state.formIsAdminUser = await v2.isCurrentUserAdmin();
        _state.formCanSaveToDb = await v2.canWriteConfigParameters();
        _state.availableRoleOptions = await v2.loadAvailableRoleOptions();

        try {
          var globalRaw = await v2.callKw("ir.config_parameter", "get_param", [v2.makeGlobalDbParamKey()], {});
          globalDbState = v2.parseLayoutState(globalRaw || "");
        } catch (_err) {
          globalDbState = v2.emptyLayoutState();
        }

        try {
          var userRaw = await v2.callKw("ir.config_parameter", "get_param", [_state.dbParamKey], {});
          userDbState = v2.parseLayoutState(userRaw || "");
        } catch (_err) {
          userDbState = v2.emptyLayoutState();
        }

        _state.formLayoutState = v2.mergeLayoutState(
          v2.mergeLayoutState(globalDbState, userDbState),
          localState
        );
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .catch(function () {
        _state.formLayoutState = v2.emptyLayoutState();
        _state.formCanSaveToDb = false;
        _state.formIsAdminUser = false;
        _state.currentUserGroupIds = [];
        _state.availableRoleOptions = [];
        _state.formLayoutReady = true;
        _state.formLayoutReadyUserId = uid;
        return _state.formLayoutState;
      })
      .finally(function () {
        _state.formLayoutLoadPromise = null;
      });

    return _state.formLayoutLoadPromise;
  }

  v2.ensureStateLoaded = ensureStateLoaded;

  function hasManagedFormHosts() {
    return document.querySelector(".o_form_view") instanceof HTMLElement;
  }

  v2.hasManagedFormHosts = hasManagedFormHosts;

  function ensureRuntimeBindings() {
    if (_state.runtimeBindingsReady) {
      return;
    }
    _state.runtimeBindingsReady = true;
    bindGlobalDragHandlers();
    v2.bindGlobalSectionControlVisibility();
    bindSubtotalActionAutoSave();
  }

  v2.ensureRuntimeBindings = ensureRuntimeBindings;

  function refreshLayout() {
    if (!hasManagedFormHosts()) {
      if (
        _state.settingsPanelState.currentForm instanceof HTMLElement &&
        !document.body.contains(_state.settingsPanelState.currentForm)
      ) {
        v2.closeSectionSettingsPanel();
      }
      return;
    }
    ensureRuntimeBindings();
    ensureStateLoaded().then(function () {
      document.querySelectorAll(".o_form_view").forEach(function (formNode) {
        v2.processFormNode(formNode);
      });
      v2.applyChatterVisibility();
      if (
        _state.settingsPanelState.currentForm instanceof HTMLElement &&
        document.body.contains(_state.settingsPanelState.currentForm)
      ) {
        return;
      }
      v2.closeSectionSettingsPanel();
    });
  }

  v2.refreshLayout = refreshLayout;

  function scheduleRefresh() {
    if (!hasManagedFormHosts()) {
      return;
    }
    if (_state.refreshScheduled) {
      return;
    }
    _state.refreshScheduled = true;
    window.requestAnimationFrame(function () {
      _state.refreshScheduled = false;
      refreshLayout();
    });
  }

  v2.scheduleRefresh = scheduleRefresh;

  function bindGlobalDragHandlers() {
    document.addEventListener("dragstart", v2.onDragStart);
    document.addEventListener("dragover", v2.onDragOver);
    document.addEventListener("drop", v2.onDrop);
    document.addEventListener("dragend", v2.onDragEnd);
  }

  v2.bindGlobalDragHandlers = bindGlobalDragHandlers;

  function bindSubtotalActionAutoSave() {
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

  v2.bindSubtotalActionAutoSave = bindSubtotalActionAutoSave;

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
      var editingSubtotal = v2.hasActiveSubtotalEditMode();
      var draggingSection = _state.dragSourceGroup instanceof HTMLElement;
      for (var i = 0; i < mutations.length; i += 1) {
        var mutation = mutations[i];
        var target = mutation && mutation.target;
        if (target instanceof HTMLElement && target.closest("#" + v2.SETTINGS_PANEL_ID)) {
          continue;
        }
        if (!hasManagedForms) {
          continue;
        }
        if (editingSubtotal || draggingSection) {
          continue;
        }
        shouldRefresh = true;
        break;
      }
      if (shouldRefresh) {
        scheduleRefresh();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("hashchange", scheduleRefresh);
    window.addEventListener("popstate", scheduleRefresh);
    document.addEventListener("keydown", function (event) {
      if (event && event.key === "Escape") {
        v2.closeSectionSettingsPanel();
      }
    });
  }

  v2.boot = boot;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
