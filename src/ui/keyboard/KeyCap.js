import CustomElement from "../element/CustomElement.js";
import TPL from "./KeyCap.js.html" assert {type: "html"};
import STYLE from "./KeyCap.js.css" assert {type: "css"};

export default class KeyCap extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
    }

}

customElements.define("emc-keycap", KeyCap);
