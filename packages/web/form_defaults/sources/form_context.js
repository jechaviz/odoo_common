"use strict";

  var rentalFormPreviewState = {
    loading: false,
    promise: null,
    signature: "",
    displayReference: "",
    documentSeriesType: "",
    branchCode: "",
    branchLabel: "",
    defaultsLoaded: false,
    defaultsPromise: null,
    defaults: null,
    parentOrderMetaById: Object.create(null),
  };

  function isRentalFormPathname(pathname) {
    var normalized = canonicalizeRentalFormPathname(pathname || "");
    return (
      normalized === "/odoo/rental/new" ||
      /^\/odoo\/rental\/\d+$/.test(normalized) ||
      /^\/odoo\/rental\/\d+\/[^/]+\/\d+$/.test(normalized)
    );
  }

  function canonicalizeRentalFormPathname(pathname) {
    var normalized = normalizePathname(pathname || "");
    if (/^\/odoo\/rental\/new\/.+$/i.test(normalized)) {
      return "/odoo/rental/new";
    }
    return normalized;
  }

  async function syncRentalFormPathCanonicalization() {
    if (!window.history || typeof window.history.replaceState !== "function") {
      return false;
    }
    var rawPathname = normalizePathname(window.location.pathname || "");
    if (!/^\/odoo\/rental\/new\/.+$/i.test(rawPathname)) {
      return false;
    }
    var canonicalPathname = "/odoo/rental/new";
    if (typeof resolveActionService === "function") {
      try {
        var actionService = await resolveActionService();
        var controller = actionService && actionService.currentController ? actionService.currentController : null;
        var action = controller && controller.action ? controller.action : null;
        var currentModel = String(
          (controller && controller.props && controller.props.resModel) ||
          (action && action.res_model) ||
          ""
        ).trim();
        var currentResId = Number.parseInt(
          String(
            (controller && controller.props && controller.props.resId) ||
            (action && action.res_id) ||
            0
          ),
          10
        ) || 0;
        if (currentModel === "sale.order" && currentResId > 0) {
          canonicalPathname = "/odoo/rental/" + String(currentResId);
        }
      } catch (_error) {}
    }
    if (!canonicalPathname || canonicalPathname === rawPathname) {
      return false;
    }
    window.history.replaceState(
      window.history.state,
      document.title,
      canonicalPathname + String(window.location.search || "") + String(window.location.hash || "")
    );
    return true;
  }

  function isRentalFormRoute() {
    return isRentalFormPathname(window.location.pathname || "");
  }

  function getRentalFormRoot() {
    var form = document.querySelector(".o_form_view");
    return form instanceof HTMLElement && !form.closest(".modal, .o_dialog, .o_technical_modal") ? form : null;
  }

  function getRentalPathRecordId() {
    var match = canonicalizeRentalFormPathname(window.location.pathname || "").match(/^\/odoo\/rental\/(\d+)$/);
    return match && match[1] ? Number.parseInt(match[1], 10) || 0 : 0;
  }

  function getRentalNestedPathContext() {
    var match = canonicalizeRentalFormPathname(window.location.pathname || "").match(/^\/odoo\/rental\/(\d+)\/([^/]+)\/(\d+)$/);
    if (!match) {
      return null;
    }
    return {
      orderId: Number.parseInt(match[1], 10) || 0,
      model: String(match[2] || "").trim(),
      recordId: Number.parseInt(match[3], 10) || 0,
    };
  }

  function isRentalNestedFormRoute() {
    var context = getRentalNestedPathContext();
    return !!(context && context.orderId > 0 && context.recordId > 0 && context.model);
  }

  function isRentalNestedSaleOrderRoute() {
    var context = getRentalNestedPathContext();
    return !!(context && context.orderId > 0 && context.recordId > 0 && context.model === "sale.order");
  }

  function isRentalNestedPartnerRoute() {
    var context = getRentalNestedPathContext();
    return !!(context && context.orderId > 0 && context.recordId > 0 && context.model === "res.partner");
  }

  function isRentalManagedFormRoute() {
    return isRentalFormRoute() || isRentalNestedFormRoute();
  }

  function getRentalManagedOrderId() {
    var directOrderId = getRentalPathRecordId();
    if (directOrderId > 0) {
      return directOrderId;
    }
    var nestedContext = getRentalNestedPathContext();
    if (!(nestedContext && nestedContext.orderId > 0)) {
      return 0;
    }
    if (nestedContext.model === "sale.order" && nestedContext.recordId > 0) {
      return nestedContext.recordId;
    }
    return nestedContext.orderId;
  }

  function replaceNodeText(node, text) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    var normalizedText = String(text || "");
    if (
      node.childNodes.length === 1 &&
      node.firstChild &&
      node.firstChild.nodeType === Node.TEXT_NODE &&
      String(node.textContent || "") === normalizedText
    ) {
      return;
    }
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    node.appendChild(document.createTextNode(normalizedText));
  }

  function getRentalFormFieldRoot(fieldName) {
    var selectors = [
      '.o_form_view .o_field_widget[name="' + fieldName + '"]',
      '.o_form_view [name="' + fieldName + '"].o_field_widget',
      '.o_form_view [name="' + fieldName + '"]',
    ];
    for (var index = 0; index < selectors.length; index += 1) {
      var node = document.querySelector(selectors[index]);
      if (node instanceof HTMLElement) {
        return node;
      }
    }
    return null;
  }

  function getRentalFormFieldValue(fieldName) {
    var node = getRentalFormFieldRoot(fieldName);
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    var input = node.querySelector("input, textarea, .o_input, .o-autocomplete--input");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      return String(input.value || "").trim();
    }
    return String(node.textContent || "").trim();
  }

  function setRentalFormFieldPreviewValue(fieldName, value, options) {
    var node = getRentalFormFieldRoot(fieldName);
    var normalizedValue = String(value || "").trim();
    var settings = options && typeof options === "object" ? options : {};
    if (!(node instanceof HTMLElement) || !normalizedValue) {
      return false;
    }
    var input = node.querySelector("input, textarea, .o_input, .o-autocomplete--input");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      var currentValue = String(input.value || "").trim();
      if (settings.onlyWhenEmpty && currentValue) {
        return currentValue === normalizedValue;
      }
      if (document.activeElement === input && !settings.allowWhenFocused) {
        return currentValue === normalizedValue;
      }
      input.value = normalizedValue;
      input.setAttribute("title", normalizedValue);
      return true;
    }
    replaceNodeText(node, normalizedValue);
    return true;
  }

  function normalizeRentalDocumentSeriesChoiceValue(value) {
    var optionValue = String(value || "").trim().toUpperCase();
    if (optionValue === "Q" || optionValue === "C" || optionValue === "I") {
      return optionValue;
    }
    var label = String(value || "").trim().toLowerCase();
    if (label.indexOf("quotation") !== -1) {
      return "Q";
    }
    if (label.indexOf("contract") !== -1) {
      return "C";
    }
    if (label.indexOf("invoice") !== -1) {
      return "I";
    }
    return "";
  }

  function labelForRentalDocumentSeriesChoice(value) {
    var normalized = normalizeRentalDocumentSeriesChoiceValue(value);
    if (normalized === "Q") {
      return "Quotation";
    }
    if (normalized === "C") {
      return "Contract";
    }
    if (normalized === "I") {
      return "Invoice";
    }
    return "";
  }

  function isRentalDocumentSeriesMenu(menu) {
    if (!(menu instanceof HTMLElement) || menu.hidden || window.getComputedStyle(menu).display === "none") {
      return false;
    }
    return Array.prototype.slice.call(menu.querySelectorAll("[role='menuitem'], .o_select_menu_item")).some(function (item) {
      var text = String(item.textContent || "").trim().toLowerCase();
      return text === "quotation" || text === "contract" || text === "invoice" || text === "invoices";
    });
  }

  function syncRentalDocumentSeriesMenuOptions() {
    if (!isRentalFormRoute()) {
      return;
    }
    Array.prototype.slice
      .call(document.querySelectorAll(".o_select_menu_menu.o_field_selection_menu, .o_field_selection_menu, [role='menu']"))
      .filter(function (menu) {
        return isRentalDocumentSeriesMenu(menu);
      })
      .forEach(function (menu) {
        Array.prototype.slice.call(menu.querySelectorAll("[role='menuitem'], .o_select_menu_item")).forEach(function (item) {
          if (!(item instanceof HTMLElement)) {
            return;
          }
          var normalizedLabel = String(item.textContent || "").trim().toLowerCase();
          var shouldHide = normalizedLabel === "invoice" || normalizedLabel === "invoices";
          item.hidden = shouldHide;
          item.style.display = shouldHide ? "none" : "";
          if (shouldHide) {
            item.setAttribute("aria-hidden", "true");
          } else {
            item.removeAttribute("aria-hidden");
          }
        });
      });
  }

  function syncRentalFormHeaderButtons() {
    return;
  }

  function syncRentalPrimaryFormBodyState() {
    if (!(document.body instanceof HTMLElement)) {
      return;
    }
    var shouldEnable =
      isRentalFormRoute() &&
      !isRentalNestedFormRoute() &&
      getRentalPathRecordId() > 0 &&
      getRentalFormRoot() instanceof HTMLElement;
    document.body.classList.toggle(RENTAL_PRIMARY_FORM_BODY_CLASS, shouldEnable);
  }

  function clearRentalFormHeaderButtonsSync() {
    rentalFormHeaderSyncToken += 1;
    if (rentalFormHeaderSyncTimer) {
      window.clearTimeout(rentalFormHeaderSyncTimer);
      rentalFormHeaderSyncTimer = 0;
    }
  }

  function scheduleRentalFormHeaderButtonsSync() {
    clearRentalFormHeaderButtonsSync();
    syncRentalNestedPartnerChrome();
  }

  function inferRentalBranchCodeFromText(value) {
    var normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");
    if (!normalized) {
      return "";
    }
    if (normalized === "te" || normalized.indexOf("terrell") !== -1 || normalized.indexOf("terrel") !== -1) {
      return "TE";
    }
    if (normalized === "da" || normalized.indexOf("dallas") !== -1) {
      return "DA";
    }
    if (
      normalized === "fw" ||
      normalized.indexOf("fort worth") !== -1 ||
      (normalized.indexOf("fort") !== -1 && normalized.indexOf("worth") !== -1)
    ) {
      return "FW";
    }
    var explicitCode = normalized.match(/\b(te|da|fw)\b/i);
    return explicitCode && explicitCode[1] ? String(explicitCode[1] || "").toUpperCase() : "";
  }

  function extractRentalReferenceDigits(referenceValue, fallbackId) {
    var digits = String(referenceValue || "").replace(/[^\d]/g, "");
    if (!digits) {
      var fallbackNumber = Number.parseInt(String(fallbackId || "").replace(/[^\d]/g, ""), 10);
      digits = Number.isFinite(fallbackNumber) && fallbackNumber > 0 ? String(fallbackNumber) : "";
    }
    if (!digits) {
      return "00001";
    }
    return digits.slice(-5).padStart(5, "0");
  }

  function buildRentalDisplayReference(referenceValue, branchCode, fallbackId) {
    var normalizedBranchCode = String(branchCode || "").trim().toUpperCase();
    if (!normalizedBranchCode) {
      return String(referenceValue || "").trim() || extractRentalReferenceDigits(referenceValue, fallbackId);
    }
    return normalizedBranchCode + extractRentalReferenceDigits(referenceValue, fallbackId);
  }

  function formatRentalNewSequencePrefix(prefixValue) {
    var prefix = String(prefixValue || "").trim();
    if (!prefix || prefix.indexOf("%") !== -1) {
      return "S";
    }
    return prefix;
  }

  function buildRentalNewSequenceName(sequenceRow) {
    var nextNumber = Number(sequenceRow && (sequenceRow.number_next_actual || sequenceRow.number_next || 0));
    if (!Number.isFinite(nextNumber) || nextNumber <= 0) {
      return "";
    }
    var padding = Number(sequenceRow && sequenceRow.padding || 0);
    var normalizedPadding = Number.isFinite(padding) && padding > 0 ? padding : 5;
    return formatRentalNewSequencePrefix(sequenceRow && sequenceRow.prefix) + String(Math.trunc(nextNumber)).padStart(normalizedPadding, "0");
  }

  function readExplicitRentalDocumentTypeChoice() {
    var input = document.querySelector(".o_rp_header_identity_control_document input.o_select_menu_input");
    var currentValue = input instanceof HTMLInputElement ? String(input.value || "").trim() : "";
    return normalizeRentalDocumentSeriesChoiceValue(currentValue || getRentalFormFieldValue("x_document_series_type"));
  }

  function readRentalNewPreviewBranchCode() {
    return inferRentalBranchCodeFromText(getRentalFormFieldValue("x_origin_branch_id")) || "";
  }

  async function resolveRentalNewFormDefaults() {
    if (rentalFormPreviewState.defaultsLoaded) {
      return rentalFormPreviewState.defaults || {};
    }
    if (rentalFormPreviewState.defaultsPromise) {
      return rentalFormPreviewState.defaultsPromise;
    }
    rentalFormPreviewState.defaultsPromise = (async function () {
      var ormService = await resolveOrmService();
      if (!ormService || typeof ormService.call !== "function") {
        rentalFormPreviewState.defaultsLoaded = true;
        rentalFormPreviewState.defaults = {};
        return {};
      }
      try {
        var defaults = await ormService.call("sale.order", "default_get", [["x_origin_branch_id", "x_document_series_type"]], {});
        var branchValue = normalizeMany2one(defaults && defaults.x_origin_branch_id);
        var documentSeriesType = normalizeRentalDocumentSeriesChoiceValue(defaults && defaults.x_document_series_type);
        var branchCode = "";
        var branchLabel = branchValue.displayName || "";
        if (branchValue.id > 0) {
          var branchRows = await ormService.searchRead(
            "x_rental_branch",
            [["id", "=", branchValue.id]],
            ["id", "x_name", "x_code"],
            { limit: 1, order: "id asc" }
          );
          var branchRow = Array.isArray(branchRows) && branchRows.length ? branchRows[0] : null;
          branchCode = String(branchRow && branchRow.x_code || "").trim().toUpperCase();
          branchLabel = String(branchRow && branchRow.x_name || branchLabel || "").trim();
        }
        rentalFormPreviewState.defaultsLoaded = true;
        rentalFormPreviewState.defaults = {
          branchCode: branchCode || inferRentalBranchCodeFromText(branchLabel),
          branchLabel: branchLabel,
          documentSeriesType: documentSeriesType,
        };
        return rentalFormPreviewState.defaults;
      } catch (_error) {
        rentalFormPreviewState.defaultsLoaded = true;
        rentalFormPreviewState.defaults = {};
        return {};
      } finally {
        rentalFormPreviewState.defaultsPromise = null;
      }
    })();
    return rentalFormPreviewState.defaultsPromise;
  }

  function getRentalFormDisplayReference() {
    var fieldValue = String(getRentalFormFieldValue("x_document_display_ref") || "").trim();
    if (fieldValue) {
      return fieldValue;
    }
    var node = document.querySelector(".o_rp_document_display_ref span, .o_rp_document_display_ref");
    return node instanceof HTMLElement ? String(node.textContent || "").trim() : "";
  }

  function getRentalNestedFormLeafLabel() {
    var selectors = [
      ".o_form_view .oe_title h1",
      ".o_form_view h1",
      ".o_form_view .o_field_widget[name='name']",
      ".o_form_view .o_field_widget[name='display_name']",
      ".o_form_view [name='name']",
      ".o_form_view [name='display_name']",
    ];
    for (var index = 0; index < selectors.length; index += 1) {
      var node = document.querySelector(selectors[index]);
      if (node instanceof HTMLElement) {
        var input = node.matches("input, textarea") ? node : node.querySelector("input, textarea, .o_input, .o-autocomplete--input");
        var text = input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement
          ? String(input.value || "").trim()
          : String(node.textContent || "").trim();
        if (text) {
          return text;
        }
      }
    }
    return "";
  }

  function getRentalFormBreadcrumbMeta(documentSeriesType) {
    return normalizeRentalDocumentSeriesChoiceValue(documentSeriesType) === "Q"
      ? { key: "quotations", label: "Quotations" }
      : { key: "contracts", label: "Contracts" };
  }

  async function resolveRentalParentOrderMeta(orderId) {
    var normalizedOrderId = Number.parseInt(String(orderId || ""), 10) || 0;
    if (!(normalizedOrderId > 0)) {
      return null;
    }
    if (rentalFormPreviewState.parentOrderMetaById[normalizedOrderId]) {
      return rentalFormPreviewState.parentOrderMetaById[normalizedOrderId];
    }
    var ormService = await resolveOrmService();
    if (!ormService || typeof ormService.read !== "function") {
      return null;
    }
    try {
      var rows = await ormService.read("sale.order", [normalizedOrderId], ["id", "x_document_display_ref", "x_document_series_type"]);
      var row = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!row) {
        return null;
      }
      var meta = {
        orderId: normalizedOrderId,
        displayReference: String(row.x_document_display_ref || row.name || "").trim(),
        documentSeriesType: normalizeRentalDocumentSeriesChoiceValue(row.x_document_series_type),
      };
      rentalFormPreviewState.parentOrderMetaById[normalizedOrderId] = meta;
      return meta;
    } catch (_error) {
      return null;
    }
  }
