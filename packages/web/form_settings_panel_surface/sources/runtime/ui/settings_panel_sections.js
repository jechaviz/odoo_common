(function (surface) {
  "use strict";

  function enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingLoads) {
    var backendFieldMeta = surface.hostCall("backendFieldMetaFor", [formNode, fieldMeta]);
    var backendType = surface.cleanText((backendFieldMeta && backendFieldMeta.type) || "").toLowerCase();
    if (backendType !== "many2one") {
      return backendFieldMeta;
    }
    var modelName = surface.requireText(surface.hostCall("computeModelName", [formNode]), "computeModelName() for many2one defaults");
    var fieldName = surface.requireText(fieldMeta && fieldMeta.name, "fieldMeta.name for many2one defaults");
    var loadPromise = surface.hostCall("ensureRelationFieldOptionsLoaded", [modelName, fieldName]);
    if (loadPromise) {
      pendingLoads.push(loadPromise);
    }
    return backendFieldMeta;
  }

  function buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingLoads) {
    var row = document.createElement("div");
    row.className = "o_lib_settings_field_row";

    var fieldKey = surface.requireText(fieldMeta && fieldMeta.key, "fieldMeta.key for section " + sectionKey);
    var fieldVisibleKey = surface.requireText(
      surface.hostCall("fieldVisibilityEntryKey", [scopeKey, sectionKey, fieldKey]),
      "fieldVisibilityEntryKey(" + scopeKey + ", " + sectionKey + ", " + fieldKey + ")"
    );
    var fieldDefaultKey = surface.requireText(
      surface.hostCall("fieldDefaultEntryKey", [scopeKey, sectionKey, fieldKey]),
      "fieldDefaultEntryKey(" + scopeKey + ", " + sectionKey + ", " + fieldKey + ")"
    );
    var fieldVisible = surface.requireBoolean(
      surface.hostCall("fieldIsVisible", [scopeKey, sectionKey, fieldKey]),
      "fieldIsVisible(" + scopeKey + ", " + sectionKey + ", " + fieldKey + ")"
    );
    var defaultValue = surface.hostCall("fieldDefaultValue", [scopeKey, sectionKey, fieldKey]);
    var fieldLabel = surface.requireText(fieldMeta.label, "fieldMeta.label for " + fieldKey);
    var backendFieldMeta = enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingLoads);
    var canEditDefault = surface.requireBoolean(
      surface.hostCall("fieldAllowsDefaultEditor", [formNode, fieldMeta, backendFieldMeta]),
      "fieldAllowsDefaultEditor(" + fieldKey + ")"
    );

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

    var defaultEditor = surface.hostCall("createFieldDefaultEditor", [formNode, fieldMeta, defaultValue]);
    if (!(defaultEditor && defaultEditor.node instanceof HTMLElement && typeof defaultEditor.readValue === "function")) {
      throw new Error("Form Settings Panel Surface requires createFieldDefaultEditor(" + fieldKey + ") to return { node, readValue }.");
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
    surface.hostCall("updateFieldDefaultExpandedState", [fieldExpand, defaultWrap, startsExpanded]);

    fieldExpand.addEventListener("click", function () {
      var nextState = defaultWrap.hidden;
      surface.hostCall("updateFieldDefaultExpandedState", [fieldExpand, defaultWrap, nextState]);
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

    var fieldMetas = surface.requireArray(
      Array.isArray(groupNode.__libFieldMeta)
        ? groupNode.__libFieldMeta
        : surface.hostCall("collectSectionFieldMeta", [groupNode]),
      "section field metadata for " + sectionKey
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
    var sectionKey = surface.requireText(groupNode.dataset.libSectionKey, "data-lib-section-key");

    var headerNode = surface.hostCall("findSectionHeader", [groupNode]);
    var sectionLabel = surface.requireText(
      headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel,
      "data-lib-section-label for " + sectionKey
    );
    var sectionVisibleKey = surface.requireText(
      surface.hostCall("sectionVisibilityEntryKey", [scopeKey, sectionKey]),
      "sectionVisibilityEntryKey(" + scopeKey + ", " + sectionKey + ")"
    );
    var sectionRoleKey = surface.requireText(
      surface.hostCall("sectionSettingsRoleEntryKey", [scopeKey, sectionKey]),
      "sectionSettingsRoleEntryKey(" + scopeKey + ", " + sectionKey + ")"
    );

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
    sectionCheckbox.checked = surface.requireBoolean(
      surface.hostCall("sectionIsVisible", [scopeKey, sectionKey]),
      "sectionIsVisible(" + scopeKey + ", " + sectionKey + ")"
    );
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
        selectedRoleIds: surface.requireArray(
          surface.hostCall("sectionSettingsRoleIds", [scopeKey, sectionKey]),
          "sectionSettingsRoleIds(" + scopeKey + ", " + sectionKey + ")"
        ),
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

    surface.requireArray(surface.hostCall("getSectionGroups", [formNode]), "section groups").forEach(function (groupNode) {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      var sectionKey = surface.requireText(groupNode.dataset.libSectionKey, "data-lib-section-key");
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
