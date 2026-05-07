(function () {
  "use strict";

  var surfaceLayerApi = window.OdooSurfaceLayers;
  if (!(surfaceLayerApi && typeof surfaceLayerApi === "object")) {
    throw new Error("surface list workspace runtime requires the canonical OdooSurfaceLayers bootstrap.");
  }
  var workspaceApi = surfaceLayerApi.workspaceRuntime;
  if (!(workspaceApi && typeof workspaceApi === "object")) {
    throw new Error("surface list workspace runtime requires the canonical workspace runtime.");
  }
  var buildCommonPremiumWorkspaceToolbarConsoleController = workspaceApi.buildPremiumWorkspaceToolbarConsoleController;
  var buildCommonPremiumWorkspaceToolbarConsoleMarkup = workspaceApi.buildPremiumWorkspaceToolbarConsoleMarkup;

  function normalizeWorkspaceEntryList(entries) {
    return Array.isArray(entries) ? entries.filter(function (entry) {
      return entry && typeof entry === "object";
    }) : [];
  }

  function buildPremiumToolbarController(config) {
    var settings = config && typeof config === "object" ? config : {};
    return buildCommonPremiumWorkspaceToolbarConsoleController({
      shouldShow: settings.shouldShow,
      buildCommandBar: settings.buildCommandBar,
      buildMetrics: settings.buildMetrics,
      buildValidationRail: settings.buildValidationRail,
      buildEmptyState: settings.buildEmptyState,
      buildBodyMarkup: settings.buildBodyMarkup,
    });
  }

  function buildPremiumToolbarTabs(entries, activeKey, keyName) {
    return normalizeWorkspaceEntryList(entries).map(function (entry) {
      var entryKey = String(entry && entry[keyName] || "").trim();
      return {
        key: entryKey,
        label: entry.chipLabel || entry.label || entryKey,
        active: !!entryKey && entryKey === activeKey,
        data: {
          surfaceTab: "1",
          surfaceTabKey: entryKey,
        },
      };
    });
  }

  function buildCanonicalWindowActionRequest(config) {
    if (typeof workspaceApi.buildCanonicalWindowActionRequest === "function") {
      return workspaceApi.buildCanonicalWindowActionRequest(config);
    }
    var settings = config && typeof config === "object" ? config : {};
    var actionId = Number.parseInt(String(settings.actionId || 0), 10) || 0;
    if (actionId > 0) {
      return actionId;
    }
    var contractLabel = String(
      settings.contractLabel ||
      settings.label ||
      settings.name ||
      settings.workspaceKey ||
      "workspace action"
    ).trim();
    throw new Error("Missing required action ID for " + contractLabel + ".");
  }

  function buildActionBackedListWorkspace(config) {
    var settings = config && typeof config === "object" ? config : {};
    var entries = normalizeWorkspaceEntryList(settings.entries);
    var workspaceScaffold = settings.workspaceScaffold || settings.scaffold;
    var shellSettings = settings.shell && typeof settings.shell === "object"
      ? Object.assign({}, settings.shell)
      : {};
    if (!entries.length) {
      throw new Error("buildActionBackedListWorkspace requires at least one entry.");
    }
    if (
      !workspaceScaffold ||
      typeof workspaceScaffold.buildWorkspaceBreadcrumbTrail !== "function" ||
      typeof workspaceScaffold.buildWorkspaceBreadcrumbItem !== "function" ||
      typeof workspaceScaffold.buildSurfaceWorkspaceShellConfig !== "function"
    ) {
      throw new Error("buildActionBackedListWorkspace requires a workspace scaffold.");
    }

    var keyName = String(settings.valueKey || "key").trim() || "key";
    var actionKey = String(settings.actionKey || "actionId").trim() || "actionId";
    var stateKey = String(settings.stateKey || "").trim();
    var workspaceKey = String(settings.workspaceKey || settings.key || "").trim();
    var sectionKey = String(settings.sectionKey || shellSettings.sidebarSectionKey || "").trim();
    var contextKey = String(settings.contextKey || "").trim();
    var toolbarSettings = settings.toolbar && typeof settings.toolbar === "object"
      ? Object.assign({}, settings.toolbar)
      : {};
    var toolbarLayout = String(toolbarSettings.layout || "tabs-first").trim() || "tabs-first";
    if (!stateKey) {
      throw new Error("buildActionBackedListWorkspace requires stateKey.");
    }
    if (!workspaceKey) {
      throw new Error("buildActionBackedListWorkspace requires workspaceKey.");
    }

    function readEntryKey(entry) {
      return String(entry && entry[keyName] || "").trim();
    }

    function getEntry(key) {
      return controller.getEntry(key) || entries[0];
    }

    function readSelectionKey() {
      return controller.read();
    }

    function resolveSelectionKey(key) {
      var normalized = String(key || "").trim();
      return normalized || readSelectionKey();
    }

    function readResolvedEntry() {
      return getEntry(resolveSelectionKey());
    }

    function buildEntryContext(entry) {
      if (typeof settings.buildEntryContext === "function") {
        var explicitContext = settings.buildEntryContext(entry, api);
        return explicitContext && typeof explicitContext === "object" ? explicitContext : {};
      }
      if (!contextKey) {
        return {};
      }
      var payload = {};
      payload[contextKey] = readEntryKey(entry);
      return payload;
    }

    function buildListAction(key) {
      var entry = getEntry(resolveSelectionKey(key));
      if (typeof settings.buildEntryListAction === "function") {
        var explicitAction = settings.buildEntryListAction(entry, api);
        if (explicitAction != null) {
          return explicitAction;
        }
      }
      var actionId = Number.parseInt(String(entry[actionKey] || 0), 10) || 0;
      if (actionId > 0) {
        return actionId;
      }
      throw new Error("buildActionBackedListWorkspace requires a canonical actionId or buildEntryListAction for entry \"" + readEntryKey(entry) + "\".");
    }

    function buildCreateAction(key) {
      var entry = getEntry(resolveSelectionKey(key));
      if (typeof settings.buildEntryCreateAction === "function") {
        var explicitAction = settings.buildEntryCreateAction(entry, api);
        if (explicitAction != null) {
          return explicitAction;
        }
      }
      return buildCanonicalWindowActionRequest({
        actionId: entry.createActionId,
        contractLabel: readEntryKey(entry) + " create action",
      });
    }

    function getEntryHrefOptions(entry) {
      if (typeof settings.getEntryHrefOptions === "function") {
        return settings.getEntryHrefOptions(entry, api) || {};
      }
      return { viewType: "list" };
    }

    function buildEntryBreadcrumbMenu() {
      if (typeof workspaceScaffold.buildBreadcrumbMenu !== "function") {
        return null;
      }
      return workspaceScaffold.buildBreadcrumbMenu(entries.map(function (entry) {
        return {
          label: entry.label,
          actionId: entry[actionKey],
          actionFactory: function () { return buildListAction(readEntryKey(entry)); },
          workspaceKey: workspaceKey,
          sectionKey: sectionKey,
          hrefOptions: getEntryHrefOptions(entry),
        };
      }));
    }

    function buildToolbarFilters(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarFilters === "function") {
        return settings.buildToolbarFilters(api, state, handle, runtimeApi);
      }
      return toolbarSettings.filters;
    }

    function buildPremiumCommandBar(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarCommandBar === "function") {
        return settings.buildToolbarCommandBar(api, state, handle, runtimeApi);
      }
      var entry = readResolvedEntry();
      return {
        eyebrow: settings.chipLabel || settings.title || "",
        title: settings.title || entry.label || "",
        description: settings.description || "",
        statusChips: entry && (entry.chipLabel || entry.label)
          ? [{ label: entry.chipLabel || entry.label, tone: "accent" }]
          : [],
        data: {
          surfaceWorkspaceKey: workspaceKey,
          surfaceWorkspaceSection: sectionKey,
        },
      };
    }

    function buildPremiumMetrics(state, handle, runtimeApi) {
      if (state && state.isForm && settings.showFormMetrics !== true) {
        return null;
      }
      if (typeof settings.buildToolbarMetrics === "function") {
        return settings.buildToolbarMetrics(api, state, handle, runtimeApi);
      }
      return toolbarSettings.metrics || settings.metrics || null;
    }

    function buildPremiumValidationRail(state, handle, runtimeApi) {
      if (state && state.isForm && settings.showFormValidationRail !== true) {
        return null;
      }
      if (typeof settings.buildToolbarValidationRail === "function") {
        return settings.buildToolbarValidationRail(api, state, handle, runtimeApi);
      }
      return toolbarSettings.validationRail || settings.validationRail || null;
    }

    function buildPremiumEmptyState(state, handle, runtimeApi) {
      if (state && state.isForm) {
        return null;
      }
      if (typeof settings.buildToolbarEmptyState === "function") {
        return settings.buildToolbarEmptyState(api, state, handle, runtimeApi);
      }
      return toolbarSettings.emptyState || settings.emptyState || null;
    }

    function buildPremiumBodyMarkup(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarBodyMarkup === "function") {
        return settings.buildToolbarBodyMarkup(api, state, handle, runtimeApi);
      }
      var filters = state && state.isForm ? [] : buildToolbarFilters(state, handle, runtimeApi);
      var tabs = buildPremiumToolbarTabs(entries, readSelectionKey(), keyName);
      if ((!Array.isArray(tabs) || !tabs.length) && (!Array.isArray(filters) || !filters.length)) {
        return "";
      }
      return surfaceLayerApi.buildSelectFilterWorkspaceConsoleMarkup({
        className: "o_surface_workspace_console",
        layout: toolbarLayout,
        activeTab: readSelectionKey(),
        tabs: tabs,
        filters: filters,
      });
    }

    function shouldShowPremiumToolbarConsole(state, handle, runtimeApi) {
      if (state && state.isForm && settings.showFormIdentityToolbar !== false) {
        return true;
      }
      if (typeof settings.shouldShowToolbarConsole === "function") {
        return settings.shouldShowToolbarConsole(state, handle, runtimeApi) !== false;
      }
      return !!(state && state.active);
    }

    var premiumToolbarController = buildPremiumToolbarController({
      shouldShow: shouldShowPremiumToolbarConsole,
      buildCommandBar: buildPremiumCommandBar,
      buildMetrics: buildPremiumMetrics,
      buildValidationRail: buildPremiumValidationRail,
      buildEmptyState: buildPremiumEmptyState,
      buildBodyMarkup: buildPremiumBodyMarkup,
    });

    function buildConsoleMarkup(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarConsoleMarkup === "function") {
        return settings.buildToolbarConsoleMarkup(api, state, handle, runtimeApi);
      }
      return buildCommonPremiumWorkspaceToolbarConsoleMarkup({
        bodyMarkup: premiumToolbarController.buildToolbarConsoleMarkup(state, handle, runtimeApi),
      }, state, handle);
    }

    function readRecordLabel(state) {
      if (typeof settings.getRecordLabel === "function") {
        return String(settings.getRecordLabel(state, readResolvedEntry(), api) || "").trim();
      }
      if (!(state && state.isForm)) {
        return "";
      }
      var entry = readResolvedEntry();
      return workspaceApi.readFieldText(state.formRoot, entry.recordFields) || entry.createLabel || "";
    }

    function buildNavActions() {
      if (typeof settings.buildNavActions === "function") {
        var explicitNavActions = settings.buildNavActions(api);
        return explicitNavActions && typeof explicitNavActions === "object" ? explicitNavActions : {};
      }
      if (shellSettings.navActions && typeof shellSettings.navActions === "object") {
        return Object.assign({}, shellSettings.navActions);
      }
      return {};
    }

    function buildWorkspaceConfig() {
      var actionLabels = entries.map(function (entry) {
        return String(entry.actionName || "").trim();
      }).filter(Boolean);
      var actionIds = entries.map(function (entry) {
        return Number.parseInt(String(entry[actionKey] || 0), 10) || 0;
      }).filter(function (value) {
        return value > 0;
      });
      var workspaceModels = [];
      function addWorkspaceModel(value) {
        var normalized = String(value || "").trim();
        if (normalized && workspaceModels.indexOf(normalized) < 0) {
          workspaceModels.push(normalized);
        }
      }
      addWorkspaceModel(settings.model);
      entries.forEach(function (entry) {
        addWorkspaceModel(entry.resModel);
      });
      var workspaceConfig = workspaceScaffold.buildSurfaceWorkspaceShellConfig({
        key: workspaceKey,
        workspaceKey: workspaceKey,
        sectionKey: sectionKey,
        title: settings.title || "",
        description: settings.description || "",
        primaryLabel: settings.primaryLabel || "",
        secondaryLabel: settings.secondaryLabel || "",
        preserveEmptyFormToolbar: settings.preserveEmptyFormToolbar !== false,
        model: settings.model || "",
        models: workspaceModels,
        actionLabels: actionLabels,
        allowImplicitFormActivation: settings.allowImplicitFormActivation === true,
        actionIds: actionIds,
        chipLabel: settings.chipLabel || settings.title || "",
        navItems: Array.isArray(settings.navItems) ? settings.navItems : workspaceScaffold.navItems,
        premiumWorkspace: Object.assign({
          key: workspaceKey,
          workspaceKey: workspaceKey,
          sectionKey: sectionKey,
          title: settings.title || "",
          description: settings.description || "",
          chipLabel: settings.chipLabel || settings.title || "",
          entries: entries.map(function (entry) {
            return {
              key: readEntryKey(entry),
              label: entry.label,
              chipLabel: entry.chipLabel || entry.label,
            };
          }),
        }, settings.premiumWorkspace && typeof settings.premiumWorkspace === "object"
          ? settings.premiumWorkspace
          : {}),
        shell: Object.assign({}, shellSettings, {
          navActions: buildNavActions(),
        }),
        buildCreateAction: function () { return buildCreateAction(); },
        buildListAction: function () { return buildListAction(); },
        getPrimaryLabel: function () {
          var entry = readResolvedEntry();
          return entry.createLabel || settings.primaryLabel || "";
        },
        getRecordLabel: function (state) { return readRecordLabel(state); },
        getBreadcrumbItems: function (state) {
          var entry = readResolvedEntry();
          var hrefOptions = getEntryHrefOptions(entry);
          var defaultCurrentItem = workspaceScaffold.buildWorkspaceBreadcrumbItem(entry.label, {
            href: workspaceScaffold.buildBreadcrumbHref(entry[actionKey], hrefOptions),
            actionFactory: function () { return buildListAction(readEntryKey(entry)); },
            preferAction: true,
            workspaceKey: workspaceKey,
            sectionKey: sectionKey,
            hrefOptions: hrefOptions,
          });
          return workspaceScaffold.buildWorkspaceBreadcrumbTrail(state, {
            rootItems: typeof settings.buildRootBreadcrumbItems === "function"
              ? settings.buildRootBreadcrumbItems(state, entry, api) || []
              : [],
            currentItem: typeof settings.buildCurrentBreadcrumbItem === "function"
              ? settings.buildCurrentBreadcrumbItem(state, entry, api) || defaultCurrentItem
              : defaultCurrentItem,
          });
        },
        getBreadcrumbLabel: function (state) {
          var entry = readResolvedEntry();
          if (typeof settings.getBreadcrumbLabel === "function") {
            return String(settings.getBreadcrumbLabel(state, entry, api) || "").trim();
          }
          return state && state.isForm
            ? (state.recordLabel || entry.createLabel || settings.primaryLabel || "")
            : entry.label;
        },
        handleToolbarInteraction: handleToolbarInteraction,
        buildToolbarConsoleMarkup: buildConsoleMarkup,
        shouldShowToolbarConsole: premiumToolbarController.shouldShowToolbarConsole,
      });
      var lifecycleHooks = typeof settings.buildWorkspaceHooks === "function"
        ? settings.buildWorkspaceHooks(api) || {}
        : {};
      if (typeof lifecycleHooks.onSync === "function" || typeof settings.onSync === "function") {
        workspaceConfig.onSync = typeof lifecycleHooks.onSync === "function"
          ? lifecycleHooks.onSync
          : settings.onSync;
      }
      if (typeof lifecycleHooks.onInactive === "function" || typeof settings.onInactive === "function") {
        workspaceConfig.onInactive = typeof lifecycleHooks.onInactive === "function"
          ? lifecycleHooks.onInactive
          : settings.onInactive;
      }
      return workspaceConfig;
    }

    var controller = surfaceLayerApi.buildActionBackedToolbarSelectionController({
      key: stateKey,
      entries: entries,
      valueKey: keyName,
      actionKey: actionKey,
      workspaceKey: workspaceKey,
      buildActionRequest: function (entry) {
        return buildListAction(readEntryKey(entry));
      },
    });
    var handleToolbarInteraction = surfaceLayerApi.buildWorkspaceToolbarInteractionHandler({
      controller: controller,
      workspaceKey: workspaceKey,
      buildAction: function (nextState) {
        return buildListAction(nextState && nextState[keyName]);
      },
    });

    var api = {
      controller: controller,
      entries: entries.slice(),
      getEntry: getEntry,
      readEntryKey: readSelectionKey,
      resolveEntryKey: resolveSelectionKey,
      readResolvedEntry: readResolvedEntry,
      buildEntryContext: buildEntryContext,
      buildListAction: buildListAction,
      buildCreateAction: buildCreateAction,
      buildEntryBreadcrumbMenu: buildEntryBreadcrumbMenu,
      getEntryHrefOptions: getEntryHrefOptions,
      buildConsoleMarkup: buildConsoleMarkup,
      premiumToolbarController: premiumToolbarController,
      readRecordLabel: readRecordLabel,
      handleToolbarInteraction: handleToolbarInteraction,
      buildWorkspaceConfig: buildWorkspaceConfig,
      register: function () {
        workspaceApi.registerWorkspace(buildWorkspaceConfig());
        return api;
      },
    };
    return api;
  }

  function registerActionBackedListWorkspace(config) {
    return buildActionBackedListWorkspace(config).register();
  }

  function buildCanonicalToolbarInteractionHandler(config) {
    var settings = config && typeof config === "object" ? config : {};
    var workspaceKey = String(settings.workspaceKey || settings.key || "").trim();
    if (!workspaceKey) {
      throw new Error("buildCanonicalToolbarInteractionHandler requires workspaceKey.");
    }
    return surfaceLayerApi.buildWorkspaceToolbarInteractionHandler({
      controller: settings.controller,
      workspaceKey: workspaceKey,
      buildAction: settings.buildAction,
    });
  }

  function buildTabbedMonthWorkspaceChrome(config) {
    var settings = config && typeof config === "object" ? config : {};
    var tabs = normalizeWorkspaceEntryList(settings.tabs);
    var workspaceKey = String(settings.workspaceKey || settings.key || "").trim();
    var stateKey = String(settings.stateKey || "").trim();
    var monthConfig = settings.monthConfig && typeof settings.monthConfig === "object"
      ? Object.assign({}, settings.monthConfig)
      : {};
    var monthFilterKey = String(settings.monthFilterKey || "month").trim() || "month";
    var monthFilterLabel = String(settings.monthFilterLabel || "Period").trim() || "Period";
    var toolbarLayout = String(settings.toolbarLayout || "filters-first").trim() || "filters-first";
    var emptyMonthLabel = String(
      settings.emptyMonthLabel || monthConfig.emptyLabel || "All periods"
    ).trim() || "All periods";
    if (!tabs.length) {
      throw new Error("buildTabbedMonthWorkspaceChrome requires tabs.");
    }
    if (!workspaceKey) {
      throw new Error("buildTabbedMonthWorkspaceChrome requires workspaceKey.");
    }
    if (!stateKey) {
      throw new Error("buildTabbedMonthWorkspaceChrome requires stateKey.");
    }
    if (typeof settings.buildAction !== "function") {
      throw new Error("buildTabbedMonthWorkspaceChrome requires buildAction.");
    }
    var defaultTabKey = String(
      settings.defaultTabKey || (tabs[0] && tabs[0].key) || ""
    ).trim();
    if (!defaultTabKey) {
      throw new Error("buildTabbedMonthWorkspaceChrome requires a default tab key.");
    }
    var controller = surfaceLayerApi.buildTabbedMonthListStateController({
      key: stateKey,
      fallbackState: Object.assign({ tab: defaultTabKey, month: "" }, settings.fallbackState || {}),
      monthConfig: monthConfig,
      resolveTab: settings.resolveTab,
      readTabFromAction: settings.readTabFromAction,
      onWriteTab: settings.onWriteTab,
    });
    var handleToolbarInteraction = buildCanonicalToolbarInteractionHandler({
      controller: controller,
      workspaceKey: workspaceKey,
      buildAction: settings.buildAction,
    });
    var previewHooks = settings.previewController
      ? workspaceApi.buildManagedPreviewWorkspaceHooks({
        previewController: settings.previewController,
      })
      : null;

    function readState() {
      return controller.read();
    }

    function buildPremiumTabbedMonthCommandBar(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarCommandBar === "function") {
        return settings.buildToolbarCommandBar(readState(), state, handle, runtimeApi);
      }
      var listState = readState();
      return {
        eyebrow: settings.chipLabel || settings.title || "",
        title: settings.title || "",
        description: settings.description || "",
        data: {
          surfaceWorkspaceKey: workspaceKey,
        },
      };
    }

    function buildPremiumTabbedMonthMetrics(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarMetrics === "function") {
        return settings.buildToolbarMetrics(readState(), state, handle, runtimeApi);
      }
      return settings.metrics || null;
    }

    function buildPremiumTabbedMonthValidationRail(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarValidationRail === "function") {
        return settings.buildToolbarValidationRail(readState(), state, handle, runtimeApi);
      }
      return settings.validationRail || null;
    }

    function buildPremiumTabbedMonthEmptyState(state, handle, runtimeApi) {
      if (typeof settings.buildToolbarEmptyState === "function") {
        return settings.buildToolbarEmptyState(readState(), state, handle, runtimeApi);
      }
      return settings.emptyState || null;
    }

    function buildPremiumTabbedMonthBodyMarkup() {
      var listState = readState();
      return surfaceLayerApi.buildSelectFilterWorkspaceConsoleMarkup({
        className: "o_surface_workspace_console",
        layout: toolbarLayout,
        activeTab: listState.tab,
        tabs: buildPremiumToolbarTabs(tabs, listState.tab, "key"),
        filters: [
          {
            key: monthFilterKey,
            label: monthFilterLabel,
            value: listState.month,
            emptyLabel: emptyMonthLabel,
            options: controller.buildMonthOptions(),
          },
        ],
      });
    }

    function shouldShowToolbarConsole(state) {
      return !!(state && state.isList);
    }

    var premiumToolbarController = buildPremiumToolbarController({
      shouldShow: shouldShowToolbarConsole,
      buildCommandBar: buildPremiumTabbedMonthCommandBar,
      buildMetrics: buildPremiumTabbedMonthMetrics,
      buildValidationRail: buildPremiumTabbedMonthValidationRail,
      buildEmptyState: buildPremiumTabbedMonthEmptyState,
      buildBodyMarkup: buildPremiumTabbedMonthBodyMarkup,
    });

    function buildToolbarConsoleMarkup(state, handle, runtimeApi) {
      return buildCommonPremiumWorkspaceToolbarConsoleMarkup({
        bodyMarkup: premiumToolbarController.buildToolbarConsoleMarkup(state, handle, runtimeApi),
      }, state, handle);
    }

    function buildWorkspaceBindings() {
      var bindings = {
        buildToolbarConsoleMarkup: buildToolbarConsoleMarkup,
        shouldShowToolbarConsole: premiumToolbarController.shouldShowToolbarConsole,
        handleToolbarInteraction: handleToolbarInteraction,
      };
      if (previewHooks) {
        bindings.onSync = previewHooks.onSync;
        bindings.onInactive = previewHooks.onInactive;
      }
      return bindings;
    }

    return {
      controller: controller,
      previewHooks: previewHooks,
      readState: readState,
      buildToolbarConsoleMarkup: buildToolbarConsoleMarkup,
      shouldShowToolbarConsole: premiumToolbarController.shouldShowToolbarConsole,
      handleToolbarInteraction: handleToolbarInteraction,
      buildWorkspaceBindings: buildWorkspaceBindings,
    };
  }

  Object.assign(workspaceApi, {
    buildActionBackedListWorkspace: buildActionBackedListWorkspace,
    registerActionBackedListWorkspace: registerActionBackedListWorkspace,
    buildCanonicalToolbarInteractionHandler: buildCanonicalToolbarInteractionHandler,
    buildPremiumToolbarTabs: buildPremiumToolbarTabs,
    buildTabbedMonthWorkspaceChrome: buildTabbedMonthWorkspaceChrome,
    normalizeWorkspaceEntryList: normalizeWorkspaceEntryList,
  });
  surfaceLayerApi.workspaceRuntime = workspaceApi;
  window.OdooSurfaceLayers = surfaceLayerApi;
})();
