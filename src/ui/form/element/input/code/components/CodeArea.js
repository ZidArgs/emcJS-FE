import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import CustomFormElement from "../../../../../element/CustomFormElement.js";
import {registerFocusable} from "../../../../../../util/element/ElementFocusManager.js";
import {setBooleanAttribute} from "../../../../../../util/node/NodeAttributes.js";
import TPL from "./CodeArea.js.html" assert {type: "html"};
import STYLE from "./CodeArea.js.css" assert {type: "css"};

const LAST_CHARACTER_NEWLINE = /\n$/;

export default class CodeArea extends CustomFormElement {

    #lineCount = 1;

    #currentLine = 0;

    #containerEl;

    #lineNumbersEl;

    #lineMarkerEl;

    #inputEl;

    #inputMirrorEl;

    #outputWrapperEl;

    #documentEventManager = new EventTargetManager(document, false);

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#lineNumbersEl = this.shadowRoot.getElementById("line-numbers");
        this.#lineMarkerEl = this.shadowRoot.getElementById("line-marker");
        this.#outputWrapperEl = this.shadowRoot.getElementById("output-wrapper");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputMirrorEl = this.shadowRoot.getElementById("input-mirror");
        /* --- */
        this.#inputEl.addEventListener("input", () => {
            this.#updateText(this.#inputEl.value);
        });
        /* --- */
        this.#containerEl.addEventListener("scroll", () => {
            const scrollTop = this.#containerEl.scrollTop;
            this.#inputEl.scrollTop = scrollTop;
            this.#outputWrapperEl.scrollTop = scrollTop;
            this.#updateCaretPosition(true);
        }, {passive: false});
        this.#inputEl.addEventListener("scroll", () => {
            const scrollTop = this.#inputEl.scrollTop;
            this.#containerEl.scrollTop = scrollTop;
            this.#outputWrapperEl.scrollTop = scrollTop;
            this.#updateCaretPosition(true);
        }, {passive: false});
        /* --- */
        this.#inputEl.addEventListener("focus", (event) => {
            event.stopPropagation();
            const selection = this.shadowRoot.getSelection();
            if (selection.focusNode != null) {
                this.#updateCaretPosition();
            }
        });
        /* --- */
        this.#documentEventManager.set("selectionchange", () => {
            const selection = this.shadowRoot.getSelection();
            if (selection.focusNode != null) {
                this.#updateCaretPosition();
            }
        }, {passive: true});
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#documentEventManager.active = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#documentEventManager.active = false;
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
    }

    formResetCallback() {
        super.formResetCallback();
        this.#inputEl.value = this.value;
    }

    focus(options) {
        this.#inputEl.focus(options);
    }

    set value(value) {
        this.#inputEl.value = value;
        this.#updateText(value);
    }

    get value() {
        const value = this.#inputEl.value;
        if (value === undefined) {
            return super.value;
        }
        return value;
    }

    set readOnly(value) {
        this.setBooleanAttribute("readonly", value);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "readonly"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#inputEl, name, this.readOnly);
                }
            } break;
        }
    }

    #updateText(value) {
        const lineCount = value.split("\n").length;
        this.#printLineNumbers(lineCount);
        if (LAST_CHARACTER_NEWLINE.test(value)) {
            this.#inputMirrorEl.innerText = `${value} `;
        } else {
            this.#inputMirrorEl.innerText = value;
        }
    }

    #printLineNumbers(lineCount) {
        if (this.#lineCount != lineCount) {
            this.#lineCount = lineCount;
            this.#lineNumbersEl.innerHTML = "";
            for (let i = 0; i < lineCount; ++i) {
                const numberEl = document.createElement("div");
                numberEl.innerText = i + 1;
                this.#lineNumbersEl.append(numberEl);
            }
            this.#containerEl.style.setProperty("--num-digits", `${lineCount}`.length);
        }
    }

    #updateCaretPosition = debounce((force = false) => {
        const selectionStart = this.#inputEl.selectionStart;
        const selectionEnd = this.#inputEl.selectionEnd;
        const selectionForward = this.#inputEl.selectionDirection === "forward";
        const value = this.#inputEl.value;
        const textBeforeCursor = value.slice(0, selectionForward ? selectionEnd : selectionStart);
        const lines = textBeforeCursor.split("\n");
        const currentLine = lines.length - 1;
        const focusOffset = lines.at(-1)?.length ?? 0;

        if (this.#currentLine != currentLine || force) {
            this.#currentLine = currentLine;

            const oldNumbersNodes = this.#lineNumbersEl.querySelectorAll(".caret");
            for (const oldNode of oldNumbersNodes) {
                oldNode.classList.remove("caret");
            }

            const numberEl = this.#lineNumbersEl.children[currentLine];
            if (numberEl != null) {
                numberEl.classList.add("caret");
            }

            this.#lineMarkerEl.style.setProperty("--current-line", currentLine);
        }

        const length = Math.abs(selectionEnd - selectionStart);
        const ev = new Event("selectionchange");
        ev.data = {
            currentLine,
            focusOffset,
            length
        };
        this.dispatchEvent(ev);
    });

}

customElements.define("emc-codearea", CodeArea);
registerFocusable("emc-codearea");
