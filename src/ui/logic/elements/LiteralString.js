import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralPrimitiveElement from "../abstract/AbstractLiteralPrimitiveElement.js";
import STYLE from "./LiteralValue.js.css" assert {type: "css"};

const TPL_CAPTION = "STRING";
const REFERENCE = "string";

export default class LiteralString extends AbstractLiteralPrimitiveElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate() {
        return this.value;
    }

}

AbstractElement.registerReference(REFERENCE, LiteralString);
customElements.define(`emc-logic-${REFERENCE}`, LiteralString);
