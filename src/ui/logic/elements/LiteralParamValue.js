import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralParamElement from "../abstract/AbstractLiteralParamElement.js";
import STYLE from "./LiteralParamValue.js.css" assert {type: "css"};

const TPL_CAPTION = "PARAM-VALUE";
const REFERENCE = "paramvalue";

export default class LiteralParamValue extends AbstractLiteralParamElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

}

AbstractElement.registerReference(REFERENCE, LiteralParamValue);
customElements.define(`emc-logic-${REFERENCE}`, LiteralParamValue);
