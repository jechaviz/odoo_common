(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};

  function clearSessionStorageKey(key) {
    var storageKey = String(key || "").trim();
    if (!storageKey) {
      return;
    }
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (_error) {}
  }

  function saveSessionString(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return;
    }
    try {
      window.sessionStorage.setItem(storageKey, String(settings.value || ""));
    } catch (_error) {}
  }

  function loadSessionString(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return "";
    }
    try {
      var rawValue = String(window.sessionStorage.getItem(storageKey) || "");
      if (typeof settings.sanitize === "function") {
        try {
          return String(settings.sanitize(rawValue, settings) || "");
        } catch (_error) {
          return "";
        }
      }
      return rawValue;
    } catch (_error) {
      return "";
    }
  }

  function sanitizeAllowedSessionValue(settings, value) {
    if (typeof settings.sanitize === "function") {
      try {
        return String(settings.sanitize(value, settings) || "");
      } catch (_error) {
        return "";
      }
    }
    if (Array.isArray(settings.allowedValues) && settings.allowedValues.length) {
      var normalized = String(surfaceLayerApi.sanitizeAllowedKey({
        value: value,
        allowedValues: settings.allowedValues,
      }) || "");
      if (normalized) {
        return normalized;
      }
      normalized = String(value || "").trim().toLowerCase();
      return settings.allowedValues.some(function (allowedValue) {
        return String(allowedValue || "").trim().toLowerCase() === normalized;
      })
        ? normalized
        : "";
    }
    return String(value || "").trim();
  }

  function saveAllowedSessionKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return;
    }
    var normalized = sanitizeAllowedSessionValue(settings, settings.value);
    if (!normalized) {
      clearSessionStorageKey(storageKey);
      return;
    }
    saveSessionString({
      key: storageKey,
      value: normalized,
    });
  }

  function loadAllowedSessionKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return "";
    }
    return loadSessionString({
      key: storageKey,
      sanitize: function (rawValue) {
        return sanitizeAllowedSessionValue(settings, rawValue);
      },
    });
  }

  function loadSessionJsonState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    var fallback = settings.fallback && typeof settings.fallback === "object"
      ? Object.assign({}, settings.fallback)
      : {};
    if (!storageKey) {
      return fallback;
    }
    try {
      var rawValue = String(window.sessionStorage.getItem(storageKey) || "").trim();
      if (!rawValue) {
        return fallback;
      }
      var parsed = JSON.parse(rawValue);
      if (!(parsed && typeof parsed === "object")) {
        return fallback;
      }
      if (typeof settings.normalize === "function") {
        try {
          return settings.normalize(parsed, fallback, settings);
        } catch (_error) {
          return fallback;
        }
      }
      return Object.assign({}, fallback, parsed);
    } catch (_error) {
      return fallback;
    }
  }

  function saveSessionJsonState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    var fallback = settings.fallback && typeof settings.fallback === "object"
      ? Object.assign({}, settings.fallback)
      : {};
    var payload = settings.state && typeof settings.state === "object" ? settings.state : {};
    var normalized = typeof settings.normalize === "function"
      ? (function () {
          try {
            return settings.normalize(payload, fallback, settings);
          } catch (_error) {
            return fallback;
          }
        })()
      : Object.assign({}, fallback, payload);
    if (!storageKey) {
      return normalized;
    }
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(normalized));
    } catch (_error) {}
    if (typeof settings.onSave === "function") {
      try {
        settings.onSave(normalized, settings);
      } catch (_error) {}
    }
    return normalized;
  }

  function buildRecentYearMonthOptions(config) {
    var settings = config && typeof config === "object" ? config : {};
    var locale = String(settings.locale || "es-MX").trim() || "es-MX";
    var emptyLabel = String(settings.emptyLabel || "Todo periodo").trim() || "Todo periodo";
    var maxMonths = Math.max(Number.parseInt(String(settings.maxMonths || settings.months || 6), 10) || 0, 0);
    var today = settings.now instanceof Date ? settings.now : new Date();
    var formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    });
    var options = [{ value: "", label: emptyLabel }];
    for (var offset = 0; offset < maxMonths; offset += 1) {
      var date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      var value =
        String(date.getFullYear()).padStart(4, "0") +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0");
      options.push({
        value: value,
        label: formatter.format(date),
      });
    }
    return options;
  }

  function resolveRecentYearMonthLabel(config) {
    var settings = config && typeof config === "object" ? config : {};
    var sanitizeYearMonthKey = function (value) {
      return /^\d{4}-\d{2}$/.test(String(value || "").trim()) ? String(value || "").trim() : "";
    };
    var normalized = sanitizeYearMonthKey(settings.monthKey);
    if (!normalized) {
      return "";
    }
    var options = Array.isArray(settings.options) ? settings.options : buildRecentYearMonthOptions(settings);
    var match = options.find(function (entry) {
      return String(entry && entry.value || "").trim() === normalized;
    });
    return match ? String(match.label || "").trim() : normalized;
  }

  function resolveActionMappedSelection(config) {
    var settings = config && typeof config === "object" ? config : {};
    var currentActionId = Number.parseInt(
      String(
        settings.currentActionId ||
        surfaceLayerApi.readCurrentActionId() ||
        0
      ),
      10
    ) || 0;
    if (!(currentActionId > 0)) {
      return "";
    }
    var entries = Array.isArray(settings.entries) ? settings.entries : [];
    var valueKey = String(settings.valueKey || "key").trim() || "key";
    var actionKeys = Array.isArray(settings.actionKeys)
      ? settings.actionKeys
      : [String(settings.actionKey || "actionId").trim() || "actionId"];
    var match = entries.find(function (entry) {
      return actionKeys.some(function (actionKey) {
        return Number.parseInt(String(entry && entry[actionKey] || 0), 10) === currentActionId;
      });
    });
    return match ? String(match[valueKey] || "").trim() : "";
  }

  function loadActionBackedAllowedSessionKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var entries = Array.isArray(settings.entries) ? settings.entries : [];
    var valueKey = String(settings.valueKey || "key").trim() || "key";
    var allowedValues = Array.isArray(settings.allowedValues) && settings.allowedValues.length
      ? settings.allowedValues
      : entries.map(function (entry) {
          return String(entry && entry[valueKey] || "").trim();
        }).filter(Boolean);
    var actionValue = resolveActionMappedSelection(settings);
    if (actionValue) {
      return sanitizeAllowedSessionValue(
        Object.assign({}, settings, {
          allowedValues: allowedValues,
        }),
        actionValue
      );
    }
    return loadAllowedSessionKey(
      Object.assign({}, settings, {
        allowedValues: allowedValues,
      })
    );
  }

  function buildActionBackedSelectionController(config) {
    var settings = config && typeof config === "object" ? config : {};
    var entries = Array.isArray(settings.entries) ? settings.entries.slice() : [];
    var valueKey = String(settings.valueKey || "key").trim() || "key";
    var actionKeys = Array.isArray(settings.actionKeys) && settings.actionKeys.length
      ? settings.actionKeys.map(function (actionKey) {
          return String(actionKey || "").trim();
        }).filter(Boolean)
      : [String(settings.actionKey || "actionId").trim() || "actionId"];
    var allowedValues = entries.map(function (entry) {
      return String(entry && entry[valueKey] || "").trim();
    }).filter(Boolean);
    var fallbackValue = sanitizeAllowedSessionValue(
      { allowedValues: allowedValues },
      settings.fallbackValue || allowedValues[0] || ""
    );
    var tabSelector = String(settings.tabSelector || "[data-surface-tab='1']").trim() || "[data-surface-tab='1']";

    function findEntry(value) {
      var normalized = sanitizeAllowedSessionValue(
        { allowedValues: allowedValues },
        value
      );
      if (!normalized) {
        return null;
      }
      return entries.find(function (entry) {
        return String(entry && entry[valueKey] || "").trim() === normalized;
      }) || null;
    }

    function resolveEntryActionId(entry) {
      var matchedActionId = 0;
      if (!(entry && typeof entry === "object")) {
        return matchedActionId;
      }
      actionKeys.some(function (actionKey) {
        var nextActionId = Number.parseInt(String(entry[actionKey] || 0), 10) || 0;
        if (nextActionId > 0) {
          matchedActionId = nextActionId;
          return true;
        }
        return false;
      });
      return matchedActionId;
    }

    function getEntry(value) {
      return findEntry(value) || findEntry(fallbackValue) || entries[0] || null;
    }

    function readFromAction() {
      return resolveActionMappedSelection({
        entries: entries,
        valueKey: valueKey,
        actionKeys: actionKeys,
        currentActionId: settings.currentActionId,
      });
    }

    function read() {
      var selectedValue = loadActionBackedAllowedSessionKey({
        key: settings.key,
        entries: entries,
        valueKey: valueKey,
        actionKeys: actionKeys,
        currentActionId: settings.currentActionId,
        allowedValues: allowedValues,
      }) || fallbackValue;
      var entry = getEntry(selectedValue);
      return entry ? String(entry[valueKey] || "").trim() : fallbackValue;
    }

    function write(value) {
      var entry = getEntry(value);
      var normalized = entry ? String(entry[valueKey] || "").trim() : fallbackValue;
      saveAllowedSessionKey({
        key: settings.key,
        value: normalized,
        allowedValues: allowedValues,
      });
      return normalized;
    }

    function readToolbarTabValue(target) {
      if (!(target instanceof HTMLElement)) {
        return "";
      }
      return sanitizeAllowedSessionValue(
        { allowedValues: allowedValues },
        target.getAttribute("data-surface-tab-key") || target.dataset.surfaceTabKey || ""
      );
    }

    function getActionId(value) {
      return resolveEntryActionId(findEntry(value));
    }

    function buildActionRequest(value, rawConfig) {
      var interaction = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
      var entry = findEntry(value);
      var normalized = entry ? String(entry[valueKey] || "").trim() : "";
      if (!(entry && normalized)) {
        return null;
      }
      if (typeof settings.buildActionRequest === "function") {
        try {
          return settings.buildActionRequest(entry, normalized, interaction, settings) || null;
        } catch (_error) {
          return null;
        }
      }
      var actionId = resolveEntryActionId(entry);
      return actionId > 0 ? actionId : null;
    }

    function handleToolbarInteraction(rawConfig) {
      var interaction = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
      var target = interaction.target instanceof HTMLElement ? interaction.target : null;
      var event = interaction.event || null;
      if (!(target instanceof HTMLElement) || !event || !target.matches(tabSelector)) {
        return false;
      }
      if (event.type !== "click") {
        return true;
      }
      event.preventDefault();
      var selectedValue = readToolbarTabValue(target);
      if (!selectedValue) {
        return true;
      }
      var normalized = write(selectedValue);
      var actionRequest = buildActionRequest(normalized, interaction);
      if (actionRequest != null && typeof interaction.performAction === "function") {
        var nextAction = interaction.performAction(actionRequest);
        if (nextAction && typeof nextAction.catch === "function") {
          nextAction.catch(function () {});
        }
      }
      return true;
    }

    return {
      entries: entries.slice(),
      valueKey: valueKey,
      actionKeys: actionKeys.slice(),
      fallbackValue: fallbackValue,
      getEntry: getEntry,
      readFromAction: readFromAction,
      read: read,
      write: write,
      getActionId: getActionId,
      buildActionRequest: buildActionRequest,
      handleToolbarInteraction: handleToolbarInteraction,
      getAllowedValues: function () {
        return allowedValues.slice();
      },
    };
  }

  function buildActionBackedToolbarSelectionController(config) {
    return buildActionBackedSelectionController(config);
  }

  function buildWorkspaceToolbarInteractionHandler(config) {
    var settings = config && typeof config === "object" ? config : {};
    var controller = settings.controller && typeof settings.controller === "object"
      ? settings.controller
      : null;
    if (!(controller && typeof controller.handleToolbarInteraction === "function")) {
      throw new Error("buildWorkspaceToolbarInteractionHandler requires a controller with handleToolbarInteraction.");
    }
    if (typeof settings.buildAction !== "function") {
      throw new Error("buildWorkspaceToolbarInteractionHandler requires buildAction.");
    }
    return function handleWorkspaceToolbarInteraction(rawConfig) {
      var interaction = Object.assign({}, rawConfig && typeof rawConfig === "object" ? rawConfig : {});
      interaction.controller = controller;
      interaction.buildAction = function (nextState, nextInteraction) {
        try {
          return settings.buildAction(
            nextState,
            nextInteraction && typeof nextInteraction === "object" ? nextInteraction : interaction,
            controller,
            settings
          );
        } catch (_error) {
          return null;
        }
      };
      return controller.handleToolbarInteraction(interaction) === true;
    };
  }

  function buildTabbedMonthListStateController(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    var monthConfig = settings.monthConfig && typeof settings.monthConfig === "object"
      ? Object.assign({}, settings.monthConfig)
      : {};

    function normalizeTab(value) {
      if (typeof settings.resolveTab === "function") {
        try {
          return String(settings.resolveTab(value, settings) || "").trim();
        } catch (_error) {
          return "";
        }
      }
      return String(value || "").trim();
    }

    function sanitizeMonth(value) {
      if (typeof surfaceLayerApi.sanitizeYearMonthKey === "function") {
        return String(surfaceLayerApi.sanitizeYearMonthKey(value) || "").trim();
      }
      return /^\d{4}-\d{2}$/.test(String(value || "").trim()) ? String(value || "").trim() : "";
    }

    function readTabFromAction() {
      if (typeof settings.readTabFromAction === "function") {
        try {
          return normalizeTab(settings.readTabFromAction(settings) || "");
        } catch (_error) {
          return "";
        }
      }
      return "";
    }

    function buildFallbackState(applyActionTab) {
      var fallbackState = settings.fallbackState && typeof settings.fallbackState === "object"
        ? Object.assign({}, settings.fallbackState)
        : {
            tab: settings.fallbackTab,
            month: settings.fallbackMonth,
          };
      fallbackState.tab = normalizeTab(fallbackState.tab);
      fallbackState.month = sanitizeMonth(fallbackState.month);
      var actionTab = applyActionTab !== false ? readTabFromAction() : "";
      if (actionTab) {
        fallbackState.tab = actionTab;
      }
      return {
        tab: fallbackState.tab,
        month: fallbackState.month,
      };
    }

    function normalizeState(state, fallbackState, options) {
      var nextFallback = fallbackState && typeof fallbackState === "object"
        ? Object.assign({}, fallbackState)
        : buildFallbackState(options && options.applyActionTab !== false);
      var actionTab = options && options.applyActionTab !== false ? readTabFromAction() : "";
      return {
        tab: normalizeTab(actionTab || (state && state.tab)) || nextFallback.tab,
        month: sanitizeMonth(state && state.month),
      };
    }

    function read() {
      var fallbackState = buildFallbackState(true);
      return loadSessionJsonState({
        key: storageKey,
        fallback: fallbackState,
        normalize: function (parsed, normalizedFallback) {
          return normalizeState(parsed, normalizedFallback, { applyActionTab: true });
        },
      });
    }

    function readPersisted() {
      var fallbackState = buildFallbackState(false);
      return loadSessionJsonState({
        key: storageKey,
        fallback: fallbackState,
        normalize: function (parsed, normalizedFallback) {
          return normalizeState(parsed, normalizedFallback, { applyActionTab: false });
        },
      });
    }

    function write(nextState) {
      var fallbackState = buildFallbackState(false);
      return saveSessionJsonState({
        key: storageKey,
        fallback: fallbackState,
        state: nextState,
        normalize: function (parsed, normalizedFallback) {
          return normalizeState(parsed, normalizedFallback, { applyActionTab: false });
        },
        onSave: function (normalizedState) {
          if (typeof settings.onWriteTab === "function") {
            try {
              settings.onWriteTab(normalizedState.tab, settings);
            } catch (_error) {}
          }
        },
      });
    }

    function update(patch) {
      var currentState = readPersisted();
      var nextPatch = patch && typeof patch === "object" ? patch : {};
      return write(Object.assign({}, currentState, nextPatch));
    }

    function readTab() {
      return String(readPersisted().tab || "").trim();
    }

    function readMonth() {
      return String(readPersisted().month || "").trim();
    }

    function writeMonth(monthKey) {
      return update({ month: monthKey });
    }

    function buildMonthOptions() {
      return buildRecentYearMonthOptions(monthConfig);
    }

    function getMonthLabel(monthKey) {
      return resolveRecentYearMonthLabel(
        Object.assign({}, monthConfig, {
          monthKey: sanitizeMonth(monthKey),
        })
      );
    }

    function handleToolbarInteraction(rawConfig) {
      var interaction = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
      var target = interaction.target instanceof HTMLElement ? interaction.target : null;
      var event = interaction.event || null;
      if (!(target instanceof HTMLElement) || !event) {
        return false;
      }
      if (target.matches("[data-surface-tab='1']")) {
        if (event.type !== "click") {
          return true;
        }
        event.preventDefault();
        var nextTabState = read();
        nextTabState.tab = normalizeTab(
          target.getAttribute("data-surface-tab-key") ||
          target.dataset.surfaceTabKey ||
          target.getAttribute("data-surface-tab")
        ) || nextTabState.tab;
        nextTabState = write(nextTabState);
        if (typeof interaction.buildAction === "function" && typeof interaction.performAction === "function") {
          var nextTabAction = interaction.performAction(interaction.buildAction(nextTabState, interaction));
          if (nextTabAction && typeof nextTabAction.catch === "function") {
            nextTabAction.catch(function () {});
          }
        }
        return true;
      }
      if (target.matches("select[data-surface-filter='month']")) {
        if (event.type !== "change") {
          return true;
        }
        var nextMonthState = read();
        nextMonthState.month = sanitizeMonth(target.value);
        nextMonthState = write(nextMonthState);
        if (typeof interaction.buildAction === "function" && typeof interaction.performAction === "function") {
          var nextMonthAction = interaction.performAction(interaction.buildAction(nextMonthState, interaction));
          if (nextMonthAction && typeof nextMonthAction.catch === "function") {
            nextMonthAction.catch(function () {});
          }
        }
        return true;
      }
      return false;
    }

    return {
      key: storageKey,
      monthConfig: Object.assign({}, monthConfig),
      read: read,
      readPersisted: readPersisted,
      write: write,
      update: update,
      readTab: readTab,
      readMonth: readMonth,
      writeMonth: writeMonth,
      normalizeTab: normalizeTab,
      sanitizeMonth: sanitizeMonth,
      readTabFromAction: readTabFromAction,
      buildFallbackState: buildFallbackState,
      buildMonthOptions: buildMonthOptions,
      getMonthLabel: getMonthLabel,
      handleToolbarInteraction: handleToolbarInteraction,
    };
  }

  function saveTimedSessionPayload(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return;
    }
    var payload = settings.payload && typeof settings.payload === "object" ? settings.payload : {};
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify(Object.assign({}, payload, { savedAt: Date.now() }))
      );
    } catch (_error) {}
  }

  function readTimedSessionPayload(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.key || "").trim();
    if (!storageKey) {
      return null;
    }
    try {
      var rawValue = window.sessionStorage.getItem(storageKey);
      if (!rawValue) {
        return null;
      }
      var payload = JSON.parse(rawValue);
      var savedAt = Number(payload && payload.savedAt || 0) || 0;
      if (!savedAt || Date.now() - savedAt > Math.max(Number(settings.maxAgeMs || 0) || 0, 0)) {
        if (settings.clearOnInvalid !== false) {
          clearSessionStorageKey(storageKey);
        }
        return null;
      }
      if (typeof settings.validate === "function") {
        try {
          if (!settings.validate(payload, settings)) {
            if (settings.clearOnInvalid !== false) {
              clearSessionStorageKey(storageKey);
            }
            return null;
          }
        } catch (_error) {
          if (settings.clearOnInvalid !== false) {
            clearSessionStorageKey(storageKey);
          }
          return null;
        }
      }
      return payload && typeof payload === "object" ? payload : null;
    } catch (_error) {
      return null;
    }
  }

  function captureInitialQueryState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var href = String(surfaceLayerApi.getInitialDocumentHref() || "").trim();
    var url = null;
    try {
      url = new URL(href || window.location.href, window.location.origin);
    } catch (_error) {
      return null;
    }
    if (typeof settings.isPathAllowed === "function") {
      try {
        if (!settings.isPathAllowed(url.pathname, url, settings)) {
          return null;
        }
      } catch (_error) {
        return null;
      }
    }
    var state = null;
    if (typeof settings.readState === "function") {
      try {
        state = settings.readState(href, url, settings);
      } catch (_error) {
        state = null;
      }
    }
    if (!(state && typeof state === "object")) {
      return null;
    }
    if (typeof settings.shouldCapture === "function") {
      try {
        if (!settings.shouldCapture(state, url, settings)) {
          return null;
        }
      } catch (_error) {
        return null;
      }
    }
    if (typeof settings.onCapture === "function") {
      try {
        settings.onCapture(state, url, settings);
      } catch (_error) {}
    }
    return state;
  }

  Object.assign(surfaceLayerApi, {
    clearSessionStorageKey: clearSessionStorageKey,
    saveSessionString: saveSessionString,
    loadSessionString: loadSessionString,
    saveAllowedSessionKey: saveAllowedSessionKey,
    loadAllowedSessionKey: loadAllowedSessionKey,
    loadSessionJsonState: loadSessionJsonState,
    saveSessionJsonState: saveSessionJsonState,
    buildRecentYearMonthOptions: buildRecentYearMonthOptions,
    resolveRecentYearMonthLabel: resolveRecentYearMonthLabel,
    resolveActionMappedSelection: resolveActionMappedSelection,
    loadActionBackedAllowedSessionKey: loadActionBackedAllowedSessionKey,
    buildActionBackedSelectionController: buildActionBackedSelectionController,
    buildActionBackedToolbarSelectionController: buildActionBackedToolbarSelectionController,
    buildWorkspaceToolbarInteractionHandler: buildWorkspaceToolbarInteractionHandler,
    buildTabbedMonthListStateController: buildTabbedMonthListStateController,
    saveTimedSessionPayload: saveTimedSessionPayload,
    readTimedSessionPayload: readTimedSessionPayload,
    captureInitialQueryState: captureInitialQueryState,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
