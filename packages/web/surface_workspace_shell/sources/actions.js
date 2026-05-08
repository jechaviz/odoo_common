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
  var shared = surfaceLayerApi._shared && typeof surfaceLayerApi._shared === "object"
    ? surfaceLayerApi._shared
    : {};
  surfaceLayerApi._shared = shared;
  var escapeHtml = requireSurfaceLayerFunction(surfaceLayerApi, "escapeHtml");
  var toDataAttributeName = requireSurfaceLayerFunction(surfaceLayerApi, "toDataAttributeName");
  var DEFAULT_COLLAPSIBLE_TOGGLE_SELECTOR = "[data-surface-collapsible-row-toggle='1'], [data-surface-ledger-toggle='1']";
  var DEFAULT_COLLAPSIBLE_DETAIL_ROW_CLASS = "o_surface_collapsible_detail_row";
  var DEFAULT_COLLAPSIBLE_DETAIL_CELL_CLASS = "o_surface_collapsible_detail_cell";
  var DEFAULT_COLLAPSIBLE_DETAIL_PANEL_CLASS = "o_surface_collapsible_detail_panel";
  var DEFAULT_COLLAPSIBLE_PARENT_EXPANDED_CLASS = "o_surface_collapsible_parent--expanded";

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

  function normalizeCollapsibleRowKey(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getCollapsibleRowKey(row, config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.getRowKey === "function") {
      try {
        return normalizeCollapsibleRowKey(settings.getRowKey(row, settings));
      } catch (_error) {}
    }
    if (settings.rowKey != null) {
      return normalizeCollapsibleRowKey(settings.rowKey);
    }
    if (!(row instanceof HTMLElement)) {
      return "";
    }
    return normalizeCollapsibleRowKey(
      row.dataset.surfaceRowKey ||
      row.dataset.surfaceLedgerKey ||
      row.dataset.id ||
      row.dataset.resId ||
      row.getAttribute("data-id") ||
      row.getAttribute("data-res-id") ||
      ""
    );
  }

  function getCollapsibleDetailRows(config) {
    var settings = config && typeof config === "object" ? config : {};
    var root = settings.root instanceof HTMLElement || settings.root instanceof Document
      ? settings.root
      : document;
    return Array.prototype.slice.call(root.querySelectorAll("tr[data-surface-collapsible-detail='1']")).filter(function (row) {
      return row instanceof HTMLTableRowElement;
    });
  }

  function findCollapsibleDetailRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    var rowKey = normalizeCollapsibleRowKey(settings.rowKey || getCollapsibleRowKey(settings.parentRow, settings));
    if (!rowKey) {
      return null;
    }
    var parentRow = settings.parentRow instanceof HTMLElement ? settings.parentRow : null;
    var root = parentRow && parentRow.closest("tbody")
      ? parentRow.closest("tbody")
      : settings.root;
    return getCollapsibleDetailRows({ root: root }).find(function (row) {
      return normalizeCollapsibleRowKey(row.dataset.surfaceRowKey) === rowKey;
    }) || null;
  }

  function syncCollapsibleRowToggleState(parentRow, rowKey, expanded, config) {
    if (!(parentRow instanceof HTMLElement)) {
      return;
    }
    var settings = config && typeof config === "object" ? config : {};
    var selector = String(settings.toggleSelector || DEFAULT_COLLAPSIBLE_TOGGLE_SELECTOR).trim();
    if (!selector) {
      return;
    }
    Array.prototype.slice.call(parentRow.querySelectorAll(selector)).forEach(function (toggle) {
      if (!(toggle instanceof HTMLElement)) {
        return;
      }
      var toggleKey = normalizeCollapsibleRowKey(toggle.dataset.surfaceRowKey || toggle.dataset.surfaceLedgerKey || "");
      if (toggleKey && rowKey && toggleKey !== rowKey) {
        return;
      }
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.dataset.surfaceExpanded = expanded ? "1" : "0";
      var expandedLabel = String(settings.expandedLabel || toggle.dataset.surfaceExpandedLabel || "").trim();
      var collapsedLabel = String(settings.collapsedLabel || toggle.dataset.surfaceCollapsedLabel || "").trim();
      var nextLabel = expanded ? expandedLabel : collapsedLabel;
      if (nextLabel) {
        toggle.setAttribute("aria-label", nextLabel);
        toggle.setAttribute("title", nextLabel);
      }
      var icon = toggle.querySelector("i.fa");
      if (icon instanceof HTMLElement) {
        var expandedIcon = String(settings.expandedIconClass || toggle.dataset.surfaceExpandedIcon || "fa-chevron-down").trim();
        var collapsedIcon = String(settings.collapsedIconClass || toggle.dataset.surfaceCollapsedIcon || "fa-chevron-right").trim();
        String(expandedIcon + " " + collapsedIcon).split(/\s+/).forEach(function (className) {
          if (className) {
            icon.classList.remove(className);
          }
        });
        String(expanded ? expandedIcon : collapsedIcon).split(/\s+/).forEach(function (className) {
          if (className) {
            icon.classList.add(className);
          }
        });
      }
    });
  }

  function buildCollapsibleRowToggleMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var expanded = settings.expanded === true;
    var rowKey = normalizeCollapsibleRowKey(settings.rowKey || settings.key || settings.reference);
    var collapsedLabel = String(settings.collapsedLabel || settings.label || "Expand row details").trim();
    var expandedLabel = String(settings.expandedLabel || "Collapse row details").trim();
    return buildIconActionButtonMarkup({
      action: String(settings.action || "toggle-detail").trim(),
      iconClass: String(settings.iconClass || (expanded ? "fa-chevron-down" : "fa-chevron-right")).trim(),
      label: expanded ? expandedLabel : collapsedLabel,
      className: joinClassNames([
        "o_surface_collapsible_row_toggle",
        settings.className,
      ]),
      data: Object.assign({}, settings.data, {
        surfaceCollapsibleRowToggle: "1",
        surfaceLedgerToggle: "1",
        surfaceRowKey: rowKey,
        surfaceExpanded: expanded ? "1" : "0",
        surfaceCollapsedLabel: collapsedLabel,
        surfaceExpandedLabel: expandedLabel,
        surfaceCollapsedIcon: String(settings.collapsedIconClass || "fa-chevron-right").trim(),
        surfaceExpandedIcon: String(settings.expandedIconClass || "fa-chevron-down").trim(),
      }),
      attributes: Object.assign({}, settings.attributes, {
        "aria-expanded": expanded ? "true" : "false",
      }),
    });
  }

  function ensureCollapsibleDetailRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    var parentRow = settings.parentRow instanceof HTMLElement ? settings.parentRow : null;
    if (!(parentRow instanceof HTMLElement)) {
      return null;
    }
    var rowKey = normalizeCollapsibleRowKey(settings.rowKey || getCollapsibleRowKey(parentRow, settings));
    if (!rowKey) {
      return null;
    }
    var rowClassName = joinClassNames([
      DEFAULT_COLLAPSIBLE_DETAIL_ROW_CLASS,
      settings.rowClassName,
    ]);
    var cellClassName = joinClassNames([
      DEFAULT_COLLAPSIBLE_DETAIL_CELL_CLASS,
      settings.cellClassName,
    ]);
    var panelClassName = joinClassNames([
      DEFAULT_COLLAPSIBLE_DETAIL_PANEL_CLASS,
      settings.panelClassName,
    ]);
    var detailRow = findCollapsibleDetailRow(Object.assign({}, settings, {
      parentRow: parentRow,
      rowKey: rowKey,
    }));
    if (!(detailRow instanceof HTMLTableRowElement)) {
      detailRow = insertInjectedDetailRow({
        parentRow: parentRow,
        rowClassName: rowClassName,
        colSpan: settings.colSpan,
        dataset: Object.assign({}, settings.dataset, {
          surfaceCollapsibleDetail: "1",
          surfaceRowKey: rowKey,
        }),
        html: "",
      });
    }
    if (!(detailRow instanceof HTMLTableRowElement)) {
      return null;
    }
    detailRow.className = rowClassName;
    detailRow.dataset.surfaceCollapsibleDetail = "1";
    detailRow.dataset.surfaceRowKey = rowKey;
    detailRow.dataset.surfaceExpanded = "1";
    var cell = detailRow.cells && detailRow.cells.length ? detailRow.cells[0] : null;
    if (!(cell instanceof HTMLTableCellElement)) {
      cell = document.createElement("td");
      detailRow.replaceChildren(cell);
    }
    cell.className = cellClassName;
    cell.colSpan = Math.max(Number(settings.colSpan || 0) || parentRow.children.length || 1, 1);
    var html = String(settings.html || "");
    cell.innerHTML = settings.wrap === false
      ? html
      : '<div class="' + escapeHtml(panelClassName) + '">' + html + "</div>";
    parentRow.classList.add(String(settings.parentExpandedClassName || DEFAULT_COLLAPSIBLE_PARENT_EXPANDED_CLASS).trim());
    parentRow.dataset.surfaceExpanded = "1";
    syncCollapsibleRowToggleState(parentRow, rowKey, true, settings);
    return detailRow;
  }

  function removeCollapsibleDetailRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    var parentRow = settings.parentRow instanceof HTMLElement ? settings.parentRow : null;
    var rowKey = normalizeCollapsibleRowKey(settings.rowKey || getCollapsibleRowKey(parentRow, settings));
    var detailRow = findCollapsibleDetailRow(Object.assign({}, settings, {
      parentRow: parentRow,
      rowKey: rowKey,
    }));
    if (detailRow instanceof HTMLElement) {
      detailRow.remove();
    }
    if (parentRow instanceof HTMLElement) {
      parentRow.classList.remove(String(settings.parentExpandedClassName || DEFAULT_COLLAPSIBLE_PARENT_EXPANDED_CLASS).trim());
      parentRow.dataset.surfaceExpanded = "0";
      syncCollapsibleRowToggleState(parentRow, rowKey, false, settings);
    }
    return true;
  }

  function toggleCollapsibleDetailRow(config) {
    var settings = config && typeof config === "object" ? config : {};
    var parentRow = settings.parentRow instanceof HTMLElement ? settings.parentRow : null;
    if (!(parentRow instanceof HTMLElement)) {
      return null;
    }
    var rowKey = normalizeCollapsibleRowKey(settings.rowKey || getCollapsibleRowKey(parentRow, settings));
    var existing = findCollapsibleDetailRow(Object.assign({}, settings, {
      parentRow: parentRow,
      rowKey: rowKey,
    }));
    var forceExpanded = Object.prototype.hasOwnProperty.call(settings, "expanded")
      ? settings.expanded === true
      : !(existing instanceof HTMLElement);
    if (!forceExpanded) {
      removeCollapsibleDetailRow(Object.assign({}, settings, {
        parentRow: parentRow,
        rowKey: rowKey,
      }));
      return { expanded: false, row: null, rowKey: rowKey };
    }
    return {
      expanded: true,
      row: ensureCollapsibleDetailRow(Object.assign({}, settings, {
        parentRow: parentRow,
        rowKey: rowKey,
      })),
      rowKey: rowKey,
    };
  }

  function installCollapsibleRowController(config) {
    var settings = config && typeof config === "object" ? Object.assign({}, config) : {};
    var controllerKey = String(settings.controllerKey || settings.key || "default").trim();
    if (!controllerKey) {
      return null;
    }
    if (!(shared.collapsibleRowControllers && typeof shared.collapsibleRowControllers === "object")) {
      shared.collapsibleRowControllers = Object.create(null);
    }
    var previous = shared.collapsibleRowControllers[controllerKey];
    if (previous && previous.root && typeof previous.root.removeEventListener === "function" && typeof previous.listener === "function") {
      previous.root.removeEventListener("click", previous.listener, true);
    }
    var root = settings.root instanceof HTMLElement ? settings.root : document;
    var rowSelector = String(settings.rowSelector || "tr.o_data_row").trim() || "tr.o_data_row";
    var toggleSelector = String(settings.toggleSelector || DEFAULT_COLLAPSIBLE_TOGGLE_SELECTOR).trim();
    var renderDetail = typeof settings.renderDetail === "function"
      ? settings.renderDetail
      : function () { return settings.detailHtml || ""; };
    var listener = function (event) {
      var target = event.target instanceof HTMLElement ? event.target.closest(toggleSelector) : null;
      if (!(target instanceof HTMLElement) || !(root === document || root.contains(target))) {
        return;
      }
      var parentRow = target.closest(rowSelector);
      if (!(parentRow instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      var rowKey = normalizeCollapsibleRowKey(target.dataset.surfaceRowKey || getCollapsibleRowKey(parentRow, settings));
      var existing = findCollapsibleDetailRow(Object.assign({}, settings, {
        parentRow: parentRow,
        rowKey: rowKey,
      }));
      if (existing instanceof HTMLElement) {
        removeCollapsibleDetailRow(Object.assign({}, settings, {
          parentRow: parentRow,
          rowKey: rowKey,
        }));
        if (typeof settings.onToggle === "function") {
          settings.onToggle({ expanded: false, parentRow: parentRow, rowKey: rowKey, target: target, event: event });
        }
        return;
      }
      target.dataset.surfaceBusy = "1";
      Promise.resolve(renderDetail(parentRow, {
        rowKey: rowKey,
        target: target,
        event: event,
        settings: settings,
      })).then(function (html) {
        var result = toggleCollapsibleDetailRow(Object.assign({}, settings, {
          parentRow: parentRow,
          rowKey: rowKey,
          html: html,
          expanded: true,
        }));
        if (typeof settings.onToggle === "function") {
          settings.onToggle(Object.assign({ parentRow: parentRow, target: target, event: event }, result || {}));
        }
      }).finally(function () {
        target.dataset.surfaceBusy = "0";
      });
    };
    root.addEventListener("click", listener, true);
    shared.collapsibleRowControllers[controllerKey] = {
      listener: listener,
      root: root,
      settings: settings,
    };
    return {
      key: controllerKey,
      destroy: function () {
        root.removeEventListener("click", listener, true);
        if (shared.collapsibleRowControllers[controllerKey]) {
          delete shared.collapsibleRowControllers[controllerKey];
        }
      },
    };
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
    buildCollapsibleRowToggleMarkup: buildCollapsibleRowToggleMarkup,
    ensureCollapsibleDetailRow: ensureCollapsibleDetailRow,
    findCollapsibleDetailRow: findCollapsibleDetailRow,
    getCollapsibleRowKey: getCollapsibleRowKey,
    installCollapsibleRowController: installCollapsibleRowController,
    removeCollapsibleDetailRow: removeCollapsibleDetailRow,
    toggleCollapsibleDetailRow: toggleCollapsibleDetailRow,
    buildIconActionButtonMarkup: buildIconActionButtonMarkup,
    buildPreviewActionButtonMarkup: buildPreviewActionButtonMarkup,
    buildPreviewActionGroupMarkup: buildPreviewActionGroupMarkup,
    mountPreviewActionSlots: mountPreviewActionSlots,
    openSurfaceUrl: openSurfaceUrl,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
