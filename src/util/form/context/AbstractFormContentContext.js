import AppStateStorageWrapper from "emcjs/data/state/AppStateStorageWrapper.js";
import ObservableStorage from "emcjs/data/storage/observable/ObservableStorage.js";
import jsonParse from "emcjs/patches/JSONParser.js";
import {debounce} from "emcjs/util/Debouncer.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import LogicCompiler from "emcjs/util/logic/processor/LogicCompiler.js";

export default class AbstractFormContentContext extends EventTarget {

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

    constructor(node, valueAttributeName) {
        if (new.target === AbstractFormContentContext) {
            throw new Error("can not construct abstract class");
        }
        super();
        this.#element = node;
        this.#valueAttributeName = valueAttributeName;
        /* --- */
        this.#elementEventManager.switchTarget(this.#element);
        // TODO add "addElementEventListener"
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
            this.#callUpdateEditable();
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
                this.applyDefaultValue();
                const elName = this.#element.name;
                this.#element.value = value.get(elName);
            }
            this.#storageEventManager.switchTarget(value);
            this.#callUpdateVisible();
            this.#callUpdateEnabled();
            this.#callUpdateEditable();
        }
    }

    get storage() {
        return this.#storage;
    }

    get node() {
        return this.#element;
    }

    applyDefaultValue() {
        const elName = this.#element.name;
        const defaultValue = this.#storage.getRootValue(elName);
        if (defaultValue != null) {
            if (typeof value === "object") {
                this.#element.setAttribute(this.#valueAttributeName, JSON.stringify(defaultValue));
            } else {
                this.#element.setAttribute(this.#valueAttributeName, defaultValue);
            }
        } else if (this.#element.hasAttribute(this.#valueAttributeName)) {
            const value = this.#element.getAttribute(this.#valueAttributeName);
            try {
                this.#storage.setRootValue(jsonParse(value));
            } catch {
                this.#storage.setRootValue(value);
            }
        }
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
        if (logic != null && typeof logic === "object") {
            this.#visibleLogic = LogicCompiler.compile(logic);
            this.#callUpdateVisible();
        } else {
            const value = logic == null || !!logic;
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
                    this.#element.style.opacity = "0.2";
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
        if (logic != null && typeof logic === "object") {
            this.#enabledLogic = LogicCompiler.compile(logic);
            this.#callUpdateEnabled();
        } else {
            const value = logic == null || !!logic;
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
            const value = this.#executeEnabledLogic();
            this.#setEnabledValue(value);
        }
    });

    #executeEnabledLogic() {
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
        if (logic != null && typeof logic === "object") {
            this.#editableLogic = LogicCompiler.compile(logic);
            this.#callUpdateEditable();
        } else {
            const value = logic == null || !!logic;
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
