import {immute} from "emcjs/data/Immutable.js";
import i18n from "emcjs/util/I18n.js";
import EventMultiTargetManager from "emcjs/util/event/EventMultiTargetManager.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import {debounce} from "emcjs/util/Debouncer.js";
import {isStringNotEmpty} from "emcjs/util/helper/CheckType.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import BusyIndicatorManager from "../../../../../util/busy/BusyIndicatorManager.js";
import {nodeTextComparator} from "../../../../../util/node/NodeListSort.js";
import {
    setAttributes, setBooleanAttribute
} from "../../../../../util/node/NodeAttributes.js";
import MutationObserverManager from "../../../../../util/observer/manager/MutationObserverManager.js";
import I18nOption from "../../../../i18n/builtin/I18nOption.js";
import SelectEntryManager from "../../../../../util/form/manager/SelectEntryManager.js";
import I18nOptionManager from "../../../../../util/form/manager/I18nOptionManager.js";
import "../../../../i18n/builtin/I18nInput.js";
import "../../../../i18n/I18nLabel.js";
import TPL from "./SimpleSelect.js.html" assert {type: "html"};
import STYLE from "./SimpleSelect.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./SimpleSelect.js.json" assert {type: "json"};

const ESCAPE_KEYS = ["Tab", "Escape"];
const SUBMIT_KEYS = ["Enter", " "];

const MUTATION_CONFIG = {
    attributes: true,
    characterData: true,
    attributeFilter: ["value", "label"]
};

export default class SimpleSelect extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    #isEditMode = false;

    #containerEl;

    #inputEl;

    #valueEl;

    #placeholderEl;

    #nativeSelectEl;

    #nativeEmptyEl;

    #buttonEl;

    #scrollContainerEl;

    #optionsContainerEl;

    #emptyEl;

    #optionsSlotEl;

    #optionSelectEventManager = new EventMultiTargetManager();

    #i18nEventManager = new EventTargetManager(i18n, false);

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, () => {
        this.#onSlotChange();
    });

    #selectEntryManager;

    #i18nOptionManager;

    #windowEventManager = new EventTargetManager(window, false);

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#optionSelectEventManager.set("mousedown", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        this.#optionSelectEventManager.set("click", (event) => {
            this.#choose(event.currentTarget.getAttribute("value"));
            event.preventDefault();
            event.stopPropagation();
        });
        this.#optionSelectEventManager.set("mouseover", () => {
            const marked = this.#optionsContainerEl.querySelector(".marked");
            if (marked != null) {
                marked.classList.remove("marked");
            }
        });
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#placeholderEl = this.shadowRoot.getElementById("placeholder");
        this.#nativeSelectEl = this.shadowRoot.getElementById("native-select");
        this.#nativeEmptyEl = this.shadowRoot.getElementById("native-empty");
        this.#emptyEl = this.shadowRoot.getElementById("empty");
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#optionsContainerEl = this.shadowRoot.getElementById("options-container");
        this.#optionsSlotEl = this.shadowRoot.getElementById("options-slot");
        this.#optionsSlotEl.addEventListener("slotchange", () => {
            this.#onSlotChange();
        });
        /* --- */
        this.#scrollContainerEl.addEventListener("mousedown", (event) => {
            event.stopPropagation();
        });
        /* --- */
        this.#inputEl.addEventListener("click", (event) => {
            if (!this.readOnly) {
                if (!this.#isEditMode) {
                    this.#startEditMode();
                } else {
                    this.#stopEditMode();
                }
                event.preventDefault();
                event.stopPropagation();
            }
        });
        this.#inputEl.addEventListener("mousedown", (event) => {
            event.stopPropagation();
        });
        this.#inputEl.addEventListener("keydown", (event) => {
            if (!this.readOnly) {
                if (!this.#isEditMode) {
                    const {key} = event;
                    if (key === "ArrowUp") {
                        this.#switchSelected(true);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (key === "ArrowDown") {
                        this.#switchSelected(false);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (SUBMIT_KEYS.includes(key)) {
                        this.#startEditMode();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                } else {
                    const {key} = event;
                    if (key === "ArrowUp") {
                        this.#moveMarker(true);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (key === "ArrowDown") {
                        this.#moveMarker(false);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (ESCAPE_KEYS.includes(key)) {
                        this.#stopEditMode(false);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (SUBMIT_KEYS.includes(key)) {
                        this.#stopEditMode(true);
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        });
        this.#inputEl.addEventListener("blur", (event) => {
            if (event.relatedTarget != null && !event.relatedTarget.contains(this.#inputEl)) {
                this.#cancelSelection();
            }
            event.stopPropagation();
        });
        this.#scrollContainerEl.addEventListener("wheel", (event) => {
            event.stopPropagation();
        }, {passive: true});
        /* --- */
        this.#nativeSelectEl.addEventListener("mousedown", (event) => {
            if (this.readOnly) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        this.#nativeSelectEl.addEventListener("change", () => {
            this.value = this.#nativeSelectEl.value;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        /* --- */
        this.#windowEventManager.set("wheel", () => {
            if (this.#isEditMode) {
                this.#cancelSelection();
            }
        }, {passive: true});
        this.#windowEventManager.set("blur", () => {
            if (this.#isEditMode) {
                this.#cancelSelection();
            }
        }, {passive: true});
        this.#windowEventManager.set("mousedown", (event) => {
            if (!this.readOnly && this.#isEditMode) {
                if (!this.#containerEl.contains(event.target)) {
                    this.#cancelSelection();
                }
            }
        }, {passive: true});
        /* --- */
        this.#selectEntryManager = new SelectEntryManager(this.#optionsContainerEl, this.#optionSelectEventManager);
        this.#selectEntryManager.addEventListener("afterrender", () => {
            this.#refreshSelect(this.#optionsContainerEl);
            this.renderValue(this.value);
        });
        this.#i18nOptionManager = new I18nOptionManager(this.#nativeSelectEl);
        this.#i18nOptionManager.addEventListener("afterrender", () => {
            this.#refreshSelect(this.#nativeSelectEl);
        });
        /* --- */
        this.#i18nEventManager.set("language", () => {
            this.#selectEntryManager.sort();
            this.#i18nOptionManager.sort();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#selectEntryManager.sort();
            this.#i18nOptionManager.sort();
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#windowEventManager.active = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#windowEventManager.active = false;
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
        this.#nativeSelectEl.disabled = disabled;
        this.#buttonEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        const mediaQuery = window.matchMedia("(hover: none)");
        if (mediaQuery.matches) {
            this.#nativeSelectEl.focus(options);
        } else {
            this.#inputEl.focus(options);
        }
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    set sorted(value) {
        this.setBooleanAttribute("sorted", value);
    }

    get sorted() {
        return this.getBooleanAttribute("sorted");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "placeholder",
            "readonly",
            "sorted"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#placeholderEl.i18nValue = newValue;
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    setBooleanAttribute(this.#nativeSelectEl, "readonly", this.readOnly);
                }
            } break;
            case "sorted": {
                if (oldValue != newValue) {
                    const sorted = this.sorted;
                    this.#i18nEventManager.active = sorted;
                    if (sorted) {
                        this.#selectEntryManager.registerSortFunction(this.#sortByNameFunction);
                        this.#i18nOptionManager.registerSortFunction(this.#sortByNameFunction);
                    } else {
                        this.#selectEntryManager.registerSortFunction();
                        this.#i18nOptionManager.registerSortFunction();
                    }
                }
            } break;
        }
    }

    renderValue(value) {
        if (value != null) {
            this.#nativeSelectEl.value = value;
            const selectedEl = this.#optionsContainerEl.querySelector(`[value="${value}"]`);
            if (selectedEl != null) {
                if (selectedEl.label != null) {
                    this.#valueEl.i18nValue = selectedEl.label;
                } else {
                    this.#valueEl.i18nValue = "";
                    this.#valueEl.innerText = selectedEl.innerText;
                }
            } else {
                this.#valueEl.i18nValue = value;
            }
        } else {
            this.#nativeSelectEl.value = "";
            this.#valueEl.i18nValue = "";
            this.#valueEl.innerHTML = "";
        }
    }

    #choose(value) {
        if (!this.getBooleanAttribute("readonly")) {
            this.value = value;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
        this.#stopEditMode();
    }

    #cancelSelection() {
        this.renderValue(this.value);
        this.#stopEditMode();
    }

    #startEditMode() {
        if (!this.readOnly) {
            this.#isEditMode = true;
            this.#inputEl.classList.add("active");
            /* --- */
            const thisRect = this.#containerEl.getBoundingClientRect();
            this.#scrollContainerEl.style.display = "block";
            this.#scrollContainerEl.style.left = `${thisRect.left}px`;
            this.#scrollContainerEl.style.width = `${thisRect.width}px`;
            this.#scrollContainerEl.style.zIndex = 200;
            const containerRect = this.#scrollContainerEl.getBoundingClientRect();
            if (thisRect.bottom + containerRect.height > window.innerHeight - 25) {
                this.#scrollContainerEl.style.bottom = `${window.innerHeight - thisRect.top}px`;
            } else {
                this.#scrollContainerEl.style.top = `${thisRect.bottom}px`;
            }
            const all = this.#optionsContainerEl.querySelectorAll(`[value]`);
            const value = this.value ?? "";
            for (const el of all) {
                el.style.display = "";
                if (el.value === value) {
                    el.selected = true;
                } else {
                    el.selected = false;
                }
            }
        }
    }

    #stopEditMode(submit = false) {
        this.#isEditMode = false;
        this.#inputEl.classList.remove("active");
        /* --- */
        this.#scrollContainerEl.style.display = "";
        this.#scrollContainerEl.style.bottom = "";
        this.#scrollContainerEl.style.top = "";
        this.#scrollContainerEl.style.zIndex = "";
        const all = this.querySelectorAll(`[value]`);
        for (const el of all) {
            el.style.display = "";
        }
        if (submit) {
            const marked = this.#optionsContainerEl.querySelector(".marked");
            if (marked != null) {
                marked.classList.remove("marked");
                this.value = marked.value;
            }
        } else {
            const marked = this.#optionsContainerEl.querySelector(".marked");
            if (marked != null) {
                marked.classList.remove("marked");
            }
        }
    }

    #switchSelected(modeUp = false) {
        const marked = this.#optionsContainerEl.querySelector(`[value="${this.value ?? ""}"]`);
        const el = this.#switchOption(marked, modeUp);
        if (el != null) {
            this.value = el.value;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    #moveMarker(modeUp = false) {
        const marked = this.#optionsContainerEl.querySelector(".marked");
        const el = this.#switchOption(marked, modeUp);
        if (el != null) {
            if (marked != null) {
                marked.classList.remove("marked");
            }
            el.classList.add("marked");
            const scrollOffset = this.#scrollContainerEl.offsetTop;
            const scrollHeight = this.#scrollContainerEl.offsetHeight;
            const targetOffset = el.offsetTop - scrollOffset;
            const targetHeight = el.offsetHeight;
            if (this.#scrollContainerEl.scrollTop > targetOffset - 20) {
                this.#scrollContainerEl.scrollTop = targetOffset - 20;
            } else if (this.#scrollContainerEl.scrollTop < targetOffset + targetHeight - (scrollHeight - 20)) {
                this.#scrollContainerEl.scrollTop = targetOffset + targetHeight - (scrollHeight - 20);
            }
        }
    }

    #switchOption(oldEl, modeUp = false) {
        let nextEl;
        if (oldEl != null) {
            if (modeUp) {
                nextEl = this.#getPrevOption(oldEl);
                if (nextEl == null && oldEl.style.display === "none") {
                    nextEl = this.#getNextOption(oldEl);
                }
            } else {
                nextEl = this.#getNextOption(oldEl);
                if (nextEl == null && oldEl.style.display === "none") {
                    nextEl = this.#getPrevOption(oldEl);
                }
            }
        } else {
            nextEl = this.#optionsContainerEl.querySelector(`[value="${this.value ?? ""}"]`);
            if (nextEl == null || nextEl.style.display === "none") {
                nextEl = this.#getFirstOption();
            }
        }
        return nextEl;
    }

    #getFirstOption() {
        let nextEl = this.#optionsContainerEl.firstElementChild;
        while (nextEl != null && (nextEl.style.display === "none" || !nextEl.matches("[value]"))) {
            nextEl = nextEl.nextElementSibling;
        }
        if (nextEl != null && nextEl.style.display !== "none" && nextEl.matches("[value]")) {
            return nextEl;
        }
    }

    #getPrevOption(oldEl) {
        let nextEl = oldEl.previousElementSibling;
        while (nextEl != null && (nextEl.style.display === "none" || !nextEl.matches("[value]"))) {
            nextEl = nextEl.previousElementSibling;
        }
        if (nextEl != null && nextEl.style.display !== "none" && nextEl.matches("[value]")) {
            return nextEl;
        }
    }

    #getNextOption(oldEl) {
        let nextEl = oldEl.nextElementSibling;
        while (nextEl != null && (nextEl.style.display === "none" || !nextEl.matches("[value]"))) {
            nextEl = nextEl.nextElementSibling;
        }
        if (nextEl != null && nextEl.style.display !== "none" && nextEl.matches("[value]")) {
            return nextEl;
        }
    }

    async #resolveSlottedElements() {
        await BusyIndicatorManager.busy();
        const data = [];
        const optionNodeList = this.#optionsSlotEl.assignedElements({flatten: true}).filter((el) => el.matches("option"));
        /* --- */
        const oldNodes = new Set(this.#mutationObserver.getObservedNodes());
        const newNodes = new Set();
        const usedKeys = new Set();
        for (const el of optionNodeList) {
            const key = el.value || el.innerText;
            if (!usedKeys.has(key)) {
                usedKeys.add(key);
                data.push({
                    key: el.value || el.innerText,
                    label: el.i18nValue || el.label || el.innerText
                });
                /* --- */
                if (oldNodes.has(el)) {
                    oldNodes.delete(el);
                } else {
                    newNodes.add(el);
                }
            }
        }
        for (const node of oldNodes) {
            this.#mutationObserver.unobserve(node);
        }
        for (const node of newNodes) {
            this.#mutationObserver.observe(node);
        }
        /* --- */
        this.#selectEntryManager.manage(data);
        this.#i18nOptionManager.manage(data);
        /* --- */
        if (newNodes.size > 0) {
            this.#emptyEl.style.display = "";
            this.#nativeEmptyEl.remove();
        } else if (this.#nativeSelectEl.children.length <= 0) {
            this.#emptyEl.style.display = "flex";
            this.#nativeSelectEl.append(this.#nativeEmptyEl);
        }
        /* --- */
        this.renderValue(this.value);
        await BusyIndicatorManager.unbusy();
    }

    #onSlotChange = debounce(() => {
        this.#resolveSlottedElements();
    });

    #sortByNameFunction(entry0, entry1) {
        const {element: el0} = entry0;
        const {element: el1} = entry1;
        if (!isStringNotEmpty(el0.value)) {
            return -1;
        }
        if (!isStringNotEmpty(el1.value)) {
            return 1;
        }
        return nodeTextComparator(el0, el1);
    }

    #refreshSelect(containerEl) {
        const selectedEl = containerEl.querySelector("[selected]:not([selected=\"false\"])");
        if (selectedEl != null) {
            selectedEl.selected = false;
        }
        const matchingEl = containerEl.querySelector(`[value="${this.value ?? ""}"]`);
        if (matchingEl != null) {
            matchingEl.selected = true;
        }
    }

    static fromConfig(config) {
        const selectEl = new SimpleSelect();
        const {
            options = {}, ...params
        } = config;

        setAttributes(selectEl, params);

        for (const key in options) {
            const value = options[key];
            const optionEl = I18nOption.create();
            optionEl.value = key;
            if (value) {
                optionEl.i18nValue = value;
            }
            selectEl.append(optionEl);
        }

        return selectEl;
    }

}

FormElementRegistry.register("SimpleSelect", SimpleSelect);
customElements.define("emc-select-simple", SimpleSelect);
registerFocusable("emc-select-simple");
