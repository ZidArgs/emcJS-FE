import AbstractElement from "../abstract/AbstractElement.js";
import STYLE from "./LiteralTrue.js.css" assert {type: "css"};

const TPL_CAPTION = "TRUE";
const REFERENCE = "true";

export default class LiteralTrue extends AbstractElement {

    constructor() {
        super(TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(/* state = {} */) {
        this.logicResult = 1;
        return 1;
    }

    toJSON() {
        return {type: REFERENCE};
    }

    loadLogic(/* logic */) {}

}

AbstractElement.registerReference(REFERENCE, LiteralTrue);
customElements.define(`emc-logic-${REFERENCE}`, LiteralTrue);
