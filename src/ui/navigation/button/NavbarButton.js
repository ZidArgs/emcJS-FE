import CustomElement from "../../element/CustomElement.js";
import "../../i18n/I18nLabel.js";
import "../../i18n/I18nTooltip.js";
import TPL from "./NavbarButton.js.html" assert {type: "html"};
import STYLE from "./NavbarButton.js.css" assert {type: "css"};

const EXPANDABLE_VALUES = ["down", "right"];

export default class NavbarButton extends CustomElement {

    #tooltipEl;

    #labelEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
        this.#labelEl = this.shadowRoot.getElementById("label");
    }

    set expands(val) {
        this.setEnumAttribute("expands", val, EXPANDABLE_VALUES);
    }

    get expands() {
        return this.getEnumAttribute("expands");
    }

    set content(val) {
        this.setAttribute("content", val);
    }

    get content() {
        return this.getAttribute("content");
    }

    set tooltip(val) {
        this.setAttribute("tooltip", val);
    }

    get tooltip() {
        return this.getAttribute("tooltip");
    }

    static get observedAttributes() {
        return ["content", "tooltip"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "content":
                    this.#labelEl.i18nValue = newValue;
                    break;
                case "tooltip":
                    this.#tooltipEl.i18nTooltip = newValue;
                    break;
            }
        }
    }

}

customElements.define("emc-navbar-button", NavbarButton);
