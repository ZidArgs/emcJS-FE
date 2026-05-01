import CustomElement from "../element/CustomElement.js";
import FontawesomeMixin from "../mixin/FontawesomeMixin.js";
import TPL from "./FAIcon.js.html" assert {type: "html"};
import STYLE from "./FAIcon.js.css" assert {type: "css"};

export default class FAIcon extends FontawesomeMixin(CustomElement) {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    get type() {
        return this.getAttribute("type");
    }

    set type(val) {
        this.setAttribute("type", val);
    }

    get icon() {
        return this.getAttribute("icon");
    }

    set icon(val) {
        this.setAttribute("icon", val);
    }

    static get observedAttributes() {
        return ["type", "icon"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "type" || name === "icon") && oldValue != newValue) {
            const type = this.type;
            const icon = this.icon;
            this.#iconEl.className = `fa-${type} fa-${icon}`;
        }
    }

}

customElements.define("emc-fa-icon", FAIcon);
