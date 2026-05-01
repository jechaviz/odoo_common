(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};

  function buildScopedStateCacheKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var scopeKey = String(settings.scopeKey || settings.scopeName || "").trim().toLowerCase();
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    var prefixParts = Array.isArray(settings.prefixParts) ? settings.prefixParts : [];
    var dependencyKeys = Array.isArray(settings.dependencyKeys) ? settings.dependencyKeys : [];
    return prefixParts
      .map(function (part) {
        return String(part || "").trim();
      })
      .concat([scopeKey])
      .concat(
        dependencyKeys.map(function (key) {
          return String(state[key] || "").trim();
        })
      )
      .join("::");
  }

  function normalizeDependentSelectOptions(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = settings.state && typeof settings.state === "object" ? settings.state : {};
    var optionData = settings.optionData && typeof settings.optionData === "object" ? settings.optionData : {};
    var specs = Array.isArray(settings.specs) ? settings.specs : [];
    return specs.reduce(function (result, spec) {
      var entry = spec && typeof spec === "object" ? spec : {};
      var optionsKey = String(entry.optionsKey || "").trim();
      var stateKey = String(entry.stateKey || "").trim();
      var valueKey = String(entry.valueKey || "value").trim();
      var labelKey = String(entry.labelKey || "label").trim();
      var selectedValue = String(state[stateKey] || "").trim();
      var options = Array.isArray(optionData[optionsKey]) ? optionData[optionsKey].slice() : [];
      if (
        selectedValue &&
        !options.some(function (option) {
          return String(option && option[valueKey] || "").trim() === selectedValue;
        })
      ) {
        var selectedOption = null;
        if (typeof entry.createSelectedOption === "function") {
          try {
            selectedOption = entry.createSelectedOption(selectedValue, state, entry);
          } catch (_error) {
            selectedOption = null;
          }
        }
        if (!(selectedOption && typeof selectedOption === "object")) {
          selectedOption = {};
          selectedOption[valueKey] = selectedValue;
          selectedOption[labelKey] = selectedValue;
        }
        options.unshift(selectedOption);
      }
      result[optionsKey] = options;
      return result;
    }, {});
  }

  async function searchReadInBatches(config) {
    var settings = config && typeof config === "object" ? config : {};
    var ormService = settings.ormService;
    var modelName = String(settings.model || "").trim();
    var domain = Array.isArray(settings.domain) ? settings.domain : [];
    var fields = Array.isArray(settings.fields) ? settings.fields : [];
    if (!ormService || !modelName || !fields.length) {
      return [];
    }
    var batchSize = Math.max(Number(settings.batchSize || 200) || 200, 50);
    var maxRows = Math.max(Number(settings.maxRows || 2000) || 2000, batchSize);
    var order = String(settings.order || "").trim();
    var rows = [];
    var offset = 0;
    while (offset < maxRows) {
      var nextLimit = Math.min(batchSize, maxRows - offset);
      var batch = [];
      try {
        batch = await ormService.searchRead(modelName, domain, fields, {
          limit: nextLimit,
          offset: offset,
          order: order,
        });
      } catch (_error) {
        break;
      }
      if (!Array.isArray(batch) || !batch.length) {
        break;
      }
      rows = rows.concat(batch);
      if (batch.length < nextLimit) {
        break;
      }
      offset += batch.length;
    }
    return rows;
  }

  function buildInlineTextDataUrl(content, mimeType) {
    var normalizedContent = String(content || "");
    if (!normalizedContent.trim()) {
      return "";
    }
    var normalizedMimeType = String(mimeType || "text/plain;charset=utf-8").trim() || "text/plain;charset=utf-8";
    return "data:" + normalizedMimeType + "," + encodeURIComponent(normalizedContent);
  }

  function detectBinaryAttachmentKind(attachment) {
    var row = attachment && typeof attachment === "object" ? attachment : {};
    var name = String(row.name || "").trim().toLowerCase();
    var mimetype = String(row.mimetype || "").trim().toLowerCase();
    if (mimetype.indexOf("pdf") !== -1 || name.slice(-4) === ".pdf") {
      return "pdf";
    }
    if (mimetype.indexOf("xml") !== -1 || name.slice(-4) === ".xml") {
      return "xml";
    }
    return "";
  }

  async function hydrateBinaryAttachmentUrls(config) {
    var settings = config && typeof config === "object" ? config : {};
    var rows = Array.isArray(settings.rows) ? settings.rows : [];
    var modelName = String(settings.modelName || "").trim();
    var cache = settings.cache && typeof settings.cache === "object"
      ? settings.cache
      : Object.create(null);
    var kinds = Array.isArray(settings.kinds) && settings.kinds.length
      ? settings.kinds.map(function (kind) { return String(kind || "").trim().toLowerCase(); }).filter(Boolean)
      : ["pdf", "xml"];
    var getDataRecordId = surfaceLayerApi.getDataRecordId;
    var recordIds = rows.map(function (row) {
      return getDataRecordId(row);
    }).filter(function (recordId) {
      return recordId > 0;
    });
    if (!recordIds.length || !modelName) {
      return cache;
    }
    var missingIds = recordIds.filter(function (recordId) {
      var cacheEntry = cache[String(recordId)];
      if (!(cacheEntry && typeof cacheEntry === "object")) {
        return true;
      }
      return kinds.some(function (kind) {
        return !String(cacheEntry[kind] || "").trim();
      });
    });
    if (!missingIds.length) {
      return cache;
    }
    missingIds.forEach(function (recordId) {
      var key = String(recordId);
      if (!(cache[key] && typeof cache[key] === "object")) {
        cache[key] = {};
      }
      kinds.forEach(function (kind) {
        if (cache[key][kind] === undefined) {
          cache[key][kind] = "";
        }
      });
    });
    var ormService = await surfaceLayerApi.resolveOdooService("orm");
    if (!ormService || typeof ormService.searchRead !== "function") {
      return cache;
    }
    var attachmentRows = await ormService.searchRead(
      "ir.attachment",
      [["res_model", "=", modelName], ["res_id", "in", missingIds], ["type", "=", "binary"]],
      ["id", "res_id", "name", "mimetype"],
      {
        order: "id desc",
        limit: Math.max(missingIds.length * Math.max(Number(settings.limitMultiplier || 6) || 6, 2), 24),
      }
    ).catch(function () {
      return [];
    });
    (Array.isArray(attachmentRows) ? attachmentRows : []).forEach(function (row) {
      var recordId = Number.parseInt(String(row && row.res_id || 0), 10) || 0;
      var kind = detectBinaryAttachmentKind(row);
      if (!(recordId > 0) || !kind || kinds.indexOf(kind) === -1) {
        return;
      }
      var cacheKey = String(recordId);
      if (!cache[cacheKey] || typeof cache[cacheKey] !== "object") {
        cache[cacheKey] = {};
      }
      if (String(cache[cacheKey][kind] || "").trim()) {
        return;
      }
      cache[cacheKey][kind] = "/web/content/" + String(row.id || 0) + "?download=false";
    });
    return cache;
  }

  Object.assign(surfaceLayerApi, {
    buildScopedStateCacheKey: buildScopedStateCacheKey,
    normalizeDependentSelectOptions: normalizeDependentSelectOptions,
    searchReadInBatches: searchReadInBatches,
    buildInlineTextDataUrl: buildInlineTextDataUrl,
    detectBinaryAttachmentKind: detectBinaryAttachmentKind,
    hydrateBinaryAttachmentUrls: hydrateBinaryAttachmentUrls,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
