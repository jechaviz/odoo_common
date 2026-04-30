(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_editor_runtime.js

  function createFieldDefaultEditor(formNode, fieldMeta, defaultValue) {
    var editorMeta = inferFieldDefaultEditorMeta(formNode, fieldMeta);
    var valueSeed = String(defaultValue || "").trim();

    if (editorMeta.kind === "boolean") {
      var normalized = cleanText(valueSeed).toLowerCase();
      var currentValue = "";
      if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
        currentValue = "true";
      } else if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
        currentValue = "false";
      }

      var group = document.createElement("div");
      group.className = "o_lib_settings_default_choice_group";
      group.setAttribute("data-lib-role", "field-default");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Default boolean value");

      var optionsBool = [
        { value: "", label: "none" },
        { value: "true", label: "true" },
        { value: "false", label: "false" },
      ];

      function applySelectedState() {
        group.querySelectorAll("button[data-lib-value]").forEach(function (buttonNode) {
          if (!(buttonNode instanceof HTMLButtonElement)) {
            return;
          }
          var isActive = String(buttonNode.dataset.libValue || "") === currentValue;
          buttonNode.classList.toggle("o_lib_settings_choice_active", isActive);
          buttonNode.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      }

      optionsBool.forEach(function (item) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "o_lib_settings_choice_btn";
        btn.dataset.libValue = String(item.value || "");
        btn.textContent = item.label;
        btn.addEventListener("click", function () {
          var nextValue = String(btn.dataset.libValue || "");
          if (nextValue === currentValue) {
            return;
          }
          currentValue = nextValue;
          applySelectedState();
          group.dispatchEvent(new Event("change", { bubbles: true }));
        });
        group.appendChild(btn);
      });

      applySelectedState();
      return {
        kind: "boolean",
        node: group,
        readValue: function () {
          return currentValue;
        },
      };
    }

    if (editorMeta.kind === "many2one") {
      var picker = document.createElement("div");
      picker.className = "o_lib_settings_m2o_picker";
      picker.setAttribute("data-lib-role", "field-default");

      var pickerInput = document.createElement("input");
      pickerInput.type = "text";
      pickerInput.className = "o_lib_settings_default_input";
      pickerInput.placeholder = "Search...";
      pickerInput.autocomplete = "off";
      pickerInput.value = valueSeed;
      picker.appendChild(pickerInput);

      var pickerDropdown = document.createElement("div");
      pickerDropdown.className = "o_lib_settings_m2o_dropdown";
      pickerDropdown.hidden = true;
      picker.appendChild(pickerDropdown);

      var optionsCache = Array.isArray(editorMeta.options) ? editorMeta.options.slice(0) : [];
      var searchTimer = null;
      var closedByBlur = false;

      function closeDropdown() {
        picker.classList.remove("o_lib_settings_m2o_open");
        pickerDropdown.hidden = true;
      }

      function openDropdown() {
        picker.classList.add("o_lib_settings_m2o_open");
        pickerDropdown.hidden = false;
      }

      function renderMany2oneOptions(options, queryText) {
        pickerDropdown.innerHTML = "";
        var rows = Array.isArray(options) ? options : [];
        if (!rows.length) {
          var emptyNode = document.createElement("div");
          emptyNode.className = "o_lib_settings_m2o_empty";
          emptyNode.textContent = "No records";
          pickerDropdown.appendChild(emptyNode);
        } else {
          rows.forEach(function (item) {
            var label = cleanText((item && item.label) || (item && item.value) || "");
            if (!label) {
              return;
            }
            var optionNode = document.createElement("button");
            optionNode.type = "button";
            optionNode.className = "o_lib_settings_m2o_option";
            optionNode.textContent = label;
            optionNode.addEventListener("mousedown", function (event) {
              event.preventDefault();
            });
            optionNode.addEventListener("click", function () {
              pickerInput.value = label;
              closeDropdown();
              picker.dispatchEvent(new Event("change", { bubbles: true }));
            });
            pickerDropdown.appendChild(optionNode);
          });
        }

        var searchMore = document.createElement("button");
        searchMore.type = "button";
        searchMore.className = "o_lib_settings_m2o_more";
        searchMore.textContent = "Search more...";
        searchMore.addEventListener("mousedown", function (event) {
          event.preventDefault();
        });
        searchMore.addEventListener("click", function () {
          searchRelationFieldOptions(
            computeModelName(formNode),
            fieldMeta && fieldMeta.name,
            queryText || pickerInput.value,
            400,
            fieldMeta
          ).then(function (results) {
            optionsCache = Array.isArray(results) ? results : [];
            renderMany2oneOptions(optionsCache, queryText || pickerInput.value);
            openDropdown();
          });
        });
        pickerDropdown.appendChild(searchMore);
      }

      function loadAndRenderMany2oneOptions(queryText) {
        var modelName = computeModelName(formNode);
        if (!modelName || !(fieldMeta && fieldMeta.name)) {
          renderMany2oneOptions(optionsCache, queryText);
          openDropdown();
          return;
        }
        searchRelationFieldOptions(modelName, fieldMeta.name, queryText, 120, fieldMeta).then(function (results) {
          optionsCache = Array.isArray(results) ? results : [];
          renderMany2oneOptions(optionsCache, queryText);
          openDropdown();
        });
      }

      pickerInput.addEventListener("focus", function () {
        if (optionsCache.length) {
          renderMany2oneOptions(optionsCache, pickerInput.value);
          openDropdown();
        } else {
          loadAndRenderMany2oneOptions(pickerInput.value);
        }
      });

      pickerInput.addEventListener("input", function () {
        if (searchTimer) {
          window.clearTimeout(searchTimer);
        }
        var query = pickerInput.value;
        searchTimer = window.setTimeout(function () {
          loadAndRenderMany2oneOptions(query);
        }, 140);
      });

      pickerInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeDropdown();
          return;
        }
        if (event.key === "ArrowDown" && pickerDropdown.hidden) {
          loadAndRenderMany2oneOptions(pickerInput.value);
        }
      });

      pickerInput.addEventListener("blur", function () {
        closedByBlur = true;
        window.setTimeout(function () {
          if (!closedByBlur) {
            return;
          }
          closeDropdown();
          picker.dispatchEvent(new Event("change", { bubbles: true }));
        }, 130);
      });

      pickerDropdown.addEventListener("mousedown", function () {
        closedByBlur = false;
      });
      pickerDropdown.addEventListener("mouseup", function () {
        window.setTimeout(function () {
          closedByBlur = true;
        }, 0);
      });

      return {
        kind: "many2one",
        node: picker,
        readValue: function () {
          return cleanText(pickerInput.value);
        },
      };
    }

    if (editorMeta.kind === "select") {
      var select = document.createElement("select");
      select.className = "o_lib_settings_default_input";
      select.setAttribute("data-lib-role", "field-default");

      var emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "-- No default --";
      select.appendChild(emptyOption);

      var options = Array.isArray(editorMeta.options) ? editorMeta.options : [];
      options.forEach(function (item) {
        var option = document.createElement("option");
        option.value = String((item && item.value) || "");
        option.textContent = cleanText((item && item.label) || option.value || "");
        if (!option.textContent) {
          option.textContent = option.value || "(empty)";
        }
        select.appendChild(option);
      });

      var matchedByValue = options.some(function (item) {
        return String((item && item.value) || "") === valueSeed;
      });
      if (!matchedByValue && valueSeed) {
        var matchedByLabel = options.find(function (item) {
          return cleanText((item && item.label) || "") === valueSeed;
        });
        if (matchedByLabel) {
          valueSeed = String(matchedByLabel.value || "");
          matchedByValue = true;
        }
      }

      if (!matchedByValue && valueSeed) {
        var customOption = document.createElement("option");
        customOption.value = valueSeed;
        customOption.textContent = valueSeed;
        select.appendChild(customOption);
      }
      select.value = matchedByValue || valueSeed ? valueSeed : "";

      return {
        kind: editorMeta.kind,
        node: select,
        readValue: function () {
          return String(select.value || "").trim();
        },
      };
    }

    if (editorMeta.kind === "textarea") {
      var textarea = document.createElement("textarea");
      textarea.className = "o_lib_settings_default_input o_lib_settings_default_textarea";
      textarea.setAttribute("data-lib-role", "field-default");
      textarea.placeholder = "Default value";
      textarea.value = valueSeed;
      return {
        kind: "textarea",
        node: textarea,
        readValue: function () {
          return String(textarea.value || "").trim();
        },
      };
    }

    var input = document.createElement("input");
    input.className = "o_lib_settings_default_input";
    input.setAttribute("data-lib-role", "field-default");
    input.placeholder = "Default value";
    input.value = valueSeed;

    if (editorMeta.kind === "date") {
      input.type = "date";
    } else if (editorMeta.kind === "datetime") {
      input.type = "datetime-local";
    } else if (editorMeta.kind === "number") {
      input.type = "number";
      input.step = "any";
    } else {
      input.type = "text";
    }

    return {
      kind: editorMeta.kind || "text",
      node: input,
      readValue: function () {
        return String(input.value || "").trim();
      },
    };
  }

  v2.createFieldDefaultEditor = createFieldDefaultEditor;

  function updateFieldDefaultExpandedState(toggleButton, detailsNode, expanded) {
    if (!(toggleButton instanceof HTMLElement) || !(detailsNode instanceof HTMLElement)) {
      return;
    }
    var isExpanded = Boolean(expanded);
    detailsNode.hidden = !isExpanded;
    toggleButton.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    toggleButton.textContent = isExpanded ? "v" : ">";
  }

  v2.updateFieldDefaultExpandedState = updateFieldDefaultExpandedState;

  function setFieldMetaVisible(fieldMeta, visible) {
    if (!fieldMeta || !Array.isArray(fieldMeta.targets)) {
      return;
    }
    var shouldShow = Boolean(visible);
    fieldMeta.targets.forEach(function (targetNode) {
      if (!(targetNode instanceof HTMLElement)) {
        return;
      }
      targetNode.classList.toggle(FIELD_HIDDEN_CLASS, !shouldShow);
    });
  }

  v2.setFieldMetaVisible = setFieldMetaVisible;

  function parseBooleanValue(rawValue) {
    var normalized = cleanText(rawValue).toLowerCase();
    if (["1", "true", "yes", "y", "on"].indexOf(normalized) >= 0) {
      return true;
    }
    if (["0", "false", "no", "n", "off"].indexOf(normalized) >= 0) {
      return false;
    }
    return null;
  }

  v2.parseBooleanValue = parseBooleanValue;

  function isMany2xWidget(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return false;
    }
    return (
      widgetNode.classList.contains("o_field_many2many") ||
      widgetNode.classList.contains("o_field_one2many")
    );
  }

  v2.isMany2xWidget = isMany2xWidget;

  function applyDefaultValueOnWidget(widgetNode, defaultValue) {
    if (!(widgetNode instanceof HTMLElement) || isMany2xWidget(widgetNode)) {
      return;
    }
    var valueToApply = cleanText(defaultValue);
    if (!valueToApply) {
      return;
    }

    var fieldInput = widgetNode.querySelector("input:not([type='hidden']), textarea, select");
    if (
      !(fieldInput instanceof HTMLInputElement) &&
      !(fieldInput instanceof HTMLTextAreaElement) &&
      !(fieldInput instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (fieldInput instanceof HTMLInputElement && fieldInput.type === "checkbox") {
      var boolValue = parseBooleanValue(valueToApply);
      if (boolValue === null || fieldInput.checked === boolValue) {
        return;
      }
      fieldInput.checked = boolValue;
      fieldInput.dispatchEvent(new Event("input", { bubbles: true }));
      fieldInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    var currentValue = String(fieldInput.value || "");
    if (cleanText(currentValue)) {
      return;
    }
    fieldInput.value = valueToApply;
    fieldInput.dispatchEvent(new Event("input", { bubbles: true }));
    fieldInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  v2.applyDefaultValueOnWidget = applyDefaultValueOnWidget;

  function applySectionFieldLayout(groupNode, scopeKey, sectionKey) {
    var fieldMetas = collectSectionFieldMeta(groupNode);
    groupNode.__libFieldMeta = fieldMetas;

    fieldMetas.forEach(function (fieldMeta) {
      var visible = fieldIsVisible(scopeKey, sectionKey, fieldMeta.key);
      setFieldMetaVisible(fieldMeta, visible);
      var defaultValue = fieldDefaultValue(scopeKey, sectionKey, fieldMeta.key);
      if (!defaultValue) {
        return;
      }
      fieldMeta.widgets.forEach(function (widgetNode) {
        applyDefaultValueOnWidget(widgetNode, defaultValue);
      });
    });
  }

  v2.applySectionFieldLayout = applySectionFieldLayout;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
