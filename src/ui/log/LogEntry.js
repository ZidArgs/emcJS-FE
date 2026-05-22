import CustomElement from "../element/CustomElement.js";
import LogTypeEnum from "../../enum/log/LogTypeEnum.js";
import "./LogValue.js";
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

    set type(value) {
        this.setEnumAttribute("type", value, LogTypeEnum);
    }

    get type() {
        return this.getEnumAttribute("type");
    }

    set time(value) {
        this.setAttribute("time", value);
    }

    get time() {
        return this.getAttribute("time");
    }

    set expanded(value) {
        this.setBooleanAttribute("expanded", value);
    }

    get expanded() {
        return this.getBooleanAttribute("expanded");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "time", "expanded"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.();
        switch (name) {
            case "time": {
                if (oldValue != newValue) {
                    this.#timeEl.innerText = newValue ?? "";
                }
            } break;
            case "expanded": {
                if (oldValue != newValue) {
                    if (this.expanded) {
                        this.#collapseEl.setAttribute("checked", "");
                    } else {
                        this.#collapseEl.removeAttribute("checked");
                    }
                }
            } break;
        }
    }

    addMessageValue(value) {
        const valueEl = document.createElement("emc-log-value");
        valueEl.value = value;
        this.#messageEl.append(valueEl);
    }

}

customElements.define("emc-log-entry", LogEntry);
