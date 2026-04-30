(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var shared = surfaceLayerApi._shared || (surfaceLayerApi._shared = {});
  var DEFAULT_LIST_RETURN_STATE_IGNORE_SELECTORS = [
    "input",
    "select",
    "textarea",
    "label",
    "button",
    "[data-surface-preview]",
    "[data-surface-action]",
    "[data-surface-tab]",
    "[data-surface-filter]",
    "[data-surface-toolbar-control]",
    "[data-surface-intent]",
    "[data-surface-nav]",
    ".o_list_record_selector",
    ".o_optional_columns_dropdown_toggle",
    ".dropdown-toggle",
    ".dropdown-menu",
    ".dropdown-item",
    ".o_handle_cell",
    ".o_row_handle",
    ".o_field_handle",
    ".o_list_button_discard",
    ".o_surface_action_button",
    "[role='menu']",
    "[role='menuitem']"
  ];

  function getVisibleDataRows(config) {
    var settings = config && typeof config === "object" ? config : {};
    var selector = String(settings.rowSelector || ".o_list_table tbody tr.o_data_row").trim();
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (row) {
      return (
        row instanceof HTMLElement &&
        !row.hidden &&
        window.getComputedStyle(row).display !== "none" &&
        window.getComputedStyle(row).visibility !== "hidden"
      );
    });
  }

  function getRowReferenceValue(row, config) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var settings = config && typeof config === "object" ? config : {};
    function readReferenceText(node) {
      return node instanceof HTMLElement
        ? String(
            node.getAttribute("data-tooltip") ||
            node.getAttribute("title") ||
            node.textContent ||
            ""
          ).replace(/\s+/g, " ").trim()
        : "";
    }
    var selector = Array.isArray(settings.referenceSelectors)
      ? settings.referenceSelectors.join(", ")
      : String(settings.referenceSelector || "").trim();
    if (selector) {
      var cell = row.querySelector(selector);
      var cellValue = readReferenceText(cell);
      if (cellValue) {
        return cellValue;
      }
    }
    var fallbackCells = Array.prototype.slice.call(row.querySelectorAll("td[name], td[data-name], td"));
    for (var index = 0; index < fallbackCells.length; index += 1) {
      var value = readReferenceText(fallbackCells[index]);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function getDataRecordId(node) {
    if (!(node instanceof HTMLElement)) {
      return 0;
    }
    var rawValue = String(
      node.dataset.id ||
      node.dataset.resId ||
      node.getAttribute("data-id") ||
      node.getAttribute("data-res-id") ||
      ""
    ).trim();
    return /^\d+$/.test(rawValue) ? Number.parseInt(rawValue, 10) || 0 : 0;
  }

  function normalizeDataRecordId(value) {
    var rawValue = String(value || "").trim();
    return /^\d+$/.test(rawValue) ? Number.parseInt(rawValue, 10) || 0 : 0;
  }

  function normalizeRowIndex(value) {
    var numericValue = Number.parseInt(String(value || "").trim(), 10);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : -1;
  }

  function normalizeRowReference(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isUsableRowReference(value, config) {
    var normalized = normalizeRowReference(value);
    if (!normalized) {
      return false;
    }
    var settings = config && typeof config === "object" ? config : {};
    var ignoredReferences = Array.isArray(settings.ignoredReferences)
      ? settings.ignoredReferences
      : ["/", "-", "#"];
    return ignoredReferences.map(function (entry) {
      return normalizeRowReference(entry).toLowerCase();
    }).indexOf(normalized.toLowerCase()) === -1;
  }

  function getRowSignature(row) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    return normalizeRowReference(
      Array.prototype.slice.call(row.querySelectorAll("td[name], td[data-name], td"))
        .map(function (cell) {
          return cell instanceof HTMLElement
            ? String(cell.getAttribute("data-tooltip") || cell.textContent || "")
            : "";
        })
        .join(" ")
    );
  }

  function readDataRowCellText(row, config) {
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    var settings = config && typeof config === "object" ? config : {};
    var fields = Array.isArray(settings.fields) ? settings.fields : [settings.field];
    for (var index = 0; index < fields.length; index += 1) {
      var fieldName = String(fields[index] || "").trim();
      if (!fieldName) {
        continue;
      }
      var cell = row.querySelector(
        "td[name='" + fieldName + "'], td[data-name='" + fieldName + "']"
      );
      if (!(cell instanceof HTMLElement)) {
        continue;
      }
      var value = String(
        cell.getAttribute("data-tooltip") ||
        cell.getAttribute("title") ||
        cell.textContent ||
        ""
      ).replace(/\s+/g, " ").trim();
      if (value) {
        return value;
      }
    }
    return "";
  }

  function clearFocusedDataRows(config) {
    var settings = config && typeof config === "object" ? config : {};
    var focusClassNames = String(settings.focusClassName || "").trim()
      .split(/\s+/)
      .map(function (className) {
        return String(className || "").trim();
      })
      .filter(Boolean);
    if (!focusClassNames.length) {
      return;
    }
    var selector = focusClassNames.map(function (className) {
      return "." + className;
    }).join(", ");
    Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function (row) {
      if (row instanceof HTMLElement) {
        focusClassNames.forEach(function (className) {
          row.classList.remove(className);
        });
      }
    });
  }

  function isRowFullyVisible(row) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    var rect = row.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.top >= 0 && rect.bottom <= viewportHeight;
  }

  function findVisibleRowByReference(config) {
    var settings = config && typeof config === "object" ? config : {};
    var targetReference = String(settings.reference || "").trim();
    if (!targetReference) {
      return null;
    }
    var rows = Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings);
    return rows.find(function (row) {
      return getRowReferenceValue(row, settings) === targetReference;
    }) || null;
  }

  function findVisibleRowByRecordId(config) {
    var settings = config && typeof config === "object" ? config : {};
    var targetRecordId = normalizeDataRecordId(settings.recordId);
    if (!(targetRecordId > 0)) {
      return null;
    }
    var rows = Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings);
    return rows.find(function (row) {
      return getDataRecordId(row) === targetRecordId;
    }) || null;
  }

  function findVisibleRowByIndex(config) {
    var settings = config && typeof config === "object" ? config : {};
    var targetRowIndex = normalizeRowIndex(settings.rowIndex);
    if (targetRowIndex < 0) {
      return null;
    }
    var rows = Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings);
    if (!rows.length) {
      return null;
    }
    var candidate = rows[targetRowIndex];
    if (!(candidate instanceof HTMLElement)) {
      return null;
    }
    var targetSignature = normalizeRowReference(settings.signature);
    if (!targetSignature) {
      return candidate;
    }
    if (getRowSignature(candidate) === targetSignature) {
      return candidate;
    }
    return rows.find(function (row) {
      return getRowSignature(row) === targetSignature;
    }) || candidate;
  }

  function findVisibleRowBySignature(config) {
    var settings = config && typeof config === "object" ? config : {};
    var targetSignature = normalizeRowReference(settings.signature);
    if (!targetSignature) {
      return null;
    }
    var rows = Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings);
    return rows.find(function (row) {
      return getRowSignature(row) === targetSignature;
    }) || null;
  }

  function buildListReturnStatePayload(row, config) {
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    var settings = config && typeof config === "object" ? config : {};
    var rows = Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings);
    var recordId = getDataRecordId(row);
    var reference = normalizeRowReference(getRowReferenceValue(row, settings));
    var rowIndex = rows.indexOf(row);
    if (rowIndex < 0 && row.parentElement instanceof HTMLElement) {
      rowIndex = Array.prototype.slice.call(row.parentElement.children || [])
        .filter(function (candidate) {
          return candidate instanceof HTMLElement && candidate.matches("tr.o_data_row");
        })
        .indexOf(row);
    }
    var signature = getRowSignature(row);
    if (!isUsableRowReference(reference, settings)) {
      reference = "";
    }
    if (!(recordId > 0) && !reference && rowIndex < 0 && !signature) {
      return null;
    }
    return {
      recordId: recordId,
      reference: reference,
      rowIndex: rowIndex,
      signature: signature,
    };
  }

  function clearListReturnState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.storageKey || settings.key || "").trim();
    if (!storageKey || typeof surfaceLayerApi.clearSessionStorageKey !== "function") {
      return;
    }
    surfaceLayerApi.clearSessionStorageKey(storageKey);
  }

  function rememberListReturnState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.storageKey || settings.key || "").trim();
    if (!storageKey) {
      return null;
    }
    var interactiveRowSelector = String(settings.interactiveRowSelector || settings.rowSelector || "tr.o_data_row").trim() || "tr.o_data_row";
    var row = settings.row instanceof HTMLElement
      ? settings.row
      : settings.target instanceof HTMLElement
      ? settings.target.closest(interactiveRowSelector)
      : null;
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    var payload = buildListReturnStatePayload(row, settings);
    if (!(payload && typeof payload === "object")) {
      return null;
    }
    payload.armed = true;
    if (typeof surfaceLayerApi.saveTimedSessionPayload === "function") {
      surfaceLayerApi.saveTimedSessionPayload({
        key: storageKey,
        payload: payload,
      });
    }
    return payload;
  }

  function shouldIgnoreListReturnStateTarget(target, config) {
    var node = target instanceof HTMLElement ? target : null;
    if (!(node instanceof HTMLElement)) {
      return true;
    }
    var settings = config && typeof config === "object" ? config : {};
    var selector = Array.isArray(settings.ignoreSelectors)
      ? settings.ignoreSelectors.join(", ")
      : String(
        settings.ignoreSelector ||
        DEFAULT_LIST_RETURN_STATE_IGNORE_SELECTORS.join(", ")
      ).trim();
    return !!(selector && node.closest(selector));
  }

  function installListReturnStateBridge(config) {
    var settings = config && typeof config === "object" ? config : {};
    var table = settings.table instanceof HTMLElement ? settings.table : null;
    if (!(table instanceof HTMLElement)) {
      return false;
    }
    var bridgeKey = String(settings.bridgeKey || settings.storageKey || settings.key || "default").trim();
    var stateKey = bridgeKey.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "default";
    if (!(shared.listReturnBridgeStates && typeof shared.listReturnBridgeStates === "object")) {
      shared.listReturnBridgeStates = Object.create(null);
    }
    var bridgeState = shared.listReturnBridgeStates[stateKey];
    if (!(bridgeState && typeof bridgeState === "object")) {
      bridgeState = {
        table: null,
        settings: null,
        handler: null,
      };
      bridgeState.handler = function (event) {
        var target = event.target instanceof HTMLElement ? event.target : null;
        var runtimeSettings = bridgeState.settings && typeof bridgeState.settings === "object"
          ? bridgeState.settings
          : null;
        var runtimeTable = bridgeState.table instanceof HTMLElement ? bridgeState.table : null;
        if (!(target instanceof HTMLElement) || !(runtimeTable instanceof HTMLElement) || !runtimeTable.isConnected) {
          return;
        }
        if (!runtimeTable.contains(target) || shouldIgnoreListReturnStateTarget(target, runtimeSettings)) {
          return;
        }
        var rowSelector = String(
          runtimeSettings.interactiveRowSelector ||
          runtimeSettings.rowSelector ||
          "tr.o_data_row"
        ).trim() || "tr.o_data_row";
        var row = target.closest(rowSelector);
        if (!(row instanceof HTMLElement) || !runtimeTable.contains(row)) {
          return;
        }
        rememberListReturnState(Object.assign({}, runtimeSettings, {
          row: row,
        }));
      };
      document.addEventListener("pointerdown", bridgeState.handler, true);
      document.addEventListener("click", bridgeState.handler, true);
      shared.listReturnBridgeStates[stateKey] = bridgeState;
    }
    bridgeState.table = table;
    bridgeState.settings = Object.assign({}, settings);
    table.dataset.surfaceListReturnBridge = stateKey;
    return true;
  }

  function armListReturnState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.storageKey || settings.key || "").trim();
    var overrideRecordId = normalizeDataRecordId(settings.recordId);
    var overrideReference = normalizeRowReference(settings.reference);
    var overrideRowIndex = normalizeRowIndex(settings.rowIndex);
    var overrideSignature = normalizeRowReference(settings.signature);
    if (
      !storageKey ||
      typeof surfaceLayerApi.readTimedSessionPayload !== "function" ||
      typeof surfaceLayerApi.saveTimedSessionPayload !== "function"
    ) {
      return null;
    }
    var payload = surfaceLayerApi.readTimedSessionPayload({
      key: storageKey,
      maxAgeMs: Number(settings.maxAgeMs || 20 * 60 * 1000) || (20 * 60 * 1000),
      clearOnInvalid: false,
      validate: function (entry) {
        if (!(entry && typeof entry === "object")) {
          return false;
        }
        return normalizeDataRecordId(entry.recordId) > 0 ||
          !!String(entry.reference || "").trim() ||
          normalizeRowIndex(entry.rowIndex) >= 0 ||
          !!String(entry.signature || "").trim();
      },
      clearOnInvalid: false,
    });
    if (!(payload && typeof payload === "object")) {
      return null;
    }
    var nextRecordId = overrideRecordId > 0 ? overrideRecordId : normalizeDataRecordId(payload.recordId);
    var nextReference = isUsableRowReference(overrideReference, settings)
      ? overrideReference
      : normalizeRowReference(payload.reference);
    if (!isUsableRowReference(nextReference, settings)) {
      nextReference = "";
    }
    var nextRowIndex = overrideRowIndex >= 0
      ? overrideRowIndex
      : normalizeRowIndex(payload.rowIndex);
    var nextSignature = overrideSignature || normalizeRowReference(payload.signature);
    if (!(nextRecordId > 0) && !nextReference && nextRowIndex < 0 && !nextSignature) {
      return null;
    }
    if (
      payload.armed === true &&
      nextRecordId === normalizeDataRecordId(payload.recordId) &&
      nextReference === normalizeRowReference(payload.reference) &&
      nextRowIndex === normalizeRowIndex(payload.rowIndex) &&
      nextSignature === normalizeRowReference(payload.signature)
    ) {
      return payload;
    }
    surfaceLayerApi.saveTimedSessionPayload({
      key: storageKey,
      payload: {
        recordId: nextRecordId,
        reference: nextReference,
        rowIndex: nextRowIndex,
        signature: nextSignature,
        armed: true,
      },
    });
    return {
      recordId: nextRecordId,
      reference: nextReference,
      rowIndex: nextRowIndex,
      signature: nextSignature,
      armed: true,
    };
  }

  function seedListReturnState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.storageKey || settings.key || "").trim();
    var reference = String(settings.reference || "").trim();
    var recordId = normalizeDataRecordId(settings.recordId);
    var rowIndex = normalizeRowIndex(settings.rowIndex);
    var signature = normalizeRowReference(settings.signature);
    if (
      !storageKey ||
      (!(recordId > 0) && !reference && rowIndex < 0 && !signature) ||
      typeof surfaceLayerApi.saveTimedSessionPayload !== "function"
    ) {
      return null;
    }
    var payload = {
      recordId: recordId,
      reference: reference,
      rowIndex: rowIndex,
      signature: signature,
      armed: true,
    };
    surfaceLayerApi.saveTimedSessionPayload({
      key: storageKey,
      payload: payload,
    });
    return payload;
  }

  function restoreListReturnState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var storageKey = String(settings.storageKey || settings.key || "").trim();
    if (!storageKey || typeof surfaceLayerApi.readTimedSessionPayload !== "function") {
      return null;
    }
    var payload = surfaceLayerApi.readTimedSessionPayload({
      key: storageKey,
      maxAgeMs: Number(settings.maxAgeMs || 20 * 60 * 1000) || (20 * 60 * 1000),
      validate: function (entry) {
        if (!(entry && typeof entry === "object")) {
          return false;
        }
        return entry.armed === true &&
          (
            normalizeDataRecordId(entry.recordId) > 0 ||
            !!String(entry.reference || "").trim() ||
            normalizeRowIndex(entry.rowIndex) >= 0 ||
            !!String(entry.signature || "").trim()
          );
      },
    });
    if (!(payload && typeof payload === "object")) {
      return null;
    }
    var targetRow = syncFocusedDataRow(Object.assign({}, settings, {
      recordId: normalizeDataRecordId(payload.recordId),
      reference: String(payload.reference || "").trim(),
      rowIndex: normalizeRowIndex(payload.rowIndex),
      signature: normalizeRowReference(payload.signature),
    }));
    if (targetRow && settings.clearOnRestore !== false) {
      clearListReturnState({
        storageKey: storageKey,
      });
    }
    return targetRow;
  }

  function syncFocusedDataRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    clearFocusedDataRows(settings);
    var targetRow = findVisibleRowByRecordId({
      rows: Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings),
      recordId: settings.recordId,
      rowSelector: settings.rowSelector,
    }) || findVisibleRowByReference({
      rows: Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings),
      reference: settings.reference,
      referenceSelector: settings.referenceSelector,
      referenceSelectors: settings.referenceSelectors,
      rowSelector: settings.rowSelector,
    }) || findVisibleRowByIndex({
      rows: Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings),
      rowIndex: settings.rowIndex,
      signature: settings.signature,
      rowSelector: settings.rowSelector,
    }) || findVisibleRowBySignature({
      rows: Array.isArray(settings.rows) ? settings.rows : getVisibleDataRows(settings),
      signature: settings.signature,
      rowSelector: settings.rowSelector,
    });
    if (!(targetRow instanceof HTMLElement)) {
      return null;
    }
    var focusClassNames = String(settings.focusClassName || "").trim()
      .split(/\s+/)
      .map(function (className) {
        return String(className || "").trim();
      })
      .filter(Boolean);
    if (focusClassNames.length) {
      targetRow.classList.add.apply(targetRow.classList, focusClassNames);
    }
    if (settings.scrollIntoView !== false && !isRowFullyVisible(targetRow)) {
      targetRow.scrollIntoView({
        block: String(settings.scrollBlock || "nearest"),
        inline: String(settings.scrollInline || "nearest"),
      });
    }
    if (typeof settings.onFocused === "function") {
      try {
        settings.onFocused(targetRow, settings);
      } catch (_error) {}
    }
    return targetRow;
  }

  Object.assign(surfaceLayerApi, {
    getVisibleDataRows: getVisibleDataRows,
    getRowReferenceValue: getRowReferenceValue,
    getDataRecordId: getDataRecordId,
    getRowSignature: getRowSignature,
    findVisibleRowByRecordId: findVisibleRowByRecordId,
    findVisibleRowByIndex: findVisibleRowByIndex,
    findVisibleRowBySignature: findVisibleRowBySignature,
    readDataRowCellText: readDataRowCellText,
    findVisibleRowByReference: findVisibleRowByReference,
    clearFocusedDataRows: clearFocusedDataRows,
    clearListReturnState: clearListReturnState,
    rememberListReturnState: rememberListReturnState,
    installListReturnStateBridge: installListReturnStateBridge,
    armListReturnState: armListReturnState,
    seedListReturnState: seedListReturnState,
    restoreListReturnState: restoreListReturnState,
    syncFocusedDataRow: syncFocusedDataRow,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
