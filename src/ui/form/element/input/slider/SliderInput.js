import {immute} from "@emcjs/core/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import {
    setBooleanAttribute, setNumberAttribute
} from "../../../../../util/node/NodeAttributes.js";
import TPL from "./SliderInput.js.html" assert {type: "html"};
import STYLE from "./SliderInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./SliderInput.js.json" assert {type: "json"};

export default class SliderInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    #inputWrapperEl;

    #inputEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputWrapperEl = this.shadowRoot.getElementById("input-wrapper");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            const value = this.#inputEl.value;
            this.#applyValueToBar(value);
            this.value = value;
        });
        new ResizeObserver(() => {
            this.#applyGradationsValue();
        }).observe(this.#inputEl);
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#inputEl.focus(options);
    }

    set value(value) {
        super.value = value != null ? parseInt(value) : null;
    }

    get value() {
        return super.value ?? 0;
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

    set gradations(value) {
        this.setBooleanAttribute("gradations", value);
    }

    get gradations() {
        return this.getBooleanAttribute("gradations");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "readonly",
            "min",
            "max",
            "gradations"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                }
            } break;
            case "min":
            case "max": {
                if (oldValue != newValue) {
                    setNumberAttribute(this.#inputEl, name, newValue);
                    this.#setRange();
                    this.#applyValueToBar(this.value);
                }
            } break;
            case "gradations": {
                if (oldValue != newValue) {
                    this.#applyGradationsValue();
                }
            } break;
        }
    }

    renderValue(value) {
        this.#inputEl.value = value ?? 0;
        this.#applyValueToBar(value);
    }

    #setRange() {
        const min = parseInt(this.getAttribute("min") || "0");
        const max = parseInt(this.getAttribute("max") || "10");
        if (min < max) {
            const parts = max - min;
            this.#inputWrapperEl.style.setProperty("--range-parts", parts);
            this.#applyGradationsValue();
        } else {
            this.#inputWrapperEl.style.setProperty("--range-parts", 1);
            this.#applyGradationsValue();
        }
    }

    #applyValueToBar(value) {
        const min = parseInt(this.getAttribute("min") || "0");
        const max = parseInt(this.getAttribute("max") || "10");
        if (min < max) {
            if (value !== "") {
                this.#inputWrapperEl.style.setProperty("--range-value", value - min);
            } else {
                const pos = (max - min) / 2;
                this.#inputWrapperEl.style.setProperty("--range-value", pos - min);
            }
        } else {
            this.#inputWrapperEl.style.setProperty("--range-value", 0);
            this.#applyGradationsValue();
        }
    }

    // TODO add gradation increment value
    #applyGradationsValue() {
        if (this.gradations) {
            const min = parseInt(this.getAttribute("min") || "0");
            const max = parseInt(this.getAttribute("max") || "10");
            if (min < max) {
                const parts = max - min;
                if (parts < this.#inputEl.offsetWidth / 10) {
                    this.#inputWrapperEl.classList.add("gradations");
                    return;
                }
            }
        }
        this.#inputWrapperEl.classList.remove("gradations");
    }

}

FormElementRegistry.register("SliderInput", SliderInput);
customElements.define("emc-input-slider", SliderInput);
registerFocusable("emc-input-slider");
