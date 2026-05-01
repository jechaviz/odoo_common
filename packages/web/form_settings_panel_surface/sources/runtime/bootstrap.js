(function (surface) {
  "use strict";

  function start() {
    if (typeof surface.autoInstallFromWindow === "function") {
      surface.autoInstallFromWindow();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(window.OdooCommonFormSettingsPanelSurface = window.OdooCommonFormSettingsPanelSurface || {});
