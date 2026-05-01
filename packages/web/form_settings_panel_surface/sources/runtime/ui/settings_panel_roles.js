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
    var config = options && typeof options === "object" ? options : {};
    var rolesWrap = document.createElement("div");
    rolesWrap.className = "o_lib_settings_roles_wrap";

    var rolesTitle = document.createElement("div");
    rolesTitle.className = "o_lib_settings_roles_title";
    rolesTitle.textContent = surface.cleanText(config.title || "Roles for settings button (admin always allowed)");
    rolesWrap.appendChild(rolesTitle);

    var selectedRoleIds = Array.isArray(config.selectedRoleIds) ? config.selectedRoleIds : [];
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
      rolesEmpty.textContent = surface.cleanText(config.emptyText || "No roles found.");
      rolesWrap.appendChild(rolesEmpty);
      return rolesWrap;
    }

    var rolesList = document.createElement("div");
    rolesList.className = "o_lib_settings_roles_list";

    roleOptions.forEach(function (roleOption) {
      var roleLabel = document.createElement("label");
      roleLabel.className = "o_lib_settings_toggle";
      var roleCheckbox = document.createElement("input");
      roleCheckbox.type = "checkbox";
      roleCheckbox.value = String(roleOption.id);
      roleCheckbox.checked = selectedRoleIds.indexOf(roleOption.id) >= 0;
      var roleSpan = document.createElement("span");
      roleSpan.textContent = surface.cleanText(roleOption.name || roleOption.label || roleOption.id);
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

  surface.runtime.createSettingsRoleSelector = createSettingsRoleSelector;
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
