import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/I18nTooltip.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./ColorInput.js.html" assert {type: "html"};
import STYLE from "./ColorInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ColorInput.js.json" assert {type: "json"};

const REGEX_HEX = /^#[0-9a-f]{6}$/;

export default class ColorInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    #inputEl;

    #buttonEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.value = this.#inputEl.value;
        });
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.addEventListener("input", () => {
            this.#inputEl.value = this.#buttonEl.value;
        });
        this.#buttonEl.addEventListener("change", () => {
            this.value = this.#buttonEl.value;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        this.#buttonEl.addEventListener("click", () => {
            if (this.value !== this.#buttonEl.value) {
                this.value = this.#buttonEl.value;
                this.dispatchEvent(new Event("input", {
                    bubbles: true,
                    cancelable: true
                }));
            }
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#buttonEl.disabled = disabled;
    }

    validityCallback(message) {
        this.#inputEl.setCustomValidity(message);
    }

    focus(options) {
        super.focus(options);
        this.#buttonEl.focus(options);
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "placeholder",
            "readonly"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#inputEl.i18nPlaceholder = this.placeholder || "Search...";
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                    setBooleanAttribute(this.#buttonEl, name, this.readOnly);
                }
            } break;
        }
    }

    checkValid() {
        const value = this.value;
        if (value != null && value !== "" && !REGEX_HEX.test(value)) {
            return "Please enter a valid hexadecimal color (#000000 - #FFFFFF)";
        }
        return super.checkValid();
    }

    renderValue(value) {
        this.#inputEl.value = value ?? "";
        if (REGEX_HEX.test(value)) {
            this.#buttonEl.value = value;
        } else {
            this.#buttonEl.value = "";
        }
    }

}

FormElementRegistry.register("ColorInput", ColorInput);
customElements.define("emc-input-color", ColorInput);
registerFocusable("emc-input-color");
