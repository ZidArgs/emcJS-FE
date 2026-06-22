import AbstractElement from "../abstract/AbstractElement.js";
import AbstractTwoChildrenElement from "../abstract/AbstractTwoChildrenElement.js";
import STYLE from "./ComparatorNotEqual.js.css" assert {type: "css"};

const TPL_CAPTION = "NEQ (!=)";
const REFERENCE = "neq";

export default class ComparatorNotEqual extends AbstractTwoChildrenElement {

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        STYLE.apply(this.shadowRoot);
    }

    calculate(opts) {
        let value;
        const ch = this.childList;
        if (ch[0] != null) {
            const val = ch[0].calculate(opts);
            value = val;
        }
        if (ch[1] != null) {
            const val = ch[1].calculate(opts);
            value = value != val;
        }
        value = !!value;
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, ComparatorNotEqual);
customElements.define(`emc-logic-${REFERENCE}`, ComparatorNotEqual);
