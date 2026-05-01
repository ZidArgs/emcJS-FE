import {immute} from "emcjs/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import Direction from "../../../../../enum/Direction.js";
import "../../../../i18n/builtin/I18nInput.js";
import "../../../../i18n/builtin/I18nOption.js";
import "../../input/logic/LogicInput.js";
import "../../select/switch/SwitchSelect.js";
import TPL from "./BoolOrLogicInput.js.html" assert {type: "html"};
import STYLE from "./BoolOrLogicInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./BoolOrLogicInput.js.json" assert {type: "json"};

export default class BoolOrLogicInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    static get AXES() {
        return Direction;
    }

    #containerEl;

    #inputEl;

    #logicEl;

    #nullOptionEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#logicEl = this.shadowRoot.getElementById("logic");
        this.#inputEl.addEventListener("input", () => {
            const value = this.#inputEl.value;
            if (value === "logic") {
                this.#logicEl.classList.add("active");
                this.value = this.#logicEl.value ?? {};
            } else {
                this.#logicEl.classList.remove("active");
                this.#logicEl.value = null;
                if (this.nullable && value === "") {
                    this.value = "";
                } else {
                    this.value = value === "true";
                }
            }
        });
        this.#logicEl.addEventListener("input", () => {
            const value = this.#inputEl.value;
            if (value === "logic") {
                this.value = this.#logicEl.value ?? {};
            }
        });
        /* --- */
        this.#nullOptionEl = document.createElement("option", {is: "emc-i18n-option"});
        this.#nullOptionEl.value = "";
        this.#nullOptionEl.i18nValue = "Null";
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#logicEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#inputEl.focus(options);
    }

    addOperatorGroup(...groupList) {
        this.#logicEl.addOperatorGroup(...groupList);
    }

    removeOperatorGroup(...groupList) {
        this.#logicEl.removeOperatorGroup(...groupList);
    }

    set defaultValue(value) {
        this.setJSONAttribute("value", value);
    }

    get defaultValue() {
        return this.getJSONAttribute("value");
    }

    set value(value) {
        if (value === "true") {
            value = true;
        } else if (value === "false") {
            value = false;
        } else if (value === "") {
            value = null;
        }
        super.value = value;
    }

    get value() {
        return super.value;
    }

    set nullable(value) {
        this.setBooleanAttribute("nullable", value);
    }

    get nullable() {
        return this.getBooleanAttribute("nullable");
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
            "name",
            "readonly",
            "nullable",
            "resize"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "name":{
                if (oldValue != newValue) {
                    this.#logicEl.name = this.name;
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    this.#inputEl.readOnly = this.readOnly;
                    this.#logicEl.readOnly = this.readOnly;
                }
            } break;
            case "nullable": {
                if (this.nullable) {
                    this.#inputEl.prepend(this.#nullOptionEl);
                    this.#inputEl.defaultValue = "";
                } else {
                    this.#nullOptionEl.remove();
                    this.#inputEl.defaultValue = "true";
                }
            } break;
            case "resize":{
                if (oldValue != newValue) {
                    this.#logicEl.resize = this.resize;
                }
            } break;
        }
    }

    checkValid() {
        return this.#logicEl.checkValid() || super.checkValid();
    }

    renderValue(value) {
        if (typeof value === "object" && value != null) {
            this.#containerEl.classList.add("logic");
            this.#inputEl.value = "logic";
            this.#logicEl.value = value;
            this.scrollIntoView();
        } else if (value === false) {
            this.#containerEl.classList.remove("logic");
            this.#inputEl.value = "false";
            this.#logicEl.value = null;
        } else if (value === true) {
            this.#containerEl.classList.remove("logic");
            this.#inputEl.value = "true";
            this.#logicEl.value = null;
        } else {
            this.#containerEl.classList.remove("logic");
            this.#inputEl.value = "";
            this.#logicEl.value = null;
        }
    }

}

FormElementRegistry.register("BoolOrLogicInput", BoolOrLogicInput);
customElements.define("emc-input-boolorlogic", BoolOrLogicInput);
registerFocusable("emc-input-boolorlogic");
