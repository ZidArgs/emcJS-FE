import CustomFormElement from "../../../../../element/CustomFormElement.js";
import ImageBackgroundTypes from "../../../../../../enum/form/ImageBackgroundTypes.js";
import TPL from "./ImageSelectPreview.js.html" assert {type: "html"};
import STYLE from "./ImageSelectPreview.js.css" assert {type: "css"};

export default class ImageSelectPreview extends CustomFormElement {

    #imageEl;

    #textEl;

    #tooltipEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#imageEl = this.shadowRoot.getElementById("image");
        this.#textEl = this.shadowRoot.getElementById("text");
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
    }

    set text(value) {
        this.setAttribute("text", value);
    }

    get text() {
        return this.getAttribute("text");
    }

    set value(value) {
        this.setAttribute("value", value);
    }

    get value() {
        return this.getAttribute("value");
    }

    set background(value) {
        this.setEnumAttribute("background", value, ImageBackgroundTypes);
    }

    get background() {
        return this.getEnumAttribute("background");
    }

    static get observedAttributes() {
        return ["value", "text"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    this.#imageEl.style.backgroundImage = `url("${newValue}")`;
                }
            } break;
            case "text": {
                if (oldValue != newValue) {
                    this.#textEl.i18nValue = newValue;
                    this.#tooltipEl.i18nTooltip = newValue;
                }
            } break;
        }
    }

    get comparatorText() {
        return this.#textEl.innerText;
    }

    static create(value, label = value) {
        const el = new ImageSelectPreview();
        el.value = value;
        el.src = value;
        el.text = label;
        return el;
    }

}

customElements.define("emc-select-image-preview", ImageSelectPreview);
