import FormContext from "../../util/form/context/FormContext.js";
import FormBuilder from "../../util/form/FormBuilder.js";
import ModalDialog from "./ModalDialog.js";
import "../form/button/Button.js";
import TPL from "./ModalFormDialog.js.html" assert {type: "html"};
import STYLE from "./ModalFormDialog.js.css" assert {type: "css"};

export default class ModalFormDialog extends ModalDialog {

    #contentEl;

    #formContainerEl;

    #formEl;

    #initialFocusElement = null;

    #formContext = new FormContext();

    constructor(caption, options = {}) {
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#formContainerEl = els.getElementById("form-container");
        this.#formContext.registerFormContainer(this.#formContainerEl);
        this.#contentEl.append(this.#formContainerEl);
        this.#formEl = this.shadowRoot.getElementById("form");

        this.#formContext.addEventListener("submit", () => {
            super.submit();
        });
    }

    async show(data = {}) {
        this.#formContext.setDataFlat(data);
        return await super.show();
    }

    getSubmitValue() {
        return this.#formContext.getDataFlat();
    }

    submit() {
        this.#formContext.submit();
    }

    initialFocus() {
        const formEls = this.#formContainerEl.getFocusableElements();
        if (formEls.length) {
            formEls[0].focus();
        } else {
            super.initialFocus();
        }
    }

    set initialFocusElement(value) {
        if (value instanceof HTMLElement) {
            this.#initialFocusElement = value;
        } else {
            this.#initialFocusElement = null;
        }
    }

    get initialFocusElement() {
        return this.#initialFocusElement;
    }

    loadFormConfig(config, defaultValues) {
        FormBuilder.replaceForm(this.#formEl, config, defaultValues);
    }

}

customElements.define("emc-modal-form-dialog", ModalFormDialog);
