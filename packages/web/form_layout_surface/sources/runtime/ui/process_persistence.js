(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/process_persistence.js

  function applySavedOrderForForm(formNode, scopeKey) {
    var desiredOrder = _state.formLayoutState.order[scopeKey];
    if (!Array.isArray(desiredOrder) || !desiredOrder.length) {
      return;
    }

    var groups = getSectionGroups(formNode).filter(function (group) {
      return String(group.dataset.libSectionKey || "").trim();
    });

    if (!groups.length) {
      return;
    }

    var buckets = new Map();
    groups.forEach(function (group) {
      var parent = group.parentElement;
      if (!(parent instanceof HTMLElement)) {
        return;
      }
      if (!buckets.has(parent)) {
        buckets.set(parent, []);
      }
      buckets.get(parent).push(group);
    });

    buckets.forEach(function (bucket, parent) {
      if (!bucket.length) {
        return;
      }

      var byKey = new Map();
      bucket.forEach(function (group) {
        var key = String(group.dataset.libSectionKey || "").trim();
        if (key) {
          byKey.set(key, group);
        }
      });

      if (!byKey.size) {
        return;
      }

      var ordered = [];
      desiredOrder.forEach(function (key) {
        if (byKey.has(key)) {
          ordered.push(byKey.get(key));
          byKey.delete(key);
        }
      });

      bucket.forEach(function (group) {
        var key = String(group.dataset.libSectionKey || "").trim();
        if (key && byKey.has(key)) {
          ordered.push(group);
          byKey.delete(key);
        }
      });

      if (ordered.length !== bucket.length) {
        return;
      }

      var anchor = bucket[bucket.length - 1].nextSibling;
      ordered.forEach(function (group) {
        parent.insertBefore(group, anchor);
      });
    });
  }

  v2.applySavedOrderForForm = applySavedOrderForForm;

  function storeCurrentOrderForForm(formNode, scopeKey) {
    var keys = dedupeKeys(
      getSectionGroups(formNode).map(function (group) {
        return String(group.dataset.libSectionKey || "").trim();
      })
    );

    if (keys.length) {
      _state.formLayoutState.order[scopeKey] = keys;
    }
  }

  v2.storeCurrentOrderForForm = storeCurrentOrderForForm;

  function queueStatePersist(options) {
    var normalizedOptions = normalizeStatePersistOptions(options);
    if (normalizedOptions) {
      _state.pendingStatePersistOptions = normalizedOptions;
    }
    ensureUserScopedKeys();
    var snapshot = cloneLayoutState(_state.formLayoutState);
    writeLocalLayoutState(snapshot);

    if (!_state.formCanSaveToDb) {
      return Promise.resolve(null);
    }

    if (_state.formLayoutSavePromise) {
      _state.formLayoutSaveDirty = true;
      return _state.formLayoutSavePromise;
    }

    var optionsToPersist = _state.pendingStatePersistOptions;
    _state.pendingStatePersistOptions = null;

    _state.formLayoutSavePromise = Promise.resolve()
      .then(function () {
        return v2.callKw("ir.config_parameter", "set_param", [_state.dbParamKey, JSON.stringify(snapshot)], {});
      })
      .catch(function () {
        // Keep local state as fallback for the large layout payload.
      })
      .then(function () {
        if (typeof v2.persistAllReportSubtotalLayouts === "function") {
          return v2.persistAllReportSubtotalLayouts(snapshot, optionsToPersist);
        }
        return null;
      })
      .catch(function () {
        // Keep local state as fallback.
      })
      .finally(function () {
        _state.formLayoutSavePromise = null;
        if (_state.formLayoutSaveDirty) {
          _state.formLayoutSaveDirty = false;
          queueStatePersist();
        }
      });
    return _state.formLayoutSavePromise;
  }

  v2.queueStatePersist = queueStatePersist;

  function delayMs(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Math.max(0, Number(milliseconds || 0) || 0));
    });
  }

  v2.delayMs = delayMs;

  function onToggleSectionClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }

    var group = button.closest("." + COLLAPSIBLE_GROUP_CLASS);
    var formNode = button.closest(".o_form_view");
    if (!(group instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }

    var sectionKey = String(button.dataset.libSectionKey || group.dataset.libSectionKey || "").trim();
    if (!sectionKey) {
      return;
    }

    var scopeKey = computeScopeKey(formNode);
    var header = findSectionHeader(group);
    if (!(header instanceof HTMLElement)) {
      return;
    }

    var collapsed = !group.classList.contains(COLLAPSED_GROUP_CLASS);
    setGroupCollapsed(group, header, collapsed);
    _state.formLayoutState.collapsed[collapsedEntryKey(scopeKey, sectionKey)] = collapsed;
    queueStatePersist();
  }

  v2.onToggleSectionClick = onToggleSectionClick;

  function onSectionSettingsClick(event) {
    var button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    var group = button.closest("." + COLLAPSIBLE_GROUP_CLASS);
    var formNode = button.closest(".o_form_view");
    if (!(group instanceof HTMLElement) || !(formNode instanceof HTMLElement)) {
      return;
    }
    var sectionKey = cleanText(button.dataset.libSectionKey || group.dataset.libSectionKey || "");
    openSectionSettingsPanel(formNode, sectionKey);
  }

  v2.onSectionSettingsClick = onSectionSettingsClick;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
