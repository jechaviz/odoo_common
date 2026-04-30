(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};

  function clampNumber(value, minimum, maximum) {
    var numericValue = Number(value || 0) || 0;
    if (Number.isFinite(Number(maximum)) && Number(maximum) > 0) {
      numericValue = Math.min(numericValue, Number(maximum));
    }
    if (Number.isFinite(Number(minimum)) && Number(minimum) > 0) {
      numericValue = Math.max(numericValue, Number(minimum));
    }
    return numericValue;
  }

  function readJsonStorage(storage, key, fallback) {
    var source = storage && typeof storage.getItem === "function" ? storage : null;
    var fallbackValue = fallback && typeof fallback === "object" ? fallback : {};
    if (!source) {
      return fallbackValue;
    }
    try {
      var rawValue = source.getItem(String(key || ""));
      var parsed = rawValue ? JSON.parse(rawValue) : fallbackValue;
      return parsed && typeof parsed === "object" ? parsed : fallbackValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  function writeJsonStorage(storage, key, value) {
    var target = storage && typeof storage.setItem === "function" ? storage : null;
    if (!target) {
      return;
    }
    try {
      target.setItem(String(key || ""), JSON.stringify(value || {}));
    } catch (_error) {}
  }

  function measureElementIntrinsicTextWidth(node) {
    if (!(node instanceof HTMLElement) || !(document.body instanceof HTMLElement)) {
      return 0;
    }
    var text = String(node.textContent || "").trim();
    if (!text) {
      return 0;
    }
    var computedStyles = window.getComputedStyle(node);
    var probe = document.createElement("span");
    probe.textContent = text;
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "0";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.whiteSpace = "pre";
    probe.style.font = computedStyles.font;
    probe.style.fontFamily = computedStyles.fontFamily;
    probe.style.fontSize = computedStyles.fontSize;
    probe.style.fontWeight = computedStyles.fontWeight;
    probe.style.fontStyle = computedStyles.fontStyle;
    probe.style.letterSpacing = computedStyles.letterSpacing;
    probe.style.textTransform = computedStyles.textTransform;
    document.body.appendChild(probe);
    var width = Math.ceil(probe.getBoundingClientRect().width || 0);
    probe.remove();
    return Math.max(width, 0);
  }

  function captureColumnRatios(config) {
    var settings = config && typeof config === "object" ? config : {};
    var headers = Array.isArray(settings.headers) ? settings.headers : [];
    var renderer = settings.renderer instanceof HTMLElement ? settings.renderer : null;
    var keyResolver = typeof settings.keyResolver === "function" ? settings.keyResolver : null;
    var ratios = {};
    if (!(renderer instanceof HTMLElement) || !headers.length || !keyResolver) {
      return ratios;
    }
    var rendererWidth = Math.max(Number(renderer.clientWidth || 0) || 0, 1);
    headers.forEach(function (header, index) {
      if (!(header instanceof HTMLElement) || window.getComputedStyle(header).display === "none") {
        return;
      }
      var key = String(keyResolver(header, index, headers.length) || "").trim();
      var width = Math.ceil(header.getBoundingClientRect().width || 0);
      if (!key || key === "__controller__" || key === "__actions__" || width <= 0) {
        return;
      }
      ratios[key] = Math.round((width / rendererWidth) * 10000) / 10000;
    });
    return ratios;
  }

  function buildResponsiveColumnLayoutKey(config) {
    var settings = config && typeof config === "object" ? config : {};
    var scopeKey = String(settings.scopeKey || "").trim().toLowerCase();
    var specs = Array.isArray(settings.specs) ? settings.specs : [];
    return JSON.stringify({
      scope: scopeKey,
      headers: specs.map(function (spec) {
        return [String(spec && spec.key || ""), spec && spec.hidden ? 1 : 0];
      }),
    });
  }

  function captureResponsiveSpecRatios(specs, containerWidth) {
    var ratios = {};
    var baseWidth = Math.max(Number(containerWidth || 0) || 0, 1);
    (Array.isArray(specs) ? specs : []).forEach(function (spec) {
      if (!spec || spec.hidden || !spec.key || spec.key === "__controller__" || spec.key === "__actions__") {
        return;
      }
      var width = Math.max(Number(spec.width || 0) || 0, 0);
      if (width <= 0) {
        return;
      }
      ratios[spec.key] = Math.round((width / baseWidth) * 10000) / 10000;
    });
    return ratios;
  }

  function measureCellContentWidth(cell) {
    if (!(cell instanceof HTMLElement)) {
      return 0;
    }
    var isHeaderCell = String(cell.tagName || "").trim().toUpperCase() === "TH";
    var cellStyles = window.getComputedStyle(cell);
    var horizontalPadding =
      (Number.parseFloat(cellStyles.paddingLeft || "0") || 0) +
      (Number.parseFloat(cellStyles.paddingRight || "0") || 0);
    var actionSelector = [
      ".o_surface_row_actions",
      ".o_surface_row_action",
      "[data-surface-row-action='1']",
    ].join(", ");
    var visibleGeometryOnly =
      cell.classList.contains("o_surface_native_actions_cell") ||
      cell.classList.contains("o_surface_action_cell") ||
      !!cell.querySelector(actionSelector);
    var descendantContentWidth = 0;
    var descendantNodes = visibleGeometryOnly
      ? cell.querySelectorAll(actionSelector)
      : cell.querySelectorAll("*");
    if (descendantNodes.length) {
      var descendantLeft = Infinity;
      var descendantRight = -Infinity;
      Array.prototype.slice.call(descendantNodes).forEach(function (node) {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        var styles = window.getComputedStyle(node);
        if (styles.display === "none" || styles.visibility === "hidden") {
          return;
        }
        var rect = node.getBoundingClientRect();
        if (!(rect.width > 0) || !(rect.height > 0)) {
          return;
        }
        descendantLeft = Math.min(descendantLeft, rect.left);
        descendantRight = Math.max(descendantRight, rect.right);
      });
      if (Number.isFinite(descendantLeft) && Number.isFinite(descendantRight) && descendantRight > descendantLeft) {
        descendantContentWidth = Math.ceil(descendantRight - descendantLeft);
      }
    }
    var textContentWidth = isHeaderCell
      ? measureElementIntrinsicTextWidth(cell) + Math.ceil(horizontalPadding)
      : 0;
    var intrinsicContentWidth = Math.max(
      textContentWidth,
      (visibleGeometryOnly || isHeaderCell) ? 0 : (Number(cell.scrollWidth || 0) || 0),
      descendantContentWidth > 0
        ? descendantContentWidth + Math.ceil(horizontalPadding)
        : 0
    );
    var contentWidth = visibleGeometryOnly
      ? intrinsicContentWidth
      : intrinsicContentWidth > 0
        ? intrinsicContentWidth
        : isHeaderCell
          ? 0
          : Math.ceil(cell.getBoundingClientRect().width || 0);
    return Math.max(contentWidth, 0);
  }

  function setElementWidthStyles(node, width, allowOverflow) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var normalizedWidth = Math.max(Number(width || 0) || 0, 0);
    var widthValue = String(normalizedWidth) + "px";
    if (node.style.width !== widthValue) {
      node.style.width = widthValue;
    }
    if (node.style.minWidth !== widthValue) {
      node.style.minWidth = widthValue;
    }
    if (node.style.maxWidth !== widthValue) {
      node.style.maxWidth = widthValue;
    }
    var overflowValue = allowOverflow ? "visible" : "hidden";
    if (node.style.overflow !== overflowValue) {
      node.style.overflow = overflowValue;
    }
  }

  function applyTableColumnWidths(config) {
    var settings = config && typeof config === "object" ? config : {};
    var specs = Array.isArray(settings.specs) ? settings.specs : [];
    var rows = Array.isArray(settings.rows) ? settings.rows : [];
    var table = settings.table instanceof HTMLElement ? settings.table : null;
    var tableWidth = Math.max(Number(settings.tableWidth || 0) || 0, 0);
    var overflowResolver = typeof settings.overflowResolver === "function"
      ? settings.overflowResolver
      : function () { return false; };

    specs.forEach(function (spec) {
      if (!(spec && spec.header instanceof HTMLElement)) {
        return;
      }
      setElementWidthStyles(spec.header, spec.width, !!overflowResolver(spec));
    });

    rows.forEach(function (row) {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      Array.prototype.slice.call(row.children).forEach(function (cell, index) {
        var spec = specs[index];
        if (!(cell instanceof HTMLElement) || !spec) {
          return;
        }
        setElementWidthStyles(cell, spec.width, !!overflowResolver(spec, cell, row));
      });
    });

    if (table instanceof HTMLElement && tableWidth > 0) {
      var tableWidthValue = String(tableWidth) + "px";
      if (table.style.width !== tableWidthValue) {
        table.style.width = tableWidthValue;
      }
      if (table.style.minWidth !== tableWidthValue) {
        table.style.minWidth = tableWidthValue;
      }
    }
  }

  function getElementContentWidth(config) {
    var settings = config && typeof config === "object" ? config : {};
    var node = settings.node instanceof HTMLElement ? settings.node : null;
    var minimumWidth = Math.max(Number(settings.minimumWidth || 0) || 0, 0);
    if (!(node instanceof HTMLElement)) {
      return minimumWidth;
    }
    var width = Number(node.clientWidth || 0) || 0;
    if (settings.subtractPadding !== false) {
      var styles = window.getComputedStyle(node);
      width -= (Number.parseFloat(styles.paddingLeft || "0") || 0);
      width -= (Number.parseFloat(styles.paddingRight || "0") || 0);
    }
    return Math.max(Math.round(width), minimumWidth);
  }

  function scaleColumnWidthsToFit(config) {
    var settings = config && typeof config === "object" ? config : {};
    var specs = Array.isArray(settings.specs) ? settings.specs : [];
    var availableWidth = Math.max(Number(settings.availableWidth || 0) || 0, 0);
    if (!specs.length || availableWidth <= 0) {
      return specs;
    }
    var allowGrow = settings.allowGrow === true;
    var totalWidth = specs.reduce(function (total, spec) {
      return total + Math.max(Number(spec && spec.width || 0) || 0, 0);
    }, 0);
    var scale = totalWidth > 0 ? availableWidth / totalWidth : 1;
    if (!allowGrow) {
      scale = Math.min(1, scale);
    }
    var minWidthResolver = typeof settings.minWidthResolver === "function"
      ? settings.minWidthResolver
      : function () { return 0; };
    var assignedWidth = 0;
    specs.forEach(function (spec, index) {
      var nextWidth = Math.round((Number(spec && spec.width || 0) || 0) * scale);
      if (index === specs.length - 1) {
        nextWidth = Math.max(availableWidth - assignedWidth, minWidthResolver(spec, index, specs));
      }
      spec.width = nextWidth;
      assignedWidth += nextWidth;
    });
    return specs;
  }

  Object.assign(surfaceLayerApi, {
    clampNumber: clampNumber,
    readJsonStorage: readJsonStorage,
    writeJsonStorage: writeJsonStorage,
    captureColumnRatios: captureColumnRatios,
    buildResponsiveColumnLayoutKey: buildResponsiveColumnLayoutKey,
    captureResponsiveSpecRatios: captureResponsiveSpecRatios,
    measureCellContentWidth: measureCellContentWidth,
    applyTableColumnWidths: applyTableColumnWidths,
    getElementContentWidth: getElementContentWidth,
    scaleColumnWidthsToFit: scaleColumnWidthsToFit,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
