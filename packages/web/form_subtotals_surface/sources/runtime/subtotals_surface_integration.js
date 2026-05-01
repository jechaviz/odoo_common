(function (v2) {
  "use strict";

  var _state = v2.state = v2.state || {};

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

  v2.processFormSubtotals = processFormSubtotals;
  v2.bindSubtotalSurfaceRuntime = bindSubtotalSurfaceRuntime;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
