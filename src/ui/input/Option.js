import CustomElement from "../element/CustomElement.js";
import TPL from "./Option.js.html" assert {type: "html"};
import STYLE from "./Option.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class Option extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    get value() {
        return this.getAttribute("value");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    static createOption(value, content = value, style = {}) {
        const opt = document.createElement("emc-option");
        opt.setAttribute("value", value);
        if (content instanceof HTMLElement) {
            opt.append(content);
        } else {
            opt.innerHTML = content;
        }
        for (const i in style) {
            opt.style[i] = style[i];
        }
        return opt;
    }

}

customElements.define("emc-option", Option);
