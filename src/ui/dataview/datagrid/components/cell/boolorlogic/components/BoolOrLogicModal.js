import ModalDialog from "../../../../../../modal/ModalDialog.js";
import "../../../../../../form/button/Button.js";
import "../../../../../../form/element/input/boolorlogic/BoolOrLogicInput.js";
import TPL from "./BoolOrLogicModal.js.html" assert {type: "html"};
import STYLE from "./BoolOrLogicModal.js.css" assert {type: "css"};

export default class BoolOrLogicModal extends ModalDialog {

    #contentEl;

    #inputEl;

    constructor(caption, options = {}) {
        if (typeof caption === "string" && caption !== "") {
            caption = `Edit logic: ${caption}`;
        } else {
            caption = "Edit logic";
        }
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#inputEl = els.getElementById("input");
        this.#contentEl.append(this.#inputEl);
    }

    async show(value) {
        this.#inputEl.value = value;
        return await super.show(value);
    }

    getSubmitValue() {
        return this.#inputEl.value;
    }

    set caption(value) {
        if (typeof value === "string" && value !== "") {
            super.caption = `Edit logic: ${value}`;
        } else {
            super.caption = "Edit logic";
        }
    }

    get caption() {
        return super.caption;
    }

    set name(value) {
        this.#inputEl.name = value;
    }

    get name() {
        return this.#inputEl.name;
    }

    set nullable(value) {
        this.#inputEl.nullable = value;
        this.#inputEl.required = !value;
    }

    get nullable() {
        return this.#inputEl.nullable;
    }

    addOperatorGroup(...groupList) {
        this.#inputEl.addOperatorGroup(...groupList);
    }

    removeOperatorGroup(...groupList) {
        this.#inputEl.removeOperatorGroup(...groupList);
    }

}

customElements.define("emc-input-boolorlogic-modal", BoolOrLogicModal);
