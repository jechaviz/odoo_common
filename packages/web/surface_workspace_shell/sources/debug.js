(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers || {};
  var shared = surfaceLayerApi._shared || (surfaceLayerApi._shared = {});
  var debugServicePromisesByKey =
    shared.debugServicePromisesByKey || (shared.debugServicePromisesByKey = Object.create(null));
  var cachedActionPromisesByKey =
    shared.cachedActionPromisesByKey || (shared.cachedActionPromisesByKey = Object.create(null));
  var suppressedNotificationObserver = null;
  var suppressedNotificationServiceInstalled = false;
  var suppressedNotificationServiceRetryTimer = 0;
  var suppressedNotificationServiceInstallAttempts = 0;

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
    isSuppressedEmailLimitNotification: isSuppressedEmailLimitNotification,
    suppressRenderedEmailLimitNotifications: suppressRenderedEmailLimitNotifications,
    installSuppressedNotificationService: installSuppressedNotificationService,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
