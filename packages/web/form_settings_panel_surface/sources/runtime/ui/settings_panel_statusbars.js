(function (surface) {
  "use strict";

  function buildStatusbarSettingsRow(scopeKey, statusbarMeta) {
    var statusbarKey = surface.cleanText((statusbarMeta && statusbarMeta.key) || "");
    if (!statusbarKey) {
      return null;
    }

    var statusbarRow = document.createElement("div");
    statusbarRow.className = "o_lib_settings_section_row";
    statusbarRow.dataset.libStatusbarKey = statusbarKey;

    var statusbarHeader = document.createElement("div");
    statusbarHeader.className = "o_lib_settings_section_header";
    var statusbarLabel = document.createElement("div");
    statusbarLabel.textContent = surface.cleanText((statusbarMeta && statusbarMeta.label) || statusbarKey);
    statusbarHeader.appendChild(statusbarLabel);
    statusbarRow.appendChild(statusbarHeader);

    var localeNote = document.createElement("div");
    localeNote.className = "o_lib_settings_roles_note";
    localeNote.textContent = "Locale: " + surface.cleanText(surface.hostCall("currentLocaleCode", [], ""));
    statusbarRow.appendChild(localeNote);

    var statusbarItemsWrap = document.createElement("div");
    statusbarItemsWrap.className = "o_lib_settings_fields_wrap";

    surface.readArray(statusbarMeta.items).forEach(function (itemMeta) {
      if (!(itemMeta && itemMeta.node instanceof HTMLElement)) {
        return;
      }

      var itemRow = document.createElement("div");
      itemRow.className = "o_lib_settings_field_row";

      var rowHeader = document.createElement("div");
      rowHeader.className = "o_lib_settings_field_header";
      var itemLabel = document.createElement("label");
      itemLabel.textContent = surface.cleanText(itemMeta.baseLabel || itemMeta.key);
      rowHeader.appendChild(itemLabel);
      itemRow.appendChild(rowHeader);

      var input = document.createElement("input");
      input.type = "text";
      input.className = "o_lib_settings_default_input";
      input.placeholder = surface.cleanText(itemMeta.baseLabel || itemMeta.key);
      input.value = surface.hostCall("statusbarLabelValue", [scopeKey, statusbarKey, itemMeta.key], "") || "";
      input.addEventListener("change", function () {
        if (!surface.isAdminUser()) {
          return;
        }
        var entryKey = surface.cleanText(surface.hostCall("statusbarLabelEntryKey", [scopeKey, statusbarKey, itemMeta.key], ""));
        var nextValue = surface.cleanText(input.value || "");
        var fallbackValue = surface.cleanText(itemMeta.baseLabel || "");
        var bucket = surface.ensureLayoutStateBucket("statusbarLabels");
        if (!nextValue || nextValue === fallbackValue) {
          delete bucket[entryKey];
        } else {
          bucket[entryKey] = nextValue;
        }
        surface.queuePersist();
        surface.hostCall("applyStatusbarMetaLabels", [statusbarMeta, scopeKey], null);
      });

      itemRow.appendChild(input);
      statusbarItemsWrap.appendChild(itemRow);
    });

    statusbarRow.appendChild(statusbarItemsWrap);
    return statusbarRow;
  }

  function renderStatusbarSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var statusbarRows = [];
    if (!surface.isAdminUser()) {
      return statusbarRows;
    }
    if (surface.cleanText((focusState && focusState.activeSectionKey) || "") || surface.cleanText((focusState && focusState.activeLayoutKey) || "")) {
      return statusbarRows;
    }

    var statusbarMetas = surface.readArray(
      Array.isArray(formNode.__libStatusbarMeta)
        ? formNode.__libStatusbarMeta
        : surface.hostCall("collectStatusbarMetas", [formNode, scopeKey], [])
    );
    if (!statusbarMetas.length) {
      return statusbarRows;
    }

    var statusbarTitle = document.createElement("div");
    statusbarTitle.className = "o_lib_settings_roles_title";
    statusbarTitle.textContent = "Statusbar Labels";
    bodyNode.appendChild(statusbarTitle);

    statusbarMetas.forEach(function (statusbarMeta) {
      var statusbarKey = surface.cleanText((statusbarMeta && statusbarMeta.key) || "");
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

  surface.runtime.renderStatusbarSettingsRows = renderStatusbarSettingsRows;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
