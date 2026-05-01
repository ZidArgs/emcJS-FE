import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import STYLE from "./OperatorNor.js.css" assert {type: "css"};

const TPL_CAPTION = "NOR";
const REFERENCE = "nor";

export default class OperatorNor extends AbstractInfChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        const ch = this.childList.map((node) => node.calculate(state));
        for (const val of ch) {
            if (val) {
                this.logicResult = 0;
                return 0;
            }
        }
        this.logicResult = 1;
        return 1;
    }

}

AbstractElement.registerReference(REFERENCE, OperatorNor);
customElements.define(`emc-logic-${REFERENCE}`, OperatorNor);
