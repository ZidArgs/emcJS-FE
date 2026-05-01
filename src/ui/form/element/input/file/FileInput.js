import {immute} from "emcjs/data/Immutable.js";
import FileSystem from "emcjs/util/file/FileSystem.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import TPL from "./FileInput.js.html" assert {type: "html"};
import STYLE from "./FileInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./FileInput.js.json" assert {type: "json"};

export default class FileInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    #data;

    #inputEl;

    #buttonEl;

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
        this.#buttonEl.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const data = await FileSystem.load(this.accept);
            this.#data = immute(data);
            this.value = data?.name;
        });
        /* --- */
        this.addEventListener("click", () => {
            if (!this.readOnly) {
                this.#buttonEl.click();
            }
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

    getData() {
        return this.#data;
    }

    set value(value) {
        if (value !== this.#data?.name) {
            this.#data = null;
        }
        super.value = value;
    }

    get value() {
        return super.value;
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    set accept(value) {
        this.setJSONAttribute("accept", value);
    }

    get accept() {
        return this.getJSONAttribute("accept");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "placeholder"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#inputEl.i18nPlaceholder = newValue;
                }
            } break;
        }
    }

    renderValue(value) {
        this.#inputEl.value = value;
    }

}

FormElementRegistry.register("FileInput", FileInput);
customElements.define("emc-input-file", FileInput);
registerFocusable("emc-input-file");
