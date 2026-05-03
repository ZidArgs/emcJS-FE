
import CustomElement from "../element/CustomElement.js";
import ChildlistMutationObserverMixin from "../mixin/ChildlistMutationObserverMixin.js";
import "./Option.js";
import TPL from "./ChoiceSelect.js.html" assert {type: "html"};
import STYLE from "./ChoiceSelect.js.css" assert {type: "css"};
import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";

/**
 * @deprecated
 */
export default class ChoiceSelect extends ChildlistMutationObserverMixin(CustomElement) {

    #eventManager = new EventMultiTargetManager();

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#eventManager.set("click", (event) => {
            this.#clickOption(event);
        });
    }

    #clickOption(event) {
        if (!this.readOnly) {
            const value = event.currentTarget.value;
            if (this.multiple) {
                const arr = this.value;
                const set = new Set(arr);
                if (set.has(value)) {
                    set.delete(value);
                } else {
                    set.add(value);
                }
                this.value = Array.from(set);
            } else {
                this.value = value;
            }
        }
    }

    connectedCallback() {
        const all = this.querySelectorAll("[value]");
        if (!this.value && !!all.length) {
            this.value = all[0].value;
        }
        for (const element of all) {
            if (element.getAttribute("value") != null) {
                this.#eventManager.addTarget(element);
            }
        }
        this.calculateItems();
    }

    disconnectedCallback() {
        this.#eventManager.clearTargets();
    }

    nodeAddedCallback(element) {
        if (element.getAttribute("value") != null) {
            this.#eventManager.addTarget(element);
        }
    }

    nodeRemovedCallback(element) {
        this.#eventManager.removeTarget(element);
    }

    serialize() {
        const res = {};
        const all = this.querySelectorAll(`[value]`);
        for (const element of all) {
            const value = element.getAttribute("value");
            if (value != null) {
                res[value] = element.classList.contains("active");
            }
        }
        return res;
    }

    deserialize(values) {
        const res = [];
        for (const key in values) {
            if (values[key]) {
                res.push(key);
            }
        }
        this.value = res;
    }

    set value(val) {
        if (val != null) {
            if (this.multiple) {
                if (!Array.isArray(val)) {
                    val = [val];
                }
                val = JSON.stringify(val);
            } else if (Array.isArray(val)) {
                val = val[0];
            }
            this.setAttribute("value", val);
        } else {
            this.removeAttribute("value");
        }
    }

    get value() {
        let val = this.getAttribute("value");
        if (this.multiple) {
            if (val != null) {
                val = jsonParseSafe(val) ?? [];
            } else {
                val = [];
            }
        }
        return val;
    }

    set multiple(val) {
        this.setAttribute("multiple", val);
    }

    get multiple() {
        return this.getAttribute("multiple") == "true";
    }

    set readOnly(val) {
        this.setAttribute("readonly", val);
    }

    get readOnly() {
        const val = this.getAttribute("readonly");
        return !!val && val != "false";
    }

    static get observedAttributes() {
        return ["value", "multiple"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value":
                if (oldValue != newValue) {
                    this.calculateItems();
                    const event = new Event("change");
                    event.oldValue = oldValue;
                    event.newValue = newValue;
                    event.value = newValue;
                    this.dispatchEvent(event);
                }
                break;
            case "multiple":
                if (oldValue != newValue) {
                    if (newValue != "true") {
                        const arr = jsonParseSafe(this.getAttribute("value")) ?? [];
                        if (arr.length > 1) {
                            this.value = arr[0];
                        }
                    } else {
                        const val = this.getAttribute("value");
                        if (val != null) {
                            this.value = [val];
                        } else {
                            this.value = [];
                        }
                    }
                }
                break;
        }
    }

    calculateItems() {
        const all = this.querySelectorAll("[value]");
        for (const element of all) {
            element.classList.remove("active");
        }
        if (this.multiple) {
            for (const value of this.value) {
                const el = this.querySelector(`[value="${value}"]`);
                el.classList.add("active");
            }
        } else {
            const el = this.querySelector(`[value="${this.value ?? ""}"]`);
            if (el) {
                el.classList.add("active");
            }
        }
    }

}

customElements.define("emc-choiceselect", ChoiceSelect);
