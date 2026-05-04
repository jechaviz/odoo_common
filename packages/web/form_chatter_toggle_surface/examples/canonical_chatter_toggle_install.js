(function () {
  "use strict";

  const surface = window.OdooCommonFormChatterToggleSurface;
  if (!surface || typeof surface.install !== "function") {
    throw new Error("form-chatter-toggle-surface runtime is not loaded");
  }

  let collapsed = false;

  surface.install({
    getCollapsed: function () {
      return collapsed;
    },
    setCollapsed: function (nextCollapsed) {
      collapsed = Boolean(nextCollapsed);
    },
    onCollapsedChange: function (nextCollapsed) {
      console.info("Chatter collapsed:", Boolean(nextCollapsed));
    },
    chatterSelectors: [".o-mail-ChatterContainer"],
  });
})();
