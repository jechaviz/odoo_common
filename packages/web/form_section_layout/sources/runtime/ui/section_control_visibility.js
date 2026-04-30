(function (v2) {
  "use strict";
  v2.ui_builder = v2.ui_builder || {};
  var _state = v2.state = v2.state || {};

  function clearVisibleSectionControls(exceptGroup) {
    document
      .querySelectorAll("." + COLLAPSIBLE_GROUP_CLASS + "." + SECTION_CONTROLS_VISIBLE_CLASS)
      .forEach(function (groupNode) {
        if (groupNode !== exceptGroup) {
          groupNode.classList.remove(SECTION_CONTROLS_VISIBLE_CLASS);
        }
      });
  }

  v2.clearVisibleSectionControls = clearVisibleSectionControls;

  function setVisibleSectionControls(groupNode) {
    var nextGroup = groupNode instanceof HTMLElement ? groupNode : null;
    if (_state.hoveredSectionGroup === nextGroup) {
      if (nextGroup instanceof HTMLElement) {
        nextGroup.classList.add(SECTION_CONTROLS_VISIBLE_CLASS);
      }
      return nextGroup;
    }

    clearVisibleSectionControls(nextGroup);
    _state.hoveredSectionGroup = nextGroup;

    if (nextGroup instanceof HTMLElement) {
      nextGroup.classList.add(SECTION_CONTROLS_VISIBLE_CLASS);
    }

    return nextGroup;
  }

  v2.setVisibleSectionControls = setVisibleSectionControls;

  function resolveSectionGroupFromNode(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    var groupNode = target.closest("." + COLLAPSIBLE_GROUP_CLASS);
    return groupNode instanceof HTMLElement ? groupNode : null;
  }

  v2.resolveSectionGroupFromNode = resolveSectionGroupFromNode;

  function resolveSectionGroupFromPoint(clientX, clientY) {
    if (typeof clientX !== "number" || typeof clientY !== "number") {
      return null;
    }
    return resolveSectionGroupFromNode(document.elementFromPoint(clientX, clientY));
  }

  v2.resolveSectionGroupFromPoint = resolveSectionGroupFromPoint;

  function syncHoveredSectionControlVisibility() {
    var hoveredGroup = resolveSectionGroupFromPoint(_state.lastPointerClientX, _state.lastPointerClientY);
    setVisibleSectionControls(hoveredGroup);
    return hoveredGroup;
  }

  v2.syncHoveredSectionControlVisibility = syncHoveredSectionControlVisibility;

  function bindSectionHoverState(groupNode) {
    if (!(groupNode instanceof HTMLElement)) {
      return;
    }
    if (groupNode === resolveSectionGroupFromPoint(_state.lastPointerClientX, _state.lastPointerClientY)) {
      setVisibleSectionControls(groupNode);
    }
  }

  v2.bindSectionHoverState = bindSectionHoverState;

  function updateSectionControlVisibilityFromEvent(event) {
    if (!(event instanceof MouseEvent)) {
      return;
    }
    _state.lastPointerClientX = event.clientX;
    _state.lastPointerClientY = event.clientY;
    setVisibleSectionControls(resolveSectionGroupFromNode(event.target));
  }

  function clearSectionControlVisibility() {
    _state.lastPointerClientX = null;
    _state.lastPointerClientY = null;
    setVisibleSectionControls(null);
  }

  function bindGlobalSectionControlVisibility() {
    if (_state.sectionHoverRuntimeBound) {
      return;
    }
    _state.sectionHoverRuntimeBound = true;

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

  v2.bindGlobalSectionControlVisibility = bindGlobalSectionControlVisibility;
})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
