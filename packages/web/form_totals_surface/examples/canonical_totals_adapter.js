(function () {
  "use strict";

  const layers = window.OdooSurfaceLayers;
  if (!layers || typeof layers.buildFormTotalsSurfaceAdapter !== "function") {
    throw new Error("form-totals-surface requires OdooSurfaceLayers and its canonical adapter API");
  }

  const totals = layers.buildFormTotalsSurfaceAdapter({
    selector: "[data-surface-form-totals='1']",
    rowSelector: "[data-surface-tax-row='1']",
    fallbackSelector: "[data-surface-tax-fallback='1']",
    labelSelector: "[data-surface-tax-label='1']",
    amountSelector: "[data-surface-tax-amount='1']",
    money: {
      currencySymbol: "$",
      precision: 2,
    },
    rows: {
      fallbackLabel: "Tax",
    },
    payload: {
      taxTotalsKey: "tax_totals",
    },
  });

  totals.sync({
    tax_totals: {
      subtotals: [
        {
          tax_groups: [
            { group_name: "VAT 16%", tax_amount: 160 },
          ],
        },
      ],
    },
  });
})();
