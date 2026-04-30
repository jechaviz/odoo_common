(function () {
    "use strict";

    const rootOdoo = window.odoo;
    if (!rootOdoo || typeof rootOdoo.define !== "function") {
        console.warn("[many2x_parent_form_autosave] Odoo module loader is not available.");
        return;
    }
    if (rootOdoo.__rpMany2XParentFormAutosaveDefined) {
        return;
    }
    rootOdoo.__rpMany2XParentFormAutosaveDefined = true;
    rootOdoo.__rpMany2XParentFormAutosaveDebug = rootOdoo.__rpMany2XParentFormAutosaveDebug || { events: [] };

    rootOdoo.define("rp.many2x_parent_form_autosave", [
        "@web/core/utils/patch",
        "@web/views/fields/relational_utils",
    ], function (require) {
        const { patch } = require("@web/core/utils/patch");
        const { Many2XAutocomplete } = require("@web/views/fields/relational_utils");

        const pendingCommits = new WeakMap();
        const debugState = rootOdoo.__rpMany2XParentFormAutosaveDebug;

        function pushDebug(eventName, payload) {
            try {
                debugState.last = { event: eventName, payload: payload || null, at: Date.now() };
                debugState.events.push(debugState.last);
                if (debugState.events.length > 40) {
                    debugState.events.shift();
                }
            } catch (_debugErr) {
                // Ignore debug serialization issues.
            }
        }

        function normalizeText(value) {
            return String(value == null ? "" : value).trim();
        }

        function resolveRootNode(component) {
            const candidates = [
                component && component.autoCompleteContainer && component.autoCompleteContainer.el,
                component && component.root && component.root.el,
            ];
            for (const node of candidates) {
                if (node instanceof HTMLElement) {
                    return node;
                }
            }
            return null;
        }

        function isVisible(node) {
            if (!(node instanceof HTMLElement)) {
                return false;
            }
            const style = window.getComputedStyle(node);
            if (!style || style.display === "none" || style.visibility === "hidden") {
                return false;
            }
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }

        function resolveOwLNode(component) {
            if (!component || !component.__owl__ || typeof component.__owl__ !== "object") {
                return null;
            }
            return component.__owl__;
        }

        function findParentFormNode(component) {
            const rootNode = resolveRootNode(component);
            if (!(rootNode instanceof HTMLElement)) {
                return null;
            }
            const formNode = rootNode.closest(".o_form_view");
            if (!(formNode instanceof HTMLElement)) {
                return null;
            }
            if (formNode.closest(".modal")) {
                return null;
            }
            return formNode;
        }

        function findVisibleSaveButton(formNode) {
            if (!(formNode instanceof HTMLElement)) {
                return null;
            }
            const documentRoot = formNode.ownerDocument || document;
            const buttons = documentRoot.querySelectorAll(".o_form_button_save");
            for (const button of buttons) {
                if (!(button instanceof HTMLElement)) {
                    continue;
                }
                if (button.closest(".modal")) {
                    continue;
                }
                if (!isVisible(button)) {
                    continue;
                }
                if (button instanceof HTMLButtonElement && button.disabled) {
                    continue;
                }
                return button;
            }
            return null;
        }

        function resolveInlineEditorContext(component) {
            const rootNode = resolveRootNode(component);
            if (!(rootNode instanceof HTMLElement)) {
                return null;
            }
            const formNode = findParentFormNode(component);
            const x2manyNode = rootNode.closest(".o_field_x2many");
            if (!(x2manyNode instanceof HTMLElement)) {
                return null;
            }
            let owlNode = resolveOwLNode(component);
            let record = null;
            let list = null;
            let formController = null;
            for (let depth = 0; owlNode && depth < 12; depth += 1) {
                const owner = owlNode.component;
                if (!record && owner && owner.props && owner.props.record) {
                    record = owner.props.record;
                }
                if (!list && owner && owner.list && typeof owner.list.leaveEditMode === "function") {
                    list = owner.list;
                }
                if (
                    !formController &&
                    owner &&
                    (
                        typeof owner.saveButtonClicked === "function" ||
                        typeof owner.save === "function" ||
                        (owner.model && owner.model.root && typeof owner.model.root.save === "function")
                    )
                ) {
                    formController = owner;
                }
                owlNode = owlNode.parent || null;
            }
            if (!record || !list) {
                pushDebug("resolve_context_missing", {
                    hasRecord: Boolean(record),
                    hasList: Boolean(list),
                });
                return false;
            }
            pushDebug("resolve_context_ok", {
                fieldName: record && record._config ? record._config.fieldName || null : null,
                hasFormNode: Boolean(formNode),
                hasFormController: Boolean(formController),
            });
            return { formNode, formController, list, record, rootNode, x2manyNode };
        }

        async function commitInlineEditor(context) {
            if (!context || !context.list) {
                return false;
            }
            const list = context.list;
            const record = context.record;
            if (record && record._updatePromise && typeof record._updatePromise.then === "function") {
                try {
                    await record._updatePromise;
                } catch (_updateErr) {
                    // Ignore transient onchange errors here and let Odoo surface them.
                }
            }
            pushDebug("commit_inline_start", {
                dirty: Boolean(record && record.dirty),
                virtualId: record && record._virtualId ? String(record._virtualId) : null,
            });
            if (typeof list.leaveEditMode === "function") {
                try {
                    const left = await list.leaveEditMode({ validate: true, canAbandon: false });
                    pushDebug("leave_edit_mode_result", { left: left });
                    if (left === false) {
                        return false;
                    }
                } catch (_leaveErr) {
                    pushDebug("leave_edit_mode_error", { message: String(_leaveErr && _leaveErr.message || _leaveErr) });
                    return false;
                }
            }
            if (record && typeof list.validateExtendedRecord === "function") {
                try {
                    await list.validateExtendedRecord(record);
                    pushDebug("validate_extended_record_ok", null);
                    return true;
                } catch (_validateErr) {
                    pushDebug("validate_extended_record_error", { message: String(_validateErr && _validateErr.message || _validateErr) });
                    return false;
                }
            }
            return false;
        }

        async function persistParentForm(context) {
            if (!context) {
                return false;
            }
            const formController = context.formController;
            if (formController && typeof formController.saveButtonClicked === "function") {
                try {
                    const saved = await formController.saveButtonClicked({});
                    pushDebug("persist_parent_controller_save_button_clicked", { saved: saved !== false });
                    if (saved !== false) {
                        return true;
                    }
                } catch (_controllerSaveErr) {
                    pushDebug("persist_parent_controller_save_button_clicked_error", {
                        message: String(_controllerSaveErr && _controllerSaveErr.message || _controllerSaveErr),
                    });
                }
            }
            if (formController && typeof formController.save === "function") {
                try {
                    const saved = await formController.save({});
                    pushDebug("persist_parent_controller_save", { saved: saved !== false });
                    if (saved !== false) {
                        return true;
                    }
                } catch (_controllerDirectSaveErr) {
                    pushDebug("persist_parent_controller_save_error", {
                        message: String(_controllerDirectSaveErr && _controllerDirectSaveErr.message || _controllerDirectSaveErr),
                    });
                }
            }
            if (
                formController &&
                formController.model &&
                formController.model.root &&
                typeof formController.model.root.save === "function"
            ) {
                try {
                    const saved = await formController.model.root.save({});
                    pushDebug("persist_parent_root_save", { saved: saved !== false });
                    if (saved !== false) {
                        return true;
                    }
                } catch (_rootSaveErr) {
                    pushDebug("persist_parent_root_save_error", {
                        message: String(_rootSaveErr && _rootSaveErr.message || _rootSaveErr),
                    });
                }
            }
            if (!(context.formNode instanceof HTMLElement)) {
                return false;
            }
            const saveButton = findVisibleSaveButton(context.formNode);
            if (!(saveButton instanceof HTMLElement)) {
                pushDebug("persist_parent_missing_button", null);
                return false;
            }
            try {
                saveButton.focus();
            } catch (_focusErr) {
                // Ignore focus errors on detached nodes.
            }
            saveButton.click();
            pushDebug("persist_parent_click", { text: normalizeText(saveButton.textContent || "") });
            return true;
        }

        function queueInlineCommit(component) {
            const context = resolveInlineEditorContext(component);
            if (!context || !(context.rootNode instanceof HTMLElement) || !(context.x2manyNode instanceof HTMLElement)) {
                return Promise.resolve(false);
            }
            const existingPromise = pendingCommits.get(context.list);
            if (existingPromise) {
                pushDebug("queue_existing_promise", null);
                return existingPromise;
            }
            pushDebug("queue_commit", null);
            const promise = Promise.resolve()
              .then(function () {
                if (!document.body.contains(context.rootNode) || !document.body.contains(context.x2manyNode)) {
                    pushDebug("queue_commit_detached", null);
                    return false;
                }
                return commitInlineEditor(context).then(async function (committed) {
                    pushDebug("queue_commit_committed", { committed: committed });
                    if (!committed) {
                        return false;
                    }
                    return await persistParentForm(context);
                });
              })
              .finally(function () {
                if (pendingCommits.get(context.list) === promise) {
                    pendingCommits.delete(context.list);
                }
              });
            pendingCommits.set(context.list, promise);
            return promise;
        }

        patch(Many2XAutocomplete.prototype, {
            buildRecordSuggestion(request, record) {
                const suggestion = super.buildRecordSuggestion(...arguments);
                if (!suggestion || typeof suggestion.onSelect !== "function") {
                    return suggestion;
                }
                const originalOnSelect = suggestion.onSelect;
                const component = this;
                suggestion.onSelect = async function () {
                    const result = await originalOnSelect();
                    await queueInlineCommit(component);
                    return result;
                };
                return suggestion;
            },
        });
    });
})();
