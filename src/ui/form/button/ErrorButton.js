import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import {deepClone} from "@emcjs/core/util/helper/DeepClone.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {registerFocusable} from "../../../util/element/ElementFocusManager.js";
import ErrorButtonItemsElementManager from "../../../util/form/manager/errorbutton/ErrorButtonItemsElementManager.js";
import Button from "./Button.js";
import "../../i18n/I18nLabel.js";
import TPL from "./ErrorButton.js.html" assert {type: "html"};
import STYLE from "./ErrorButton.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ErrorButton.js.json" assert {type: "json"};

// TODO use ElementManager instead of #renderErrorLabel
// use ElementManager cleanup method for event handler removal
export default class ErrorButton extends Button {

    static get formConfigurationFields() {
        return [...super.formConfigurationFields, ...deepClone(CONFIG_FIELDS)];
    }

    #buttonEl;

    #isPopupVisible = false;

    #scrollContainerEl;

    #errorContainerEl;

    #errorList = new Map();

    #errorItemsElementManager;

    #windowEventManager = new EventTargetManager(window, false);

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#errorContainerEl = this.shadowRoot.getElementById("error-container");
        this.#errorItemsElementManager = new ErrorButtonItemsElementManager(this.#errorContainerEl);
        this.#errorContainerEl.addEventListener("wheel", (event) => {
            event.stopPropagation();
        }, {passive: true});
        /* --- */
        this.#windowEventManager.set(["wheel", "blur"], () => {
            if (this.#isPopupVisible) {
                this.#closePopup();
            }
        }, {passive: true});
        this.#windowEventManager.set("mousedown", (event) => {
            if (this.#isPopupVisible && !this.contains(event.target)) {
                this.#closePopup();
            }
        }, {passive: true});
        this.addEventListener("mousedown", (event) => {
            if (this.#isPopupVisible) {
                event.stopImmediatePropagation();
            }
        }, {passive: true});
        /* --- */
        this.setCount();
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#windowEventManager.active = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#windowEventManager.active = false;
    }

    clickHandler(event) {
        if (super.clickHandler(event)) {
            if (this.#isPopupVisible) {
                this.#closePopup();
            } else {
                this.#openPopup();
            }
            return true;
        }
        return false;
    }

    set action(value) {
        this.setAttribute("action", value);
    }

    get action() {
        return this.getAttribute("action");
    }

    setErrors(errors = []) {
        this.#errorList.clear();
        this.setCount(0);
        this.#errorContainerEl.innerHTML = "";
        for (const errorEntry of errors) {
            this.addError(errorEntry);
        }
    }

    addError(errorEntry) {
        const entry = {
            ...errorEntry,
            key: errorEntry.name
        };
        this.#errorList.set(entry.element, entry);
        this.#updateErrors();
    }

    removeError(inputEl) {
        if (this.#errorList.has(inputEl)) {
            this.#errorList.delete(inputEl);
            this.#updateErrors();
        }
    }

    #openPopup() {
        this.#isPopupVisible = true;
        const thisRect = this.getBoundingClientRect();
        this.#scrollContainerEl.style.display = "block";
        this.#scrollContainerEl.style.minWidth = `${thisRect.width}px`;
        this.#scrollContainerEl.style.zIndex = 200;
        const containerRect = this.#scrollContainerEl.getBoundingClientRect();
        if (thisRect.bottom + containerRect.height > window.innerHeight - 25) {
            this.#scrollContainerEl.style.bottom = `${window.innerHeight - thisRect.top}px`;
        } else {
            this.#scrollContainerEl.style.top = `${thisRect.bottom}px`;
        }
        if (thisRect.left + containerRect.width > window.innerWidth - 25) {
            if (thisRect.right - containerRect.width < 25) {
                this.#scrollContainerEl.style.left = "25px";
                this.#scrollContainerEl.style.right = "25px";
            } else {
                this.#scrollContainerEl.style.right = `${window.innerWidth - thisRect.right}px`;
            }
        } else {
            this.#scrollContainerEl.style.left = `${thisRect.left}px`;
        }
    }

    #closePopup() {
        this.#isPopupVisible = false;
        this.#scrollContainerEl.style.display = "";
        this.#scrollContainerEl.style.bottom = "";
        this.#scrollContainerEl.style.top = "";
        this.#scrollContainerEl.style.left = "";
        this.#scrollContainerEl.style.right = "";
        this.#scrollContainerEl.style.zIndex = "";
    }

    #updateErrors = debounce(() => {
        this.#errorItemsElementManager.manage([...this.#errorList.values()]);
        const errorCount = this.#errorList.size;
        this.setCount(errorCount);
    });

    setCount(value) {
        value = parseInt(value);
        if (!isNaN(value) && value > 0) {
            super.setCount(value, "error");
            this.#buttonEl.classList.add("error");
            this.#buttonEl.classList.remove("success");
        } else {
            super.setCount(0, "success");
            this.#buttonEl.classList.add("success");
            this.#buttonEl.classList.remove("error");
        }
    }

}

customElements.define("emc-button-error", ErrorButton);
registerFocusable("emc-button-error");
