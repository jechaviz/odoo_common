(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/section_headers.js

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
        current.classList.contains(FIELD_HIDDEN_CLASS) ||
        current.classList.contains(SECTION_HIDDEN_CLASS) ||
        current.classList.contains(LAYOUT_ITEM_HIDDEN_CLASS)
      ) {
        return false;
      }
      if (current.classList.contains(BODY_HIDDEN_CLASS)) {
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
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    return true;
  }

  function readCollapsedSummaryValue(groupNode, fieldMeta) {
    if (!(fieldMeta && Array.isArray(fieldMeta.widgets))) {
      return "";
    }
    for (var index = 0; index < fieldMeta.widgets.length; index += 1) {
      var widgetNode = fieldMeta.widgets[index];
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
            var radioValue = cleanText(inputNode.value || "");
            if (radioValue) {
              return radioValue;
            }
            return "Yes";
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

  function updateCollapsedSectionSummary(groupNode, headerNode, collapsed) {
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

    var summaryItems = collectSectionFieldMeta(groupNode)
      .filter(function (fieldMeta) {
        return (
          Array.isArray(fieldMeta.widgets) &&
          fieldMeta.widgets.some(function (widgetNode) {
            return nodeIsVisibleForCollapsedSummary(widgetNode, groupNode);
          })
        );
      })
      .map(function (fieldMeta) {
        return {
          label: cleanText(fieldMeta.label || fieldMeta.name || ""),
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

  function setGroupCollapsed(groupNode, headerNode, collapsed) {
    if (!(groupNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) {
      return;
    }

    var shouldCollapse = Boolean(collapsed);
    updateCollapsedSectionSummary(groupNode, headerNode, shouldCollapse);
    groupNode.classList.toggle(COLLAPSED_GROUP_CLASS, shouldCollapse);

    var toggleButton = headerNode.querySelector("." + TOGGLE_BUTTON_CLASS);
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
      var keepVisible = headerPath.has(node) || headerNode.contains(node);
      if (keepVisible) {
        return;
      }
      node.classList.toggle(BODY_HIDDEN_CLASS, shouldCollapse);
    });
  }

  v2.setGroupCollapsed = setGroupCollapsed;

  function decorateSectionHeader(groupNode, headerNode, sectionKey, scopeKey) {
    headerNode.classList.add(HEADER_CLASS);
    bindSectionHoverState(groupNode);

    var labelText =
      String(headerNode.dataset.libSectionLabel || headerNode.textContent || "")
        .replace(/\s+/g, " ")
        .trim() || "Section";
    headerNode.dataset.libSectionLabel = labelText;

    var toolbar = headerNode.querySelector("." + TOOLBAR_CLASS);
    var toggleButton;
    var toggleIcon;
    var toggleLabel;
    var dragHandle;
    var settingsTrigger;

    if (!(toolbar instanceof HTMLElement)) {
      toolbar = document.createElement("div");
      toolbar.className = TOOLBAR_CLASS;

      toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = TOGGLE_BUTTON_CLASS;

      toggleIcon = document.createElement("span");
      toggleIcon.className = TOGGLE_ICON_CLASS;

      toggleLabel = document.createElement("span");
      toggleLabel.className = TOGGLE_LABEL_CLASS;

      toggleButton.appendChild(toggleIcon);
      toggleButton.appendChild(toggleLabel);

      dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = DRAG_HANDLE_CLASS;
      dragHandle.setAttribute("draggable", "true");
      dragHandle.setAttribute("aria-label", "Drag section");
      dragHandle.title = "Drag section";
      dragHandle.textContent = "::";

      settingsTrigger = document.createElement("button");
      settingsTrigger.type = "button";
      settingsTrigger.className = SECTION_SETTINGS_TRIGGER_CLASS;

      headerNode.textContent = "";
      headerNode.appendChild(toolbar);
    } else {
      toggleButton = toolbar.querySelector("." + TOGGLE_BUTTON_CLASS);
      toggleIcon = toolbar.querySelector("." + TOGGLE_ICON_CLASS);
      toggleLabel = toolbar.querySelector("." + TOGGLE_LABEL_CLASS);
      dragHandle = toolbar.querySelector("." + DRAG_HANDLE_CLASS);
      settingsTrigger = toolbar.querySelector("." + SECTION_SETTINGS_TRIGGER_CLASS);
      if (!(settingsTrigger instanceof HTMLElement)) {
        settingsTrigger = document.createElement("button");
        settingsTrigger.type = "button";
        settingsTrigger.className = SECTION_SETTINGS_TRIGGER_CLASS;
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

    // Rebuild the toolbar order on every pass so legacy DOM or partial rerenders
    // cannot leave settings before drag.
    toolbar.replaceChildren(toggleButton, dragHandle, settingsTrigger);

    toggleLabel.textContent = labelText;
    toggleIcon.textContent = ">";
    toggleButton.dataset.libSectionKey = sectionKey;
    dragHandle.dataset.libSectionKey = sectionKey;
    settingsTrigger.dataset.libSectionKey = sectionKey;
    applySettingsTriggerIcon(settingsTrigger, "Section settings");

    // Rebind on every pass. Odoo can replace/recycle DOM nodes and preserve
    // data-* flags without preserving event listeners.
    bindSectionButtonActivation(toggleButton, onToggleSectionClick);
    dragHandle.onmousedown = function (event) {
      event.stopPropagation();
    };
    bindSectionButtonActivation(settingsTrigger, onSectionSettingsClick);

    settingsTrigger.hidden = !canAccessSectionSettings(scopeKey, sectionKey);

    var collapsed = groupNode.classList.contains(COLLAPSED_GROUP_CLASS);
    toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
    updateCollapsedSectionSummary(groupNode, headerNode, collapsed);
  }

  v2.decorateSectionHeader = decorateSectionHeader;

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

  v2.bindSectionButtonActivation = bindSectionButtonActivation;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
