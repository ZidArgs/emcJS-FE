import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractLiteralParamElement.js.html" assert {type: "html"};
import STYLE from "./AbstractLiteralParamElement.js.css" assert {type: "css"};

export default class AbstractLiteralParamElement extends AbstractElement {

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

    calculate() {
        return this.ref;
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
                    this.#refEl.innerText = newValue;
                }
            } break;
        }
    }

}
