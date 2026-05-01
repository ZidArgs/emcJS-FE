import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {
    setBooleanAttribute, setNumberAttribute
} from "../../../../../util/node/NodeAttributes.js";
import LongClickHandler from "../../../../../util/LongClickHandler.js";
import "../../../../i18n/I18nTooltip.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./NumberInput.js.html" assert {type: "html"};
import STYLE from "./NumberInput.js.css" assert {type: "css"};
import FONT_STYLE from "../../../../../_style/emcjs-icons-codes.css" assert {type: "css"};
import CONFIG_FIELDS from "./NumberInput.js.json" assert {type: "json"};

export default class NumberInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    #inputEl;

    #upButtonEl;

    #downButtonEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        FONT_STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.value = this.#inputEl.value;
        });
        /* --- */
        this.#upButtonEl = this.shadowRoot.getElementById("upButton");
        new LongClickHandler(this.#upButtonEl);
        this.#upButtonEl.addEventListener("mousepressed", (event) => {
            this.#increaseValue();
            event.stopPropagation();
        });
        this.#upButtonEl.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                this.#increaseValue();
            }
            event.stopPropagation();
        });
        this.#upButtonEl.addEventListener("touchstart", (event) => {
            this.#increaseValue();
            event.stopPropagation();
        }, {passive: true});
        /* --- */
        this.#downButtonEl = this.shadowRoot.getElementById("downButton");
        new LongClickHandler(this.#downButtonEl);
        this.#downButtonEl.addEventListener("mousepressed", (event) => {
            this.#decreaseValue();
            event.stopPropagation();
        });
        this.#downButtonEl.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                this.#decreaseValue();
            }
            event.stopPropagation();
        });
        this.#downButtonEl.addEventListener("touchstart", (event) => {
            this.#decreaseValue();
            event.stopPropagation();
        }, {passive: true});
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#upButtonEl.disabled = disabled;
        this.#downButtonEl.disabled = disabled;
    }

    validityCallback(message) {
        this.#inputEl.setCustomValidity(message);
    }

    focus(options) {
        super.focus(options);
        this.#inputEl.focus(options);
    }

    set defaultValue(value) {
        this.setNumberAttribute("value", value);
    }

    get defaultValue() {
        return this.getNumberAttribute("value");
    }

    set value(value) {
        value = parseFloat(value);
        if (isNaN(value)) {
            super.value = null;
        } else {
            super.value = value;
        }
    }

    get value() {
        const value = super.value;
        if (value == null) {
            return null;
        }
        return parseFloat(value);
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    set min(value) {
        this.setNumberAttribute("min", value);
    }

    get min() {
        return this.getNumberAttribute("min");
    }

    set max(value) {
        this.setNumberAttribute("max", value);
    }

    get max() {
        return this.getNumberAttribute("max");
    }

    set spinner(value) {
        this.setBooleanAttribute("spinner", value);
    }

    get spinner() {
        return this.getBooleanAttribute("spinner");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "placeholder",
            "readonly",
            "min",
            "max"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                    setBooleanAttribute(this.#upButtonEl, name, this.readOnly);
                    setBooleanAttribute(this.#downButtonEl, name, this.readOnly);
                }
            } break;
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#inputEl.i18nPlaceholder = this.placeholder;
                }
            } break;
            case "min":
            case "max": {
                if (oldValue != newValue) {
                    setNumberAttribute(this.#inputEl, name, newValue);
                    this.revalidate();
                }
            } break;
        }
    }

    checkValid() {
        const value = this.value;
        if (value != null) {
            if (isNaN(value)) {
                return "Please enter a valid number";
            }
            const min = this.min;
            const max = this.max;
            if ((min != null && value < min) || (max != null && value > max)) {
                return `The Value must be between {{0::${this.min}}} and {{1::${this.max}}} (inclusive)`;
            }
        }
        return super.checkValid();
    }

    renderValue(value) {
        this.#inputEl.value = !isNaN(value) ? value : "";
    }

    #increaseValue() {
        const max = this.max;
        const currentValue = parseFloat(this.#inputEl.value) || 0;
        if (max == null || currentValue < max) {
            const newValue = currentValue + 1;
            this.#inputEl.value = newValue;
            this.value = newValue;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    #decreaseValue() {
        const min = this.min;
        const currentValue = parseFloat(this.#inputEl.value) || 0;
        if (min == null || currentValue > min) {
            const newValue = currentValue - 1;
            this.#inputEl.value = newValue;
            this.value = newValue;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

}

FormElementRegistry.register("NumberInput", NumberInput);
customElements.define("emc-input-number", NumberInput);
registerFocusable("emc-input-number");
