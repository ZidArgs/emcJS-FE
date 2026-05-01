import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./StringInput.js.html" assert {type: "html"};
import STYLE from "./StringInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./StringInput.js.json" assert {type: "json"};

// TODO add pattern (expected pattern as regexp) - validation
export default class StringInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    #inputEl;

    #lengthInfoEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#lengthInfoEl = this.shadowRoot.getElementById("length-info");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.value = this.#inputEl.value;
            this.#printTextLength();
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        if (this.showTextLength) {
            this.#applyTextLengthPadding();
        }
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
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

    set showTextLength(value) {
        this.setBooleanAttribute("showtextlength", value);
    }

    get showTextLength() {
        return this.getBooleanAttribute("showtextlength");
    }

    set spellcheck(value) {
        this.setBooleanAttribute("spellcheck", value);
    }

    get spellcheck() {
        return this.getBooleanAttribute("spellcheck");
    }

    set autocapitalize(value) {
        this.setAttribute("autocapitalize", value);
    }

    get autocapitalize() {
        return this.getAttribute("autocapitalize");
    }

    set autocomplete(value) {
        this.setAttribute("autocomplete", value);
    }

    get autocomplete() {
        return this.getAttribute("autocomplete");
    }

    set autocorrect(value) {
        this.setAttribute("autocorrect", value);
    }

    get autocorrect() {
        return this.getAttribute("autocorrect");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "placeholder",
            "readonly",
            "minlength",
            "maxlength",
            "showtextlength",
            "spellcheck",
            "autocapitalize",
            "autocomplete",
            "autocorrect"
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
                    this.#printTextLength();
                }
            } break;
            case "showtextlength": {
                if (oldValue != newValue) {
                    this.#printTextLength();
                }
            } break;
            case "spellcheck": {
                if (oldValue != newValue) {
                    this.#inputEl.spellcheck = this.spellcheck;
                }
            } break;
            case "autocapitalize": {
                if (oldValue != newValue) {
                    this.#inputEl.autocapitalize = this.autocapitalize;
                }
            } break;
            case "autocomplete": {
                if (oldValue != newValue) {
                    this.#inputEl.autocomplete = this.autocomplete;
                }
            } break;
            case "autocorrect": {
                if (oldValue != newValue) {
                    this.#inputEl.autocorrect = this.autocorrect;
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
        this.#printTextLength();
    }

    #printTextLength() {
        if (this.showTextLength) {
            const value = this.#inputEl.value ?? "";
            const length = value.length;
            if (this.maxLength != null) {
                if (this.minLength != null) {
                    this.#lengthInfoEl.innerText = `${length} / ${this.minLength} − ${this.maxLength}`;
                } else {
                    this.#lengthInfoEl.innerText = `${length} / ${this.maxLength}`;
                }
            } else if (this.minLength != null) {
                this.#lengthInfoEl.innerText = `${length} (>${this.minLength})`;
            } else {
                this.#lengthInfoEl.innerText = length;
            }
            this.#applyTextLengthPadding();
        } else {
            this.#lengthInfoEl.innerText = "";
            this.#inputEl.style.paddingRight = "";
        }
    }

    #applyTextLengthPadding() {
        const padding = this.#lengthInfoEl.clientWidth + 7;
        this.#inputEl.style.paddingRight = `${padding}px`;
    }

}

FormElementRegistry.register("StringInput", StringInput);
customElements.define("emc-input-string", StringInput);
registerFocusable("emc-input-string");
