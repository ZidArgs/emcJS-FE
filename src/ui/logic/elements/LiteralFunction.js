
import {deepClone} from "@emcjs/core/util/helper/DeepClone.js";
import EdgeLogicCompiler from "@emcjs/logic/compiler/EdgeLogicCompiler.js";
import AbstractElement from "../abstract/AbstractElement.js";
import AbstractInfChildrenElement from "../abstract/AbstractInfChildrenElement.js";
import TPL from "./LiteralFunction.js.html" assert {type: "html"};
import STYLE from "./LiteralFunction.js.css" assert {type: "css"};

const TPL_CAPTION = "FUNCTION";
const REFERENCE = "function";

export default class LogicElement extends AbstractInfChildrenElement {

    #params = [];

    #viewEl;

    #refEl;

    constructor() {
        super(REFERENCE, TPL_CAPTION);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#viewEl = els.getElementById("view");
        this.shadowRoot.getElementById("header").append(this.#viewEl);
        this.#viewEl.addEventListener("click", () => {
            const ev = new Event("viewlogic");
            ev.logic = this.ref;
            this.dispatchEvent(ev);
        });
        /* --- */
        this.#refEl = els.getElementById("ref");
        this.shadowRoot.getElementById("body").prepend(this.#refEl);
    }

    set ref(val) {
        this.setAttribute("ref", val);
    }

    get ref() {
        return this.getAttribute("ref");
    }

    calculate(opts) {
        const {
            valueGetter,
            execute
        } = AbstractElement.getCalculationOptions(opts);

        function functionParams(params) {
            if (!Array.isArray(params)) {
                return [];
            }
            const escapedParams = [];
            for (const value of params) {
                const statement = EdgeLogicCompiler.compile(value);
                const buildValue = statement.execute(valueGetter, execute);
                escapedParams.push(buildValue);
            }
            return escapedParams;
        }

        const value = execute(this.ref, functionParams(this.#params));
        this.logicResult = value;
        return value;
    }

    toJSON() {
        const res = super.toJSON();
        return {
            type: res.type,
            ref: this.ref,
            params: res.content
        };
    }

    loadLogic(logic) {
        this.ref = logic.ref;
        if (!!logic && Array.isArray(logic.params)) {
            this.#params = deepClone(logic.params);
            logic.params.forEach((ch) => {
                if (ch) {
                    const node = AbstractElement.buildLogic(ch);
                    this.append(node);
                }
            });
        } else {
            this.#params = [];
        }
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

AbstractElement.registerReference(REFERENCE, LogicElement);
customElements.define(`ootrt-logic-${REFERENCE}`, LogicElement);
