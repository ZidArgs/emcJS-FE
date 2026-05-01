import SliderInput from "../slider/SliderInput.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {
    setBooleanAttribute, setNumberAttribute
} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./RangeInput.js.html" assert {type: "html"};
import STYLE from "./RangeInput.js.css" assert {type: "css"};

export default class RangeInput extends SliderInput {

    #numberEl;

    constructor() {
        super();
        const container = this.shadowRoot.getElementById("container");
        container.prepend(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#numberEl = this.shadowRoot.getElementById("number");
        this.#numberEl.addEventListener("change", (event) => {
            this.value = this.#numberEl.value;
            event.stopPropagation();
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#numberEl.disabled = disabled;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#numberEl, name, this.readOnly);
                }
            } break;
            case "min":
            case "max": {
                if (oldValue != newValue) {
                    setNumberAttribute(this.#numberEl, name, newValue);
                }
            } break;
        }
    }

    renderValue(value) {
        this.#numberEl.value = value ?? 0;
        super.renderValue(value);
    }

}

FormElementRegistry.register("RangeInput", RangeInput);
customElements.define("emc-input-range", RangeInput);
registerFocusable("emc-input-range");
