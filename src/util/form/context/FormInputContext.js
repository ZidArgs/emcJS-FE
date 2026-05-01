import AppStateStorageWrapper from "emcjs/data/state/AppStateStorageWrapper.js";
import ObservableStorage from "emcjs/data/storage/observable/ObservableStorage.js";
import jsonParse from "emcjs/patches/JSONParser.js";
import {debounce} from "emcjs/util/Debouncer.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import LogicCompiler from "emcjs/util/logic/processor/LogicCompiler.js";

const CONTEXTS = new WeakMap();
const MUTATION_CONFIG = {
    attributes: true,
    attributeFilter: ["visible", "enabled"]
};

const mutationObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type == "attributes") {
            const target = mutation.target;
            const context = CONTEXTS.get(target);
            if (mutation.attributeName === "visible") {
                context.setVisibleLogic(jsonParse(target.getAttribute("visible")));
            } else if (mutation.attributeName === "enabled") {
                context.setEnabledLogic(jsonParse(target.getAttribute("enabled")));
            }
        }
    }
});

export default class FormInputContext {

    #element;

    #valueAttributeName = "value";

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

    #validationMessage = "";

    static getContext(node) {
        return CONTEXTS.get(node) ?? new FormInputContext(node);
    }

    constructor(node) {
        if (CONTEXTS.has(node)) {
            throw new Error("context already exists");
        }
        if (!(node instanceof Node)) {
            throw new TypeError("FormElementContext can only work on Node");
        }
        this.#element = node;
        CONTEXTS.set(node, this);
        if (node.type === "checkbox" || node.type === "radio") {
            this.#valueAttributeName = "checked";
        }
        /* --- */
        mutationObserver.observe(this.#element, MUTATION_CONFIG);
        this.#elementEventManager.switchTarget(this.#element);
        this.#elementEventManager.set("change", () => {
            const isValid = this.#element.checkValidity();
            if (isValid) {
                if (this.#storage != null) {
                    this.#storageEventManager.active = false;
                    this.#storage.set(this.#element.name, this.#element[this.#valueAttributeName]);
                    this.#storageEventManager.active = true;
                }
            }
            const message = this.#element.validationMessage;
            if (this.#validationMessage != message) {
                this.#validationMessage = message;
                const event = new Event("validity", {
                    bubbles: true,
                    cancelable: true
                });
                event.value = this.#element[this.#valueAttributeName];
                event.valid = message === "";
                event.message = message;
                event.name = this.#element.name;
                event.fieldId = this.#element.id;
                this.#element.dispatchEvent(event);
            }
        });
        this.#elementEventManager.set("submit", (event) => {
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
        /* --- */
        this.#storageEventManager.set("change", (event) => {
            this.#elementEventManager.active = false;
            if (this.#element.name in event.data) {
                const value = event.data[this.#element.name] ?? "";
                this.#element[this.#valueAttributeName] = value;
            }
            this.#callUpdateVisible();
            this.#callUpdateEnabled();
            this.#elementEventManager.active = true;
        });
        this.#storageEventManager.set(["load", "clear"], (event) => {
            this.#elementEventManager.active = false;
            const value = event.data[this.#element.name] ?? "";
            if (value != null) {
                if (typeof value === "object") {
                    this.#element.setAttribute(this.#valueAttributeName, JSON.stringify(value));
                } else {
                    this.#element.setAttribute(this.#valueAttributeName, value);
                }
            } else {
                this.#element.removeAttribute(this.#valueAttributeName);
            }
            this.#element[this.#valueAttributeName] = value;
            this.#callUpdateVisible();
            this.#callUpdateEnabled();
            this.#elementEventManager.active = true;
        });
        /* --- */
        const visibleValue = this.#element.getAttribute("visible");
        this.setVisibleLogic(jsonParse(visibleValue));
        /* --- */
        const message = this.#element.validationMessage;
        if (this.#validationMessage != message) {
            this.#validationMessage = message;
            const event = new Event("validity", {
                bubbles: true,
                cancelable: true
            });
            event.value = this.#element[this.#valueAttributeName];
            event.valid = message === "";
            event.message = message;
            event.name = this.#element.name;
            event.fieldId = this.#element.id;
            this.#element.dispatchEvent(event);
        }
    }

    set storage(value) {
        if (value != null && !(value instanceof ObservableStorage) && !(value instanceof AppStateStorageWrapper)) {
            throw new TypeError("ObservableStorage or AppStateStorageWrapper expected");
        }
        if (this.#storage != value) {
            this.#storage = value;
            this.#storageEventManager.switchTarget(value);
            this.#callUpdateVisible();
            this.#callUpdateEnabled();
        }
    }

    get storage() {
        return this.#storage;
    }

    get node() {
        return this.#element;
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
        } else if (typeof logic === "object") {
            this.#visibleLogic = LogicCompiler.compile(logic);
            this.#callUpdateVisible();
        } else if (typeof logic === "function") {
            this.#visibleLogic = logic;
            this.#callUpdateVisible();
        } else {
            const value = !!logic;
            this.#visibleLogic = logic;
            this.#setVisibileValue(value);
        }
    }

    #callUpdateVisible() {
        if (typeof this.#visibleLogic === "function") {
            this.#updateVisible();
        }
    }

    #updateVisible = debounce(() => {
        if (typeof this.#visibleLogic === "function") {
            const value = this.#executeVisibleLogic();
            this.#setVisibileValue(value);
        }
    });

    #executeVisibleLogic() {
        return !!this.#visibleLogic((key) => {
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
                    this.#element.style.opacity = "0.5";
                }
            } else if (value) {
                this.#element.style.display = "";
            } else {
                this.#element.style.display = "none";
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
        } else if (typeof logic === "object") {
            this.#enabledLogic = LogicCompiler.compile(logic);
            this.#callUpdateEnabled();
        } else if (typeof logic === "function") {
            this.#enabledLogic = logic;
            this.#callUpdateEnabled();
        } else {
            const value = !!logic;
            this.#enabledLogic = logic;
            this.#setEnabledValue(value);
        }
    }

    #callUpdateEnabled() {
        if (typeof this.#enabledLogic === "function") {
            this.#updateEnabled();
        }
    }

    #updateEnabled = debounce(() => {
        if (typeof this.#enabledLogic === "function") {
            const value = this.#executeEnabledeLogic();
            this.#setEnabledValue(value);
        }
    });

    #executeEnabledeLogic() {
        return !!this.#enabledLogic((key) => {
            return this.#getValue(key);
        });
    }

    #setEnabledValue(value) {
        if (this.#enabledValue != value) {
            this.#enabledValue = value;
            if (value) {
                this.#element.removeAttribute("disabled");
            } else {
                this.#element.setAttribute("disabled", "");
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
        } else if (typeof logic === "object") {
            this.#editableLogic = LogicCompiler.compile(logic);
            this.#callUpdateEditable();
        } else if (typeof logic === "function") {
            this.#editableLogic = logic;
            this.#callUpdateEditable();
        } else {
            const value = !!logic;
            this.#editableLogic = logic;
            this.#setEditableValue(value);
        }
    }

    #callUpdateEditable() {
        if (typeof this.#editableLogic === "function") {
            this.#updateEditable();
        }
    }

    #updateEditable = debounce(() => {
        if (typeof this.#editableLogic === "function") {
            const value = this.#executeEditableLogic();
            this.#setEditableValue(value);
        }
    });

    #executeEditableLogic() {
        return !!this.#editableLogic((key) => {
            return this.#getValue(key);
        });
    }

    #setEditableValue(value) {
        if (this.#editableValue != value) {
            this.#editableValue = value;
            if (value) {
                this.#element.removeAttribute("readonly");
            } else {
                this.#element.setAttribute("readonly", "");
            }
        }
    }

    /* logic helper */
    #getValue(key) {
        return this.storage?.get(key);
    }

}
