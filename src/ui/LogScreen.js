import CustomElement from "./element/CustomElement.js";
import TPL from "./LogScreen.js.html" assert {type: "html"};
import STYLE from "./LogScreen.js.css" assert {type: "css"};

export default class LogScreen extends CustomElement {

    #titleEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#titleEl = this.shadowRoot.getElementById("title");
    }

    set title(value) {
        this.setAttribute("title", value);
    }

    get title() {
        return this.getAttribute("title");
    }

    static get observedAttributes() {
        return ["title"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "title":
                if (oldValue != newValue) {
                    this.#titleEl.innerText = newValue;
                }
                break;
        }
    }

}

customElements.define("emc-logscreen", LogScreen);
