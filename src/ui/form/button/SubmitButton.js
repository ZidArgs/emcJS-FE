import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import {registerFocusable} from "../../../util/element/ElementFocusManager.js";
import Button from "./Button.js";
import STYLE from "./SubmitButton.js.css" assert {type: "css"};

export default class SubmitButton extends Button {

    #buttonEl;

    #textEl;

    constructor() {
        super();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.setAttribute("type", "submit");
        this.#textEl = this.shadowRoot.getElementById("text");
        this.#textEl.i18nValue = "Submit";
    }

    clickHandler(event) {
        if (super.clickHandler(event)) {
            if (this.form != null) {
                this.form.requestSubmit();
            }
            return true;
        }
        return false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "text" && !isStringNotEmpty(newValue)) {
            newValue = "Submit";
        }
        super.attributeChangedCallback?.(name, oldValue, newValue);
    }

}

customElements.define("emc-button-submit", SubmitButton);
registerFocusable("emc-button-submit");
