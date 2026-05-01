import CustomElement from "../../../../../element/CustomElement.js";
import TPL from "./RelationSelectEntry.js.html" assert {type: "html"};
import STYLE from "./RelationSelectEntry.js.css" assert {type: "css"};

export default class RelationSelectEntry extends CustomElement {

    #containerEl;

    #nameEl;

    #typeEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#nameEl = this.shadowRoot.getElementById("name");
        this.#typeEl = this.shadowRoot.getElementById("type");
    }

    set name(value) {
        this.setAttribute("name", value);
    }

    get name() {
        return this.getAttribute("name");
    }

    set type(value) {
        this.setAttribute("type", value);
    }

    get type() {
        return this.getAttribute("type");
    }

    get value() {
        return {
            "type": this.type ?? "",
            "name": this.name ?? ""
        };
    }

    set selected(value) {
        this.setBooleanAttribute("selected", value);
    }

    get selected() {
        return this.getBooleanAttribute("selected");
    }

    static get observedAttributes() {
        return ["name", "type"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "name": {
                if (oldValue != newValue) {
                    this.#nameEl.innerText = newValue;
                    this.#containerEl.title = `${newValue || "---"}\n[${this.type || "---"}]`;
                }
            } break;
            case "type": {
                if (oldValue != newValue) {
                    this.#typeEl.innerText = newValue;
                    this.#containerEl.title = `${this.name || "---"}\n[${newValue || "---"}]`;
                }
            } break;
        }
    }

    get comparatorText() {
        if (!this.name || !this.type) {
            return "";
        }
        return `${this.name}\n[${this.type}]`;
    }

}

customElements.define("emc-select-relation-entry", RelationSelectEntry);
