(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var MANAGED_ATTR = "data-surface-managed";

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

  Object.assign(surfaceLayerApi, {
    getListRendererNode: getListRendererNode,
    getVisibleTableHeaders: getVisibleTableHeaders,
    getTrailingRowCell: getTrailingRowCell,
    getTrailingHeaderCell: getTrailingHeaderCell,
    syncTrailingActionColumns: syncTrailingActionColumns,
    ensureManagedActionColumn: ensureManagedActionColumn,
    clearManagedActionColumn: clearManagedActionColumn,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
