import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import STYLE from "./OperatorOr.js.css" assert {type: "css"};

const TPL_CAPTION = "OR";
const REFERENCE = "or";

export default class LogicElement extends AbstractInfChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        const ch = this.childList.map((node) => node.calculate(state));
        for (const val of ch) {
            if (val) {
                this.logicResult = 1;
                return 1;
            }
        }
        this.logicResult = 0;
        return 0;
    }

}

AbstractElement.registerReference(REFERENCE, LogicElement);
customElements.define(`emc-logic-${REFERENCE}`, LogicElement);
