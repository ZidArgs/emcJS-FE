import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import STYLE from "./MathAdd.js.css" assert {type: "css"};

const TPL_CAPTION = "ADD";
const REFERENCE = "add";

export default class MathAdd extends AbstractInfChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(opts) {
        const ch = this.childList.map((node) => node.calculate(opts));
        let value = ch.shift() ?? 0;
        for (const val of ch) {
            const v = parseFloat(val);
            if (isNaN(v)) {
                this.logicResult = "NaN";
                return v;
            }
            value += v;
        }
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, MathAdd);
customElements.define(`emc-logic-${REFERENCE}`, MathAdd);
