import CustomElement from "./element/CustomElement.js";
import TPL from "./Paging.js.html" assert {type: "html"};
import STYLE from "./Paging.js.css" assert {type: "css"};

export default class Paging extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    get active() {
        return this.getAttribute("active");
    }

    set active(val) {
        this.setAttribute("active", val);
    }

    static get observedAttributes() {
        return ["active"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "active":
                if (oldValue != newValue) {
                    if (typeof newValue == "string") {
                        this.shadowRoot.getElementById("container").name = newValue;
                    }
                }
                break;
        }
    }

}

customElements.define("emc-paging", Paging);
