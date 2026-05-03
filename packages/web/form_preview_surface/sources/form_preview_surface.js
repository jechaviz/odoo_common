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

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function readFunction(value) {
    return typeof value === "function" ? value : null;
  }

  function readStringList(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var normalizedValue = normalizeText(value);
      if (!normalizedValue || seen[normalizedValue]) {
        return result;
      }
      seen[normalizedValue] = true;
      result.push(normalizedValue);
      return result;
    }, []);
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

  function resolvePreviewTarget(rawTarget, rawOptions) {
    var options = readOptions(rawOptions);
    if (rawTarget instanceof HTMLElement) {
      return rawTarget;
    }
    if (typeof rawTarget === "function") {
      return resolvePreviewTarget(rawTarget(options), options);
    }
    var selector = normalizeText(rawTarget);
    if (!selector) {
      return null;
    }
    var rootNode = resolveManagedFormRoot(options);
    if (rootNode instanceof HTMLElement) {
      var nestedTarget = rootNode.querySelector(selector);
      if (nestedTarget instanceof HTMLElement) {
        return nestedTarget;
      }
    }
    var documentTarget = document.querySelector(selector);
    return documentTarget instanceof HTMLElement ? documentTarget : null;
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

  function normalizePreviewBinding(rawBinding, previewKey) {
    var binding = rawBinding && typeof rawBinding === "object" && !Array.isArray(rawBinding)
      ? rawBinding
      : {};
    var normalizedPreviewKey = normalizeText(previewKey || binding.previewKey || binding.key || binding.name);
    var fieldName = normalizeText(binding.fieldName || binding.previewField || binding.targetField);
    var targetSelector = normalizeText(binding.targetSelector || binding.previewSelector);
    var targetResolver = readFunction(binding.resolveTarget || binding.targetResolver);
    var targetNode = asElement(binding.targetNode);
    var formatter = readFunction(binding.format);
    var writer = readFunction(binding.write);
    var shouldHideWhenEmpty = !Object.prototype.hasOwnProperty.call(binding, "hideWhenEmpty") || !!binding.hideWhenEmpty;
    var shouldWriteField = !Object.prototype.hasOwnProperty.call(binding, "writeField") || !!binding.writeField;
    var shouldWriteTarget = !Object.prototype.hasOwnProperty.call(binding, "writeTarget") || !!binding.writeTarget;
    if (!(fieldName || targetSelector || targetResolver || targetNode || writer)) {
      throw new Error(
        "form_preview_surface binding " + (normalizedPreviewKey || "<anonymous>") +
        " requires fieldName, targetSelector, resolveTarget, targetNode, or write."
      );
    }
    return {
      previewKey: normalizedPreviewKey,
      fieldName: fieldName,
      targetSelector: targetSelector,
      targetResolver: targetResolver,
      targetNode: targetNode,
      formatter: formatter,
      writer: writer,
      hideWhenEmpty: shouldHideWhenEmpty,
      writeField: shouldWriteField,
      writeTarget: shouldWriteTarget,
    };
  }

  function normalizePreviewBindings(rawPreviewFields) {
    if (Array.isArray(rawPreviewFields)) {
      return rawPreviewFields.reduce(function (result, binding, index) {
        var normalizedBinding = normalizePreviewBinding(binding, binding && binding.previewKey ? binding.previewKey : "binding_" + String(index));
        result[normalizedBinding.previewKey || String(index)] = normalizedBinding;
        return result;
      }, Object.create(null));
    }
    var source = rawPreviewFields && typeof rawPreviewFields === "object" ? rawPreviewFields : {};
    return Object.keys(source).reduce(function (result, previewKey) {
      result[previewKey] = normalizePreviewBinding(source[previewKey], previewKey);
      return result;
    }, Object.create(null));
  }

  function normalizeFormPreviewSurfaceSpec(rawSpec) {
    var spec = readOptions(rawSpec);
    var previewFields = normalizePreviewBindings(spec.previewFields || spec.bindings);
    if (!Object.keys(previewFields).length) {
      throw new Error("form_preview_surface spec.previewFields is required.");
    }
    return {
      selector: normalizeText(spec.selector),
      formRoot: asElement(spec.formRoot),
      resolveRoot: readFunction(spec.resolveRoot),
      allowDialog: !!spec.allowDialog,
      previewFields: previewFields,
      visibleWhen: readFunction(spec.visibleWhen),
      beforeSync: readFunction(spec.beforeSync),
      afterSync: readFunction(spec.afterSync),
    };
  }

  function buildFormPreviewSurfaceRuntimeOptions(spec, rawOptions) {
    var options = readOptions(rawOptions);
    return {
      selector: normalizeText(options.selector || spec.selector),
      formRoot: asElement(options.formRoot) || spec.formRoot,
      resolveRoot: readFunction(options.resolveRoot) || spec.resolveRoot,
      allowDialog: Object.prototype.hasOwnProperty.call(options, "allowDialog")
        ? !!options.allowDialog
        : spec.allowDialog,
    };
  }

  function normalizePreviewPayload(rawPayload) {
    return rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload) ? rawPayload : {};
  }

  function syncFormPreviewBinding(binding, payload, runtimeOptions, rawAdapterOptions) {
    var adapterOptions = readOptions(rawAdapterOptions);
    var previewKey = binding.previewKey;
    var value = previewKey ? payload[previewKey] : "";
    if (binding.formatter) {
      value = binding.formatter(value, payload, adapterOptions);
    }
    var normalizedValue = normalizeText(value);
    var visible = binding.hideWhenEmpty ? !!normalizedValue : true;
    if (binding.writeField && binding.fieldName) {
      setFormFieldPreviewValue(binding.fieldName, normalizedValue, Object.assign({}, runtimeOptions, {
        onlyWhenEmpty: !!adapterOptions.onlyWhenEmpty,
        allowWhenFocused: !!adapterOptions.allowWhenFocused,
      }));
    }
    var targetNode = binding.targetNode
      || (binding.targetResolver ? resolvePreviewTarget(binding.targetResolver, runtimeOptions) : null)
      || resolvePreviewTarget(binding.targetSelector, runtimeOptions);
    if (typeof binding.writer === "function") {
      binding.writer(targetNode, normalizedValue, payload, adapterOptions);
    } else if (binding.writeTarget && targetNode instanceof HTMLElement) {
      replaceTextContent(targetNode, normalizedValue);
    }
    if (targetNode instanceof HTMLElement) {
      setPreviewNodeVisibility(targetNode, visible);
    }
    return {
      previewKey: previewKey,
      value: normalizedValue,
      visible: visible,
      targetNode: targetNode,
    };
  }

  function buildFormPreviewSurfaceAdapter(rawSpec) {
    var spec = normalizeFormPreviewSurfaceSpec(rawSpec);

    function applySync(rawPayload, rawOptions, skipVisibilityGuard) {
      var payload = normalizePreviewPayload(rawPayload);
      var runtimeOptions = buildFormPreviewSurfaceRuntimeOptions(spec, rawOptions);
      var adapterOptions = readOptions(rawOptions);
      if (!skipVisibilityGuard && typeof spec.visibleWhen === "function" && !spec.visibleWhen(payload, adapterOptions)) {
        clear(rawOptions);
        return [];
      }
      if (typeof spec.beforeSync === "function") {
        spec.beforeSync(payload, adapterOptions);
      }
      var results = Object.keys(spec.previewFields).map(function (previewKey) {
        return syncFormPreviewBinding(spec.previewFields[previewKey], payload, runtimeOptions, adapterOptions);
      });
      if (typeof spec.afterSync === "function") {
        spec.afterSync(results, payload, adapterOptions);
      }
      return results;
    }

    function sync(rawPayload, rawOptions) {
      return applySync(rawPayload, rawOptions, false);
    }

    function clear(rawOptions) {
      return applySync({}, Object.assign({}, readOptions(rawOptions), { allowWhenFocused: true }), true);
    }

    function readState() {
      return {
        selector: spec.selector,
        allowDialog: spec.allowDialog,
        previewKeys: Object.keys(spec.previewFields),
        fieldNames: readStringList(Object.keys(spec.previewFields).map(function (previewKey) {
          return spec.previewFields[previewKey].fieldName;
        })),
      };
    }

    return {
      sync: sync,
      clear: clear,
      readState: readState,
    };
  }

  var surfaceLayerApi = requireSurfaceLayerApi();

  surfaceLayerApi.resolveManagedFormRoot = resolveManagedFormRoot;
  surfaceLayerApi.resolvePreviewTarget = resolvePreviewTarget;
  surfaceLayerApi.resolveFormFieldRoot = resolveFormFieldRoot;
  surfaceLayerApi.readFormFieldText = readFormFieldText;
  surfaceLayerApi.setFormFieldPreviewValue = setFormFieldPreviewValue;
  surfaceLayerApi.replaceTextContent = replaceTextContent;
  surfaceLayerApi.setPreviewNodeVisibility = setPreviewNodeVisibility;
  surfaceLayerApi.normalizeFormPreviewSurfaceSpec = normalizeFormPreviewSurfaceSpec;
  surfaceLayerApi.buildFormPreviewSurfaceAdapter = buildFormPreviewSurfaceAdapter;

  window.OdooSurfaceLayers = surfaceLayerApi;
})();
