(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function syncLayoutVisibilityLocks(itemCheckboxes) {
    var visibleCount = itemCheckboxes.reduce(function (count, row) {
      return count + (row.checkbox.checked ? 1 : 0);
    }, 0);
    itemCheckboxes.forEach(function (row) {
      var lockChecked = row.checkbox.checked && visibleCount <= 1;
      row.checkbox.disabled = lockChecked;
      row.checkbox.title = lockChecked ? "At least one item must stay visible." : "";
    });
  }

  function buildLayoutDefaultsRow(formNode, scopeKey, layoutMeta, layoutKey) {
    if (layoutMeta.type !== "tabs") {
      return null;
    }
    var defaultWrap = document.createElement("div");
    defaultWrap.className = v2.SETTINGS_FIELD_ROW_CLASS;
    var defaultLabel = document.createElement("label");
    defaultLabel.textContent = "Default tab";
    var defaultSelect = document.createElement("select");
    defaultSelect.className = "o_lib_settings_default_input";

    var emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- No default --";
    defaultSelect.appendChild(emptyOption);

    layoutMeta.items.forEach(function (itemMeta) {
      var optionNode = document.createElement("option");
      optionNode.value = itemMeta.key;
      optionNode.textContent = v2.cleanText(itemMeta.label || itemMeta.key);
      defaultSelect.appendChild(optionNode);
    });

    defaultSelect.value = v2.layoutDefaultItemKey(scopeKey, layoutKey);
    defaultSelect.addEventListener("change", function () {
      var defaultKey = v2.cleanText(defaultSelect.value || "");
      var stateKey = v2.layoutDefaultEntryKey(scopeKey, layoutKey);
      if (defaultKey) {
        _state.formLayoutState.layoutDefaults[stateKey] = defaultKey;
      } else {
        delete _state.formLayoutState.layoutDefaults[stateKey];
      }
      v2.queueStatePersist();
      v2.processFormNode(formNode);
    });

    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultSelect);
    return defaultWrap;
  }

  function buildLayoutItemsWrap(formNode, scopeKey, layoutMeta, layoutKey) {
    var layoutItemsWrap = document.createElement("div");
    layoutItemsWrap.className = "o_lib_settings_fields_wrap";
    var itemCheckboxes = [];

    if (layoutMeta.type === "tabs") {
      var tabsNote = document.createElement("div");
      tabsNote.className = "o_lib_settings_roles_note";
      tabsNote.textContent = "At least one tab must stay visible.";
      layoutItemsWrap.appendChild(tabsNote);
    }

    var defaultRow = buildLayoutDefaultsRow(formNode, scopeKey, layoutMeta, layoutKey);
    if (defaultRow instanceof HTMLElement) {
      layoutItemsWrap.appendChild(defaultRow);
    }

    layoutMeta.items.forEach(function (itemMeta) {
      var visibilityKey = v2.layoutItemVisibilityEntryKey(scopeKey, layoutKey, itemMeta.key);
      var itemRow = document.createElement("div");
      itemRow.className = v2.SETTINGS_FIELD_ROW_CLASS;
      var itemToggle = document.createElement("label");
      itemToggle.className = "o_lib_settings_toggle";
      var itemCheckbox = document.createElement("input");
      itemCheckbox.type = "checkbox";
      itemCheckbox.checked = v2.layoutItemIsVisible(scopeKey, layoutKey, itemMeta.key);
      var itemLabel = document.createElement("span");
      itemLabel.textContent = v2.cleanText(itemMeta.label || itemMeta.key);
      itemToggle.appendChild(itemCheckbox);
      itemToggle.appendChild(itemLabel);
      itemRow.appendChild(itemToggle);
      layoutItemsWrap.appendChild(itemRow);

      itemCheckboxes.push({
        checkbox: itemCheckbox,
        visibilityKey: visibilityKey,
      });

      itemCheckbox.addEventListener("change", function () {
        if (!itemCheckbox.checked) {
          var otherVisibleCount = itemCheckboxes.reduce(function (count, row) {
            if (row.checkbox === itemCheckbox) {
              return count;
            }
            return count + (row.checkbox.checked ? 1 : 0);
          }, 0);
          if (otherVisibleCount < 1) {
            itemCheckbox.checked = true;
            syncLayoutVisibilityLocks(itemCheckboxes);
            return;
          }
        }
        _state.formLayoutState.layoutItemVisible[visibilityKey] = Boolean(itemCheckbox.checked);
        syncLayoutVisibilityLocks(itemCheckboxes);
        v2.queueStatePersist();
        v2.processFormNode(formNode);
      });
    });

    syncLayoutVisibilityLocks(itemCheckboxes);
    return layoutItemsWrap;
  }

  function buildLayoutSettingsRow(formNode, scopeKey, layoutMeta) {
    var layoutKey = v2.cleanText(layoutMeta.key || "");
    if (!layoutKey) {
      return null;
    }

    var layoutRow = document.createElement("div");
    layoutRow.className = v2.SETTINGS_SECTION_ROW_CLASS;
    layoutRow.dataset.libLayoutKey = layoutKey;

    var layoutHeader = document.createElement("div");
    layoutHeader.className = "o_lib_settings_section_header";
    var layoutLabel = document.createElement("div");
    layoutLabel.textContent = v2.cleanText(layoutMeta.label || layoutKey);
    layoutHeader.appendChild(layoutLabel);
    layoutRow.appendChild(layoutHeader);

    var layoutRoleKey = v2.layoutSettingsRoleEntryKey(scopeKey, layoutKey);
    layoutRow.appendChild(
      settingsPanelRuntime.createSettingsRoleSelector({
        title: "Roles for layout settings button (admin always allowed)",
        selectedRoleIds: v2.layoutSettingsRoleIds(scopeKey, layoutKey),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          if (selectedRoleIds.length) {
            _state.formLayoutState.settingsRoles[layoutRoleKey] = selectedRoleIds;
          } else {
            delete _state.formLayoutState.settingsRoles[layoutRoleKey];
          }
          v2.queueStatePersist();
          v2.processFormNode(formNode);
          v2.renderSectionSettingsPanel(formNode, scopeKey, "", layoutKey);
        },
      })
    );

    layoutRow.appendChild(buildLayoutItemsWrap(formNode, scopeKey, layoutMeta, layoutKey));
    return layoutRow;
  }

  function renderLayoutSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var layoutRows = [];
    if (v2.cleanText((focusState && focusState.activeSectionKey) || "") || v2.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return layoutRows;
    }

    var layoutMetas = Array.isArray(formNode.__libLayoutMeta) ? formNode.__libLayoutMeta : v2.collectLayoutContainers(formNode, scopeKey);
    if (!layoutMetas.length) {
      return layoutRows;
    }

    var layoutTitle = document.createElement("div");
    layoutTitle.className = "o_lib_settings_roles_title";
    layoutTitle.textContent = "Layout Settings";
    bodyNode.appendChild(layoutTitle);

    layoutMetas.forEach(function (layoutMeta) {
      var layoutKey = v2.cleanText(layoutMeta.key || "");
      if (!layoutKey) {
        return;
      }
      if (focusState && focusState.activeLayoutKey && layoutKey !== focusState.activeLayoutKey) {
        return;
      }
      var layoutRow = buildLayoutSettingsRow(formNode, scopeKey, layoutMeta);
      if (!(layoutRow instanceof HTMLElement)) {
        return;
      }
      bodyNode.appendChild(layoutRow);
      layoutRows.push(layoutRow);
    });

    return layoutRows;
  }

  settingsPanelRuntime.renderLayoutSettingsRows = renderLayoutSettingsRows;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
