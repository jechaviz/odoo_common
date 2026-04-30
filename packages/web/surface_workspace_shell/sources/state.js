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
      if (typeof surfaceLayerApi.sanitizeAllowedKey === "function") {
        return String(surfaceLayerApi.sanitizeAllowedKey({
          value: value,
          allowedValues: settings.allowedValues,
        }) || "");
      }
      var normalized = String(value || "").trim().toLowerCase();
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
    var sanitizeYearMonthKey = typeof surfaceLayerApi.sanitizeYearMonthKey === "function"
      ? surfaceLayerApi.sanitizeYearMonthKey
      : function (value) {
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
        (typeof surfaceLayerApi.readCurrentActionId === "function" ? surfaceLayerApi.readCurrentActionId() : 0) ||
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

    function getEntry(value) {
      var normalized = sanitizeAllowedSessionValue(
        { allowedValues: allowedValues },
        value
      ) || fallbackValue;
      return entries.find(function (entry) {
        return String(entry && entry[valueKey] || "").trim() === normalized;
      }) || entries[0] || null;
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

    return {
      entries: entries.slice(),
      valueKey: valueKey,
      actionKeys: actionKeys.slice(),
      fallbackValue: fallbackValue,
      getEntry: getEntry,
      readFromAction: readFromAction,
      read: read,
      write: write,
      getAllowedValues: function () {
        return allowedValues.slice();
      },
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
    var href =
      typeof surfaceLayerApi.getInitialDocumentHref === "function"
        ? String(surfaceLayerApi.getInitialDocumentHref() || "").trim()
        : String(window.location.href || "").trim();
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
    saveTimedSessionPayload: saveTimedSessionPayload,
    readTimedSessionPayload: readTimedSessionPayload,
    captureInitialQueryState: captureInitialQueryState,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
