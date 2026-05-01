import CustomElementDelegating from "../element/CustomElementDelegating.js";
import "../input/SearchField.js";
import "../i18n/I18nTooltip.js";
import TPL from "./SelectionHeader.js.html" assert {type: "html"};
import STYLE from "./SelectionHeader.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class SelectionHeader extends CustomElementDelegating {

    #selectionEl;

    #searchEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#selectionEl = this.shadowRoot.getElementById("selection");
        this.#selectionEl.addEventListener("change", (ev) => {
            this.checked = ev.currentTarget.checked;
            const event = new Event("check");
            event.value = ev.currentTarget.checked;
            this.dispatchEvent(event);
        });
        this.#searchEl = this.shadowRoot.getElementById("search");
        this.#searchEl.addEventListener("change", (ev) => {
            this.search = ev.currentTarget.value;
            const event = new Event("search");
            event.value = ev.currentTarget.value;
            this.dispatchEvent(event);
        });
    }

    get checked() {
        return this.getAttribute("checked");
    }

    set checked(val) {
        this.setAttribute("checked", val);
    }

    get search() {
        return this.getAttribute("search");
    }

    set search(val) {
        this.setAttribute("search", val);
    }

    get multiple() {
        return this.getAttribute("multiple") == "true";
    }

    set multiple(val) {
        this.setAttribute("multiple", val);
    }

    static get observedAttributes() {
        return ["checked", "search"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "checked": {
                    if (newValue == "mixed") {
                        this.#selectionEl.checked = true;
                        this.#selectionEl.indeterminate = true;
                    } else {
                        this.#selectionEl.checked = newValue != "false";
                        this.#selectionEl.indeterminate = false;
                    }
                } break;
                case "search": {
                    this.#searchEl.value = newValue;
                } break;
            }
        }
    }

}

customElements.define("emc-header-selection", SelectionHeader);
