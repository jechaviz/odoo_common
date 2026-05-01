(function (v2) {
  "use strict";

  function start() {
    if (typeof v2.boot === "function") {
      v2.boot();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
