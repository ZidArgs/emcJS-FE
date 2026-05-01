import {isStringNotEmpty} from "emcjs/util/helper/CheckType.js";
import Modal from "./Modal.js";
import Direction from "../../enum/Direction.js";
import GlobalStyleVariables from "../../util/style/GlobalStyleVariables.js";
import NumberInput from "../form/element/input/number/NumberInput.js";
import PasswordInput from "../form/element/input/password/PasswordInput.js";
import StringInput from "../form/element/input/string/StringInput.js";
import "../form/button/Button.js";
import TPL from "./ModalDialog.js.html" assert {type: "html"};
import STYLE from "./ModalDialog.js.css" assert {type: "css"};

const promptIconColor = GlobalStyleVariables.get("--modal-icon-prompt-color") ?? "#782bc0";
const confirmIconColor = GlobalStyleVariables.get("--modal-icon-confirm-color") ?? "#009952";
const infoIconColor = GlobalStyleVariables.get("--modal-icon-info-color") ?? "#0000ff";
const alertIconColor = GlobalStyleVariables.get("--modal-icon-alert-color") ?? "#e98e2d";
const errorIconColor = GlobalStyleVariables.get("--modal-icon-error-color") ?? "#c50000";

const DEFAULT_DIALOG_ICONS = {
    promt: {
        type: "font",
        content: "input",
        style: {
            color: promptIconColor,
            shadow: true
        }
    },
    confirm: {
        type: "font",
        content: "question-ring",
        style: {
            color: confirmIconColor,
            shadow: true
        }
    },
    info: {
        type: "font",
        content: "info-ring",
        style: {
            color: infoIconColor,
            shadow: true
        }
    },
    alert: {
        type: "font",
        content: "alert-ring",
        style: {
            color: alertIconColor,
            shadow: true
        }
    },
    error: {
        type: "font",
        content: "alert-triangle",
        style: {
            color: errorIconColor,
            shadow: true
        }
    }
};

export default class ModalDialog extends Modal {

    static #dialogIcons = new Map();

    #onsubmit = null;

    #oncancel = null;

    #onclose = null;

    #textEl;

    #footerEl;

    #cancelEl;

    #submitEl;

    #initialFocusElement = null;

    constructor(caption, options = {}) {
        super(caption, options);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#footerEl = this.shadowRoot.getElementById("footer");
        this.#textEl = this.shadowRoot.getElementById("text");
        this.#cancelEl = els.getElementById("cancel");
        this.#submitEl = els.getElementById("submit");

        if (isStringNotEmpty(options.text)) {
            this.#textEl.innerHTML = options.text;
        } else if (options.text instanceof HTMLElement) {
            this.#textEl.append(options.text);
        }

        if (options.cancel) {
            if (options.cancel instanceof HTMLElement) {
                this.#cancelEl.text = undefined;
                this.#cancelEl.append(options.cancel);
            } else if (isStringNotEmpty(options.cancel)) {
                this.#cancelEl.text = options.cancel;
            }
            this.#cancelEl.addEventListener("click", () => this.cancel());
            this.#footerEl.append(this.#cancelEl);
        }

        if (options.submit) {
            if (options.submit instanceof HTMLElement) {
                this.#submitEl.text = undefined;
                this.#submitEl.append(options.submit);
            } else if (isStringNotEmpty(options.submit)) {
                this.#submitEl.text = options.submit;
            }
            this.#submitEl.addEventListener("click", () => this.submit());
            this.#footerEl.append(this.#submitEl);
        }
    }

    async show() {
        return new Promise((resolve) => {
            this.#onsubmit = function(value) {
                resolve(value ?? true);
            };
            this.#oncancel = function() {
                resolve(false);
            };
            this.#onclose = function() {
                resolve();
            };
            super.show();
        });
    }

    submit() {
        this.remove();
        const value = this.getSubmitValue();
        if (this.#onsubmit) {
            this.#onsubmit(value);
            this.#onsubmit = null;
            this.#oncancel = null;
            this.#onclose = null;
        }
        const ev = new Event("submit");
        ev.value = value ?? true;
        this.dispatchEvent(ev);
    }

    cancel() {
        this.remove();
        if (this.#oncancel) {
            this.#oncancel();
            this.#onsubmit = null;
            this.#oncancel = null;
            this.#onclose = null;
        }
        this.dispatchEvent(new Event("cancel"));
    }

    close() {
        this.remove();
        if (this.#onclose) {
            this.#onclose();
            this.#onsubmit = null;
            this.#oncancel = null;
            this.#onclose = null;
        }
        this.dispatchEvent(new Event("close"));
    }

    getSubmitValue() {
        return true;
    }

    static setDialogIcon(type, config) {
        this.#dialogIcons.set(type, config);
    }

    static #applyDialogIcon(dialogEl, type) {
        if (this.#dialogIcons.has(type)) {
            const iconConfig = this.#dialogIcons.get(type);
            if (dialogEl.setIcon(iconConfig)) {
                return;
            }
        }
        dialogEl.setIcon(DEFAULT_DIALOG_ICONS[type]);
    }

    static async alert(caption, text) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "info",
            text,
            submit: "Ok"
        });
        this.#applyDialogIcon(dialogEl, "alert");
        dialogEl.initialFocusElement = dialogEl.#submitEl;
        // ---
        const result = await dialogEl.show();
        return result;
    }

    static async info(caption, text) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "info",
            text,
            submit: "Ok"
        });
        this.#applyDialogIcon(dialogEl, "info");
        dialogEl.initialFocusElement = dialogEl.#submitEl;
        // ---
        const result = await dialogEl.show();
        return result;
    }

    static async confirm(caption, text) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "confirm",
            text,
            submit: "Yes",
            cancel: "No"
        });
        this.#applyDialogIcon(dialogEl, "confirm");
        dialogEl.initialFocusElement = dialogEl.#cancelEl;
        // ---
        const result = await dialogEl.show();
        return result;
    }

    static async prompt(caption, text, value) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "promt",
            text,
            submit: true,
            cancel: true
        });
        this.#applyDialogIcon(dialogEl, "promt");
        // ---
        const inputEl = new StringInput();
        inputEl.style.width = "100%";
        if (typeof value === "string") {
            inputEl.value = value;
        } else if (typeof value === "number") {
            inputEl.value = value.toString();
        }
        inputEl.addEventListener("submit", (event) => {
            dialogEl.submit();
            event.stopPropagation();
        });
        dialogEl.append(inputEl);
        dialogEl.initialFocusElement = inputEl;
        // ---
        const result = await dialogEl.show();
        return result && inputEl.value;
    }

    static async promptNumber(caption, text, value = 0, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "promt",
            text,
            submit: true,
            cancel: true
        });
        this.#applyDialogIcon(dialogEl, "promt");
        // ---
        const inputEl = new NumberInput();
        inputEl.style.width = "100%";
        inputEl.min = min;
        inputEl.max = max;
        if (typeof value === "number" && !isNaN(value)) {
            inputEl.value = value;
        }
        inputEl.addEventListener("submit", (event) => {
            dialogEl.submit();
            event.stopPropagation();
        });
        dialogEl.append(inputEl);
        dialogEl.initialFocusElement = inputEl;
        // ---
        const result = await dialogEl.show();
        return result && parseFloat(inputEl.value);
    }

    static async promptSensitive(caption, text, value) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "promt",
            text,
            submit: true,
            cancel: true
        });
        this.#applyDialogIcon(dialogEl, "promt");
        // ---
        const inputEl = new PasswordInput();
        inputEl.style.width = "100%";
        if (typeof value === "string") {
            inputEl.value = value;
        } else if (typeof value === "number") {
            inputEl.value = value.toString();
        }
        inputEl.addEventListener("submit", (event) => {
            dialogEl.submit();
            event.stopPropagation();
        });
        dialogEl.append(inputEl);
        dialogEl.initialFocusElement = inputEl;
        // ---
        const result = await dialogEl.show();
        return result && inputEl.value;
    }

    static async error(caption = "Error", text = "An error occured", errors = []) {
        const dialogEl = new ModalDialog(caption, {
            modalClass: "error",
            text,
            submit: "ok"
        });
        dialogEl.streched = Direction.BOTH;
        dialogEl.resize = Direction.BOTH;
        this.#applyDialogIcon(dialogEl, "error");
        // ---
        if (this.#hasErrors(errors)) {
            const inputEl = document.createElement("textarea");
            inputEl.style.flexShrink = "1";
            inputEl.style.flexGrow = "1";
            inputEl.style.minHeight = "100px";
            inputEl.style.padding = "5px"; // 260px
            inputEl.style.color = "black";
            inputEl.style.backgroundColor = "white";
            inputEl.style.border = "solid 1px black";
            inputEl.style.overflow = "auto";
            inputEl.style.whiteSpace = "pre";
            inputEl.style.resize = "none";
            inputEl.readOnly = true;
            inputEl.value = Array.isArray(errors) ? errors.join("\n") : errors.toString();
            inputEl.setSelectionRange(0, 0);
            dialogEl.append(inputEl);
            dialogEl.initialFocusElement = inputEl;
            setTimeout(() => {
                inputEl.style.height = `${inputEl.scrollHeight}px`;
            }, 0);
        }
        // ---
        const result = await dialogEl.show();
        return result;
    }

    static #hasErrors(errors) {
        if (Array.isArray(errors)) {
            errors.filter((err) => {
                return err instanceof Error || typeof err === "string";
            });
            return errors.length > 0;
        }
        return errors instanceof Error || typeof errors === "string";
    }

    initialFocus() {
        const presetEl = this.initialFocusElement;
        if (presetEl != null) {
            presetEl.focus();
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

}

customElements.define("emc-modal-dialog", ModalDialog);
