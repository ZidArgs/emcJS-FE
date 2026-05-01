import CustomElement from "../../../element/CustomElement.js";
import "../../../i18n/I18nLabel.js";
import "./checkbox/SelectCheckBox.js";
import TPL from "./SelectEntry.js.html" assert {type: "html"};
import STYLE from "./SelectEntry.js.css" assert {type: "css"};

export default class SelectEntry extends CustomElement {

    #checkboxEl;

    #labelEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#checkboxEl = this.shadowRoot.getElementById("checkbox");
        this.#labelEl = this.shadowRoot.getElementById("label");
    }

    set value(value) {
        this.setAttribute("value", value);
    }

    get value() {
        return this.getAttribute("value");
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get label() {
        return this.getAttribute("label");
    }

    set selected(value) {
        this.setBooleanAttribute("selected", value);
    }

    get selected() {
        return this.getBooleanAttribute("selected");
    }

    static get observedAttributes() {
        return [
            "value",
            "label",
            "selected"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value": {
                if (oldValue != newValue && !this.label) {
                    this.#labelEl.innerText = newValue;
                }
            } break;
            case "label": {
                if (oldValue != newValue) {
                    if (newValue) {
                        this.#labelEl.i18nValue = newValue;
                    } else {
                        this.#labelEl.i18nValue = "";
                        this.#labelEl.innerText = this.value;
                    }
                }
            } break;
            case "selected": {
                if (oldValue != newValue) {
                    this.#checkboxEl.value = this.selected;
                }
            } break;
        }
    }

    get comparatorText() {
        return this.#labelEl.innerText;
    }

    static create(value, label) {
        const el = new SelectEntry();
        el.value = value;
        el.label = label ?? value;
        return el;
    }

}

customElements.define("emc-select-entry", SelectEntry);
