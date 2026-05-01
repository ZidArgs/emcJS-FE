import LogicOperatorRegistry from "emcjs/data/registry/LogicOperatorRegistry.js";
import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractLiteralStateElement.js.html" assert {type: "html"};
import STYLE from "./AbstractLiteralStateElement.js.css" assert {type: "css"};

export default class AbstractLiteralStateElement extends AbstractElement {

    #inputEl;

    #refEl;

    #type;

    #options;

    constructor(type, caption) {
        super(caption);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.shadowRoot.getElementById("body").append(els);
        this.#type = type;
        this.#refEl = this.shadowRoot.getElementById("ref");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("change", () => {
            this.dispatchEvent(new Event("valuechange", {
                bubbles: true,
                cancelable: true
            }));
        });
    }

    getElement(forceCopy = false) {
        if (forceCopy || this.template) {
            const node = super.getElement(forceCopy);
            node.setOptions(this.#options);
            return node;
        } else {
            return this;
        }
    }

    set ref(val) {
        this.setAttribute("ref", val);
    }

    get ref() {
        return this.getAttribute("ref");
    }

    set value(value) {
        const optionEl = this.#inputEl.querySelector(`[value="${value}"]`);
        if (optionEl == null) {
            this.#addOption(value);
        }
        this.#inputEl.value = value;
    }

    get value() {
        return this.#inputEl.value;
    }

    setOptions(options) {
        this.#options = options;
        this.#inputEl.innerHTML = "";
        if (Array.isArray(options)) {
            for (const value of options) {
                this.#addOption(value);
            }
        } else {
            for (const value in options) {
                const label = options[value];
                this.#addOption(value, label);
            }
        }
    }

    #addOption(value, label) {
        if (typeof value === "string" && value !== "") {
            const optionEl = document.createElement("option");
            optionEl.value = value;
            if (typeof label === "string" && label !== "") {
                optionEl.label = label;
            } else {
                optionEl.label = value;
            }
            this.#inputEl.append(optionEl);
        }
    }

    calculate(state = {}) {
        if (state[this.ref] != null) {
            const val = +(state[this.ref] === this.value);
            this.logicResult = val;
            return val;
        } else {
            this.logicResult = 0;
            return 0;
        }
    }

    toJSON() {
        return {
            type: this.#type,
            ref: this.ref,
            value: this.value
        };
    }

    loadLogic(logic) {
        this.ref = logic.ref;
        const operatorConfig = LogicOperatorRegistry.getOperator(logic.ref);
        if (operatorConfig != null) {
            this.setOptions(operatorConfig.options);
        }
        this.value = logic.value;
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "ref",
            "value"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "disabled":
            case "template": {
                if (oldValue != newValue) {
                    if (this.editable) {
                        this.#inputEl.removeAttribute("disabled");
                    } else {
                        this.#inputEl.setAttribute("disabled", "true");
                    }
                }
            } break;
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
