(function () {
  "use strict";

  function requireSurfaceLayerApi() {
    if (!(window.OdooSurfaceLayers && typeof window.OdooSurfaceLayers === "object")) {
      throw new Error("Missing required OdooSurfaceLayers runtime before surface workspace dom.");
    }
    return window.OdooSurfaceLayers;
  }

  var surfaceLayerApi = requireSurfaceLayerApi();

  function asElement(value) {
    return value instanceof HTMLElement ? value : null;
  }

  function resolveElement(value) {
    if (typeof value === "function") {
      try {
        return asElement(value());
      } catch (_error) {
        return null;
      }
    }
    return asElement(value);
  }

  function toDataAttributeName(key) {
    return String(key || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/_/g, "-")
      .toLowerCase();
  }

  function isElementInsideModal(node) {
    return !!(
      node instanceof HTMLElement &&
      node.closest(".modal, .o_dialog, .o_technical_modal, .modal-backdrop, .o_modal_backdrop")
    );
  }

  function isElementVisible(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (node.hidden) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    return styles.display !== "none" && styles.visibility !== "hidden";
  }

  function hasNonModalFormView(selector) {
    return Array.prototype.slice.call(
      document.querySelectorAll(String(selector || ".o_form_view"))
    ).some(function (node) {
      return node instanceof HTMLElement && !isElementInsideModal(node);
    });
  }

  function findVisibleListTable(config) {
    var settings = config && typeof config === "object" ? config : {};
    var scopeNode = resolveElement(settings.scopeNode);
    var root = scopeNode instanceof HTMLElement || scopeNode instanceof Document ? scopeNode : document;
    var selector = String(settings.selector || "table.o_list_table").trim() || "table.o_list_table";
    var allowHiddenVisibility = !!settings.allowHiddenVisibility;
    return Array.prototype.slice.call(root.querySelectorAll(selector)).find(function (table) {
      if (!(table instanceof HTMLElement) || isElementInsideModal(table)) {
        return false;
      }
      if (!allowHiddenVisibility && !isElementVisible(table)) {
        return false;
      }
      if (allowHiddenVisibility) {
        var styles = window.getComputedStyle(table);
        if (table.hidden || styles.display === "none") {
          return false;
        }
      }
      if (typeof settings.filter === "function") {
        try {
          return !!settings.filter(table, settings);
        } catch (_error) {
          return false;
        }
      }
      return true;
    }) || null;
  }

  function resolveScopedControlPanel(config) {
    var settings = config && typeof config === "object" ? config : {};
    var hostNode = resolveElement(settings.hostNode);
    var selector = String(settings.selector || ".o_control_panel").trim() || ".o_control_panel";
    var candidateHosts = [];
    if (hostNode instanceof HTMLElement) {
      candidateHosts.push(hostNode);
      var promotedHost = hostNode.matches(".o_content")
        ? hostNode.parentElement
        : hostNode.closest(".o_action, .o_view_controller, .o_action_manager");
      while (promotedHost instanceof HTMLElement) {
        if (promotedHost.matches(".o_action, .o_view_controller, .o_action_manager")) {
          if (candidateHosts.indexOf(promotedHost) < 0) {
            candidateHosts.push(promotedHost);
          }
          break;
        }
        promotedHost = promotedHost.parentElement;
      }
    }
    for (var index = 0; index < candidateHosts.length; index += 1) {
      var scopedPanel = candidateHosts[index].querySelector(selector);
      if (scopedPanel instanceof HTMLElement) {
        return scopedPanel;
      }
    }
    return null;
  }

  function matchesFormHints(form, config) {
    var settings = config && typeof config === "object" ? config : {};
    var hints = Array.isArray(settings.formFieldHints) ? settings.formFieldHints : [];
    var hintMode = String(settings.formFieldHintMode || "any").trim().toLowerCase();
    if (!(form instanceof HTMLElement)) {
      return false;
    }
    if (!hints.length) {
      return true;
    }
    var matcher = hintMode === "all" ? "every" : "some";
    return hints[matcher](function (fieldName) {
      var normalized = String(fieldName || "").trim();
      return !!(
        normalized &&
        form.querySelector("[name='" + normalized + "'], [data-name='" + normalized + "']")
      );
    });
  }

  function findVisibleForm(config) {
    var settings = config && typeof config === "object" ? config : {};
    var allowFallback = !!settings.allowFallback;
    var selector = String(settings.formSelector || ".o_form_view").trim() || ".o_form_view";
    var markerSelector = String(settings.formMarkerSelector || "").trim();
    var forms = Array.prototype.slice.call(document.querySelectorAll(selector));
    var strictMatch = forms.find(function (form) {
      if (!(form instanceof HTMLElement) || isElementInsideModal(form) || !isElementVisible(form)) {
        return false;
      }
      if (markerSelector && !(form.querySelector(markerSelector) instanceof HTMLElement)) {
        return false;
      }
      return matchesFormHints(form, settings);
    }) || null;
    if (strictMatch instanceof HTMLElement || !allowFallback) {
      return strictMatch;
    }
    return forms.find(function (form) {
      return form instanceof HTMLElement && !isElementInsideModal(form) && isElementVisible(form);
    }) || null;
  }

  function findNativeCreateButton(config) {
    var settings = config && typeof config === "object" ? config : {};
    var controlPanel = resolveElement(settings.controlPanel);
    var toolbarId = String(settings.toolbarId || "").trim();
    var selectors = [
      ".o_cp_buttons .o_list_button_add",
      ".o_cp_buttons button[data-action='create']",
      ".o_control_panel_main_buttons .o_list_button_add",
      ".o_control_panel_main_buttons button[data-action='create']",
      ".o_control_panel_main_buttons a.btn.btn-primary",
      ".o_cp_buttons .btn.btn-primary",
      ".o_list_button_add",
      "button[data-action='create']",
      ".o_cp_buttons a.btn.btn-primary",
    ];
    for (var index = 0; index < selectors.length; index += 1) {
      var node =
        (controlPanel instanceof HTMLElement && controlPanel.querySelector(selectors[index])) ||
        document.querySelector(selectors[index]);
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (toolbarId && node.closest("#" + toolbarId)) {
        continue;
      }
      if (isElementInsideModal(node)) {
        continue;
      }
      return node;
    }
    return null;
  }

  function relabelNativeCreateButton(button, label) {
    if (!(button instanceof HTMLElement)) {
      return;
    }
    var nextLabel = String(label || "").trim();
    if (!nextLabel) {
      return;
    }
    button.setAttribute("aria-label", nextLabel);
    if (String(button.textContent || "").trim() !== nextLabel) {
      button.textContent = nextLabel;
    }
  }

  Object.assign(surfaceLayerApi, {
    asElement: asElement,
    resolveElement: resolveElement,
    toDataAttributeName: toDataAttributeName,
    isElementInsideModal: isElementInsideModal,
    isElementVisible: isElementVisible,
    hasNonModalFormView: hasNonModalFormView,
    findVisibleListTable: findVisibleListTable,
    resolveScopedControlPanel: resolveScopedControlPanel,
    findVisibleForm: findVisibleForm,
    findNativeCreateButton: findNativeCreateButton,
    relabelNativeCreateButton: relabelNativeCreateButton,
  });
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
