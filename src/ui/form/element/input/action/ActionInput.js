import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import {setBooleanAttribute} from "../../../../../util/node/NodeAttributes.js";
import TPL from "./ActionInput.js.html" assert {type: "html"};
import STYLE from "./ActionInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ActionInput.js.json" assert {type: "json"};

export default class ActionInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    #inputEl;

    #buttonEl;

    #valueRenderer = null;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("focus", () => {
            this.#buttonEl.focus();
        });
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const ev = new Event("action");
            ev.value = this.value;
            this.dispatchEvent(ev);
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
                    this.#inputEl.i18nPlaceholder = newValue;
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
        if (this.#valueRenderer != null) {
            this.#inputEl.value = this.#valueRenderer(value);
        } else {
            this.#inputEl.value = value;
        }
    }

    setValueRenderer(renderer) {
        if (typeof renderer === "function") {
            this.#valueRenderer = renderer;
            this.#inputEl.value = this.#valueRenderer(this.value);
        } else {
            this.#valueRenderer = null;
            this.#inputEl.value = this.value;
        }
    }

}

FormElementRegistry.register("ActionInput", ActionInput);
customElements.define("emc-input-action", ActionInput);
registerFocusable("emc-input-action");
