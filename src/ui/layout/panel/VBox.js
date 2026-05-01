import CustomElement from "../../element/CustomElement.js";
import TPL from "./VBox.js.html" assert {type: "html"};
import STYLE from "./VBox.js.css" assert {type: "css"};

export default class VBox extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    load() {
        for (const ch of this.children) {
            if (typeof ch.load === "function") {
                ch.load();
            }
        }
    }

    unload() {
        for (const ch of this.children) {
            if (typeof ch.unload === "function") {
                ch.unload();
            }
        }
    }

}

customElements.define("emc-panel-vbox", VBox);
