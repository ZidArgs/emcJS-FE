import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import STYLE from "./OperatorNand.js.css" assert {type: "css"};

const TPL_CAPTION = "NAND";
const REFERENCE = "nand";

export default class OperatorNand extends AbstractInfChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        const ch = this.childList.map((ndoe) => ndoe.calculate(state));
        for (const val of ch) {
            if (!val) {
                this.logicResult = 1;
                return 1;
            }
        }
        this.logicResult = 0;
        return 0;
    }

}

AbstractElement.registerReference(REFERENCE, OperatorNand);
customElements.define(`emc-logic-${REFERENCE}`, OperatorNand);
