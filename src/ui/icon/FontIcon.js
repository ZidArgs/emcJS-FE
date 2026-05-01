import CustomElement from "../element/CustomElement.js";
import TPL from "./FontIcon.js.html" assert {type: "html"};
import STYLE from "./FontIcon.js.css" assert {type: "css"};
import FONT_STYLE from "../../_style/emcjs-icons-codes.css" assert {type: "css"};

export default class FontIcon extends CustomElement {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        FONT_STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    get icon() {
        return this.getAttribute("icon");
    }

    set icon(val) {
        this.setAttribute("icon", val);
    }

    static get observedAttributes() {
        return ["icon"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "icon" && oldValue != newValue) {
            this.#iconEl.className = `icon-${newValue}`;
        }
    }

}

customElements.define("emc-font-icon", FontIcon);
