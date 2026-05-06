(function () {
  "use strict";

  function closestElement(value, selector) {
    return value instanceof Element ? value.closest(selector) : null;
  }

  function findCodeNode(row) {
    var drawerRow = row && row.nextElementSibling;
    if (!(drawerRow instanceof HTMLElement)) {
      return null;
    }
    return drawerRow.querySelector(".oc_report_test_data__code, .oc_report_test_data__pre");
  }

  function readCode(row) {
    var node = findCodeNode(row);
    if (node instanceof HTMLTextAreaElement) {
      return node.value || "";
    }
    return node ? node.textContent || "" : "";
  }

  function readFormat(row) {
    var explicitFormat = String(row && row.getAttribute("data-oc-report-test-format") || "").toLowerCase();
    var formatCellText;
    if (explicitFormat) {
      return explicitFormat;
    }
    formatCellText = row && row.querySelector("td:nth-child(3)")
      ? String(row.querySelector("td:nth-child(3)").textContent || "").toLowerCase()
      : "";
    if (formatCellText.indexOf("json") >= 0) {
      return "json";
    }
    if (formatCellText.indexOf("xml") >= 0) {
      return "xml";
    }
    return "";
  }

  function buildActionButton(action, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "oc_report_test_data__button oc_report_test_data__button--" + action;
    button.setAttribute("data-oc-report-test-" + action, "1");
    button.textContent = label;
    return button;
  }

  function hydrateActionCells(root) {
    Array.from((root || document).querySelectorAll(".oc_report_test_data__actions")).forEach(function (cell) {
      if (!(cell instanceof HTMLElement) || cell.querySelector(".oc_report_test_data__button")) {
        return;
      }
      cell.appendChild(buildActionButton("open", "Ver codigo"));
      cell.appendChild(buildActionButton("copy", "Copiar"));
    });
  }

  function prettyXml(source) {
    var parser = new DOMParser();
    var parsed = parser.parseFromString(source, "application/xml");
    if (parsed.querySelector("parsererror")) {
      return source;
    }
    var serialized = new XMLSerializer().serializeToString(parsed);
    return serialized
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

  function openModal(row) {
    var code = readCode(row);
    var format = readFormat(row);
    var filenameCell = row.querySelector("td:nth-child(2)");
    var title = filenameCell ? filenameCell.textContent.trim() : "Codigo";
    var modal = document.createElement("div");
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
    modal.querySelector(".oc_report_test_data_modal__pre").textContent = code;
    modal.__ocReportTestDataFormat = format;
    document.body.appendChild(modal);
  }

  document.addEventListener("click", function (event) {
    var openButton = closestElement(event.target, "[data-oc-report-test-open], .oc_report_test_data__button--open");
    var copyButton = closestElement(event.target, "[data-oc-report-test-copy], .oc_report_test_data__button--copy");
    var modal = closestElement(event.target, ".oc_report_test_data_modal");
    var closeButton = closestElement(event.target, "[data-oc-report-test-close]");
    var modalCopyButton = closestElement(event.target, "[data-oc-report-test-copy-modal]");
    var modalFormatButton = closestElement(event.target, "[data-oc-report-test-format-modal]");
    var row;
    var pre;

    if (openButton) {
      row = closestElement(openButton, ".oc_report_test_data__row");
      if (row) {
        event.preventDefault();
        openModal(row);
      }
      return;
    }
    if (copyButton) {
      row = closestElement(copyButton, ".oc_report_test_data__row");
      if (row) {
        event.preventDefault();
        copyText(readCode(row));
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
    if (event.key !== "Escape") {
      return;
    }
    closeModal(document.querySelector(".oc_report_test_data_modal"));
  });

  hydrateActionCells(document);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hydrateActionCells(document);
    });
  }
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.from(mutation.addedNodes || []).forEach(function (node) {
        if (node instanceof HTMLElement) {
          hydrateActionCells(node);
        }
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
