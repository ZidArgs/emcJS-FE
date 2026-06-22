import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralPrimitiveElement from "../abstract/AbstractLiteralPrimitiveElement.js";
import STYLE from "./LiteralValue.js.css" assert {type: "css"};

const TPL_CAPTION = "NUMBER";
const REFERENCE = "number";

export default class LiteralNumber extends AbstractLiteralPrimitiveElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate() {
        return parseFloat(this.value);
    }

}

AbstractElement.registerReference(REFERENCE, LiteralNumber);
customElements.define(`emc-logic-${REFERENCE}`, LiteralNumber);
