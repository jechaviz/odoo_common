(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var escapeHtml = typeof surfaceLayerApi.escapeHtml === "function"
    ? surfaceLayerApi.escapeHtml
    : function (value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };
  var toDataAttributeName = typeof surfaceLayerApi.toDataAttributeName === "function"
    ? surfaceLayerApi.toDataAttributeName
    : function (key) {
        return String(key || "")
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .replace(/_/g, "-")
          .toLowerCase();
      };

  function ensureSlotNode(root, selector, tagName, className) {
    if (!(root instanceof HTMLElement)) {
      return null;
    }
    var normalizedSelector = String(selector || "").trim();
    var node = normalizedSelector ? root.querySelector(normalizedSelector) : null;
    if (node instanceof HTMLElement) {
      return node;
    }
    node = document.createElement(String(tagName || "div").trim() || "div");
    node.className = String(className || "").trim();
    root.appendChild(node);
    return node;
  }

  function setActionHostPlaceholder(host, placeholderClassName, isPlaceholder) {
    if (!(host instanceof HTMLElement)) {
      return;
    }
    var className = String(placeholderClassName || "").trim();
    if (!className) {
      return;
    }
    if (isPlaceholder) {
      host.classList.add(className);
      return;
    }
    host.classList.remove(className);
  }

  function getPrimaryClassToken(value) {
    var normalized = String(value || "").trim();
    return normalized ? normalized.split(/\s+/)[0] : "";
  }

  function ensureActionSlotHost(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actionCell = settings.actionCell instanceof HTMLElement ? settings.actionCell : null;
    if (!(actionCell instanceof HTMLElement)) {
      return null;
    }
    var hostClassName = String(settings.hostClassName || "").trim();
    var placeholderClassName = String(settings.placeholderClassName || "").trim();
    var nativeSlotClassName = String(settings.nativeSlotClassName || "").trim();
    var customSlotClassName = String(settings.customSlotClassName || "").trim();
    var hostClassToken = getPrimaryClassToken(hostClassName);
    var nativeSlotClassToken = getPrimaryClassToken(nativeSlotClassName);
    var customSlotClassToken = getPrimaryClassToken(customSlotClassName);
    var hostSelector = hostClassToken ? "." + hostClassToken : "";
    var host = hostSelector ? actionCell.querySelector(hostSelector) : null;
    if (!(host instanceof HTMLElement)) {
      host = document.createElement("div");
      host.className = hostClassName;
      actionCell.replaceChildren(host);
    }
    setActionHostPlaceholder(host, placeholderClassName, settings.placeholder !== false);
    var nativeSlot = ensureSlotNode(
      host,
      nativeSlotClassToken ? "." + nativeSlotClassToken : "",
      "span",
      nativeSlotClassName
    );
    var customSlot = ensureSlotNode(
      host,
      customSlotClassToken ? "." + customSlotClassToken : "",
      "span",
      customSlotClassName
    );
    return {
      host: host,
      nativeSlot: nativeSlot,
      customSlot: customSlot,
    };
  }

  function clearInjectedDetailRows(config) {
    var settings = config && typeof config === "object" ? config : {};
    var selector = String(settings.selector || "").trim();
    if (!selector) {
      return;
    }
    Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function (node) {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    });
  }

  function insertInjectedDetailRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    var parentRow = settings.parentRow instanceof HTMLElement ? settings.parentRow : null;
    if (!(parentRow instanceof HTMLElement)) {
      return null;
    }
    var detailRow = document.createElement("tr");
    detailRow.className = String(settings.rowClassName || "").trim();
    var dataset = settings.dataset && typeof settings.dataset === "object" ? settings.dataset : {};
    Object.keys(dataset).forEach(function (key) {
      detailRow.dataset[key] = String(dataset[key] || "");
    });
    var cell = document.createElement("td");
    cell.colSpan = Math.max(Number(settings.colSpan || 0) || parentRow.children.length || 1, 1);
    cell.innerHTML = String(settings.html || "");
    detailRow.appendChild(cell);
    parentRow.insertAdjacentElement("afterend", detailRow);
    return detailRow;
  }

  function buildIconActionButtonMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var action = String(settings.action || "").trim();
    var iconClass = String(settings.iconClass || "").trim();
    var label = String(settings.label || settings.title || "").trim();
    var className = String(settings.className || "o_surface_action_button").trim();
    var data = settings.data && typeof settings.data === "object" ? settings.data : {};
    var attributes = Object.keys(data).map(function (key) {
      return ' data-' + escapeHtml(toDataAttributeName(key)) + '="' + escapeHtml(data[key]) + '"';
    }).join("");
    return (
      '<button type="button" class="' +
      escapeHtml(className) +
      '" data-action="' +
      escapeHtml(action) +
      '" title="' +
      escapeHtml(label) +
      '" aria-label="' +
      escapeHtml(label) +
      '"' +
      attributes +
      ">" +
      '<i class="fa ' + escapeHtml(iconClass) + '" aria-hidden="true"></i>' +
      "</button>"
    );
  }

  function openSurfaceUrl(url, sameWindow) {
    var normalizedUrl = String(url || "").trim();
    if (!normalizedUrl) {
      return;
    }
    if (sameWindow) {
      window.location.assign(normalizedUrl);
      return;
    }
    var anchor = document.createElement("a");
    anchor.href = normalizedUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  Object.assign(surfaceLayerApi, {
    ensureActionSlotHost: ensureActionSlotHost,
    setActionHostPlaceholder: setActionHostPlaceholder,
    clearInjectedDetailRows: clearInjectedDetailRows,
    insertInjectedDetailRow: insertInjectedDetailRow,
    buildIconActionButtonMarkup: buildIconActionButtonMarkup,
    openSurfaceUrl: openSurfaceUrl,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
