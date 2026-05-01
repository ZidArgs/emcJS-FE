import {immute} from "emcjs/data/Immutable.js";
import i18n from "emcjs/util/I18n.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import {debounce} from "emcjs/util/Debouncer.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import BusyIndicatorManager from "../../../../../util/busy/BusyIndicatorManager.js";
import {nodeTextComparator} from "../../../../../util/node/NodeListSort.js";
import {setAttributes} from "../../../../../util/node/NodeAttributes.js";
import MutationObserverManager from "../../../../../util/observer/manager/MutationObserverManager.js";
import ImageSelectModal from "./components/ImageSelectModal.js";
import I18nOption from "../../../../i18n/builtin/I18nOption.js";
import ImageSelectPreviewManager from "../../../../../util/form/manager/ImageSelectPreviewManager.js";
import TPL from "./ImageSelect.js.html" assert {type: "html"};
import STYLE from "./ImageSelect.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ImageSelect.js.json" assert {type: "json"};

const MUTATION_CONFIG = {
    attributes: true,
    attributeFilter: ["value", "label"]
};

export default class ImageSelect extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    #iconEl;

    #inputEl;

    #buttonEl;

    #optionsSlotEl;

    #imageSelectModal = new ImageSelectModal();

    #i18nEventManager = new EventTargetManager(i18n);

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, () => {
        this.#onSlotChange();
    });

    #imageSelectPreviewManager;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#imageSelectModal.resize = ImageSelectModal.AXES.BOTH;
        this.#iconEl = this.shadowRoot.getElementById("icon");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("focus", () => {
            this.#buttonEl.focus();
        });
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.addEventListener("click", async () => {
            const result = await this.#imageSelectModal.show(this.value);
            if (result) {
                this.value =  result;
                this.dispatchEvent(new Event("input", {
                    bubbles: true,
                    cancelable: true
                }));
            }
        });
        this.#optionsSlotEl = this.shadowRoot.getElementById("options-slot");
        this.#optionsSlotEl.addEventListener("slotchange", () => {
            this.#onSlotChange();
        });
        /* --- */
        this.#imageSelectPreviewManager = new ImageSelectPreviewManager(this.#imageSelectModal);
        this.#imageSelectPreviewManager.addEventListener("afterrender", () => {
            this.renderValue(this.value);
        });
        /* --- */
        this.#i18nEventManager.active = this.getBooleanAttribute("sorted");
        this.#i18nEventManager.set("language", () => {
            this.#imageSelectPreviewManager.sort();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#imageSelectPreviewManager.sort();
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#inputEl.disabled = disabled;
    }

    validityCallback(message) {
        this.#inputEl.setCustomValidity(message);
    }

    focus(options) {
        super.focus(options);
        this.#buttonEl.focus(options);
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
            "sorted"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "placeholder": {
                if (oldValue != newValue) {
                    this.#inputEl.i18nPlaceholder = this.placeholder;
                }
            } break;
            case "sorted": {
                if (oldValue != newValue) {
                    const sorted = this.sorted;
                    if (sorted) {
                        this.#imageSelectPreviewManager.registerSortFunction(this.#sortByNameFunction);
                    } else {
                        this.#imageSelectPreviewManager.registerSortFunction();
                    }
                }
            } break;
        }
    }

    renderValue(value) {
        if (value != null && value !== "") {
            this.#iconEl.style.backgroundImage = `url(${value})`;
            this.#inputEl.value = value;
        } else {
            this.#iconEl.style.backgroundImage = "";
            this.#inputEl.value = "";
        }
    }

    #onSlotChange = debounce(async () => {
        await BusyIndicatorManager.busy();
        const data = [];
        const optionNodeList = this.#optionsSlotEl.assignedElements({flatten: true}).filter((el) => el.matches("option"));
        /* --- */
        const oldNodes = new Set(this.#mutationObserver.getObservedNodes());
        const newNodes = new Set();
        for (const el of optionNodeList) {
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
        for (const node of oldNodes) {
            this.#mutationObserver.unobserve(node);
        }
        for (const node of newNodes) {
            this.#mutationObserver.observe(node);
        }
        /* --- */
        this.#imageSelectPreviewManager.manage(data);
        /* --- */
        this.renderValue(this.value);
        await BusyIndicatorManager.unbusy();
    });

    #sortByNameFunction(entry0, entry1) {
        const {element: el0} = entry0;
        const {element: el1} = entry1;
        return nodeTextComparator(el0, el1);
    }

    static fromConfig(config) {
        const selectEl = new ImageSelect();
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

FormElementRegistry.register("ImageSelect", ImageSelect);
customElements.define("emc-select-image", ImageSelect);
registerFocusable("emc-select-image");
