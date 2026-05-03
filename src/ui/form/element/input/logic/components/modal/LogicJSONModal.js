import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import LogicValidator from "@emcjs/core/util/logic/LogicValidator.js";
import Logger from "@emcjs/core/util/log/Logger.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import ModalDialogCodeInput from "../../../../../../modal/input/ModalDialogCodeInput.js";
import ModalDialog from "../../../../../../modal/ModalDialog.js";

export default class LogicJSONModal extends ModalDialogCodeInput {

    #submitEl;

    #inputEl;

    constructor(caption = "Logic - JSON", options = {}) {
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        /* --- */
        this.#submitEl = this.shadowRoot.getElementById("submit");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", () => {
            this.#validateInput();
        });
    }

    async show(value) {
        this.#inputEl.setCustomValidity("");
        value = value != null ? JSON.stringify(value, null, 4) : "";
        return await super.show(value);
    }

    getSubmitValue() {
        return jsonParseSafe(this.#inputEl.value);
    }

    submit() {
        if (this.#inputEl.validationMessage === "") {
            const value = jsonParseSafe(this.#inputEl.value);
            if (value != null) {
                const errors = LogicValidator.validate(value);
                if (errors.length > 0) {
                    this.#inputEl.setCustomValidity("Invalid Logic");
                    ModalDialog.error("Invalid Logic", null, errors);
                    Logger.error(`Invalid Logic\n${errors.map((s) => `\t${s}`).join("\n")}`);
                } else {
                    super.submit();
                }
            } else {
                this.#inputEl.setCustomValidity("Invalid JSON");
            }
        }
    }

    #validateInput = debounce(() => {
        try {
            jsonParseSafe(this.#inputEl.value);
            this.#inputEl.setCustomValidity("");
            this.#submitEl.disabled = false;
        } catch {
            this.#inputEl.setCustomValidity("Invalid JSON");
            this.#submitEl.disabled = true;
        }
    });

}

customElements.define("emc-edit-logic-modal-json", LogicJSONModal);
