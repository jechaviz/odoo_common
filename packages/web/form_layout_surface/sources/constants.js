(function (v2) {
  "use strict";
  v2.constants = v2.constants || {};
  var _state = v2.state = v2.state || {};

  v2.COLLAPSIBLE_GROUP_CLASS = "o_lib_collapsible_group";

  v2.COLLAPSED_GROUP_CLASS = "o_lib_section_is_collapsed";

  v2.HEADER_CLASS = "o_lib_section_header";

  v2.BODY_HIDDEN_CLASS = "o_lib_section_body_hidden";

  v2.TOOLBAR_CLASS = "o_lib_section_toolbar";

  v2.TOGGLE_BUTTON_CLASS = "o_lib_section_toggle";

  v2.TOGGLE_ICON_CLASS = "o_lib_section_toggle_icon";

  v2.TOGGLE_LABEL_CLASS = "o_lib_section_toggle_label";

  v2.DRAG_HANDLE_CLASS = "o_lib_section_drag_handle";

  v2.DRAGGING_CLASS = "o_lib_section_dragging";

  v2.DROP_BEFORE_CLASS = "o_lib_section_drop_before";

  v2.DROP_AFTER_CLASS = "o_lib_section_drop_after";

  v2.SECTION_KEY_CLASS_PREFIX = "o_lib_collapsible_key_";

  v2.SECTION_HIDDEN_CLASS = "o_lib_section_hidden";

  v2.SECTION_CONTROLS_VISIBLE_CLASS = "o_lib_section_controls_visible";

  v2.FIELD_HIDDEN_CLASS = "o_lib_field_hidden";

  v2.CHATTER_HOST_SELECTOR =
    ".o-mail-ChatterContainer, .o-mail-Form-chatterContainer, .o_FormRenderer_chatterContainer, .o_ChatterContainer, .o-mail-Form-chatter, .oe_chatter, .o-mail-Chatter";

  v2.CHATTER_SELECTORS = [
    ".o-mail-ChatterContainer",
    ".o-mail-Form-chatterContainer",
    ".o_FormRenderer_chatterContainer",
    ".o_ChatterContainer",
    ".o-mail-Form-chatter",
    ".oe_chatter",
    ".o-mail-Chatter",
  ];

  v2.CHATTER_HIDDEN_CLASS = "o_lib_chatter_hidden";

  v2.FORM_CHATTER_COLLAPSED_CLASS = "o_lib_form_chatter_collapsed";

  v2.BODY_CHATTER_COLLAPSED_CLASS = "o_lib_global_chatter_collapsed";

  v2.CHATTER_PARENT_COLLAPSED_CLASS = "o_lib_chatter_parent_collapsed";

  v2.CHATTER_TOGGLE_ID = "o_lib_global_chatter_toggle";

  v2.CHATTER_TOGGLE_CLASS = "o_lib_chatter_toggle_global";

  v2.CHATTER_TOGGLE_ACTIVE_CLASS = "o_lib_chatter_toggle_is_active";

  v2.CHATTER_TOGGLE_COLLAPSED_CLASS = "o_lib_chatter_toggle_is_collapsed";

  v2.SECTION_SETTINGS_TRIGGER_CLASS = "o_lib_section_settings_trigger";

  v2.SETTINGS_PANEL_ID = "o_lib_form_section_settings_panel";

  v2.SETTINGS_PANEL_OPEN_CLASS = "o_lib_section_settings_open";

  v2.SETTINGS_PANEL_BACKDROP_CLASS = "o_lib_section_settings_backdrop";

  v2.SETTINGS_PANEL_CLOSE_CLASS = "o_lib_section_settings_close";

  v2.SETTINGS_SECTION_ROW_CLASS = "o_lib_settings_section_row";

  v2.SETTINGS_FIELD_ROW_CLASS = "o_lib_settings_field_row";

  v2.LAYOUT_CONTAINER_CLASS = "o_lib_layout_container";

  v2.LAYOUT_ITEM_HIDDEN_CLASS = "o_lib_layout_item_hidden";

  v2.LAYOUT_SETTINGS_TRIGGER_CLASS = "o_lib_layout_settings_trigger";

  v2.STATUSBAR_CONTAINER_CLASS = "o_lib_statusbar_container";

  v2.STATUSBAR_SETTINGS_TRIGGER_CLASS = "o_lib_statusbar_settings_trigger";

  v2.STATUSBAR_FOCUS_PREFIX = "statusbar::";

  v2.SUBTOTAL_CONTAINER_CLASS = "o_lib_subtotal_container";

  v2.SUBTOTAL_CONFIG_TRIGGER_CLASS = "o_lib_subtotal_config_trigger";

  v2.SUBTOTAL_LINES_WRAP_CLASS = "o_lib_subtotal_lines_wrap";

  v2.SUBTOTAL_LINE_ROW_CLASS = "o_lib_subtotal_line_row";

  v2.SUBTOTAL_LINE_LABEL_CLASS = "o_lib_subtotal_line_label";

  v2.SUBTOTAL_LINE_VALUE_CLASS = "o_lib_subtotal_line_value";

  v2.SUBTOTAL_EDIT_MODE_CLASS = "o_lib_subtotal_edit_mode";

  v2.SUBTOTAL_LINE_DRAGGING_CLASS = "o_lib_subtotal_line_dragging";

  v2.SUBTOTAL_LINE_DROP_BEFORE_CLASS = "o_lib_subtotal_line_drop_before";

  v2.SUBTOTAL_LINE_DROP_AFTER_CLASS = "o_lib_subtotal_line_drop_after";

  v2.SUBTOTAL_NATIVE_HIDDEN_CLASS = "o_lib_subtotal_native_hidden";

  v2.SUBTOTAL_EDIT_ACTIONS_CLASS = "o_lib_subtotal_edit_actions";

  v2.SUBTOTAL_ADD_LINE_CLASS = "o_lib_subtotal_add_line";

  v2.SUBTOTAL_INSERT_LINE_CLASS = "o_lib_subtotal_line_insert";

  v2.SUBTOTAL_CONFIG_ACTIVE_CLASS = "o_lib_subtotal_config_is_active";

  v2.SUBTOTAL_RESTORE_TRIGGER_CLASS = "o_lib_subtotal_restore_trigger";

  v2.SUBTOTAL_SAVE_TRIGGER_CLASS = "o_lib_subtotal_save_trigger";

  v2.SUBTOTAL_ERROR_ICON_CLASS = "o_lib_subtotal_error_icon";

  v2.SUBTOTAL_TOGGLE_PROXY_HIDDEN_CLASS = "o_lib_subtotal_toggle_proxy_hidden";

  v2.SUBTOTAL_TOGGLE_MENU_ANCHOR_CLASS = "o_lib_subtotal_toggle_menu_anchor";

  v2.SUBTOTAL_TOGGLE_MENU_TRIGGER_CLASS = "o_lib_subtotal_toggle_menu_trigger";

  v2.SUBTOTAL_TOGGLE_MENU_PANEL_CLASS = "o_lib_subtotal_toggle_menu_panel";

  v2.SUBTOTAL_TOGGLE_MENU_ROW_CLASS = "o_lib_subtotal_toggle_menu_row";

  v2.SUBTOTAL_TOGGLE_MENU_LABEL_CLASS = "o_lib_subtotal_toggle_menu_label";

  v2.SUBTOTAL_TOGGLE_MENU_CHECKBOX_CLASS = "o_lib_subtotal_toggle_menu_checkbox";

  v2.SUBTOTAL_TOGGLE_MENU_OPEN_CLASS = "o_lib_subtotal_toggle_menu_open";

  v2.SETTINGS_ICON_FALLBACK_CLASS = "fa fa-sliders";

  v2.PENCIL_ICON_CLASS = "fa fa-pencil";

  v2.CHECK_ICON_CLASS = "fa fa-check";

  v2.CHATTER_DEFAULT_COLLAPSED = true;

  v2.LOCAL_STORAGE_PREFIX = "odoo.lib.form_section_layout.v2.user_";

  v2.DB_PARAM_PREFIX = "odoo.lib.form_section_layout.v2.user_";

  v2.DB_GLOBAL_PARAM_KEY = "odoo.lib.form_section_layout.v2.global";

  v2.REPORT_SUBTOTAL_DB_PARAM_PREFIX = "odoo.common.form_subtotals_surface.v1.user_";

  v2.REPORT_SUBTOTAL_GLOBAL_DB_PARAM_PREFIX = "odoo.common.form_subtotals_surface.v1.global.";

  v2.ADMIN_GROUP_XMLID = "base.group_system";

  v2.FIELD_DEFINITION_ATTRIBUTES = ["type", "selection", "string", "relation", "readonly"];

  v2.SUBTOTAL_TOGGLE_BY_SOURCE = {};

  v2.SUBTOTAL_TOGGLE_FIELDS = [];

  v2.SUBTOTAL_REFRESH_FIELDS = [
    "amount_untaxed",
    "amount_tax",
    "amount_total",
  ];

  v2.SUBTOTAL_TOGGLE_MENU_ITEMS = [];


})(window.__o_lib_form_section_v2 = window.__o_lib_form_section_v2 || {});
