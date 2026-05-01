(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace filters.");
    }
    return window.OdooSurfaceLayers;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();

  function sanitizeYearMonthKey(value) {
    var normalized = String(value || "").trim();
    return /^\d{4}-\d{2}$/.test(normalized) ? normalized : "";
  }

  function sanitizeNumericIdentifier(value) {
    var normalized = String(value || "").trim();
    return /^\d+$/.test(normalized) ? normalized : "";
  }

  function normalizeScopedFilterState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var source = settings.state && typeof settings.state === "object" ? settings.state : {};
    var fields = Array.isArray(settings.fields) ? settings.fields : [];
    return fields.reduce(function (result, field) {
      var key = String((field && (field.key || field.name)) || "").trim();
      if (!key) {
        return result;
      }
      var rawValue = source[key];
      if (field && typeof field.sanitize === "function") {
        try {
          result[key] = field.sanitize(rawValue, field, source, settings);
          return result;
        } catch (_error) {}
      }
      result[key] = String(rawValue || "").trim();
      return result;
    }, {});
  }

  function areNormalizedStatesEqual(config) {
    var settings = config && typeof config === "object" ? config : {};
    var fields = Array.isArray(settings.fields) ? settings.fields : [];
    var left = normalizeScopedFilterState({
      state: settings.left,
      fields: fields,
    });
    var right = normalizeScopedFilterState({
      state: settings.right,
      fields: fields,
    });
    return fields.every(function (field) {
      var key = String((field && (field.key || field.name)) || "").trim();
      return !key || left[key] === right[key];
    });
  }

  function buildMonthKey(value) {
    var raw = String(value || "").trim();
    return raw.length >= 7 ? raw.slice(0, 7) : "";
  }

  function normalizeIsoDateKey(rawValue) {
    var normalized = String(rawValue || "").trim();
    if (!normalized) {
      return "";
    }
    var match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
      return normalized;
    }
    return match[1] + "-" + match[2] + "-" + match[3];
  }

  function normalizeMany2oneValue(value) {
    if (Array.isArray(value)) {
      return {
        id: Number(value[0] || 0) || 0,
        displayName: String(value[1] || "").trim(),
      };
    }
    if (value && typeof value === "object") {
      return {
        id: Number(value.id || value.resId || 0) || 0,
        displayName: String(value.display_name || value.displayName || value.name || "").trim(),
      };
    }
    return { id: 0, displayName: "" };
  }

  function buildYearMonthRange(monthKey) {
    var normalized = sanitizeYearMonthKey(monthKey);
    if (!normalized) {
      return null;
    }
    var parts = normalized.split("-");
    var year = Number(parts[0] || 0) || 0;
    var month = Number(parts[1] || 0) || 0;
    if (!(year > 0) || !(month >= 1 && month <= 12)) {
      return null;
    }
    var nextYear = month === 12 ? year + 1 : year;
    var nextMonth = month === 12 ? 1 : month + 1;
    return {
      start: parts[0] + "-" + parts[1] + "-01 00:00:00",
      end:
        String(nextYear).padStart(4, "0") +
        "-" +
        String(nextMonth).padStart(2, "0") +
        "-01 00:00:00",
    };
  }

  function hasDomainCondition(domain, fieldName, operator, value) {
    return Array.isArray(domain) && domain.some(function (entry) {
      return (
        Array.isArray(entry) &&
        entry.length >= 3 &&
        String(entry[0] || "").trim() === String(fieldName || "").trim() &&
        String(entry[1] || "").trim() === String(operator || "").trim() &&
        (
          Array.isArray(value)
            ? JSON.stringify(entry[2]) === JSON.stringify(value)
            : String(entry[2]) === String(value)
        )
      );
    });
  }

  Object.assign(surfaceLayerApi, {
    sanitizeYearMonthKey: sanitizeYearMonthKey,
    sanitizeNumericIdentifier: sanitizeNumericIdentifier,
    normalizeScopedFilterState: normalizeScopedFilterState,
    areNormalizedStatesEqual: areNormalizedStatesEqual,
    buildMonthKey: buildMonthKey,
    normalizeIsoDateKey: normalizeIsoDateKey,
    normalizeMany2oneValue: normalizeMany2oneValue,
    buildYearMonthRange: buildYearMonthRange,
    hasDomainCondition: hasDomainCondition,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
