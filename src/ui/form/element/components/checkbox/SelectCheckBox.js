import {isNull} from "emcjs/util/helper/CheckType.js";
import {isEqual} from "emcjs/util/helper/Comparator.js";
import CustomElementDelegating from "../../../../element/CustomElementDelegating.js";
import TPL from "./SelectCheckBox.js.html" assert {type: "html"};
import STYLE from "./SelectCheckBox.js.css" assert {type: "css"};

export default class SelectCheckBox extends CustomElementDelegating {

    #value = false;

    #checkboxEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#checkboxEl = this.shadowRoot.getElementById("checkbox");
        this.#checkboxEl.addEventListener("click", () => {
            this.click();
        });
        this.#checkboxEl.addEventListener("keydown", (event) => {
            if (!this.readOnly) {
                const {key} = event;
                if (key === " ") {
                    this.click();
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        });
    }

    click() {
        if (this.#value === false) {
            this.#value = true;
        } else {
            this.#value = false;
        }
        this.#renderValue();
        this.dispatchEvent(new Event("change"));
    }

    set value(value) {
        if (!isNull(value)) {
            value = !!value;
        }
        if (!isEqual(this.value, value)) {
            this.#value = value;
            this.#renderValue();
        }
    }

    get value() {
        return this.#value;
    }

    set readOnly(value) {
        this.setBooleanAttribute("readonly", value);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    set disabled(value) {
        this.setBooleanAttribute("disabled", value);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    #renderValue() {
        if (this.#value == null) {
            this.#checkboxEl.classList.remove("checked");
            this.#checkboxEl.classList.add("indeterminate");
        } else if (!this.#value) {
            this.#checkboxEl.classList.remove("checked");
            this.#checkboxEl.classList.remove("indeterminate");
        } else {
            this.#checkboxEl.classList.add("checked");
            this.#checkboxEl.classList.remove("indeterminate");
        }
    }

}

customElements.define("emc-select-checkbox", SelectCheckBox);
