import {deepClone} from "emcjs/util/helper/DeepClone.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import KeySequence from "emcjs/util/keyboard/KeySequence.js";
import {I18nValueObserver} from "emcjs/util/observer/i18n/I18nValueObserver.js";
import {toStartUppercaseEndLowercase} from "emcjs/util/helper/string/ConvertCase.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {
    setBooleanAttribute, setStringAttribute
} from "../../../../../util/node/NodeAttributes.js";
import KeyBindEditPanel from "./components/KeyBindEditPanel.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./KeyBindInput.js.html" assert {type: "html"};
import STYLE from "./KeyBindInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./KeyBindInput.js.json" assert {type: "json"};

export default class KeyBindInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return [...super.formConfigurationFields, ...deepClone(CONFIG_FIELDS)];
    }

    #value = {
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        key: null
    };

    #inputEl;

    #buttonEl;

    #ctrlKeyEl;

    #shiftKeyEl;

    #altKeyEl;

    #metaKeyEl;

    #customKeyEl;

    #languageEventTargetManager = new EventTargetManager();

    #keyBindEditPanel = new KeyBindEditPanel();

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
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
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("click", () => {
            this.#keyBindEditPanel.show();
        });
        this.#inputEl.addEventListener("keydown", (event) => {
            const {
                key, shiftKey
            } = event;
            if ((key === "Enter" && !shiftKey) || key === " ") {
                this.#keyBindEditPanel.show();
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (key === "Escape") {
                this.#value.ctrlKey = false;
                this.#value.shiftKey = false;
                this.#value.altKey = false;
                this.#value.metaKey = false;
                this.#value.key = null;
                this.renderValue(this.#value);
                this.value = KeySequence.stringify(this.#value);
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        this.#inputEl.addEventListener("blur", () => {
            if (this.#value?.key == null) {
                this.#value = {
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    key: null
                };
                this.renderValue(this.#value);
                this.value = KeySequence.stringify(this.#value);
            }
        });
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.addEventListener("click", () => {
            this.value = "";
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        this.#keyBindEditPanel.addEventListener("submit", (event) => {
            const {
                ctrlKey, shiftKey, altKey, metaKey, key
            } = event.value;
            this.#value.ctrlKey = ctrlKey;
            this.#value.shiftKey = shiftKey;
            this.#value.altKey = altKey;
            this.#value.metaKey = metaKey;
            this.#value.key = key;
            this.renderValue(this.#value);
            this.value = KeySequence.stringify(this.#value);
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
            this.#inputEl.focus();
        });
        /* --- */
        this.#languageEventTargetManager.set("change", (event) => {
            setStringAttribute(this.#inputEl, "placeholder", event.value);
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#buttonEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#inputEl.focus(options);
    }

    set rawValue(value) {
        this.#value.ctrlKey = value.ctrlKey;
        this.#value.shiftKey = value.shiftKey;
        this.#value.altKey = value.altKey;
        this.#value.metaKey = value.metaKey;
        this.#value.key = value.key;
        this.value = KeySequence.stringify(this.#value);
    }

    get rawValue() {
        return {...this.#value};
    }

    getSubmitValue() {
        const value = this.value;
        if (value == null) {
            return "";
        }
        return value;
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    set caption(value) {
        this.setStringAttribute("caption", value);
    }

    get caption() {
        return this.getStringAttribute("caption");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "readonly",
            "placeholder",
            "caption"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "placeholder": {
                if (oldValue != newValue) {
                    const i18nValueObserver = new I18nValueObserver(newValue);
                    this.#languageEventTargetManager.switchTarget(i18nValueObserver);
                    setStringAttribute(this.#inputEl, "placeholder", i18nValueObserver.value);
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                    setBooleanAttribute(this.#buttonEl, name, this.readOnly);
                }
            } break;
            case "caption": {
                if (oldValue != newValue) {
                    this.#keyBindEditPanel.caption = newValue;
                }
            } break;
        }
    }

    renderValue(value) {
        value = value ?? {
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            key: null
        };
        if (typeof value === "string") {
            value = KeySequence.parse(value);
        }
        this.#value = value;

        this.#inputEl.innerHTML = "";
        const {
            ctrlKey, shiftKey, altKey, metaKey, key
        } = value;
        if (ctrlKey) {
            this.#inputEl.append(this.#ctrlKeyEl);
        }
        if (shiftKey) {
            this.#inputEl.append(this.#shiftKeyEl);
        }
        if (altKey) {
            this.#inputEl.append(this.#altKeyEl);
        }
        if (metaKey) {
            this.#inputEl.append(this.#metaKeyEl);
        }
        if (key != null) {
            const keyText = key === " " ? "Space" : toStartUppercaseEndLowercase(key);
            this.#customKeyEl.innerText = keyText;
            this.#inputEl.append(this.#customKeyEl);
        }
    }

    checkValid() {
        const value = this.#value;
        if (value != null) {
            const {
                ctrlKey, shiftKey, altKey, metaKey, key
            } = value;
            if ((ctrlKey || shiftKey || altKey || metaKey) && key == null) {
                return "The input is missing a destinctive key";
            }
        }
        return super.checkValid();
    }

}

FormElementRegistry.register("KeyBindInput", KeyBindInput);
customElements.define("emc-input-keybind", KeyBindInput);
registerFocusable("emc-input-keybind");
