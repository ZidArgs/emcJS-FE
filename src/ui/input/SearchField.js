import CustomElementDelegating from "../element/CustomElementDelegating.js";
import "../symbols/ClearSymbol.js";
import "./components/InputElement.js";
import "../i18n/I18nTooltip.js";
import TPL from "./SearchField.js.html" assert {type: "html"};
import STYLE from "./SearchField.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class SearchField extends CustomElementDelegating {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        const searchEl = this.shadowRoot.getElementById("search");
        searchEl.addEventListener("input", (ev) => {
            this.value = ev.currentTarget.value;
        });
        const searchResetEl = this.shadowRoot.getElementById("search-reset");
        searchResetEl.addEventListener("click", () => {
            this.value = "";
        });
    }

    get value() {
        return this.getAttribute("value") ?? "";
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    static get observedAttributes() {
        return ["value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "value": {
                    const searchEl = this.shadowRoot.getElementById("search");
                    searchEl.value = newValue;
                    const event = new Event("change");
                    event.value = newValue;
                    this.dispatchEvent(event);
                } break;
            }
        }
    }

}

customElements.define("emc-searchinput", SearchField);
