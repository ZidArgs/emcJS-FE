import {immute} from "@emcjs/core/data/Immutable.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {instanceOfOne} from "@emcjs/core/util/helper/Class.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import CustomElement from "../element/CustomElement.js";
import CustomFormElement from "../element/CustomFormElement.js";
import ControlButtonTypes from "../../enum/form/ControlButtonTypes.js";
import {allNodesConnected} from "../../util/observer/IsConnectedObserver.js";
import Toast from "../overlay/message/Toast.js";
import AbstractFormElement from "./element/AbstractFormElement.js";
import "../i18n/I18nLabel.js";
import "../i18n/I18nTextbox.js";
import "../i18n/I18nTooltip.js";
import "./button/Button.js";
import TPL from "./FormField.js.html" assert {type: "html"};
import STYLE from "./FormField.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./FormField.js.json" assert {type: "json"};

const MUTATION_CONFIG = {
    childList: true,
    subtree: true
};

const FORM_ELEMENTS = [
    CustomFormElement,
    HTMLInputElement,
    HTMLTextAreaElement,
    HTMLSelectElement,
    HTMLButtonElement
];

// there is still a problem with screen readers and slots/shadow-dom, so this has to be tested
export default class FormField extends CustomElement {

    static get formConfigurationFields() {
        return immute(CONFIG_FIELDS);
    }

    static get attributes() {
        const attributes = new Set();
        for (const {name} of CONFIG_FIELDS) {
            attributes.add(name);
        }
        return [...attributes];
    }

    static get CONTROL_BUTTONS() {
        return ControlButtonTypes;
    }

    #fieldEl;

    #assignedFormEl;

    #tooltipEl;

    #labelEl;

    #labelTextEl;

    #controlContainerEl;

    #copyEl;

    #resetEl;

    #descriptionEl;

    #subtextEl;

    #errorEl;

    #managedFormEls = new Set();

    #formElementEventManager = new EventTargetManager();

    #mutationObserver = new MutationObserver(() => {
        this.#resolveFormElements();
    });

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#fieldEl = this.shadowRoot.getElementById("field");
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
        this.#labelEl = this.shadowRoot.getElementById("label");
        this.#labelTextEl = this.shadowRoot.getElementById("label-text");
        this.#controlContainerEl = this.shadowRoot.getElementById("control-container");
        this.#copyEl = this.shadowRoot.getElementById("copy");
        this.#resetEl = this.shadowRoot.getElementById("reset");
        this.#descriptionEl = this.shadowRoot.getElementById("description");
        this.#subtextEl = this.shadowRoot.getElementById("subtext");
        this.#errorEl = this.shadowRoot.getElementById("error");
        this.#copyEl.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            try {
                navigator.clipboard.writeText(this.#getValue() ?? "");
                Toast.success("copied to clipboard");
            } catch {
                Toast.error("could not write to clipboard");
            }
        });
        this.#resetEl.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.#reset();
        });
        this.#resetEl.addEventListener("keydown", (event) => {
            if (event.keyCode === 13) {
                event.stopPropagation();
                event.preventDefault();
                this.#reset();
            }
        });
        this.#errorEl.addEventListener("click", () => {
            if (this.assignedElement != null) {
                this.#assignedFormEl.focus();
            }
        });
        /* --- */
        this.#formElementEventManager.set(["input", "value"], () => {
            this.#setResetActive(!this.#assignedFormEl.isDefault);
        });
        this.#formElementEventManager.set("validity", (event) => {
            const {message} = event;
            this.#errorEl.i18nContent = message ?? "";
        });
        /* --- */
        this.#labelEl.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (this.assignedElement != null) {
                this.#assignedFormEl.focus();
                this.#assignedFormEl.click();
            }
        });
        /* --- */
        this.#mutationObserver.observe(this, MUTATION_CONFIG);
        this.#initFormElements();
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#resolveFormElements();
    }

    #reset() {
        if (this.assignedElement != null) {
            this.#assignedFormEl.reset();
            this.#setResetActive(false);
        }
    }

    #getValue() {
        if (this.assignedElement != null) {
            return this.#assignedFormEl.value;
        }
        return null;
    }

    get assignedElement() {
        if (this.#assignedFormEl == null) {
            this.#resolveFormElements();
        }
        return this.#assignedFormEl;
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get label() {
        return this.getAttribute("label");
    }

    set tooltip(value) {
        this.setAttribute("tooltip", value);
    }

    get tooltip() {
        return this.getAttribute("tooltip");
    }

    set description(value) {
        this.setAttribute("description", value);
    }

    get description() {
        return this.getAttribute("description");
    }

    set subtext(value) {
        this.setAttribute("subtext", value);
    }

    get subtext() {
        return this.getAttribute("subtext");
    }

    set controlButtons(value) {
        this.setListAttribute("control-buttons", value, ControlButtonTypes);
    }

    get controlButtons() {
        return this.getListAttribute("control-buttons");
    }

    set hidden(value) {
        this.setBooleanAttribute("hidden", value);
    }

    get hidden() {
        return this.getBooleanAttribute("hidden");
    }

    set hideErrors(value) {
        this.setBooleanAttribute("hideerrors", value);
    }

    get hideErrors() {
        return this.getBooleanAttribute("hideerrors");
    }

    set noHover(value) {
        this.setBooleanAttribute("nohover", value);
    }

    get noHover() {
        return this.getBooleanAttribute("nohover");
    }

    set noPad(value) {
        this.setBooleanAttribute("nopad", value);
    }

    get noPad() {
        return this.getBooleanAttribute("nopad");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "label",
            "tooltip",
            "description",
            "control-buttons"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "label": {
                if (oldValue != newValue) {
                    this.#labelTextEl.i18nValue = newValue;
                    if (newValue) {
                        for (const el of this.#managedFormEls) {
                            el.setAttribute("aria-describedby", this.label);
                        }
                    } else {
                        for (const el of this.#managedFormEls) {
                            el.removeAttribute("aria-describedby");
                        }
                    }
                }
            } break;
            case "tooltip": {
                if (oldValue != newValue) {
                    this.#tooltipEl.i18nTooltip = newValue;
                }
            } break;
            case "description": {
                if (oldValue != newValue) {
                    this.#descriptionEl.i18nContent = newValue;
                }
            } break;
            case "subtext": {
                if (oldValue != newValue) {
                    this.#subtextEl.i18nContent = newValue;
                }
            } break;
            case "control-buttons": {
                if (oldValue != newValue) {
                    this.#applyActiveControlButtons();
                }
            } break;
        }
    }

    checkFormElementsVisible = debounce(() => {
        let hiddenEls = 0;
        for (const formEl of this.#managedFormEls) {
            if (formEl instanceof AbstractFormElement && formEl.hidden) {
                hiddenEls++;
            } else {
                const elementStyle = getComputedStyle(formEl);
                if (elementStyle.display === "none") {
                    hiddenEls++;
                }
            }
        }
        this.hidden = hiddenEls >= this.#managedFormEls.size;
    });

    async #initFormElements() {
        const allNodes = this.#fieldEl.assignedElements({flatten: true});
        await allNodesConnected(allNodes);
        this.#resolveFormElements();
    }

    #resolveFormElements() {
        const slottedFormEls = this.#fieldEl.assignedElements({flatten: true}).filter((el) => instanceOfOne(el, ...FORM_ELEMENTS) || el.dataset.form === "element");
        const oldFormEls = new Set(this.#managedFormEls);
        for (const el of slottedFormEls) {
            oldFormEls.delete(el);
            if (!this.#managedFormEls.has(el)) {
                this.#managedFormEls.add(el);
                el.formField = this;
                if (this.label) {
                    el.setAttribute("aria-describedby", this.label);
                }
                if (el.constructor.isCompact) {
                    el.classList.add("compact");
                }
            }
        }
        for (const el of oldFormEls) {
            el.formField = undefined;
            el.removeAttribute("aria-describedby");
        }
        if (slottedFormEls.length > 0) {
            this.#assignedFormEl = slottedFormEls[0];
            this.#formElementEventManager.switchTarget(this.#assignedFormEl);
            this.#setResetActive(!this.#assignedFormEl.isDefault);
        } else {
            this.#formElementEventManager.disconnect();
            this.#setResetActive(false);
        }
        this.checkFormElementsVisible();
    }

    #applyActiveControlButtons() {
        const active = this.controlButtons;
        if (active.length > 0) {
            this.#controlContainerEl.classList.add("visible");
            for (const el of this.#controlContainerEl.children) {
                if (active.includes(el.id)) {
                    el.classList.add("visible");
                } else {
                    el.classList.remove("visible");
                    if (document.activeElement === el) {
                        el.blur();
                    }
                }
            }
        } else {
            this.#controlContainerEl.classList.remove("visible");
        }
    }

    #setResetActive(value) {
        if (!value) {
            this.#resetEl.classList.add("inactive");
            this.#resetEl.setAttribute("tabindex", "-1");
            this.#resetEl.blur();
        } else {
            this.#resetEl.classList.remove("inactive");
            this.#resetEl.removeAttribute("tabindex");
        }
    }

}

customElements.define("emc-form-field", FormField);
