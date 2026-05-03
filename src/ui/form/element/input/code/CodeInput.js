import {immute} from "@emcjs/core/data/Immutable.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import "./components/CodeArea.js";
import TPL from "./CodeInput.js.html" assert {type: "html"};
import STYLE from "./CodeInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./CodeInput.js.json" assert {type: "json"};

// TODO add enter and escape action to not trap keyboard
// TODO add css variables for code editor colors
// TODO customize scrollbars to have sharp corners and transparent backgrounds
export default class CodeInput extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get AXES() {
        return Direction;
    }

    #containerEl;

    #inputEl;

    #lineInfoEl;

    #expandButtonEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#lineInfoEl = this.shadowRoot.getElementById("line-info");
        this.#expandButtonEl = this.shadowRoot.getElementById("expand-button");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.value = this.#inputEl.value;
        });
        this.#inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && event.shiftKey === this.newlineOnShift) {
                event.stopPropagation();
                return false;
            }
        });
        this.#inputEl.addEventListener("selectionchange", (event) => {
            this.#updateCaretPosition(event.data);
        });
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

    set newlineOnShift(value) {
        this.setBooleanAttribute("newlineonshift", value);
    }

    get newlineOnShift() {
        return this.getBooleanAttribute("newlineonshift");
    }

    set resize(value) {
        this.setEnumAttribute("resize", value, Direction);
    }

    get resize() {
        return this.getEnumAttribute("resize");
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
                    this.#inputEl.readOnly = this.readOnly;
                }
            } break;
        }
    }

    renderValue(value) {
        this.#inputEl.value = value ?? "";
    }

    #updateCaretPosition(data) {
        const {
            currentLine,
            focusOffset,
            length
        } = data;
        if (length > 0) {
            this.#lineInfoEl.innerText = `Ln ${currentLine + 1}, Col ${focusOffset + 1} (${length} selected)`;
        } else {
            this.#lineInfoEl.innerText = `Ln ${currentLine + 1}, Col ${focusOffset + 1}`;
        }
    }

}

FormElementRegistry.register("CodeInput", CodeInput);
customElements.define("emc-input-code", CodeInput);
registerFocusable("emc-input-code");
