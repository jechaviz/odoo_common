(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function uniqueStrings(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var normalized = String(value || "").trim();
      if (!normalized || seen[normalized]) {
        return result;
      }
      seen[normalized] = true;
      result.push(normalized);
      return result;
    }, []);
  }

  function normalizePathname(pathname) {
    var normalized = String(pathname || "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "")
      .trim();
    return normalized || "/";
  }

  function isTruthyFlag(value) {
    return /^(1|true|yes)$/i.test(String(value || "").trim());
  }

  function sanitizeAllowedKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var normalized = String(settings.value || "").trim().toLowerCase();
    var allowedValues = Array.isArray(settings.allowedValues) ? settings.allowedValues : [];
    return allowedValues.some(function (value) {
      return String(value || "").trim().toLowerCase() === normalized;
    })
      ? normalized
      : "";
  }

  function findKeyedConfig(config) {
    var settings = config && typeof config === "object" ? config : {};
    var items = Array.isArray(settings.items) ? settings.items : [];
    var keyName = String(settings.keyName || "key").trim() || "key";
    var normalized = String(settings.key || "").trim().toLowerCase();
    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      if (String(item && item[keyName] || "").trim().toLowerCase() === normalized) {
        return item || null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(settings, "fallbackItem")) {
      return settings.fallbackItem || null;
    }
    var fallbackIndex = Number.parseInt(String(settings.fallbackIndex || 0), 10) || 0;
    return items[fallbackIndex] || null;
  }

  function readKeyedConfigValue(config) {
    var settings = config && typeof config === "object" ? config : {};
    var item = findKeyedConfig(settings);
    var valueName = String(settings.valueName || "label").trim() || "label";
    if (item && item[valueName] !== undefined && item[valueName] !== null) {
      return String(item[valueName] || "");
    }
    return String(settings.fallbackValue || "");
  }

  Object.assign(surfaceLayerApi, {
    escapeHtml: escapeHtml,
    uniqueStrings: uniqueStrings,
    normalizePathname: normalizePathname,
    isTruthyFlag: isTruthyFlag,
    sanitizeAllowedKey: sanitizeAllowedKey,
    findKeyedConfig: findKeyedConfig,
    readKeyedConfigValue: readKeyedConfigValue,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
