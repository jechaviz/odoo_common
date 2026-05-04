(function (surface) {
  "use strict";

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
    var config = surface.requireObject(options, "role selector config");
    var rolesWrap = document.createElement("div");
    rolesWrap.className = "o_lib_settings_roles_wrap";

    var rolesTitle = document.createElement("div");
    rolesTitle.className = "o_lib_settings_roles_title";
    rolesTitle.textContent = surface.requireText(config.title, "role selector title");
    rolesWrap.appendChild(rolesTitle);

    var selectedRoleIds = surface.requireArray(config.selectedRoleIds, "role selector selectedRoleIds");
    if (!surface.isAdminUser()) {
      var rolesReadonly = document.createElement("div");
      rolesReadonly.className = "o_lib_settings_roles_note";
      rolesReadonly.textContent = selectedRoleIds.length
        ? "Configured by administrator."
        : "No additional roles configured.";
      rolesWrap.appendChild(rolesReadonly);
      return rolesWrap;
    }

    var roleOptions = surface.availableRoleOptions();
    if (!roleOptions.length) {
      var rolesEmpty = document.createElement("div");
      rolesEmpty.className = "o_lib_settings_roles_note";
      rolesEmpty.textContent = surface.requireText(config.emptyText, "role selector emptyText");
      rolesWrap.appendChild(rolesEmpty);
      return rolesWrap;
    }

    var rolesList = document.createElement("div");
    rolesList.className = "o_lib_settings_roles_list";

    roleOptions.forEach(function (roleOption) {
      var roleId = Number(roleOption && roleOption.id);
      if (!(roleId > 0)) {
        throw new Error("Form Settings Panel Surface requires role options to include a positive id.");
      }
      var roleName = surface.requireText(roleOption.name, "role option name for id " + roleId);
      var roleLabel = document.createElement("label");
      roleLabel.className = "o_lib_settings_toggle";
      var roleCheckbox = document.createElement("input");
      roleCheckbox.type = "checkbox";
      roleCheckbox.value = String(roleId);
      roleCheckbox.checked = selectedRoleIds.indexOf(roleId) >= 0;
      var roleSpan = document.createElement("span");
      roleSpan.textContent = roleName;
      roleLabel.appendChild(roleCheckbox);
      roleLabel.appendChild(roleSpan);
      rolesList.appendChild(roleLabel);
    });

    if (typeof config.onChange !== "function") {
      throw new Error("Form Settings Panel Surface requires role selector onChange.");
    }
    rolesList.addEventListener("change", function () {
      config.onChange(collectRoleIdsFromList(rolesList));
    });

    rolesWrap.appendChild(rolesList);
    return rolesWrap;
  }

  surface.runtime.createSettingsRoleSelector = createSettingsRoleSelector;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
