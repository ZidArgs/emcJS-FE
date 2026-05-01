import ModalDialog from "../ModalDialog.js";
import Toast from "../../overlay/message/Toast.js";
import "../../form/button/Button.js";
import "../../form/element/input/code/CodeInput.js";
import TPL from "./ModalDialogCodeInput.js.html" assert {type: "html"};
import STYLE from "./ModalDialogCodeInput.js.css" assert {type: "css"};

export default class ModalDialogCodeInput extends ModalDialog {

    #contentEl;

    #footerEl;

    #inputEl;

    #errorEl;

    #copyEl;

    #pasteEl;

    #submitEl;

    #cancelEl;

    constructor(caption = "Code Input", options = {}) {
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        this.setIcon({
            type: "font",
            content: "code"
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#footerEl = this.shadowRoot.getElementById("footer");
        this.#submitEl = this.shadowRoot.getElementById("submit");
        this.#cancelEl = this.shadowRoot.getElementById("cancel");

        this.#inputEl = els.getElementById("input");
        this.#errorEl = els.getElementById("error");
        this.#inputEl.addEventListener("validity", (event) => {
            const {message} = event;
            this.#errorEl.innerHTML = message;
        });
        this.#errorEl.addEventListener("click", () => {
            this.#inputEl.focus();
        });
        this.#contentEl.append(this.#inputEl);
        this.#contentEl.append(this.#errorEl);

        this.#pasteEl = els.getElementById("paste");
        this.#pasteEl.addEventListener("click", async (event) => {
            if (!this.#inputEl.readOnly) {
                event.stopPropagation();
                event.preventDefault();
                try {
                    this.#inputEl.value = await navigator.clipboard.readText();
                    this.#inputEl.dispatchEvent(new Event("input"));
                    Toast.success("pasted from clipboard");
                } catch {
                    Toast.error("could not paste from clipboard");
                }
            }
        });
        this.#footerEl.prepend(this.#pasteEl);

        this.#copyEl = els.getElementById("copy");
        this.#copyEl.addEventListener("click", async (event) => {
            event.stopPropagation();
            event.preventDefault();
            try {
                await navigator.clipboard.writeText(this.#inputEl.value ?? "");
                Toast.success("copied to clipboard");
            } catch {
                Toast.error("could not write to clipboard");
            }
        });
        this.#footerEl.prepend(this.#copyEl);
    }

    async show(value) {
        this.#inputEl.value = value;
        return await super.show();
    }

    getSubmitValue() {
        return this.#inputEl.value;
    }

    get initialFocusElement() {
        return this.#inputEl;
    }

    set readOnly(value) {
        this.#inputEl.readOnly = value;
        this.#submitEl.hidden = value;
        this.#pasteEl.hidden = value;
        this.#cancelEl.text = value ? "close" : "cancel";
    }

    get readOnly() {
        return this.#inputEl.readOnly;
    }

}

customElements.define("emc-modal-dialog-input-code", ModalDialogCodeInput);
