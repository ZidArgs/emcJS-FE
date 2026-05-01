import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/I18nTooltip.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./PasswordInput.js.html" assert {type: "html"};
import STYLE from "./PasswordInput.js.css" assert {type: "css"};
import FONT_STYLE from "../../../../../_style/emcjs-icons-codes.css" assert {type: "css"};
import CONFIG_FIELDS from "./PasswordInput.js.json" assert {type: "json"};

// TODO add required [lowercase,uppercase,digit,{symbol_declaration}]
// TODO add autohide timer (optional)
export default class PasswordInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    #inputEl;

    #buttonEl;

    #tooltipEl;

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
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
        this.#buttonEl.addEventListener("change", (event) => {
            const showValue = this.#buttonEl.checked;
            this.#buttonEl.className = showValue ? "icon-eye" : "icon-eye-striked";
            this.#tooltipEl.i18nTooltip = showValue ? "Value visible" : "Value hidden";
            this.#inputEl.type = showValue ? "text" : "password";
            event.stopPropagation();
        });
        this.#inputEl.type = this.#buttonEl.checked ? "text" : "password";
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#buttonEl.disabled = disabled;
        if (disabled) {
            this.#buttonEl.checked = false;
            this.#buttonEl.className = "icon-eye-striked";
        }
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

    set minLength(value) {
        this.setIntAttribute("minlength", value, 0);
    }

    get minLength() {
        return this.getIntAttribute("minlength");
    }

    set maxLength(value) {
        this.setIntAttribute("maxlength", value, 0);
    }

    get maxLength() {
        return this.getIntAttribute("maxlength");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "placeholder",
            "readonly",
            "minlength",
            "maxlength"
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
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#inputEl.i18nPlaceholder = this.placeholder;
                }
            } break;
            case "minlength":
            case "maxlength": {
                if (oldValue != newValue) {
                    this.revalidate();
                }
            } break;
        }
    }

    checkValid() {
        const value = this.value;
        if (value != null && value !== "") {
            const min = this.minLength;
            if (min != null && value.length < min) {
                return `The minimum length for this field is {{0::${min}}} characters`;
            }
            const max = this.maxLength;
            if (max != null && value.length > max) {
                return `The maximum length for this field is {{0::${max}}} characters`;
            }
        }
        return super.checkValid();
    }

    renderValue(value) {
        this.#inputEl.value = value ?? "";
    }

}

FormElementRegistry.register("PasswordInput", PasswordInput);
customElements.define("emc-input-password", PasswordInput);
registerFocusable("emc-input-password");
