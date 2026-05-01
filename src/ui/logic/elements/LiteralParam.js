import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralParamElement from "../abstract/AbstractLiteralParamElement.js";
import STYLE from "./LiteralParam.js.css" assert {type: "css"};

const TPL_CAPTION = "PARAM";
const REFERENCE = "param";

export default class LiteralParam extends AbstractLiteralParamElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

}

AbstractElement.registerReference(REFERENCE, LiteralParam);
customElements.define(`emc-logic-${REFERENCE}`, LiteralParam);
