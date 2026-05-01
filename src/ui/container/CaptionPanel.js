import CustomElement from "../element/CustomElement.js";
import TPL from "./CaptionPanel.js.html" assert {type: "html"};
import STYLE from "./CaptionPanel.js.css" assert {type: "css"};

export default class CaptionPanel extends CustomElement {

    #titleEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#titleEl = this.shadowRoot.getElementById("title");
    }

    get caption() {
        return this.getAttribute("caption");
    }

    set caption(val) {
        this.setAttribute("caption", val);
    }

    static get observedAttributes() {
        return ["caption"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "caption":
                if (oldValue != newValue) {
                    this.#titleEl.innerHTML = newValue;
                }
                break;
        }
    }

}

customElements.define("emc-captionpanel", CaptionPanel);
