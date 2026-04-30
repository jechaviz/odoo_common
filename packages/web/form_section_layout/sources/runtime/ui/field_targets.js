(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_targets.js

  function replaceNodeTextContent(node, nextText) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var normalizedText = cleanText(nextText || "");
    if (!normalizedText) {
      return;
    }
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var current = walker.nextNode();
    while (current) {
      if (cleanText(current.nodeValue || "")) {
        textNodes.push(current);
      }
      current = walker.nextNode();
    }
    if (!textNodes.length) {
      node.textContent = normalizedText;
      return;
    }
    textNodes[0].nodeValue = normalizedText;
    for (var index = 1; index < textNodes.length; index += 1) {
      textNodes[index].nodeValue = "";
    }
  }

  v2.replaceNodeTextContent = replaceNodeTextContent;

  function setSectionVisible(groupNode, visible) {
    if (!(groupNode instanceof HTMLElement)) {
      return;
    }
    var shouldShow = Boolean(visible);
    groupNode.classList.toggle(SECTION_HIDDEN_CLASS, !shouldShow);
  }

  v2.setSectionVisible = setSectionVisible;

  function matchesFieldLabel(fieldName, labelNode) {
    if (!(labelNode instanceof HTMLElement)) {
      return false;
    }
    var labelFor = String(labelNode.getAttribute("for") || "");
    if (!fieldName || !labelFor) {
      return false;
    }
    if (labelFor === fieldName) {
      return true;
    }
    return labelFor.endsWith("_" + fieldName);
  }

  v2.matchesFieldLabel = matchesFieldLabel;

  function resolveFieldTargets(groupNode, widgetNode, fieldName) {
    var targets = [];
    var seen = new Set();

    function push(node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (!groupNode.contains(node) || seen.has(node)) {
        return;
      }
      seen.add(node);
      targets.push(node);
    }

    var fieldContainer = widgetNode.closest(".o_cell, .o_wrap_field, .o_td_field, .o_wrap_input, .o_field_widget");
    if (fieldContainer instanceof HTMLElement) {
      push(fieldContainer);
      var previous = fieldContainer.previousElementSibling;
      if (previous instanceof HTMLElement && (previous.querySelector("label") || previous.classList.contains("o_wrap_label"))) {
        push(previous);
      }
    } else {
      push(widgetNode);
    }

    groupNode.querySelectorAll("label").forEach(function (label) {
      if (!matchesFieldLabel(fieldName, label)) {
        return;
      }
      var labelContainer = label.closest(".o_cell, .o_wrap_label, .o_td_label");
      push(labelContainer || label);
    });

    return targets;
  }

  v2.resolveFieldTargets = resolveFieldTargets;

  function detectFieldLabel(groupNode, widgetNode, fieldName) {
    var fieldContainer = widgetNode.closest(".o_cell, .o_wrap_field, .o_td_field, .o_wrap_input");
    if (fieldContainer instanceof HTMLElement) {
      var previous = fieldContainer.previousElementSibling;
      if (previous instanceof HTMLElement) {
        var previousLabel = previous.querySelector("label");
        if (previousLabel instanceof HTMLElement) {
          var previousText = cleanText(previousLabel.textContent || "");
          if (previousText) {
            return previousText;
          }
        }
      }
    }

    var labels = groupNode.querySelectorAll("label");
    for (var i = 0; i < labels.length; i += 1) {
      var label = labels[i];
      if (!matchesFieldLabel(fieldName, label)) {
        continue;
      }
      var labelText = cleanText(label.textContent || "");
      if (labelText) {
        return labelText;
      }
    }

    return prettifyFieldName(fieldName);
  }

  v2.detectFieldLabel = detectFieldLabel;

  function collectSectionFieldMeta(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return [];
    }

    var byFieldKey = new Map();
    var widgets = groupNode.querySelectorAll(".o_field_widget[name], .o_field_widget[data-name]");
    widgets.forEach(function (widget) {
      if (!(widget instanceof HTMLElement)) {
        return;
      }
      if (widget.closest(".o_field_x2many")) {
        return;
      }
      var ownSection = widget.closest("." + COLLAPSIBLE_GROUP_CLASS);
      if (ownSection !== groupNode) {
        return;
      }
      var fieldName = cleanText(widget.getAttribute("name") || widget.dataset.name || "");
      if (!fieldName) {
        return;
      }
      var fieldKey = normalizeKey(fieldName) || fieldName;
      if (!byFieldKey.has(fieldKey)) {
        byFieldKey.set(fieldKey, {
          key: fieldKey,
          name: fieldName,
          label: detectFieldLabel(groupNode, widget, fieldName),
          widgets: [],
          targets: [],
        });
      }
      var entry = byFieldKey.get(fieldKey);
      entry.widgets.push(widget);
    });

    byFieldKey.forEach(function (entry) {
      var targets = [];
      var seen = new Set();
      entry.widgets.forEach(function (widget) {
        resolveFieldTargets(groupNode, widget, entry.name).forEach(function (node) {
          if (seen.has(node)) {
            return;
          }
          seen.add(node);
          targets.push(node);
        });
      });
      entry.targets = targets;
    });

    return Array.from(byFieldKey.values());
  }

  v2.collectSectionFieldMeta = collectSectionFieldMeta;

  function backendFieldMetaFor(formNode, fieldMeta) {
    if (!(formNode instanceof HTMLElement) || !fieldMeta) {
      return null;
    }
    var fieldName = cleanText(fieldMeta.name || "");
    if (!fieldName) {
      return null;
    }
    var modelName = computeModelName(formNode);
    if (!modelName) {
      return null;
    }
    var definitions = readLoadedFieldDefinitions(modelName);
    var meta = definitions[fieldName];
    if (!meta || typeof meta !== "object") {
      return null;
    }
    return meta;
  }

  v2.backendFieldMetaFor = backendFieldMetaFor;

  function widgetHasEditableControl(widgetNode) {
    if (!(widgetNode instanceof HTMLElement)) {
      return false;
    }
    if (
      widgetNode.classList.contains("o_readonly_modifier") ||
      widgetNode.getAttribute("readonly") === "1" ||
      widgetNode.getAttribute("readonly") === "true" ||
      widgetNode.getAttribute("aria-readonly") === "true"
    ) {
      return false;
    }

    var controls = widgetNode.querySelectorAll("select, input:not([type='hidden']), textarea");
    for (var i = 0; i < controls.length; i += 1) {
      var control = controls[i];
      if (
        !(control instanceof HTMLInputElement) &&
        !(control instanceof HTMLSelectElement) &&
        !(control instanceof HTMLTextAreaElement)
      ) {
        continue;
      }
      if (control.disabled || control.closest(".o_readonly_modifier")) {
        continue;
      }
      if (control instanceof HTMLInputElement) {
        var inputType = cleanText(control.type || "").toLowerCase();
        if (control.readOnly && inputType !== "checkbox" && inputType !== "radio") {
          continue;
        }
      }
      return true;
    }

    return widgetNode.querySelector("[contenteditable='true']") instanceof HTMLElement;
  }

  v2.widgetHasEditableControl = widgetHasEditableControl;

  function fieldAllowsDefaultEditor(formNode, fieldMeta, backendMeta) {
    var meta = backendMeta || backendFieldMetaFor(formNode, fieldMeta);
    if (meta && meta.readonly) {
      return false;
    }
    if (!fieldMeta || !Array.isArray(fieldMeta.widgets) || !fieldMeta.widgets.length) {
      return false;
    }
    return fieldMeta.widgets.some(function (widgetNode) {
      return widgetHasEditableControl(widgetNode);
    });
  }

  v2.fieldAllowsDefaultEditor = fieldAllowsDefaultEditor;

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

  v2.findFieldInputOnWidget = findFieldInputOnWidget;

  function collectSelectOptions(selectNode) {
    if (!(selectNode instanceof HTMLSelectElement)) {
      return [];
    }
    var options = [];
    var seen = new Set();
    selectNode.querySelectorAll("option").forEach(function (optionNode) {
      if (!(optionNode instanceof HTMLOptionElement)) {
        return;
      }
      var rawValue = String(optionNode.value || "");
      var value = rawValue;
      var label = cleanText(optionNode.textContent || "");
      var key = value + "|" + label;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      options.push({
        value: value,
        label: label || value || "(empty)",
      });
    });
    return options;
  }

  v2.collectSelectOptions = collectSelectOptions;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
