import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractLiteralValueElement.js.html" assert {type: "html"};
import STYLE from "./AbstractLiteralValueElement.js.css" assert {type: "css"};

export default class AbstractLiteralValueElement extends AbstractElement {

    #refEl;

    #type;

    constructor(type, caption) {
        super(caption);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.shadowRoot.getElementById("body").append(els);
        this.#type = type;
        this.#refEl = this.shadowRoot.getElementById("ref");
    }

    set ref(val) {
        this.setAttribute("ref", val);
    }

    get ref() {
        return this.getAttribute("ref");
    }

    calculate(state = {}) {
        if (state[this.ref] != null) {
            const val = +state[this.ref];
            this.logicResult = val;
            return val;
        }
        this.logicResult = 0;
        return 0;
    }

    toJSON() {
        return {
            type: this.#type,
            ref: this.ref
        };
    }

    loadLogic(logic) {
        this.ref = logic.ref;
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "ref"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "ref": {
                if (oldValue != newValue) {
                    if (typeof newValue === "string" && newValue !== "") {
                        this.#refEl.innerText = newValue;
                    } else {
                        this.#refEl.innerText = "";
                    }
                }
            } break;
        }
    }

}
