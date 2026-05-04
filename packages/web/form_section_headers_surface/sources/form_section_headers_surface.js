(function () {
  "use strict";

  var api = window.OdooFormSectionSurfaces = window.OdooFormSectionSurfaces || {};
  var constants = api.constants = api.constants || {};
  var state = api.state = api.state || {};

  if (typeof constants.COLLAPSIBLE_GROUP_CLASS !== "string" || !constants.COLLAPSIBLE_GROUP_CLASS) {
    constants.COLLAPSIBLE_GROUP_CLASS = "o_lib_collapsible_group";
  }
  if (typeof constants.COLLAPSED_GROUP_CLASS !== "string" || !constants.COLLAPSED_GROUP_CLASS) {
    constants.COLLAPSED_GROUP_CLASS = "o_lib_section_is_collapsed";
  }
  if (typeof constants.HEADER_CLASS !== "string" || !constants.HEADER_CLASS) {
    constants.HEADER_CLASS = "o_lib_section_header";
  }
  if (typeof constants.BODY_HIDDEN_CLASS !== "string" || !constants.BODY_HIDDEN_CLASS) {
    constants.BODY_HIDDEN_CLASS = "o_lib_section_body_hidden";
  }
  if (typeof constants.TOOLBAR_CLASS !== "string" || !constants.TOOLBAR_CLASS) {
    constants.TOOLBAR_CLASS = "o_lib_section_toolbar";
  }
  if (typeof constants.TOGGLE_BUTTON_CLASS !== "string" || !constants.TOGGLE_BUTTON_CLASS) {
    constants.TOGGLE_BUTTON_CLASS = "o_lib_section_toggle";
  }
  if (typeof constants.TOGGLE_ICON_CLASS !== "string" || !constants.TOGGLE_ICON_CLASS) {
    constants.TOGGLE_ICON_CLASS = "o_lib_section_toggle_icon";
  }
  if (typeof constants.TOGGLE_LABEL_CLASS !== "string" || !constants.TOGGLE_LABEL_CLASS) {
    constants.TOGGLE_LABEL_CLASS = "o_lib_section_toggle_label";
  }
  if (typeof constants.DRAG_HANDLE_CLASS !== "string" || !constants.DRAG_HANDLE_CLASS) {
    constants.DRAG_HANDLE_CLASS = "o_lib_section_drag_handle";
  }
  if (typeof constants.SECTION_HIDDEN_CLASS !== "string" || !constants.SECTION_HIDDEN_CLASS) {
    constants.SECTION_HIDDEN_CLASS = "o_lib_section_hidden";
  }
  if (
    typeof constants.SECTION_SETTINGS_TRIGGER_CLASS !== "string" ||
    !constants.SECTION_SETTINGS_TRIGGER_CLASS
  ) {
    constants.SECTION_SETTINGS_TRIGGER_CLASS = "o_lib_section_settings_trigger";
  }
  if (typeof constants.LAYOUT_ITEM_HIDDEN_CLASS !== "string" || !constants.LAYOUT_ITEM_HIDDEN_CLASS) {
    constants.LAYOUT_ITEM_HIDDEN_CLASS = "o_lib_layout_item_hidden";
  }
  if (typeof constants.FIELD_HIDDEN_CLASS !== "string" || !constants.FIELD_HIDDEN_CLASS) {
    constants.FIELD_HIDDEN_CLASS = "o_lib_field_hidden";
  }
  if (typeof constants.SETTINGS_ICON_FALLBACK_CLASS !== "string" || !constants.SETTINGS_ICON_FALLBACK_CLASS) {
    constants.SETTINGS_ICON_FALLBACK_CLASS = "fa fa-sliders";
  }

  if (!(state.sectionHeadersSurfaceConfig && typeof state.sectionHeadersSurfaceConfig === "object")) {
    state.sectionHeadersSurfaceConfig = {};
  }
  if (typeof state.nativeSettingsIconClass !== "string") {
    state.nativeSettingsIconClass = "";
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return cleanText(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function findFieldInputOnWidget(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return null;
    }
    var inputNode = widgetNode.querySelector("select, input:not([type='hidden']), textarea");
    if (
      inputNode instanceof HTMLSelectElement ||
      inputNode instanceof HTMLInputElement ||
      inputNode instanceof HTMLTextAreaElement
    ) {
      return inputNode;
    }
    return null;
  }

  function resolveSummaryFieldWidgets(groupNode, spec) {
    var widgets = [];
    var seen = new Set();

    function push(node) {
      if (!(node instanceof HTMLElement) || seen.has(node) || !groupNode.contains(node)) {
        return;
      }
      if (node.closest("." + constants.COLLAPSIBLE_GROUP_CLASS) !== groupNode) {
        return;
      }
      seen.add(node);
      widgets.push(node);
    }

    if (spec && typeof spec.resolveWidgets === "function") {
      var resolved = null;
      try {
        resolved = spec.resolveWidgets(groupNode, spec);
      } catch (_err) {
        return [];
      }
      if (resolved instanceof HTMLElement) {
        push(resolved);
      } else if (resolved && typeof resolved.length === "number") {
        Array.prototype.forEach.call(resolved, push);
      }
      return widgets;
    }

    var selector = cleanText(spec && spec.selector);
    if (!selector) {
      return widgets;
    }
    try {
      groupNode.querySelectorAll(selector).forEach(push);
    } catch (_err) {
      return [];
    }
    return widgets;
  }

  function collectSectionFieldMeta(groupNode, options) {
    if (!(groupNode instanceof HTMLElement)) {
      return [];
    }

    var summaryFields = options && Array.isArray(options.summaryFields) ? options.summaryFields : [];
    var seen = new Set();
    var entries = [];
    summaryFields.forEach(function (spec) {
      if (!spec || typeof spec !== "object") {
        return;
      }
      var fieldKey = normalizeKey(spec.key);
      var fieldLabel = cleanText(spec.label || "");
      if (!fieldKey || !fieldLabel || seen.has(fieldKey)) {
        return;
      }
      var widgets = resolveSummaryFieldWidgets(groupNode, spec);
      var canReadValue = typeof spec.readValue === "function";
      if (!widgets.length && !canReadValue) {
        return;
      }
      seen.add(fieldKey);
      entries.push({
        key: fieldKey,
        label: fieldLabel,
        readValue: canReadValue ? spec.readValue : null,
        widgets: widgets,
      });
    });

    return entries;
  }

  function resolveNativeSettingsIconClass(config) {
    var explicitClass = cleanText(config && config.settingsIconClass);
    if (explicitClass) {
      return explicitClass;
    }
    if (state.nativeSettingsIconClass) {
      return state.nativeSettingsIconClass;
    }
    var iconNode = document.querySelector(
      ".o_optional_columns_dropdown_toggle i, .o_optional_columns_dropdown .dropdown-toggle i, .o_optional_columns_dropdown i"
    );
    var className = cleanText((iconNode && iconNode.getAttribute && iconNode.getAttribute("class")) || "");
    state.nativeSettingsIconClass = className || constants.SETTINGS_ICON_FALLBACK_CLASS;
    return state.nativeSettingsIconClass;
  }

  function applySettingsTriggerIcon(buttonNode, ariaLabel, config) {
    if (!(buttonNode instanceof HTMLElement)) {
      return;
    }
    buttonNode.setAttribute("aria-label", ariaLabel);
    buttonNode.title = ariaLabel;

    var iconNode = buttonNode.querySelector("i");
    if (!(iconNode instanceof HTMLElement)) {
      iconNode = document.createElement("i");
      buttonNode.innerHTML = "";
      buttonNode.appendChild(iconNode);
    }
    iconNode.className = resolveNativeSettingsIconClass(config);
    iconNode.setAttribute("aria-hidden", "true");
  }

  function mergeOptions(options) {
    var config = state.sectionHeadersSurfaceConfig || {};
    var merged = {};
    if (config && typeof config === "object") {
      Object.assign(merged, config);
    }
    if (options && typeof options === "object") {
      Object.assign(merged, options);
    }
    return merged;
  }

  function configureSectionHeadersSurface(config) {
    var merged = mergeOptions(config);
    state.sectionHeadersSurfaceConfig = merged;
    return merged;
  }

  function resolveSectionHeaderOptions(groupNode, options) {
    if (options && typeof options === "object") {
      return options;
    }
    if (
      groupNode instanceof HTMLElement &&
      groupNode.__odooSectionHeadersSurfaceOptions &&
      typeof groupNode.__odooSectionHeadersSurfaceOptions === "object"
    ) {
      return groupNode.__odooSectionHeadersSurfaceOptions;
    }
    return state.sectionHeadersSurfaceConfig || {};
  }

  function resolveToggleDetail(buttonNode) {
    if (!(buttonNode instanceof HTMLElement)) {
      return null;
    }
    var groupNode = buttonNode.closest("." + constants.COLLAPSIBLE_GROUP_CLASS);
    if (!(groupNode instanceof HTMLElement)) {
      return null;
    }
    var headerNode = groupNode.querySelector("[data-lib-section-header], ." + constants.HEADER_CLASS);
    var sectionKey = cleanText(buttonNode.dataset.libSectionKey || groupNode.dataset.libSectionKey || "");
    var formNode = buttonNode.closest(".o_form_view");
    var scopeKey = cleanText(buttonNode.dataset.libScopeKey || groupNode.dataset.libScopeKey || "");
    return {
      buttonNode: buttonNode,
      groupNode: groupNode,
      headerNode: headerNode instanceof HTMLElement ? headerNode : null,
      sectionKey: sectionKey,
      scopeKey: scopeKey,
      formNode: formNode instanceof HTMLElement ? formNode : null,
    };
  }

  function dispatchSectionEvent(buttonNode, eventName, detail) {
    if (!(buttonNode instanceof HTMLElement) || typeof eventName !== "string" || !eventName) {
      return true;
    }
    var customEvent = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: detail || {},
    });
    return buttonNode.dispatchEvent(customEvent);
  }

  function defaultToggleSectionClick(event, detail) {
    if (!(detail && detail.groupNode instanceof HTMLElement && detail.headerNode instanceof HTMLElement)) {
      return;
    }
    var collapsed = !detail.groupNode.classList.contains(constants.COLLAPSED_GROUP_CLASS);
    setGroupCollapsed(detail.groupNode, detail.headerNode, collapsed);
    dispatchSectionEvent(detail.buttonNode, "odoo:form-section-toggle", Object.assign({}, detail, {
      collapsed: collapsed,
    }));
  }

  function defaultSectionSettingsClick(event, detail) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
    dispatchSectionEvent(detail && detail.buttonNode, "odoo:form-section-settings", detail || {});
  }

  function resolveCanAccessSectionSettings(scopeKey, sectionKey, detail, options) {
    if (typeof options.canAccessSectionSettings === "function") {
      return Boolean(options.canAccessSectionSettings(scopeKey, sectionKey, detail));
    }
    return true;
  }

  function resolveBindSectionHoverState(options) {
    if (typeof options.bindSectionHoverState === "function") {
      return options.bindSectionHoverState;
    }
    if (typeof api.bindSectionHoverState === "function") {
      return api.bindSectionHoverState;
    }
    return null;
  }

  function ensureCollapsedSummaryNode(headerNode) {
    if (!(headerNode instanceof HTMLElement)) {
      return null;
    }
    var summaryNode = headerNode.querySelector(":scope > .o_lib_section_collapsed_summary");
    if (summaryNode instanceof HTMLElement) {
      return summaryNode;
    }
    summaryNode = document.createElement("div");
    summaryNode.className = "o_lib_section_collapsed_summary";
    summaryNode.hidden = true;
    headerNode.appendChild(summaryNode);
    return summaryNode;
  }

  function nodeIsVisibleForCollapsedSummary(node, groupNode) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var current = node;
    var collapseHidden = false;
    while (current instanceof HTMLElement) {
      if (current.hidden) {
        return false;
      }
      if (
        current.classList.contains(constants.FIELD_HIDDEN_CLASS) ||
        current.classList.contains(constants.SECTION_HIDDEN_CLASS) ||
        current.classList.contains(constants.LAYOUT_ITEM_HIDDEN_CLASS)
      ) {
        return false;
      }
      if (current.classList.contains(constants.BODY_HIDDEN_CLASS)) {
        collapseHidden = true;
      }
      if (current === groupNode) {
        break;
      }
      current = current.parentElement;
    }
    var style = window.getComputedStyle(node);
    if (!style || style.visibility === "hidden") {
      return false;
    }
    if (!collapseHidden && style.display === "none") {
      return false;
    }
    if (collapseHidden) {
      return true;
    }
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function readCollapsedSummaryValue(groupNode, fieldMeta) {
    if (!fieldMeta) {
      return "";
    }
    if (typeof fieldMeta.readValue === "function") {
      try {
        var explicitValue = cleanText(fieldMeta.readValue(groupNode, fieldMeta));
        if (explicitValue) {
          return explicitValue;
        }
      } catch (_err) {
        return "";
      }
    }
    var widgets = Array.isArray(fieldMeta.widgets) ? fieldMeta.widgets : [];
    for (var index = 0; index < widgets.length; index += 1) {
      var widgetNode = widgets[index];
      if (!(widgetNode instanceof HTMLElement) || !nodeIsVisibleForCollapsedSummary(widgetNode, groupNode)) {
        continue;
      }
      var inputNode = findFieldInputOnWidget(widgetNode);
      if (inputNode instanceof HTMLSelectElement) {
        var selectedOption = inputNode.selectedOptions && inputNode.selectedOptions[0];
        var selectValue = cleanText(
          (selectedOption && selectedOption.textContent) ||
          (inputNode.options[inputNode.selectedIndex] && inputNode.options[inputNode.selectedIndex].text) ||
          ""
        );
        if (selectValue) {
          return selectValue;
        }
      } else if (inputNode instanceof HTMLInputElement) {
        var inputType = cleanText(inputNode.type || "").toLowerCase();
        if (inputType === "checkbox") {
          if (inputNode.checked) {
            return "Yes";
          }
        } else if (inputType === "radio") {
          if (inputNode.checked) {
            return cleanText(inputNode.value || "") || "Yes";
          }
        } else {
          var inputValue = cleanText(inputNode.value || "");
          if (inputValue) {
            return inputValue;
          }
        }
      } else if (inputNode instanceof HTMLTextAreaElement) {
        var textAreaValue = cleanText(inputNode.value || "");
        if (textAreaValue) {
          return textAreaValue;
        }
      }

      var passiveValue = cleanText(widgetNode.textContent || "");
      if (passiveValue) {
        return passiveValue;
      }
    }
    return "";
  }

  function updateCollapsedSectionSummary(groupNode, headerNode, collapsed, options) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }
    var summaryNode = ensureCollapsedSummaryNode(headerNode);
    if (!(summaryNode instanceof HTMLElement)) {
      return;
    }
    if (!collapsed) {
      summaryNode.hidden = true;
      summaryNode.replaceChildren();
      return;
    }

    var summaryOptions = resolveSectionHeaderOptions(groupNode, options);
    var summaryItems = collectSectionFieldMeta(groupNode, summaryOptions)
      .filter(function (fieldMeta) {
        if (typeof fieldMeta.readValue === "function") {
          return true;
        }
        return (
          Array.isArray(fieldMeta.widgets) &&
          fieldMeta.widgets.some(function (widgetNode) {
            return nodeIsVisibleForCollapsedSummary(widgetNode, groupNode);
          })
        );
      })
      .map(function (fieldMeta) {
        return {
          label: cleanText(fieldMeta.label || ""),
          value: readCollapsedSummaryValue(groupNode, fieldMeta),
        };
      })
      .filter(function (item) {
        return Boolean(item.label && item.value);
      });

    summaryNode.replaceChildren();
    if (!summaryItems.length) {
      summaryNode.hidden = true;
      return;
    }

    summaryItems.slice(0, 6).forEach(function (item) {
      var itemNode = document.createElement("span");
      itemNode.className = "o_lib_section_summary_item";

      var labelNode = document.createElement("span");
      labelNode.className = "o_lib_section_summary_label";
      labelNode.textContent = item.label + ":";

      var valueNode = document.createElement("span");
      valueNode.className = "o_lib_section_summary_value";
      valueNode.textContent = item.value;

      itemNode.appendChild(labelNode);
      itemNode.appendChild(valueNode);
      summaryNode.appendChild(itemNode);
    });

    if (summaryItems.length > 6) {
      var moreNode = document.createElement("span");
      moreNode.className = "o_lib_section_summary_more";
      moreNode.textContent = "+" + String(summaryItems.length - 6) + " more";
      summaryNode.appendChild(moreNode);
    }
    summaryNode.hidden = false;
  }

  function setGroupCollapsed(groupNode, headerNode, collapsed, options) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }

    var shouldCollapse = Boolean(collapsed);
    updateCollapsedSectionSummary(groupNode, headerNode, shouldCollapse, options);
    groupNode.classList.toggle(constants.COLLAPSED_GROUP_CLASS, shouldCollapse);

    var toggleButton = headerNode.querySelector("." + constants.TOGGLE_BUTTON_CLASS);
    if (toggleButton instanceof HTMLElement) {
      toggleButton.setAttribute("aria-expanded", shouldCollapse ? "false" : "true");
    }

    var headerPath = new Set();
    var cursor = headerNode;
    while (cursor instanceof HTMLElement && cursor !== groupNode) {
      headerPath.add(cursor);
      cursor = cursor.parentElement;
    }

    groupNode.querySelectorAll("*").forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (headerPath.has(node) || headerNode.contains(node)) {
        return;
      }
      node.classList.toggle(constants.BODY_HIDDEN_CLASS, shouldCollapse);
    });
  }

  function bindSectionButtonActivation(buttonNode, handler) {
    if (!(buttonNode instanceof HTMLElement) || typeof handler !== "function") {
      return;
    }

    buttonNode.onclick = function (event) {
      var lastPointerActivationAt = Number(buttonNode.dataset.libPointerActivatedAt || 0) || 0;
      if (event && event.type === "click" && lastPointerActivationAt && Date.now() - lastPointerActivationAt < 350) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      return handler.call(this, event);
    };

    buttonNode.onmouseup = function (event) {
      if (!(event instanceof MouseEvent) || event.button !== 0) {
        return;
      }
      buttonNode.dataset.libPointerActivatedAt = String(Date.now());
      event.preventDefault();
      event.stopPropagation();
      return handler.call(this, event);
    };
  }

  function decorateSectionHeader(groupNode, headerNode, sectionKey, scopeKey, options) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }

    var resolvedOptions = mergeOptions(options);
    groupNode.__odooSectionHeadersSurfaceOptions = resolvedOptions;
    var bindHoverState = resolveBindSectionHoverState(resolvedOptions);
    var settingsDetail = {
      groupNode: groupNode,
      headerNode: headerNode,
      sectionKey: cleanText(sectionKey || groupNode.dataset.libSectionKey || ""),
      scopeKey: cleanText(scopeKey || groupNode.dataset.libScopeKey || ""),
      formNode: groupNode.closest(".o_form_view"),
    };

    headerNode.classList.add(constants.HEADER_CLASS);
    if (typeof bindHoverState === "function") {
      bindHoverState(groupNode);
    }

    var labelText = cleanText(resolvedOptions.label || headerNode.dataset.libSectionLabel || "") || "Section";
    headerNode.dataset.libSectionLabel = labelText;

    var toolbar = headerNode.querySelector("." + constants.TOOLBAR_CLASS);
    var toggleButton;
    var toggleIcon;
    var toggleLabel;
    var dragHandle;
    var settingsTrigger;

    if (!(toolbar instanceof HTMLElement)) {
      toolbar = document.createElement("div");
      toolbar.className = constants.TOOLBAR_CLASS;

      toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = constants.TOGGLE_BUTTON_CLASS;

      toggleIcon = document.createElement("span");
      toggleIcon.className = constants.TOGGLE_ICON_CLASS;

      toggleLabel = document.createElement("span");
      toggleLabel.className = constants.TOGGLE_LABEL_CLASS;

      toggleButton.appendChild(toggleIcon);
      toggleButton.appendChild(toggleLabel);

      dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = constants.DRAG_HANDLE_CLASS;
      dragHandle.setAttribute("draggable", "true");
      dragHandle.setAttribute("aria-label", "Drag section");
      dragHandle.title = "Drag section";
      dragHandle.textContent = "::";

      settingsTrigger = document.createElement("button");
      settingsTrigger.type = "button";
      settingsTrigger.className = constants.SECTION_SETTINGS_TRIGGER_CLASS;

      headerNode.textContent = "";
      headerNode.appendChild(toolbar);
    } else {
      toggleButton = toolbar.querySelector("." + constants.TOGGLE_BUTTON_CLASS);
      toggleIcon = toolbar.querySelector("." + constants.TOGGLE_ICON_CLASS);
      toggleLabel = toolbar.querySelector("." + constants.TOGGLE_LABEL_CLASS);
      dragHandle = toolbar.querySelector("." + constants.DRAG_HANDLE_CLASS);
      settingsTrigger = toolbar.querySelector("." + constants.SECTION_SETTINGS_TRIGGER_CLASS);
      if (!(settingsTrigger instanceof HTMLElement)) {
        settingsTrigger = document.createElement("button");
        settingsTrigger.type = "button";
        settingsTrigger.className = constants.SECTION_SETTINGS_TRIGGER_CLASS;
        toolbar.appendChild(settingsTrigger);
      }
    }

    if (
      !(toggleButton instanceof HTMLElement) ||
      !(toggleIcon instanceof HTMLElement) ||
      !(toggleLabel instanceof HTMLElement) ||
      !(dragHandle instanceof HTMLElement) ||
      !(settingsTrigger instanceof HTMLElement)
    ) {
      return;
    }

    toolbar.replaceChildren(toggleButton, dragHandle, settingsTrigger);

    toggleLabel.textContent = labelText;
    toggleIcon.textContent = ">";
    toggleButton.dataset.libSectionKey = settingsDetail.sectionKey;
    toggleButton.dataset.libScopeKey = settingsDetail.scopeKey;
    dragHandle.dataset.libSectionKey = settingsDetail.sectionKey;
    settingsTrigger.dataset.libSectionKey = settingsDetail.sectionKey;
    settingsTrigger.dataset.libScopeKey = settingsDetail.scopeKey;
    applySettingsTriggerIcon(settingsTrigger, "Section settings", resolvedOptions);

    bindSectionButtonActivation(toggleButton, function (event) {
      var detail = resolveToggleDetail(toggleButton) || settingsDetail;
      if (typeof resolvedOptions.onToggleSectionClick === "function") {
        return resolvedOptions.onToggleSectionClick(event, detail);
      }
      return defaultToggleSectionClick(event, detail);
    });
    dragHandle.onmousedown = function (event) {
      event.stopPropagation();
    };
    bindSectionButtonActivation(settingsTrigger, function (event) {
      var detail = resolveToggleDetail(settingsTrigger) || settingsDetail;
      if (typeof resolvedOptions.onSectionSettingsClick === "function") {
        return resolvedOptions.onSectionSettingsClick(event, detail);
      }
      return defaultSectionSettingsClick(event, detail);
    });

    settingsTrigger.hidden = !resolveCanAccessSectionSettings(
      settingsDetail.scopeKey,
      settingsDetail.sectionKey,
      settingsDetail,
      resolvedOptions
    );

    var collapsed = groupNode.classList.contains(constants.COLLAPSED_GROUP_CLASS);
    toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
    updateCollapsedSectionSummary(groupNode, headerNode, collapsed, resolvedOptions);
  }

  Object.assign(api, {
    configureSectionHeadersSurface: configureSectionHeadersSurface,
    decorateSectionHeader: decorateSectionHeader,
    setGroupCollapsed: setGroupCollapsed,
    bindSectionButtonActivation: bindSectionButtonActivation,
    updateCollapsedSectionSummary: updateCollapsedSectionSummary,
  });
})();
