import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralStateElement from "../abstract/AbstractLiteralStateElement.js";
import STYLE from "./LiteralState.js.css" assert {type: "css"};

const TPL_CAPTION = "STATE";
const REFERENCE = "state";

export default class LiteralState extends AbstractLiteralStateElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

}

AbstractElement.registerReference(REFERENCE, LiteralState);
customElements.define(`emc-logic-${REFERENCE}`, LiteralState);
