(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  v2.subtotals_runtime = v2.subtotals_runtime || {};
  var _state = v2.state = v2.state || {};

  function closeSubtotalToggleMenus(exceptAnchor) {
    var keepAnchor = exceptAnchor instanceof HTMLElement ? exceptAnchor : null;
    document
      .querySelectorAll("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS + "." + SUBTOTAL_TOGGLE_MENU_OPEN_CLASS)
      .forEach(function (anchorNode) {
        if (!(anchorNode instanceof HTMLElement)) {
          return;
        }
        if (keepAnchor && anchorNode === keepAnchor) {
          return;
        }
        anchorNode.classList.remove(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS);
        var triggerNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS);
        if (triggerNode instanceof HTMLElement) {
          triggerNode.setAttribute("aria-expanded", "false");
        }
      });
    _state.subtotalToggleMenuOpenAnchor = keepAnchor;
  }

  function bindSubtotalToggleMenuGlobalHandlers() {
    if (_state.subtotalToggleMenuHandlersBound) {
      return;
    }
    _state.subtotalToggleMenuHandlersBound = true;
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (target instanceof HTMLElement && target.closest("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS)) {
        return;
      }
      closeSubtotalToggleMenus();
    });
    document.addEventListener("keydown", function (event) {
      if (!(event && event.key === "Escape")) {
        return;
      }
      closeSubtotalToggleMenus();
    });
  }

  function subtotalToggleMenuRetryKey(scopeKey, containerKey) {
    return cleanText(scopeKey || "") + "::" + cleanText(containerKey || "");
  }

  function clearSubtotalToggleMenuRetry(scopeKey, containerKey) {
    _state.subtotalToggleMenuRetryTimers = _state.subtotalToggleMenuRetryTimers || {};
    _state.subtotalToggleMenuRetryCounts = _state.subtotalToggleMenuRetryCounts || {};
    var retryKey = subtotalToggleMenuRetryKey(scopeKey, containerKey);
    var timerId = _state.subtotalToggleMenuRetryTimers[retryKey];
    if (timerId) {
      window.clearTimeout(timerId);
      delete _state.subtotalToggleMenuRetryTimers[retryKey];
    }
    delete _state.subtotalToggleMenuRetryCounts[retryKey];
  }

  function scheduleSubtotalToggleMenuRetry(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    _state.subtotalToggleMenuRetryTimers = _state.subtotalToggleMenuRetryTimers || {};
    _state.subtotalToggleMenuRetryCounts = _state.subtotalToggleMenuRetryCounts || {};
    var retryKey = subtotalToggleMenuRetryKey(scopeKey, containerKey);
    if (_state.subtotalToggleMenuRetryTimers[retryKey]) {
      return;
    }
    var retryCount = Number(_state.subtotalToggleMenuRetryCounts[retryKey] || 0);
    if (retryCount >= 8) {
      return;
    }
    _state.subtotalToggleMenuRetryCounts[retryKey] = retryCount + 1;
    var retryDelay = retryCount < 3 ? 200 : 450;
    _state.subtotalToggleMenuRetryTimers[retryKey] = window.setTimeout(function () {
      delete _state.subtotalToggleMenuRetryTimers[retryKey];
      ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey);
    }, retryDelay);
  }

  function findSubtotalToggleMenuAnchor(scopeKey, containerKey) {
    return document.querySelector("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
      "[data-lib-subtotal-scope='" + cleanText(scopeKey || "") + "']" +
      "[data-lib-subtotal-key='" + cleanText(containerKey || "") + "']");
  }

  function removeDuplicateSubtotalToggleMenuAnchors(anchorNode, hostNode, scopeKey, containerKey) {
    if (!(anchorNode instanceof HTMLElement)) {
      return;
    }
    var keepScopeKey = cleanText(scopeKey || "");
    var keepContainerKey = cleanText(containerKey || "");
    var hostParentNode = hostNode instanceof HTMLElement ? hostNode.parentElement : null;
    var duplicateNodes = [];
    var seenNodes = new Set();

    var registerDuplicate = function (candidateNode) {
      if (!(candidateNode instanceof HTMLElement) || candidateNode === anchorNode || seenNodes.has(candidateNode)) {
        return;
      }
      seenNodes.add(candidateNode);
      duplicateNodes.push(candidateNode);
    };

    document.querySelectorAll("." + SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS).forEach(function (candidateNode) {
      if (!(candidateNode instanceof HTMLElement)) {
        return;
      }
      var candidateScopeKey = cleanText(candidateNode.dataset.libSubtotalScope || "");
      var candidateContainerKey = cleanText(candidateNode.dataset.libSubtotalKey || "");
      if (candidateScopeKey === keepScopeKey && candidateContainerKey === keepContainerKey) {
        registerDuplicate(candidateNode);
        return;
      }
      if (hostParentNode instanceof HTMLElement && candidateNode.parentElement === hostParentNode) {
        registerDuplicate(candidateNode);
      }
    });

    duplicateNodes.forEach(function (candidateNode) {
      if (_state.subtotalToggleMenuOpenAnchor === candidateNode) {
        _state.subtotalToggleMenuOpenAnchor = null;
      }
      candidateNode.remove();
    });
  }

  function removeSubtotalToggleMenuAnchor(scopeKey, containerKey) {
    clearSubtotalToggleMenuRetry(scopeKey, containerKey);
    var anchorNode = findSubtotalToggleMenuAnchor(scopeKey, containerKey);
    if (!(anchorNode instanceof HTMLElement)) {
      return;
    }
    if (_state.subtotalToggleMenuOpenAnchor === anchorNode) {
      closeSubtotalToggleMenus();
    }
    anchorNode.remove();
  }

  function findSubtotalToggleMenuHost(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return null;
    }
    var explicitSelector = cleanText(containerNode.dataset.libSubtotalToggleHostSelector || "");
    if (explicitSelector) {
      try {
        var selectorHost = document.querySelector(explicitSelector);
        if (selectorHost instanceof HTMLElement) {
          return selectorHost;
        }
      } catch (_selectorErr) {
        return null;
      }
    }

    var explicitHost = containerNode.querySelector("[data-lib-subtotal-toggle-host='1']");
    if (explicitHost instanceof HTMLElement) {
      return explicitHost;
    }

    return null;
  }

  function copySubtotalToggleMenuHostClasses(triggerNode, hostNode) {
    if (!(triggerNode instanceof HTMLElement) || !(hostNode instanceof HTMLElement)) {
      return false;
    }
    var copied = false;
    hostNode.classList.forEach(function (token) {
      var className = cleanText(token || "");
      if (!className || !/^btn/.test(className) || className.indexOf("active") >= 0) {
        return;
      }
      triggerNode.classList.add(className);
      copied = true;
    });
    return copied;
  }

  function renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey) {
    if (!(anchorNode instanceof HTMLElement) || !(panelNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    panelNode.innerHTML = "";
    SUBTOTAL_TOGGLE_MENU_ITEMS.forEach(function (itemMeta) {
      var rowNode = document.createElement("label");
      rowNode.className = SUBTOTAL_TOGGLE_MENU_ROW_CLASS;
      rowNode.dataset.libSubtotalToggleField = itemMeta.toggleField;
      rowNode.tabIndex = 0;
      rowNode.setAttribute("role", "button");
      var toggleMeta = v2.subtotalToggleMetaForSource(itemMeta.sourceField) || {};
      if (toggleMeta.tooltip) {
        rowNode.title = toggleMeta.tooltip;
      }

      var labelNode = document.createElement("span");
      labelNode.className = SUBTOTAL_TOGGLE_MENU_LABEL_CLASS;
      labelNode.textContent = itemMeta.label;
      rowNode.appendChild(labelNode);

      var checkboxNode = document.createElement("input");
      checkboxNode.type = "checkbox";
      checkboxNode.className = SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS;
      checkboxNode.checked = readFieldBooleanValue(formNode, itemMeta.toggleField, true);
      checkboxNode.tabIndex = -1;
      checkboxNode.setAttribute("aria-hidden", "true");
      rowNode.setAttribute("aria-pressed", checkboxNode.checked ? "true" : "false");

      var requestToggle = function (event) {
        event.stopPropagation();
        if (event.preventDefault) {
          event.preventDefault();
        }
        if (rowNode.dataset.libToggleBusy === "1") {
          return;
        }
        rowNode.dataset.libToggleBusy = "1";
        var nextChecked = !Boolean(checkboxNode.checked);
        checkboxNode.disabled = true;
        v2.syncBooleanFieldWidgets(formNode, itemMeta.toggleField, nextChecked)
          .then(function (updated) {
            if (!updated) {
              return false;
            }
            renderSubtotalLayout(containerNode, formNode, scopeKey, containerKey);
            return true;
          })
          .catch(function () {
            return false;
          })
          .then(function () {
            delete rowNode.dataset.libToggleBusy;
            renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
          });
      };
      checkboxNode.addEventListener("click", requestToggle);
      checkboxNode.addEventListener("change", function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
      rowNode.addEventListener("click", requestToggle);
      rowNode.addEventListener("keydown", function (event) {
        if (!(event && (event.key === "Enter" || event.key === " "))) {
          return;
        }
        requestToggle(event);
      });
      rowNode.appendChild(checkboxNode);
      panelNode.appendChild(rowNode);
    });
  }

  function ensureSubtotalToggleMenuAnchor(containerNode, formNode, scopeKey, containerKey) {
    if (!(containerNode instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return null;
    }
    bindSubtotalToggleMenuGlobalHandlers();
    var hostNode = findSubtotalToggleMenuHost(containerNode);
    var selector =
      "." +
      SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS +
      "[data-lib-subtotal-scope='" +
      scopeKey +
      "'][data-lib-subtotal-key='" +
      containerKey +
      "']";
    var anchorNode = document.querySelector(selector);
    if (!(hostNode instanceof HTMLElement) || !(hostNode.parentElement instanceof HTMLElement)) {
      scheduleSubtotalToggleMenuRetry(containerNode, formNode, scopeKey, containerKey);
      if (anchorNode instanceof HTMLElement) {
        anchorNode.remove();
      }
      return null;
    }
    clearSubtotalToggleMenuRetry(scopeKey, containerKey);

    if (!(anchorNode instanceof HTMLElement)) {
      anchorNode = document.createElement("span");
      anchorNode.className = SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS;
      anchorNode.dataset.libSubtotalScope = scopeKey;
      anchorNode.dataset.libSubtotalKey = containerKey;
    }
    anchorNode.dataset.libSubtotalScope = scopeKey;
    anchorNode.dataset.libSubtotalKey = containerKey;
    var hostParentNode = hostNode.parentElement;
    if (!(anchorNode.parentElement === hostParentNode && anchorNode.previousElementSibling === hostNode)) {
      hostParentNode.insertBefore(anchorNode, hostNode.nextSibling);
    }
    removeDuplicateSubtotalToggleMenuAnchors(anchorNode, hostNode, scopeKey, containerKey);

    var panelNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_PANEL_CLASS);
    if (!(panelNode instanceof HTMLElement)) {
      panelNode = document.createElement("div");
      panelNode.className = SUBTOTAL_TOGGLE_MENU_PANEL_CLASS;
      panelNode.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      panelNode.addEventListener("mousedown", function (event) {
        event.stopPropagation();
      });
      anchorNode.appendChild(panelNode);
    }

    var triggerNode = anchorNode.querySelector(":scope > ." + SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS);
    if (!(triggerNode instanceof HTMLElement)) {
      triggerNode = document.createElement("button");
      triggerNode.type = "button";
      triggerNode.className = SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS;
      anchorNode.appendChild(triggerNode);
    }
    if (!copySubtotalToggleMenuHostClasses(triggerNode, hostNode)) {
      triggerNode.classList.add("btn", "btn-secondary");
    }
    applySettingsTriggerIcon(triggerNode, "Subtotal settings");
    triggerNode.setAttribute("aria-label", "Subtotal settings");
    triggerNode.title = "Subtotal settings";
    triggerNode.setAttribute(
      "aria-expanded",
      anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS) ? "true" : "false"
    );
    triggerNode.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      var shouldOpen = !anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS);
      closeSubtotalToggleMenus(shouldOpen ? anchorNode : null);
      anchorNode.classList.toggle(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS, shouldOpen);
      triggerNode.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      if (shouldOpen) {
        Promise.resolve(v2.refreshSubtotalToggleStateFromBackend(formNode, true))
          .catch(function () {
            return false;
          })
          .finally(function () {
            renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
          });
      }
    };

    if (!anchorNode.classList.contains(SUBTOTAL_TOGGLE_MENU_OPEN_CLASS) || !panelNode.children.length) {
      renderSubtotalToggleMenuPanel(anchorNode, panelNode, formNode, containerNode, scopeKey, containerKey);
    }
    return anchorNode;
  }

  v2.bindSubtotalToggleMenuGlobalHandlers = bindSubtotalToggleMenuGlobalHandlers;
  v2.clearSubtotalToggleMenuRetry = clearSubtotalToggleMenuRetry;
  v2.scheduleSubtotalToggleMenuRetry = scheduleSubtotalToggleMenuRetry;

  Object.assign(v2, {
    bindSubtotalToggleMenuGlobalHandlers: bindSubtotalToggleMenuGlobalHandlers,
    clearSubtotalToggleMenuRetry: clearSubtotalToggleMenuRetry,
    closeSubtotalToggleMenus: closeSubtotalToggleMenus,
    copySubtotalToggleMenuHostClasses: copySubtotalToggleMenuHostClasses,
    ensureSubtotalToggleMenuAnchor: ensureSubtotalToggleMenuAnchor,
    findSubtotalToggleMenuAnchor: findSubtotalToggleMenuAnchor,
    findSubtotalToggleMenuHost: findSubtotalToggleMenuHost,
    removeSubtotalToggleMenuAnchor: removeSubtotalToggleMenuAnchor,
    renderSubtotalToggleMenuPanel: renderSubtotalToggleMenuPanel,
    scheduleSubtotalToggleMenuRetry: scheduleSubtotalToggleMenuRetry,
  });
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
