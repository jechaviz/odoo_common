(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/edit_mode.js

  function removeStaleSubtotalRenderArtifacts(containerNode) {
    [
      SUBTOTAL_LINES_WRAP_CLASS,
      SUBTOTAL_CONFIG_TRIGGER_CLASS,
      SUBTOTAL_RESTORE_TRIGGER_CLASS,
      SUBTOTAL_SAVE_TRIGGER_CLASS,
      SUBTOTAL_ERROR_ICON_CLASS,
    ].forEach(function (className) {
      var staleNode = containerNode.querySelector(":scope > ." + className);
      if (staleNode instanceof HTMLElement) {
        staleNode.remove();
      }
    });
    var scopeKey = cleanText(containerNode.dataset.libSubtotalScope || "");
    var containerKey = cleanText(containerNode.dataset.libSubtotalKey || "");
    if (scopeKey && containerKey) {
      var anchorNode = document.querySelector(
        "." +
        SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
        "[data-lib-subtotal-scope='" +
        scopeKey +
        "'][data-lib-subtotal-key='" +
        containerKey +
        "']"
      );
      if (anchorNode instanceof HTMLElement) {
        anchorNode.remove();
      }
    }
    containerNode.classList.remove(SUBTOTAL_CONTAINER_CLASS, SUBTOTAL_EDIT_MODE_CLASS);
  }

  function ensureSubtotalConfigTrigger(containerNode) {
    var trigger = containerNode.querySelector(":scope > ." + SUBTOTAL_CONFIG_TRIGGER_CLASS);
    if (!(trigger instanceof HTMLElement)) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = SUBTOTAL_CONFIG_TRIGGER_CLASS;
      containerNode.insertBefore(trigger, containerNode.firstChild);
    }
    applyPencilTriggerIcon(trigger, "Edit subtotal");
    trigger.hidden = false;
    return trigger;
  }

  function ensureSubtotalRestoreTrigger(containerNode) {
    var restoreTrigger = containerNode.querySelector(":scope > ." + SUBTOTAL_RESTORE_TRIGGER_CLASS);
    if (!(restoreTrigger instanceof HTMLElement)) {
      restoreTrigger = document.createElement("button");
      restoreTrigger.type = "button";
      restoreTrigger.className = SUBTOTAL_RESTORE_TRIGGER_CLASS;
      containerNode.insertBefore(restoreTrigger, containerNode.firstChild);
    }
    applyButtonIcon(restoreTrigger, "fa fa-undo", "Restore subtotal defaults");
    restoreTrigger.hidden = true;
    return restoreTrigger;
  }

  function ensureSubtotalErrorIcon(containerNode) {
    var errorIcon = containerNode.querySelector(":scope > ." + SUBTOTAL_ERROR_ICON_CLASS);
    if (!(errorIcon instanceof HTMLElement)) {
      errorIcon = document.createElement("span");
      errorIcon.className = SUBTOTAL_ERROR_ICON_CLASS;
      errorIcon.setAttribute("aria-hidden", "true");
      errorIcon.textContent = "!";
      containerNode.insertBefore(errorIcon, containerNode.firstChild);
    }
    errorIcon.hidden = true;
    errorIcon.title = "";
    return errorIcon;
  }

  function bindSubtotalConfigTrigger(trigger, containerNode, formNode, scopeKey, containerKey) {
    trigger.onclick = async function (event) {
      event.preventDefault();
      event.stopPropagation();
      var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
      var isEditing = Boolean(_state.subtotalEditModes[editStateKey]);
      if (!isEditing) {
        setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, true, false);
        return;
      }

      var currentLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      var validation = validateSubtotalLayoutForSave(currentLayout);
      if (!validation.valid) {
        renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
        window.alert("Fix invalid formulas before saving.");
        return;
      }
      writeSubtotalLayoutState(scopeKey, containerKey, currentLayout);
      _state.subtotalEditSnapshots[editStateKey] = cloneSubtotalLayout(currentLayout);
      setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, false, true);
      trigger.disabled = true;
      var persistPromise = queueStatePersist({
        scopeKey: scopeKey,
        containerKey: containerKey,
      });
      try {
        await Promise.race([persistPromise, delayMs(8000)]);
      } finally {
        trigger.disabled = false;
      }
    };
  }

  function bindSubtotalRestoreTrigger(restoreTrigger, containerNode, formNode, scopeKey, containerKey) {
    restoreTrigger.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!window.confirm("Restore subtotal layout to defaults?")) {
        return;
      }
      var defaults = buildDefaultSubtotalLayout(collectSubtotalNativeRows(containerNode, true));
      writeSubtotalLayoutState(scopeKey, containerKey, defaults);
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      queueStatePersist({
        scopeKey: scopeKey,
        containerKey: containerKey,
      });
    };
  }

  function setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, enabled, persistChanges) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    var editKey = subtotalEditStateKey(scopeKey, containerKey);
    var nextEnabled = Boolean(enabled);
    if (nextEnabled) {
      _state.subtotalEditModes[editKey] = true;
      _state.subtotalEditSnapshots[editKey] = cloneSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      return;
    }

    var snapshot = _state.subtotalEditSnapshots[editKey];
    if (snapshot && typeof snapshot === "object") {
      var currentLayout = cloneSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      if (!persistChanges && subtotalLayoutSignature(currentLayout) !== subtotalLayoutSignature(snapshot)) {
        writeSubtotalLayoutState(scopeKey, containerKey, snapshot);
      }
      delete _state.subtotalEditSnapshots[editKey];
    }
    _state.subtotalEditModes[editKey] = false;
    renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
  }

  v2.setSubtotalEditMode = setSubtotalEditMode;
  function decorateSubtotalContainers(formNode, scopeKey) {
    var containers = findSubtotalContainers(formNode);
    containers.forEach(function (containerNode, index) {
      var containerKey = "subtotal_" + String(index + 1);
      containerNode.dataset.libSubtotalKey = containerKey;
      containerNode.dataset.libSubtotalScope = scopeKey;

      var existingLayout = normalizeSubtotalLayout(readSubtotalLayoutState(scopeKey, containerKey));
      var hasNativeRows = collectSubtotalNativeRows(containerNode, true).length > 0;
      var hasSavedRows = Array.isArray(existingLayout.lines) && existingLayout.lines.length > 0;
      if (!hasNativeRows && !hasSavedRows) {
        removeStaleSubtotalRenderArtifacts(containerNode);
        return;
      }

      var trigger = ensureSubtotalConfigTrigger(containerNode);
      bindSubtotalConfigTrigger(trigger, containerNode, formNode, scopeKey, containerKey);

      var staleSave = containerNode.querySelector(":scope > ." + SUBTOTAL_SAVE_TRIGGER_CLASS);
      if (staleSave instanceof HTMLElement) {
        staleSave.remove();
      }

      var restoreTrigger = ensureSubtotalRestoreTrigger(containerNode);
      bindSubtotalRestoreTrigger(restoreTrigger, containerNode, formNode, scopeKey, containerKey);
      ensureSubtotalErrorIcon(containerNode);

      if (containerNode.dataset.libSubtotalDblBound !== "1") {
        containerNode.dataset.libSubtotalDblBound = "1";
        containerNode.addEventListener("dblclick", function (event) {
          var target = event.target;
          if (
            target instanceof HTMLElement &&
            (target.closest("input, textarea, select, button, a") || target.closest("." + SUBTOTAL_EDIT_ACTIONS_CLASS))
          ) {
            return;
          }
          var editStateKey = subtotalEditStateKey(scopeKey, containerKey);
          var nextEnabled = !Boolean(_state.subtotalEditModes[editStateKey]);
          setSubtotalEditMode(containerNode, formNode, scopeKey, containerKey, nextEnabled, false);
        });
      }

      renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
      ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey);
    });
  }

  v2.decorateSubtotalContainers = decorateSubtotalContainers;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
