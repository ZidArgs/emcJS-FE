import CustomElement from "../element/CustomElement.js";
import TPL from "./ProgressBar.js.html" assert {type: "html"};
import STYLE from "./ProgressBar.js.css" assert {type: "css"};

export default class ProgressBar extends CustomElement {

    #progressEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#progressEl = this.shadowRoot.getElementById("progress");
    }

    set min(value) {
        this.setNumberAttribute("min", value);
    }

    get min() {
        return this.getNumberAttribute("min") ?? 0;
    }

    set max(value) {
        this.setNumberAttribute("max", value);
    }

    get max() {
        return this.getNumberAttribute("max") ?? 100;
    }

    set value(value) {
        this.setNumberAttribute("value", value);
    }

    get value() {
        return this.getNumberAttribute("value") ?? 0;
    }

    set animated(value) {
        this.setBooleanAttribute("animated", value);
    }

    get animated() {
        return this.getBooleanAttribute("animated");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "min",
            "max",
            "value"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "min":
            case "max":
            case "value": {
                if (oldValue != newValue) {
                    this.#updateValue();
                }
            } break;
        }
    }

    #updateValue() {
        const min = this.min;
        const max = this.max;
        const value = this.value;
        if (value < min) {
            this.#progressEl.style.setProperty("--value", 0);
        } else if (value > max) {
            this.#progressEl.style.setProperty("--value", 100);
        } else {
            const length = max - min;
            if (length <= 0) {
                if (value <= 0) {
                    this.#progressEl.style.setProperty("--value", 0);
                } else {
                    this.#progressEl.style.setProperty("--value", 100);
                }
            } else {
                const pos = 100 / length * (value - min);
                this.#progressEl.style.setProperty("--value", pos);
            }
        }
    }

}

customElements.define("emc-progressbar", ProgressBar);
