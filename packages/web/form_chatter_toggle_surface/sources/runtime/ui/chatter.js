(function (surface) {
  "use strict";

  function resolveChatterContainer(node) {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    var container = node.closest(surface.CHATTER_HOST_SELECTOR);
    if (!(container instanceof HTMLElement)) {
      return null;
    }
    var outer = container;
    while (outer.parentElement && outer.parentElement.matches(surface.CHATTER_HOST_SELECTOR)) {
      outer = outer.parentElement;
    }
    return outer;
  }

  function collectChatterContainers() {
    var containers = [];
    var seen = new Set();

    surface.CHATTER_SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        var container = resolveChatterContainer(node);
        if (!(container instanceof HTMLElement) || seen.has(container)) {
          return;
        }
        seen.add(container);
        containers.push(container);
      });
    });

    return containers;
  }

  function updateFormChatterClass(collapsed, containers) {
    var formsWithChatter = new Set();
    containers.forEach(function (container) {
      var formNode = container.closest(".o_form_view");
      if (formNode instanceof HTMLElement) {
        formsWithChatter.add(formNode);
      }
    });

    document.querySelectorAll(".o_form_view").forEach(function (formNode) {
      if (!(formNode instanceof HTMLElement)) {
        return;
      }
      var hasChatter = formsWithChatter.has(formNode);
      formNode.classList.toggle(surface.FORM_CHATTER_COLLAPSED_CLASS, hasChatter && collapsed);
    });
  }

  function applyForcedChatterStyle(container, collapsed) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    if (!collapsed) {
      container.style.removeProperty("display");
      container.style.removeProperty("width");
      container.style.removeProperty("min-width");
      container.style.removeProperty("max-width");
      container.style.removeProperty("flex");
      container.style.removeProperty("padding");
      container.style.removeProperty("margin");
      container.style.removeProperty("border");
      return;
    }

    container.style.setProperty("display", "none", "important");
    container.style.setProperty("width", "0px", "important");
    container.style.setProperty("min-width", "0px", "important");
    container.style.setProperty("max-width", "0px", "important");
    container.style.setProperty("flex", "0 0 0px", "important");
    container.style.setProperty("padding", "0", "important");
    container.style.setProperty("margin", "0", "important");
    container.style.setProperty("border", "0", "important");
  }

  function resetChatterHostInlineStyle(container) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    var host = container.parentElement;
    if (!(host instanceof HTMLElement)) {
      return;
    }
    host.style.removeProperty("display");
    host.style.removeProperty("width");
    host.style.removeProperty("min-width");
    host.style.removeProperty("max-width");
    host.style.removeProperty("flex");
    host.style.removeProperty("padding");
    host.style.removeProperty("margin");
    host.style.removeProperty("border");
  }

  function updateChatterParentLayout(collapsed, containers) {
    document.querySelectorAll("." + surface.CHATTER_PARENT_COLLAPSED_CLASS).forEach(function (node) {
      node.classList.remove(surface.CHATTER_PARENT_COLLAPSED_CLASS);
    });

    if (!collapsed) {
      return;
    }

    containers.forEach(function (container) {
      if (!(container instanceof HTMLElement)) {
        return;
      }
      var parent = container.parentElement;
      while (parent instanceof HTMLElement && parent !== document.body) {
        if (parent.querySelector(".o_form_sheet_bg")) {
          parent.classList.add(surface.CHATTER_PARENT_COLLAPSED_CLASS);
          break;
        }
        parent = parent.parentElement;
      }
    });
  }

  function ensureGlobalChatterToggleButton() {
    var button = document.getElementById(surface.CHATTER_TOGGLE_ID);
    if (button instanceof HTMLButtonElement) {
      return button;
    }

    button = document.createElement("button");
    button.type = "button";
    button.id = surface.CHATTER_TOGGLE_ID;
    button.className = surface.CHATTER_TOGGLE_CLASS;
    button.setAttribute("aria-label", "Toggle communication panel");
    button.addEventListener("click", function () {
      surface.setChatterCollapsed(!surface.isChatterCollapsed());
    });

    document.body.appendChild(button);
    return button;
  }

  function updateGlobalChatterToggleButton(hasChatter) {
    var button = ensureGlobalChatterToggleButton();
    if (!(button instanceof HTMLElement)) {
      return;
    }
    if (!hasChatter) {
      button.hidden = true;
      return;
    }

    var collapsed = surface.isChatterCollapsed();
    button.hidden = false;
    button.classList.toggle(surface.CHATTER_TOGGLE_ACTIVE_CLASS, !collapsed);
    button.classList.toggle(surface.CHATTER_TOGGLE_COLLAPSED_CLASS, collapsed);

    var iconNode = button.querySelector(".o_lib_chatter_toggle_icon");
    if (!(iconNode instanceof HTMLElement)) {
      iconNode = document.createElement("span");
      iconNode.className = "o_lib_chatter_toggle_icon";
      button.innerHTML = "";
      button.appendChild(iconNode);
    }
    iconNode.textContent = collapsed ? ">" : "<";
    button.setAttribute("aria-pressed", collapsed ? "false" : "true");
    button.removeAttribute("title");
  }

  function applyChatterVisibility() {
    var containers = collectChatterContainers();
    var collapsed = surface.isChatterCollapsed();

    document.body.classList.toggle(surface.BODY_CHATTER_COLLAPSED_CLASS, collapsed);

    containers.forEach(function (container) {
      resetChatterHostInlineStyle(container);
      container.classList.toggle(surface.CHATTER_HIDDEN_CLASS, collapsed);
      container.hidden = collapsed;
      applyForcedChatterStyle(container, collapsed);
    });

    updateChatterParentLayout(collapsed, containers);
    updateFormChatterClass(collapsed, containers);
    updateGlobalChatterToggleButton(containers.length > 0);
  }

  surface.resolveChatterContainer = resolveChatterContainer;
  surface.collectChatterContainers = collectChatterContainers;
  surface.updateFormChatterClass = updateFormChatterClass;
  surface.applyForcedChatterStyle = applyForcedChatterStyle;
  surface.resetChatterHostInlineStyle = resetChatterHostInlineStyle;
  surface.updateChatterParentLayout = updateChatterParentLayout;
  surface.ensureGlobalChatterToggleButton = ensureGlobalChatterToggleButton;
  surface.updateGlobalChatterToggleButton = updateGlobalChatterToggleButton;
  surface.applyChatterVisibility = applyChatterVisibility;
})(window.OdooCommonFormChatterToggleSurface = window.OdooCommonFormChatterToggleSurface || {});
