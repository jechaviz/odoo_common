(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;
  if (!(surfaceLayerApi && typeof surfaceLayerApi === "object")) {
    throw new Error("surface route runtime requires the canonical OdooSurfaceLayers bootstrap.");
  }
  var shared = surfaceLayerApi._shared;
  if (!(shared && typeof shared === "object")) {
    throw new Error("surface route runtime requires the canonical shared surface state.");
  }
  var historyPatchBindingsByKey = shared.historyPatchBindingsByKey || (shared.historyPatchBindingsByKey = Object.create(null));
  var SURFACE_ROUTE_PRESENTATION_STORAGE_KEY = "odoo.surface.routePresentation";

  function normalizeSurfaceQueryParamSpecs(config) {
    return Array.isArray(config && config.params) ? config.params : [];
  }

  function parseSearchParams(rawValue) {
    try {
      return new URLSearchParams(String(rawValue || ""));
    } catch (_error) {
      return new URLSearchParams("");
    }
  }

  function extractActionIdsFromPathname(pathname) {
    var normalizedPathname = surfaceLayerApi.normalizePathname(pathname);
    return Array.from(String(normalizedPathname || "").matchAll(/action-(\d+)/g)).map(function (entry) {
      return Number.parseInt(String(entry && entry[1] || ""), 10) || 0;
    }).filter(function (actionId) {
      return actionId > 0;
    });
  }

  function resolveLastActionIdFromPathname(pathname) {
    var actionIds = extractActionIdsFromPathname(pathname);
    return actionIds.length ? actionIds[actionIds.length - 1] : 0;
  }

  function resolveStoredActionId(actionRequest) {
    if (typeof actionRequest === "number") {
      return Number.isFinite(actionRequest) && actionRequest > 0 ? Math.trunc(actionRequest) : 0;
    }
    if (typeof actionRequest === "string") {
      return Number.parseInt(String(actionRequest || "").trim(), 10) || 0;
    }
    return 0;
  }

  function isSurfaceActionSegment(value) {
    return /^action-\d+$/i.test(String(value || "").trim());
  }

  function isSurfaceNumericSegment(value) {
    return /^\d+$/.test(String(value || "").trim());
  }

  function buildCanonicalSurfaceActionPathname(pathname) {
    var normalizedPathname = surfaceLayerApi.normalizePathname(pathname);
    var segments = String(normalizedPathname || "").split("/").filter(Boolean);
    var actionIndices = [];
    segments.forEach(function (segment, index) {
      if (isSurfaceActionSegment(segment)) {
        actionIndices.push(index);
      }
    });
    if (!actionIndices.length) {
      return normalizedPathname;
    }
    var firstActionIndex = actionIndices[0];
    var lastActionIndex = actionIndices[actionIndices.length - 1];
    var trailingSegments = segments.slice(lastActionIndex + 1);
    var hasChainedActions = actionIndices.length > 1;
    var hasUnsupportedTrailingSegments =
      trailingSegments.length > 1 ||
      (trailingSegments.length === 1 && !isSurfaceNumericSegment(trailingSegments[0]));
    if (!hasChainedActions && !hasUnsupportedTrailingSegments) {
      return normalizedPathname;
    }
    var canonicalSegments = segments.slice(0, firstActionIndex);
    canonicalSegments.push(segments[lastActionIndex]);
    if (isSurfaceNumericSegment(trailingSegments[0])) {
      canonicalSegments.push(trailingSegments[0]);
    }
    return canonicalSegments.length ? "/" + canonicalSegments.join("/") : "/";
  }

  function canonicalizeSurfaceActionUrl(urlObject) {
    if (!(urlObject instanceof URL)) {
      return urlObject;
    }
    var canonicalPathname = buildCanonicalSurfaceActionPathname(urlObject.pathname);
    if (canonicalPathname && canonicalPathname !== urlObject.pathname) {
      urlObject.pathname = canonicalPathname;
    }
    return urlObject;
  }

  function readSurfaceUrlParams(rawHref) {
    var href = String(rawHref || window.location.href || "").trim();
    try {
      return new URL(href, window.location.origin).searchParams;
    } catch (_error) {
      return parseSearchParams(window.location.search || "");
    }
  }

  function resolveCurrentActionIdFromUrl(sourceUrl) {
    var resolvedUrl = null;
    var pathname = "";
    var searchParams = null;
    var hashParams = null;
    if (sourceUrl instanceof URL) {
      resolvedUrl = sourceUrl;
    } else if (typeof sourceUrl === "string" && String(sourceUrl || "").trim()) {
      try {
        resolvedUrl = new URL(String(sourceUrl || "").trim(), window.location.origin);
      } catch (_error) {
        resolvedUrl = null;
      }
    }
    if (resolvedUrl instanceof URL) {
      pathname = String(resolvedUrl.pathname || "");
      searchParams = resolvedUrl.searchParams;
      hashParams = parseSearchParams(String(resolvedUrl.hash || "").replace(/^#/, ""));
    } else {
      pathname = String(window.location.pathname || "");
      searchParams = readSurfaceUrlParams();
      hashParams = parseSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    }
    var pathnameActionId = resolveLastActionIdFromPathname(pathname);
    var searchActionId = Number.parseInt(String(searchParams && searchParams.get("action") || 0), 10) || 0;
    var hashActionId = Number.parseInt(String(hashParams && hashParams.get("action") || 0), 10) || 0;
    return hashActionId || searchActionId || pathnameActionId || 0;
  }

  function readCurrentSurfaceActionId() {
    return resolveCurrentActionIdFromUrl(null);
  }

  function normalizeSurfaceActionIdList(actionIds) {
    return (Array.isArray(actionIds) ? actionIds : []).map(function (actionId) {
      return Number.parseInt(String(actionId || 0), 10) || 0;
    }).filter(function (actionId) {
      return actionId > 0;
    });
  }

  function extractActionIdsFromUrl(sourceUrl) {
    var resolvedUrl = null;
    var pathname = "";
    var searchParams = null;
    var hashParams = null;
    if (sourceUrl instanceof URL) {
      resolvedUrl = sourceUrl;
    } else if (typeof sourceUrl === "string" && String(sourceUrl || "").trim()) {
      try {
        resolvedUrl = new URL(String(sourceUrl || "").trim(), window.location.origin);
      } catch (_error) {
        resolvedUrl = null;
      }
    }
    if (resolvedUrl instanceof URL) {
      pathname = String(resolvedUrl.pathname || "");
      searchParams = resolvedUrl.searchParams;
      hashParams = parseSearchParams(String(resolvedUrl.hash || "").replace(/^#/, ""));
    } else {
      pathname = String(window.location.pathname || "");
      searchParams = readSurfaceUrlParams();
      hashParams = parseSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    }
    var actionIds = extractActionIdsFromPathname(pathname);
    [searchParams, hashParams].forEach(function (params) {
      var actionId = Number.parseInt(String(params && params.get("action") || 0), 10) || 0;
      if (actionId > 0) {
        actionIds.push(actionId);
      }
    });
    return normalizeSurfaceActionIdList(actionIds);
  }

  function resolveSurfaceWorkspaceOwnership(config, options) {
    var settings = config && typeof config === "object" ? config : {};
    var routeOptions = options && typeof options === "object" ? options : {};
    var sourceUrl = routeOptions.url instanceof URL ? routeOptions.url : null;
    var currentActionId = Number.parseInt(
      String(routeOptions.currentActionId || resolveCurrentActionIdFromUrl(sourceUrl || undefined) || 0),
      10
    ) || 0;
    var configuredActionIds = normalizeSurfaceActionIdList(settings.actionIds);
    var currentActionIds = normalizeSurfaceActionIdList(routeOptions.actionIds);
    if (!currentActionIds.length) {
      currentActionIds = extractActionIdsFromUrl(sourceUrl || undefined);
    }
    var hasExplicitRoute = currentActionIds.length > 0;
    var matchesAction = configuredActionIds.some(function (actionId) {
      return currentActionId > 0 && actionId === currentActionId;
    });
    var currentBreadcrumbWorkspaceKey = String(routeOptions.currentBreadcrumbWorkspaceKey || "")
      .replace(/\s+/g, " ")
      .trim();
    var hasManagedTrail = routeOptions.hasManagedTrail === true;
    var workspaceKey = String(settings.key || "").trim();
    var owned = currentActionId > 0 && configuredActionIds.length
      ? !!matchesAction
      : hasExplicitRoute && hasManagedTrail && currentBreadcrumbWorkspaceKey
      ? currentBreadcrumbWorkspaceKey === workspaceKey
      : !!matchesAction;
    return {
      currentActionId: currentActionId,
      configuredActionIds: configuredActionIds,
      currentActionIds: currentActionIds,
      hasExplicitRoute: hasExplicitRoute,
      matchesAction: matchesAction,
      currentBreadcrumbWorkspaceKey: currentBreadcrumbWorkspaceKey,
      hasManagedTrail: hasManagedTrail,
      owned: owned,
    };
  }

  function normalizeSurfaceRoutePresentationMode(mode) {
    var normalizedMode = String(mode || "").trim().toLowerCase();
    if (normalizedMode === "query" || normalizedMode === "hash" || normalizedMode === "path-tail") {
      return normalizedMode;
    }
    return "off";
  }

  function normalizeSurfaceRoutePresentationConfig(config) {
    var source = config && typeof config === "object" ? config : {};
    var mode = normalizeSurfaceRoutePresentationMode(source.mode);
    var enabled = Object.prototype.hasOwnProperty.call(source, "enabled")
      ? !!source.enabled
      : mode !== "off";
    var maxSegments = Number.parseInt(String(source.maxSegments || 0), 10) || 0;
    return {
      key: String(source.key || "surface-route-presentation").trim() || "surface-route-presentation",
      enabled: enabled && mode !== "off",
      mode: enabled ? mode : "off",
      queryKey: String(source.queryKey || "surface_path").trim() || "surface_path",
      hashKey: String(source.hashKey || source.queryKey || "surface_path").trim() || "surface_path",
      pathMarker: String(source.pathMarker || "surface").trim().replace(/^\/+|\/+$/g, "") || "surface",
      maxSegments: maxSegments > 0 ? maxSegments : 6,
      includeHome: source.includeHome === true,
      dedupe: source.dedupe !== false,
      syncCurrentLocation: source.syncCurrentLocation !== false,
      persist: source.persist !== false,
      labelSource: String(source.labelSource || "breadcrumb").trim().toLowerCase() || "breadcrumb",
      labels: Array.isArray(source.labels) ? source.labels.slice() : [],
      resolveLabels: typeof source.resolveLabels === "function" ? source.resolveLabels : null,
      resolveCanonicalPath: typeof source.resolveCanonicalPath === "function" ? source.resolveCanonicalPath : null,
      resolveSlugPath: typeof source.resolveSlugPath === "function" ? source.resolveSlugPath : null,
      slugify: typeof source.slugify === "function" ? source.slugify : null,
    };
  }

  function serializeSurfaceRoutePresentationConfig(config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    return {
      key: settings.key,
      enabled: settings.enabled,
      mode: settings.mode,
      queryKey: settings.queryKey,
      hashKey: settings.hashKey,
      pathMarker: settings.pathMarker,
      maxSegments: settings.maxSegments,
      includeHome: settings.includeHome,
      dedupe: settings.dedupe,
      syncCurrentLocation: settings.syncCurrentLocation,
      persist: settings.persist,
      labelSource: settings.labelSource,
      labels: settings.labels.slice(),
    };
  }

  function readSurfaceRoutePresentationStorageValue() {
    try {
      return String(window.localStorage.getItem(SURFACE_ROUTE_PRESENTATION_STORAGE_KEY) || "").trim();
    } catch (_error) {
      return "";
    }
  }

  function writeSurfaceRoutePresentationStorageValue(value) {
    try {
      if (!String(value || "").trim()) {
        window.localStorage.removeItem(SURFACE_ROUTE_PRESENTATION_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(SURFACE_ROUTE_PRESENTATION_STORAGE_KEY, String(value || "").trim());
    } catch (_error) {}
  }

  function readSurfaceRoutePresentationConfig() {
    if (shared.surfaceRoutePresentation && typeof shared.surfaceRoutePresentation === "object") {
      return normalizeSurfaceRoutePresentationConfig(shared.surfaceRoutePresentation);
    }
    var rawValue = readSurfaceRoutePresentationStorageValue();
    if (!rawValue) {
      return normalizeSurfaceRoutePresentationConfig({ enabled: false, mode: "off", persist: true });
    }
    try {
      return normalizeSurfaceRoutePresentationConfig(JSON.parse(rawValue));
    } catch (_error) {
      return normalizeSurfaceRoutePresentationConfig({ enabled: false, mode: "off", persist: true });
    }
  }

  function writeSurfaceRoutePresentationConfig(config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    shared.surfaceRoutePresentation = settings;
    if (settings.persist) {
      writeSurfaceRoutePresentationStorageValue(JSON.stringify(serializeSurfaceRoutePresentationConfig(settings)));
      return settings;
    }
    writeSurfaceRoutePresentationStorageValue("");
    return settings;
  }

  function clearSurfaceRoutePresentationConfig() {
    delete shared.surfaceRoutePresentation;
    writeSurfaceRoutePresentationStorageValue("");
    return normalizeSurfaceRoutePresentationConfig({ enabled: false, mode: "off", persist: true });
  }

  function isSurfaceRouteNodeVisible(node) {
    if (!(node instanceof HTMLElement) || node.hidden) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    return styles.display !== "none" && styles.visibility !== "hidden";
  }

  function findVisibleSurfaceBreadcrumbList() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll(
      ".o_surface_topbar_breadcrumb_host ol.breadcrumb, [data-surface-breadcrumb-root='1'], ol.breadcrumb.o_surface_breadcrumb_list"
    ));
    for (var index = 0; index < candidates.length; index += 1) {
      var node = candidates[index];
      if (!(node instanceof HTMLElement) || !isSurfaceRouteNodeVisible(node)) {
        continue;
      }
      if (node.matches("ol.breadcrumb")) {
        return node;
      }
      var listNode = node.querySelector("ol.breadcrumb");
      if (listNode instanceof HTMLElement && isSurfaceRouteNodeVisible(listNode)) {
        return listNode;
      }
    }
    return null;
  }

  function readSurfaceBreadcrumbItemLabel(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    if (
      node.getAttribute("data-surface-breadcrumb-hidden") === "1" ||
      node.getAttribute("data-surface-transition-breadcrumb-hidden") === "1"
    ) {
      return "";
    }
    var labelNode = node.querySelector(":scope > [data-surface-breadcrumb-current-label='1']");
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = node.querySelector(":scope > .o_surface_breadcrumb_content > [data-surface-breadcrumb-menu-activator='1']");
    }
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = node.querySelector(":scope > .o_surface_breadcrumb_content > [data-surface-breadcrumb-link='1']");
    }
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = node.querySelector(":scope > [data-surface-breadcrumb-link='1']");
    }
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = node.querySelector(":scope > .o_surface_breadcrumb_content > span, :scope > .o_surface_breadcrumb_content > a");
    }
    if (!(labelNode instanceof HTMLElement)) {
      labelNode = node.querySelector(":scope > span, :scope > a");
    }
    return String((labelNode instanceof HTMLElement ? labelNode.textContent : node.textContent) || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readSurfaceBreadcrumbTrail(config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    var listNode = findVisibleSurfaceBreadcrumbList();
    if (!(listNode instanceof HTMLElement)) {
      return [];
    }
    var labels = Array.prototype.slice.call(listNode.children || []).map(function (itemNode) {
      return readSurfaceBreadcrumbItemLabel(itemNode);
    }).filter(function (label) {
      return !!label;
    });
    if (!settings.includeHome) {
      labels = labels.filter(function (label, index) {
        return !(index === 0 && String(label || "").trim().toLowerCase() === "home");
      });
    }
    if (settings.dedupe) {
      labels = labels.filter(function (label, index) {
        return index === 0 || label !== labels[index - 1];
      });
    }
    if (labels.length > settings.maxSegments) {
      labels = labels.slice(labels.length - settings.maxSegments);
    }
    return labels;
  }

  function slugifySurfaceRouteSegment(value, config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    if (typeof settings.slugify === "function") {
      try {
        return String(settings.slugify(value, settings) || "").trim();
      } catch (_error) {}
    }
    var normalized = String(surfaceLayerApi.normalizeLabel(value) || "");
    return normalized
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .trim();
  }

  function resolveSurfaceRoutePresentationLabels(config, targetUrl) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    if (typeof settings.resolveLabels === "function") {
      try {
        var resolvedLabels = settings.resolveLabels({
          targetUrl: targetUrl || null,
          actionIds: extractActionIdsFromPathname(targetUrl instanceof URL ? targetUrl.pathname : window.location.pathname || ""),
          currentActionId: resolveCurrentActionIdFromUrl(targetUrl || undefined),
          breadcrumbLabels: readSurfaceBreadcrumbTrail(settings),
        }, settings);
        if (Array.isArray(resolvedLabels)) {
          return resolvedLabels;
        }
      } catch (_error) {}
    }
    if (Array.isArray(settings.labels) && settings.labels.length) {
      return settings.labels.slice();
    }
    if (settings.labelSource === "breadcrumb") {
      return readSurfaceBreadcrumbTrail(settings);
    }
    return [];
  }

  function buildSurfaceRouteSlugPath(config, targetUrl) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    if (typeof settings.resolveSlugPath === "function") {
      try {
        return String(settings.resolveSlugPath({
          targetUrl: targetUrl || null,
          labels: resolveSurfaceRoutePresentationLabels(settings, targetUrl),
        }, settings) || "").replace(/^\/+|\/+$/g, "");
      } catch (_error) {}
    }
    return resolveSurfaceRoutePresentationLabels(settings, targetUrl)
      .map(function (label) {
        return slugifySurfaceRouteSegment(label, settings);
      })
      .filter(function (segment) {
        return !!segment;
      })
      .join("/");
  }

  function buildSurfaceRouteHash(hashParams) {
    var serialized = hashParams instanceof URLSearchParams ? hashParams.toString() : "";
    return serialized ? "#" + serialized : "";
  }

  function stripSurfaceRouteTail(pathname, config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    var marker = settings.pathMarker;
    var normalizedPath = surfaceLayerApi.normalizePathname(pathname);
    var segments = normalizedPath.split("/").filter(Boolean);
    var markerIndex = segments.indexOf(marker);
    if (markerIndex > 0) {
      segments = segments.slice(0, markerIndex);
    }
    return segments.length ? "/" + segments.join("/") : "/";
  }

  function buildSurfaceRouteTailPath(pathname, slugPath, config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    var basePath = stripSurfaceRouteTail(pathname, settings).replace(/\/+$/, "") || "/";
    if (!String(slugPath || "").trim()) {
      return basePath;
    }
    return (basePath === "/" ? "" : basePath) + "/" + settings.pathMarker + "/" + String(slugPath).replace(/^\/+|\/+$/g, "");
  }

  function buildSurfacePresentedUrl(urlValue, config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    var normalizedUrlValue = normalizeSurfaceHistoryUrl(urlValue);
    if (!settings.enabled || settings.mode === "off") {
      return normalizedUrlValue;
    }
    try {
      var targetUrl = new URL(String(normalizedUrlValue || window.location.href || ""), window.location.origin);
      var slugPath = buildSurfaceRouteSlugPath(settings, targetUrl);
      if (typeof settings.resolveCanonicalPath === "function") {
        try {
          var canonicalPath = String(settings.resolveCanonicalPath(targetUrl, settings) || "").trim();
          if (canonicalPath) {
            targetUrl.pathname = canonicalPath.charAt(0) === "/" ? canonicalPath : "/" + canonicalPath;
          }
        } catch (_error) {}
      }
      targetUrl.searchParams.delete(settings.queryKey);
      var hashParams = parseSearchParams(String(targetUrl.hash || "").replace(/^#/, ""));
      hashParams.delete(settings.hashKey);
      targetUrl.pathname = stripSurfaceRouteTail(targetUrl.pathname, settings);
      if (slugPath) {
        if (settings.mode === "query") {
          targetUrl.searchParams.set(settings.queryKey, slugPath);
        } else if (settings.mode === "hash") {
          hashParams.set(settings.hashKey, slugPath);
        } else if (settings.mode === "path-tail") {
          targetUrl.pathname = buildSurfaceRouteTailPath(targetUrl.pathname, slugPath, settings);
        }
      }
      targetUrl.hash = buildSurfaceRouteHash(hashParams);
      return targetUrl.pathname + targetUrl.search + targetUrl.hash;
    } catch (_error) {
      return normalizedUrlValue;
    }
  }

  function syncCurrentSurfaceRoutePresentation(config) {
    var settings = normalizeSurfaceRoutePresentationConfig(config);
    if (!settings.enabled || !settings.syncCurrentLocation || !window.history || typeof window.history.replaceState !== "function") {
      return settings;
    }
    try {
      var currentHref = window.location.pathname + window.location.search + window.location.hash;
      var nextHref = buildSurfacePresentedUrl(currentHref, settings);
      if (nextHref && nextHref !== currentHref) {
        window.history.replaceState(window.history.state, document.title, nextHref);
      }
    } catch (_error) {}
    return settings;
  }

  function normalizeSurfaceHistoryUrl(urlValue) {
    if (urlValue == null || urlValue === "") {
      return urlValue;
    }
    if (urlValue instanceof URL) {
      canonicalizeSurfaceActionUrl(urlValue);
      return urlValue.pathname + urlValue.search + urlValue.hash;
    }
    var rawUrl = String(urlValue || "").trim();
    if (!rawUrl) {
      return urlValue;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(rawUrl) || rawUrl.indexOf("//") === 0) {
      try {
        var absoluteUrl = canonicalizeSurfaceActionUrl(new URL(rawUrl, window.location.origin));
        return absoluteUrl.pathname + absoluteUrl.search + absoluteUrl.hash;
      } catch (_error) {
        return rawUrl;
      }
    }
    if (
      rawUrl.charAt(0) === "/" ||
      rawUrl.charAt(0) === "#" ||
      rawUrl.charAt(0) === "?"
    ) {
      if (rawUrl.charAt(0) !== "/") {
        return rawUrl;
      }
      try {
        var rootedUrl = canonicalizeSurfaceActionUrl(new URL(rawUrl, window.location.origin));
        return rootedUrl.pathname + rootedUrl.search + rootedUrl.hash;
      } catch (_error) {
        return rawUrl;
      }
    }
    if (/^(?:\.\/)?action-\d+(?:[/?#].*)?$/i.test(rawUrl)) {
      try {
        var relativeActionUrl = canonicalizeSurfaceActionUrl(
          new URL("/odoo/" + rawUrl.replace(/^(?:\.\/)+/, "").replace(/^\/+/, ""), window.location.origin)
        );
        return relativeActionUrl.pathname + relativeActionUrl.search + relativeActionUrl.hash;
      } catch (_error) {
        return buildCanonicalSurfaceActionPathname("/odoo/" + rawUrl.replace(/^(?:\.\/)+/, "").replace(/^\/+/, ""));
      }
    }
    return rawUrl;
  }

  function syncCurrentSurfaceActionPath() {
    if (!window.history || typeof window.history.replaceState !== "function") {
      return;
    }
    try {
      var currentUrl = canonicalizeSurfaceActionUrl(new URL(window.location.href, window.location.origin));
      var nextHref = currentUrl.pathname + currentUrl.search + currentUrl.hash;
      var currentHref = window.location.pathname + window.location.search + window.location.hash;
      if (nextHref && nextHref !== currentHref) {
        window.history.replaceState(window.history.state, document.title, nextHref);
      }
    } catch (_error) {}
  }

  function buildSurfaceActionHref(actionRequest, options) {
    var settings = options && typeof options === "object" ? options : {};
    var actionId = resolveStoredActionId(actionRequest);
    if (!(actionId > 0)) {
      return "";
    }
    var pathname = "/odoo/action-" + String(actionId);
    var resId = Number.parseInt(String(settings.resId || 0), 10) || 0;
    if (resId > 0) {
      pathname += "/" + String(resId);
    }
    try {
      var url = new URL(pathname, window.location.origin);
      var viewType = String(settings.viewType || "").trim().toLowerCase();
      if (viewType) {
        url.searchParams.set("view_type", viewType);
      }
      return url.pathname + url.search;
    } catch (_error) {
      return pathname;
    }
  }

  function getSurfaceQueryParamKey(spec) {
    return String((spec && spec.queryKey) || "").trim();
  }

  function getSurfaceQueryParamNames(spec) {
    var queryKey = getSurfaceQueryParamKey(spec);
    return queryKey ? [queryKey] : [];
  }

  function getSurfaceQueryStateKey(spec) {
    return String((spec && spec.stateKey) || "").trim();
  }

  function getSurfaceQueryStateSourceValue(spec, source) {
    var stateKey = getSurfaceQueryStateKey(spec);
    return stateKey ? source[stateKey] : undefined;
  }

  function readSurfaceQueryParamValue(spec, searchParams) {
    if (!searchParams || typeof searchParams.get !== "function") {
      return null;
    }
    var names = getSurfaceQueryParamNames(spec);
    for (var index = 0; index < names.length; index += 1) {
      var name = names[index];
      if (name && typeof searchParams.has === "function" && searchParams.has(name)) {
        return searchParams.get(name);
      }
    }
    return null;
  }

  function clearSurfaceQueryParamValues(spec, searchParams) {
    if (!searchParams || typeof searchParams.delete !== "function") {
      return;
    }
    getSurfaceQueryParamNames(spec).forEach(function (name) {
      if (name) {
        searchParams.delete(name);
      }
    });
  }

  function sanitizeSurfaceQueryValue(spec, rawValue, fullState) {
    if (spec && typeof spec.sanitize === "function") {
      try {
        return spec.sanitize(rawValue, fullState || {}, spec);
      } catch (_error) {
        return "";
      }
    }
    if (typeof rawValue === "boolean") {
      return rawValue;
    }
    return String(rawValue || "").trim();
  }

  function serializeSurfaceQueryValue(spec, value, fullState) {
    if (spec && typeof spec.serialize === "function") {
      try {
        return spec.serialize(value, fullState || {}, spec);
      } catch (_error) {
        return "";
      }
    }
    if (value === true) {
      return "1";
    }
    if (value === false || value == null) {
      return "";
    }
    return String(value || "").trim();
  }

  function shouldIncludeSurfaceQueryValue(spec, value, serializedValue, fullState) {
    if (spec && typeof spec.shouldInclude === "function") {
      try {
        return !!spec.shouldInclude(value, serializedValue, fullState || {}, spec);
      } catch (_error) {
        return false;
      }
    }
    if (spec && spec.omitIfEmpty === false) {
      return true;
    }
    return !!String(serializedValue || "").trim();
  }

  function normalizeSurfaceQueryState(config, state) {
    var settings = config && typeof config === "object" ? config : {};
    var specs = normalizeSurfaceQueryParamSpecs(settings);
    var source = state && typeof state === "object" ? state : {};
    var nextState = {};
    specs.forEach(function (spec) {
      var stateKey = getSurfaceQueryStateKey(spec);
      if (!stateKey) {
        return;
      }
      nextState[stateKey] = sanitizeSurfaceQueryValue(spec, getSurfaceQueryStateSourceValue(spec, source), source);
    });
    return nextState;
  }

  function readSurfaceQueryState(config) {
    var settings = config && typeof config === "object" ? config : {};
    var specs = normalizeSurfaceQueryParamSpecs(settings);
    var href = String(settings.href || window.location.href || "").trim();
    try {
      var url = new URL(href, window.location.origin);
      var nextState = {};
      specs.forEach(function (spec) {
        var queryKey = getSurfaceQueryParamKey(spec);
        var stateKey = getSurfaceQueryStateKey(spec);
        if (!queryKey || !stateKey) {
          return;
        }
        nextState[stateKey] = sanitizeSurfaceQueryValue(spec, readSurfaceQueryParamValue(spec, url.searchParams), nextState);
      });
      return nextState;
    } catch (_error) {
      return normalizeSurfaceQueryState(settings, {});
    }
  }

  function getInitialDocumentHref() {
    return shared.initialDocumentHref;
  }

  function buildSurfaceQueryUrl(config) {
    var settings = config && typeof config === "object" ? config : {};
    var specs = normalizeSurfaceQueryParamSpecs(settings);
    var basePath = String(settings.basePath || window.location.pathname || "").trim() || "/";
    var hashSourceHref = String(settings.hashSourceHref || window.location.href || "").trim();
    var state = normalizeSurfaceQueryState(settings, settings.state);
    try {
      var url = new URL(basePath, window.location.origin);
      specs.forEach(function (spec) {
        var queryKey = getSurfaceQueryParamKey(spec);
        var stateKey = getSurfaceQueryStateKey(spec);
        if (!queryKey || !stateKey) {
          return;
        }
        var value = state[stateKey];
        var serializedValue = serializeSurfaceQueryValue(spec, value, state);
        clearSurfaceQueryParamValues(spec, url.searchParams);
        if (shouldIncludeSurfaceQueryValue(spec, value, serializedValue, state)) {
          url.searchParams.set(queryKey, serializedValue);
          return;
        }
      });
      if (settings.preserveHash !== false) {
        try {
          var hashSourceUrl = new URL(hashSourceHref, window.location.origin);
          if (hashSourceUrl.hash) {
            url.hash = hashSourceUrl.hash;
          }
        } catch (_error) {}
      }
      return url;
    } catch (_error) {
      return null;
    }
  }

  function replaceSurfaceQueryState(config) {
    try {
      var url = buildSurfaceQueryUrl(config);
      if (!url) {
        return;
      }
      var nextHref = url.pathname + url.search + url.hash;
      var currentHref = window.location.pathname + window.location.search + window.location.hash;
      if (nextHref !== currentHref) {
        window.history.replaceState(window.history.state, document.title, nextHref);
      }
    } catch (_error) {}
  }

  function pushSurfaceQueryState(config) {
    try {
      var url = buildSurfaceQueryUrl(config);
      if (!url) {
        return;
      }
      var nextHref = url.pathname + url.search + url.hash;
      var currentHref = window.location.pathname + window.location.search + window.location.hash;
      if (!!(config && config.force) || nextHref !== currentHref) {
        window.history.pushState(window.history.state, document.title, nextHref);
      }
    } catch (_error) {}
  }

  function mergeSurfaceQueryStateIntoUrl(config) {
    var settings = config && typeof config === "object" ? config : {};
    var urlValue = settings.url;
    if (!urlValue) {
      return urlValue;
    }
    var specs = normalizeSurfaceQueryParamSpecs(settings);
    try {
      var targetUrl = new URL(String(urlValue), window.location.origin);
      if (typeof settings.shouldApply === "function") {
        try {
          if (!settings.shouldApply(targetUrl, settings)) {
            return urlValue;
          }
        } catch (_error) {
          return urlValue;
        }
      }
      var state = normalizeSurfaceQueryState(settings, settings.state);
      var context = Object.assign({}, settings.context || {}, {
        targetUrl: targetUrl,
        state: state,
      });
      specs.forEach(function (spec) {
        var queryKey = getSurfaceQueryParamKey(spec);
        var stateKey = getSurfaceQueryStateKey(spec);
        if (!queryKey || !stateKey) {
          return;
        }
        var explicitValue = readSurfaceQueryParamValue(spec, targetUrl.searchParams);
        if (explicitValue !== null) {
          var explicitSanitizedValue = sanitizeSurfaceQueryValue(spec, explicitValue, state);
          var explicitSerializedValue = serializeSurfaceQueryValue(spec, explicitSanitizedValue, state);
          clearSurfaceQueryParamValues(spec, targetUrl.searchParams);
          if (shouldIncludeSurfaceQueryValue(spec, explicitSanitizedValue, explicitSerializedValue, state)) {
            targetUrl.searchParams.set(queryKey, explicitSerializedValue);
          }
          return;
        }
        if (typeof spec.preserveIf === "function") {
          try {
            if (!spec.preserveIf(context, spec)) {
              return;
            }
          } catch (_error) {
            return;
          }
        } else if (spec.preserve === false) {
          return;
        }
        var value = state[stateKey];
        var serializedValue = serializeSurfaceQueryValue(spec, value, state);
        if (shouldIncludeSurfaceQueryValue(spec, value, serializedValue, state)) {
          targetUrl.searchParams.set(queryKey, serializedValue);
        }
      });
      return targetUrl.pathname + targetUrl.search + targetUrl.hash;
    } catch (_error) {
      return urlValue;
    }
  }

  function getHistoryPatchBindings() {
    return Object.keys(historyPatchBindingsByKey).map(function (key) {
      return historyPatchBindingsByKey[key];
    }).filter(function (entry) {
      return !!entry;
    });
  }

  function installPreservedHistoryPatch(config) {
    var settings = config && typeof config === "object" ? config : {};
    var key = String(settings.key || "").trim() || "default";
    historyPatchBindingsByKey[key] = {
      key: key,
      transformUrl: typeof settings.transformUrl === "function" ? settings.transformUrl : null,
      onAfterChange: typeof settings.onAfterChange === "function" ? settings.onAfterChange : null,
    };
    if (
      shared.historyPatchInstalled ||
      !window.history ||
      typeof window.history.pushState !== "function" ||
      typeof window.history.replaceState !== "function"
    ) {
      return;
    }
    shared.historyPatchInstalled = true;
    var nativePushState = window.history.pushState.bind(window.history);
    var nativeReplaceState = window.history.replaceState.bind(window.history);

    function transformUrl(urlValue, method) {
      return getHistoryPatchBindings().reduce(function (nextUrl, entry) {
        if (!entry || typeof entry.transformUrl !== "function") {
          return nextUrl;
        }
        try {
          return entry.transformUrl(nextUrl, method, entry) || nextUrl;
        } catch (_error) {
          return nextUrl;
        }
      }, normalizeSurfaceHistoryUrl(urlValue));
    }

    function notifyBindings(method, urlValue) {
      getHistoryPatchBindings().forEach(function (entry) {
        if (!entry || typeof entry.onAfterChange !== "function") {
          return;
        }
        try {
          entry.onAfterChange(method, urlValue, entry);
        } catch (_error) {}
      });
    }

    window.history.pushState = function (state, title, url) {
      var transformedUrl = transformUrl(url, "pushState");
      var result = nativePushState(state, title, transformedUrl);
      notifyBindings("pushState", transformedUrl);
      return result;
    };

    window.history.replaceState = function (state, title, url) {
      var transformedUrl = transformUrl(url, "replaceState");
      var result = nativeReplaceState(state, title, transformedUrl);
      notifyBindings("replaceState", transformedUrl);
      return result;
    };
  }

  function uninstallPreservedHistoryPatch(key) {
    var normalizedKey = String(key || "").trim();
    if (!normalizedKey) {
      return;
    }
    delete historyPatchBindingsByKey[normalizedKey];
  }

  function installSurfaceRoutePresentation(config) {
    var settings = writeSurfaceRoutePresentationConfig(config);
    if (!settings.enabled || settings.mode === "off") {
      uninstallPreservedHistoryPatch(settings.key);
      return settings;
    }
    installPreservedHistoryPatch({
      key: settings.key,
      transformUrl: function (urlValue) {
        return buildSurfacePresentedUrl(urlValue, settings);
      },
    });
    syncCurrentSurfaceRoutePresentation(settings);
    return settings;
  }

  function uninstallSurfaceRoutePresentation(key, options) {
    var settings = readSurfaceRoutePresentationConfig();
    var bindingKey = String(key || settings.key || "surface-route-presentation").trim();
    uninstallPreservedHistoryPatch(bindingKey);
    if (!(options && options.keepConfig === true)) {
      clearSurfaceRoutePresentationConfig();
    }
  }

  Object.assign(surfaceLayerApi, {
    parseSearchParams: parseSearchParams,
    extractActionIdsFromPathname: extractActionIdsFromPathname,
    resolveLastActionIdFromPathname: resolveLastActionIdFromPathname,
    readSurfaceUrlParams: readSurfaceUrlParams,
    resolveCurrentActionIdFromUrl: resolveCurrentActionIdFromUrl,
    readCurrentActionId: readCurrentSurfaceActionId,
    resolveSurfaceWorkspaceOwnership: resolveSurfaceWorkspaceOwnership,
    normalizeSurfaceRoutePresentationConfig: normalizeSurfaceRoutePresentationConfig,
    readSurfaceRoutePresentationConfig: readSurfaceRoutePresentationConfig,
    writeSurfaceRoutePresentationConfig: writeSurfaceRoutePresentationConfig,
    clearSurfaceRoutePresentationConfig: clearSurfaceRoutePresentationConfig,
    slugifySurfaceRouteSegment: slugifySurfaceRouteSegment,
    readSurfaceBreadcrumbTrail: readSurfaceBreadcrumbTrail,
    buildSurfaceRouteSlugPath: buildSurfaceRouteSlugPath,
    buildSurfacePresentedUrl: buildSurfacePresentedUrl,
    syncCurrentSurfaceRoutePresentation: syncCurrentSurfaceRoutePresentation,
    buildCanonicalSurfaceActionPathname: buildCanonicalSurfaceActionPathname,
    syncCurrentSurfaceActionPath: syncCurrentSurfaceActionPath,
    normalizeSurfaceHistoryUrl: normalizeSurfaceHistoryUrl,
    resolveStoredActionId: resolveStoredActionId,
    buildSurfaceActionHref: buildSurfaceActionHref,
    normalizeSurfaceQueryState: normalizeSurfaceQueryState,
    readSurfaceQueryState: readSurfaceQueryState,
    getInitialDocumentHref: getInitialDocumentHref,
    buildSurfaceQueryUrl: buildSurfaceQueryUrl,
    replaceSurfaceQueryState: replaceSurfaceQueryState,
    pushSurfaceQueryState: pushSurfaceQueryState,
    mergeSurfaceQueryStateIntoUrl: mergeSurfaceQueryStateIntoUrl,
    installPreservedHistoryPatch: installPreservedHistoryPatch,
    uninstallPreservedHistoryPatch: uninstallPreservedHistoryPatch,
    installSurfaceRoutePresentation: installSurfaceRoutePresentation,
    uninstallSurfaceRoutePresentation: uninstallSurfaceRoutePresentation,
  });
  syncCurrentSurfaceActionPath();
  if (readSurfaceRoutePresentationConfig().enabled) {
    installSurfaceRoutePresentation(readSurfaceRoutePresentationConfig());
  }
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
