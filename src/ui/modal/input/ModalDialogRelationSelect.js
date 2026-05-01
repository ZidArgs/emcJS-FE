import ModalDialog from "../ModalDialog.js";
import "../../form/button/Button.js";
import "../../form/element/select/relation/RelationSelect.js";
import TPL from "./ModalDialogRelationSelect.js.html" assert {type: "html"};
import STYLE from "./ModalDialogRelationSelect.js.css" assert {type: "css"};

export default class ModalDialogRelationSelect extends ModalDialog {

    #contentEl;

    #footerEl;

    #inputEl;

    #submitEl;

    #cancelEl;

    constructor(caption = "Select entity", options = {}) {
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#footerEl = this.shadowRoot.getElementById("footer");

        this.#inputEl = els.getElementById("input");
        this.#contentEl.append(this.#inputEl);

        this.#cancelEl = els.getElementById("cancel");
        this.#cancelEl.addEventListener("click", () => this.cancel());
        this.#footerEl.append(this.#cancelEl);

        this.#submitEl = els.getElementById("submit");
        this.#submitEl.addEventListener("click", () => this.submit());
        this.#footerEl.append(this.#submitEl);
    }

    async show(value) {
        this.#inputEl.value = value;
        return await super.show();
    }

    getSubmitValue() {
        return this.#inputEl.value;
    }

    set types(value) {
        this.#inputEl.types = value;
    }

    get types() {
        return this.#inputEl.types;
    }

    set sorted(value) {
        this.#inputEl.sorted = value;
    }

    get sorted() {
        return this.#inputEl.sorted;
    }

    get initialFocusElement() {
        return this.#inputEl;
    }

}

customElements.define("emc-modal-dialog-select-relation", ModalDialogRelationSelect);
