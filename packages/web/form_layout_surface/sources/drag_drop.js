(function (v2) {
  "use strict";
  v2.drag_drop = v2.drag_drop || {};
  var _state = v2.state = v2.state || {};
  var FORM_ROOT_SELECTOR = v2.FORM_ROOT_SELECTOR || "[data-lib-scope-key]";
  var COLLAPSIBLE_GROUP_CLASS = v2.COLLAPSIBLE_GROUP_CLASS || "o_lib_collapsible_group";
  var DRAG_HANDLE_CLASS = v2.DRAG_HANDLE_CLASS || "o_lib_section_drag_handle";
  var DRAGGING_CLASS = v2.DRAGGING_CLASS || "o_lib_section_dragging";
  var DROP_BEFORE_CLASS = v2.DROP_BEFORE_CLASS || "o_lib_section_drop_before";
  var DROP_AFTER_CLASS = v2.DROP_AFTER_CLASS || "o_lib_section_drop_after";
  var SUBTOTAL_LINE_ROW_CLASS = v2.SUBTOTAL_LINE_ROW_CLASS || "o_lib_subtotal_line_row";
  var SUBTOTAL_LINE_DROP_BEFORE_CLASS = v2.SUBTOTAL_LINE_DROP_BEFORE_CLASS || "o_lib_subtotal_line_drop_before";
  var SUBTOTAL_LINE_DROP_AFTER_CLASS = v2.SUBTOTAL_LINE_DROP_AFTER_CLASS || "o_lib_subtotal_line_drop_after";
  var findSectionHeader = v2.findSectionHeader || function () { return null; };
  var computeScopeKey = v2.computeScopeKey || function () { return "unknown_model|unknown_view"; };
  var storeCurrentOrderForForm = v2.storeCurrentOrderForForm || function () {};
  var queueStatePersist = v2.queueStatePersist || function () { return Promise.resolve(null); };
  var processFormNode = v2.processFormNode || function () {};

  function clearSubtotalDropMarkers(containerNode) {
    if (!(containerNode instanceof HTMLElement)) {
      return;
    }
    containerNode
      .querySelectorAll("." + SUBTOTAL_LINE_ROW_CLASS + "." + SUBTOTAL_LINE_DROP_BEFORE_CLASS + ", ." + SUBTOTAL_LINE_ROW_CLASS + "." + SUBTOTAL_LINE_DROP_AFTER_CLASS)
      .forEach(function (node) {
        node.classList.remove(SUBTOTAL_LINE_DROP_BEFORE_CLASS, SUBTOTAL_LINE_DROP_AFTER_CLASS);
      });
  }


  v2.clearSubtotalDropMarkers = clearSubtotalDropMarkers;

  function paintDropMarker(group, before) {
    document
      .querySelectorAll("." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_BEFORE_CLASS + ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_AFTER_CLASS)
      .forEach(function (node) {
        node.classList.remove(DROP_BEFORE_CLASS, DROP_AFTER_CLASS);
      });

    group.classList.add(before ? DROP_BEFORE_CLASS : DROP_AFTER_CLASS);
  }


  v2.paintDropMarker = paintDropMarker;

  function resetDragState() {
    _state.dragSourceGroup = null;
    _state.dragTargetGroup = null;
    _state.dragDropBefore = true;

    document
      .querySelectorAll(
        "." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_BEFORE_CLASS +
        ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DROP_AFTER_CLASS +
        ", ." + COLLAPSIBLE_GROUP_CLASS + "." + DRAGGING_CLASS
      )
      .forEach(function (node) {
        node.classList.remove(DROP_BEFORE_CLASS, DROP_AFTER_CLASS, DRAGGING_CLASS);
      });

    if (typeof syncHoveredSectionControlVisibility === "function") {
      syncHoveredSectionControlVisibility();
    }
  }


  v2.resetDragState = resetDragState;

  function onDragStart(event) {
    var handle = event.target instanceof Element ? event.target.closest("." + DRAG_HANDLE_CLASS) : null;
    if (!(handle instanceof HTMLElement)) {
      return;
    }

    var group = handle.closest("." + COLLAPSIBLE_GROUP_CLASS);
    if (!(group instanceof HTMLElement)) {
      return;
    }

    var sectionKey = typeof v2.readSectionKey === "function"
      ? v2.readSectionKey(group)
      : String(group.dataset.libSectionKey || "").trim();
    if (!sectionKey) {
      return;
    }

    _state.dragSourceGroup = group;
    _state.dragTargetGroup = null;
    _state.dragDropBefore = true;

    group.classList.add(DRAGGING_CLASS);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", sectionKey);
    }
  }


  v2.onDragStart = onDragStart;

  function onDragOver(event) {
    if (!(_state.dragSourceGroup instanceof HTMLElement)) {
      return;
    }

    var targetGroup = event.target instanceof Element ? event.target.closest("." + COLLAPSIBLE_GROUP_CLASS) : null;
    if (!(targetGroup instanceof HTMLElement) || targetGroup === _state.dragSourceGroup) {
      return;
    }

    if (targetGroup.parentElement !== _state.dragSourceGroup.parentElement) {
      return;
    }

    event.preventDefault();

    var targetHeader = findSectionHeader(targetGroup) || targetGroup;
    var rect = targetHeader.getBoundingClientRect();
    _state.dragDropBefore = event.clientY <= rect.top + rect.height / 2;
    _state.dragTargetGroup = targetGroup;

    paintDropMarker(targetGroup, _state.dragDropBefore);
  }


  v2.onDragOver = onDragOver;

  function onDrop(event) {
    if (!(_state.dragSourceGroup instanceof HTMLElement) || !(_state.dragTargetGroup instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    event.preventDefault();

    if (_state.dragSourceGroup.parentElement !== _state.dragTargetGroup.parentElement) {
      resetDragState();
      return;
    }

    var parent = _state.dragSourceGroup.parentElement;
    if (!(parent instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    var formNode = _state.dragSourceGroup.closest(FORM_ROOT_SELECTOR);
    if (!(formNode instanceof HTMLElement)) {
      resetDragState();
      return;
    }

    var referenceNode = _state.dragDropBefore ? _state.dragTargetGroup : _state.dragTargetGroup.nextSibling;
    parent.insertBefore(_state.dragSourceGroup, referenceNode);

    var scopeKey = computeScopeKey(formNode);
    storeCurrentOrderForForm(formNode, scopeKey);
    queueStatePersist();
    processFormNode(formNode);
    resetDragState();
  }


  v2.onDrop = onDrop;

  function onDragEnd() {
    resetDragState();
  }


  v2.onDragEnd = onDragEnd;

})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
