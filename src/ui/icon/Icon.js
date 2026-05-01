import CustomElement from "../element/CustomElement.js";
import TPL from "./Icon.js.html" assert {type: "html"};
import STYLE from "./Icon.js.css" assert {type: "css"};

export default class Icon extends CustomElement {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    set src(val) {
        this.setAttribute("src", val);
    }

    get src() {
        return this.getAttribute("src");
    }

    static get observedAttributes() {
        return ["src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src" && oldValue != newValue) {
            this.#iconEl.style.backgroundImage = `url("${newValue}")`;
        }
    }

}

customElements.define("emc-icon", Icon);
