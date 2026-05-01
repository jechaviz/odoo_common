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

  Object.assign(surfaceLayerApi, {
    buildActionStripMarkup: buildActionStripMarkup,
    buildDetailTableMarkup: buildDetailTableMarkup,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
