import CustomElement from "../element/CustomElement.js";
import TPL from "./LogValue.js.html" assert {type: "html"};
import STYLE from "./LogValue.js.css" assert {type: "css"};

export default class LogValue extends CustomElement {

    #containerEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
    }

    set value(value) {
        this.setJSONAttribute("value", value);
    }

    get value() {
        return this.getJSONAttribute("value");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.();
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    this.#renderTree(this.value);
                }
            } break;
        }
    }

    #renderTree(value, root = this.#containerEl) {
        if (value == null) {
            const el = document.createElement("span");
            el.innerText = "null";
            root.append(el);
        } else if (typeof value === "object") {
            const cbEl = document.createElement("input");
            cbEl.className = "collapse";
            cbEl.setAttribute("type", "checkbox");
            root.append(cbEl);
            const ulEl = document.createElement("ul");
            if (Array.isArray(value)) {
                ulEl.dataset.label = `(${value.length}) [...]`;
            } else {
                ulEl.dataset.label = "{...}";
            }
            for (const i in value) {
                const liEl = document.createElement("li");
                liEl.dataset.label = `${i}:`;
                this.#renderTree(value[i], liEl);
                ulEl.append(liEl);
            }
            root.append(ulEl);
        } else {
            const el = document.createElement("span");
            el.innerText = JSON.stringify(value);
            root.append(el);
        }
    }

}

customElements.define("emc-log-value", LogValue);
