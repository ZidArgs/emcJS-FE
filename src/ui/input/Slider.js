import CustomElement from "../element/CustomElement.js";
import TPL from "./Slider.js.html" assert {type: "html"};
import STYLE from "./Slider.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class Slider extends CustomElement {

    #sliderEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#sliderEl = this.shadowRoot.getElementById("slider");
        this.#sliderEl.addEventListener("change", (event) => {
            const value = parseInt(this.#sliderEl.value);
            this.setAttribute("value", value);
            const ev = new Event("change");
            ev.value = value;
            this.dispatchEvent(ev);
            event.stopPropagation();
        });
        this.#sliderEl.addEventListener("input", (event) => {
            const value = parseInt(this.#sliderEl.value);
            this.setAttribute("value", value);
            const ev = new Event("input");
            ev.value = value;
            this.dispatchEvent(ev);
            event.stopPropagation();
        });
    }

    get min() {
        return this.getAttribute("min");
    }

    set min(val) {
        this.setAttribute("min", val);
    }

    get max() {
        return this.getAttribute("max");
    }

    set max(val) {
        this.setAttribute("max", val);
    }

    get value() {
        return this.getAttribute("value");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    static get observedAttributes() {
        return [
            "min",
            "max",
            "value"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "min": {
                    this.#sliderEl.min = newValue;
                } break;
                case "max": {
                    this.#sliderEl.max = newValue;
                } break;
                case "value": {
                    this.#sliderEl.value = newValue;
                } break;
            }
        }
    }

}

customElements.define("emc-slider", Slider);
