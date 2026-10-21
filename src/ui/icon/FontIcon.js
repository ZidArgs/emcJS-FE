import CustomElement from "../element/CustomElement.js";
import IconStyleMixin from "../mixin/IconStyleMixin.js";
import TPL from "./FontIcon.js.html" assert {type: "html"};
import STYLE from "./FontIcon.js.css" assert {type: "css"};

export default class FontIcon extends IconStyleMixin(CustomElement) {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    set icon(val) {
        this.setAttribute("icon", val);
    }

    get icon() {
        return this.getAttribute("icon");
    }

    set bold(val) {
        this.setBooleanAttribute("bold", val);
    }

    get bold() {
        return this.getBooleanAttribute("bold");
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
