import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import "../../../../i18n/builtin/I18nTextarea.js";
import TPL from "./TextInput.js.html" assert {type: "html"};
import STYLE from "./TextInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./TextInput.js.json" assert {type: "json"};

export default class TextInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get AXES() {
        return Direction;
    }

    #containerEl;

    #inputEl;

    #expandButtonEl;

    #lengthInfoEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#expandButtonEl = this.shadowRoot.getElementById("expand-button");
        this.#lengthInfoEl = this.shadowRoot.getElementById("length-info");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.value = this.#inputEl.value;
            this.#printTextLength();
        });
        this.#inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && event.shiftKey === this.newlineOnShift) {
                event.stopPropagation();
                return false;
            }
        });
        /* --- */
        this.#expandButtonEl.addEventListener("click", () => {
            if (this.#containerEl.classList.contains("expanded")) {
                this.#containerEl.classList.remove("expanded");
                this.#expandButtonEl.innerText = "⛶";
            } else {
                this.#containerEl.classList.add("expanded");
                this.#expandButtonEl.innerText = "🗙";
            }
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

    set newlineOnShift(value) {
        this.setBooleanAttribute("newlineonshift", value);
    }

    get newlineOnShift() {
        return this.getBooleanAttribute("newlineonshift");
    }

    set stretch(value) {
        this.setBooleanAttribute("stretch", value);
    }

    get stretch() {
        return this.getBooleanAttribute("stretch");
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

    set resize(value) {
        this.setEnumAttribute("resize", value, Direction);
    }

    get resize() {
        return this.getEnumAttribute("resize");
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
        } else {
            this.#lengthInfoEl.innerText = "";
        }
    }

}

FormElementRegistry.register("TextInput", TextInput);
customElements.define("emc-input-text", TextInput);
registerFocusable("emc-input-text");
