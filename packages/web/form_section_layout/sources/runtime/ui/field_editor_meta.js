(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/ui/field_editor_meta.js

  function inferFieldDefaultEditorMetaFromDom(fieldMeta) {
    var fallback = { kind: "text", options: [] };
    if (!fieldMeta || !Array.isArray(fieldMeta.widgets)) {
      return fallback;
    }

    for (var i = 0; i < fieldMeta.widgets.length; i += 1) {
      var widgetNode = fieldMeta.widgets[i];
      if (!(widgetNode instanceof HTMLElement)) {
        continue;
      }

      if (widgetNode.classList.contains("o_field_many2one")) {
        return { kind: "many2one", options: [] };
      }
      if (widgetNode.classList.contains("o_field_text") || widgetNode.classList.contains("o_field_html")) {
        return { kind: "textarea", options: [] };
      }
      if (widgetNode.classList.contains("o_field_date")) {
        return { kind: "date", options: [] };
      }
      if (widgetNode.classList.contains("o_field_datetime")) {
        return { kind: "datetime", options: [] };
      }
      if (widgetNode.classList.contains("o_field_boolean")) {
        return {
          kind: "boolean",
          options: [
            { value: "true", label: "True" },
            { value: "false", label: "False" },
          ],
        };
      }
      if (
        widgetNode.classList.contains("o_field_integer") ||
        widgetNode.classList.contains("o_field_float") ||
        widgetNode.classList.contains("o_field_monetary")
      ) {
        return { kind: "number", options: [] };
      }

      var inputNode = findFieldInputOnWidget(widgetNode);
      if (!(inputNode instanceof HTMLElement)) {
        continue;
      }
      if (inputNode instanceof HTMLSelectElement) {
        return {
          kind: "select",
          options: collectSelectOptions(inputNode),
        };
      }
      if (inputNode instanceof HTMLTextAreaElement) {
        return { kind: "textarea", options: [] };
      }
      if (inputNode instanceof HTMLInputElement) {
        var inputType = cleanText(inputNode.type || "").toLowerCase();
        if (inputType === "checkbox") {
          return {
            kind: "boolean",
            options: [
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ],
          };
        }
        if (inputType === "date") {
          return { kind: "date", options: [] };
        }
        if (inputType === "datetime-local") {
          return { kind: "datetime", options: [] };
        }
        if (inputType === "number") {
          return { kind: "number", options: [] };
        }
      }
    }

    return fallback;
  }

  v2.inferFieldDefaultEditorMetaFromDom = inferFieldDefaultEditorMetaFromDom;

  function mapBackendFieldTypeToEditorMeta(fieldType, selectionOptions) {
    var typeName = cleanText(fieldType || "").toLowerCase();
    if (typeName === "many2one") {
      return { kind: "many2one", options: [] };
    }
    if (typeName === "selection") {
      return {
        kind: "select",
        options: Array.isArray(selectionOptions) ? selectionOptions : [],
      };
    }
    if (typeName === "boolean") {
      return {
        kind: "boolean",
        options: [
          { value: "true", label: "True" },
          { value: "false", label: "False" },
        ],
      };
    }
    if (typeName === "date") {
      return { kind: "date", options: [] };
    }
    if (typeName === "datetime") {
      return { kind: "datetime", options: [] };
    }
    if (typeName === "text" || typeName === "html") {
      return { kind: "textarea", options: [] };
    }
    if (typeName === "integer" || typeName === "float" || typeName === "monetary") {
      return { kind: "number", options: [] };
    }
    return { kind: "text", options: [] };
  }

  v2.mapBackendFieldTypeToEditorMeta = mapBackendFieldTypeToEditorMeta;

  function inferFieldDefaultEditorMeta(formNode, fieldMeta) {
    var domMeta = inferFieldDefaultEditorMetaFromDom(fieldMeta);
    if (!fieldMeta) {
      return domMeta;
    }
    var backendMeta = backendFieldMetaFor(formNode, fieldMeta);
    if (!backendMeta || typeof backendMeta !== "object") {
      return domMeta;
    }

    var mapped = mapBackendFieldTypeToEditorMeta(backendMeta.type, backendMeta.selection);
    if (mapped.kind === "many2one") {
      var modelName = computeModelName(formNode);
      mapped.options = readRelationFieldOptions(modelName, fieldMeta.name);
    }
    if (mapped.kind === "select" && !mapped.options.length && domMeta.kind === "select") {
      mapped.options = Array.isArray(domMeta.options) ? domMeta.options : [];
    }
    if (mapped.kind === "text" && domMeta.kind !== "text") {
      return domMeta;
    }
    return mapped;
  }

  v2.inferFieldDefaultEditorMeta = inferFieldDefaultEditorMeta;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
