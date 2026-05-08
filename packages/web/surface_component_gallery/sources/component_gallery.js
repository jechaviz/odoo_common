(function () {
  "use strict";

  var rootObject = typeof window !== "undefined" ? window : globalThis;
  var GALLERY_API_NAME = "odooCommonComponentGallery";
  var DEFAULT_STATE = {
    selectedKey: "",
    target: {
      consumer_key: "",
      target_root: "",
      mode: "dry-run",
      base_url: "",
      profile_key: "",
      notes: "",
    },
    plan: null,
    status: "",
    error: "",
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function toArray(value) {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : Array.prototype.slice.call(value);
  }

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function mergeState(state) {
    var next = Object.assign({}, DEFAULT_STATE, state || {});
    next.target = Object.assign({}, DEFAULT_STATE.target, next.target || {});
    return next;
  }

  function normalizeCommonComponentGalleryModel(model) {
    var rawModel = model && typeof model === "object" ? model : {};
    var sections = toArray(rawModel.sections).map(function (section) {
      var components = toArray(section.components).map(function (component) {
        return {
          key: cleanText(component.key),
          title: cleanText(component.title),
          runtime: cleanText(component.runtime || section.key),
          status: cleanText(component.status),
          package_path: cleanText(component.package_path),
          features: toArray(component.features).map(cleanText).filter(Boolean),
          origins: toArray(component.origins).map(function (origin) {
            return {
              project: cleanText(origin.project),
              path: cleanText(origin.path),
            };
          }).filter(function (origin) {
            return origin.project && origin.path;
          }),
        };
      }).filter(function (component) {
        return component.key && component.title;
      });
      return {
        key: cleanText(section.key),
        title: cleanText(section.title || section.key),
        components: components,
      };
    }).filter(function (section) {
      return section.key && section.components.length;
    });
    return {
      title: cleanText(rawModel.title || "Odoo Common Components"),
      sections: sections,
      wizard: rawModel.wizard && typeof rawModel.wizard === "object" ? rawModel.wizard : {},
    };
  }

  function findSelectedComponent(model, state) {
    var selectedKey = cleanText(state.selectedKey);
    var first = null;
    for (var sectionIndex = 0; sectionIndex < model.sections.length; sectionIndex += 1) {
      var section = model.sections[sectionIndex];
      for (var componentIndex = 0; componentIndex < section.components.length; componentIndex += 1) {
        var component = section.components[componentIndex];
        if (!first) {
          first = component;
        }
        if (component.key === selectedKey) {
          return component;
        }
      }
    }
    return first;
  }

  function renderSectionNav(model, selectedComponent) {
    return model.sections.map(function (section) {
      var items = section.components.map(function (component) {
        var selected = selectedComponent && selectedComponent.key === component.key;
        return [
          '<button type="button" class="ocg-nav-item' + (selected ? " is-selected" : "") + '"',
          ' data-ocg-component-key="' + escapeHtml(component.key) + '"',
          ' aria-pressed="' + (selected ? "true" : "false") + '">',
          '<span class="ocg-nav-title">' + escapeHtml(component.title) + "</span>",
          '<span class="ocg-nav-meta">' + escapeHtml(component.runtime) + "</span>",
          "</button>",
        ].join("");
      }).join("");
      return [
        '<section class="ocg-nav-section">',
        '<h3>' + escapeHtml(section.title) + "</h3>",
        items,
        "</section>",
      ].join("");
    }).join("");
  }

  function renderComponentHero(component) {
    if (!component) {
      return '<section class="ocg-empty">Selecciona un componente para ver su contrato.</section>';
    }
    var features = component.features.map(function (feature) {
      return '<span class="ocg-chip">' + escapeHtml(feature) + "</span>";
    }).join("");
    var origins = component.origins.map(function (origin) {
      return [
        '<li>',
        '<span>' + escapeHtml(origin.project) + "</span>",
        '<code>' + escapeHtml(origin.path) + "</code>",
        "</li>",
      ].join("");
    }).join("");
    return [
      '<section class="ocg-component-hero">',
      '<div>',
      '<p class="ocg-kicker">' + escapeHtml(component.runtime) + " / " + escapeHtml(component.status) + "</p>",
      '<h2>' + escapeHtml(component.title) + "</h2>",
      '<code>' + escapeHtml(component.package_path) + "</code>",
      "</div>",
      '<div class="ocg-chip-row">' + features + "</div>",
      "</section>",
      '<section class="ocg-panel">',
      '<header><h3>Origen y contrato</h3></header>',
      '<ul class="ocg-origin-list">' + origins + "</ul>",
      "</section>",
    ].join("");
  }

  function renderWizard(component, state) {
    var disabled = component ? "" : " disabled";
    var target = state.target || {};
    return [
      '<aside class="ocg-wizard">',
      '<header>',
      '<p class="ocg-kicker">Wizard</p>',
      '<h3>Instalar componente</h3>',
      "</header>",
      '<label>Consumidor<input data-ocg-target-field="consumer_key" value="' + escapeHtml(target.consumer_key) + '"' + disabled + " /></label>",
      '<label>Target root<input data-ocg-target-field="target_root" value="' + escapeHtml(target.target_root) + '"' + disabled + " /></label>",
      '<label>Base URL<input data-ocg-target-field="base_url" value="' + escapeHtml(target.base_url) + '"' + disabled + " /></label>",
      '<div class="ocg-field-row">',
      '<label>Modo<select data-ocg-target-field="mode"' + disabled + ">",
      '<option value="dry-run"' + (target.mode === "dry-run" ? " selected" : "") + ">Dry-run</option>",
      '<option value="live"' + (target.mode === "live" ? " selected" : "") + ">Live</option>",
      "</select></label>",
      '<label>Perfil<input data-ocg-target-field="profile_key" value="' + escapeHtml(target.profile_key) + '"' + disabled + " /></label>",
      "</div>",
      '<label>Notas<textarea data-ocg-target-field="notes"' + disabled + ">" + escapeHtml(target.notes) + "</textarea></label>",
      '<button type="button" class="ocg-primary" data-ocg-build-plan="1"' + disabled + ">Generar plan</button>",
      renderPlan(state.plan, state),
      "</aside>",
    ].join("");
  }

  function renderPlan(plan, state) {
    var status = cleanText(state.status);
    var error = cleanText(state.error);
    if (error) {
      return '<div class="ocg-plan-state is-error">' + escapeHtml(error) + "</div>";
    }
    if (status) {
      return '<div class="ocg-plan-state">' + escapeHtml(status) + "</div>";
    }
    if (!plan || !Array.isArray(plan.steps)) {
      return '<div class="ocg-plan-state">El plan aparece aqui despues del dry-run.</div>';
    }
    var steps = plan.steps.map(function (step, index) {
      return [
        '<button type="button" class="ocg-step" data-ocg-step-key="' + escapeHtml(step.key) + '">',
        '<span class="ocg-step-index">' + escapeHtml(index + 1) + "</span>",
        '<span><strong>' + escapeHtml(step.title) + "</strong>",
        '<small>' + escapeHtml(step.kind) + "</small></span>",
        "</button>",
      ].join("");
    }).join("");
    return [
      '<section class="ocg-plan">',
      '<div class="ocg-plan-actions">',
      '<button type="button" data-ocg-ai-review="1">Revisar con IA</button>',
      '<button type="button" data-ocg-copy-plan="1">Copiar plan</button>',
      "</div>",
      steps,
      "</section>",
    ].join("");
  }

  function renderCommonComponentGalleryMarkup(model, state) {
    var normalizedModel = normalizeCommonComponentGalleryModel(model);
    var normalizedState = mergeState(state);
    var selectedComponent = findSelectedComponent(normalizedModel, normalizedState);
    if (selectedComponent && !normalizedState.selectedKey) {
      normalizedState.selectedKey = selectedComponent.key;
    }
    return [
      '<div class="ocg-shell">',
      '<nav class="ocg-sidebar">',
      '<header><p class="ocg-kicker">Common</p><h2>' + escapeHtml(normalizedModel.title) + "</h2></header>",
      renderSectionNav(normalizedModel, selectedComponent),
      "</nav>",
      '<main class="ocg-main">',
      renderComponentHero(selectedComponent),
      "</main>",
      renderWizard(selectedComponent, normalizedState),
      "</div>",
    ].join("");
  }

  function mountCommonComponentGallery(root, config) {
    if (!(root instanceof HTMLElement)) {
      throw new TypeError("mountCommonComponentGallery requires an HTMLElement root");
    }
    var settings = config && typeof config === "object" ? config : {};
    var model = normalizeCommonComponentGalleryModel(settings.model || {});
    var state = mergeState(settings.state || {});
    var selected = findSelectedComponent(model, state);
    if (selected && !state.selectedKey) {
      state.selectedKey = selected.key;
    }

    function getSelectedComponent() {
      return findSelectedComponent(model, state);
    }

    function render() {
      root.innerHTML = renderCommonComponentGalleryMarkup(model, state);
    }

    function setStatus(status, error) {
      state.status = cleanText(status);
      state.error = cleanText(error);
      render();
    }

    function setPlan(plan) {
      state.plan = plan || null;
      state.status = "";
      state.error = "";
      render();
    }

    root.addEventListener("click", function (event) {
      var target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) {
        return;
      }
      var componentButton = target.closest("[data-ocg-component-key]");
      if (componentButton instanceof HTMLElement) {
        state.selectedKey = cleanText(componentButton.dataset.ocgComponentKey);
        state.plan = null;
        state.status = "";
        state.error = "";
        render();
        if (typeof settings.onSelect === "function") {
          settings.onSelect({ component: getSelectedComponent(), state: mergeState(state) });
        }
        return;
      }
      if (target.closest("[data-ocg-build-plan]")) {
        if (typeof settings.onBuildPlan !== "function") {
          setStatus("", "El host debe proveer onBuildPlan.");
          return;
        }
        setStatus("Generando plan...", "");
        Promise.resolve(settings.onBuildPlan({ component: getSelectedComponent(), target: Object.assign({}, state.target), state: mergeState(state) }))
          .then(setPlan)
          .catch(function (error) {
            setStatus("", error && error.message ? error.message : String(error || "No se pudo generar el plan."));
          });
        return;
      }
      var stepButton = target.closest("[data-ocg-step-key]");
      if (stepButton instanceof HTMLElement && typeof settings.onStepAction === "function") {
        settings.onStepAction({
          component: getSelectedComponent(),
          plan: state.plan,
          stepKey: cleanText(stepButton.dataset.ocgStepKey),
          state: mergeState(state),
        });
        return;
      }
      if (target.closest("[data-ocg-ai-review]") && typeof settings.onAiReview === "function") {
        settings.onAiReview({ component: getSelectedComponent(), plan: state.plan, state: mergeState(state) });
        return;
      }
      if (target.closest("[data-ocg-copy-plan]") && state.plan && rootObject.navigator && rootObject.navigator.clipboard) {
        rootObject.navigator.clipboard.writeText(JSON.stringify(state.plan, null, 2));
      }
    });

    root.addEventListener("input", function (event) {
      var target = event.target instanceof HTMLElement ? event.target : null;
      if (!target || !target.matches("[data-ocg-target-field]")) {
        return;
      }
      var field = cleanText(target.dataset.ocgTargetField);
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_STATE.target, field)) {
        return;
      }
      state.target[field] = target.value;
    });

    render();
    return {
      getState: function () { return mergeState(state); },
      setPlan: setPlan,
      setStatus: setStatus,
      render: render,
      destroy: function () {
        root.innerHTML = "";
      },
    };
  }

  rootObject[GALLERY_API_NAME] = {
    mountCommonComponentGallery: mountCommonComponentGallery,
    normalizeCommonComponentGalleryModel: normalizeCommonComponentGalleryModel,
    renderCommonComponentGalleryMarkup: renderCommonComponentGalleryMarkup,
  };
}());
