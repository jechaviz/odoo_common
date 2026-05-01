(function (v2) {
  "use strict";
  v2.subtotals = v2.subtotals || {};
  var _state = v2.state = v2.state || {};

  // Source: lib/odoo/web/form_section_layout/runtime/subtotals/report_persistence.js

  async function writeReportSubtotalLayoutToParamBase(baseKey, orderedLines) {
    if (!baseKey) {
      return;
    }
    var lines = Array.isArray(orderedLines) ? orderedLines : [];
    await callKw("ir.config_parameter", "set_param", [baseKey + ".count", String(lines.length)], {});
    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index] || {};
      var lineLabel = cleanText(line.label || "");
      var lineFormula = cleanText(line.formula || "");
      var lineSource = cleanText(line.sourceField || "");
      if (!lineFormula && lineSource) {
        lineFormula = "{field:" + lineSource + "}";
      }
      var lineType = normalizeSubtotalLineType(line.lineType, lineSource, lineLabel);
      var lineSign = normalizeSubtotalLineSign(line.sign);
      var linePayload = [lineLabel, lineFormula, lineSource, lineType, lineSign].join("|~|");
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".label", lineLabel],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".formula", lineFormula],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".source", lineSource],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".type", lineType],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index) + ".sign", lineSign],
        {}
      );
      await callKw(
        "ir.config_parameter",
        "set_param",
        [baseKey + ".line_" + String(index), linePayload],
        {}
      );
    }
  }

  v2.writeReportSubtotalLayoutToParamBase = writeReportSubtotalLayoutToParamBase;

  async function persistReportSubtotalLayout(snapshot, options) {
    var normalizedOptions = normalizeStatePersistOptions(options);
    if (!normalizedOptions || !(snapshot && typeof snapshot === "object")) {
      return;
    }

    var modelName = scopeModelFromScopeKey(normalizedOptions.scopeKey);
    var modelCandidates = [];
    if (modelName && modelName !== "unknown_model") {
      modelCandidates.push(modelName);
    }
    var uniqueModels = dedupeKeys(
      modelCandidates
        .map(function (value) {
          return cleanText(value || "");
        })
        .filter(Boolean)
    );
    if (!uniqueModels.length) {
      return;
    }

    var layoutKey = subtotalLayoutEntryKey(normalizedOptions.scopeKey, normalizedOptions.containerKey);
    var rawLayout = snapshot && snapshot.subtotalLayouts ? snapshot.subtotalLayouts[layoutKey] : null;
    var orderedLines = subtotalLinesInOrder(rawLayout);
    if (!orderedLines.length) {
      return;
    }
    var localeCandidates = reportSubtotalLocaleCandidates();
    for (var idx = 0; idx < uniqueModels.length; idx += 1) {
      var modelKey = uniqueModels[idx];
      for (var localeIdx = 0; localeIdx < localeCandidates.length; localeIdx += 1) {
        var localeCode = localeCandidates[localeIdx];
        var userBaseKey = buildReportSubtotalBaseKey(currentUserId() || 0, localeCode, modelKey);
        var globalBaseKey = buildGlobalReportSubtotalBaseKey(localeCode, modelKey);
        await writeReportSubtotalLayoutToParamBase(userBaseKey, orderedLines);
        await writeReportSubtotalLayoutToParamBase(globalBaseKey, orderedLines);
      }
    }
  }

  v2.persistReportSubtotalLayout = persistReportSubtotalLayout;

  async function persistReportSubtotalLayoutFromLayout(scopeKey, containerKey, layout) {
    var normalizedScope = cleanText(scopeKey || "");
    var normalizedContainer = cleanText(containerKey || "");
    if (!normalizedScope || !normalizedContainer) {
      return;
    }
    var modelName = scopeModelFromScopeKey(normalizedScope);
    var modelCandidates = [];
    if (modelName && modelName !== "unknown_model") {
      modelCandidates.push(modelName);
    }
    var uniqueModels = dedupeKeys(
      modelCandidates
        .map(function (value) {
          return cleanText(value || "");
        })
        .filter(Boolean)
    );
    if (!uniqueModels.length) {
      return;
    }

    var orderedLines = subtotalLinesInOrder(layout);
    if (!orderedLines.length) {
      return;
    }
    var localeCandidates = reportSubtotalLocaleCandidates();

    for (var idx = 0; idx < uniqueModels.length; idx += 1) {
      var modelKey = uniqueModels[idx];
      for (var localeIdx = 0; localeIdx < localeCandidates.length; localeIdx += 1) {
        var localeCode = localeCandidates[localeIdx];
        var userBaseKey = buildReportSubtotalBaseKey(currentUserId() || 0, localeCode, modelKey);
        var globalBaseKey = buildGlobalReportSubtotalBaseKey(localeCode, modelKey);
        await writeReportSubtotalLayoutToParamBase(userBaseKey, orderedLines);
        await writeReportSubtotalLayoutToParamBase(globalBaseKey, orderedLines);
      }
    }
  }

  v2.persistReportSubtotalLayoutFromLayout = persistReportSubtotalLayoutFromLayout;

  async function persistAllReportSubtotalLayouts(snapshot, preferredOptions) {
    var targets = collectSubtotalPersistTargets(snapshot, preferredOptions);
    for (var index = 0; index < targets.length; index += 1) {
      await persistReportSubtotalLayout(snapshot, targets[index]);
    }
  }

  v2.persistAllReportSubtotalLayouts = persistAllReportSubtotalLayouts;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
