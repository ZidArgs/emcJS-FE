import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import {resolveKey} from "@emcjs/core/util/keyboard/KeyConverter.js";
import {toStartUppercaseEndLowercase} from "@emcjs/core/util/helper/string/ConvertCase.js";
import CustomElement from "../../../../../element/CustomElement.js";
import "../../../../../keyboard/KeyCap.js";
import TPL from "./KeyBindEditPanel.js.html" assert {type: "html"};
import STYLE from "./KeyBindEditPanel.js.css" assert {type: "css"};

const BLACKLIST = [
    "Tab",
    "AltGraph",
    "CapsLock",
    "NumLock",
    "Fn",
    "FnLock",
    "Hyper",
    "ScrollLock",
    "Super",
    "Symbol",
    "SymbolLock"
];

const CONTROL_KEYS = [
    "Control",
    "Shift",
    "Alt",
    "Meta"
];

let activePanel = null;

export default class KeyBindEditPanel extends CustomElement {

    #focusTopEl;

    #focusBottomEl;

    #titleEl;

    #modalEl;

    #inputEventTargetManager;

    #value = {
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        key: null
    };

    #keyDisplayEl;

    #ctrlKeyEl;

    #shiftKeyEl;

    #altKeyEl;

    #metaKeyEl;

    #customKeyEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#ctrlKeyEl = document.createElement("emc-keycap");
        this.#ctrlKeyEl.innerText = "Ctrl";
        this.#shiftKeyEl = document.createElement("emc-keycap");
        this.#shiftKeyEl.innerText = "Shift";
        this.#altKeyEl = document.createElement("emc-keycap");
        this.#altKeyEl.innerText = "Alt";
        this.#metaKeyEl = document.createElement("emc-keycap");
        this.#metaKeyEl.innerText = "Meta";
        this.#customKeyEl = document.createElement("emc-keycap");
        this.#customKeyEl.innerText = "";
        /* --- */
        this.#modalEl = this.shadowRoot.getElementById("modal");
        this.#titleEl = this.shadowRoot.getElementById("title");
        this.#keyDisplayEl = this.shadowRoot.getElementById("key-display");
        this.#inputEventTargetManager = new EventTargetManager(window, false);
        this.#inputEventTargetManager.set("keydown", (event) => {
            const {
                key, code, ctrlKey, shiftKey, altKey, metaKey
            } = event;
            if (key != null && !BLACKLIST.includes(key)) {
                if (key === "Escape") {
                    this.close();
                } else if (CONTROL_KEYS.includes(key)) {
                    this.renderValue({
                        ctrlKey,
                        shiftKey,
                        altKey,
                        metaKey,
                        key: null
                    });
                } else {
                    this.#value.ctrlKey = ctrlKey;
                    this.#value.shiftKey = shiftKey;
                    this.#value.altKey = altKey;
                    this.#value.metaKey = metaKey;
                    this.#value.key = resolveKey(code);
                    this.#internalSubmit();
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        this.#inputEventTargetManager.set("keyup", (event) => {
            if (this.#value.key == null) {
                const {
                    ctrlKey, shiftKey, altKey, metaKey
                } = event;
                this.renderValue({
                    ctrlKey,
                    shiftKey,
                    altKey,
                    metaKey,
                    key: null
                });
            }
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        /* --- */
        this.addEventListener("click", () => {
            this.initialFocus();
        });
        this.#focusTopEl = this.shadowRoot.getElementById("focus_catcher_top");
        this.#focusTopEl.addEventListener("focus", () => {
            this.initialFocus();
        });
        this.#focusBottomEl = this.shadowRoot.getElementById("focus_catcher_bottom");
        this.#focusBottomEl.addEventListener("focus", () => {
            this.initialFocus();
        });
    }

    connectedCallback() {
        this.#inputEventTargetManager.active = true;
    }

    disconnectedCallback() {
        this.#inputEventTargetManager.active = false;
    }

    initialFocus() {
        this.#modalEl.focus();
    }

    remove() {
        super.remove();
        this.#value = {
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            key: null
        };
        this.#keyDisplayEl.innerHTML = "";
        activePanel = null;
    }

    show() {
        document.body.append(this);
        if (activePanel != null) {
            activePanel.close();
        }
        this.initialFocus();
        activePanel = this;
    }

    close() {
        this.remove();
        this.dispatchEvent(new Event("close"));
    }

    #internalSubmit() {
        const value = {...this.#value};
        this.remove();
        const ev = new Event("submit");
        ev.value = value;
        this.dispatchEvent(ev);
    }

    renderValue(value) {
        value = value ?? {
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            key: null
        };

        this.#keyDisplayEl.innerHTML = "";
        const {
            ctrlKey, shiftKey, altKey, metaKey, key
        } = value;
        if (ctrlKey) {
            this.#keyDisplayEl.append(this.#ctrlKeyEl);
        }
        if (shiftKey) {
            this.#keyDisplayEl.append(this.#shiftKeyEl);
        }
        if (altKey) {
            this.#keyDisplayEl.append(this.#altKeyEl);
        }
        if (metaKey) {
            this.#keyDisplayEl.append(this.#metaKeyEl);
        }
        if (key != null) {
            const keyText = key === " " ? "Space" : toStartUppercaseEndLowercase(key);
            this.#customKeyEl.innerText = keyText;
            this.#keyDisplayEl.append(this.#customKeyEl);
        }
    }

    set caption(value) {
        this.setAttribute("caption", value);
    }

    get caption() {
        return this.getAttribute("caption");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "caption"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "caption": {
                if (oldValue != newValue) {
                    this.#titleEl.i18nValue = newValue;
                }
            } break;
        }
    }

}

customElements.define("emc-input-keybind-edit-panel", KeyBindEditPanel);
