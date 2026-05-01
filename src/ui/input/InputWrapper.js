import CustomElement from "../element/CustomElement.js";
import TPL from "./InputWrapper.js.html" assert {type: "html"};
import STYLE from "./InputWrapper.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class InputWrapper extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

}

customElements.define("emc-input-wrapper", InputWrapper);
