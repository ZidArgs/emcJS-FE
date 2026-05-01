import CustomElement from "../../element/CustomElement.js";
import "../../i18n/I18nTooltip.js";
import TPL from "./HamburgerButton.js.html" assert {type: "html"};
import STYLE from "./HamburgerButton.js.css" assert {type: "css"};

export default class HamburgerButton extends CustomElement {

    #tooltipEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
    }

    set open(val) {
        this.setBooleanAttribute("open", val);
    }

    get open() {
        return this.getBooleanAttribute("open");
    }

    set tooltip(val) {
        this.setAttribute("tooltip", val);
    }

    get tooltip() {
        return this.getAttribute("tooltip");
    }

    static get observedAttributes() {
        return ["tooltip"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "tooltip":
                    this.#tooltipEl.i18nTooltip = newValue;
                    break;
            }
        }
    }

}

customElements.define("emc-navbar-hamburger", HamburgerButton);
