(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;
  if (!(surfaceLayerApi && typeof surfaceLayerApi === "object")) {
    throw new Error("OdooSurfaceLayers must be initialized before surface_workspace_shell debug runtime.");
  }
  var shared = surfaceLayerApi._shared;
  if (!(shared && typeof shared === "object")) {
    throw new Error("OdooSurfaceLayers._shared must be initialized before surface_workspace_shell debug runtime.");
  }
  var debugServicePromisesByKey =
    shared.debugServicePromisesByKey || (shared.debugServicePromisesByKey = Object.create(null));
  var cachedActionPromisesByKey =
    shared.cachedActionPromisesByKey || (shared.cachedActionPromisesByKey = Object.create(null));
  var suppressedNotificationObserver = null;
  var suppressedNotificationServiceInstalled = false;
  var suppressedNotificationServiceRetryTimer = 0;
  var suppressedNotificationServiceInstallAttempts = 0;
  var SURFACE_DESIGN_AUDIT_PRINCIPLES = Object.freeze([
    {
      key: "prefer-what-matters",
      decision: "When clarity conflicts with completeness, keep the highest-signal control visible and remove redundant copy.",
      audits: [
        "command-bar-redundant-title",
        "command-bar-redundant-description",
        "empty-preview-action-column",
        "preview-action-column-collapsed",
        "zero-value-metric-alert",
      ],
    },
    {
      key: "obvious-easy-possible",
      decision: "Make the primary task obvious, make repeated work fast, and keep advanced work possible through progressive depth.",
      audits: [
        "duplicate-menu-label",
        "redundant-menu-owner-label",
        "sidebar-flyout-geometry-drift",
        "surface-tab-missing-key",
        "surface-tab-missing-role",
      ],
    },
    {
      key: "usable-for-edge-benefits-all",
      decision: "Treat contrast, focus, density, and readable overlays as product requirements, not polish.",
      audits: [
        "list-row-overstretched",
        "list-table-inherits-empty-floor",
        "modal-close-filter-inverts-icon",
        "modal-close-low-contrast",
        "overlay-legibility-weak-separation",
        "surface-tab-flat-hit-target",
      ],
    },
    {
      key: "evidence-over-assumption",
      decision: "A design principle must resolve a trade-off and leave a measurable trace in live UI evidence.",
      audits: ["breadcrumb-ghost-after-workspace-exit", "metric-strip-not-right-anchored"],
    },
  ]);

  function getSurfaceDesignAuditPrinciples() {
    return SURFACE_DESIGN_AUDIT_PRINCIPLES.map(function (entry) {
      return Object.assign({}, entry, {
        audits: Array.isArray(entry.audits) ? entry.audits.slice() : [],
      });
    });
  }

  function normalizeSuppressedNotificationText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function buildSuppressedNotificationSignature(message, options) {
    var fragments = [];
    var settings = options && typeof options === "object" ? options : {};
    if (message != null) {
      fragments.push(String(message || ""));
    }
    ["title", "subtitle", "message", "body"].forEach(function (key) {
      if (settings[key] != null) {
        fragments.push(String(settings[key] || ""));
      }
    });
    return normalizeSuppressedNotificationText(fragments.join(" "));
  }

  function isSuppressedEmailLimitNotification(message, options) {
    var signature = buildSuppressedNotificationSignature(message, options);
    if (!signature) {
      return false;
    }
    if (
      signature.indexOf("you have reached your daily limit of 50 emails") !== -1 ||
      signature.indexOf("increase your daily limit to 200 emails") !== -1 ||
      signature.indexOf("alcanzaste el limite diario de correos electronicos") !== -1
    ) {
      return true;
    }
    return (
      signature.indexOf("daily limit") !== -1 &&
      signature.indexOf("emails") !== -1 &&
      (
        signature.indexOf("purchase a subscription") !== -1 ||
        signature.indexOf("odoo.com/help") !== -1
      )
    );
  }

  function suppressRenderedEmailLimitNotifications(rootNode) {
    var root = rootNode instanceof HTMLElement || rootNode instanceof Document ? rootNode : document;
    Array.prototype.slice.call(
      root.querySelectorAll(".o_notification, .o_notification_manager .o_notification, .o_notification_content, .o_notification_body")
    ).forEach(function (node) {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (!isSuppressedEmailLimitNotification(node.textContent || "", null)) {
        return;
      }
      var notificationNode = node.closest(".o_notification") || node;
      if (notificationNode instanceof HTMLElement) {
        notificationNode.remove();
      }
    });
  }

  function getOdooDebugServices() {
    try {
      var root = window.odoo && window.odoo.__WOWL_DEBUG__ && window.odoo.__WOWL_DEBUG__.root;
      return root && root.env && root.env.services ? root.env.services : null;
    } catch (_error) {
      return null;
    }
  }

  function getDefaultDebugServiceValidator(serviceKey) {
    var normalizedKey = String(serviceKey || "").trim().toLowerCase();
    if (normalizedKey === "action") {
      return function (service) {
        return !!(service && typeof service.doAction === "function" && typeof service.loadAction === "function");
      };
    }
    if (normalizedKey === "orm") {
      return function (service) {
        return !!(service && typeof service.searchRead === "function");
      };
    }
    if (normalizedKey === "menu") {
      return function (service) {
        return !!(service && typeof service.setCurrentMenu === "function" && typeof service.getApps === "function");
      };
    }
    if (normalizedKey === "notification") {
      return function (service) {
        return !!(service && typeof service.add === "function");
      };
    }
    return function (service) {
      return !!service;
    };
  }

  async function resolveDebugService(config) {
    var settings = config && typeof config === "object" ? config : {};
    var serviceKey = String(settings.serviceKey || "").trim();
    if (!serviceKey) {
      return null;
    }
    if (!debugServicePromisesByKey[serviceKey]) {
      debugServicePromisesByKey[serviceKey] = (async function () {
        var retryDelays = Array.isArray(settings.retryDelays) ? settings.retryDelays : [0, 60, 180, 360, 700, 1200];
        var validate = typeof settings.validate === "function" ? settings.validate : function (service) {
          return !!service;
        };
        for (var index = 0; index < retryDelays.length; index += 1) {
          if (retryDelays[index] > 0) {
            await new Promise(function (resolve) {
              window.setTimeout(resolve, retryDelays[index]);
            });
          }
          try {
            var services = getOdooDebugServices();
            var service = services && services[serviceKey];
            if (validate(service, services, settings)) {
              return service;
            }
          } catch (_error) {}
        }
        debugServicePromisesByKey[serviceKey] = null;
        return null;
      })();
    }
    return debugServicePromisesByKey[serviceKey];
  }

  async function resolveOdooService(config) {
    var settings = typeof config === "string" ? { serviceKey: config } : (config && typeof config === "object" ? config : {});
    var serviceKey = String(settings.serviceKey || "").trim();
    if (!serviceKey) {
      return null;
    }
    return resolveDebugService({
      serviceKey: serviceKey,
      retryDelays: settings.retryDelays,
      validate: typeof settings.validate === "function"
        ? settings.validate
        : getDefaultDebugServiceValidator(serviceKey),
    });
  }

  function clearDebugServiceResolver(serviceKey) {
    var normalizedKey = String(serviceKey || "").trim();
    if (!normalizedKey) {
      return;
    }
    delete debugServicePromisesByKey[normalizedKey];
  }

  async function resolveActionLoaderService(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (settings.actionService && typeof settings.actionService.loadAction === "function") {
      return settings.actionService;
    }
    if (typeof settings.resolveActionService === "function") {
      try {
        return await settings.resolveActionService();
      } catch (_error) {
        return null;
      }
    }
    return resolveOdooService("action");
  }

  async function loadCachedAction(config) {
    var settings = config && typeof config === "object" ? config : {};
    var actionId = Number.parseInt(String(settings.actionId || 0), 10) || 0;
    if (!(actionId > 0)) {
      return null;
    }
    var cacheKey = String(settings.cacheKey || actionId).trim();
    if (!cacheKey) {
      return null;
    }
    if (!cachedActionPromisesByKey[cacheKey]) {
      cachedActionPromisesByKey[cacheKey] = (async function () {
        var actionService = await resolveActionLoaderService(settings);
        if (!actionService || typeof actionService.loadAction !== "function") {
          cachedActionPromisesByKey[cacheKey] = null;
          return null;
        }
        try {
          return await actionService.loadAction(actionId, settings.options || {});
        } catch (error) {
          cachedActionPromisesByKey[cacheKey] = null;
          throw error;
        }
      })();
    }
    return cachedActionPromisesByKey[cacheKey];
  }

  function clearCachedAction(cacheKey) {
    var normalizedKey = String(cacheKey || "").trim();
    if (!normalizedKey) {
      return;
    }
    delete cachedActionPromisesByKey[normalizedKey];
  }

  function normalizeSurfaceAuditText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function readSurfaceAuditText(rootNode, selector) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var node = selector ? root.querySelector(selector) : root;
    return node instanceof HTMLElement ? String(node.textContent || "").replace(/\s+/g, " ").trim() : "";
  }

  function isSurfaceAuditNodeVisible(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    var style = window.getComputedStyle ? window.getComputedStyle(node) : null;
    return !!(
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      (!style || (style.display !== "none" && style.visibility !== "hidden"))
    );
  }

  function readSurfaceAuditRect(node) {
    if (!(node instanceof HTMLElement) || !isSurfaceAuditNodeVisible(node)) {
      return null;
    }
    return node.getBoundingClientRect ? node.getBoundingClientRect() : null;
  }

  function readSurfaceAuditVisibleNodes(rootNode, selector) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    if (!selector || !(root && typeof root.querySelectorAll === "function")) {
      return [];
    }
    return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(isSurfaceAuditNodeVisible);
  }

  function buildSurfaceDesignAuditFinding(rule, message, node, details) {
    return {
      rule: String(rule || "").trim(),
      severity: details && details.severity ? String(details.severity) : "warning",
      message: String(message || "").trim(),
      node: node instanceof HTMLElement ? node : null,
      selector: details && details.selector ? String(details.selector) : "",
      action: details && details.action ? String(details.action) : "",
    };
  }

  function auditSurfaceListDensity(rootNode, options) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var settings = options && typeof options === "object" ? options : {};
    var maxRowHeight = Math.max(Number(settings.maxListRowHeight || 72) || 72, 48);
    var findings = [];
    readSurfaceAuditVisibleNodes(root, ".o_content .o_list_renderer, .o_surface_premium_smart_table_shell").forEach(function (listNode) {
      if (listNode.closest && listNode.closest(".o_form_view")) {
        return;
      }
      var rows = readSurfaceAuditVisibleNodes(listNode, "tbody tr.o_data_row, .o_surface_premium_smart_table tbody tr");
      rows.forEach(function (rowNode) {
        var rowRect = readSurfaceAuditRect(rowNode);
        if (rowRect && rowRect.height > maxRowHeight) {
          findings.push(buildSurfaceDesignAuditFinding(
            "list-row-overstretched",
            "Visible list row is too tall for a dense operational workspace.",
            rowNode,
            {
              selector: "tbody tr.o_data_row",
              action: "Keep empty-list floor on the renderer/shell and reset table, tbody, tr and td height to auto/min-height 0.",
              height: Math.round(rowRect.height),
            }
          ));
        }
      });
      var tableNode = listNode.querySelector("table.o_list_table, table.o_surface_premium_smart_table");
      var tbodyNode = tableNode instanceof HTMLElement ? tableNode.querySelector("tbody") : null;
      var tableRect = readSurfaceAuditRect(tableNode);
      var tbodyRect = readSurfaceAuditRect(tbodyNode);
      if (rows.length === 1 && tableRect && tbodyRect && tableRect.height > 180 && tbodyRect.height > 90) {
        findings.push(buildSurfaceDesignAuditFinding(
          "list-table-inherits-empty-floor",
          "A sparse list lets the table body absorb the empty floor, creating a megafila.",
          tableNode,
          {
            selector: "table.o_list_table",
            action: "Move the visual floor to the renderer and force table/tbody/row/cell heights back to auto.",
            tableHeight: Math.round(tableRect.height),
            tbodyHeight: Math.round(tbodyRect.height),
          }
        ));
      }
      var previewHeader = listNode.querySelector(".o_surface_record_preview_header");
      if (previewHeader instanceof HTMLElement && isSurfaceAuditNodeVisible(previewHeader)) {
        var previewRect = readSurfaceAuditRect(previewHeader);
        var previewActions = readSurfaceAuditVisibleNodes(
          listNode,
          ".o_surface_record_preview_button, .o_surface_record_preview_cell [data-surface-preview]"
        );
        if (previewRect && previewRect.width < 72) {
          findings.push(buildSurfaceDesignAuditFinding(
            "preview-action-column-collapsed",
            "Preview/action column is visible but too narrow to be readable.",
            previewHeader,
            {
              selector: ".o_surface_record_preview_header",
              action: "Use the shared preview column width token or hide the preview column when no actions are available.",
              width: Math.round(previewRect.width),
            }
          ));
        }
        if (!previewActions.length) {
          findings.push(buildSurfaceDesignAuditFinding(
            "empty-preview-action-column",
            "Preview/action column is visible even though no row exposes preview actions.",
            previewHeader,
            {
              selector: ".o_surface_record_preview_header",
              action: "Do not render managed preview columns unless at least one visible row has an action, or pass keepEmptyColumn only for explicit placeholders.",
            }
          ));
        }
      }
    });
    return findings;
  }

  function auditSurfaceModalControlContrast(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    readSurfaceAuditVisibleNodes(root, ".modal .btn-close, .o_dialog .btn-close, .o_technical_modal .btn-close").forEach(function (closeButton) {
      if (!window.getComputedStyle) {
        return;
      }
      var style = window.getComputedStyle(closeButton);
      var filter = String(style.filter || "").trim().toLowerCase();
      var opacity = Number.parseFloat(style.opacity || "1");
      if (filter && filter !== "none") {
        findings.push(buildSurfaceDesignAuditFinding(
          "modal-close-filter-inverts-icon",
          "Modal close icon uses a CSS filter that can invert an already-white SVG to black.",
          closeButton,
          {
            selector: ".modal .btn-close",
            action: "Use the shared white close SVG token and keep filter: none for dark modals.",
          }
        ));
      }
      if (Number.isFinite(opacity) && opacity < 0.85) {
        findings.push(buildSurfaceDesignAuditFinding(
          "modal-close-low-contrast",
          "Modal close icon is too faint for a dark dialog surface.",
          closeButton,
          {
            selector: ".modal .btn-close",
            action: "Raise close-control opacity to at least 0.9 and keep a visible focus state.",
          }
        ));
      }
    });
    return findings;
  }

  function auditSurfaceTabGrammar(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    readSurfaceAuditVisibleNodes(root, "[data-surface-tab='1'], [data-surface-toolbar-control='tab']").forEach(function (tabNode) {
      var key = String(tabNode.dataset.surfaceTabKey || tabNode.getAttribute("data-surface-tab-key") || "").trim();
      var role = String(tabNode.getAttribute("role") || "").trim().toLowerCase();
      var style = window.getComputedStyle ? window.getComputedStyle(tabNode) : null;
      var radius = style ? String(style.borderRadius || "").trim().toLowerCase() : "";
      if (!key) {
        findings.push(buildSurfaceDesignAuditFinding(
          "surface-tab-missing-key",
          "Surface tab is visible without a stable data key.",
          tabNode,
          {
            selector: "[data-surface-tab='1']",
            action: "Provide data-surface-tab-key so state, analytics, and audit evidence do not depend on labels.",
          }
        ));
      }
      if (role !== "tab") {
        findings.push(buildSurfaceDesignAuditFinding(
          "surface-tab-missing-role",
          "Surface tab is missing role='tab'.",
          tabNode,
          {
            selector: "[data-surface-tab='1']",
            action: "Use the shared workspace tab primitive or set role='tab' with aria-selected.",
          }
        ));
      }
      if (radius === "0px" || radius === "0") {
        findings.push(buildSurfaceDesignAuditFinding(
          "surface-tab-flat-hit-target",
          "Surface tab has a flat zero-radius hit target that breaks the shared tab grammar.",
          tabNode,
          {
            selector: "[data-surface-tab='1']",
            action: "Use the shared tab radius token so active, hover, and focus states read as one system.",
          }
        ));
      }
    });
    return findings;
  }

  function auditSurfaceMetricPlacement(rootNode, options) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var settings = options && typeof options === "object" ? options : {};
    var viewportWidth = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
    if (settings.enforceMetricRightRail === false || viewportWidth < 900) {
      return [];
    }
    var findings = [];
    readSurfaceAuditVisibleNodes(root, ".o_surface_workspace_toolbar").forEach(function (toolbarNode) {
      var consoleNode = toolbarNode.querySelector(".o_surface_workspace_console");
      var metricsNode = toolbarNode.querySelector("[data-surface-console-region='metrics'], .o_surface_premium_metric_strip");
      var consoleRect = readSurfaceAuditRect(consoleNode);
      var metricsRect = readSurfaceAuditRect(metricsNode);
      if (!(consoleRect && metricsRect)) {
        return;
      }
      if (metricsRect.left >= consoleRect.left && metricsRect.right >= consoleRect.right) {
        return;
      }
      findings.push(buildSurfaceDesignAuditFinding(
        "metric-strip-not-right-anchored",
        "Metric strip is not anchored as the right rail of the workspace toolbar.",
        metricsNode,
        {
          selector: ".o_surface_premium_metric_strip",
          action: "Place operational stats in the shared right-side metrics region and keep search/filters in the main command lane.",
        }
      ));
    });
    return findings;
  }

  function auditSurfaceCommandBarRedundancy(rootNode, options) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var settings = options && typeof options === "object" ? options : {};
    var findings = [];
    var pageTitle = normalizeSurfaceAuditText(
      settings.pageTitle ||
      readSurfaceAuditText(root, ".o_control_panel .breadcrumb .active, .o_control_panel .o_last_breadcrumb_item, .o_main_navbar .breadcrumb .active, .o_main_navbar .o_last_breadcrumb_item")
    );
    Array.prototype.slice.call(root.querySelectorAll(".o_surface_premium_command_bar")).forEach(function (commandBar) {
      if (!(commandBar instanceof HTMLElement)) {
        return;
      }
      var titleNode = commandBar.querySelector(".o_surface_premium_command_bar__title");
      var descriptionNode = commandBar.querySelector(".o_surface_premium_command_bar__description, .o_surface_premium_command_bar__subtitle");
      var title = normalizeSurfaceAuditText(titleNode && titleNode.textContent);
      var description = normalizeSurfaceAuditText(descriptionNode && descriptionNode.textContent);
      if (title && pageTitle && title === pageTitle && !commandBar.classList.contains("o_surface_premium_command_bar--compact")) {
        findings.push(buildSurfaceDesignAuditFinding(
          "command-bar-redundant-title",
          "Command bar repeats the active Odoo page title.",
          commandBar,
          {
            selector: ".o_surface_premium_command_bar__title",
            action: "Use compact: true, showHeader: false, or hideTitle: true when the Odoo page title is already visible.",
          }
        ));
      }
      if (description && title && (description === title || description.indexOf(title) === 0)) {
        findings.push(buildSurfaceDesignAuditFinding(
          "command-bar-redundant-description",
          "Command bar description repeats the title instead of adding actionable context.",
          commandBar,
          {
            selector: ".o_surface_premium_command_bar__description",
            action: "Remove the description, pass hideDescription: true, or replace it with task-specific context.",
          }
        ));
      }
    });
    return findings;
  }

  function auditSurfaceOverlayLegibility(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    Array.prototype.slice.call(root.querySelectorAll(
      ".o_surface_premium_inspector__drawer, .o_surface_premium_code_modal__dialog, .o_surface_premium_panel, .o_surface_sidebar_shell_menu_popover, [data-surface-overlay='1']"
    )).forEach(function (node) {
      if (!isSurfaceAuditNodeVisible(node) || !window.getComputedStyle) {
        return;
      }
      var style = window.getComputedStyle(node);
      var background = String(style.backgroundColor || "");
      var boxShadow = String(style.boxShadow || "");
      var backdropFilter = String(style.backdropFilter || style.webkitBackdropFilter || "");
      var borderColor = String(style.borderColor || "");
      var translucent = /rgba\([^)]*,\s*(0(?:\.\d+)?|1?\.0*)\)/i.test(background) &&
        !/rgba\([^)]*,\s*1(?:\.0*)?\)/i.test(background);
      if (translucent && boxShadow === "none" && !backdropFilter && (!borderColor || borderColor === "transparent")) {
        findings.push(buildSurfaceDesignAuditFinding(
          "overlay-legibility-weak-separation",
          "Overlay uses translucent paint without enough separation from content behind it.",
          node,
          {
            selector: ".o_surface_premium_panel, [data-surface-overlay='1']",
            action: "Add an opaque panel token, border, backdrop-filter, or shadow token before placing text over busy content.",
          }
        ));
      }
    });
    return findings;
  }

  function auditSurfaceMenuDuplicateLabels(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    Array.prototype.slice.call(root.querySelectorAll(".o_surface_sidebar_shell_menu_popover")).forEach(function (popoverNode) {
      if (!isSurfaceAuditNodeVisible(popoverNode)) {
        return;
      }
      var counts = Object.create(null);
      Array.prototype.slice.call(popoverNode.querySelectorAll(
        ":scope > .dropdown-item, :scope > .o-dropdown-item, :scope > [role='menuitem']"
      )).forEach(function (itemNode) {
        if (!isSurfaceAuditNodeVisible(itemNode)) {
          return;
        }
        var label = normalizeSurfaceAuditText(itemNode.textContent);
        if (!label) {
          return;
        }
        counts[label] = (counts[label] || 0) + 1;
      });
      Object.keys(counts).forEach(function (label) {
        if (counts[label] <= 1) {
          return;
        }
        findings.push(buildSurfaceDesignAuditFinding(
          "duplicate-menu-label",
          "Visible menu flyout repeats the same label without enough context.",
          popoverNode,
          {
            selector: ".o_surface_sidebar_shell_menu_popover",
            action: "Use distinct action labels, keep group headers visible, or nest repeated labels under separate branches.",
          }
        ));
      });
      var ownerLabel = normalizeSurfaceAuditText(popoverNode.dataset.surfaceSidebarOwnerLabel || "");
      if (ownerLabel && counts[ownerLabel]) {
        findings.push(buildSurfaceDesignAuditFinding(
          "redundant-menu-owner-label",
          "Visible menu flyout repeats its owner label as a direct child action.",
          popoverNode,
          {
            selector: ".o_surface_sidebar_shell_menu_popover",
            action: "Rename the grouping label, flatten the action, or move the repeated child to the parent level.",
          }
        ));
      }
    });
    return findings;
  }

  function resolveSurfaceAuditParentMenuPopover(rootNode, popoverNode, allPopovers) {
    if (!(popoverNode instanceof HTMLElement)) {
      return null;
    }
    var parentNode = popoverNode.parentElement || popoverNode.parentNode;
    while (parentNode && parentNode !== rootNode) {
      if (
        parentNode instanceof HTMLElement &&
        parentNode.classList.contains("o_surface_sidebar_shell_menu_popover")
      ) {
        return parentNode;
      }
      parentNode = parentNode.parentElement || parentNode.parentNode;
    }
    var ownerTriggerId = String(popoverNode.dataset.surfaceSidebarOwnerTriggerId || "").trim();
    if (ownerTriggerId && rootNode && typeof rootNode.querySelector === "function") {
      var ownerTrigger = rootNode.querySelector('[data-surface-sidebar-trigger-id="' + ownerTriggerId + '"]');
      var ownerPopover = ownerTrigger instanceof HTMLElement
        ? ownerTrigger.closest(".o_surface_sidebar_shell_menu_popover")
        : null;
      if (ownerPopover instanceof HTMLElement) {
        return ownerPopover;
      }
    }
    var level = Math.max(Number(popoverNode.dataset.surfaceSidebarLevel || 0) || 0, 0);
    if (level <= 1) {
      return null;
    }
    return (Array.isArray(allPopovers) ? allPopovers : []).find(function (candidateNode) {
      return candidateNode instanceof HTMLElement &&
        candidateNode !== popoverNode &&
        Math.max(Number(candidateNode.dataset.surfaceSidebarLevel || 0) || 0, 0) === level - 1;
    }) || null;
  }

  function auditSurfaceSidebarFlyoutGeometry(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    var popovers = Array.prototype.slice.call(root.querySelectorAll(".o_surface_sidebar_shell_menu_popover")).filter(function (popoverNode) {
      return isSurfaceAuditNodeVisible(popoverNode) &&
        Math.max(Number(popoverNode.dataset.surfaceSidebarLevel || 1) || 1, 1) > 1;
    });
    popovers.forEach(function (popoverNode) {
      var parentPopover = resolveSurfaceAuditParentMenuPopover(root, popoverNode, popovers);
      if (!(parentPopover instanceof HTMLElement) || !isSurfaceAuditNodeVisible(parentPopover)) {
        return;
      }
      var popoverRect = popoverNode.getBoundingClientRect();
      var parentRect = parentPopover.getBoundingClientRect();
      var side = String(popoverNode.dataset.surfaceSidebarSide || "right").trim() || "right";
      var gap = side === "left"
        ? parentRect.left - popoverRect.right
        : popoverRect.left - parentRect.right;
      var maxGap = Math.max(Number(popoverNode.dataset.surfaceSidebarMaxNestedGap || 8) || 8, 4) + 4;
      if (gap >= 2 && gap <= maxGap) {
        return;
      }
      findings.push(buildSurfaceDesignAuditFinding(
        "sidebar-flyout-geometry-drift",
        "Nested sidebar flyout is not visually attached to its parent menu.",
        popoverNode,
        {
          selector: ".o_surface_sidebar_shell_menu_popover",
          action: "Anchor nested flyouts to the parent popover edge and convert viewport coordinates to local containing-block offsets when the submenu is rendered inside its parent.",
          gap: Math.round(gap),
          side: side,
        }
      ));
    });
    return findings;
  }

  function isSurfaceMetricZeroValue(value) {
    var normalized = String(value || "")
      .replace(/[^\d.,-]/g, "")
      .replace(/,/g, ".");
    var numeric = Number.parseFloat(normalized || "0");
    return Number.isFinite(numeric) && Math.abs(numeric) < 0.00001;
  }

  function auditSurfaceMetricSignal(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    Array.prototype.slice.call(root.querySelectorAll(".o_surface_premium_metric")).forEach(function (metricNode) {
      if (!isSurfaceAuditNodeVisible(metricNode)) {
        return;
      }
      var valueNode = metricNode.querySelector(".o_surface_premium_metric__value");
      var trendNode = metricNode.querySelector(".o_surface_premium_metric__trend");
      var value = valueNode instanceof HTMLElement ? valueNode.textContent : "";
      var trend = trendNode instanceof HTMLElement ? String(trendNode.textContent || "").trim() : "";
      if (trend && isSurfaceMetricZeroValue(value)) {
        findings.push(buildSurfaceDesignAuditFinding(
          "zero-value-metric-alert",
          "Metric with a zero value still shows an alert or status chip.",
          metricNode,
          {
            selector: ".o_surface_premium_metric__trend",
            action: "Hide the trend chip for neutral zero values or convert it to a truly informative state.",
          }
        ));
      }
    });
    return findings;
  }

  function auditSurfaceBreadcrumbGhostState(rootNode) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var body = document.body;
    if (body && body.classList && body.classList.contains("o_surface_workspace_active")) {
      return [];
    }
    var managedBreadcrumb = root.querySelector(
      "[data-surface-breadcrumb-managed='1'], [data-surface-breadcrumb-root='1'], [data-surface-breadcrumb-synthetic='1']"
    );
    if (!(managedBreadcrumb instanceof HTMLElement)) {
      return [];
    }
    return [buildSurfaceDesignAuditFinding(
      "breadcrumb-ghost-after-workspace-exit",
      "Managed surface breadcrumb is still present after the workspace body state is inactive.",
      managedBreadcrumb,
      {
        selector: "[data-surface-breadcrumb-managed='1'], [data-surface-breadcrumb-root='1'], [data-surface-breadcrumb-synthetic='1']",
        action: "Call restoreCanonicalBreadcrumb on inactive workspace transitions and clear synthetic breadcrumb nodes.",
      }
    )];
  }

  function auditSurfaceWorkspaceDesign(rootNode, options) {
    var root = rootNode instanceof Element || rootNode instanceof Document ? rootNode : document;
    var findings = [];
    [
      auditSurfaceCommandBarRedundancy,
      auditSurfaceOverlayLegibility,
      auditSurfaceBreadcrumbGhostState,
      auditSurfaceListDensity,
      auditSurfaceMenuDuplicateLabels,
      auditSurfaceMetricPlacement,
      auditSurfaceModalControlContrast,
      auditSurfaceSidebarFlyoutGeometry,
      auditSurfaceTabGrammar,
      auditSurfaceMetricSignal,
    ].forEach(function (auditRule) {
      findings = findings.concat(auditRule(root, options));
    });
    return findings.filter(function (finding) {
      return finding && finding.rule && finding.message;
    });
  }

  function installSuppressedNotificationObserver() {
    if (suppressedNotificationObserver || !(document.documentElement instanceof HTMLElement)) {
      return;
    }
    suppressedNotificationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          if (
            node.matches(".o_notification, .o_notification_manager, .o_notification_content, .o_notification_body") ||
            node.querySelector(".o_notification, .o_notification_content, .o_notification_body")
          ) {
            suppressRenderedEmailLimitNotifications(node);
          }
        });
      });
    });
    suppressedNotificationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    suppressRenderedEmailLimitNotifications(document);
  }

  function scheduleSuppressedNotificationServiceInstall(delayMs) {
    if (suppressedNotificationServiceInstalled || suppressedNotificationServiceRetryTimer) {
      return;
    }
    suppressedNotificationServiceRetryTimer = window.setTimeout(function () {
      suppressedNotificationServiceRetryTimer = 0;
      installSuppressedNotificationService().catch(function () {});
    }, Math.max(Number(delayMs || 0) || 0, 0));
  }

  async function installSuppressedNotificationService() {
    if (suppressedNotificationServiceInstalled) {
      return true;
    }
    var service = await resolveDebugService({
      serviceKey: "notification",
      retryDelays: [0, 80, 180, 320, 520, 900, 1500, 2400],
      validate: function (candidate) {
        return !!(candidate && typeof candidate.add === "function");
      },
    });
    if (!service || typeof service.add !== "function") {
      suppressedNotificationServiceInstallAttempts += 1;
      scheduleSuppressedNotificationServiceInstall(
        Math.min(6000, 600 + suppressedNotificationServiceInstallAttempts * 600)
      );
      return false;
    }
    if (service.add.__surfaceSuppressedEmailLimitWrapped === true) {
      suppressedNotificationServiceInstalled = true;
      suppressedNotificationServiceInstallAttempts = 0;
      installSuppressedNotificationObserver();
      return true;
    }
    var originalAdd = service.add.bind(service);
    var wrappedAdd = function (message, options) {
      if (isSuppressedEmailLimitNotification(message, options)) {
        window.setTimeout(function () {
          suppressRenderedEmailLimitNotifications(document);
        }, 0);
        return function () {};
      }
      return originalAdd(message, options);
    };
    wrappedAdd.__surfaceSuppressedEmailLimitWrapped = true;
    wrappedAdd.__surfaceOriginalAdd = originalAdd;
    service.add = wrappedAdd;
    suppressedNotificationServiceInstalled = true;
    suppressedNotificationServiceInstallAttempts = 0;
    installSuppressedNotificationObserver();
    return true;
  }

  installSuppressedNotificationObserver();
  installSuppressedNotificationService().catch(function () {});

  Object.assign(surfaceLayerApi, {
    getOdooDebugServices: getOdooDebugServices,
    resolveDebugService: resolveDebugService,
    resolveOdooService: resolveOdooService,
    clearDebugServiceResolver: clearDebugServiceResolver,
    loadCachedAction: loadCachedAction,
    clearCachedAction: clearCachedAction,
    getSurfaceDesignAuditPrinciples: getSurfaceDesignAuditPrinciples,
    normalizeSurfaceAuditText: normalizeSurfaceAuditText,
    auditSurfaceCommandBarRedundancy: auditSurfaceCommandBarRedundancy,
    auditSurfaceOverlayLegibility: auditSurfaceOverlayLegibility,
    auditSurfaceBreadcrumbGhostState: auditSurfaceBreadcrumbGhostState,
    auditSurfaceListDensity: auditSurfaceListDensity,
    auditSurfaceMenuDuplicateLabels: auditSurfaceMenuDuplicateLabels,
    auditSurfaceMetricPlacement: auditSurfaceMetricPlacement,
    auditSurfaceModalControlContrast: auditSurfaceModalControlContrast,
    auditSurfaceSidebarFlyoutGeometry: auditSurfaceSidebarFlyoutGeometry,
    auditSurfaceTabGrammar: auditSurfaceTabGrammar,
    auditSurfaceMetricSignal: auditSurfaceMetricSignal,
    auditSurfaceWorkspaceDesign: auditSurfaceWorkspaceDesign,
    isSuppressedEmailLimitNotification: isSuppressedEmailLimitNotification,
    suppressRenderedEmailLimitNotifications: suppressRenderedEmailLimitNotifications,
    installSuppressedNotificationService: installSuppressedNotificationService,
  });
})();
