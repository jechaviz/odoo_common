(function () {
  "use strict";

  var surfaceLayerApi = Object.assign({}, window.OdooSurfaceLayers || {});
  var SURFACE_ASSET_FINGERPRINT = String("__ODOO_SURFACE_ASSET_FINGERPRINT__" || "").trim();
  var ASSET_FINGERPRINT_STORAGE_KEY = "odoo.surface.assetFingerprint";
  var ASSET_FINGERPRINT_RELOAD_KEY = "odoo.surface.assetFingerprint.reload";
  var shared = surfaceLayerApi._shared && typeof surfaceLayerApi._shared === "object"
    ? surfaceLayerApi._shared
    : {};

  function readSessionValue(storageKey) {
    try {
      return String(window.sessionStorage.getItem(storageKey) || "").trim();
    } catch (_error) {
      return "";
    }
  }

  function writeSessionValue(storageKey, value) {
    try {
      if (!String(value || "").trim()) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      window.sessionStorage.setItem(storageKey, String(value || "").trim());
    } catch (_error) {}
  }

  function normalizePathname(pathname) {
    return String(pathname || "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "")
      .trim() || "/";
  }

  function normalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isFingerprintValue(value) {
    return /^[a-f0-9]{40}$/i.test(String(value || "").trim());
  }

  function syncSurfaceAssetFingerprint() {
    var currentFingerprint = isFingerprintValue(SURFACE_ASSET_FINGERPRINT) ? SURFACE_ASSET_FINGERPRINT : "";
    shared.assetFingerprint = currentFingerprint;
    if (!currentFingerprint) {
      return false;
    }
    var previousFingerprint = readSessionValue(ASSET_FINGERPRINT_STORAGE_KEY);
    var reloadFingerprint = readSessionValue(ASSET_FINGERPRINT_RELOAD_KEY);
    if (
      previousFingerprint &&
      previousFingerprint !== currentFingerprint &&
      reloadFingerprint !== currentFingerprint
    ) {
      writeSessionValue(ASSET_FINGERPRINT_STORAGE_KEY, currentFingerprint);
      writeSessionValue(ASSET_FINGERPRINT_RELOAD_KEY, currentFingerprint);
      shared.assetFingerprintRefreshPending = true;
      try {
        window.location.replace(String(window.location.href || ""));
      } catch (_error) {
        window.location.reload();
      }
      return true;
    }
    writeSessionValue(ASSET_FINGERPRINT_STORAGE_KEY, currentFingerprint);
    if (reloadFingerprint === currentFingerprint) {
      writeSessionValue(ASSET_FINGERPRINT_RELOAD_KEY, "");
    }
    shared.assetFingerprintRefreshPending = false;
    return false;
  }

  if (!(shared.transitionBreadcrumbFramesByShellId && typeof shared.transitionBreadcrumbFramesByShellId === "object")) {
    shared.transitionBreadcrumbFramesByShellId = Object.create(null);
  }
  if (typeof shared.historyPatchInstalled !== "boolean") {
    shared.historyPatchInstalled = false;
  }
  if (!(shared.historyPatchBindingsByKey && typeof shared.historyPatchBindingsByKey === "object")) {
    shared.historyPatchBindingsByKey = Object.create(null);
  }
  if (!String(shared.initialDocumentHref || "").trim()) {
    shared.initialDocumentHref = String(window.location.href || "").trim();
  }
  if (!(shared.debugServicePromisesByKey && typeof shared.debugServicePromisesByKey === "object")) {
    shared.debugServicePromisesByKey = Object.create(null);
  }

  Object.assign(surfaceLayerApi, {
    readSessionValue: readSessionValue,
    writeSessionValue: writeSessionValue,
    normalizePathname: normalizePathname,
    normalizeLabel: normalizeLabel,
  });

  if (syncSurfaceAssetFingerprint()) {
    surfaceLayerApi._shared = shared;
    window.OdooSurfaceLayers = surfaceLayerApi;
    return;
  }

  surfaceLayerApi._shared = shared;
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
