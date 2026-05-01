(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/state_keys.js

  function hasActiveSubtotalEditMode() {
    return Object.keys(_state.subtotalEditModes).some(function (key) {
      return Boolean(_state.subtotalEditModes[key]);
    });
  }

  v2.hasActiveSubtotalEditMode = hasActiveSubtotalEditMode;

  function subtotalLayoutEntryKey(scopeKey, containerKey) {
    return "subtotal|" + scopeKey + "|" + containerKey;
  }

  v2.subtotalLayoutEntryKey = subtotalLayoutEntryKey;

  function subtotalLinesInOrder(layout) {
    var normalized = normalizeSubtotalLayout(layout);
    var enforced = enforceCoreSubtotalLineRules(normalized).layout;
    var lineById = new Map();
    enforced.lines.forEach(function (line) {
      if (!(line && line.id)) {
        return;
      }
      lineById.set(line.id, line);
    });
    var ordered = [];
    enforced.order.forEach(function (lineId) {
      if (lineById.has(lineId)) {
        ordered.push(lineById.get(lineId));
        lineById.delete(lineId);
      }
    });
    enforced.lines.forEach(function (line) {
      if (lineById.has(line.id)) {
        ordered.push(line);
        lineById.delete(line.id);
      }
    });
    return ordered;
  }

  v2.subtotalLinesInOrder = subtotalLinesInOrder;

  function buildReportSubtotalBaseKey(userId, localeCode, modelName) {
    var localeKey = normalizeKey(localeCode || "en_US") || "en_us";
    var modelKey = normalizeKey(modelName || "");
    if (!modelKey) {
      return "";
    }
    return REPORT_SUBTOTAL_DB_PARAM_PREFIX + String(userId || 0) + ".lang_" + localeKey + ".model_" + modelKey;
  }

  v2.buildReportSubtotalBaseKey = buildReportSubtotalBaseKey;

  function buildGlobalReportSubtotalBaseKey(localeCode, modelName) {
    var localeKey = normalizeKey(localeCode || "en_US") || "en_us";
    var modelKey = normalizeKey(modelName || "");
    if (!modelKey) {
      return "";
    }
    return REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX + "lang_" + localeKey + ".model_" + modelKey;
  }

  v2.buildGlobalReportSubtotalBaseKey = buildGlobalReportSubtotalBaseKey;

  function reportSubtotalLocaleCandidates() {
    var candidates = [];
    candidates.push(currentLocaleCode());
    candidates.push("en_US");
    var info = getSessionInfo();
    if (info && typeof info === "object") {
      candidates.push(cleanText(info.lang || ""));
      if (info.user_context && typeof info.user_context === "object") {
        candidates.push(cleanText(info.user_context.lang || ""));
      }
    }
    if (document && document.documentElement) {
      candidates.push(cleanText(document.documentElement.lang || ""));
    }
    var seen = new Set();
    var output = [];
    candidates.forEach(function (candidate) {
      var normalized = normalizeKey(candidate || "en_US") || "en_us";
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      output.push(candidate || "en_US");
    });
    if (!output.length) {
      output.push("en_US");
    }
    return output;
  }

  v2.reportSubtotalLocaleCandidates = reportSubtotalLocaleCandidates;

  function parseSubtotalLayoutStorageKey(layoutKey) {
    var rawKey = cleanText(layoutKey || "");
    if (!rawKey || rawKey.indexOf("subtotal|") !== 0) {
      return null;
    }
    var payload = rawKey.slice("subtotal|".length);
    if (!payload) {
      return null;
    }
    var separator = payload.lastIndexOf("|");
    if (separator <= 0 || separator >= payload.length - 1) {
      return null;
    }
    var scopeKey = cleanText(payload.slice(0, separator));
    var containerKey = cleanText(payload.slice(separator + 1));
    if (!scopeKey || !containerKey) {
      return null;
    }
    return {
      scopeKey: scopeKey,
      containerKey: containerKey,
    };
  }

  v2.parseSubtotalLayoutStorageKey = parseSubtotalLayoutStorageKey;

  function collectSubtotalPersistTargets(snapshot, preferredOptions) {
    var targets = [];
    var seen = new Set();
    function pushTarget(candidate) {
      var normalized = normalizeStatePersistOptions(candidate);
      if (!normalized) {
        return;
      }
      var key = normalized.scopeKey + "|" + normalized.containerKey;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      targets.push(normalized);
    }

    pushTarget(preferredOptions || null);

    var layouts = snapshot && snapshot.subtotalLayouts && typeof snapshot.subtotalLayouts === "object"
      ? snapshot.subtotalLayouts
      : {};
    Object.keys(layouts).forEach(function (layoutKey) {
      pushTarget(parseSubtotalLayoutStorageKey(layoutKey));
    });
    return targets;
  }

  v2.collectSubtotalPersistTargets = collectSubtotalPersistTargets;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
