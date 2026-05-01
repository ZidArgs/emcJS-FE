import CustomElement from "../element/CustomElement.js";
// import TPL from "./CloseSymbol.js.html" assert {type: "html"};
import STYLE from "./CloseSymbol.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class Symbol extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.innerHTML = "✖";
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

}

customElements.define("emc-symbol-close", Symbol);
