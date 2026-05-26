
import jsonParse from "@emcjs/core/patches/JSONParser.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import ObservableStorage from "@emcjs/core/data/storage/observable/ObservableStorage.js";
import AppStateStorageWrapper from "@emcjs/core/data/state/AppStateStorageWrapper.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import StatementCompiler from "@emcjs/logic/compiler/StatementCompiler.js";
import LogicStatement from "@emcjs/logic/compiler/statement/LogicStatement.js";
import Button from "../../../ui/form/button/Button.js";

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

export default class FormButtonContext {

    #element;

    #storage;

    #storageEventManager = new EventTargetManager();

    #visibleLogic;

    #visibleValue = true;

    #ghostInvisible = false;

    #enabledLogic;

    #enabledValue = true;

    static getContext(node) {
        return CONTEXTS.get(node) ?? new FormButtonContext(node);
    }

    constructor(node) {
        if (CONTEXTS.has(node)) {
            throw new Error("context already exists");
        }
        if (!(node instanceof Button)) {
            throw new TypeError("FormButtonContext can only work on Button");
        }
        this.#element = node;
        CONTEXTS.set(node, this);
        /* --- */
        mutationObserver.observe(this.#element, MUTATION_CONFIG);
        /* --- */
        this.#storageEventManager.set(["change", "load", "clear"], () => {
            this.refreshFormElementState();
        });
        /* --- */
        const visibleLogicAttribute = this.#element.getAttribute("visible");
        this.setVisibleLogic(jsonParse(visibleLogicAttribute));
        /* --- */
        const enabledLogicAttribute = this.#element.getAttribute("enabled");
        this.setEnabledLogic(jsonParse(enabledLogicAttribute));
    }

    set storage(value) {
        if (value != null && !(value instanceof ObservableStorage) && !(value instanceof AppStateStorageWrapper)) {
            throw new TypeError("ObservableStorage or AppStateStorageWrapper expected");
        }
        if (this.#storage != value) {
            this.#storage = value;
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

    refreshFormElementState() {
        this.#callUpdateVisible();
        this.#callUpdateEnabled();
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

    /* logic helper */
    #getValue(key) {
        return this.storage?.get(key);
    }

}
