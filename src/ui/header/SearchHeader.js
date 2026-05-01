import {debounce} from "emcjs/util/Debouncer.js";
import CustomElementDelegating from "../element/CustomElementDelegating.js";
import "../i18n/I18nTooltip.js";
import TPL from "./SearchHeader.js.html" assert {type: "html"};
import STYLE from "./SearchHeader.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class SearchHeader extends CustomElementDelegating {

    #inputEl;

    #resetEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.#onInput();
        });
        this.#resetEl = this.shadowRoot.getElementById("reset");
        this.#resetEl.addEventListener("click", () => {
            this.value = "";
        });
    }

    #onInput = debounce(() => {
        const value = this.#inputEl.value;
        this.value = value;
    }, 300);

    set value(value) {
        this.#inputEl.value = value;
        const event = new Event("search", {
            bubbles: true,
            cancelable: true
        });
        event.value = value;
        this.dispatchEvent(event);
    }

    get value() {
        return this.#inputEl.value;
    }

}

customElements.define("emc-header-search", SearchHeader);
