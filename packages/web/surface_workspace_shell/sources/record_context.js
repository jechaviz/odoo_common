(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var shared = surfaceLayerApi._shared && typeof surfaceLayerApi._shared === "object"
    ? surfaceLayerApi._shared
    : (surfaceLayerApi._shared = {});
  var RECORD_CONTEXT_PANEL_ENHANCER_KEY = "recordContextPanel";
  var DEFAULT_RECORD_CONTEXT_PANEL_SELECTOR = "[data-surface-record-context-panel='1']";
  var DEFAULT_RECORD_CONTEXT_SLOT_SELECTORS = {
    primaryName: "[data-surface-record-context-primary-name='1']",
    primaryDetails: "[data-surface-record-context-primary-details='1']",
    secondaryName: "[data-surface-record-context-secondary-name='1']",
    secondaryDetails: "[data-surface-record-context-secondary-details='1']",
    identifier: "[data-surface-record-context-identifier='1']",
    reference: "[data-surface-record-context-reference='1']",
    referenceMeta: "[data-surface-record-context-reference-meta='1']",
    condition: "[data-surface-record-context-condition='1']",
    conditionMeta: "[data-surface-record-context-condition-meta='1']",
    note: "[data-surface-record-context-note='1']",
  };
  var DEFAULT_RECORD_CONTEXT_FALLBACKS = {
    primaryName: "Sin relacion principal",
    primaryDetails: "No hay informacion relacionada disponible para este registro.",
    secondaryName: "Sin relacion secundaria",
    secondaryDetails: "No hay una relacion secundaria configurada para este registro.",
    identifier: "-",
    reference: "Sin referencia",
    referenceMeta: "Sin metadata",
    condition: "Sin condicion",
    conditionMeta: "Sin configuracion",
    note: "",
  };
  var RECORD_CONTEXT_SLOT_KEYS = Object.keys(DEFAULT_RECORD_CONTEXT_SLOT_SELECTORS);

  function setPanelNodeText(panelRoot, selector, value, fallback) {
    if (!(panelRoot instanceof HTMLElement)) {
      return;
    }
    var node = panelRoot.querySelector(String(selector || ""));
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var text = String(value || "").replace(/\s+/g, " ").trim() || String(fallback || "").trim() || "-";
    node.textContent = text;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeSlotValue(source, slotKey) {
    if (!(source && typeof source === "object")) {
      return "";
    }
    if (!Object.prototype.hasOwnProperty.call(source, slotKey)) {
      return "";
    }
    var candidate = source[slotKey];
    if (candidate === null || candidate === undefined) {
      return "";
    }
    if (typeof candidate === "string") {
      return normalizeText(candidate);
    }
    if (typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
    return "";
  }

  function buildDefaultRecordContextData() {
    return {
      primaryName: "",
      primaryDetails: "",
      secondaryName: "",
      secondaryDetails: "",
      identifier: "",
      reference: "",
      referenceMeta: "",
      condition: "",
      conditionMeta: "",
      note: "",
    };
  }

  function normalizeRecordContextData(rawData) {
    var source = rawData && typeof rawData === "object" ? rawData : {};
    var normalized = Object.assign({}, buildDefaultRecordContextData(), source);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      normalized[slotKey] = normalizeSlotValue(source, slotKey);
    });
    return normalized;
  }

  function normalizeRecordContextFallbacks(rawFallbacks) {
    var source = rawFallbacks && typeof rawFallbacks === "object" ? rawFallbacks : {};
    var normalized = Object.assign({}, DEFAULT_RECORD_CONTEXT_FALLBACKS);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      var value = normalizeSlotValue(source, slotKey);
      if (value) {
        normalized[slotKey] = value;
      }
    });
    return normalized;
  }

  function normalizeRecordContextSelectors(rawSelectors) {
    var source = rawSelectors && typeof rawSelectors === "object" ? rawSelectors : {};
    var normalized = Object.assign({}, DEFAULT_RECORD_CONTEXT_SLOT_SELECTORS);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      var candidate = normalizeText(source[slotKey]);
      if (candidate) {
        normalized[slotKey] = candidate;
      }
    });
    return normalized;
  }

  function normalizeRecordContextSlotRenderers(rawSlotRenderers) {
    var source = rawSlotRenderers && typeof rawSlotRenderers === "object"
      ? rawSlotRenderers
      : {};
    var normalized = Object.create(null);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      if (typeof source[slotKey] === "function") {
        normalized[slotKey] = source[slotKey];
      }
    });
    return normalized;
  }

  function readRecordContextSignatureParts(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.signaturePartsResolver === "function") {
      try {
        var resolved = settings.signaturePartsResolver(settings);
        return Array.isArray(resolved) ? resolved.slice() : [];
      } catch (_error) {
        return [];
      }
    }
    return [];
  }

  function buildRecordContextSignature(config) {
    var settings = config && typeof config === "object" ? config : {};
    return [String(settings.cacheScopeKey || settings.panelSelector || "surface.recordContextPanel").trim()]
      .concat(readRecordContextSignatureParts(settings).map(normalizeText))
      .join("|");
  }

  async function resolveRecordContextData(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.dataResolver === "function") {
      try {
        var resolved = settings.dataResolver(settings);
        if (resolved && typeof resolved.then === "function") {
          resolved = await resolved;
        }
        return normalizeRecordContextData(resolved);
      } catch (_error) {
        return buildDefaultRecordContextData();
      }
    }
    return buildDefaultRecordContextData();
  }

  async function readRecordContextData(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    var formRoot = settings.formRoot instanceof HTMLElement
      ? settings.formRoot
      : state.formRoot instanceof HTMLElement
      ? state.formRoot
      : null;
    if (!(formRoot instanceof HTMLElement)) {
      return buildDefaultRecordContextData();
    }
    var cacheScopeKey = String(settings.cacheScopeKey || settings.panelSelector || "surface.recordContextPanel").trim();
    if (!shared.recordContextCacheByScope || typeof shared.recordContextCacheByScope !== "object") {
      shared.recordContextCacheByScope = Object.create(null);
    }
    var cacheEntry = shared.recordContextCacheByScope[cacheScopeKey];
    if (!(cacheEntry && typeof cacheEntry === "object")) {
      cacheEntry = {
        signature: "",
        data: null,
        promise: null,
      };
      shared.recordContextCacheByScope[cacheScopeKey] = cacheEntry;
    }
    var signature = buildRecordContextSignature(Object.assign({}, settings, { formRoot: formRoot }));
    if (cacheEntry.signature === signature && cacheEntry.data) {
      return cacheEntry.data;
    }
    if (cacheEntry.signature === signature && cacheEntry.promise) {
      return cacheEntry.promise;
    }
    cacheEntry.signature = signature;
    cacheEntry.promise = (async function () {
      var data = await resolveRecordContextData(Object.assign({}, settings, { formRoot: formRoot }));
      cacheEntry.data = data;
      return data;
    })().finally(function () {
      cacheEntry.promise = null;
    });
    return cacheEntry.promise;
  }

  function buildRecordContextPanelConfig(rawConfig) {
    var raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    var fieldReader = typeof raw.fieldReader === "function"
      ? raw.fieldReader
      : typeof surfaceLayerApi.readFieldText === "function"
      ? surfaceLayerApi.readFieldText
      : function () { return ""; };
    return Object.assign({}, raw, {
      enhancerKey: RECORD_CONTEXT_PANEL_ENHANCER_KEY,
      panelSelector: normalizeText(raw.panelSelector) || DEFAULT_RECORD_CONTEXT_PANEL_SELECTOR,
      fieldReader: fieldReader,
      signaturePartsResolver: typeof raw.signaturePartsResolver === "function"
        ? raw.signaturePartsResolver
        : null,
      dataResolver: typeof raw.dataResolver === "function"
        ? raw.dataResolver
        : null,
      selectors: normalizeRecordContextSelectors(raw.selectors),
      fallbacks: normalizeRecordContextFallbacks(raw.fallbacks),
      slotRenderers: normalizeRecordContextSlotRenderers(raw.slotRenderers),
    });
  }

  function resolveRenderedSlotValue(slotKey, data, settings, fallbacks) {
    var renderer = settings.slotRenderers && typeof settings.slotRenderers === "object"
      ? settings.slotRenderers[slotKey]
      : null;
    if (typeof renderer === "function") {
      return renderer(
        data || buildDefaultRecordContextData(),
        settings,
        fallbacks[slotKey] || DEFAULT_RECORD_CONTEXT_FALLBACKS[slotKey]
      );
    }
    return data && typeof data === "object" ? data[slotKey] : "";
  }

  async function syncRecordContextPanel(config) {
    var settings = buildRecordContextPanelConfig(config);
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    var formRoot = settings.formRoot instanceof HTMLElement
      ? settings.formRoot
      : state.formRoot instanceof HTMLElement
      ? state.formRoot
      : null;
    if (!(formRoot instanceof HTMLElement)) {
      return;
    }
    var panelRoot = formRoot.querySelector(settings.panelSelector);
    if (!(panelRoot instanceof HTMLElement)) {
      return;
    }
    var data = normalizeRecordContextData(
      await readRecordContextData(Object.assign({}, settings, { formRoot: formRoot }))
    );
    var selectors = settings.selectors && typeof settings.selectors === "object"
      ? settings.selectors
      : DEFAULT_RECORD_CONTEXT_SLOT_SELECTORS;
    var fallbacks = settings.fallbacks && typeof settings.fallbacks === "object"
      ? settings.fallbacks
      : DEFAULT_RECORD_CONTEXT_FALLBACKS;

    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      setPanelNodeText(
        panelRoot,
        selectors[slotKey],
        resolveRenderedSlotValue(slotKey, data, settings, fallbacks),
        fallbacks[slotKey] || DEFAULT_RECORD_CONTEXT_FALLBACKS[slotKey]
      );
    });
  }

  function normalizeRecordContextPanelConfigs(rawConfigs) {
    var configs = Array.isArray(rawConfigs)
      ? rawConfigs
      : rawConfigs && typeof rawConfigs === "object"
      ? [rawConfigs]
      : [];
    return configs.filter(function (entry) {
      return entry && typeof entry === "object" && String(entry.enhancerKey || "").trim() === RECORD_CONTEXT_PANEL_ENHANCER_KEY;
    }).map(buildRecordContextPanelConfig).filter(function (entry) {
      return !!String(entry.panelSelector || "").trim();
    });
  }

  async function syncManagedRecordContextPanels(config, state) {
    var contextConfigs = normalizeRecordContextPanelConfigs(
      config && typeof config === "object"
        ? config.managedFormEnhancers
        : null
    );
    if (!contextConfigs.length || !(state && state.isForm && state.formRoot instanceof HTMLElement)) {
      return false;
    }
    for (var index = 0; index < contextConfigs.length; index += 1) {
      await syncRecordContextPanel(
        Object.assign({}, contextConfigs[index], {
          state: state,
          formRoot: state.formRoot,
        })
      );
    }
    return true;
  }

  Object.assign(surfaceLayerApi, {
    buildDefaultRecordContextData: buildDefaultRecordContextData,
    normalizeRecordContextData: normalizeRecordContextData,
    readRecordContextData: readRecordContextData,
    buildRecordContextPanelConfig: buildRecordContextPanelConfig,
    syncRecordContextPanel: syncRecordContextPanel,
    syncManagedRecordContextPanels: syncManagedRecordContextPanels,
  });
  if (typeof surfaceLayerApi.registerManagedFormEnhancer === "function") {
    surfaceLayerApi.registerManagedFormEnhancer({
      key: RECORD_CONTEXT_PANEL_ENHANCER_KEY,
      sync: syncManagedRecordContextPanels,
    });
  }
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
