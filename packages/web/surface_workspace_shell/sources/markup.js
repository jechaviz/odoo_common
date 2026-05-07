(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace markup.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before surface workspace markup."
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

  function buildAttributeMarkup(attributes) {
    var source = attributes && typeof attributes === "object" ? attributes : {};
    return Object.keys(source).map(function (key) {
      var attributeName = String(key || "").trim();
      var value = source[key];
      if (!attributeName || value == null || value === false) {
        return "";
      }
      if (value === true) {
        return " " + escapeHtml(attributeName);
      }
      return ' ' + escapeHtml(attributeName) + '="' + escapeHtml(value) + '"';
    }).join("");
  }

  function renderMarkupEntry(entry, renderer) {
    if (entry == null || entry === false) {
      return "";
    }
    if (typeof entry === "string") {
      return entry;
    }
    return typeof renderer === "function" ? String(renderer(entry) || "") : "";
  }

  function renderMarkupList(entries, renderer) {
    return (Array.isArray(entries) ? entries : []).map(function (entry) {
      return renderMarkupEntry(entry, renderer);
    }).filter(Boolean).join("");
  }

  function normalizeStatusTone(value) {
    var normalized = String(value || "").trim().toLowerCase();
    return normalized || "neutral";
  }

  function buildPremiumButtonMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var tagName = String(settings.tagName || (settings.href ? "a" : "button")).trim().toLowerCase() === "a"
      ? "a"
      : "button";
    var label = String(settings.label || settings.title || "").trim();
    var iconMarkup = settings.iconMarkup != null
      ? String(settings.iconMarkup || "")
      : settings.iconClass
      ? '<i class="' + escapeHtml(String(settings.iconClass || "").trim()) + '" aria-hidden="true"></i>'
      : "";
    var className = joinClassNames([
      "o_surface_premium_button",
      settings.variant ? "o_surface_premium_button--" + String(settings.variant || "").trim() : "",
      settings.className,
    ]);
    var attributes = Object.assign({}, settings.attributes);
    if (tagName === "button" && !Object.prototype.hasOwnProperty.call(attributes, "type")) {
      attributes.type = "button";
    }
    if (tagName === "a" && settings.href && !Object.prototype.hasOwnProperty.call(attributes, "href")) {
      attributes.href = String(settings.href || "").trim();
    }
    if (label && !Object.prototype.hasOwnProperty.call(attributes, "aria-label")) {
      attributes["aria-label"] = label;
    }
    var dataMarkup = buildDataAttributes(settings.data);
    return (
      "<" + tagName +
      ' class="' + escapeHtml(className) + '"' +
      buildAttributeMarkup(attributes) +
      dataMarkup +
      ">" +
      iconMarkup +
      (label ? '<span class="o_surface_premium_button__label">' + escapeHtml(label) + "</span>" : "") +
      "</" + tagName + ">"
    );
  }

  function buildDataAttributes(attributes) {
    var source = attributes && typeof attributes === "object" ? attributes : {};
    return Object.keys(source).map(function (key) {
      return (
        ' data-' +
        escapeHtml(toDataAttributeName(key)) +
        '="' +
        escapeHtml(source[key]) +
        '"'
      );
    }).join("");
  }

  function buildActionStripMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var wrapperClassName = String(settings.wrapperClassName || "").trim();
    var nativeSlotClassName = String(settings.nativeSlotClassName || "").trim();
    var customSlotClassName = String(settings.customSlotClassName || "").trim();
    var nativeMarkup = String(settings.nativeMarkup || "");
    var customMarkup = String(settings.customMarkup || "");
    return (
      '<div class="' + escapeHtml(wrapperClassName) + '">' +
      (nativeMarkup
        ? '<span class="' + escapeHtml(nativeSlotClassName) + '">' + nativeMarkup + "</span>"
        : "") +
      '<span class="' + escapeHtml(customSlotClassName) + '">' + customMarkup + "</span>" +
      "</div>"
    );
  }

  function buildDetailTableMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var wrapperClassName = String(settings.wrapperClassName || "").trim();
    var tableClassName = String(settings.tableClassName || "").trim();
    var headerRowClassName = String(settings.headerRowClassName || "").trim();
    var rowClassName = String(settings.rowClassName || "").trim();
    var columns = Array.isArray(settings.columns) ? settings.columns : [];
    var rows = Array.isArray(settings.rows) ? settings.rows : [];
    var rowDataAttributes = typeof settings.rowDataAttributes === "function"
      ? settings.rowDataAttributes
      : function () { return {}; };

    var headerMarkup = columns.map(function (column) {
      var entry = column && typeof column === "object" ? column : {};
      var headerClassName = String(entry.headerClassName || "").trim();
      var label = String(entry.label || "").trim();
      return '<th class="' + escapeHtml(headerClassName) + '">' + escapeHtml(label) + "</th>";
    }).join("");

    var rowMarkup = rows.map(function (row, rowIndex) {
      var attributes = buildDataAttributes(rowDataAttributes(row, rowIndex));
      var cells = columns.map(function (column) {
        var entry = column && typeof column === "object" ? column : {};
        var cellClassName = String(entry.cellClassName || entry.headerClassName || "").trim();
        var rawValue = typeof entry.render === "function"
          ? entry.render(row, rowIndex, entry)
          : row && entry.key
            ? row[entry.key]
            : "";
        var cellMarkup = entry.allowHtml ? String(rawValue || "") : escapeHtml(rawValue);
        return '<td class="' + escapeHtml(cellClassName) + '">' + cellMarkup + "</td>";
      }).join("");
      return '<tr class="' + escapeHtml(rowClassName) + '"' + attributes + ">" + cells + "</tr>";
    }).join("");

    return (
      '<div class="' + escapeHtml(wrapperClassName) + '">' +
      '  <table class="' + escapeHtml(tableClassName) + '">' +
      "    <thead>" +
      '      <tr class="' + escapeHtml(headerRowClassName) + '">' +
      headerMarkup +
      "      </tr>" +
      "    </thead>" +
      "    <tbody>" +
      rowMarkup +
      "    </tbody>" +
      "  </table>" +
      "</div>"
    );
  }

  function buildPremiumStatusChipMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var label = String(settings.label || settings.text || "").trim();
    if (!label) {
      return "";
    }
    var tone = normalizeStatusTone(
      settings.tone || settings.status || settings.state
    );
    var className = joinClassNames([
      "o_surface_premium_status_chip",
      tone && tone !== "neutral" ? "o_surface_premium_status_chip--" + tone : "",
      settings.className,
    ]);
    var attributes = Object.assign({}, settings.attributes);
    if (tone && tone !== "neutral" && !Object.prototype.hasOwnProperty.call(attributes, "data-status")) {
      attributes["data-status"] = tone;
    }
    return (
      '<span class="' + escapeHtml(className) + '"' +
      buildAttributeMarkup(attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      (settings.dot === false ? "" : '<span class="o_surface_premium_status_chip__dot" aria-hidden="true"></span>') +
      '<span class="o_surface_premium_status_chip__label">' + escapeHtml(label) + "</span>" +
      "</span>"
    );
  }

  function buildPremiumCommandBarMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var mode = String(settings.mode || settings.variant || "").trim();
    var isCompact = settings.compact === true || mode === "compact";
    var showHeader = settings.showHeader !== false;
    var hideEyebrow = !showHeader || settings.hideEyebrow === true || settings.showEyebrow === false;
    var hideTitle = !showHeader || settings.hideTitle === true || settings.showTitle === false;
    var hideDescription = !showHeader ||
      settings.hideDescription === true ||
      settings.showDescription === false ||
      (isCompact && settings.hideDescription !== false);
    var className = joinClassNames([
      "o_surface_premium_command_bar",
      isCompact ? "o_surface_premium_command_bar--compact" : "",
      !showHeader ? "o_surface_premium_command_bar--no-header" : "",
      settings.className,
    ]);
    var title = hideTitle ? "" : String(settings.title || "").trim();
    var eyebrow = hideEyebrow ? "" : String(settings.eyebrow || "").trim();
    var description = hideDescription ? "" : String(settings.description || settings.subtitle || "").trim();
    var contextMarkup = String(settings.contextMarkup || "").trim();
    var actionsMarkup = renderMarkupList(settings.actions, function (entry) {
      return entry && typeof entry === "object"
        ? buildPremiumButtonMarkup(Object.assign({
            className: "o_surface_premium_command_bar__button",
          }, entry))
        : "";
    });
    var filtersMarkup = renderMarkupList(settings.filters, function (entry) {
      return entry && typeof entry === "object"
        ? buildPremiumButtonMarkup(Object.assign({
            className: "o_surface_premium_command_bar__button",
            variant: "ghost",
          }, entry))
        : "";
    });
    var tabsMarkup = renderMarkupList(settings.tabs, function (entry) {
      if (!(entry && typeof entry === "object")) {
        return "";
      }
      var tabAttributes = Object.assign({}, entry.attributes);
      var tabData = Object.assign({}, entry.data);
      var tabKey = String(
        tabData.surfaceTabKey ||
        tabData.key ||
        entry.key ||
        entry.value ||
        entry.name ||
        entry.id ||
        ""
      ).trim();
      if (!Object.prototype.hasOwnProperty.call(tabAttributes, "type")) {
        tabAttributes.type = "button";
      }
      if (!Object.prototype.hasOwnProperty.call(tabAttributes, "role")) {
        tabAttributes.role = "tab";
      }
      if (!Object.prototype.hasOwnProperty.call(tabAttributes, "aria-selected")) {
        tabAttributes["aria-selected"] = entry.active === true ? "true" : "false";
      }
      if (entry.active === true && !Object.prototype.hasOwnProperty.call(tabAttributes, "aria-current")) {
        tabAttributes["aria-current"] = "page";
      }
      if (!Object.prototype.hasOwnProperty.call(tabAttributes, "tabindex")) {
        tabAttributes.tabindex = entry.active === true ? "0" : "-1";
      }
      if (!Object.prototype.hasOwnProperty.call(tabData, "surfaceTab")) {
        tabData.surfaceTab = "1";
      }
      if (tabKey && !Object.prototype.hasOwnProperty.call(tabData, "surfaceTabKey")) {
        tabData.surfaceTabKey = tabKey;
      }
      if (!Object.prototype.hasOwnProperty.call(tabData, "surfaceTabState")) {
        tabData.surfaceTabState = entry.active === true ? "active" : "inactive";
      }
      if (!Object.prototype.hasOwnProperty.call(tabData, "surfaceToolbarControl")) {
        tabData.surfaceToolbarControl = "tab";
      }
      if (!Object.prototype.hasOwnProperty.call(tabData, "surfaceIntent")) {
        tabData.surfaceIntent = "tab";
      }
      if (!Object.prototype.hasOwnProperty.call(tabData, "surfaceNav")) {
        tabData.surfaceNav = "tab";
      }
      return (
        '<button class="' +
        escapeHtml(joinClassNames([
          "o_surface_premium_command_bar__tab",
          entry.active === true ? "is-active" : "",
          entry.className,
        ])) +
        '"' +
        buildAttributeMarkup(tabAttributes) +
        buildDataAttributes(tabData) +
        ">" +
        escapeHtml(entry.label || entry.text || "") +
        "</button>"
      );
    });
    var statusMarkup = renderMarkupList(settings.statusChips, function (entry) {
      return entry && typeof entry === "object"
        ? buildPremiumStatusChipMarkup(entry)
        : "";
    });
    return (
      '<section class="' + escapeHtml(className) + '"' +
      buildAttributeMarkup(settings.attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      '<div class="o_surface_premium_command_bar__row">' +
      '  <div class="o_surface_premium_command_bar__context">' +
      (eyebrow ? '<div class="o_surface_premium_command_bar__eyebrow">' + escapeHtml(eyebrow) + "</div>" : "") +
      (title ? '<div class="o_surface_premium_command_bar__title">' + escapeHtml(title) + "</div>" : "") +
      (description ? '<div class="o_surface_premium_command_bar__description">' + escapeHtml(description) + "</div>" : "") +
      contextMarkup +
      (statusMarkup ? '<div class="o_surface_premium_cluster">' + statusMarkup + "</div>" : "") +
      "  </div>" +
      (actionsMarkup ? '<div class="o_surface_premium_command_bar__actions">' + actionsMarkup + "</div>" : "") +
      "</div>" +
      (filtersMarkup ? '<div class="o_surface_premium_command_bar__filters">' + filtersMarkup + "</div>" : "") +
      (tabsMarkup ? '<div class="o_surface_premium_command_bar__tabs" role="tablist">' + tabsMarkup + "</div>" : "") +
      String(settings.footerMarkup || settings.bodyMarkup || "") +
      "</section>"
    );
  }

  function buildPremiumMetricMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var label = String(settings.label || "").trim();
    var value = settings.value == null ? "" : String(settings.value);
    if (!label && !value) {
      return "";
    }
    var meta = String(settings.meta || "").trim();
    var trendTone = normalizeStatusTone(settings.trendTone || settings.trend || settings.deltaTone);
    var trendLabel = String(settings.trendLabel || settings.deltaLabel || "").trim();
    return (
      '<article class="' +
      escapeHtml(joinClassNames([
        "o_surface_premium_metric",
        settings.accent ? "o_surface_premium_metric--accent" : "",
        settings.className,
      ])) +
      '"' +
      buildAttributeMarkup(settings.attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      (label ? '<div class="o_surface_premium_metric__label">' + escapeHtml(label) + "</div>" : "") +
      (value ? '<strong class="o_surface_premium_metric__value">' + escapeHtml(value) + "</strong>" : "") +
      ((meta || trendLabel)
        ? '<div class="o_surface_premium_metric__meta">' +
          (meta ? '<span>' + escapeHtml(meta) + "</span>" : "") +
          (trendLabel
            ? '<span class="' + escapeHtml(joinClassNames([
                "o_surface_premium_metric__trend",
                trendTone && trendTone !== "neutral"
                  ? "o_surface_premium_metric__trend--" + trendTone
                  : "o_surface_premium_metric__trend--flat",
              ])) + '">' + escapeHtml(trendLabel) + "</span>"
            : "") +
          "</div>"
        : "") +
      "</article>"
    );
  }

  function buildPremiumMetricStripMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var metricsMarkup = renderMarkupList(settings.metrics, function (entry) {
      return entry && typeof entry === "object"
        ? buildPremiumMetricMarkup(entry)
        : "";
    });
    if (!metricsMarkup) {
      return "";
    }
    return (
      '<section class="' +
      escapeHtml(joinClassNames([
        "o_surface_premium_metric_strip",
        settings.className,
      ])) +
      '"' +
      buildAttributeMarkup(settings.attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      metricsMarkup +
      "</section>"
    );
  }

  function buildPremiumEmptyStateMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var title = String(settings.title || settings.label || "").trim();
    var message = String(settings.message || settings.description || "").trim();
    var actionsMarkup = renderMarkupList(settings.actions, function (entry) {
      return entry && typeof entry === "object"
        ? buildPremiumButtonMarkup(Object.assign({
            variant: entry.variant || "ghost",
          }, entry))
        : "";
    });
    if (!title && !message && !actionsMarkup && !settings.iconMarkup) {
      return "";
    }
    return (
      '<section class="' +
      escapeHtml(joinClassNames([
        "o_surface_premium_empty_state",
        settings.className,
      ])) +
      '"' +
      buildAttributeMarkup(settings.attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      (settings.iconMarkup != null
        ? '<div class="o_surface_premium_empty_state__icon" aria-hidden="true">' + String(settings.iconMarkup || "") + "</div>"
        : "") +
      '<div class="o_surface_premium_empty_state__content">' +
      (title ? '<div class="o_surface_premium_empty_state__title">' + escapeHtml(title) + "</div>" : "") +
      (message ? '<p class="o_surface_premium_empty_state__message">' + escapeHtml(message) + "</p>" : "") +
      "</div>" +
      (actionsMarkup ? '<div class="o_surface_premium_empty_state__actions">' + actionsMarkup + "</div>" : "") +
      "</section>"
    );
  }

  function buildPremiumValidationRailMarkup(config) {
    var settings = config && typeof config === "object" ? config : {};
    var itemsMarkup = renderMarkupList(settings.items, function (entry) {
      if (!(entry && typeof entry === "object")) {
        return "";
      }
      var severity = normalizeStatusTone(entry.severity || entry.tone || entry.status);
      var actionMarkup = "";
      if (entry.actionMarkup != null) {
        actionMarkup = String(entry.actionMarkup || "");
      } else if (entry.action && typeof entry.action === "object") {
        var actionTagName = String(entry.action.tagName || (entry.action.href ? "a" : "button")).trim();
        var actionAttributes = Object.assign({}, entry.action.attributes);
        if (actionTagName !== "a" && !Object.prototype.hasOwnProperty.call(actionAttributes, "type")) {
          actionAttributes.type = "button";
        }
        if (actionTagName === "a" && entry.action.href && !Object.prototype.hasOwnProperty.call(actionAttributes, "href")) {
          actionAttributes.href = String(entry.action.href || "").trim();
        }
        actionMarkup = (
          "<" + escapeHtml(actionTagName) +
          ' class="' + escapeHtml(joinClassNames([
            "o_surface_premium_validation_rail__action",
            entry.action.className,
          ])) + '"' +
          buildAttributeMarkup(actionAttributes) +
          buildDataAttributes(entry.action.data) +
          ">" +
          escapeHtml(entry.action.label || entry.action.text || "") +
          "</" + escapeHtml(actionTagName) + ">"
        );
      }
      return (
        '<li class="' +
        escapeHtml(joinClassNames([
          "o_surface_premium_validation_rail__item",
          severity && severity !== "neutral" ? "o_surface_premium_validation_rail__item--" + severity : "",
          entry.className,
        ])) +
        '" data-severity="' + escapeHtml(severity || "info") + '">' +
        '<span class="o_surface_premium_validation_rail__marker" aria-hidden="true"></span>' +
        '<div class="o_surface_premium_validation_rail__content">' +
        (entry.label ? '<div class="o_surface_premium_validation_rail__label">' + escapeHtml(entry.label) + "</div>" : "") +
        (entry.message ? '<p class="o_surface_premium_validation_rail__message">' + escapeHtml(entry.message) + "</p>" : "") +
        "</div>" +
        actionMarkup +
        "</li>"
      );
    });
    if (!itemsMarkup && !settings.title) {
      return "";
    }
    return (
      '<section class="' +
      escapeHtml(joinClassNames([
        "o_surface_premium_validation_rail",
        settings.className,
      ])) +
      '"' +
      buildAttributeMarkup(settings.attributes) +
      buildDataAttributes(settings.data) +
      ">" +
      (settings.title
        ? '<div class="o_surface_premium_validation_rail__title">' + escapeHtml(settings.title) + "</div>"
        : "") +
      (itemsMarkup ? '<ul class="o_surface_premium_validation_rail__list">' + itemsMarkup + "</ul>" : "") +
      String(settings.footerMarkup || "") +
      "</section>"
    );
  }

  Object.assign(surfaceLayerApi, {
    buildActionStripMarkup: buildActionStripMarkup,
    buildDetailTableMarkup: buildDetailTableMarkup,
    buildPremiumButtonMarkup: buildPremiumButtonMarkup,
    buildPremiumStatusChipMarkup: buildPremiumStatusChipMarkup,
    buildPremiumCommandBarMarkup: buildPremiumCommandBarMarkup,
    buildPremiumMetricMarkup: buildPremiumMetricMarkup,
    buildPremiumMetricStripMarkup: buildPremiumMetricStripMarkup,
    buildPremiumEmptyStateMarkup: buildPremiumEmptyStateMarkup,
    buildPremiumValidationRailMarkup: buildPremiumValidationRailMarkup,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
