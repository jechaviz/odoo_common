(function (surface) {
  "use strict";

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
    defaultWrap.className = "o_lib_settings_field_row";
    var defaultLabel = document.createElement("label");
    defaultLabel.textContent = "Default tab";
    var defaultSelect = document.createElement("select");
    defaultSelect.className = "o_lib_settings_default_input";

    var emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- No default --";
    defaultSelect.appendChild(emptyOption);

    surface.readArray(layoutMeta.items).forEach(function (itemMeta) {
      var optionNode = document.createElement("option");
      optionNode.value = itemMeta.key;
      optionNode.textContent = surface.cleanText(itemMeta.label || itemMeta.key);
      defaultSelect.appendChild(optionNode);
    });

    defaultSelect.value = surface.cleanText(surface.hostCall("layoutDefaultItemKey", [scopeKey, layoutKey], ""));
    defaultSelect.addEventListener("change", function () {
      var defaultKey = surface.cleanText(defaultSelect.value || "");
      var stateKey = surface.cleanText(surface.hostCall("layoutDefaultEntryKey", [scopeKey, layoutKey], ""));
      var bucket = surface.ensureLayoutStateBucket("layoutDefaults");
      if (defaultKey) {
        bucket[stateKey] = defaultKey;
      } else {
        delete bucket[stateKey];
      }
      surface.queuePersist();
      surface.processFormNode(formNode);
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

    surface.readArray(layoutMeta.items).forEach(function (itemMeta) {
      var visibilityKey = surface.cleanText(
        surface.hostCall("layoutItemVisibilityEntryKey", [scopeKey, layoutKey, itemMeta.key], "")
      );
      var itemRow = document.createElement("div");
      itemRow.className = "o_lib_settings_field_row";
      var itemToggle = document.createElement("label");
      itemToggle.className = "o_lib_settings_toggle";
      var itemCheckbox = document.createElement("input");
      itemCheckbox.type = "checkbox";
      itemCheckbox.checked = Boolean(surface.hostCall("layoutItemIsVisible", [scopeKey, layoutKey, itemMeta.key], true));
      var itemLabel = document.createElement("span");
      itemLabel.textContent = surface.cleanText(itemMeta.label || itemMeta.key);
      itemToggle.appendChild(itemCheckbox);
      itemToggle.appendChild(itemLabel);
      itemRow.appendChild(itemToggle);
      layoutItemsWrap.appendChild(itemRow);

      itemCheckboxes.push({
        checkbox: itemCheckbox,
        visibilityKey: visibilityKey
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
        surface.ensureLayoutStateBucket("layoutItemVisible")[visibilityKey] = Boolean(itemCheckbox.checked);
        syncLayoutVisibilityLocks(itemCheckboxes);
        surface.queuePersist();
        surface.processFormNode(formNode);
      });
    });

    syncLayoutVisibilityLocks(itemCheckboxes);
    return layoutItemsWrap;
  }

  function buildLayoutSettingsRow(formNode, scopeKey, layoutMeta) {
    var layoutKey = surface.cleanText(layoutMeta.key || "");
    if (!layoutKey) {
      return null;
    }

    var layoutRow = document.createElement("div");
    layoutRow.className = "o_lib_settings_section_row";
    layoutRow.dataset.libLayoutKey = layoutKey;

    var layoutHeader = document.createElement("div");
    layoutHeader.className = "o_lib_settings_section_header";
    var layoutLabel = document.createElement("div");
    layoutLabel.textContent = surface.cleanText(layoutMeta.label || layoutKey);
    layoutHeader.appendChild(layoutLabel);
    layoutRow.appendChild(layoutHeader);

    var layoutRoleKey = surface.cleanText(surface.hostCall("layoutSettingsRoleEntryKey", [scopeKey, layoutKey], ""));
    layoutRow.appendChild(
      surface.runtime.createSettingsRoleSelector({
        title: "Roles for layout settings button (admin always allowed)",
        selectedRoleIds: surface.hostCall("layoutSettingsRoleIds", [scopeKey, layoutKey], []),
        emptyText: "No roles found.",
        onChange: function (selectedRoleIds) {
          var bucket = surface.ensureLayoutStateBucket("settingsRoles");
          if (selectedRoleIds.length) {
            bucket[layoutRoleKey] = selectedRoleIds;
          } else {
            delete bucket[layoutRoleKey];
          }
          surface.queuePersist();
          surface.processFormNode(formNode);
          surface.renderSectionSettingsPanel(formNode, scopeKey, "", layoutKey);
        }
      })
    );

    layoutRow.appendChild(buildLayoutItemsWrap(formNode, scopeKey, layoutMeta, layoutKey));
    return layoutRow;
  }

  function renderLayoutSettingsRows(formNode, scopeKey, focusState, bodyNode) {
    var layoutRows = [];
    if (surface.cleanText((focusState && focusState.activeSectionKey) || "") || surface.cleanText((focusState && focusState.activeStatusbarKey) || "")) {
      return layoutRows;
    }

    var layoutMetas = surface.readArray(
      Array.isArray(formNode.__libLayoutMeta)
        ? formNode.__libLayoutMeta
        : surface.hostCall("collectLayoutContainers", [formNode, scopeKey], [])
    );
    if (!layoutMetas.length) {
      return layoutRows;
    }

    var layoutTitle = document.createElement("div");
    layoutTitle.className = "o_lib_settings_roles_title";
    layoutTitle.textContent = "Layout Settings";
    bodyNode.appendChild(layoutTitle);

    layoutMetas.forEach(function (layoutMeta) {
      var layoutKey = surface.cleanText(layoutMeta.key || "");
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

  surface.runtime.renderLayoutSettingsRows = renderLayoutSettingsRows;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
