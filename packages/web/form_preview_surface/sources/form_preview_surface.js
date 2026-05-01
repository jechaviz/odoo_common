(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("form_preview_surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function readOptions(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function escapeAttributeValue(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  function readFieldLikeText(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      return normalizeText(node.value || "");
    }
    if (node instanceof HTMLSelectElement) {
      return normalizeText(node.value || "");
    }
    var input = node.querySelector("input, textarea, select, .o_input, .o-autocomplete--input");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
      return readFieldLikeText(input);
    }
    return normalizeText(node.textContent || "");
  }

  function replaceTextContent(node, text) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var normalizedText = String(text || "");
    if (
      node.childNodes.length === 1 &&
      node.firstChild &&
      node.firstChild.nodeType === Node.TEXT_NODE &&
      String(node.textContent || "") === normalizedText
    ) {
      return true;
    }
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    node.appendChild(document.createTextNode(normalizedText));
    return true;
  }

  function setPreviewNodeVisibility(node, visible) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var shouldShow = !!visible;
    node.classList.toggle("o_invisible_modifier", !shouldShow);
    node.hidden = !shouldShow;
    node.style.display = shouldShow ? "" : "none";
    if (shouldShow) {
      node.removeAttribute("aria-hidden");
    } else {
      node.setAttribute("aria-hidden", "true");
    }
    return shouldShow;
  }

  function resolveManagedFormRoot(rawOptions) {
    var options = readOptions(rawOptions);
    var allowDialog = !!options.allowDialog;
    if (typeof options.resolveRoot === "function") {
      var resolvedRoot = options.resolveRoot();
      if (resolvedRoot instanceof HTMLElement) {
        return resolvedRoot;
      }
    }
    if (options.formRoot instanceof HTMLElement) {
      return options.formRoot;
    }
    var selector = normalizeText(options.selector || ".o_form_view");
    if (selector) {
      var selectedRoot = document.querySelector(selector);
      if (selectedRoot instanceof HTMLElement) {
        if (allowDialog || !selectedRoot.closest(".modal, .o_dialog, .o_technical_modal")) {
          return selectedRoot;
        }
      }
    }
    var formRoot = document.querySelector(".o_form_view");
    return formRoot instanceof HTMLElement && (allowDialog || !formRoot.closest(".modal, .o_dialog, .o_technical_modal"))
      ? formRoot
      : null;
  }

  function resolveFormFieldRoot(fieldName, rawOptions) {
    var normalizedFieldName = normalizeText(fieldName);
    if (!normalizedFieldName) {
      return null;
    }
    var options = readOptions(rawOptions);
    var formRoot = resolveManagedFormRoot(options);
    if (!(formRoot instanceof HTMLElement)) {
      return null;
    }
    var escapedFieldName = escapeAttributeValue(normalizedFieldName);
    var selectors = [
      '.o_field_widget[name="' + escapedFieldName + '"]',
      '[name="' + escapedFieldName + '"].o_field_widget',
      '[name="' + escapedFieldName + '"]',
      '.o_field_widget[data-name="' + escapedFieldName + '"]',
      '[data-name="' + escapedFieldName + '"]',
    ];
    for (var index = 0; index < selectors.length; index += 1) {
      var node = formRoot.querySelector(selectors[index]);
      if (node instanceof HTMLElement) {
        return node;
      }
    }
    return null;
  }

  function readFormFieldText(fieldName, rawOptions) {
    var fieldRoot = resolveFormFieldRoot(fieldName, rawOptions);
    return fieldRoot instanceof HTMLElement ? readFieldLikeText(fieldRoot) : "";
  }

  function setFormFieldPreviewValue(fieldName, value, rawOptions) {
    var normalizedValue = normalizeText(value);
    var options = readOptions(rawOptions);
    var fieldRoot = resolveFormFieldRoot(fieldName, options);
    if (!(fieldRoot instanceof HTMLElement) || !normalizedValue) {
      return false;
    }
    var input = fieldRoot.querySelector("input, textarea, select, .o_input, .o-autocomplete--input");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
      var currentValue = readFieldLikeText(input);
      if (options.onlyWhenEmpty && currentValue) {
        return currentValue === normalizedValue;
      }
      if (document.activeElement === input && !options.allowWhenFocused) {
        return currentValue === normalizedValue;
      }
      if ("value" in input) {
        input.value = normalizedValue;
      }
      input.setAttribute("title", normalizedValue);
      return true;
    }
    return replaceTextContent(fieldRoot, normalizedValue);
  }

  var surfaceLayerApi = requireSurfaceLayerApi();

  surfaceLayerApi.resolveManagedFormRoot = resolveManagedFormRoot;
  surfaceLayerApi.resolveFormFieldRoot = resolveFormFieldRoot;
  surfaceLayerApi.readFormFieldText = readFormFieldText;
  surfaceLayerApi.setFormFieldPreviewValue = setFormFieldPreviewValue;
  surfaceLayerApi.replaceTextContent = replaceTextContent;
  surfaceLayerApi.setPreviewNodeVisibility = setPreviewNodeVisibility;

  window.OdooSurfaceLayers = surfaceLayerApi;
})();
