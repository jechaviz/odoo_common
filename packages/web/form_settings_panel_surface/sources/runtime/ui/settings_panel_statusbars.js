(function (surface) {
  "use strict";

  function buildStatusbarSettingsRow(scopeKey, statusbarMeta) {
    var statusbarKey = surface.requireText(statusbarMeta && statusbarMeta.key, "statusbarMeta.key");
    var statusbarLabelText = surface.requireText(statusbarMeta.label, "statusbarMeta.label for " + statusbarKey);

    var statusbarRow = document.createElement("div");
    statusbarRow.className = "o_lib_settings_section_row";
    statusbarRow.dataset.libStatusbarKey = statusbarKey;

    var statusbarHeader = document.createElement("div");
    statusbarHeader.className = "o_lib_settings_section_header";
    var statusbarLabel = document.createElement("div");
    statusbarLabel.textContent = statusbarLabelText;
    statusbarHeader.appendChild(statusbarLabel);
    statusbarRow.appendChild(statusbarHeader);

    var localeNote = document.createElement("div");
    localeNote.className = "o_lib_settings_roles_note";
    localeNote.textContent = "Locale: " + surface.requireText(surface.hostCall("currentLocaleCode", []), "currentLocaleCode()");
    statusbarRow.appendChild(localeNote);

    var statusbarItemsWrap = document.createElement("div");
    statusbarItemsWrap.className = "o_lib_settings_fields_wrap";

    surface.requireArray(statusbarMeta.items, "statusbarMeta.items for " + statusbarKey).forEach(function (itemMeta) {
      if (!(itemMeta && itemMeta.node instanceof HTMLElement)) {
        return;
      }
      var itemKey = surface.requireText(itemMeta.key, "statusbar item key for " + statusbarKey);
      var baseLabel = surface.requireText(itemMeta.baseLabel, "statusbar item baseLabel for " + itemKey);

      var itemRow = document.createElement("div");
      itemRow.className = "o_lib_settings_field_row";

      var rowHeader = document.createElement("div");
      rowHeader.className = "o_lib_settings_field_header";
      var itemLabel = document.createElement("label");
      itemLabel.textContent = baseLabel;
      rowHeader.appendChild(itemLabel);
      itemRow.appendChild(rowHeader);

      var input = document.createElement("input");
      input.type = "text";
      input.className = "o_lib_settings_default_input";
      input.placeholder = baseLabel;
      input.value = surface.cleanText(surface.hostCall("statusbarLabelValue", [scopeKey, statusbarKey, itemKey]));
      input.addEventListener("change", function () {
        if (!surface.isAdminUser()) {
          return;
        }
        var entryKey = surface.requireText(
          surface.hostCall("statusbarLabelEntryKey", [scopeKey, statusbarKey, itemKey]),
          "statusbarLabelEntryKey(" + scopeKey + ", " + statusbarKey + ", " + itemKey + ")"
        );
        var nextValue = surface.cleanText(input.value || "");
        var bucket = surface.ensureLayoutStateBucket("statusbarLabels");
        if (!nextValue || nextValue === baseLabel) {
          delete bucket[entryKey];
        } else {
          bucket[entryKey] = nextValue;
        }
        surface.queuePersist();
        surface.hostCall("applyStatusbarMetaLabels", [statusbarMeta, scopeKey]);
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

    var statusbarMetas = surface.requireArray(
      Array.isArray(formNode.__libStatusbarMeta)
        ? formNode.__libStatusbarMeta
        : surface.hostCall("collectStatusbarMetas", [formNode, scopeKey]),
      "statusbar metadata"
    );
    if (!statusbarMetas.length) {
      return statusbarRows;
    }

    var statusbarTitle = document.createElement("div");
    statusbarTitle.className = "o_lib_settings_roles_title";
    statusbarTitle.textContent = "Statusbar Labels";
    bodyNode.appendChild(statusbarTitle);

    statusbarMetas.forEach(function (statusbarMeta) {
      var statusbarKey = surface.requireText(statusbarMeta && statusbarMeta.key, "statusbarMeta.key");
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
