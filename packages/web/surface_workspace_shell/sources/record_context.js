(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    var api = window.OdooSurfaceLayers;
    if (!(api && typeof api === "object")) {
      throw new Error("OdooSurfaceLayers runtime is required before record_context.js.");
    }
    return api;
  }

  function requireSharedRegistry(api) {
    if (!(api._shared && typeof api._shared === "object")) {
      throw new Error("OdooSurfaceLayers._shared is required by record_context.js.");
    }
    return api._shared;
  }

  function requireSurfaceLayerMethod(api, methodName) {
    var method = api && api[methodName];
    if (typeof method !== "function") {
      throw new Error("OdooSurfaceLayers." + methodName + " is required by record_context.js.");
    }
    return method;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var shared = requireSharedRegistry(surfaceLayerApi);
  var readFieldText = requireSurfaceLayerMethod(surfaceLayerApi, "readFieldText");
  var registerManagedFormEnhancer = requireSurfaceLayerMethod(surfaceLayerApi, "registerManagedFormEnhancer");
  var RECORD_CONTEXT_PANEL_ENHANCER_KEY = "recordContextPanel";
  var RECORD_CONTEXT_SOURCE_MARKER = "__surfaceRecordContextSource";
  var DEFAULT_RECORD_CONTEXT_PANEL_SELECTOR = "[data-surface-record-context-panel='1']";
  var DEFAULT_RECORD_CONTEXT_SLOT_DEFINITIONS = {
    primaryName: {
      selector: "[data-surface-record-context-primary-name='1']",
      fallback: "Sin relacion principal",
    },
    primaryDetails: {
      selector: "[data-surface-record-context-primary-details='1']",
      fallback: "No hay informacion relacionada disponible para este registro.",
    },
    secondaryName: {
      selector: "[data-surface-record-context-secondary-name='1']",
      fallback: "Sin relacion secundaria",
    },
    secondaryDetails: {
      selector: "[data-surface-record-context-secondary-details='1']",
      fallback: "No hay una relacion secundaria configurada para este registro.",
    },
    identifier: {
      selector: "[data-surface-record-context-identifier='1']",
      fallback: "-",
    },
    reference: {
      selector: "[data-surface-record-context-reference='1']",
      fallback: "Sin referencia",
    },
    referenceMeta: {
      selector: "[data-surface-record-context-reference-meta='1']",
      fallback: "Sin metadata",
    },
    condition: {
      selector: "[data-surface-record-context-condition='1']",
      fallback: "Sin condicion",
    },
    conditionMeta: {
      selector: "[data-surface-record-context-condition-meta='1']",
      fallback: "Sin configuracion",
    },
    note: {
      selector: "[data-surface-record-context-note='1']",
      fallback: "",
    },
  };
  var RECORD_CONTEXT_SLOT_KEYS = Object.keys(DEFAULT_RECORD_CONTEXT_SLOT_DEFINITIONS);

  function setPanelNodeText(panelRoot, selector, value, fallback) {
    if (!(panelRoot instanceof HTMLElement)) {
      return;
    }
    var node = panelRoot.querySelector(String(selector || ""));
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var text = normalizeText(value) || normalizeText(fallback) || "-";
    node.textContent = text;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeScalarText(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return normalizeText(value);
  }

  function normalizeFieldNameList(values) {
    var normalized = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var fieldName = normalizeText(value);
      if (fieldName && normalized.indexOf(fieldName) === -1) {
        normalized.push(fieldName);
      }
    });
    return normalized;
  }

  function normalizeRecordContextRecordId(value) {
    return Number.parseInt(String(value || 0), 10) || 0;
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

  function normalizeSlotValue(source, slotKey) {
    if (!(source && typeof source === "object")) {
      return "";
    }
    if (!Object.prototype.hasOwnProperty.call(source, slotKey)) {
      return "";
    }
    return normalizeScalarText(source[slotKey]);
  }

  function normalizeRecordContextData(rawData) {
    var source = rawData && typeof rawData === "object" ? rawData : {};
    var normalized = Object.assign({}, buildDefaultRecordContextData(), source);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      normalized[slotKey] = normalizeSlotValue(source, slotKey);
    });
    return normalized;
  }

  function buildDefaultRecordContextSlots() {
    var normalized = Object.create(null);
    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      var defaults = DEFAULT_RECORD_CONTEXT_SLOT_DEFINITIONS[slotKey];
      normalized[slotKey] = {
        key: slotKey,
        selector: defaults.selector,
        fallback: defaults.fallback,
        valueKey: slotKey,
        render: null,
      };
    });
    return normalized;
  }

  function normalizeRecordContextSlots(rawSlots) {
    var slotSource = rawSlots && typeof rawSlots === "object" ? rawSlots : {};
    var normalized = buildDefaultRecordContextSlots();

    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      var defaults = DEFAULT_RECORD_CONTEXT_SLOT_DEFINITIONS[slotKey];
      var slot = slotSource[slotKey] && typeof slotSource[slotKey] === "object"
        ? slotSource[slotKey]
        : {};
      var selector = normalizeText(slot.selector);
      var fallback = normalizeScalarText(slot.fallback);
      var valueKey = normalizeText(slot.valueKey || slot.dataKey);
      var render = typeof slot.render === "function" ? slot.render : null;

      normalized[slotKey] = {
        key: slotKey,
        selector: selector || defaults.selector,
        fallback: fallback || defaults.fallback,
        valueKey: valueKey || slotKey,
        render: render,
      };
    });

    return normalized;
  }

  function normalizeRecordContextWatch(rawWatch) {
    if (Array.isArray(rawWatch)) {
      rawWatch = { fields: rawWatch };
    } else if (typeof rawWatch === "function") {
      rawWatch = { partsResolver: rawWatch };
    }
    var source = rawWatch && typeof rawWatch === "object" ? rawWatch : {};
    var values = [];
    (Array.isArray(source.values) ? source.values : []).forEach(function (entry) {
      if (entry !== null && entry !== undefined) {
        values.push(entry);
      }
    });
    return {
      recordId: source.recordId === true || typeof source.recordId === "function"
        ? source.recordId
        : false,
      fields: normalizeFieldNameList(source.fields || source.fieldNames),
      values: values,
      partsResolver: typeof source.partsResolver === "function" ? source.partsResolver : null,
    };
  }

  function buildRecordContextSource(rawSource) {
    if (rawSource && rawSource[RECORD_CONTEXT_SOURCE_MARKER] === true) {
      return rawSource;
    }
    var raw = rawSource && typeof rawSource === "object" ? rawSource : {};
    var source = {
      cacheScopeKey: normalizeText(raw.cacheScopeKey || raw.scopeKey),
      recordIdResolver: typeof raw.recordIdResolver === "function" ? raw.recordIdResolver : null,
      watch: normalizeRecordContextWatch(raw.watch),
      signaturePartsResolver: typeof raw.signaturePartsResolver === "function" ? raw.signaturePartsResolver : null,
      load: typeof raw.load === "function" ? raw.load : null,
    };
    source[RECORD_CONTEXT_SOURCE_MARKER] = true;
    return source;
  }

  function resolveRecordContextFormRoot(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    return settings.formRoot instanceof HTMLElement
      ? settings.formRoot
      : state.formRoot instanceof HTMLElement
      ? state.formRoot
      : null;
  }

  function resolveRecordContextCacheScopeKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var source = settings.source && typeof settings.source === "object" ? settings.source : {};
    return normalizeText(settings.cacheScopeKey || source.cacheScopeKey || settings.panelSelector || "surface.recordContextPanel")
      || "surface.recordContextPanel";
  }

  function buildRecordContextRuntimeContext(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    var formRoot = resolveRecordContextFormRoot(settings);
    var fieldReader = typeof settings.fieldReader === "function"
      ? settings.fieldReader
      : readFieldText;
    var source = settings.source && typeof settings.source === "object"
      ? settings.source
      : buildRecordContextSource({});
    var runtimeContext = {
      config: settings,
      settings: settings,
      state: state,
      formRoot: formRoot,
      fieldReader: fieldReader,
      source: source,
      readField: function (names) {
        return fieldReader(formRoot, Array.isArray(names) ? names : [names]);
      },
      readFields: function (names) {
        return normalizeFieldNameList(names).map(function (fieldName) {
          return {
            name: fieldName,
            value: fieldReader(formRoot, [fieldName]),
          };
        });
      },
    };
    runtimeContext.recordId = resolveRecordContextRuntimeRecordId(runtimeContext);
    return runtimeContext;
  }

  function resolveRecordContextRuntimeRecordId(runtimeContext) {
    var context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
    var settings = context.settings && typeof context.settings === "object" ? context.settings : {};
    var source = context.source && typeof context.source === "object" ? context.source : {};
    var watch = source.watch && typeof source.watch === "object" ? source.watch : {};
    var resolver = typeof source.recordIdResolver === "function"
      ? source.recordIdResolver
      : typeof watch.recordId === "function"
      ? watch.recordId
      : typeof settings.recordIdResolver === "function"
      ? settings.recordIdResolver
      : null;
    if (typeof resolver === "function") {
      try {
        return normalizeRecordContextRecordId(resolver(context));
      } catch (_error) {
        return 0;
      }
    }
    return normalizeRecordContextRecordId(context.state && context.state.recordId);
  }

  function normalizeRecordContextSignaturePart(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return normalizeText(value);
  }

  function appendRecordContextSignatureParts(target, value) {
    if (!Array.isArray(target)) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (entry) {
        appendRecordContextSignatureParts(target, entry);
      });
      return;
    }
    var normalized = normalizeRecordContextSignaturePart(value);
    if (normalized) {
      target.push(normalized);
    }
  }

  function resolveRecordContextWatchValue(entry, runtimeContext) {
    if (typeof entry === "function") {
      try {
        return entry(runtimeContext);
      } catch (_error) {
        return "";
      }
    }
    if (typeof entry === "string") {
      return runtimeContext.readField(entry);
    }
    return entry;
  }

  function readRecordContextSignatureParts(config) {
    var settings = config && typeof config === "object" ? config : {};
    var source = settings.source && typeof settings.source === "object"
      ? settings.source
      : buildRecordContextSource({});
    var runtimeContext = buildRecordContextRuntimeContext(settings);
    var signatureParts = [];

    if (typeof source.signaturePartsResolver === "function") {
      try {
        appendRecordContextSignatureParts(signatureParts, source.signaturePartsResolver(runtimeContext));
      } catch (_error) {}
      return signatureParts;
    }

    if (source.watch && source.watch.recordId) {
      appendRecordContextSignatureParts(signatureParts, runtimeContext.recordId);
    }
    (source.watch && Array.isArray(source.watch.fields) ? source.watch.fields : []).forEach(function (fieldName) {
      appendRecordContextSignatureParts(signatureParts, runtimeContext.readField(fieldName));
    });
    (source.watch && Array.isArray(source.watch.values) ? source.watch.values : []).forEach(function (entry) {
      appendRecordContextSignatureParts(signatureParts, resolveRecordContextWatchValue(entry, runtimeContext));
    });
    if (source.watch && typeof source.watch.partsResolver === "function") {
      try {
        appendRecordContextSignatureParts(signatureParts, source.watch.partsResolver(runtimeContext));
      } catch (_error) {}
    }
    return signatureParts;
  }

  function buildRecordContextSignature(config) {
    var settings = config && typeof config === "object" ? config : {};
    return [resolveRecordContextCacheScopeKey(settings)]
      .concat(readRecordContextSignatureParts(settings))
      .join("|");
  }

  async function resolveRecordContextData(config) {
    var settings = config && typeof config === "object" ? config : {};
    var source = settings.source && typeof settings.source === "object"
      ? settings.source
      : buildRecordContextSource({});
    if (typeof source.load === "function") {
      try {
        var resolved = source.load(buildRecordContextRuntimeContext(settings));
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
    var formRoot = resolveRecordContextFormRoot(settings);
    if (!(formRoot instanceof HTMLElement)) {
      return buildDefaultRecordContextData();
    }
    var cacheScopeKey = resolveRecordContextCacheScopeKey(settings);
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
      : readFieldText;
    var rawSource = raw.source && typeof raw.source === "object" ? raw.source : {};
    var source = buildRecordContextSource(
      rawSource[RECORD_CONTEXT_SOURCE_MARKER] === true
        ? Object.assign({}, rawSource, {
            cacheScopeKey: rawSource.cacheScopeKey || raw.cacheScopeKey,
            recordIdResolver: typeof rawSource.recordIdResolver === "function"
              ? rawSource.recordIdResolver
              : raw.recordIdResolver,
          })
        : Object.assign({}, rawSource, {
            cacheScopeKey: rawSource.cacheScopeKey ? rawSource.cacheScopeKey : raw.cacheScopeKey,
            recordIdResolver: typeof rawSource.recordIdResolver === "function"
              ? rawSource.recordIdResolver
              : raw.recordIdResolver,
          })
    );
    var slots = normalizeRecordContextSlots(raw.slots);

    return Object.assign({}, raw, {
      enhancerKey: RECORD_CONTEXT_PANEL_ENHANCER_KEY,
      panelSelector: normalizeText(raw.panelSelector) || DEFAULT_RECORD_CONTEXT_PANEL_SELECTOR,
      fieldReader: fieldReader,
      cacheScopeKey: resolveRecordContextCacheScopeKey({
        panelSelector: raw.panelSelector,
        cacheScopeKey: raw.cacheScopeKey,
        source: source,
      }),
      recordIdResolver: source.recordIdResolver,
      source: source,
      slots: slots,
    });
  }

  function resolveRenderedSlotValue(slotKey, data, settings) {
    var slots = settings.slots && typeof settings.slots === "object"
      ? settings.slots
      : buildDefaultRecordContextSlots();
    var slot = slots[slotKey] && typeof slots[slotKey] === "object"
      ? slots[slotKey]
      : buildDefaultRecordContextSlots()[slotKey];
    var fallback = normalizeScalarText(slot && slot.fallback)
      || DEFAULT_RECORD_CONTEXT_SLOT_DEFINITIONS[slotKey].fallback;
    var runtimeContext = buildRecordContextRuntimeContext(settings);
    if (slot && typeof slot.render === "function") {
      return slot.render(
        data || buildDefaultRecordContextData(),
        runtimeContext,
        fallback
      );
    }
    var valueKey = normalizeText(slot && slot.valueKey) || slotKey;
    return data && typeof data === "object" ? data[valueKey] : "";
  }

  async function syncRecordContextPanel(config) {
    var settings = buildRecordContextPanelConfig(config);
    var formRoot = resolveRecordContextFormRoot(settings);
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
    var slots = settings.slots && typeof settings.slots === "object"
      ? settings.slots
      : buildDefaultRecordContextSlots();

    RECORD_CONTEXT_SLOT_KEYS.forEach(function (slotKey) {
      var slot = slots[slotKey] && typeof slots[slotKey] === "object"
        ? slots[slotKey]
        : buildDefaultRecordContextSlots()[slotKey];
      setPanelNodeText(
        panelRoot,
        slot.selector,
        resolveRenderedSlotValue(slotKey, data, settings),
        slot.fallback
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
    buildDefaultRecordContextSlots: buildDefaultRecordContextSlots,
    normalizeRecordContextData: normalizeRecordContextData,
    normalizeRecordContextSlots: normalizeRecordContextSlots,
    buildRecordContextSource: buildRecordContextSource,
    buildRecordContextRuntimeContext: buildRecordContextRuntimeContext,
    buildRecordContextSignature: buildRecordContextSignature,
    readRecordContextData: readRecordContextData,
    buildRecordContextPanelConfig: buildRecordContextPanelConfig,
    syncRecordContextPanel: syncRecordContextPanel,
    syncManagedRecordContextPanels: syncManagedRecordContextPanels,
  });
  registerManagedFormEnhancer({
    key: RECORD_CONTEXT_PANEL_ENHANCER_KEY,
    sync: syncManagedRecordContextPanels,
  });
})();
