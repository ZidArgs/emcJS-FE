
import jsonParse from "@emcjs/core/patches/JSONParser.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import ObservableStorage from "@emcjs/core/data/storage/observable/ObservableStorage.js";
import AppStateStorageWrapper from "@emcjs/core/data/state/AppStateStorageWrapper.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import StatementCompiler from "@emcjs/logic/compiler/StatementCompiler.js";
import LogicStatement from "@emcjs/logic/compiler/statement/LogicStatement.js";
import AbstractFormElement from "../../../ui/form/element/AbstractFormElement.js";

const CONTEXTS = new WeakMap();
const MUTATION_CONFIG = {
    attributes: true,
    attributeFilter: [
        "name",
        "visible",
        "enabled",
        "editable"
    ]
};

function applyDefaultValue(storage, target) {
    const elName = target.name;
    const defaultValue = storage.getBaseValue(elName);
    if (defaultValue != null) {
        if (typeof defaultValue === "object") {
            target.setAttribute("value", JSON.stringify(defaultValue));
        } else {
            target.setAttribute("value", defaultValue);
        }
    } else if (target.hasAttribute("value")) {
        const value = target.defaultValue;
        storage.setBaseValue(elName, value);
    }
}

const mutationObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type == "attributes") {
            const target = mutation.target;
            const context = CONTEXTS.get(target);
            if (mutation.attributeName === "name") {
                if (context.storage != null) {
                    applyDefaultValue(context.storage, target);
                    const elName = target.name;
                    target.value = context.storage.get(elName);
                }
            } else if (mutation.attributeName === "visible") {
                context.setVisibleLogic(jsonParse(target.getAttribute("visible")));
            } else if (mutation.attributeName === "enabled") {
                context.setEnabledLogic(jsonParse(target.getAttribute("enabled")));
            } else if (mutation.attributeName === "editable") {
                context.setEditableLogic(jsonParse(target.getAttribute("editable")));
            }
        }
    }
});

export default class FormElementContext {

    #element;

    #elementEventManager = new EventTargetManager();

    #storage;

    #storageEventManager = new EventTargetManager();

    #visibleLogic;

    #visibleValue = true;

    #ghostInvisible = false;

    #enabledLogic;

    #enabledValue = true;

    #editableLogic;

    #editableValue = true;

    #hideErrors = null;

    #globalHideErrors = null;

    static getContext(node) {
        return CONTEXTS.get(node) ?? new FormElementContext(node);
    }

    constructor(node) {
        if (CONTEXTS.has(node)) {
            throw new Error("context already exists");
        }
        if (!(node instanceof AbstractFormElement)) {
            throw new TypeError("FormFieldContext can only work on AbstractFormElement");
        }
        this.#element = node;
        CONTEXTS.set(node, this);
        this.#hideErrors = node.hideErrors;
        /* --- */
        mutationObserver.observe(this.#element, MUTATION_CONFIG);
        this.#elementEventManager.switchTarget(this.#element);
        this.#elementEventManager.set("change", () => {
            if (this.#storage != null) {
                this.#storageEventManager.active = false;
                this.#storage.set(this.#element.name, this.#element.value);
                this.#storageEventManager.active = true;
            }
        });
        this.#elementEventManager.set("default", () => {
            if (this.#storage != null) {
                this.#storageEventManager.active = false;
                this.#storage.resetValueChange(this.#element.name);
                this.#storageEventManager.active = true;
            }
        });
        /* --- */
        this.#storageEventManager.set("change", (event) => {
            this.#elementEventManager.active = false;
            if (this.#element.name in event.data) {
                const value = event.data[this.#element.name];
                this.#element.value = value;
            }
            this.refreshFormElementState();
            this.#elementEventManager.active = true;
        });
        this.#storageEventManager.set(["load", "clear"], (event) => {
            this.#elementEventManager.active = false;
            const value = event.data[this.#element.name];
            this.#element.value = value;
            this.refreshFormElementState();
            this.#elementEventManager.active = true;
        });
        /* --- */
        const visibleLogicAttribute = this.#element.getAttribute("visible");
        this.setVisibleLogic(jsonParse(visibleLogicAttribute));
        /* --- */
        const enabledLogicAttribute = this.#element.getAttribute("enabled");
        this.setEnabledLogic(jsonParse(enabledLogicAttribute));
        /* --- */
        const editableLogicAttribute = this.#element.getAttribute("editable");
        this.setEditableLogic(jsonParse(editableLogicAttribute));
    }

    set storage(value) {
        if (value != null && !(value instanceof ObservableStorage) && !(value instanceof AppStateStorageWrapper)) {
            throw new TypeError("ObservableStorage or AppStateStorageWrapper expected");
        }
        if (this.#storage != value) {
            this.#storage = value;
            if (value != null) {
                applyDefaultValue(value, this.#element);
                const elName = this.#element.name;
                this.#element.value = value.get(elName);
            }
            this.#storageEventManager.switchTarget(value);
            this.refreshFormElementState();
        }
    }

    get storage() {
        return this.#storage;
    }

    get node() {
        return this.#element;
    }

    async revalidate() {
        return await this.#element.revalidate();
    }

    addValidator(validator) {
        this.#element.addValidator(validator);
    }

    removeValidator(validator) {
        this.#element.removeValidator(validator);
    }

    set hideErrors(value) {
        if (value != null) {
            value = !!value;
        }
        if (this.#hideErrors !== value) {
            this.#hideErrors = value;
            if (this.#globalHideErrors == null) {
                this.#element.hideErrors = value;
            }
        }
    }

    get hideErrors() {
        return this.#hideErrors;
    }

    set globalHideErrors(value) {
        if (value != null) {
            value = !!value;
        }
        if (this.#globalHideErrors !== value) {
            this.#globalHideErrors = value;
            if (value != null) {
                this.#element.hideErrors = value;
            } else {
                this.#element.hideErrors = this.#hideErrors;
            }
        }
    }

    get globalHideErrors() {
        return this.#globalHideErrors;
    }

    get errors() {
        return this.#element.errors;
    }

    refreshFormElementState() {
        this.#callUpdateVisible();
        this.#callUpdateEnabled();
        this.#callUpdateEditable();
    }

    /* visible logic */
    get visible() {
        return this.#visibleValue;
    }

    set ghostInvisible(value) {
        this.#ghostInvisible = !!value;
    }

    get ghostInvisible() {
        return this.#ghostInvisible;
    }

    setVisibleLogic(logic) {
        if (logic == null) {
            this.#visibleLogic = true;
            this.#setVisibileValue(true);
        } else if (logic instanceof LogicStatement) {
            this.#visibleLogic = logic;
            this.#callUpdateVisible();
        } else if (typeof logic === "object") {
            this.#visibleLogic = StatementCompiler.compile(logic);
            this.#callUpdateVisible();
        } else if (typeof logic === "function") {
            const value = !!logic();
            this.#visibleLogic = logic;
            this.#setVisibileValue(value);
        } else {
            const value = !!logic;
            this.#visibleLogic = logic;
            this.#setVisibileValue(value);
        }
    }

    #callUpdateVisible() {
        if (this.#visibleLogic instanceof LogicStatement) {
            this.#updateVisible();
        }
    }

    #updateVisible = debounce(() => {
        if (this.#visibleLogic instanceof LogicStatement) {
            const value = this.#executeVisibleLogic();
            this.#setVisibileValue(value);
        }
    });

    #executeVisibleLogic() {
        return !!this.#visibleLogic.execute((key) => {
            return this.#getValue(key);
        });
    }

    #setVisibileValue(value) {
        if (this.#visibleValue != value) {
            this.#visibleValue = value;
            if (this.#ghostInvisible) {
                if (value) {
                    this.#element.style.opacity = "";
                } else {
                    this.#element.style.opacity = "0.2";
                }
            } else if (value) {
                this.#element.hidden = false;
            } else {
                this.#element.hidden = true;
            }
            if (this.#element.formField != null) {
                this.#element.formField.checkFormElementsVisible();
            }
        }
    }

    /* enabled logic */
    get enabled() {
        return this.#enabledValue;
    }

    setEnabledLogic(logic) {
        if (logic == null) {
            this.#enabledLogic = true;
            this.#setEnabledValue(true);
        } else if (logic instanceof LogicStatement) {
            this.#enabledLogic = logic;
            this.#callUpdateEnabled();
        } else if (typeof logic === "object") {
            this.#enabledLogic = StatementCompiler.compile(logic);
            this.#callUpdateEnabled();
        } else if (typeof logic === "function") {
            const value = !!logic();
            this.#enabledLogic = logic;
            this.#setEnabledValue(value);
        } else {
            const value = !!logic;
            this.#enabledLogic = logic;
            this.#setEnabledValue(value);
        }
    }

    #callUpdateEnabled() {
        if (this.#enabledLogic instanceof LogicStatement) {
            this.#updateEnabled();
        }
    }

    #updateEnabled = debounce(() => {
        if (this.#enabledLogic instanceof LogicStatement) {
            const value = this.#executeEnabledLogic();
            this.#setEnabledValue(value);
        }
    });

    #executeEnabledLogic() {
        return !!this.#enabledLogic.execute((key) => {
            return this.#getValue(key);
        });
    }

    #setEnabledValue(value) {
        if (this.#enabledValue != value) {
            this.#enabledValue = value;
            if (value) {
                this.#element.disabled = false;
            } else {
                this.#element.disabled = true;
            }
        }
    }

    /* editable logic */
    get editable() {
        return this.#editableValue;
    }

    setEditableLogic(logic) {
        if (logic == null) {
            this.#editableLogic = true;
            this.#setEditableValue(true);
        } else if (logic instanceof LogicStatement) {
            this.#editableLogic = logic;
            this.#callUpdateEditable();
        } else if (typeof logic === "object") {
            this.#editableLogic = StatementCompiler.compile(logic);
            this.#callUpdateEditable();
        } else if (typeof logic === "function") {
            const value = !!logic();
            this.#editableLogic = logic;
            this.#setEditableValue(value);
        } else {
            const value = !!logic;
            this.#editableLogic = logic;
            this.#setEditableValue(value);
        }
    }

    #callUpdateEditable() {
        if (this.#editableLogic instanceof LogicStatement) {
            this.#updateEditable();
        }
    }

    #updateEditable = debounce(() => {
        if (this.#editableLogic instanceof LogicStatement) {
            const value = this.#executeEditableLogic();
            this.#setEditableValue(value);
        }
    });

    #executeEditableLogic() {
        return !!this.#editableLogic.execute((key) => {
            return this.#getValue(key);
        });
    }

    #setEditableValue(value) {
        if (this.#editableValue != value) {
            this.#editableValue = value;
            if (value) {
                this.#element.readOnly = false;
            } else {
                this.#element.readOnly = true;
            }
        }
    }

    /* logic helper */
    #getValue(key) {
        return this.storage?.get(key);
    }

}
