"use strict";

  var rentalCustomerDiscountSurfaceBridgeInstalled = false;
  var rentalCustomerDiscountSyncTimer = 0;
  var rentalCustomerDiscountSyncToken = 0;
  var rentalCustomerDiscountLastFocusedField = "";
  var rentalCustomerDiscountLastOrderSignature = "";
  var rentalCustomerDiscountLastRecordSignature = "";

  function getRentalCustomerDiscountBridgeFieldName(target) {
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
    return [
      "x_customer_discount_assignment_id",
      "x_partner_id",
      "x_discount_program_id",
      "x_expire",
      "x_expiration_date",
    ].indexOf(fieldName) >= 0
      ? fieldName
      : "";
  }

  function resolveVisibleCustomerDiscountFormRoot() {
    var formController =
      typeof resolveVisibleRentalFormController === "function"
        ? resolveVisibleRentalFormController()
        : null;
    return formController && formController.model && formController.model.root
      ? formController.model.root
      : null;
  }

  function resolveVisibleCustomerDiscountFormModel() {
    var modelRoot = resolveVisibleCustomerDiscountFormRoot();
    return String(
      (modelRoot &&
        (modelRoot.resModel ||
          modelRoot.model ||
          modelRoot.modelName ||
          (modelRoot._config && modelRoot._config.resModel))) ||
        ""
    ).trim();
  }

  function resolveVisibleCustomerDiscountRecordId() {
    var modelRoot = resolveVisibleCustomerDiscountFormRoot();
    return Number.parseInt(
      String(
        (modelRoot &&
          (modelRoot.resId ||
            modelRoot.res_id ||
            modelRoot.currentId ||
            modelRoot.id ||
            (modelRoot.data && modelRoot.data.id) ||
            0)) ||
          0
      ),
      10
    ) || 0;
  }

  function resolveRentalSelectedCustomerDiscountAssignmentId() {
    var modelRoot = resolveVisibleCustomerDiscountFormRoot();
    if (!modelRoot || resolveVisibleCustomerDiscountFormModel() !== "sale.order") {
      return 0;
    }
    var candidateValues = [
      modelRoot._changes && modelRoot._changes.x_customer_discount_assignment_id,
      modelRoot._values && modelRoot._values.x_customer_discount_assignment_id,
      modelRoot.data && modelRoot.data.x_customer_discount_assignment_id,
    ];
    for (var index = 0; index < candidateValues.length; index += 1) {
      var normalizedValue = normalizeMany2one(candidateValues[index]);
      if (normalizedValue.id > 0) {
        return normalizedValue.id;
      }
    }
    return 0;
  }

  async function runRentalCustomerDiscountAction(ormService, discountId) {
    if (!(discountId > 0) || !(RENTAL_SYNC_CUSTOMER_DISCOUNT_ACTION_ID > 0)) {
      return false;
    }
    suppressObserverMutations(300);
    await ormService.call(
      "ir.actions.server",
      "run",
      [[RENTAL_SYNC_CUSTOMER_DISCOUNT_ACTION_ID]],
      {
        context: {
          active_model: "x_rental_customer_discount",
          active_id: discountId,
          active_ids: [discountId],
        },
      }
    );
    return true;
  }

  async function fetchRentalCustomerDiscountRow(ormService, discountId) {
    if (!(discountId > 0)) {
      return null;
    }
    var rows = await ormService.searchRead(
      "x_rental_customer_discount",
      [["id", "=", discountId]],
      ["id", "x_name", "display_name", "x_discount_percent", "x_discount_program_id"],
      { limit: 1, order: "id asc" }
    ).catch(function () {
      return [];
    });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  async function syncVisibleCustomerDiscountRecordSurface(ormService) {
    if (resolveVisibleCustomerDiscountFormModel() !== "x_rental_customer_discount") {
      return false;
    }
    var discountId = resolveVisibleCustomerDiscountRecordId();
    if (!(discountId > 0)) {
      return false;
    }
    var signature = String(discountId);
    if (signature === rentalCustomerDiscountLastRecordSignature) {
      return false;
    }
    await runRentalCustomerDiscountAction(ormService, discountId);
    var row = await fetchRentalCustomerDiscountRow(ormService, discountId);
    if (row) {
      setRentalFormFieldPreviewValue(
        "x_discount_percent",
        Number(row.x_discount_percent || 0).toFixed(2),
        { allowWhenFocused: false }
      );
    }
    rentalCustomerDiscountLastRecordSignature = signature;
    return true;
  }

  async function syncRentalOrderCustomerDiscountSurface(ormService) {
    if (!(typeof isRentalManagedFormRoute === "function" && isRentalManagedFormRoute())) {
      return false;
    }
    var orderId = typeof getRentalManagedOrderId === "function" ? getRentalManagedOrderId() : 0;
    var discountId = resolveRentalSelectedCustomerDiscountAssignmentId();
    if (!(discountId > 0) && orderId > 0) {
      var orderRows = await ormService.searchRead(
        "sale.order",
        [["id", "=", orderId]],
        ["id", "x_customer_discount_assignment_id"],
        { limit: 1, order: "id asc" }
      ).catch(function () {
        return [];
      });
      var orderRow = Array.isArray(orderRows) && orderRows.length ? orderRows[0] : null;
      discountId = normalizeMany2one(orderRow && orderRow.x_customer_discount_assignment_id).id;
    }
    if (!(discountId > 0)) {
      rentalCustomerDiscountLastOrderSignature = "";
      return false;
    }
    await runRentalCustomerDiscountAction(ormService, discountId);
    var row = await fetchRentalCustomerDiscountRow(ormService, discountId);
    if (!row) {
      return false;
    }
    var programValue = normalizeMany2one(row.x_discount_program_id);
    var label = String(row.x_name || row.display_name || "").trim();
    var signature = [String(orderId || 0), String(discountId), label, String(row.x_discount_percent || 0)].join("|");
    if (signature === rentalCustomerDiscountLastOrderSignature) {
      return false;
    }
    if (orderId > 0) {
      await ormService.call(
        "sale.order",
        "write",
        [[orderId], {
          x_customer_discount_assignment_id: discountId,
          x_customer_discount_program_id: programValue.id || false,
          x_customer_discount_percent: Number(row.x_discount_percent || 0) || 0,
        }],
        {}
      ).catch(function () {
        return false;
      });
    }
    if (label) {
      setRentalFormFieldPreviewValue("x_customer_discount_assignment_id", label, {
        allowWhenFocused: true,
      });
    }
    rentalCustomerDiscountLastOrderSignature = signature;
    if (typeof syncRentalFormTotalsSurface === "function") {
      await syncRentalFormTotalsSurface(true).catch(function () {});
    }
    return true;
  }

  async function syncRentalCustomerDiscountSurface(force) {
    if (!(RENTAL_SYNC_CUSTOMER_DISCOUNT_ACTION_ID > 0)) {
      return false;
    }
    installRentalCustomerDiscountSurfaceBridge();
    var ormService = await resolveOrmService();
    if (!ormService || typeof ormService.call !== "function" || typeof ormService.searchRead !== "function") {
      return false;
    }
    if (force) {
      rentalCustomerDiscountLastRecordSignature = "";
      rentalCustomerDiscountLastOrderSignature = "";
    }
    var didSyncRecord = await syncVisibleCustomerDiscountRecordSurface(ormService);
    var didSyncOrder = await syncRentalOrderCustomerDiscountSurface(ormService);
    return !!(didSyncRecord || didSyncOrder);
  }

  function scheduleRentalCustomerDiscountSurfaceSync(delayMs, force) {
    if (rentalCustomerDiscountSyncTimer) {
      window.clearTimeout(rentalCustomerDiscountSyncTimer);
    }
    var syncToken = rentalCustomerDiscountSyncToken + 1;
    rentalCustomerDiscountSyncToken = syncToken;
    rentalCustomerDiscountSyncTimer = window.setTimeout(function () {
      rentalCustomerDiscountSyncTimer = 0;
      if (syncToken !== rentalCustomerDiscountSyncToken) {
        return;
      }
      syncRentalCustomerDiscountSurface(!!force).catch(function () {});
    }, Math.max(Number(delayMs || 0) || 0, 0));
  }

  function installRentalCustomerDiscountSurfaceBridge() {
    if (rentalCustomerDiscountSurfaceBridgeInstalled) {
      return;
    }
    rentalCustomerDiscountSurfaceBridgeInstalled = true;

    document.addEventListener("focusin", function (event) {
      rentalCustomerDiscountLastFocusedField = getRentalCustomerDiscountBridgeFieldName(
        event && event.target instanceof HTMLElement ? event.target : null
      );
    }, true);

    ["input", "change", "focusout"].forEach(function (eventName) {
      document.addEventListener(eventName, function (event) {
        var fieldName = getRentalCustomerDiscountBridgeFieldName(
          event && event.target instanceof HTMLElement ? event.target : null
        );
        if (!fieldName) {
          return;
        }
        scheduleRentalCustomerDiscountSurfaceSync(eventName === "input" ? 450 : 140, eventName !== "input");
      }, true);
    });

    document.addEventListener("keydown", function (event) {
      var fieldName = getRentalCustomerDiscountBridgeFieldName(
        event && event.target instanceof HTMLElement ? event.target : null
      );
      if (!fieldName) {
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        scheduleRentalCustomerDiscountSurfaceSync(180, true);
      }
    }, true);

    document.addEventListener("click", function (event) {
      var target = event && event.target instanceof HTMLElement ? event.target : null;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      var fieldName = getRentalCustomerDiscountBridgeFieldName(target);
      if (fieldName) {
        rentalCustomerDiscountLastFocusedField = fieldName;
        scheduleRentalCustomerDiscountSurfaceSync(180, true);
        return;
      }
      if (
        rentalCustomerDiscountLastFocusedField &&
        target.closest(
          ".o-autocomplete--dropdown-item, .o_m2o_dropdown_option, [role='option'], [role='menuitem'], .dropdown-item, .ui-menu-item"
        )
      ) {
        scheduleRentalCustomerDiscountSurfaceSync(220, true);
        return;
      }
      var button = target.closest("button, [role='button']");
      var buttonLabel = String(
        (button && (button.textContent || button.getAttribute("aria-label"))) || ""
      ).trim().toLowerCase();
      if (button && buttonLabel === "save") {
        window.setTimeout(function () {
          syncRentalCustomerDiscountSurface(true).catch(function () {});
        }, 320);
        window.setTimeout(function () {
          syncRentalCustomerDiscountSurface(true).catch(function () {});
        }, 920);
      }
    }, true);
  }

  installRentalCustomerDiscountSurfaceBridge();
