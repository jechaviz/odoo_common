(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("form_defaults_surface requires the canonical OdooSurfaceLayers bootstrap.");
    }
    return window.OdooSurfaceLayers;
  }

  function requireSurfaceLayerMethod(surfaceLayerApi, methodName) {
    if (typeof surfaceLayerApi[methodName] !== "function") {
      throw new Error("OdooSurfaceLayers." + methodName + " is required by form_defaults_surface.js.");
    }
    return surfaceLayerApi[methodName];
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function readObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function cloneObject(value) {
    return Object.assign({}, readObject(value));
  }

  function normalizeStringList(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var normalizedValue = normalizeText(value);
      if (!normalizedValue || seen[normalizedValue]) {
        return result;
      }
      seen[normalizedValue] = true;
      result.push(normalizedValue);
      return result;
    }, []);
  }

  function requireSpecString(value, path) {
    var normalizedValue = normalizeText(value);
    if (!normalizedValue) {
      throw new Error(path + " is required.");
    }
    return normalizedValue;
  }

  function requireFieldNames(values) {
    var fieldNames = normalizeStringList(values);
    if (!fieldNames.length) {
      throw new Error("form defaults resolver spec.fieldNames is required.");
    }
    return fieldNames;
  }

  function normalizeFormDefaultsResolverSpec(rawSpec) {
    var spec = readObject(rawSpec);
    if (!Object.keys(spec).length) {
      throw new Error("form defaults resolver spec is required.");
    }
    if (spec.buildKwargs && typeof spec.buildKwargs !== "function") {
      throw new Error("form defaults resolver spec.buildKwargs must be a function.");
    }
    if (spec.isEnabled && typeof spec.isEnabled !== "function") {
      throw new Error("form defaults resolver spec.isEnabled must be a function.");
    }
    if (spec.enrichDefaults && typeof spec.enrichDefaults !== "function") {
      throw new Error("form defaults resolver spec.enrichDefaults must be a function.");
    }
    return {
      model: requireSpecString(spec.model, "form defaults resolver spec.model"),
      fieldNames: requireFieldNames(spec.fieldNames),
      kwargs: cloneObject(spec.kwargs),
      buildKwargs: typeof spec.buildKwargs === "function" ? spec.buildKwargs : null,
      isEnabled: typeof spec.isEnabled === "function" ? spec.isEnabled : null,
      enrichDefaults: typeof spec.enrichDefaults === "function" ? spec.enrichDefaults : null,
    };
  }

  var surfaceLayerApi = requireSurfaceLayerApi();
  var normalizeMany2oneValue = requireSurfaceLayerMethod(surfaceLayerApi, "normalizeMany2oneValue");
  var resolveOdooService = requireSurfaceLayerMethod(surfaceLayerApi, "resolveOdooService");

  function buildFormDefaultsResolver(rawSpec) {
    var spec = normalizeFormDefaultsResolverSpec(rawSpec);
    var state = {
      loaded: false,
      defaults: {},
      promise: null,
    };

    async function searchReadSingle(modelName, domain, fields, options, ormService) {
      if (!ormService || typeof ormService.searchRead !== "function") {
        return null;
      }
      var rows = await ormService.searchRead(
        requireSpecString(modelName, "form defaults resolver searchRead model"),
        Array.isArray(domain) ? domain : [],
        normalizeStringList(fields),
        Object.assign({ limit: 1, order: "id asc" }, readObject(options))
      ).catch(function () {
        return [];
      });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    }

    async function resolve(force) {
      if (force) {
        reset();
      }
      if (typeof spec.isEnabled === "function" && !spec.isEnabled()) {
        return {};
      }
      if (state.loaded) {
        return cloneObject(state.defaults);
      }
      if (state.promise) {
        return state.promise;
      }
      state.promise = (async function () {
        var ormService = await resolveOdooService("orm").catch(function () {
          return null;
        });
        if (!ormService || typeof ormService.call !== "function") {
          state.loaded = true;
          state.defaults = {};
          return {};
        }
        try {
          var kwargs = typeof spec.buildKwargs === "function"
            ? cloneObject(spec.buildKwargs() || {})
            : cloneObject(spec.kwargs);
          var defaults = await ormService.call(
            spec.model,
            "default_get",
            [spec.fieldNames],
            kwargs
          ).catch(function () {
            return {};
          });
          var resolvedDefaults = cloneObject(defaults);
          if (typeof spec.enrichDefaults === "function") {
            var enrichedDefaults = await spec.enrichDefaults(cloneObject(resolvedDefaults), {
              ormService: ormService,
              normalizeMany2oneValue: normalizeMany2oneValue,
              searchReadSingle: function (modelName, domain, fields, options) {
                return searchReadSingle(modelName, domain, fields, options, ormService);
              },
            });
            if (enrichedDefaults && typeof enrichedDefaults === "object" && !Array.isArray(enrichedDefaults)) {
              resolvedDefaults = Object.assign({}, resolvedDefaults, enrichedDefaults);
            }
          }
          state.loaded = true;
          state.defaults = resolvedDefaults;
          return cloneObject(state.defaults);
        } finally {
          state.promise = null;
        }
      })();
      return state.promise;
    }

    function reset() {
      state.loaded = false;
      state.defaults = {};
      state.promise = null;
      return api;
    }

    function readState() {
      return {
        loaded: state.loaded,
        loading: !!state.promise,
        defaults: cloneObject(state.defaults),
      };
    }

    var api = {
      readState: readState,
      reset: reset,
      resolve: resolve,
    };
    return api;
  }

  surfaceLayerApi.buildFormDefaultsResolver = buildFormDefaultsResolver;
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
