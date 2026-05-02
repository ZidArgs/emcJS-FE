import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/I18nTooltip.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./SearchInput.js.html" assert {type: "html"};
import STYLE from "./SearchInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./SearchInput.js.json" assert {type: "json"};

export default class SearchInput extends AbstractFormElement {

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
        this.#buttonEl.addEventListener("click", () => {
            this.value = "";
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
        this.#inputEl.focus(options);
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
                }
            } break;
        }
    }

    renderValue(value) {
        this.#inputEl.value = value ?? "";
    }

}

FormElementRegistry.register("SearchInput", SearchInput);
customElements.define("emc-input-search", SearchInput);
registerFocusable("emc-input-search");
