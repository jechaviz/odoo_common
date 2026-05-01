(function () {
  "use strict";

  var api = window.OdooFormSectionSurfaces = window.OdooFormSectionSurfaces || {};
  var constants = api.constants = api.constants || {};
  var state = api.state = api.state || {};

  if (typeof constants.COLLAPSIBLE_GROUP_CLASS !== "string" || !constants.COLLAPSIBLE_GROUP_CLASS) {
    constants.COLLAPSIBLE_GROUP_CLASS = "o_lib_collapsible_group";
  }
  if (
    typeof constants.SECTION_CONTROLS_VISIBLE_CLASS !== "string" ||
    !constants.SECTION_CONTROLS_VISIBLE_CLASS
  ) {
    constants.SECTION_CONTROLS_VISIBLE_CLASS = "o_lib_section_controls_visible";
  }

  if (typeof state.hoveredSectionGroup === "undefined") {
    state.hoveredSectionGroup = null;
  }
  if (typeof state.sectionHoverRuntimeBound !== "boolean") {
    state.sectionHoverRuntimeBound = false;
  }
  if (typeof state.lastPointerClientX !== "number") {
    state.lastPointerClientX = null;
  }
  if (typeof state.lastPointerClientY !== "number") {
    state.lastPointerClientY = null;
  }

  function clearVisibleSectionControls(exceptGroup) {
    document
      .querySelectorAll(
        "." + constants.COLLAPSIBLE_GROUP_CLASS + "." + constants.SECTION_CONTROLS_VISIBLE_CLASS
      )
      .forEach(function (groupNode) {
        if (groupNode !== exceptGroup) {
          groupNode.classList.remove(constants.SECTION_CONTROLS_VISIBLE_CLASS);
        }
      });
  }

  function setVisibleSectionControls(groupNode) {
    var nextGroup = groupNode instanceof HTMLElement ? groupNode : null;
    if (state.hoveredSectionGroup === nextGroup) {
      if (nextGroup instanceof HTMLElement) {
        nextGroup.classList.add(constants.SECTION_CONTROLS_VISIBLE_CLASS);
      }
      return nextGroup;
    }

    clearVisibleSectionControls(nextGroup);
    state.hoveredSectionGroup = nextGroup;

    if (nextGroup instanceof HTMLElement) {
      nextGroup.classList.add(constants.SECTION_CONTROLS_VISIBLE_CLASS);
    }

    return nextGroup;
  }

  function resolveSectionGroupFromNode(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    var groupNode = target.closest("." + constants.COLLAPSIBLE_GROUP_CLASS);
    return groupNode instanceof HTMLElement ? groupNode : null;
  }

  function resolveSectionGroupFromPoint(clientX, clientY) {
    if (typeof clientX !== "number" || typeof clientY !== "number") {
      return null;
    }
    return resolveSectionGroupFromNode(document.elementFromPoint(clientX, clientY));
  }

  function syncHoveredSectionControlVisibility() {
    var hoveredGroup = resolveSectionGroupFromPoint(state.lastPointerClientX, state.lastPointerClientY);
    setVisibleSectionControls(hoveredGroup);
    return hoveredGroup;
  }

  function bindSectionHoverState(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return;
    }
    if (groupNode === resolveSectionGroupFromPoint(state.lastPointerClientX, state.lastPointerClientY)) {
      setVisibleSectionControls(groupNode);
    }
  }

  function updateSectionControlVisibilityFromEvent(event) {
    if (!(event instanceof MouseEvent)) {
      return;
    }
    state.lastPointerClientX = event.clientX;
    state.lastPointerClientY = event.clientY;
    setVisibleSectionControls(resolveSectionGroupFromNode(event.target));
  }

  function clearSectionControlVisibility() {
    state.lastPointerClientX = null;
    state.lastPointerClientY = null;
    setVisibleSectionControls(null);
  }

  function bindGlobalSectionControlVisibility() {
    if (state.sectionHoverRuntimeBound) {
      return;
    }
    state.sectionHoverRuntimeBound = true;

    document.addEventListener("mousemove", updateSectionControlVisibilityFromEvent, true);
    document.addEventListener(
      "mouseout",
      function (event) {
        if (event && !event.relatedTarget) {
          clearSectionControlVisibility();
        }
      },
      true
    );
    window.addEventListener("blur", clearSectionControlVisibility);
  }

  Object.assign(api, {
    clearVisibleSectionControls: clearVisibleSectionControls,
    setVisibleSectionControls: setVisibleSectionControls,
    resolveSectionGroupFromNode: resolveSectionGroupFromNode,
    resolveSectionGroupFromPoint: resolveSectionGroupFromPoint,
    syncHoveredSectionControlVisibility: syncHoveredSectionControlVisibility,
    bindSectionHoverState: bindSectionHoverState,
    bindGlobalSectionControlVisibility: bindGlobalSectionControlVisibility,
  });
})();
