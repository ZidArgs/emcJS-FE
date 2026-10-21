import CustomFormElement from "../../../../element/CustomFormElement.js";
import "../../../../i18n/I18nLabel.js";
import "../../../../icon/FontIcon.js";
import TPL from "./ValuePill.js.html" assert {type: "html"};
import STYLE from "./ValuePill.js.css" assert {type: "css"};

export default class ValuePill extends CustomFormElement {

    #labelEl;

    #removeEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#labelEl = this.shadowRoot.getElementById("label");
        this.#removeEl = this.shadowRoot.getElementById("remove");
        this.#removeEl.addEventListener("click", (event) => {
            const ev = new Event("remove");
            this.dispatchEvent(ev);
            event.stopPropagation();
        });
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get label() {
        return this.getAttribute("label");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "label"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "label": {
                if (oldValue != newValue) {
                    this.#labelEl.i18nValue = this.label;
                }
            } break;
        }
    }

}

customElements.define("emc-value-pill", ValuePill);
