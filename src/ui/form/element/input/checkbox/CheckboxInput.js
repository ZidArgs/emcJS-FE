import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import TPL from "./CheckboxInput.js.html" assert {type: "html"};
import STYLE from "./CheckboxInput.js.css" assert {type: "css"};

export default class CheckboxInput extends AbstractFormElement {

    static get isCompact() {
        return true;
    }

    static get changeDebounceTime() {
        return 0;
    }

    #containerEl;

    #inputEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
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
        this.#containerEl.addEventListener("click", (event) => {
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
        if (value == null) {
            this.#inputEl.checked = true;
            this.#inputEl.indeterminate = true;
        } else if (!value || value === "false") {
            this.#inputEl.checked = false;
            this.#inputEl.indeterminate = false;
        } else {
            this.#inputEl.checked = true;
            this.#inputEl.indeterminate = false;
        }
    }

}

FormElementRegistry.register("CheckboxInput", CheckboxInput);
customElements.define("emc-input-checkbox", CheckboxInput);
registerFocusable("emc-input-checkbox");
