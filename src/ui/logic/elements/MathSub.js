import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import STYLE from "./MathSub.js.css" assert {type: "css"};

const TPL_CAPTION = "SUBSTRACT";
const REFERENCE = "sub";

export default class MathSub extends AbstractInfChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        const ch = this.childList.map((node) => node.calculate(state));
        let value = ch.shift() ?? 0;
        for (const val of ch) {
            const v = parseFloat(val);
            if (isNaN(v)) {
                this.logicResult = "NaN";
                return 0;
            }
            value -= v;
        }
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, MathSub);
customElements.define(`emc-logic-${REFERENCE}`, MathSub);
