"use strict";

  var RENTAL_CUSTOMER_CONTACT_BRIDGE_FIELDS = [
    "partner_id",
    "x_customer_contact_id",
    "x_customer_contact_email",
    "x_customer_contact_phone",
  ];
  var rentalCustomerContactSurfaceBridgeInstalled = false;
  var rentalCustomerContactLastFocusedField = "";
  var rentalCustomerContactSyncToken = 0;

  function syncRentalFormDocumentPreview(displayReference, options) {
    var normalizedReference = String(displayReference || "").trim();
    var settings = options && typeof options === "object" ? options : {};
    var displayRefNode = document.querySelector(".o_rp_document_display_ref span, .o_rp_document_display_ref");
    if (normalizedReference && displayRefNode instanceof HTMLElement) {
      replaceNodeText(displayRefNode, normalizedReference);
    }
    if (normalizedReference) {
      setRentalFormFieldPreviewValue("x_document_display_ref", normalizedReference);
    }
    if (settings.documentSeriesLabel) {
      setRentalFormFieldPreviewValue("x_document_series_type", settings.documentSeriesLabel, { onlyWhenEmpty: true });
    }
    if (settings.branchLabel) {
      setRentalFormFieldPreviewValue("x_origin_branch_id", settings.branchLabel, { onlyWhenEmpty: true });
    }
    ensureRentalFormBreadcrumb(normalizedReference || "New", settings.documentSeriesType || "");
    if (normalizedReference) {
      document.title = normalizedReference;
    }
  }

  function setRentalPreviewNodeVisibility(node, visible) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    node.classList.toggle("o_invisible_modifier", !visible);
    node.hidden = !visible;
    node.style.display = visible ? "" : "none";
    if (visible) {
      node.removeAttribute("aria-hidden");
    } else {
      node.setAttribute("aria-hidden", "true");
    }
  }

  function syncRentalCustomerContactTextNode(selector, value, className) {
    var node = document.querySelector(selector);
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (className && !node.classList.contains(className)) {
      node.classList.add(className);
    }
    var normalizedValue = String(value || "").trim();
    if (String(node.textContent || "").trim() !== normalizedValue) {
      replaceNodeText(node, normalizedValue);
    }
    setRentalPreviewNodeVisibility(node, !!normalizedValue);
    return !!normalizedValue;
  }

  function normalizeRentalCustomerContactName(value) {
    var normalizedValue = String(value || "").trim();
    if (!normalizedValue || normalizedValue.indexOf(",") === -1) {
      return normalizedValue;
    }
    var segments = normalizedValue
      .split(",")
      .map(function (segment) {
        return String(segment || "").trim();
      })
      .filter(Boolean);
    if (segments.length < 2) {
      return normalizedValue;
    }
    return segments[segments.length - 1] || normalizedValue;
  }

  function getRentalCustomerContactBridgeFieldName(target) {
    if (!(target instanceof HTMLElement)) {
      return "";
    }
    var fieldRoot = target.closest(".o_form_view [name], .o_form_view [data-name]");
    if (!(fieldRoot instanceof HTMLElement)) {
      return "";
    }
    var fieldName = String(
      fieldRoot.getAttribute("name") || fieldRoot.getAttribute("data-name") || ""
    ).trim();
    return RENTAL_CUSTOMER_CONTACT_BRIDGE_FIELDS.indexOf(fieldName) >= 0 ? fieldName : "";
  }

  function scheduleRentalCustomerContactSurfaceSync(force) {
    if (
      !(typeof isRentalFormRoute === "function" && isRentalFormRoute()) ||
      (typeof isRentalNestedFormRoute === "function" && isRentalNestedFormRoute())
    ) {
      return;
    }
    var syncToken = rentalCustomerContactSyncToken + 1;
    rentalCustomerContactSyncToken = syncToken;
    [0, 180, 520].forEach(function (delay) {
      window.setTimeout(function () {
        if (syncToken !== rentalCustomerContactSyncToken) {
          return;
        }
        syncRentalCustomerContactSurface(!!force).catch(function () {});
      }, delay);
    });
  }

  function installRentalCustomerContactSurfaceBridge() {
    if (rentalCustomerContactSurfaceBridgeInstalled) {
      return;
    }
    rentalCustomerContactSurfaceBridgeInstalled = true;

    document.addEventListener("focusin", function (event) {
      var fieldName = getRentalCustomerContactBridgeFieldName(
        event && event.target instanceof HTMLElement ? event.target : null
      );
      rentalCustomerContactLastFocusedField = fieldName || "";
    }, true);

    ["input", "change", "focusout"].forEach(function (eventName) {
      document.addEventListener(eventName, function (event) {
        var fieldName = getRentalCustomerContactBridgeFieldName(
          event && event.target instanceof HTMLElement ? event.target : null
        );
        if (!fieldName) {
          return;
        }
        scheduleRentalCustomerContactSurfaceSync(true);
      }, true);
    });

    document.addEventListener("keydown", function (event) {
      var fieldName = getRentalCustomerContactBridgeFieldName(
        event && event.target instanceof HTMLElement ? event.target : null
      );
      if (!fieldName) {
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        scheduleRentalCustomerContactSurfaceSync(true);
      }
    }, true);

    document.addEventListener("click", function (event) {
      var target = event && event.target instanceof HTMLElement ? event.target : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var fieldName = getRentalCustomerContactBridgeFieldName(target);
      if (fieldName) {
        rentalCustomerContactLastFocusedField = fieldName;
        scheduleRentalCustomerContactSurfaceSync(true);
        return;
      }
      if (
        rentalCustomerContactLastFocusedField &&
        target.closest(
          ".o-autocomplete--dropdown-item, .o_m2o_dropdown_option, [role='option'], [role='menuitem'], .dropdown-item, .ui-menu-item"
        )
      ) {
        scheduleRentalCustomerContactSurfaceSync(true);
      }
      if (target.closest(".o_rp_inline_clear_button")) {
        scheduleRentalCustomerContactSurfaceSync(true);
      }
    }, true);
  }

  function extractRentalCustomerContactEmail(value) {
    var normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return "";
    }
    var bracketMatch = normalizedValue.match(/<([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)>/i);
    if (bracketMatch && bracketMatch[1]) {
      return String(bracketMatch[1] || "").trim();
    }
    var looseMatch = normalizedValue.match(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i);
    return looseMatch && looseMatch[1] ? String(looseMatch[1] || "").trim() : "";
  }

  function stripRentalCustomerContactEmail(value) {
    return String(value || "")
      .replace(/\s*<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function resolveRentalUnsavedCustomerContactPreview(fallbackName, fallbackEmail, fallbackPhone) {
    var rawContactLabel = String(fallbackName || "").trim();
    var parsedEmail = extractRentalCustomerContactEmail(rawContactLabel);
    var normalizedDisplayName = stripRentalCustomerContactEmail(rawContactLabel);
    var normalizedContactName = normalizeRentalCustomerContactName(normalizedDisplayName);
    var partnerLabel = String(getRentalFormFieldValue("partner_id") || "").trim();
    var contactDetails = {
      name: normalizedContactName || normalizedDisplayName || rawContactLabel,
      email: String(fallbackEmail || parsedEmail || "").trim(),
      phone: String(fallbackPhone || "").trim(),
      role: "",
    };
    if (!rawContactLabel && !contactDetails.email && !contactDetails.phone) {
      return contactDetails;
    }
    var previewFields = ["id", "name", "display_name", "email", "phone", "function", "parent_id"];
    var contactRow = null;
    if (contactDetails.email) {
      contactRow = await searchReadRentalFormPreviewSingle(
        "res.partner",
        [["email", "=", contactDetails.email]],
        previewFields
      );
    }
    if (!contactRow && normalizedDisplayName) {
      contactRow = await searchReadRentalFormPreviewSingle(
        "res.partner",
        [["display_name", "=", normalizedDisplayName]],
        previewFields
      );
    }
    if (!contactRow && normalizedContactName && partnerLabel) {
      var partnerRow = await searchReadRentalFormPreviewSingle(
        "res.partner",
        [["display_name", "=", partnerLabel]],
        ["id", "name", "display_name"]
      );
      var partnerId = Number(partnerRow && partnerRow.id || 0) || 0;
      if (partnerId > 0) {
        contactRow = await searchReadRentalFormPreviewSingle(
          "res.partner",
          [["parent_id", "=", partnerId], ["name", "=", normalizedContactName]],
          previewFields
        );
      }
    }
    if (!contactRow && normalizedContactName) {
      contactRow = await searchReadRentalFormPreviewSingle(
        "res.partner",
        [["name", "=", normalizedContactName]],
        previewFields
      );
    }
    if (!contactRow) {
      return contactDetails;
    }
    return {
      name: String(contactRow.name || contactDetails.name || "").trim(),
      email: String(contactRow.email || contactDetails.email || "").trim(),
      phone: String(contactRow.phone || contactDetails.phone || "").trim(),
      role: String(contactRow.function || "").trim(),
    };
  }

  function syncRentalCustomerContactPreview(details) {
    var info = details && typeof details === "object" ? details : {};
    var contactInputValue = getRentalFormFieldValue("x_customer_contact_id");
    var emailValue = String(info.email || getRentalFormFieldValue("x_customer_contact_email") || "").trim();
    var phoneValue = String(info.phone || getRentalFormFieldValue("x_customer_contact_phone") || "").trim();
    var nameVisible = syncRentalCustomerContactTextNode(
      ".o_rp_customer_contact_name",
      normalizeRentalCustomerContactName(info.name || contactInputValue),
      "text-body"
    );
    var roleVisible = syncRentalCustomerContactTextNode(
      ".o_rp_customer_contact_role",
      info.role || "",
      "text-body-secondary"
    );
    if (emailValue) {
      setRentalFormFieldPreviewValue("x_customer_contact_email", emailValue);
    }
    if (phoneValue) {
      setRentalFormFieldPreviewValue("x_customer_contact_phone", phoneValue);
    }
    var emailVisible = syncRentalCustomerContactTextNode(
      ".o_rp_customer_contact_email",
      emailValue,
      "text-body-secondary"
    );
    var phoneVisible = syncRentalCustomerContactTextNode(
      ".o_rp_customer_contact_phone",
      phoneValue,
      "text-body-secondary"
    );
    var detailBlock = document.querySelector(".o_rp_customer_contact_details_block");
    if (detailBlock instanceof HTMLElement) {
      setRentalPreviewNodeVisibility(detailBlock, nameVisible || roleVisible || emailVisible || phoneVisible);
    }
    return nameVisible || roleVisible || emailVisible || phoneVisible;
  }

  async function searchReadRentalFormPreviewSingle(model, domain, fields) {
    var ormService = await resolveOrmService();
    if (!ormService || typeof ormService.searchRead !== "function") {
      return null;
    }
    try {
      var rows = await ormService.searchRead(model, domain, fields, { limit: 1, order: "id asc" });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    } catch (_error) {
      return null;
    }
  }

  function normalizeRentalCustomerContactPreviewState() {
    if (!rentalFormPreviewState.customerContact || typeof rentalFormPreviewState.customerContact !== "object") {
      rentalFormPreviewState.customerContact = {
        key: "",
        data: null,
        promise: null,
      };
    }
    return rentalFormPreviewState.customerContact;
  }

  async function fetchRentalCustomerContactPreview(force) {
    var orderId = typeof getRentalManagedOrderId === "function" ? getRentalManagedOrderId() : 0;
    var fallbackName = getRentalFormFieldValue("x_customer_contact_id");
    var fallbackEmail = getRentalFormFieldValue("x_customer_contact_email");
    var fallbackPhone = getRentalFormFieldValue("x_customer_contact_phone");
    var state = normalizeRentalCustomerContactPreviewState();
    if (!(orderId > 0)) {
      var unsavedStateKey = ["new", fallbackName, fallbackEmail, fallbackPhone, getRentalFormFieldValue("partner_id")].join("::");
      if (!force && state.key === unsavedStateKey && state.data) {
        syncRentalCustomerContactPreview(state.data);
        return state.data;
      }
      if (!force && state.key === unsavedStateKey && state.promise) {
        return state.promise;
      }
      state.key = unsavedStateKey;
      state.promise = resolveRentalUnsavedCustomerContactPreview(
        fallbackName,
        fallbackEmail,
        fallbackPhone
      ).then(function (details) {
        state.data = details;
        syncRentalCustomerContactPreview(details);
        return details;
      }).finally(function () {
        state.promise = null;
      });
      return state.promise;
    }
    var stateKey = [String(orderId), fallbackName, fallbackEmail, fallbackPhone].join("::");
    if (!force && state.key === stateKey && state.data) {
      syncRentalCustomerContactPreview(state.data);
      return state.data;
    }
    if (!force && state.key === stateKey && state.promise) {
      return state.promise;
    }
    state.key = stateKey;
    state.promise = (async function () {
      var ormService = await resolveOrmService();
      var orderRow = null;
      if (ormService && typeof ormService.searchRead === "function") {
        try {
          var orderRows = await ormService.searchRead(
            "sale.order",
            [["id", "=", orderId]],
            ["x_customer_contact_id", "x_customer_contact_email", "x_customer_contact_phone", "x_customer_contact_role"],
            { limit: 1, order: "id asc" }
          );
          orderRow = Array.isArray(orderRows) && orderRows.length ? orderRows[0] : null;
        } catch (_error) {
          orderRow = null;
        }
      }
      var contactValue = orderRow && orderRow.x_customer_contact_id ? orderRow.x_customer_contact_id : false;
      var contactId = Array.isArray(contactValue)
        ? Number.parseInt(String(contactValue[0] || 0), 10) || 0
        : Number.parseInt(String(contactValue || 0), 10) || 0;
      var details = {
        name: Array.isArray(contactValue) ? String(contactValue[1] || "").trim() : fallbackName,
        email: String(orderRow && orderRow.x_customer_contact_email || fallbackEmail || "").trim(),
        phone: String(orderRow && orderRow.x_customer_contact_phone || fallbackPhone || "").trim(),
        role: String(orderRow && orderRow.x_customer_contact_role || "").trim(),
      };
      if (contactId > 0 && ormService && typeof ormService.call === "function") {
        try {
          var contactRows = await ormService.call(
            "res.partner",
            "read",
            [[contactId], ["name", "email", "phone", "function"]],
            {}
          );
          var contactRow = Array.isArray(contactRows) && contactRows.length ? contactRows[0] : null;
          if (contactRow) {
            details.name = String(contactRow.name || details.name || fallbackName || "").trim();
            details.email = String(contactRow.email || details.email || "").trim();
            details.phone = String(contactRow.phone || details.phone || "").trim();
            details.role = String(contactRow.function || "").trim();
          }
        } catch (_error) {
          details.role = String(details.role || "").trim();
        }
      }
      state.data = details;
      syncRentalCustomerContactPreview(details);
      return details;
    })().finally(function () {
      state.promise = null;
    });
    return state.promise;
  }

  async function syncRentalCustomerContactSurface(force) {
    if (
      !(typeof isRentalFormRoute === "function" && isRentalFormRoute()) ||
      (typeof isRentalNestedFormRoute === "function" && isRentalNestedFormRoute())
    ) {
      return false;
    }
    installRentalCustomerContactSurfaceBridge();
    await fetchRentalCustomerContactPreview(!!force);
    return true;
  }

  async function fetchRentalNewDocumentPreview(force) {
    if (!isRentalFormRoute() || getRentalPathRecordId() > 0) {
      return null;
    }
    var defaults = await resolveRentalNewFormDefaults();
    var branchCode = readRentalNewPreviewBranchCode() || String(defaults.branchCode || "").trim().toUpperCase();
    var branchLabel = String(getRentalFormFieldValue("x_origin_branch_id") || defaults.branchLabel || "").trim();
    var documentSeriesType = readExplicitRentalDocumentTypeChoice() || String(defaults.documentSeriesType || "").trim().toUpperCase() || "C";
    var signature = [branchCode, branchLabel, documentSeriesType].join(":");
    if (!force && rentalFormPreviewState.displayReference && rentalFormPreviewState.signature === signature) {
      syncRentalFormDocumentPreview(rentalFormPreviewState.displayReference, {
        branchLabel: branchLabel,
        documentSeriesType: documentSeriesType,
        documentSeriesLabel: labelForRentalDocumentSeriesChoice(documentSeriesType),
      });
      return rentalFormPreviewState;
    }
    if (rentalFormPreviewState.loading && rentalFormPreviewState.promise) {
      return rentalFormPreviewState.promise;
    }
    rentalFormPreviewState.loading = true;
    rentalFormPreviewState.signature = signature;
    rentalFormPreviewState.promise = (async function () {
      var ormService = await resolveOrmService();
      if (!ormService) {
        rentalFormPreviewState.loading = false;
        rentalFormPreviewState.promise = null;
        return null;
      }
      try {
        var rows = await ormService.searchRead(
          "ir.sequence",
          [["code", "=", "sale.order"]],
          ["id", "prefix", "padding", "number_next_actual"],
          { limit: 1, order: "id asc" }
        );
        var sequenceRow = Array.isArray(rows) && rows.length ? rows[0] : null;
        var sequenceName = buildRentalNewSequenceName(sequenceRow);
        var nextNumber = Number(sequenceRow && sequenceRow.number_next_actual || 0);
        var displayReference = buildRentalDisplayReference(sequenceName, branchCode, nextNumber);
        rentalFormPreviewState.displayReference = String(displayReference || "").trim();
        rentalFormPreviewState.documentSeriesType = documentSeriesType;
        rentalFormPreviewState.branchCode = branchCode;
        rentalFormPreviewState.branchLabel = branchLabel;
        syncRentalFormDocumentPreview(rentalFormPreviewState.displayReference, {
          branchLabel: branchLabel,
          documentSeriesType: documentSeriesType,
          documentSeriesLabel: labelForRentalDocumentSeriesChoice(documentSeriesType),
        });
        return rentalFormPreviewState;
      } catch (_error) {
        return null;
      } finally {
        rentalFormPreviewState.loading = false;
        rentalFormPreviewState.promise = null;
      }
    })();
    return rentalFormPreviewState.promise;
  }
