import CustomElement from "../../../element/CustomElement.js";
import "../../../i18n/builtin/I18nInput.js";
import TPL from "./ErrorButtonItem.js.html" assert {type: "html"};
import STYLE from "./ErrorButtonItem.js.css" assert {type: "css"};

export default class ErrorButtonItem extends CustomElement {

    #labelEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#labelEl = this.shadowRoot.getElementById("label");
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get label() {
        return this.getAttribute("label");
    }

    set name(value) {
        this.setAttribute("name", value);
    }

    get name() {
        return this.getAttribute("name");
    }

    static get observedAttributes() {
        return ["label", "name"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "label": {
                if (oldValue != newValue) {
                    if (newValue) {
                        this.#labelEl.i18nValue = newValue;
                    } else {
                        this.#labelEl.i18nValue = "";
                        this.#labelEl.innerText = this.name ?? "";
                    }
                }
            } break;
            case "name": {
                if (oldValue != newValue) {
                    if (!this.label) {
                        this.#labelEl.i18nValue = "";
                        this.#labelEl.innerText = newValue ?? "";
                    }
                }
            } break;
        }
    }

}

customElements.define("emc-button-error-item", ErrorButtonItem);
