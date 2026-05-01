import CustomElement from "../element/CustomElement.js";
// import TPL from "./ChevronDownSymbol.js.html" assert {type: "html"};
import STYLE from "./ChevronDownSymbol.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class Symbol extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.innerHTML = "▼";
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

}

customElements.define("emc-symbol-chevron-down", Symbol);
