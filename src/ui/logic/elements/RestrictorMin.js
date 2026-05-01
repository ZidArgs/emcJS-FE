import AbstractElement from "../abstract/AbstractElement.js";
import AbstractRestrictorElement from "../abstract/AbstractRestrictorElement.js";
import STYLE from "./RestrictorMin.js.css" assert {type: "css"};

const TPL_CAPTION = "MIN";
const REFERENCE = "min";

export default class RestrictorMin extends AbstractRestrictorElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(state = {}) {
        let value;
        const ch = this.childList;
        if (ch[0]) {
            const val = ch[0].calculate(state);
            const v = parseFloat(val);
            if (isNaN(v)) {
                this.logicResult = "NaN";
                return 0;
            }
            value = +(v >= this.value);
        }
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, RestrictorMin);
customElements.define(`emc-logic-${REFERENCE}`, RestrictorMin);
