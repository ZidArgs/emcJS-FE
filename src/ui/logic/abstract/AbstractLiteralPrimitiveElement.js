import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractLiteralPrimitiveElement.js.html" assert {type: "html"};
import STYLE from "./AbstractLiteralPrimitiveElement.js.css" assert {type: "css"};

export default class AbstractLiteralPrimitiveElement extends AbstractElement {

    #valueEl;

    #type;

    constructor(type, caption) {
        super(caption);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.shadowRoot.getElementById("body").append(els);
        this.#type = type;
        this.#valueEl = this.shadowRoot.getElementById("value");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    get value() {
        return this.getAttribute("value");
    }

    calculate() {
        this.logicResult = this.value;
        return this.value;
    }

    toJSON() {
        return {
            type: this.#type,
            value: this.value
        };
    }

    loadLogic(logic) {
        this.value = logic.value;
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    if (typeof newValue === "string" && newValue !== "") {
                        this.#valueEl.innerText = newValue;
                    } else {
                        this.#valueEl.innerText = "";
                    }
                }
            } break;
        }
    }

}
