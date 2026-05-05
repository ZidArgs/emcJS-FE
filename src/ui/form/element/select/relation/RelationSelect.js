import {immute} from "@emcjs/core/data/Immutable.js";
import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import TypeStorage from "@emcjs/core/data/type/TypeStorage.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import CharacterSearch from "@emcjs/core/util/search/CharacterSearch.js";
import {isEqual} from "@emcjs/core/util/helper/Comparator.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import BusyIndicatorManager from "../../../../../util/busy/BusyIndicatorManager.js";
import {sortNodeList} from "../../../../../util/node/NodeListSort.js";
import ElementListCache from "../../../../../util/element/ElementListCache.js";
import RelationSelectEntry from "./components/RelationSelectEntry.js";
import "../../../../i18n/builtin/I18nInput.js";
import TPL from "./RelationSelect.js.html" assert {type: "html"};
import STYLE from "./RelationSelect.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./RelationSelect.js.json" assert {type: "json"};

const ESCAPE_KEYS = [
    "Tab",
    "Escape",
    "Enter"
];

export default class RelationSelect extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    #isEditMode = false;

    #containerEl;

    #typesWildcarded = false;

    #inputEl;

    #viewEl;

    #valueEl;

    #nameEl;

    #typeEl;

    #buttonEl;

    #placeholderEl;

    #scrollContainerEl;

    #optionsContainerEl;

    #emptyEl;

    #nomatchEl;

    #voidEl = new RelationSelectEntry();

    #typeStorageEventManager = new EventMultiTargetManager();

    #optionNodeList = new ElementListCache();

    #optionSelectEventManager = new EventMultiTargetManager();

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
            this.#choose(event.currentTarget.value);
            event.preventDefault();
            event.stopPropagation();
        });
        this.#optionSelectEventManager.set("mouseover", () => {
            const marked = this.#optionNodeList.querySelector(".marked");
            if (marked != null) {
                marked.classList.remove("marked");
            }
        });
        /* --- */
        this.#typeStorageEventManager.set("clear", () => {
            this.#fillSelectElements();
        });
        this.#typeStorageEventManager.set("load", () => {
            this.#fillSelectElements();
        });
        this.#typeStorageEventManager.set("change", () => {
            this.#fillSelectElements();
        });
        /* --- */
        this.#voidEl.name = "";
        this.#voidEl.type = "";
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#nameEl = this.shadowRoot.getElementById("name");
        this.#typeEl = this.shadowRoot.getElementById("type");
        this.#viewEl = this.shadowRoot.getElementById("view");
        this.#emptyEl = this.shadowRoot.getElementById("empty");
        this.#nomatchEl = this.shadowRoot.getElementById("nomatch");
        this.#placeholderEl = this.shadowRoot.getElementById("placeholder");
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#optionsContainerEl = this.shadowRoot.getElementById("options-container");
        this.#buttonEl = this.shadowRoot.getElementById("button");
        /* --- */
        this.#scrollContainerEl.addEventListener("mousedown", (event) => {
            event.stopPropagation();
        });
        /* --- */
        this.#buttonEl.addEventListener("click", (event) => {
            if (!this.#isEditMode) {
                this.#startEditMode();
            } else {
                this.#stopEditMode();
            }
            event.stopPropagation();
            event.preventDefault();
        });
        this.#viewEl.addEventListener("click", (event) => {
            if (!this.#isEditMode) {
                this.#startEditMode();
            }
            event.stopPropagation();
            event.preventDefault();
        });
        this.#inputEl.addEventListener("keydown", (event) => {
            if (!this.getBooleanAttribute("readonly")) {
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
                    } else if (key === "Enter" || key === " ") {
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
                        this.#stopEditMode();
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
        this.#inputEl.addEventListener("input", () => {
            this.#applySearch();
        });
        this.#scrollContainerEl.addEventListener("wheel", (event) => {
            event.stopPropagation();
        }, {passive: true});
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
        TypeStorage.onStorageRegister((typeNames) => {
            this.#fillAfterStorageRegister(typeNames);
        });
        this.#fillSelectElements();
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
        this.#viewEl.classList.toggle("disabled", disabled);
        this.#buttonEl.classList.toggle("disabled", disabled);
    }

    set value(value) {
        if (value != null) {
            value = {
                type: value.type,
                name: value.name
            };
            if (typeof value.type !== "string" || typeof value.name !== "string" || value.type === "" || value.name === "") {
                value = null;
            }
        }
        super.value = value;
    }

    get value() {
        return super.value;
    }

    set defaultValue(value) {
        this.setJSONAttribute("value", value);
    }

    get defaultValue() {
        let value = this.getJSONAttribute("value");
        if (value != null) {
            value = {
                type: value.type,
                name: value.name
            };
            if (typeof value.type !== "string" || typeof value.name !== "string") {
                value = null;
            }
        }
        return value;
    }

    set placeholder(value) {
        this.setStringAttribute("placeholder", value);
    }

    get placeholder() {
        return this.getStringAttribute("placeholder");
    }

    set types(value) {
        if (value != null && !Array.isArray(value)) {
            value = [];
        }
        this.setJSONAttribute("types", value);
    }

    get types() {
        const value = this.getJSONAttribute("types");
        if (!Array.isArray(value)) {
            return [];
        }
        return value;
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
            "sorted",
            "types"
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
            case "sorted": {
                if (oldValue != newValue) {
                    const sorted = this.sorted;
                    if (sorted) {
                        this.#sort();
                    }
                }
            } break;
            case "types": {
                if (oldValue != newValue) {
                    this.#typesWildcarded = this.types.includes("*");
                    this.#fillSelectElements();
                }
            } break;
        }
    }

    renderValue(value) {
        if (value != null && value.type != null && value.name != null) {
            const selectedEl = this.#optionNodeList.querySelector(`[type="${value.type}"][name="${value.name}"]`);
            if (selectedEl != null) {
                this.#nameEl.innerText = selectedEl.name;
                this.#typeEl.innerText = selectedEl.type;
            } else {
                this.#nameEl.innerText = "";
                this.#typeEl.innerText = "";
            }
            this.#valueEl.classList.remove("hidden");
            this.#placeholderEl.classList.add("hidden");
        } else {
            this.#nameEl.innerText = "";
            this.#typeEl.innerText = "";
            this.#valueEl.classList.add("hidden");
            this.#placeholderEl.classList.remove("hidden");
        }
    }

    #applySearch = debounce(() => {
        const all = this.#optionNodeList.getNodeList();
        const regEx = new CharacterSearch(this.#inputEl.value);
        const elCount = all.length;
        if (elCount > 0) {
            let hiddenCount = 0;
            for (const el of all) {
                const testText = el.comparatorText ?? el.innerText;
                if (regEx.test(testText.trim())) {
                    el.style.display = "";
                } else {
                    el.style.display = "none";
                    hiddenCount++;
                }
                if (elCount <= hiddenCount) {
                    this.#nomatchEl.style.display = "flex";
                } else {
                    this.#nomatchEl.style.display = "";
                }
            }
        }
    });

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
        if (!this.getBooleanAttribute("readonly")) {
            this.#isEditMode = true;
            this.#inputEl.value = "";
            this.#inputEl.classList.add("active");
            this.#inputEl.focus();
            /* --- */
            const thisRect = this.getBoundingClientRect();
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
            const value = this.value;
            for (const el of this.#optionNodeList) {
                el.style.display = "";
                if ((el.value?.type ?? "") === (value?.type ?? "") && (el.value?.name ?? "") === (value?.name ?? "")) {
                    el.selected = true;
                } else {
                    el.selected = false;
                }
            }
        }
    }

    #stopEditMode() {
        this.#isEditMode = false;
        this.#inputEl.classList.remove("active");
        this.#viewEl.focus();
        /* --- */
        this.#scrollContainerEl.style.display = "";
        this.#scrollContainerEl.style.bottom = "";
        this.#scrollContainerEl.style.top = "";
        this.#scrollContainerEl.style.zIndex = "";
        const all = this.querySelectorAll("emc-select-relation-entry");
        for (const el of all) {
            el.style.display = "";
        }
        const marked = this.#optionNodeList.querySelector(".marked");
        if (marked != null) {
            marked.classList.remove("marked");
            this.value = marked.value;
        } else {
            this.renderValue(this.value);
        }
    }

    #switchSelected(modeUp = false) {
        const value = this.value;
        const currentEl = this.#optionNodeList.querySelector(`[type="${value?.type ?? ""}"][name="${value?.name ?? ""}"]`);
        const el = this.#switchOption(currentEl, modeUp);
        if (el != null) {
            this.value = el.value;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    #moveMarker(modeUp = false) {
        const markedEl = this.#optionNodeList.querySelector(".marked");
        const el = this.#switchOption(markedEl, modeUp);
        if (el != null) {
            if (markedEl != null) {
                markedEl.classList.remove("marked");
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
            const value = this.value;
            nextEl = this.#optionNodeList.querySelector(`[type="${value?.type ?? ""}"][name="${value?.name ?? ""}"]`);
            if (nextEl == null || nextEl.style.display === "none") {
                nextEl = this.#getFirstOption();
            }
        }
        return nextEl;
    }

    #getFirstOption() {
        let nextEl = this.#optionNodeList.first;
        while (nextEl != null && nextEl.style.display === "none") {
            nextEl = this.#optionNodeList.getNext(nextEl);
        }
        if (nextEl != null && nextEl.style.display !== "none") {
            return nextEl;
        }
    }

    #getPrevOption(oldEl) {
        let nextEl = this.#optionNodeList.getPrev(oldEl);
        while (nextEl != null && nextEl.style.display === "none") {
            nextEl = this.#optionNodeList.getPrev(nextEl);
        }
        if (nextEl != null && nextEl.style.display !== "none") {
            return nextEl;
        }
    }

    #getNextOption(oldEl) {
        let nextEl = this.#optionNodeList.getNext(oldEl);
        while (nextEl != null && nextEl.style.display === "none") {
            nextEl = this.#optionNodeList.getNext(nextEl);
        }
        if (nextEl != null && nextEl.style.display !== "none") {
            return nextEl;
        }
    }

    #sort = debounce(() => {
        const optionNodeList = this.#optionNodeList.getNodeList();
        const sortedNodeList = sortNodeList(optionNodeList);
        if (!isEqual(optionNodeList, sortedNodeList)) {
            for (const el of sortedNodeList) {
                this.#optionsContainerEl.append(el);
            }
        }
        this.#optionNodeList.setNodeList(sortedNodeList);
    });

    async #fillSelectElements() {
        await BusyIndicatorManager.busy();
        this.#optionsContainerEl.innerHTML = "";
        this.#optionNodeList.purge();
        this.#optionSelectEventManager.clearTargets();
        /* --- */
        let acceptedTypes = this.types;
        if (this.#typesWildcarded) {
            acceptedTypes = TypeStorage.getAllStorageNames();
        }
        for (const acceptedType of acceptedTypes) {
            const storage = TypeStorage.getStorage(acceptedType);
            if (storage != null) {
                this.#typeStorageEventManager.addTarget(storage);
                for (const name of storage.keys()) {
                    const el = new RelationSelectEntry();
                    el.name = name;
                    el.type = acceptedType;
                    this.#optionNodeList.append(el);
                    this.#optionSelectEventManager.addTarget(el);
                    this.#optionsContainerEl.append(el);
                }
            }
        }
        /* --- */
        if (this.#optionNodeList.size > 0) {
            this.#emptyEl.style.display = "";
            this.#optionNodeList.prepend(this.#voidEl);
            this.#optionSelectEventManager.addTarget(this.#voidEl);
            this.#optionsContainerEl.prepend(this.#voidEl);
        } else {
            this.#emptyEl.style.display = "flex";
        }
        /* --- */
        if (this.sorted) {
            this.#sort();
        }
        this.renderValue(this.value);
        await BusyIndicatorManager.unbusy();
    }

    #fillAfterStorageRegister(typeNames) {
        if (this.#typesWildcarded) {
            this.#fillSelectElements();
        } else {
            const acceptedTypes = this.types;
            for (const type of typeNames) {
                if (acceptedTypes.includes(type)) {
                    this.#fillSelectElements();
                    break;
                }
            }
        }
    }

}

FormElementRegistry.register("RelationSelect", RelationSelect);
customElements.define("emc-select-relation", RelationSelect);
registerFocusable("emc-select-relation");
