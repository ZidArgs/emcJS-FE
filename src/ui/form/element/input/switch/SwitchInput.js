import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import TPL from "./SwitchInput.js.html" assert {type: "html"};
import STYLE from "./SwitchInput.js.css" assert {type: "css"};

export default class SwitchInput extends AbstractFormElement {

    static get isCompact() {
        return true;
    }

    static get changeDebounceTime() {
        return 0;
    }

    #inputEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            if (this.readOnly) {
                this.#inputEl.checked = !this.#inputEl.checked;
                event.stopPropagation();
                return false;
            }
            this.value = this.#inputEl.checked;
        });
        /* --- */
        this.addEventListener("click", () => {
            if (!this.readOnly) {
                this.#inputEl.click();
            }
        });
        this.#inputEl.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#inputEl.focus(options);
    }

    set defaultValue(value) {
        this.setBooleanAttribute("value", value);
    }

    get defaultValue() {
        return this.getBooleanAttribute("value");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "readonly"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                }
            } break;
        }
    }

    checkValid() {
        if (this.required && !this.value) {
            return "This field is required";
        }
        return super.checkValid();
    }

    renderValue(value) {
        if (!value || value === "false") {
            this.#inputEl.checked = false;
            this.internals.states.delete("checked");
        } else {
            this.#inputEl.checked = true;
            this.internals.states.add("checked");
        }
    }

}

FormElementRegistry.register("SwitchInput", SwitchInput);
customElements.define("emc-input-switch", SwitchInput);
registerFocusable("emc-input-switch");
