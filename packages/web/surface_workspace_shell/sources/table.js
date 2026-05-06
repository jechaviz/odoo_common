(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;
  if (!(surfaceLayerApi && typeof surfaceLayerApi === "object")) {
    throw new Error("surface table runtime requires the canonical OdooSurfaceLayers bootstrap.");
  }
  var MANAGED_ATTR = "data-surface-managed";
  var DEFAULT_PREVIEW_HEADER_CLASS_NAME = "o_surface_record_preview_header";
  var DEFAULT_PREVIEW_CELL_CLASS_NAME = "o_surface_record_preview_cell o_surface_action_cell";
  var DEFAULT_PREVIEW_ACTIONS_CLASS_NAME = "o_surface_record_preview_actions";
  var DEFAULT_PREVIEW_BUTTON_CLASS_NAME = "o_surface_record_preview_button";
  var PREVIEW_BUTTON_SELECTOR = "." + DEFAULT_PREVIEW_BUTTON_CLASS_NAME;
  var managedPreviewBridges = Object.create(null);
  var managedPreviewBridgeListenerInstalled = false;

  function syncClassName(node, nextClassName) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var normalized = String(nextClassName || "").trim();
    if (node.className === normalized) {
      return false;
    }
    node.className = normalized;
    return true;
  }

  function syncTextContent(node, nextText) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var normalized = String(nextText || "");
    if (node.textContent === normalized) {
      return false;
    }
    node.textContent = normalized;
    return true;
  }

  function syncInnerHtml(node, nextMarkup) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var normalized = String(nextMarkup || "");
    if (node.innerHTML === normalized) {
      return false;
    }
    node.innerHTML = normalized;
    return true;
  }

  function markManaged(node) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (node.getAttribute(MANAGED_ATTR) !== "1") {
      node.setAttribute(MANAGED_ATTR, "1");
    }
  }

  function getPrimaryClassToken(value) {
    var normalized = String(value || "").trim();
    return normalized ? normalized.split(/\s+/)[0] : "";
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizePreviewActions(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function joinClassNames(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : [values]).reduce(function (tokens, value) {
      String(value || "").split(/\s+/).forEach(function (token) {
        var normalized = String(token || "").trim();
        if (!normalized || seen[normalized]) {
          return;
        }
        seen[normalized] = true;
        tokens.push(normalized);
      });
      return tokens;
    }, []).join(" ");
  }

  function escapeHtml(value) {
    if (typeof surfaceLayerApi.escapeHtml === "function") {
      return String(surfaceLayerApi.escapeHtml(value) || "");
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizePremiumSmartTableColumns(columns) {
    return normalizeArray(columns).map(function (column, index) {
      var entry = column && typeof column === "object" ? Object.assign({}, column) : {};
      entry.key = String(entry.key || entry.name || ("column_" + index)).trim();
      entry.label = String(entry.label || entry.title || entry.key).trim();
      entry.headerClassName = String(entry.headerClassName || "").trim();
      entry.cellClassName = String(entry.cellClassName || "").trim();
      entry.allowHtml = entry.allowHtml === true;
      entry.numeric = entry.numeric === true;
      entry.nowrap = entry.nowrap === true;
      entry.sortable = entry.sortable === true;
      return entry;
    }).filter(function (entry) {
      return !!entry.key;
    });
  }

  function buildPremiumSmartTableStatusCellMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof surfaceLayerApi.buildPremiumStatusChipMarkup !== "function") {
      return "";
    }
    return surfaceLayerApi.buildPremiumStatusChipMarkup({
      label: settings.label || settings.text || settings.value,
      tone: settings.tone || settings.status || settings.state,
      state: settings.state,
      status: settings.status,
      dot: Object.prototype.hasOwnProperty.call(settings, "dot") ? settings.dot : true,
      className: String(settings.className || "").trim(),
      data: settings.data,
      attributes: settings.attributes,
    });
  }

  function buildPremiumSmartTableRowActionsMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actions = normalizePreviewActions(settings.actions).filter(function (entry) {
      return entry && entry.visible !== false;
    });
    if (!actions.length) {
      return String(settings.emptyMarkup || "");
    }
    if (typeof surfaceLayerApi.buildPreviewActionGroupMarkup === "function") {
      return surfaceLayerApi.buildPreviewActionGroupMarkup({
        actions: actions.map(function (entry) {
          if (typeof entry === "string") {
            return entry;
          }
          return Object.assign({}, entry, {
            className: joinClassNames([
              "o_surface_premium_icon_button",
              entry.className,
            ]),
          });
        }),
        className: joinClassNames([
          "o_surface_premium_smart_table__row_actions",
          settings.className,
        ]),
      });
    }
    return "";
  }

  function buildPremiumSmartTableMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var columns = normalizePremiumSmartTableColumns(settings.columns);
    var rows = normalizeArray(settings.rows);
    var emptyLabel = String(settings.emptyLabel || "Sin resultados").trim();
    var summary = String(settings.summary || "").trim();
    var toolbarMarkup = String(settings.toolbarMarkup || "").trim();
    var rowActions = typeof settings.buildRowActions === "function"
      ? settings.buildRowActions
      : null;

    function resolveCellMarkup(column, row, rowIndex) {
      var rawValue = typeof column.render === "function"
        ? column.render(row, rowIndex, column, settings)
        : row && Object.prototype.hasOwnProperty.call(row, column.key)
        ? row[column.key]
        : "";
      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        if (rawValue.type === "status") {
          return buildPremiumSmartTableStatusCellMarkup(rawValue);
        }
        if (rawValue.markup != null) {
          return String(rawValue.markup || "");
        }
      }
      return column.allowHtml ? String(rawValue || "") : escapeHtml(rawValue);
    }

    var headerMarkup = columns.map(function (column) {
      var labelMarkup = column.sortable
        ? '<button class="o_surface_premium_smart_table__sort" type="button" data-surface-sort="' +
          escapeHtml(column.key) + '">' + escapeHtml(column.label) + "</button>"
        : escapeHtml(column.label);
      return (
        '<th class="' + escapeHtml(joinClassNames([
          column.headerClassName,
          column.numeric ? "o_surface_premium_smart_table__cell--numeric" : "",
          column.nowrap ? "o_surface_premium_smart_table__cell--nowrap" : "",
        ])) + '">' + labelMarkup + "</th>"
      );
    }).join("") + (
      rowActions
        ? '<th class="' + escapeHtml(joinClassNames([
            "o_surface_premium_smart_table__cell--actions",
            String(settings.actionsHeaderClassName || "").trim(),
          ])) + '">' + escapeHtml(String(settings.actionsLabel || "").trim()) + "</th>"
        : ""
    );

    var bodyMarkup = rows.length
      ? rows.map(function (row, rowIndex) {
          var cellMarkup = columns.map(function (column) {
            return (
              '<td class="' + escapeHtml(joinClassNames([
                column.cellClassName,
                column.numeric ? "o_surface_premium_smart_table__cell--numeric" : "",
                column.nowrap ? "o_surface_premium_smart_table__cell--nowrap" : "",
              ])) + '">' +
              resolveCellMarkup(column, row, rowIndex) +
              "</td>"
            );
          }).join("");
          var actionsMarkup = rowActions
            ? '<td class="' + escapeHtml(joinClassNames([
                "o_surface_premium_smart_table__cell--actions",
                String(settings.actionsCellClassName || "").trim(),
              ])) + '">' +
              buildPremiumSmartTableRowActionsMarkup({
                actions: rowActions(row, rowIndex, settings) || [],
              }) +
              "</td>"
            : "";
          return (
            '<tr class="' + escapeHtml(String(typeof settings.getRowClassName === "function"
              ? settings.getRowClassName(row, rowIndex, settings)
              : ""
            ).trim()) + '">' +
            cellMarkup +
            actionsMarkup +
            "</tr>"
          );
        }).join("")
      : '<tr><td class="o_surface_premium_smart_table__empty" colspan="' +
        String(columns.length + (rowActions ? 1 : 0)) +
        '">' + escapeHtml(emptyLabel) + "</td></tr>";

    return (
      '<section class="' + escapeHtml(joinClassNames([
        "o_surface_premium_smart_table_shell",
        settings.className,
      ])) + '">' +
      ((summary || toolbarMarkup)
        ? '<div class="o_surface_premium_smart_table__toolbar">' +
          (summary ? '<div class="o_surface_premium_smart_table__summary">' + escapeHtml(summary) + "</div>" : "") +
          toolbarMarkup +
          "</div>"
        : "") +
      '<div class="o_surface_premium_smart_table__scroll">' +
      '<table class="' + escapeHtml(joinClassNames([
        "o_surface_premium_smart_table",
        settings.tableClassName,
      ])) + '">' +
      "<thead><tr>" + headerMarkup + "</tr></thead>" +
      "<tbody>" + bodyMarkup + "</tbody>" +
      "</table>" +
      "</div>" +
      "</section>"
    );
  }

  function applyPreviewButtonAttributes(target, config) {
    var attributes = target && typeof target === "object" ? Object.assign({}, target) : {};
    var settings = config && typeof config === "object" ? config : {};
    var previewKey = String(settings.previewKey || settings.action || settings.key || "").trim();
    var ownerKey = String(settings.ownerKey || "").trim();
    var url = String(settings.url || "").trim();
    var surfacePreviewValue = Object.prototype.hasOwnProperty.call(settings, "surfacePreview")
      ? settings.surfacePreview
      : previewKey;
    if (
      surfacePreviewValue !== false &&
      previewKey &&
      !Object.prototype.hasOwnProperty.call(attributes, "data-surface-preview")
    ) {
      attributes["data-surface-preview"] = String(surfacePreviewValue || previewKey);
    }
    if (ownerKey && !Object.prototype.hasOwnProperty.call(attributes, "data-surface-preview-owner")) {
      attributes["data-surface-preview-owner"] = ownerKey;
    }
    if (settings.recordId != null && !Object.prototype.hasOwnProperty.call(attributes, "data-record-id")) {
      attributes["data-record-id"] = String(settings.recordId);
    }
    if (url && !Object.prototype.hasOwnProperty.call(attributes, "data-url")) {
      attributes["data-url"] = url;
    }
    return attributes;
  }

  function getListRendererNode(config) {
    var settings = config && typeof config === "object" ? config : {};
    var table = settings.table instanceof HTMLElement ? settings.table : null;
    var selector = String(settings.rendererSelector || ".o_list_renderer").trim();
    return table instanceof HTMLElement ? table.closest(selector) : null;
  }

  function getVisibleTableHeaders(table) {
    if (!(table instanceof HTMLTableElement) || !(table.tHead instanceof HTMLTableSectionElement)) {
      return [];
    }
    var headerRow = table.tHead.rows && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : null;
    return headerRow instanceof HTMLTableRowElement
      ? Array.prototype.slice.call(headerRow.cells || [])
      : [];
  }

  function getTrailingRowCell(row, trailingOffset) {
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    var cells = Array.prototype.slice.call(row.children);
    var offset = Math.max(Number(trailingOffset || 1) || 1, 1);
    return cells.length >= offset ? cells[cells.length - offset] : null;
  }

  function getTrailingHeaderCell(headers, trailingOffset) {
    var list = Array.isArray(headers) ? headers : [];
    var offset = Math.max(Number(trailingOffset || 1) || 1, 1);
    return list.length >= offset ? list[list.length - offset] : null;
  }

  function syncTrailingActionColumns(config) {
    var settings = config && typeof config === "object" ? config : {};
    var headers = Array.isArray(settings.headers) ? settings.headers : [];
    var rows = Array.isArray(settings.rows) ? settings.rows : [];
    var actionHeader = getTrailingHeaderCell(headers, settings.actionOffset || 2);
    var controllerHeader = getTrailingHeaderCell(headers, settings.controllerOffset || 1);
    var actionHeaderClassName = String(settings.actionHeaderClassName || "").trim();
    var controllerHeaderClassName = String(settings.controllerHeaderClassName || "").trim();
    var actionCellClassName = String(settings.actionCellClassName || "").trim();
    var controllerCellClassName = String(settings.controllerCellClassName || "").trim();
    var actionLabel = String(settings.actionLabel || "").trim();
    var nativeButtonSelector = String(settings.nativeButtonSelector || "").trim();
    var decorateNativeButton = typeof settings.decorateNativeButton === "function"
      ? settings.decorateNativeButton
      : null;

    if (actionHeader instanceof HTMLElement) {
      if (actionLabel) {
        actionHeader.textContent = actionLabel;
      }
      if (actionHeaderClassName) {
        actionHeader.classList.add(actionHeaderClassName);
      }
      if (controllerHeaderClassName) {
        actionHeader.classList.remove(controllerHeaderClassName);
      }
    }
    if (controllerHeader instanceof HTMLElement) {
      if (actionHeaderClassName) {
        controllerHeader.classList.remove(actionHeaderClassName);
      }
      if (controllerHeaderClassName) {
        controllerHeader.classList.add(controllerHeaderClassName);
      }
    }

    rows.forEach(function (row) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      var actionCell = getTrailingRowCell(row, settings.actionOffset || 2);
      var controllerCell = getTrailingRowCell(row, settings.controllerOffset || 1);
      if (actionCell instanceof HTMLElement && actionCellClassName) {
        actionCell.classList.add(actionCellClassName);
      }
      if (controllerCell instanceof HTMLElement && controllerCellClassName) {
        controllerCell.classList.add(controllerCellClassName);
      }
      if (!nativeButtonSelector) {
        return;
      }
      Array.prototype.slice.call(row.querySelectorAll(nativeButtonSelector)).forEach(function (button) {
        if (button instanceof HTMLElement && decorateNativeButton) {
          try {
            decorateNativeButton(button, row, actionCell, controllerCell, settings);
          } catch (_error) {}
        }
      });
    });
  }

  function ensureManagedActionColumn(config) {
    var settings = config && typeof config === "object" ? config : {};
    var table = settings.table instanceof HTMLTableElement ? settings.table : null;
    if (!(table instanceof HTMLTableElement) || !(table.tHead instanceof HTMLTableSectionElement)) {
      return null;
    }
    var headerRow = table.tHead.rows && table.tHead.rows.length
      ? table.tHead.rows[table.tHead.rows.length - 1]
      : null;
    if (!(headerRow instanceof HTMLTableRowElement)) {
      return null;
    }
    var headerClassName = String(settings.headerClassName || "").trim();
    var cellClassName = String(settings.cellClassName || "").trim();
    if (!headerClassName || !cellClassName) {
      return null;
    }
    var headerClassToken = getPrimaryClassToken(headerClassName);
    var cellClassToken = getPrimaryClassToken(cellClassName);
    if (!headerClassToken || !cellClassToken) {
      return null;
    }
    var header = headerRow.querySelector("." + headerClassToken);
    if (!(header instanceof HTMLTableCellElement)) {
      header = document.createElement("th");
      syncClassName(header, headerClassName);
      markManaged(header);
      headerRow.appendChild(header);
    }
    syncClassName(header, headerClassName);
    markManaged(header);
    syncTextContent(header, String(settings.headerLabel || "").trim());
    var rows = Array.isArray(settings.rows)
      ? settings.rows
      : Array.prototype.slice.call(table.querySelectorAll("tbody tr.o_data_row"));
    var renderCell = typeof settings.renderCell === "function"
      ? settings.renderCell
      : function () { return ""; };
    rows.forEach(function (row, index) {
      if (!(row instanceof HTMLTableRowElement)) {
        return;
      }
      var cell = row.querySelector("td." + cellClassToken);
      if (!(cell instanceof HTMLTableCellElement)) {
        cell = document.createElement("td");
        syncClassName(cell, cellClassName);
        markManaged(cell);
        row.appendChild(cell);
      }
      syncClassName(cell, cellClassName);
      markManaged(cell);
      syncInnerHtml(cell, String(renderCell(row, index, settings) || ""));
    });
    return {
      header: header,
      rows: rows,
    };
  }

  function clearManagedActionColumn(config) {
    var settings = config && typeof config === "object" ? config : {};
    var table = settings.table instanceof HTMLTableElement ? settings.table : null;
    var headerClassName = String(settings.headerClassName || "").trim();
    var cellClassName = String(settings.cellClassName || "").trim();
    var headerClassToken = getPrimaryClassToken(headerClassName);
    var cellClassToken = getPrimaryClassToken(cellClassName);
    if (table instanceof HTMLTableElement && headerClassToken) {
      Array.prototype.slice.call(table.querySelectorAll("th." + headerClassToken)).forEach(function (node) {
        if (node instanceof HTMLElement) {
          node.remove();
        }
      });
    }
    if (table instanceof HTMLTableElement && cellClassToken) {
      Array.prototype.slice.call(table.querySelectorAll("td." + cellClassToken)).forEach(function (node) {
        if (node instanceof HTMLElement) {
          node.remove();
        }
      });
    }
  }

  function buildManagedPreviewButtonMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var previewKey = String(settings.previewKey || settings.action || settings.key || "").trim();
    if (!previewKey) {
      return "";
    }
    var attributes = applyPreviewButtonAttributes(settings.attributes, Object.assign({}, settings, {
      previewKey: previewKey,
    }));
    var data = settings.data && typeof settings.data === "object"
      ? Object.assign({}, settings.data)
      : {};
    if (!Object.prototype.hasOwnProperty.call(data, "surfacePreview")) {
      data.surfacePreview = previewKey;
    }
    if (!Object.prototype.hasOwnProperty.call(data, "surfacePreviewOwner")) {
      data.surfacePreviewOwner = String(settings.ownerKey || "").trim();
    }
    if (!Object.prototype.hasOwnProperty.call(data, "recordId") && settings.recordId != null) {
      data.recordId = String(settings.recordId);
    }
    if (!Object.prototype.hasOwnProperty.call(data, "url") && String(settings.url || "").trim()) {
      data.url = String(settings.url || "").trim();
    }
    return surfaceLayerApi.buildPreviewActionButtonMarkup({
      action: previewKey,
      iconClass: String(settings.iconClass || "").trim(),
      label: String(settings.label || settings.title || "").trim(),
      className: String(settings.className || DEFAULT_PREVIEW_BUTTON_CLASS_NAME).trim(),
      data: data,
      attributes: attributes,
      surfacePreview: Object.prototype.hasOwnProperty.call(settings, "surfacePreview")
        ? settings.surfacePreview
        : previewKey,
      surfaceAction: Object.prototype.hasOwnProperty.call(settings, "surfaceAction")
        ? settings.surfaceAction
        : true,
    });
  }

  function buildManagedPreviewActionsMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actions = normalizePreviewActions(settings.actions).filter(function (item) {
      return item && item.visible !== false;
    });
    var ownerKey = String(settings.ownerKey || "").trim();
    var buttonClassName = String(
      settings.buttonClassName || DEFAULT_PREVIEW_BUTTON_CLASS_NAME
    ).trim();
    var buttonDefaults = settings.buttonDefaults && typeof settings.buttonDefaults === "object"
      ? settings.buttonDefaults
      : {};
    var actionButtons = actions.map(function (item) {
      if (typeof item === "string") {
        return item;
      }
      if (!(item && typeof item === "object")) {
        return "";
      }
      if (item.markup != null) {
        return String(item.markup || "");
      }
      return buildManagedPreviewButtonMarkup(Object.assign({}, buttonDefaults, item, {
        previewKey: item.previewKey || item.action || item.key,
        iconClass: item.iconClass,
        label: item.label || item.title,
        className: String(item.className || buttonClassName).trim(),
        data: item.data,
        attributes: item.attributes,
        ownerKey: item.ownerKey != null ? item.ownerKey : ownerKey,
        recordId: item.recordId,
        surfaceAction: item.surfaceAction,
        surfacePreview: Object.prototype.hasOwnProperty.call(item, "surfacePreview")
          ? item.surfacePreview
          : undefined,
        url: item.url,
      }));
    }).filter(Boolean);
    return surfaceLayerApi.buildPreviewActionGroupMarkup({
      actions: actionButtons,
      className: String(settings.className || DEFAULT_PREVIEW_ACTIONS_CLASS_NAME).trim(),
      emptyMarkup: String(settings.emptyMarkup || "").trim(),
      wrap: settings.wrap,
    });
  }

  function ensureManagedPreviewActionColumn(config) {
    var settings = config && typeof config === "object" ? config : {};
    var ownerKey = String(settings.ownerKey || settings.bridgeKey || settings.key || "").trim();
    var headerClassName = String(settings.headerClassName || DEFAULT_PREVIEW_HEADER_CLASS_NAME).trim();
    var cellClassName = String(settings.cellClassName || DEFAULT_PREVIEW_CELL_CLASS_NAME).trim();
    var cellClassToken = getPrimaryClassToken(cellClassName);
    var result = surfaceLayerApi.ensureManagedActionColumn({
      table: settings.table,
      rows: settings.rows,
      headerLabel: String(settings.headerLabel || "Vistas").trim(),
      headerClassName: headerClassName,
      cellClassName: cellClassName,
      renderCell: function (row, index) {
        var actionResolver = typeof settings.buildActions === "function"
          ? settings.buildActions
          : null;
        var actions = actionResolver ? actionResolver(row, index, settings) : settings.actions;
        return buildManagedPreviewActionsMarkup({
          actions: actions,
          ownerKey: ownerKey,
          className: String(settings.actionsClassName || DEFAULT_PREVIEW_ACTIONS_CLASS_NAME).trim(),
          buttonClassName: String(settings.buttonClassName || DEFAULT_PREVIEW_BUTTON_CLASS_NAME).trim(),
        });
      },
    });
    if (result && ownerKey) {
      if (result.header instanceof HTMLElement) {
        result.header.dataset.surfacePreviewOwner = ownerKey;
      }
      if (cellClassToken) {
        (Array.isArray(result.rows) ? result.rows : []).forEach(function (row) {
          var cell = row instanceof HTMLElement ? row.querySelector("td." + cellClassToken) : null;
          if (cell instanceof HTMLElement) {
            cell.dataset.surfacePreviewOwner = ownerKey;
          }
        });
      }
    }
    return result;
  }

  function clearManagedPreviewActionColumn(config) {
    var settings = config && typeof config === "object" ? config : {};
    var table = settings.table instanceof HTMLTableElement ? settings.table : null;
    var ownerKey = String(settings.ownerKey || settings.bridgeKey || settings.key || "").trim();
    var headerClassName = String(settings.headerClassName || DEFAULT_PREVIEW_HEADER_CLASS_NAME).trim();
    var cellClassName = String(settings.cellClassName || DEFAULT_PREVIEW_CELL_CLASS_NAME).trim();
    var headerClassToken = getPrimaryClassToken(headerClassName);
    var cellClassToken = getPrimaryClassToken(cellClassName);
    if (table instanceof HTMLTableElement && ownerKey) {
      if (headerClassToken) {
        Array.prototype.slice.call(table.querySelectorAll("th." + headerClassToken)).forEach(function (node) {
          if (node instanceof HTMLElement && node.dataset.surfacePreviewOwner === ownerKey) {
            node.remove();
          }
        });
      }
      if (cellClassToken) {
        Array.prototype.slice.call(table.querySelectorAll("td." + cellClassToken)).forEach(function (node) {
          if (node instanceof HTMLElement && node.dataset.surfacePreviewOwner === ownerKey) {
            node.remove();
          }
        });
      }
      return;
    }
    surfaceLayerApi.clearManagedActionColumn({
      table: table,
      headerClassName: headerClassName,
      cellClassName: cellClassName,
    });
  }

  function installManagedPreviewBridgeListener() {
    if (managedPreviewBridgeListenerInstalled) {
      return;
    }
    managedPreviewBridgeListenerInstalled = true;
    document.addEventListener("click", function (event) {
      var target = event.target instanceof HTMLElement
        ? event.target.closest(PREVIEW_BUTTON_SELECTOR)
        : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var ownerKey = String(
        target.getAttribute("data-surface-preview-owner") || target.dataset.surfacePreviewOwner || ""
      ).trim();
      if (!ownerKey) {
        return;
      }
      var bridge = managedPreviewBridges[ownerKey];
      if (!bridge) {
        return;
      }
      if (typeof bridge.matchesTarget === "function") {
        try {
          if (!bridge.matchesTarget(target, event, bridge.settings)) {
            return;
          }
        } catch (_error) {
          return;
        }
      }
      var previewKey = String(
        target.getAttribute("data-surface-preview") || target.dataset.surfacePreview || target.getAttribute("data-action") || ""
      ).trim();
      var recordId = Number.parseInt(
        String(target.getAttribute("data-record-id") || target.dataset.recordId || 0),
        10
      ) || 0;
      var url = String(target.getAttribute("data-url") || target.dataset.url || "").trim();
      var previewHandlers = bridge.previewHandlers && typeof bridge.previewHandlers === "object"
        ? bridge.previewHandlers
        : {};
      var previewHandler = typeof previewHandlers[previewKey] === "function"
        ? previewHandlers[previewKey]
        : null;
      if (!(previewHandler || (previewKey === "web" && typeof bridge.openWebPreview === "function") || url)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      var context = {
        previewKey: previewKey,
        recordId: recordId,
        url: url,
        target: target,
        event: event,
        settings: bridge.settings,
      };
      if (previewHandler) {
        try {
          var previewResult = previewHandler(context);
          if (previewResult && typeof previewResult.catch === "function") {
            previewResult.catch(function () {});
          }
        } catch (_error) {}
        return;
      }
      if (previewKey === "web" && typeof bridge.openWebPreview === "function") {
        try {
          var openResult = bridge.openWebPreview(recordId, target, event, bridge.settings);
          if (openResult && typeof openResult.catch === "function") {
            openResult.catch(function () {});
          }
        } catch (_error) {}
        return;
      }
      if (url) {
        surfaceLayerApi.openSurfaceUrl(url, false);
      }
    }, true);
  }

  function buildManagedPreviewColumnController(config) {
    var settings = config && typeof config === "object" ? config : {};
    var bridgeKey = String(settings.bridgeKey || settings.key || "").trim();
    var tableSelector = String(settings.tableSelector || "table.o_list_table").trim();
    var headerLabel = String(settings.headerLabel || "Vistas").trim();
    var headerClassName = String(settings.headerClassName || DEFAULT_PREVIEW_HEADER_CLASS_NAME).trim();
    var cellClassName = String(settings.cellClassName || DEFAULT_PREVIEW_CELL_CLASS_NAME).trim();
    var actionsClassName = String(settings.actionsClassName || DEFAULT_PREVIEW_ACTIONS_CLASS_NAME).trim();
    var buttonClassName = String(settings.buttonClassName || DEFAULT_PREVIEW_BUTTON_CLASS_NAME).trim();
    var resolveTable = typeof settings.resolveTable === "function"
      ? settings.resolveTable
      : function (runtimeState) {
          return runtimeState && runtimeState.listTable instanceof HTMLTableElement
            ? runtimeState.listTable
            : null;
        };
    var resolveRows = typeof settings.resolveRows === "function"
      ? settings.resolveRows
      : function (table) {
          return Array.prototype.slice.call(table.querySelectorAll("tbody tr.o_data_row")).filter(function (row) {
            return row instanceof HTMLTableRowElement;
          });
        };
    var hydrateRows = typeof settings.hydrateRows === "function"
      ? settings.hydrateRows
      : null;
    var buildActions = typeof settings.buildActions === "function"
      ? settings.buildActions
      : function () { return []; };

    function clear() {
      Array.prototype.slice.call(document.querySelectorAll(tableSelector)).forEach(function (table) {
        if (table instanceof HTMLTableElement) {
          clearManagedPreviewActionColumn({
            table: table,
            headerClassName: headerClassName,
            cellClassName: cellClassName,
            ownerKey: bridgeKey,
          });
        }
      });
    }

    async function sync(runtimeState) {
      var table = resolveTable(runtimeState, settings);
      if (!(table instanceof HTMLTableElement)) {
        clear();
        return false;
      }
      var rows = resolveRows(table, runtimeState, settings);
      if (hydrateRows) {
        await Promise.resolve(hydrateRows(rows, runtimeState, settings));
      }
      ensureManagedPreviewActionColumn({
        table: table,
        rows: rows,
        headerLabel: headerLabel,
        headerClassName: headerClassName,
        cellClassName: cellClassName,
        ownerKey: bridgeKey,
        actionsClassName: actionsClassName,
        buttonClassName: buttonClassName,
        buildActions: function (row, index) {
          return buildActions(row, index, runtimeState, settings);
        },
      });
      return true;
    }

    function installBridge() {
      if (!bridgeKey) {
        return false;
      }
      managedPreviewBridges[bridgeKey] = {
        settings: settings,
        matchesTarget: typeof settings.matchesTarget === "function" ? settings.matchesTarget : null,
        openWebPreview: typeof settings.openWebPreview === "function" ? settings.openWebPreview : null,
        previewHandlers: settings.previewHandlers && typeof settings.previewHandlers === "object"
          ? settings.previewHandlers
          : null,
      };
      installManagedPreviewBridgeListener();
      return true;
    }

    return {
      bridgeKey: bridgeKey,
      clear: clear,
      sync: sync,
      installBridge: installBridge,
      buildActionsMarkup: function (actions) {
        return buildManagedPreviewActionsMarkup({
          actions: actions,
          ownerKey: bridgeKey,
          className: actionsClassName,
          buttonClassName: buttonClassName,
        });
      },
    };
  }

  Object.assign(surfaceLayerApi, {
    getListRendererNode: getListRendererNode,
    getVisibleTableHeaders: getVisibleTableHeaders,
    getTrailingRowCell: getTrailingRowCell,
    getTrailingHeaderCell: getTrailingHeaderCell,
    normalizePremiumSmartTableColumns: normalizePremiumSmartTableColumns,
    buildPremiumSmartTableStatusCellMarkup: buildPremiumSmartTableStatusCellMarkup,
    buildPremiumSmartTableRowActionsMarkup: buildPremiumSmartTableRowActionsMarkup,
    buildPremiumSmartTableMarkup: buildPremiumSmartTableMarkup,
    syncTrailingActionColumns: syncTrailingActionColumns,
    ensureManagedActionColumn: ensureManagedActionColumn,
    clearManagedActionColumn: clearManagedActionColumn,
    ensureManagedPreviewActionColumn: ensureManagedPreviewActionColumn,
    clearManagedPreviewActionColumn: clearManagedPreviewActionColumn,
    buildManagedPreviewButtonMarkup: buildManagedPreviewButtonMarkup,
    buildManagedPreviewActionsMarkup: buildManagedPreviewActionsMarkup,
    buildManagedPreviewColumnController: buildManagedPreviewColumnController,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
