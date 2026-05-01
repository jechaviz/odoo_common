(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace actions.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before surface workspace actions."
      );
    }
    return candidate;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var escapeHtml = requireSurfaceLayerFunction(surfaceLayerApi, "escapeHtml");
  var toDataAttributeName = requireSurfaceLayerFunction(surfaceLayerApi, "toDataAttributeName");

  function joinClassNames(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : [values]).reduce(function (tokens, value) {
      String(value || "").split(/\s+/).forEach(function (token) {
        var normalizedToken = String(token || "").trim();
        if (!normalizedToken || seen[normalizedToken]) {
          return;
        }
        seen[normalizedToken] = true;
        tokens.push(normalizedToken);
      });
      return tokens;
    }, []).join(" ");
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

  function buildAttributeMarkup(attributes) {
    var source = attributes && typeof attributes === "object" ? attributes : {};
    return Object.keys(source).map(function (key) {
      var attributeName = String(key || "").trim();
      if (!attributeName) {
        return "";
      }
      var value = source[key];
      if (value == null || value === false) {
        return "";
      }
      if (value === true) {
        return " " + escapeHtml(attributeName);
      }
      return ' ' + escapeHtml(attributeName) + '="' + escapeHtml(value) + '"';
    }).join("");
  }

  function resolveSurfaceFlagAttributeValue(value) {
    if (value === false || value == null || value === "") {
      return "";
    }
    return value === true ? "1" : String(value);
  }

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
    var classNames = String(placeholderClassName || "").trim().split(/\s+/).filter(Boolean);
    if (!classNames.length) {
      return;
    }
    if (isPlaceholder) {
      host.classList.add.apply(host.classList, classNames);
      return;
    }
    host.classList.remove.apply(host.classList, classNames);
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
    var dataAttributes = Object.keys(data).map(function (key) {
      return ' data-' + escapeHtml(toDataAttributeName(key)) + '="' + escapeHtml(data[key]) + '"';
    }).join("");
    var attributes = buildAttributeMarkup(settings.attributes);
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
      dataAttributes +
      attributes +
      ">" +
      '<i class="fa ' + escapeHtml(iconClass) + '" aria-hidden="true"></i>' +
      "</button>"
    );
  }

  function buildPreviewActionButtonMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var attributes = Object.assign({}, settings.attributes);
    var surfaceActionValue = resolveSurfaceFlagAttributeValue(
      settings.surfaceAction === false ? false : (settings.surfaceAction || true)
    );
    var surfacePreviewValue = resolveSurfaceFlagAttributeValue(settings.surfacePreview);
    if (
      surfaceActionValue &&
      !Object.prototype.hasOwnProperty.call(attributes, "data-surface-action")
    ) {
      attributes["data-surface-action"] = surfaceActionValue;
    }
    if (
      surfacePreviewValue &&
      !Object.prototype.hasOwnProperty.call(attributes, "data-surface-preview")
    ) {
      attributes["data-surface-preview"] = surfacePreviewValue;
    }
    return buildIconActionButtonMarkup(Object.assign({}, settings, {
      className: joinClassNames([
        "o_surface_record_preview_button",
        "o_surface_action_button",
        settings.className,
      ]),
      attributes: attributes,
    }));
  }

  function buildPreviewActionGroupMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actionEntries = Array.isArray(settings.actions) ? settings.actions : [];
    var buttonDefaults = settings.buttonDefaults && typeof settings.buttonDefaults === "object"
      ? settings.buttonDefaults
      : {};
    var markup = actionEntries.map(function (entry) {
      if (entry == null || entry === false) {
        return "";
      }
      if (typeof entry === "string") {
        return entry;
      }
      if (!(entry && typeof entry === "object") || entry.visible === false) {
        return "";
      }
      if (entry.markup != null) {
        return String(entry.markup || "");
      }
      return buildPreviewActionButtonMarkup(Object.assign({}, buttonDefaults, entry));
    }).join("");
    if (!markup) {
      return String(settings.emptyMarkup || "");
    }
    if (settings.wrap === false) {
      return markup;
    }
    return (
      '<div class="' +
      escapeHtml(joinClassNames([
        "o_surface_record_preview_actions",
        settings.className,
      ])) +
      '">' +
      markup +
      "</div>"
    );
  }

  function ensurePreviewActionSlotHost(config) {
    var settings = config && typeof config === "object" ? config : {};
    return ensureActionSlotHost(Object.assign({}, settings, {
      placeholder: Object.prototype.hasOwnProperty.call(settings, "placeholder")
        ? settings.placeholder
        : false,
      hostClassName: joinClassNames([
        "o_surface_record_preview_actions",
        settings.hostClassName,
      ]),
      placeholderClassName: joinClassNames([
        "o_surface_record_preview_actions--placeholder",
        settings.placeholderClassName,
      ]),
      nativeSlotClassName: joinClassNames([
        "o_surface_record_preview_actions_slot",
        "o_surface_record_preview_actions_slot--native",
        settings.nativeSlotClassName,
      ]),
      customSlotClassName: joinClassNames([
        "o_surface_record_preview_actions_slot",
        "o_surface_record_preview_actions_slot--custom",
        settings.customSlotClassName,
      ]),
    }));
  }

  function mountPreviewActionSlots(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actionCell = settings.actionCell instanceof HTMLElement ? settings.actionCell : null;
    if (!(actionCell instanceof HTMLElement)) {
      return null;
    }
    var actionEntries = Array.isArray(settings.actions) ? settings.actions : null;
    var nativeButtonSelector = String(settings.nativeButtonSelector || "").trim();
    var shouldSyncNativeButtons = Array.isArray(settings.nativeButtons) || !!nativeButtonSelector;
    var nativeButtons = Array.isArray(settings.nativeButtons)
      ? settings.nativeButtons.filter(function (button) {
          return button instanceof HTMLElement;
        })
      : nativeButtonSelector
      ? Array.prototype.slice.call(actionCell.querySelectorAll(nativeButtonSelector)).filter(function (button) {
          return button instanceof HTMLElement && !button.closest(".o_surface_record_preview_actions_slot--custom");
        })
      : [];
    var slots = ensurePreviewActionSlotHost(settings);
    if (!(slots && slots.nativeSlot instanceof HTMLElement && slots.customSlot instanceof HTMLElement)) {
      return null;
    }
    if (typeof settings.decorateNativeButton === "function") {
      nativeButtons.forEach(function (button, index) {
        try {
          settings.decorateNativeButton(button, index, settings, slots);
        } catch (_error) {}
      });
    }
    if (shouldSyncNativeButtons && slots.nativeSlot instanceof HTMLElement) {
      slots.nativeSlot.replaceChildren();
      nativeButtons.forEach(function (button) {
        slots.nativeSlot.appendChild(button);
      });
    }
    var nextCustomMarkup = null;
    if (settings.customMarkup != null) {
      nextCustomMarkup = String(settings.customMarkup || "");
    } else if (Array.isArray(actionEntries)) {
      nextCustomMarkup = buildPreviewActionGroupMarkup(Object.assign({}, settings, {
        actions: actionEntries,
        wrap: false,
      }));
    }
    if (nextCustomMarkup != null) {
      syncInnerHtml(slots.customSlot, nextCustomMarkup);
    }
    var hasNativeButtons = shouldSyncNativeButtons
      ? !!nativeButtons.length
      : !!String(slots.nativeSlot.innerHTML || "").trim();
    var hasCustomMarkup = !!String(slots.customSlot.innerHTML || "").trim();
    var placeholderClassName = joinClassNames([
      "o_surface_record_preview_actions--placeholder",
      settings.placeholderClassName,
    ]);
    setActionHostPlaceholder(
      slots.host,
      placeholderClassName,
      !hasNativeButtons && !hasCustomMarkup
    );
    return Object.assign({
      actionCell: actionCell,
      nativeButtons: nativeButtons,
      hasNativeButtons: hasNativeButtons,
      hasCustomMarkup: hasCustomMarkup,
    }, slots);
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
    ensurePreviewActionSlotHost: ensurePreviewActionSlotHost,
    setActionHostPlaceholder: setActionHostPlaceholder,
    clearInjectedDetailRows: clearInjectedDetailRows,
    insertInjectedDetailRow: insertInjectedDetailRow,
    buildIconActionButtonMarkup: buildIconActionButtonMarkup,
    buildPreviewActionButtonMarkup: buildPreviewActionButtonMarkup,
    buildPreviewActionGroupMarkup: buildPreviewActionGroupMarkup,
    mountPreviewActionSlots: mountPreviewActionSlots,
    openSurfaceUrl: openSurfaceUrl,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
