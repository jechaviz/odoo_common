(function () {
  "use strict";

  const layers = window.OdooSurfaceLayers;
  if (!layers || typeof layers.buildFormSubtotalsSurfaceAdapter !== "function") {
    throw new Error("form-subtotals-surface requires OdooSurfaceLayers and its canonical adapter API");
  }

  const adapter = layers.buildFormSubtotalsSurfaceAdapter({
    selector: ".o_form_view[data-lib-scope-key]",
    resolveScopeKey: function (formNode) {
      return formNode.getAttribute("data-lib-scope-key");
    },
    fieldDisplayNormalizers: [
      {
        fieldName: "external_reference",
        normalize: function (value) {
          return String(value || "").trim();
        },
      },
    ],
  });

  adapter.install();
  adapter.process();
})();
