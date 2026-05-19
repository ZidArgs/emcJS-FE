import CustomElement from "../element/CustomElement.js";
import TPL from "./LogEntry.js.html" assert {type: "html"};
import STYLE from "./LogEntry.js.css" assert {type: "css"};

export default class LogEntry extends CustomElement {

    #collapseEl;

    #timeEl;

    #messageEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#collapseEl = this.shadowRoot.getElementById("collapse");
        this.#timeEl = this.shadowRoot.getElementById("time");
        this.#messageEl = this.shadowRoot.getElementById("message");
    }

    set time(value) {
        this.setAttribute("time", value);
    }

    get time() {
        return this.getAttribute("time");
    }

    set message(value) {
        this.setAttribute("message", value);
    }

    get message() {
        return this.getAttribute("message");
    }

    set expanded(value) {
        this.setAttribute("expanded", value);
    }

    get expanded() {
        return this.getAttribute("expanded");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "time", "message", "expanded"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.();
        switch (name) {
            case "time": {
                if (oldValue != newValue) {
                    this.#timeEl.innerText = newValue ?? "";
                }
            } break;
            case "message": {
                if (oldValue != newValue) {
                    this.#messageEl.innerHTML = newValue ?? "";
                }
            } break;
            case "expanded": {
                if (oldValue != newValue) {
                    this.#collapseEl.setAttribute("checked", newValue && newValue !== "false");
                }
            } break;
        }
    }

}

customElements.define("emc-log-entry", LogEntry);
