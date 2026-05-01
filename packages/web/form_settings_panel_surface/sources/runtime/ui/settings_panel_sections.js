(function (surface) {
  "use strict";

  function enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingLoads) {
    var backendFieldMeta = surface.hostCall("backendFieldMetaFor", [formNode, fieldMeta], null);
    var backendType = surface.cleanText((backendFieldMeta && backendFieldMeta.type) || "").toLowerCase();
    var modelName = surface.cleanText(surface.hostCall("computeModelName", [formNode], ""));
    if (!modelName || backendType !== "many2one") {
      return backendFieldMeta;
    }
    var loadPromise = surface.hostCall("ensureRelationFieldOptionsLoaded", [modelName, fieldMeta.name], null);
    if (loadPromise) {
      pendingLoads.push(loadPromise);
    }
    return backendFieldMeta;
  }

  function buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingLoads) {
    var row = document.createElement("div");
    row.className = "o_lib_settings_field_row";

    var fieldVisibleKey = surface.cleanText(surface.hostCall("fieldVisibilityEntryKey", [scopeKey, sectionKey, fieldMeta.key], ""));
    var fieldDefaultKey = surface.cleanText(surface.hostCall("fieldDefaultEntryKey", [scopeKey, sectionKey, fieldMeta.key], ""));
    var fieldVisible = Boolean(surface.hostCall("fieldIsVisible", [scopeKey, sectionKey, fieldMeta.key], true));
    var defaultValue = surface.hostCall("fieldDefaultValue", [scopeKey, sectionKey, fieldMeta.key], "");
    var fieldLabel = surface.cleanText(fieldMeta.label || fieldMeta.name || fieldMeta.key);
    var backendFieldMeta = enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingLoads);
    var canEditDefault = Boolean(surface.hostCall("fieldAllowsDefaultEditor", [formNode, fieldMeta, backendFieldMeta], false));

    var fieldToggleLabel = document.createElement("label");
    fieldToggleLabel.className = "o_lib_settings_toggle";
    var fieldCheckbox = document.createElement("input");
    fieldCheckbox.type = "checkbox";
    fieldCheckbox.setAttribute("data-lib-role", "field-visible");
    fieldCheckbox.checked = fieldVisible;
    var fieldSpan = document.createElement("span");
    fieldSpan.textContent = fieldLabel;
    fieldToggleLabel.appendChild(fieldCheckbox);
    fieldToggleLabel.appendChild(fieldSpan);

    var rowHeader = document.createElement("div");
    rowHeader.className = "o_lib_settings_field_header";
    rowHeader.appendChild(fieldToggleLabel);
    row.appendChild(rowHeader);

    fieldCheckbox.addEventListener("change", function () {
      surface.ensureLayoutStateBucket("fieldVisible")[fieldVisibleKey] = Boolean(fieldCheckbox.checked);
      surface.queuePersist();
      surface.processFormNode(formNode);
    });

    if (!canEditDefault) {
      return row;
    }

    var defaultEditor = surface.hostCall("createFieldDefaultEditor", [formNode, fieldMeta, defaultValue], null);
    if (!(defaultEditor && defaultEditor.node instanceof HTMLElement && typeof defaultEditor.readValue === "function")) {
      return row;
    }

    var fieldExpand = document.createElement("button");
    fieldExpand.type = "button";
    fieldExpand.className = "o_lib_settings_field_expand";
    fieldExpand.setAttribute("aria-label", "Toggle default value editor");
    rowHeader.appendChild(fieldExpand);

    var defaultWrap = document.createElement("div");
    defaultWrap.className = "o_lib_settings_field_default_wrap";
    defaultWrap.appendChild(defaultEditor.node);
    row.appendChild(defaultWrap);

    var startsExpanded = Boolean(surface.cleanText(defaultValue));
    surface.hostCall("updateFieldDefaultExpandedState", [fieldExpand, defaultWrap, startsExpanded], null);

    fieldExpand.addEventListener("click", function () {
      var nextState = defaultWrap.hidden;
      surface.hostCall("updateFieldDefaultExpandedState", [fieldExpand, defaultWrap, nextState], null);
    });

    defaultEditor.node.addEventListener("change", function () {
      var nextValue = defaultEditor.readValue();
      var bucket = surface.ensureLayoutStateBucket("fieldDefaults");
      if (nextValue) {
        bucket[fieldDefaultKey] = nextValue;
      } else {
        delete bucket[fieldDefaultKey];
      }
      surface.queuePersist();
      surface.processFormNode(formNode);
    });

    return row;
  }

  function buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingLoads) {
    var fieldsWrap = document.createElement("div");
    fieldsWrap.className = "o_lib_settings_fields_wrap";

    var fieldMetas = surface.readArray(
      Array.isArray(groupNode.__libFieldMeta)
        ? groupNode.__libFieldMeta
        : surface.hostCall("collectSectionFieldMeta", [groupNode], [])
    );
    if (!fieldMetas.length) {
      var emptyRow = document.createElement("div");
      emptyRow.className = "o_lib_settings_field_row";
      emptyRow.textContent = "No fields found in this section.";
      fieldsWrap.appendChild(emptyRow);
      return fieldsWrap;
    }

    fieldMetas.forEach(function (fieldMeta) {
      fieldsWrap.appendChild(buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingLoads));
    });

    return fieldsWrap;
  }

  function buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingLoads) {
    var sectionKey = surface.cleanText(groupNode.dataset.libSectionKey || "");
    if (!sectionKey) {
      return null;
    }

    var headerNode = surface.hostCall("findSectionHeader", [groupNode], null);
    var sectionLabel = surface.cleanText(
      (headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel) ||
      (headerNode && headerNode.textContent) ||
      sectionKey
    );
    var sectionVisibleKey = surface.cleanText(surface.hostCall("sectionVisibilityEntryKey", [scopeKey, sectionKey], ""));
    var sectionRoleKey = surface.cleanText(surface.hostCall("sectionSettingsRoleEntryKey", [scopeKey, sectionKey], ""));

    var sectionRow = document.createElement("div");
    sectionRow.className = "o_lib_settings_section_row";
    sectionRow.dataset.libSectionKey = sectionKey;

    var sectionHeaderRow = document.createElement("div");
    sectionHeaderRow.className = "o_lib_settings_section_header";
    var sectionToggleLabel = document.createElement("label");
    sectionToggleLabel.className = "o_lib_settings_toggle";
    var sectionCheckbox = document.createElement("input");
    sectionCheckbox.type = "checkbox";
    sectionCheckbox.setAttribute("data-lib-role", "section-visible");
    sectionCheckbox.checked = Boolean(surface.hostCall("sectionIsVisible", [scopeKey, sectionKey], true));
    var sectionSpan = document.createElement("span");
    sectionSpan.textContent = sectionLabel;
    sectionToggleLabel.appendChild(sectionCheckbox);
    sectionToggleLabel.appendChild(sectionSpan);
    sectionHeaderRow.appendChild(sectionToggleLabel);
    sectionRow.appendChild(sectionHeaderRow);

    sectionCheckbox.addEventListener("change", function () {
      surface.ensureLayoutStateBucket("sectionVisible")[sectionVisibleKey] = Boolean(sectionCheckbox.checked);
      surface.queuePersist();
      surface.processFormNode(formNode);
      surface.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
    });

    sectionRow.appendChild(
      surface.runtime.createSettingsRoleSelector({
        title: "Roles for settings button (admin always allowed)",
        selectedRoleIds: surface.hostCall("sectionSettingsRoleIds", [scopeKey, sectionKey], []),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          var bucket = surface.ensureLayoutStateBucket("settingsRoles");
          if (selectedRoleIds.length) {
            bucket[sectionRoleKey] = selectedRoleIds;
          } else {
            delete bucket[sectionRoleKey];
          }
          surface.queuePersist();
          surface.processFormNode(formNode);
          surface.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
        }
      })
    );

    sectionRow.appendChild(buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingLoads));
    return sectionRow;
  }

  function renderSectionSettingsRows(formNode, scopeKey, focusState, bodyNode, pendingLoads) {
    var sectionRows = [];
    if (surface.cleanText((focusState && focusState.activeLayoutKey) || "") || surface.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return sectionRows;
    }

    surface.readArray(surface.hostCall("getSectionGroups", [formNode], [])).forEach(function (groupNode) {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      var sectionKey = surface.cleanText(groupNode.dataset.libSectionKey || "");
      if (!sectionKey) {
        return;
      }
      if (focusState && focusState.activeSectionKey && sectionKey !== focusState.activeSectionKey) {
        return;
      }
      var sectionRow = buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingLoads);
      if (!(sectionRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(sectionRow);
      sectionRows.push(sectionRow);
    });

    return sectionRows;
  }

  surface.runtime.renderSectionSettingsRows = renderSectionSettingsRows;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
