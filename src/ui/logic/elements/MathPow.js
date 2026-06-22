import AbstractElement from "../abstract/AbstractElement.js";
import AbstractTwoChildrenElement from "../abstract/AbstractTwoChildrenElement.js";
import STYLE from "./MathPow.js.css" assert {type: "css"};

const TPL_CAPTION = "POWER";
const REFERENCE = "pow";

export default class LogicElement extends AbstractTwoChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(opts) {
        let value;
        const ch = this.childList;
        if (ch[0] != null) {
            const val = ch[0].calculate(opts);
            const v = parseFloat(val);
            if (isNaN(v)) {
                this.logicResult = "NaN";
                return NaN;
            }
            value = v;
        }
        if (ch[1] != null) {
            const val = ch[1].calculate(opts);
            const v = parseFloat(val);
            if (isNaN(v)) {
                this.logicResult = "NaN";
                return NaN;
            }
            value = value ** v;
        }
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, LogicElement);
customElements.define(`emc-logic-${REFERENCE}`, LogicElement);
