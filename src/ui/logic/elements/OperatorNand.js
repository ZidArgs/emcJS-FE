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

    calculate(opts) {
        const ch = this.childList.map((node) => node.calculate(opts));
        for (const val of ch) {
            if (!val) {
                this.logicResult = true;
                return true;
            }
        }
        this.logicResult = false;
        return false;
    }

}

AbstractElement.registerReference(REFERENCE, OperatorNand);
customElements.define(`emc-logic-${REFERENCE}`, OperatorNand);
