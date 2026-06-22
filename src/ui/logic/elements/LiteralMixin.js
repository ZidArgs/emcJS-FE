import AbstractElement from "../abstract/AbstractElement.js";
import AbstractLiteralValueElement from "../abstract/AbstractLiteralValueElement.js";
import TPL from "./LiteralMixin.js.html" assert {type: "html"};
import STYLE from "./LiteralMixin.js.css" assert {type: "css"};

const TPL_CAPTION = "MIXIN";
const REFERENCE = "mixin";

export default class LogicElement extends AbstractLiteralValueElement {

    #viewEl;

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.shadowRoot.getElementById("header").append(els);
        this.#viewEl = this.shadowRoot.getElementById("view");
        this.#viewEl.addEventListener("click", () => {
            const ev = new Event("viewlogic");
            ev.logic = this.ref;
            this.dispatchEvent(ev);
        });
    }

    calculate(opts) {
        const {execute} = AbstractElement.getCalculationOptions(opts);
        const value = execute(this.ref);
        this.logicResult = value;
        return value;
    }

}

AbstractElement.registerReference(REFERENCE, LogicElement);
customElements.define(`ootrt-logic-${REFERENCE}`, LogicElement);
