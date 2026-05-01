import AbstractElement from "../abstract/AbstractElement.js";
import AbstractOneChildElement from "../abstract/AbstractOneChildElement.js";
import STYLE from "./OperatorNot.js.css" assert {type: "css"};

const TPL_CAPTION = "NOT";
const REFERENCE = "not";

export default class OperatorNot extends AbstractOneChildElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        let value;
        const ch = this.children;
        if (ch[0]) {
            const val = ch[0].calculate(state);
            value = +!val;
        }
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, OperatorNot);
customElements.define(`emc-logic-${REFERENCE}`, OperatorNot);
