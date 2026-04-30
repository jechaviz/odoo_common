(function (v2) {
  "use strict";

  v2.ui_builder = v2.ui_builder || {};
  var settingsPanelRuntime = v2.settings_panel_runtime = v2.settings_panel_runtime || {};
  var _state = v2.state = v2.state || {};

  function collectRoleIdsFromList(listNode) {
    var selected = [];
    listNode.querySelectorAll("input[type='checkbox']").forEach(function (checkbox) {
      if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) {
        return;
      }
      var roleId = Number(checkbox.value || 0);
      if (roleId > 0 && selected.indexOf(roleId) < 0) {
        selected.push(roleId);
      }
    });
    return selected;
  }

  function createSettingsRoleSelector(options) {
    var config = options && typeof options === "object" ? options : {};
    var rolesWrap = document.createElement("div");
    rolesWrap.className = "o_lib_settings_roles_wrap";

    var rolesTitle = document.createElement("div");
    rolesTitle.className = "o_lib_settings_roles_title";
    rolesTitle.textContent = v2.cleanText(config.title || "Roles for settings button (admin always allowed)");
    rolesWrap.appendChild(rolesTitle);

    var selectedRoleIds = Array.isArray(config.selectedRoleIds) ? config.selectedRoleIds : [];
    if (!_state.formIsAdminUser) {
      var rolesReadonly = document.createElement("div");
      rolesReadonly.className = "o_lib_settings_roles_note";
      rolesReadonly.textContent = selectedRoleIds.length
        ? "Configured by administrator."
        : "No additional roles configured.";
      rolesWrap.appendChild(rolesReadonly);
      return rolesWrap;
    }

    if (!_state.availableRoleOptions.length) {
      var rolesEmpty = document.createElement("div");
      rolesEmpty.className = "o_lib_settings_roles_note";
      rolesEmpty.textContent = v2.cleanText(config.emptyText || "No roles found.");
      rolesWrap.appendChild(rolesEmpty);
      return rolesWrap;
    }

    var rolesList = document.createElement("div");
    rolesList.className = "o_lib_settings_roles_list";

    _state.availableRoleOptions.forEach(function (roleOption) {
      var roleLabel = document.createElement("label");
      roleLabel.className = "o_lib_settings_toggle";
      var roleCheckbox = document.createElement("input");
      roleCheckbox.type = "checkbox";
      roleCheckbox.value = String(roleOption.id);
      roleCheckbox.checked = selectedRoleIds.indexOf(roleOption.id) >= 0;
      var roleSpan = document.createElement("span");
      roleSpan.textContent = roleOption.name;
      roleLabel.appendChild(roleCheckbox);
      roleLabel.appendChild(roleSpan);
      rolesList.appendChild(roleLabel);
    });

    if (typeof config.onChange === "function") {
      rolesList.addEventListener("change", function () {
        config.onChange(collectRoleIdsFromList(rolesList));
      });
    }

    rolesWrap.appendChild(rolesList);
    return rolesWrap;
  }

  settingsPanelRuntime.createSettingsRoleSelector = createSettingsRoleSelector;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
