import {isHttpUrl} from "@emcjs/core/util/helper/CheckType.js";
import CustomElement from "../../../element/CustomElement.js";
import TPL from "./IconOption.js.html" assert {type: "html"};
import STYLE from "./IconOption.js.css" assert {type: "css"};

export default class IconOption extends CustomElement {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    get value() {
        return this.getAttribute("value");
    }

    set icon(val) {
        this.setStringAttribute("icon", val);
    }

    get icon() {
        return this.getStringAttribute("icon");
    }

    set selected(value) {
        if (value == null) {
            this.removeAttribute("selected");
        } else if (typeof value === "boolean") {
            if (value) {
                this.setAttribute("selected", "");
            } else {
                this.removeAttribute("selected");
            }
        } else {
            this.setAttribute("selected", value);
        }
    }

    get selected() {
        const value = this.getAttribute("selected");
        if (value == null || value === "false") {
            return false;
        }
        if (value === "" || value === "true") {
            return true;
        }
        return value;
    }

    set disabled(value) {
        this.setBooleanAttribute("disabled", value);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    static get observedAttributes() {
        return [
            "icon"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "icon": {
                if (oldValue != newValue) {
                    if (isHttpUrl(newValue)) {
                        this.#iconEl.style.backgroundImage = `url("${newValue}")`;
                    } else {
                        this.#iconEl.style.backgroundImage = "";
                    }
                }
            } break;
        }
    }

    static create(value, icon) {
        const el = document.createElement("emc-icon-option");
        el.value = value;
        el.icon = icon;
        return el;
    }

}

customElements.define("emc-icon-option", IconOption);
