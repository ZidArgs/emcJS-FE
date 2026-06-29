import AppStateStorageWrapper from "@emcjs/core/data/state/AppStateStorageWrapper.js";
import ObservableStorage from "@emcjs/core/data/storage/observable/ObservableStorage.js";
import jsonParse from "@emcjs/core/patches/JSONParser.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import StatementCompiler from "@emcjs/logic/compiler/StatementCompiler.js";
import LogicStatement from "@emcjs/logic/compiler/statement/LogicStatement.js";

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
        const defaultValue = this.#storage.getBaseValue(elName);
        if (defaultValue != null) {
            if (typeof value === "object") {
                this.#element.setAttribute(this.#valueAttributeName, JSON.stringify(defaultValue));
            } else {
                this.#element.setAttribute(this.#valueAttributeName, defaultValue);
            }
        } else if (this.#element.hasAttribute(this.#valueAttributeName)) {
            const value = this.#element.getAttribute(this.#valueAttributeName);
            try {
                this.#storage.setBaseValue(jsonParse(value));
            } catch {
                this.#storage.setBaseValue(value);
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
