(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function buildStatusbarSettingsRow(scopeKey, statusbarMeta) {
    var statusbarKey = v2.cleanText((statusbarMeta && statusbarMeta.key) || "");
    if (!statusbarKey) {
      return null;
    }

    var statusbarRow = document.createElement("div");
    statusbarRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    statusbarRow.dataset.libStatusbarKey = statusbarKey;

    var statusbarHeader = document.createElement("div");
    statusbarHeader.className = "o_lib_settings_section_header";
    var statusbarLabel = document.createElement("div");
    statusbarLabel.textContent = v2.cleanText((statusbarMeta && statusbarMeta.label) || statusbarKey);
    statusbarHeader.appendChild(statusbarLabel);
    statusbarRow.appendChild(statusbarHeader);

    var localeNote = document.createElement("div");
    localeNote.className = "o_lib_settings_roles_note";
    localeNote.textContent = "Locale: " + v2.currentLocaleCode();
    statusbarRow.appendChild(localeNote);

    var statusbarItemsWrap = document.createElement("div");
    statusbarItemsWrap.className = "o_lib_settings_fields_wrap";

    (statusbarMeta.items || []).forEach(function (itemMeta) {
      if (!(itemMeta && itemMeta.node instanceof HTMLElement)) {
        return;
      }

      var itemRow = document.createElement("div");
      itemRow.className = v2.SETTINGS_FIELD_ROW_CLASS;

      var rowHeader = document.createElement("div");
      rowHeader.className = "o_lib_settings_field_header";
      var itemLabel = document.createElement("label");
      itemLabel.textContent = v2.cleanText(itemMeta.baseLabel || itemMeta.key);
      rowHeader.appendChild(itemLabel);
      itemRow.appendChild(rowHeader);

      var input = document.createElement("input");
      input.type = "text";
      input.className = "o_lib_settings_default_input";
      input.placeholder = v2.cleanText(itemMeta.baseLabel || itemMeta.key);
      input.value = v2.statusbarLabelValue(scopeKey, statusbarKey, itemMeta.key) || "";
      input.addEventListener("change", function () {
        if (!_state.formIsAdminUser) {
          return;
        }
        var entryKey = v2.statusbarLabelEntryKey(scopeKey, statusbarKey, itemMeta.key);
        var nextValue = v2.cleanText(input.value || "");
        var fallbackValue = v2.cleanText(itemMeta.baseLabel || "");
        if (!nextValue || nextValue === fallbackValue) {
          delete _state.formLayoutState.statusbarLabels[entryKey];
        } else {
          _state.formLayoutState.statusbarLabels[entryKey] = nextValue;
        }
        v2.queueStatePersist();
        v2.applyStatusbarMetaLabels(statusbarMeta, scopeKey);
      });

      itemRow.appendChild(input);
      statusbarItemsWrap.appendChild(itemRow);
    });

    statusbarRow.appendChild(statusbarItemsWrap);
    return statusbarRow;
  }

  function renderStatusbarSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var statusbarRows = [];
    if (!_state.formIsAdminUser) {
      return statusbarRows;
    }
    if (v2.cleanText((focusState && focusState.activeSectionKey) || "") || v2.cleanText((focusState && focusState.activeLayoutKey) || "")) {
      return statusbarRows;
    }

    var statusbarMetas = Array.isArray(formNode.__libStatusbarMeta)
      ? formNode.__libStatusbarMeta
      : v2.collectStatusbarMetas(formNode, scopeKey);
    if (!statusbarMetas.length) {
      return statusbarRows;
    }

    var statusbarTitle = document.createElement("div");
    statusbarTitle.className = "o_lib_settings_roles_title";
    statusbarTitle.textContent = "Statusbar Labels";
    bodyNode.appendChild(statusbarTitle);

    statusbarMetas.forEach(function (statusbarMeta) {
      var statusbarKey = v2.cleanText((statusbarMeta && statusbarMeta.key) || "");
      if (!statusbarKey) {
        return;
      }
      if (focusState && focusState.activeStatusbarKey && statusbarKey !== focusState.activeStatusbarKey) {
        return;
      }
      var statusbarRow = buildStatusbarSettingsRow(scopeKey, statusbarMeta);
      if (!(statusbarRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(statusbarRow);
      statusbarRows.push(statusbarRow);
    });

    return statusbarRows;
  }

  settingsPanelRuntime.renderStatusbarSettingsRows = renderStatusbarSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
