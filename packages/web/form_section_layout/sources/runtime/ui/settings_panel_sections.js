(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingRelationOptionsLoads) {
    var backendFieldMeta = v2.backendFieldMetaFor(formNode, fieldMeta);
    var backendType = v2.cleanText((backendFieldMeta && backendFieldMeta.type) || "").toLowerCase();
    var modelName = v2.computeModelName(formNode);
    if (!modelName || backendType !== "many2one") {
      return backendFieldMeta;
    }
    var loadPromise = v2.ensureRelationFieldOptionsLoaded(modelName, fieldMeta.name);
    if (loadPromise) {
      pendingRelationOptionsLoads.push(loadPromise);
    }
    return backendFieldMeta;
  }

  function buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingRelationOptionsLoads) {
    var row = document.createElement("div");
    row.className = v2.SETTINGS_FIELD_ROW_CLASS;

    var fieldVisibleKey = v2.fieldVisibilityEntryKey(scopeKey, sectionKey, fieldMeta.key);
    var fieldDefaultKey = v2.fieldDefaultEntryKey(scopeKey, sectionKey, fieldMeta.key);
    var fieldVisible = v2.fieldIsVisible(scopeKey, sectionKey, fieldMeta.key);
    var defaultValue = v2.fieldDefaultValue(scopeKey, sectionKey, fieldMeta.key);
    var fieldLabel = v2.cleanText(fieldMeta.label || fieldMeta.name || fieldMeta.key);
    var backendFieldMeta = enqueueSectionRelationOptionsLoad(formNode, fieldMeta, pendingRelationOptionsLoads);
    var canEditDefault = v2.fieldAllowsDefaultEditor(formNode, fieldMeta, backendFieldMeta);

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
      _state.formLayoutState.fieldVisible[fieldVisibleKey] = Boolean(fieldCheckbox.checked);
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    if (!canEditDefault) {
      return row;
    }

    var fieldExpand = document.createElement("button");
    fieldExpand.type = "button";
    fieldExpand.className = "o_lib_settings_field_expand";
    fieldExpand.setAttribute("aria-label", "Toggle default value editor");
    rowHeader.appendChild(fieldExpand);

    var defaultWrap = document.createElement("div");
    defaultWrap.className = "o_lib_settings_field_default_wrap";
    var defaultEditor = v2.createFieldDefaultEditor(formNode, fieldMeta, defaultValue);
    defaultWrap.appendChild(defaultEditor.node);
    row.appendChild(defaultWrap);

    var startsExpanded = Boolean(v2.cleanText(defaultValue));
    v2.updateFieldDefaultExpandedState(fieldExpand, defaultWrap, startsExpanded);

    fieldExpand.addEventListener("click", function () {
      var nextState = defaultWrap.hidden;
      v2.updateFieldDefaultExpandedState(fieldExpand, defaultWrap, nextState);
    });

    defaultEditor.node.addEventListener("change", function () {
      var nextValue = defaultEditor.readValue();
      if (nextValue) {
        _state.formLayoutState.fieldDefaults[fieldDefaultKey] = nextValue;
      } else {
        delete _state.formLayoutState.fieldDefaults[fieldDefaultKey];
      }
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    return row;
  }

  function buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingRelationOptionsLoads) {
    var fieldsWrap = document.createElement("div");
    fieldsWrap.className = "o_lib_settings_fields_wrap";

    var fieldMetas = Array.isArray(groupNode.__libFieldMeta) ? groupNode.__libFieldMeta : v2.collectSectionFieldMeta(groupNode);
    if (!fieldMetas.length) {
      var emptyRow = document.createElement("div");
      emptyRow.className = v2.SETTINGS_FIELD_ROW_CLASS;
      emptyRow.textContent = "No fields found in this section.";
      fieldsWrap.appendChild(emptyRow);
      return fieldsWrap;
    }

    fieldMetas.forEach(function (fieldMeta) {
      fieldsWrap.appendChild(buildSectionFieldRow(formNode, scopeKey, sectionKey, fieldMeta, pendingRelationOptionsLoads));
    });

    return fieldsWrap;
  }

  function buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingRelationOptionsLoads) {
    var sectionKey = v2.cleanText(groupNode.dataset.libSectionKey || "");
    if (!sectionKey) {
      return null;
    }

    var headerNode = v2.findSectionHeader(groupNode);
    var sectionLabel = v2.cleanText(
      (headerNode && headerNode.dataset && headerNode.dataset.libSectionLabel) ||
      (headerNode && headerNode.textContent) ||
      sectionKey
    );
    var sectionVisibleKey = v2.sectionVisibilityEntryKey(scopeKey, sectionKey);
    var sectionRoleKey = v2.sectionSettingsRoleEntryKey(scopeKey, sectionKey);

    var sectionRow = document.createElement("div");
    sectionRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    sectionRow.dataset.libSectionKey = sectionKey;

    var sectionHeaderRow = document.createElement("div");
    sectionHeaderRow.className = "o_lib_settings_section_header";
    var sectionToggleLabel = document.createElement("label");
    sectionToggleLabel.className = "o_lib_settings_toggle";
    var sectionCheckbox = document.createElement("input");
    sectionCheckbox.type = "checkbox";
    sectionCheckbox.setAttribute("data-lib-role", "section-visible");
    sectionCheckbox.checked = v2.sectionIsVisible(scopeKey, sectionKey);
    var sectionSpan = document.createElement("span");
    sectionSpan.textContent = sectionLabel;
    sectionToggleLabel.appendChild(sectionCheckbox);
    sectionToggleLabel.appendChild(sectionSpan);
    sectionHeaderRow.appendChild(sectionToggleLabel);
    sectionRow.appendChild(sectionHeaderRow);

    sectionCheckbox.addEventListener("change", function () {
      _state.formLayoutState.sectionVisible[sectionVisibleKey] = Boolean(sectionCheckbox.checked);
      v2.queueStatePersist();
      v2.processFormNode(formNode);
      v2.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
    });

    sectionRow.appendChild(
      settingsPanelRuntime.createSettingsRoleSelector({
        title: "Roles for settings button (admin always allowed)",
        selectedRoleIds: v2.sectionSettingsRoleIds(scopeKey, sectionKey),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          if (selectedRoleIds.length) {
            _state.formLayoutState.settingsRoles[sectionRoleKey] = selectedRoleIds;
          } else {
            delete _state.formLayoutState.settingsRoles[sectionRoleKey];
          }
          v2.queueStatePersist();
          v2.processFormNode(formNode);
          v2.renderSectionSettingsPanel(formNode, scopeKey, sectionKey);
        },
      })
    );

    sectionRow.appendChild(buildSectionFieldsWrap(formNode, groupNode, scopeKey, sectionKey, pendingRelationOptionsLoads));
    return sectionRow;
  }

  function renderSectionSettingsRows(formNode, scopeKey, focusState, bodyNode, pendingRelationOptionsLoads) {
    var sectionRows = [];
    if (v2.cleanText((focusState && focusState.activeLayoutKey) || "") || v2.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return sectionRows;
    }

    v2.getSectionGroups(formNode).forEach(function (groupNode) {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      var sectionKey = v2.cleanText(groupNode.dataset.libSectionKey || "");
      if (!sectionKey) {
        return;
      }
      if (focusState && focusState.activeSectionKey && sectionKey !== focusState.activeSectionKey) {
        return;
      }
      var sectionRow = buildSectionSettingsRow(formNode, groupNode, scopeKey, pendingRelationOptionsLoads);
      if (!(sectionRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(sectionRow);
      sectionRows.push(sectionRow);
    });

    return sectionRows;
  }

  settingsPanelRuntime.renderSectionSettingsRows = renderSectionSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
