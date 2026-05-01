import AbstractElement from "../abstract/AbstractElement.js";
import AbstractTwoChildrenElement from "../abstract/AbstractTwoChildrenElement.js";
import STYLE from "./ComparatorLessThanEqual.js.css" assert {type: "css"};

const TPL_CAPTION = "LTE (<=)";
const REFERENCE = "lte";

export default class ComparatorLessThanEqual extends AbstractTwoChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        let value;
        const ch = this.childList;
        if (ch[0] != null) {
            const val = ch[0].calculate(state);
            value = val;
        }
        if (ch[1] != null) {
            const val = ch[1].calculate(state);
            value = value <= val;
        }
        value = +!!value;
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, ComparatorLessThanEqual);
customElements.define(`emc-logic-${REFERENCE}`, ComparatorLessThanEqual);
