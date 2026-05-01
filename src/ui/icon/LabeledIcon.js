import CustomElement from "../element/CustomElement.js";
import HorizontalAlign from "../../enum/HorizontalAlign.js";
import VerticalAlign from "../../enum/VerticalAlign.js";
import TPL from "./LabeledIcon.js.html" assert {type: "html"};
import STYLE from "./LabeledIcon.js.css" assert {type: "css"};

function getAlign(value) {
    switch (value) {
        case "start":
            return "flex-start";
        case "end":
            return "flex-end";
        default:
            return "center";
    }
}

export default class LabeledIcon extends CustomElement {

    #iconEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#iconEl = this.shadowRoot.getElementById("icon");
    }

    get src() {
        return this.getAttribute("src");
    }

    set src(val) {
        this.setAttribute("src", val);
    }

    get text() {
        return this.getAttribute("text");
    }

    set text(val) {
        this.setAttribute("text", val);
    }

    set halign(value) {
        this.setEnumAttribute("halign", value, HorizontalAlign);
    }

    get halign() {
        return this.getEnumAttribute("halign");
    }

    set valign(value) {
        this.setEnumAttribute("valign", value, VerticalAlign);
    }

    get valign() {
        return this.getEnumAttribute("valign");
    }

    static get observedAttributes() {
        return [
            "src",
            "text",
            "halign",
            "valign"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "src":
                    this.#iconEl.style.backgroundImage = `url("${newValue}")`;
                    break;
                case "text":
                    this.#iconEl.innerHTML = newValue;
                    break;
                case "halign":
                    this.#iconEl.style.justifyContent = getAlign(newValue);
                    break;
                case "valign":
                    this.#iconEl.style.alignItems = getAlign(newValue);
                    break;
            }
        }
    }

}

customElements.define("emc-labeledicon", LabeledIcon);
