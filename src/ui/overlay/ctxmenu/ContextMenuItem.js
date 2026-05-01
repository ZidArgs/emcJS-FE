import CustomElement from "../../element/CustomElement.js";
import TPL from "./ContextMenuItem.js.html" assert {type: "html"};
import STYLE from "./ContextMenuItem.js.css" assert {type: "css"};

export default class ContextMenuItem extends CustomElement {

    #infoEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#infoEl = this.shadowRoot.getElementById("info");
    }

    set info(val) {
        if (val != null) {
            this.setAttribute("info", val);
        } else {
            this.removeAttribute("info");
        }
    }

    get info() {
        return this.getAttribute("info") || "";
    }

    static get observedAttributes() {
        return ["info"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "info": {
                    if (newValue != null) {
                        this.#infoEl.innerHTML = newValue;
                    } else {
                        this.#infoEl.innerHTML = "";
                    }
                } break;
            }
        }
    }

}

customElements.define("emc-contextmenuitem", ContextMenuItem);
