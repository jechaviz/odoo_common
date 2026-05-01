(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace menu.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSharedState(surfaceLayerApi) {
    if (!(surfaceLayerApi._shared && typeof surfaceLayerApi._shared === "object")) {
      throw new Error("OdooSurfaceLayers._shared must be initialized before surface workspace menu.");
    }
    return surfaceLayerApi._shared;
  }

  function requireSurfaceLayerFunction(surfaceLayerApi, name) {
    var candidate = surfaceLayerApi && surfaceLayerApi[name];
    if (typeof candidate !== "function") {
      throw new Error(
        "Missing required OdooSurfaceLayers." + String(name || "").trim() +
        " before surface workspace menu."
      );
    }
    return candidate;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var shared = requireSharedState(surfaceLayerApi);
  var menuContextRefreshStatesByKey =
    shared.menuContextRefreshStatesByKey || (shared.menuContextRefreshStatesByKey = Object.create(null));

  function getCurrentMenuApp(menuService) {
    if (!menuService || typeof menuService.getCurrentApp !== "function") {
      return null;
    }
    try {
      return menuService.getCurrentApp() || null;
    } catch (_error) {
      return null;
    }
  }

  function appMatchesConfig(app, config) {
    var settings = config && typeof config === "object" ? config : {};
    var xmlid = String(settings.xmlid || "").trim();
    var name = String(settings.name || "").trim().toLowerCase();
    return !!(
      app &&
      (
        (xmlid && String(app.xmlid || "").trim() === xmlid) ||
        (name && String(app.name || "").trim().toLowerCase() === name)
      )
    );
  }

  function resolveMenuAppId(menuService, config) {
    if (!menuService || typeof menuService.getApps !== "function") {
      return 0;
    }
    try {
      var apps = menuService.getApps();
      var list = Array.isArray(apps) ? apps : [];
      var targetApp = list.find(function (app) {
        return appMatchesConfig(app, config);
      }) || null;
      return Number(targetApp && targetApp.id || targetApp && targetApp.appID || 0) || 0;
    } catch (_error) {
      return 0;
    }
  }

  function isMenuAppActive(menuService, config) {
    return appMatchesConfig(getCurrentMenuApp(menuService), config);
  }

  function resolveMenuContextRefreshState(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (settings.refreshState && typeof settings.refreshState === "object") {
      if (!Number.isFinite(Number(settings.refreshState.token))) {
        settings.refreshState.token = 0;
      }
      if (!Number.isFinite(Number(settings.refreshState.timer))) {
        settings.refreshState.timer = 0;
      }
      return settings.refreshState;
    }
    var cacheKey = String(settings.cacheKey || settings.stateKey || "").trim();
    if (!cacheKey) {
      return { timer: 0, token: 0 };
    }
    if (!menuContextRefreshStatesByKey[cacheKey]) {
      menuContextRefreshStatesByKey[cacheKey] = { timer: 0, token: 0 };
    }
    return menuContextRefreshStatesByKey[cacheKey];
  }

  async function resolveMenuContextService(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (settings.menuService && typeof settings.menuService.setCurrentMenu === "function") {
      return settings.menuService;
    }
    if (typeof settings.resolveMenuService === "function") {
      try {
        return await settings.resolveMenuService();
      } catch (_error) {
        return null;
      }
    }
    return requireSurfaceLayerFunction(surfaceLayerApi, "resolveOdooService")("menu");
  }

  function isMenuContextReady(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.isReady === "function") {
      try {
        return !!settings.isReady(settings);
      } catch (_error) {
        return false;
      }
    }
    if (settings.requireVisibleEntries === true && typeof settings.hasVisibleEntries === "function") {
      try {
        return !!settings.hasVisibleEntries(settings);
      } catch (_error) {
        return false;
      }
    }
    return true;
  }

  function clearMenuAppContextRefresh(config) {
    var state = resolveMenuContextRefreshState(config);
    state.token = (Number(state.token || 0) || 0) + 1;
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = 0;
    }
    return state;
  }

  async function ensureMenuAppContext(config) {
    var settings = config && typeof config === "object" ? config : {};
    if (typeof settings.shouldHandle === "function") {
      try {
        if (!settings.shouldHandle(settings)) {
          if (settings.clearRefreshStateOnSkip !== false) {
            clearMenuAppContextRefresh(settings);
          }
          return false;
        }
      } catch (_error) {
        return false;
      }
    }
    var menuService = await resolveMenuContextService(settings);
    if (!menuService) {
      return false;
    }
    var appConfig = settings.appConfig && typeof settings.appConfig === "object"
      ? settings.appConfig
      : { xmlid: settings.xmlid, name: settings.name };
    if (isMenuAppActive(menuService, appConfig) && isMenuContextReady(settings)) {
      return false;
    }
    var menuId = resolveMenuAppId(menuService, appConfig);
    if (!(menuId > 0)) {
      return false;
    }
    if (typeof settings.beforeActivate === "function") {
      try {
        settings.beforeActivate(menuService, menuId, settings);
      } catch (_error) {}
    }
    try {
      await menuService.setCurrentMenu(menuId);
      if (typeof settings.afterActivate === "function") {
        try {
          settings.afterActivate(menuService, menuId, settings);
        } catch (_error) {}
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  function scheduleMenuAppContextRefresh(config) {
    var settings = config && typeof config === "object" ? config : {};
    var state = clearMenuAppContextRefresh(settings);
    if (typeof settings.shouldHandle === "function") {
      try {
        if (!settings.shouldHandle(settings)) {
          return state;
        }
      } catch (_error) {
        return state;
      }
    }
    var refreshToken = state.token;
    var retryDelays = Array.isArray(settings.retryDelays) && settings.retryDelays.length
      ? settings.retryDelays
      : [0, 120, 320, 700, 1400];

    async function runRetry(index) {
      if (refreshToken !== state.token) {
        return;
      }
      if (typeof settings.shouldHandle === "function") {
        try {
          if (!settings.shouldHandle(settings)) {
            return;
          }
        } catch (_error) {
          return;
        }
      }
      await ensureMenuAppContext(Object.assign({}, settings, {
        refreshState: state,
        clearRefreshStateOnSkip: false,
      }));
      if (isMenuContextReady(settings) || index >= retryDelays.length - 1) {
        return;
      }
      state.timer = window.setTimeout(function () {
        runRetry(index + 1).catch(function () {});
      }, retryDelays[index + 1]);
    }

    runRetry(0).catch(function () {});
    return state;
  }

  Object.assign(surfaceLayerApi, {
    getCurrentMenuApp: getCurrentMenuApp,
    resolveMenuAppId: resolveMenuAppId,
    isMenuAppActive: isMenuAppActive,
    clearMenuAppContextRefresh: clearMenuAppContextRefresh,
    ensureMenuAppContext: ensureMenuAppContext,
    scheduleMenuAppContextRefresh: scheduleMenuAppContextRefresh,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
