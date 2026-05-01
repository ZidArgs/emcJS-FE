import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralValueElement from "../abstract/AbstractLiteralValueElement.js";
import STYLE from "./LiteralValue.js.css" assert {type: "css"};

const TPL_CAPTION = "VALUE";
const REFERENCE = "value";

export default class LiteralValue extends AbstractLiteralValueElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

}

AbstractElement.registerReference(REFERENCE, LiteralValue);
customElements.define(`emc-logic-${REFERENCE}`, LiteralValue);
