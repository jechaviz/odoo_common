(function () {
  "use strict";

  function closestElement(value, selector) {
    return value instanceof Element ? value.closest(selector) : null;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function formatKey(kind, filename, format) {
    return [
      normalizeText(kind).toLowerCase(),
      normalizeText(filename).toLowerCase(),
      normalizeText(format).toLowerCase()
    ].join("|");
  }

  function readFormatFromText(value) {
    var normalized = normalizeText(value).toLowerCase();
    if (normalized.indexOf("json") >= 0) {
      return "json";
    }
    if (normalized.indexOf("xml") >= 0) {
      return "xml";
    }
    return "";
  }

  function buildSourceIndex() {
    var index = Object.create(null);
    Array.from(document.querySelectorAll(".oc_report_test_data__row")).forEach(function (row) {
      var cells = row.querySelectorAll("td");
      var payload = row.querySelector("[data-oc-report-test-code]");
      var record;
      if (cells.length < 4 || !payload) {
        return;
      }
      record = {
        kind: normalizeText(cells[0].textContent),
        filename: normalizeText(cells[1].textContent),
        formatLabel: normalizeText(cells[2].textContent),
        size: normalizeText(cells[3].textContent),
        code: payload.value || payload.textContent || ""
      };
      record.format = readFormatFromText(record.formatLabel);
      index[formatKey(record.kind, record.filename, record.formatLabel)] = record;
      index[formatKey(record.kind, record.filename, record.format)] = record;
    });
    return index;
  }

  function nativeCell(row, fieldName) {
    return row instanceof HTMLElement ? row.querySelector('td[name="' + fieldName + '"]') : null;
  }

  function readNativeRowInfo(row) {
    var kindCell = nativeCell(row, "x_kind");
    var filenameCell = nativeCell(row, "x_source_filename");
    var formatCell = nativeCell(row, "x_source_format");
    var formatLabel = normalizeText(formatCell ? formatCell.textContent : "");
    return {
      kind: normalizeText(kindCell ? kindCell.textContent : ""),
      filename: normalizeText(filenameCell ? filenameCell.textContent : ""),
      formatLabel: formatLabel,
      format: readFormatFromText(formatLabel)
    };
  }

  function lookupNativeRecord(row) {
    var info = readNativeRowInfo(row);
    var index = buildSourceIndex();
    return index[formatKey(info.kind, info.filename, info.formatLabel)] ||
      index[formatKey(info.kind, info.filename, info.format)] ||
      null;
  }

  function prettyXml(source) {
    var parser = new DOMParser();
    var parsed = parser.parseFromString(source, "application/xml");
    if (parsed.querySelector("parsererror")) {
      return source;
    }
    return new XMLSerializer().serializeToString(parsed)
      .replace(/>\s*</g, ">\n<")
      .split("\n")
      .reduce(function (lines, line) {
        var trimmed = line.trim();
        if (!trimmed) {
          return lines;
        }
        if (/^<\//.test(trimmed)) {
          lines.level = Math.max(lines.level - 1, 0);
        }
        lines.values.push(new Array(lines.level + 1).join("  ") + trimmed);
        if (/^<[^!?/][^>]*[^/]?>$/.test(trimmed)) {
          lines.level += 1;
        }
        return lines;
      }, { level: 0, values: [] })
      .values.join("\n");
  }

  function prettyFormat(source, format) {
    if (format === "json") {
      try {
        return JSON.stringify(JSON.parse(source), null, 2);
      } catch (error) {
        return source;
      }
    }
    if (format === "xml") {
      return prettyXml(source);
    }
    return source;
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return Promise.resolve();
  }

  function closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  function openCodeModal(record) {
    var modal = document.createElement("div");
    var title = record && record.filename ? record.filename : "Codigo";
    modal.className = "oc_report_test_data_modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = [
      '<div class="oc_report_test_data_modal__dialog">',
      '<div class="oc_report_test_data_modal__header">',
      '<div class="oc_report_test_data_modal__title"></div>',
      '<button type="button" class="oc_report_test_data__button" data-oc-report-test-close="1">Cerrar</button>',
      "</div>",
      '<div class="oc_report_test_data_modal__body"><pre class="oc_report_test_data_modal__pre"></pre></div>',
      '<div class="oc_report_test_data_modal__footer">',
      '<button type="button" class="oc_report_test_data__button" data-oc-report-test-format-modal="1">Formatear</button>',
      '<button type="button" class="oc_report_test_data__button" data-oc-report-test-copy-modal="1">Copiar</button>',
      "</div>",
      "</div>"
    ].join("");
    modal.querySelector(".oc_report_test_data_modal__title").textContent = title;
    modal.querySelector(".oc_report_test_data_modal__pre").textContent = record && record.code ? record.code : "";
    modal.__ocReportTestDataFormat = record && record.format ? record.format : "";
    document.body.appendChild(modal);
  }

  function buildButton(action, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "oc_report_test_data__button oc_report_test_data__button--" + action;
    button.setAttribute("data-oc-report-test-" + action, "1");
    button.textContent = label;
    return button;
  }

  function findSampleTables(root) {
    return Array.from((root || document).querySelectorAll("table.o_list_table")).filter(function (table) {
      return table.querySelector('th[data-name="x_kind"]') &&
        table.querySelector('th[data-name="x_source_filename"]') &&
        table.querySelector('th[data-name="x_source_format"]');
    });
  }

  function ensureHeader(table, beforeHeader) {
    var headerRow = table.querySelector("thead tr");
    var sizeHeader;
    var actionHeader;
    if (!headerRow || headerRow.querySelector(".oc_report_test_data_native_actions_header")) {
      return;
    }
    sizeHeader = document.createElement("th");
    sizeHeader.className = "oc_report_test_data_native_size_header align-middle";
    sizeHeader.style.width = "86px";
    sizeHeader.textContent = "Tamano";
    actionHeader = document.createElement("th");
    actionHeader.className = "oc_report_test_data_native_actions_header align-middle";
    actionHeader.style.width = "270px";
    actionHeader.textContent = "Acciones";
    headerRow.insertBefore(sizeHeader, beforeHeader || null);
    headerRow.insertBefore(actionHeader, beforeHeader || null);
  }

  function openNativeEditor(row) {
    var target = nativeCell(row, "x_source_filename") || nativeCell(row, "x_kind") || row.querySelector("td.o_data_cell");
    if (target instanceof HTMLElement) {
      target.click();
    }
  }

  function enhanceNativeRow(row, beforeCell) {
    var record = lookupNativeRecord(row);
    var sizeCell;
    var actionCell;
    var actionWrap;
    if (!(row instanceof HTMLElement) || row.querySelector(".oc_report_test_data_native_actions")) {
      return;
    }
    sizeCell = document.createElement("td");
    sizeCell.className = "oc_report_test_data_native_size";
    sizeCell.style.width = "86px";
    sizeCell.textContent = record && record.size ? record.size : "";
    actionCell = document.createElement("td");
    actionCell.className = "oc_report_test_data_native_actions";
    actionCell.style.width = "270px";
    actionWrap = document.createElement("div");
    actionWrap.className = "oc_report_test_data_native_actions__wrap";
    if (record && record.code) {
      actionWrap.appendChild(buildButton("open", "Ver codigo"));
      actionWrap.appendChild(buildButton("copy", "Copiar"));
    }
    actionWrap.appendChild(buildButton("edit", "Editar/subir"));
    actionCell.appendChild(actionWrap);
    row.insertBefore(sizeCell, beforeCell || null);
    row.insertBefore(actionCell, beforeCell || null);
  }

  function enhanceNativeTables(root) {
    findSampleTables(root || document).forEach(function (table) {
      var beforeHeader = table.querySelector("th.o_list_actions_header");
      var fieldShell = table.closest(".o_field_x2many, .o_field_widget");
      if (fieldShell instanceof HTMLElement) {
        fieldShell.classList.add("oc_report_test_data_native_list");
      }
      table.classList.add("oc_report_test_data_native_table");
      table.style.tableLayout = "auto";
      ensureHeader(table, beforeHeader);
      Array.from(table.querySelectorAll("tbody tr.o_data_row")).forEach(function (row) {
        enhanceNativeRow(row, row.querySelector("td.o_list_record_remove"));
      });
    });
  }

  document.addEventListener("click", function (event) {
    var openButton = closestElement(event.target, "[data-oc-report-test-open], .oc_report_test_data__button--open");
    var copyButton = closestElement(event.target, "[data-oc-report-test-copy], .oc_report_test_data__button--copy");
    var editButton = closestElement(event.target, "[data-oc-report-test-edit], .oc_report_test_data__button--edit");
    var modal = closestElement(event.target, ".oc_report_test_data_modal");
    var closeButton = closestElement(event.target, "[data-oc-report-test-close]");
    var modalCopyButton = closestElement(event.target, "[data-oc-report-test-copy-modal]");
    var modalFormatButton = closestElement(event.target, "[data-oc-report-test-format-modal]");
    var row;
    var record;
    var pre;

    if (openButton) {
      row = closestElement(openButton, "tr.o_data_row");
      record = row ? lookupNativeRecord(row) : null;
      if (record) {
        event.preventDefault();
        event.stopPropagation();
        openCodeModal(record);
      }
      return;
    }
    if (copyButton) {
      row = closestElement(copyButton, "tr.o_data_row");
      record = row ? lookupNativeRecord(row) : null;
      if (record) {
        event.preventDefault();
        event.stopPropagation();
        copyText(record.code || "");
      }
      return;
    }
    if (editButton) {
      row = closestElement(editButton, "tr.o_data_row");
      if (row) {
        event.preventDefault();
        event.stopPropagation();
        openNativeEditor(row);
      }
      return;
    }
    if (closeButton || event.target === modal) {
      event.preventDefault();
      closeModal(modal);
      return;
    }
    if (modalCopyButton && modal) {
      pre = modal.querySelector(".oc_report_test_data_modal__pre");
      event.preventDefault();
      copyText(pre ? pre.textContent || "" : "");
      return;
    }
    if (modalFormatButton && modal) {
      pre = modal.querySelector(".oc_report_test_data_modal__pre");
      if (pre) {
        event.preventDefault();
        pre.textContent = prettyFormat(pre.textContent || "", modal.__ocReportTestDataFormat || "");
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal(document.querySelector(".oc_report_test_data_modal"));
    }
  });

  function hydrate(root) {
    enhanceNativeTables(root || document);
  }

  hydrate(document);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hydrate(document);
    });
  }
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.from(mutation.addedNodes || []).forEach(function (node) {
        if (node instanceof HTMLElement) {
          hydrate(node);
          hydrate(document);
        }
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
