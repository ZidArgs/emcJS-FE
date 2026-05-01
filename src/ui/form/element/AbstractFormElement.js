import {immute} from "emcjs/data/Immutable.js";
import {debounce} from "emcjs/util/Debouncer.js";
import {isEqual} from "emcjs/util/helper/Comparator.js";
import {delimitInteger} from "emcjs/util/helper/number/Integer.js";
import {isEmpty} from "emcjs/util/helper/CheckType.js";
import CustomFormElement from "../../element/CustomFormElement.js";
import STYLE from "./AbstractFormElement.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./AbstractFormElement.js.json" assert {type: "json"};

export default class AbstractFormElement extends CustomFormElement {

    static get formConfigurationFields() {
        return immute(CONFIG_FIELDS);
    }

    static get attributes() {
        const attributes = new Set();
        for (const {name} of this.formConfigurationFields) {
            attributes.add(name);
        }
        return [...attributes];
    }

    static get isCompact() {
        return false;
    }

    static #changeDebounceTime = 300;

    static get changeDebounceTime() {
        return this.#changeDebounceTime;
    }

    static set changeDebounceTime(value) {
        this.#changeDebounceTime = delimitInteger(value, 0, 1000);
    }

    #formField;

    #value;

    #validators = new Set();

    #errorList = new Set();

    #customValidity = "";

    constructor() {
        if (new.target === AbstractFormElement) {
            throw new Error("can not construct abstract class");
        }
        super();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.shadowRoot.addEventListener("input", (event) => {
            event.stopPropagation();
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        this.shadowRoot.addEventListener("change", (event) => {
            event.stopPropagation();
        });
        this.shadowRoot.addEventListener("invalid", (event) => {
            event.preventDefault();
        });
        /* --- */
        this.shadowRoot.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                if (this.form != null) {
                    this.form.dispatchEvent(new Event("submit", {
                        bubbles: true,
                        cancelable: true
                    }));
                }
                this.dispatchEvent(new Event("submit", {
                    bubbles: true,
                    cancelable: true
                }));
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.renderValue(this.value);
        this.refreshFormValue();
        this.revalidate();
    }

    formResetCallback() {
        this.#value = undefined;
        const value = this.value;
        this.renderValue(value);
    }

    formStateRestoreCallback(state/* , mode */) {
        this.value = state;
    }

    getSubmitValue() {
        return this.value;
    }

    async reset() {
        if (this.#value !== undefined) {
            this.#value = undefined;
            const newValue = this.value;
            this.renderValue(newValue);
            this.refreshFormValue();
            await this.revalidate();
            this.#notifyChange();
        }
    }

    set formField(value) {
        this.#formField = value;
    }

    get formField() {
        return this.#formField;
    }

    get isInitial() {
        return this.#value === undefined;
    }

    get isEmpty() {
        return isEmpty(this.#value);
    }

    get isDefault() {
        const value = this.value;
        const defaultValue = this.defaultValue;
        return isEqual(value, defaultValue);
    }

    set value(value) {
        this.#onUpdateValue(value);
    }

    get value() {
        if (this.#value === undefined) {
            return super.value;
        }
        return this.#value;
    }

    get rawValue() {
        return this.#value;
    }

    set name(value) {
        this.setAttribute("name", value);
    }

    get name() {
        return this.getAttribute("name");
    }

    set required(value) {
        this.setBooleanAttribute("required", value);
    }

    get required() {
        return this.getBooleanAttribute("required");
    }

    set noValidate(value) {
        this.setBooleanAttribute("novalidate", value);
    }

    get noValidate() {
        return this.getBooleanAttribute("novalidate");
    }

    set readOnly(value) {
        this.setBooleanAttribute("readonly", value);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    set disabled(value) {
        this.setBooleanAttribute("disabled", value);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    set hidden(value) {
        this.setBooleanAttribute("hidden", value);
    }

    get hidden() {
        return this.getBooleanAttribute("hidden");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "value",
            "required",
            "novalidate"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    if (this.isInitial) {
                        const defaultValue = this.defaultValue;
                        this.renderValue(defaultValue);
                        this.refreshFormValue();
                        this.revalidate();
                        this.#notifyChange();
                    }
                }
            } break;
            case "required": {
                if (oldValue != newValue) {
                    this.revalidate();
                }
            } break;
            case "novalidate": {
                if (oldValue != newValue) {
                    this.revalidate();
                }
            } break;
        }
    }

    getOuterText(node, excludedNodeClasses = []) {
        return super.getText(node, [HTMLOptionElement, ...excludedNodeClasses]);
    }

    async #onUpdateValue(value) {
        if (!isEqual(this.value, value)) {
            this.#value = value;
            const newValue = this.value;
            this.renderValue(newValue);
            this.refreshFormValue();
            await this.revalidate();
            this.#notifyChange();
        }
    }

    #notifyChange = debounce(() => {
        if (!this.#errorList.size) {
            const event = new Event("value", {
                bubbles: true,
                cancelable: true
            });
            event.value = this.value;
            event.name = this.name;
            event.fieldId = this.id;
            this.dispatchEvent(event);
        }
        this.dispatchEvent(new Event("change", {
            bubbles: true,
            cancelable: true
        }));
    }, AbstractFormElement.changeDebounceTime);

    async revalidate() {
        if (!this.noValidate) {
            const value = this.value;
            this.#errorList.clear();
            const internalMessage = this.checkValid();
            if (typeof internalMessage === "string" && internalMessage !== "") {
                this.#errorList.add(internalMessage);
            }
            const validations = [];
            for (const validator of this.#validators) {
                validations.push(this.#doValidation(validator, value));
            }
            await Promise.all(validations);
            this.#showErrors();
            return [...this.#errorList];
        }
        const message = this.validationMessage;
        return message.length > 0 ? [message] : [];
    }

    checkValid() {
        const value = this.value;
        if (this.required && isEmpty(value)) {
            return "This field is required";
        }
        return "";
    }

    setCustomValidity(message) {
        if (message == null) {
            message = "";
        }
        if (typeof message === "string") {
            this.#customValidity = message.trim();
            this.#showErrors();
        }
    }

    #showErrors = debounce(() => {
        if (!this.noValidate) {
            const message = [this.#customValidity, ...this.#errorList].join("\n").trim();
            super.setCustomValidity(message);
        } else {
            super.setCustomValidity(this.#customValidity);
        }
    });

    get errors() {
        return [...this.#errorList];
    }

    addValidator(validator) {
        if (typeof validator === "function" && !this.#validators.has(validator)) {
            this.#validators.add(validator);
            this.revalidate();
        }
    }

    removeValidator(validator) {
        if (typeof validator === "function" && this.#validators.has(validator)) {
            this.#validators.delete(validator);
            this.revalidate();
        }
    }

    async #doValidation(validator, value) {
        const message = await validator(value);
        if (typeof message === "string" && message !== "") {
            this.#errorList.add(message);
        }
    }

    formContextAssociatedCallback(/* formContext */) {
        // ignore
    }

    renderValue(/* value */) {
        // ignore
    }

    focus(options) {
        super.focus(options);
        this.scrollIntoView({
            block: "center",
            inline: "center"
        });
    }

}
