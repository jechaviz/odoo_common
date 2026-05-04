(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before form header identity surface.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before form header identity surface."
      );
    }
    return candidate;
  }

  var HEADER_IDENTITY_ENHANCER_KEY = "headerIdentity";
  var DEFAULT_FORM_SELECTOR = ".o_form_view";
  var DEFAULT_IDENTITY_SELECTOR = "[data-surface-header-identity='1']";
  var DEFAULT_SLOT_SELECTOR = "[data-surface-header-identity-slot]";
  var HEADER_IDENTITY_SLOT_ATTR = "data-surface-header-identity-slot";
  var HEADER_IDENTITY_EMPTY_ATTR = "data-surface-header-identity-empty";
  var HEADER_IDENTITY_VALUE_SELECTOR = "[data-surface-header-identity-value='1'], .o_surface_header_identity_value";
  var DEFAULT_FIELD_ROOT_SELECTOR = "[name], [data-name]";
  var DEFAULT_DROPDOWN_OPTION_SELECTOR = ".o-autocomplete--dropdown-item, .o_m2o_dropdown_option, [role='option'], [role='menuitem'], .dropdown-item, .ui-menu-item";
  var DEFAULT_CONTROL_PANEL_SELECTOR = ".o_control_panel";
  var CONTROL_PANEL_HOST_SELECTOR = ".o_content, .o_action, .o_view_controller";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function readObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function readStringList(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var normalized = normalizeText(value);
      if (!normalized || seen[normalized]) {
        return result;
      }
      seen[normalized] = true;
      result.push(normalized);
      return result;
    }, []);
  }

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function closestElement(target, selector) {
    var normalizedSelector = normalizeText(selector);
    if (!(target instanceof HTMLElement) || !normalizedSelector) {
      return null;
    }
    try {
      var candidate = target.closest(normalizedSelector);
      return candidate instanceof HTMLElement ? candidate : null;
    } catch (_error) {
      return null;
    }
  }

  function replaceNodeText(node, text) {
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
      return false;
    }
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    node.appendChild(document.createTextNode(normalizedText));
    return true;
  }

  function setNodeText(node, text) {
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      if (String(node.value || "") !== String(text || "")) {
        node.value = String(text || "");
      }
      node.setAttribute("title", String(text || ""));
      return true;
    }
    return replaceNodeText(node, text);
  }

  function isBridgeDropdownOption(node, adapter) {
    return !!(
      node instanceof HTMLElement &&
      closestElement(node, adapter && adapter.dropdownOptionSelector)
    );
  }

  function normalizeValueReader(rawReader) {
    var reader = readObject(rawReader);
    return {
      fieldNames: readStringList(reader.fieldNames),
      fallback: normalizeText(reader.fallback),
      read: typeof reader.read === "function" ? reader.read : null,
      formatValue: typeof reader.formatValue === "function" ? reader.formatValue : null,
    };
  }

  function normalizeBreadcrumbItem(rawItem) {
    if (typeof rawItem === "string") {
      return {
        label: normalizeText(rawItem),
        href: "",
        target: "",
        key: "",
        home: false,
        current: false,
      };
    }
    var item = readObject(rawItem);
    return {
      label: normalizeText(item.label),
      href: normalizeText(item.href),
      target: normalizeText(item.target),
      key: normalizeText(item.key),
      home: !!item.home,
      current: !!item.current,
    };
  }

  function normalizeBreadcrumbConfig(rawBreadcrumb) {
    var breadcrumb = readObject(rawBreadcrumb);
    return {
      enabled: breadcrumb.enabled !== false,
      items: (Array.isArray(breadcrumb.items) ? breadcrumb.items : []).map(normalizeBreadcrumbItem).filter(function (item) {
        return !!item.label;
      }),
      resolveItems: typeof breadcrumb.resolveItems === "function" ? breadcrumb.resolveItems : null,
      current: normalizeValueReader(breadcrumb.current),
      controlPanelSelector: normalizeText(breadcrumb.controlPanelSelector || DEFAULT_CONTROL_PANEL_SELECTOR),
    };
  }

  function normalizeSlotConfig(slotName, rawSlot) {
    var slot = normalizeValueReader(rawSlot);
    slot.slot = normalizeText(slotName);
    return slot;
  }

  function normalizeSlotConfigs(rawSlots) {
    var slots = readObject(rawSlots);
    var normalized = Object.create(null);
    Object.keys(slots).forEach(function (slotName) {
      normalized[slotName] = normalizeSlotConfig(slotName, slots[slotName]);
    });
    return normalized;
  }

  function deriveWatchFieldNames(adapter) {
    var watchFieldNames = []
      .concat(Object.keys(adapter.slots).reduce(function (result, slotName) {
        return result.concat(adapter.slots[slotName].fieldNames);
      }, []))
      .concat(adapter.title.fieldNames)
      .concat(adapter.breadcrumb.current.fieldNames);
    return readStringList(watchFieldNames);
  }

  function buildFormHeaderIdentityAdapter(rawSpec) {
    var spec = readObject(rawSpec);
    var adapter = {
      enhancerKey: HEADER_IDENTITY_ENHANCER_KEY,
      formSelector: normalizeText(spec.formSelector || DEFAULT_FORM_SELECTOR),
      identitySelector: normalizeText(spec.identitySelector || DEFAULT_IDENTITY_SELECTOR),
      fieldRootSelector: normalizeText(spec.fieldRootSelector || DEFAULT_FIELD_ROOT_SELECTOR),
      dropdownOptionSelector: normalizeText(spec.dropdownOptionSelector || DEFAULT_DROPDOWN_OPTION_SELECTOR),
      slots: normalizeSlotConfigs(spec.slots),
      title: normalizeValueReader(spec.title),
      breadcrumb: normalizeBreadcrumbConfig(spec.breadcrumb),
      watchFieldNames: readStringList(spec.watchFieldNames),
    };
    adapter.title.targetSelector = normalizeText(readObject(spec.title).targetSelector);
    adapter.title.applyToDocumentTitle = !Object.prototype.hasOwnProperty.call(readObject(spec.title), "applyToDocumentTitle")
      ? true
      : !!readObject(spec.title).applyToDocumentTitle;
    if (!adapter.watchFieldNames.length) {
      adapter.watchFieldNames = deriveWatchFieldNames(adapter);
    }
    return adapter;
  }

  function buildFormHeaderIdentityConfig(rawSpec) {
    return Object.assign({ enhancerKey: HEADER_IDENTITY_ENHANCER_KEY }, buildFormHeaderIdentityAdapter(rawSpec));
  }

  function buildAdapterSignature(adapter) {
    return JSON.stringify({
      identitySelector: adapter.identitySelector,
      formSelector: adapter.formSelector,
      fieldRootSelector: adapter.fieldRootSelector,
      dropdownOptionSelector: adapter.dropdownOptionSelector,
      watchFieldNames: adapter.watchFieldNames,
      slotKeys: Object.keys(adapter.slots),
      slotFieldNames: Object.keys(adapter.slots).reduce(function (result, slotName) {
        result[slotName] = adapter.slots[slotName].fieldNames;
        return result;
      }, {}),
      titleFieldNames: adapter.title.fieldNames,
      titleTargetSelector: adapter.title.targetSelector,
      breadcrumbEnabled: adapter.breadcrumb.enabled,
      breadcrumbItems: adapter.breadcrumb.items,
      breadcrumbCurrentFieldNames: adapter.breadcrumb.current.fieldNames,
      breadcrumbControlPanelSelector: adapter.breadcrumb.controlPanelSelector,
    });
  }

  function resolveFieldReaderValue(reader, runtimeContext, adapter, formRoot) {
    if (reader.read) {
      try {
        var explicitValue = reader.read(runtimeContext || {}, adapter, formRoot);
        var normalizedExplicitValue = normalizeText(explicitValue);
        if (normalizedExplicitValue) {
          return normalizedExplicitValue;
        }
      } catch (_error) {}
    }
    var fieldValue = normalizeText(readFieldText(formRoot, reader.fieldNames));
    if (fieldValue && reader.formatValue) {
      try {
        var formattedValue = normalizeText(reader.formatValue(fieldValue, runtimeContext || {}, adapter, formRoot));
        if (formattedValue) {
          return formattedValue;
        }
      } catch (_error) {}
    }
    if (fieldValue) {
      return fieldValue;
    }
    return reader.fallback;
  }

  function resolveFormRoot(runtimeContext, adapter) {
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var formRoot = asElement(context.formRoot);
    if (formRoot instanceof HTMLElement) {
      return formRoot;
    }
    return findVisibleForm({
      formSelector: adapter.formSelector,
      allowFallback: true,
    });
  }

  function resolveIdentityRoot(formRoot, adapter) {
    if (!(formRoot instanceof HTMLElement)) {
      return null;
    }
    return formRoot.querySelector(adapter.identitySelector);
  }

  function resolveSlotNodes(identityRoot) {
    if (!(identityRoot instanceof HTMLElement)) {
      return {};
    }
    return Array.prototype.slice.call(
      identityRoot.querySelectorAll(DEFAULT_SLOT_SELECTOR)
    ).reduce(function (result, node) {
      var slotName = normalizeText(node.getAttribute(HEADER_IDENTITY_SLOT_ATTR));
      if (slotName && !(result[slotName] instanceof HTMLElement) && node instanceof HTMLElement) {
        result[slotName] = node;
      }
      return result;
    }, {});
  }

  function resolveTitleValue(adapter, runtimeContext, formRoot) {
    return resolveFieldReaderValue(adapter.title, runtimeContext, adapter, formRoot);
  }

  function resolveBreadcrumbItems(adapter, runtimeContext, state) {
    if (!adapter.breadcrumb.enabled) {
      return [];
    }
    if (adapter.breadcrumb.resolveItems) {
      try {
        var resolvedItems = adapter.breadcrumb.resolveItems(runtimeContext || {}, state, adapter);
        return (Array.isArray(resolvedItems) ? resolvedItems : [])
          .map(normalizeBreadcrumbItem)
          .filter(function (item) {
            return !!item.label;
          });
      } catch (_error) {
        return adapter.breadcrumb.items.slice();
      }
    }
    return adapter.breadcrumb.items.slice();
  }

  function resolveBreadcrumbCurrent(adapter, runtimeContext, formRoot, titleValue) {
    var currentValue = resolveFieldReaderValue(adapter.breadcrumb.current, runtimeContext, adapter, formRoot);
    return currentValue || titleValue;
  }

  function readFormHeaderIdentityState(adapter, runtimeContext) {
    var normalizedAdapter = buildFormHeaderIdentityAdapter(adapter);
    var formRoot = resolveFormRoot(runtimeContext, normalizedAdapter);
    if (!(formRoot instanceof HTMLElement)) {
      return {
        available: false,
        adapter: normalizedAdapter,
        formRoot: null,
        identityRoot: null,
        slotNodes: {},
        slots: {},
        title: "",
        breadcrumb: {
          enabled: normalizedAdapter.breadcrumb.enabled,
          items: [],
          currentLabel: "",
        },
      };
    }
    var identityRoot = resolveIdentityRoot(formRoot, normalizedAdapter);
    var slotNodes = resolveSlotNodes(identityRoot);
    var slots = Object.keys(normalizedAdapter.slots).reduce(function (result, slotName) {
      result[slotName] = {
        slot: slotName,
        value: resolveFieldReaderValue(normalizedAdapter.slots[slotName], runtimeContext, normalizedAdapter, formRoot),
      };
      return result;
    }, {});
    var titleValue = resolveTitleValue(normalizedAdapter, runtimeContext, formRoot);
    var breadcrumbItems = resolveBreadcrumbItems(normalizedAdapter, runtimeContext, {
      formRoot: formRoot,
      identityRoot: identityRoot,
      slots: slots,
      title: titleValue,
    });
    var breadcrumbCurrentLabel = resolveBreadcrumbCurrent(normalizedAdapter, runtimeContext, formRoot, titleValue);
    return {
      available: true,
      adapter: normalizedAdapter,
      formRoot: formRoot,
      identityRoot: identityRoot,
      slotNodes: slotNodes,
      slots: slots,
      title: titleValue,
      breadcrumb: {
        enabled: normalizedAdapter.breadcrumb.enabled,
        items: breadcrumbItems,
        currentLabel: breadcrumbCurrentLabel,
      },
    };
  }

  function syncSlotNode(slotNode, slotState) {
    if (!(slotNode instanceof HTMLElement)) {
      return;
    }
    var value = normalizeText(slotState && slotState.value);
    slotNode.dataset.surfaceHeaderIdentityValue = value;
    if (value) {
      slotNode.removeAttribute(HEADER_IDENTITY_EMPTY_ATTR);
      slotNode.setAttribute("title", value);
    } else {
      slotNode.setAttribute(HEADER_IDENTITY_EMPTY_ATTR, "1");
      slotNode.removeAttribute("title");
    }
    var explicitValueNode = slotNode.querySelector(HEADER_IDENTITY_VALUE_SELECTOR);
    if (explicitValueNode instanceof HTMLElement) {
      setNodeText(explicitValueNode, value);
    }
  }

  function syncIdentityRoot(state) {
    var identityRoot = asElement(state && state.identityRoot);
    if (!(identityRoot instanceof HTMLElement)) {
      return false;
    }
    var slots = readObject(state && state.slots);
    Object.keys(slots).forEach(function (slotName) {
      syncSlotNode(state.slotNodes && state.slotNodes[slotName], slots[slotName]);
    });
    return true;
  }

  function resolveTitleTarget(formRoot, adapter) {
    if (!(formRoot instanceof HTMLElement)) {
      return null;
    }
    var selector = normalizeText(adapter.title.targetSelector);
    if (!selector) {
      return null;
    }
    return formRoot.querySelector(selector);
  }

  function syncTitleSurface(state) {
    if (!(state && state.available)) {
      return false;
    }
    var titleValue = normalizeText(state.title);
    var formRoot = state.formRoot;
    var adapter = state.adapter;
    var titleTarget = resolveTitleTarget(formRoot, adapter);
    if (titleTarget instanceof HTMLElement && titleValue) {
      setNodeText(titleTarget, titleValue);
      titleTarget.setAttribute("title", titleValue);
    }
    if (adapter.title.applyToDocumentTitle && titleValue) {
      document.title = titleValue;
    }
    return true;
  }

  function resolveControlPanel(runtimeContext, state) {
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var explicitControlPanel = asElement(context.controlPanel);
    if (explicitControlPanel instanceof HTMLElement) {
      return explicitControlPanel;
    }
    return resolveScopedControlPanel({
      hostNode: state && state.formRoot instanceof HTMLElement ? closestElement(state.formRoot, CONTROL_PANEL_HOST_SELECTOR) : null,
      selector: state && state.adapter && state.adapter.breadcrumb
        ? state.adapter.breadcrumb.controlPanelSelector
        : DEFAULT_CONTROL_PANEL_SELECTOR,
    });
  }

  function syncBreadcrumbSurface(state, runtimeContext) {
    if (!(state && state.available) || !state.breadcrumb.enabled) {
      return false;
    }
    var currentLabel = normalizeText(state.breadcrumb.currentLabel);
    var items = Array.isArray(state.breadcrumb.items) ? state.breadcrumb.items.slice() : [];
    if (!currentLabel) {
      return false;
    }
    var controlPanel = resolveControlPanel(runtimeContext, state);
    if (!(controlPanel instanceof HTMLElement)) {
      return false;
    }
    syncCanonicalBreadcrumb({
      controlPanel: controlPanel,
      items: items.concat([{
        label: currentLabel,
        current: true,
      }]),
    });
    return true;
  }

  function syncFormHeaderIdentitySurface(rawSpec, runtimeContext) {
    var state = readFormHeaderIdentityState(rawSpec, runtimeContext);
    if (!state.available) {
      return false;
    }
    syncIdentityRoot(state);
    syncTitleSurface(state);
    syncBreadcrumbSurface(state, runtimeContext);
    return state;
  }

  function getWatchedFieldName(target, adapter, formRoot) {
    if (!(target instanceof HTMLElement)) {
      return "";
    }
    var fieldRoot = closestElement(target, adapter && adapter.fieldRootSelector);
    if (!(fieldRoot instanceof HTMLElement)) {
      return "";
    }
    if (formRoot instanceof HTMLElement && !formRoot.contains(fieldRoot)) {
      return "";
    }
    var fieldName = normalizeText(
      fieldRoot.getAttribute("name") || fieldRoot.getAttribute("data-name") || ""
    );
    return adapter.watchFieldNames.indexOf(fieldName) >= 0 ? fieldName : "";
  }

  function scheduleBridgeSync(formRoot) {
    if (!(formRoot instanceof HTMLElement)) {
      return;
    }
    var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
    var token = Number(bridgeState.syncToken || 0) + 1;
    bridgeState.syncToken = token;
    formRoot._surfaceFormHeaderIdentityBridge = bridgeState;
    [0, 120, 360].forEach(function (delayMs) {
      window.setTimeout(function () {
        var liveState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
        if (Number(liveState.syncToken || 0) !== token) {
          return;
        }
        (Array.isArray(liveState.entries) ? liveState.entries : []).forEach(function (entry) {
          if (!(entry && typeof entry === "object")) {
            return;
          }
          try {
            syncFormHeaderIdentitySurface(entry.adapter, {
              formRoot: formRoot,
              controlPanel: entry.controlPanel,
            });
          } catch (_error) {}
        });
      }, delayMs);
    });
  }

  function installBridgeListeners(formRoot) {
    if (!(formRoot instanceof HTMLElement)) {
      return false;
    }
    if (formRoot.dataset.surfaceHeaderIdentityBridgeBound === "1") {
      return true;
    }
    formRoot.dataset.surfaceHeaderIdentityBridgeBound = "1";
    formRoot.addEventListener("focusin", function (event) {
      var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
      var target = event && event.target instanceof HTMLElement ? event.target : null;
      var entries = Array.isArray(bridgeState.entries) ? bridgeState.entries : [];
      for (var index = 0; index < entries.length; index += 1) {
        var fieldName = getWatchedFieldName(target, entries[index].adapter, formRoot);
        if (fieldName) {
          bridgeState.lastFocusedField = fieldName;
          formRoot._surfaceFormHeaderIdentityBridge = bridgeState;
          return;
        }
      }
      bridgeState.lastFocusedField = "";
      formRoot._surfaceFormHeaderIdentityBridge = bridgeState;
    }, true);
    ["input", "change", "focusout"].forEach(function (eventName) {
      formRoot.addEventListener(eventName, function (event) {
        var target = event && event.target instanceof HTMLElement ? event.target : null;
        var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
        var entries = Array.isArray(bridgeState.entries) ? bridgeState.entries : [];
        if (entries.some(function (entry) { return !!getWatchedFieldName(target, entry.adapter, formRoot); })) {
          scheduleBridgeSync(formRoot);
        }
      }, true);
    });
    formRoot.addEventListener("keydown", function (event) {
      if (!(event && (event.key === "Enter" || event.key === "Tab"))) {
        return;
      }
      var target = event.target instanceof HTMLElement ? event.target : null;
      var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
      var entries = Array.isArray(bridgeState.entries) ? bridgeState.entries : [];
      if (entries.some(function (entry) { return !!getWatchedFieldName(target, entry.adapter, formRoot); })) {
        scheduleBridgeSync(formRoot);
      }
    }, true);
    formRoot.addEventListener("click", function (event) {
      var target = event && event.target instanceof HTMLElement ? event.target : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
      var entries = Array.isArray(bridgeState.entries) ? bridgeState.entries : [];
      if (entries.some(function (entry) { return !!getWatchedFieldName(target, entry.adapter, formRoot); })) {
        scheduleBridgeSync(formRoot);
        return;
      }
      if (bridgeState.lastFocusedField && entries.some(function (entry) { return isBridgeDropdownOption(target, entry.adapter); })) {
        scheduleBridgeSync(formRoot);
      }
    }, true);
    return true;
  }

  function bindManagedHeaderIdentity(formRoot, adapter, controlPanel) {
    if (!(formRoot instanceof HTMLElement)) {
      return false;
    }
    var bridgeState = readObject(formRoot._surfaceFormHeaderIdentityBridge);
    var entries = Array.isArray(bridgeState.entries) ? bridgeState.entries.slice() : [];
    var adapterSignature = buildAdapterSignature(adapter);
    entries = entries.filter(function (entry) {
      return !(
        entry &&
        typeof entry === "object" &&
        entry.signature === adapterSignature
      );
    });
    entries.push({
      signature: adapterSignature,
      adapter: adapter,
      controlPanel: controlPanel,
    });
    bridgeState.entries = entries;
    formRoot._surfaceFormHeaderIdentityBridge = bridgeState;
    installBridgeListeners(formRoot);
    return true;
  }

  function normalizeManagedHeaderIdentityConfigs(rawConfigs) {
    var configs = Array.isArray(rawConfigs)
      ? rawConfigs
      : rawConfigs && typeof rawConfigs === "object"
      ? [rawConfigs]
      : [];
    return configs.filter(function (entry) {
      return entry && typeof entry === "object" && String(entry.enhancerKey || "").trim().toLowerCase() === HEADER_IDENTITY_ENHANCER_KEY.toLowerCase();
    }).map(buildFormHeaderIdentityAdapter);
  }

  function syncManagedFormHeaderIdentities(config, state) {
    if (!(state && state.isForm && state.formRoot instanceof HTMLElement)) {
      return false;
    }
    var adapters = normalizeManagedHeaderIdentityConfigs(config && config.managedFormEnhancers);
    if (!adapters.length) {
      return false;
    }
    adapters.forEach(function (adapter) {
      bindManagedHeaderIdentity(state.formRoot, adapter, state.controlPanel);
      syncFormHeaderIdentitySurface(adapter, {
        formRoot: state.formRoot,
        controlPanel: state.controlPanel,
      });
    });
    return true;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var readFieldText = requireSurfaceLayerFunction(surfaceLayerApi, "readFieldText");
  var registerManagedFormEnhancer = requireSurfaceLayerFunction(surfaceLayerApi, "registerManagedFormEnhancer");
  var syncCanonicalBreadcrumb = requireSurfaceLayerFunction(surfaceLayerApi, "syncCanonicalBreadcrumb");
  var resolveScopedControlPanel = requireSurfaceLayerFunction(surfaceLayerApi, "resolveScopedControlPanel");
  var findVisibleForm = requireSurfaceLayerFunction(surfaceLayerApi, "findVisibleForm");

  Object.assign(surfaceLayerApi, {
    buildFormHeaderIdentityAdapter: buildFormHeaderIdentityAdapter,
    buildFormHeaderIdentityConfig: buildFormHeaderIdentityConfig,
    readFormHeaderIdentityState: readFormHeaderIdentityState,
    syncFormHeaderIdentitySurface: syncFormHeaderIdentitySurface,
    syncManagedFormHeaderIdentities: syncManagedFormHeaderIdentities,
  });

  registerManagedFormEnhancer({
    key: HEADER_IDENTITY_ENHANCER_KEY,
    sync: syncManagedFormHeaderIdentities,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
