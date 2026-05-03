import {immute} from "@emcjs/core/data/Immutable.js";
import i18n from "@emcjs/core/util/I18n.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import SimpleDataProvider from "@emcjs/core/util/dataprovider/SimpleDataProvider.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import {setAttributes} from "../../../../../util/node/NodeAttributes.js";
import MutationObserverManager from "../../../../../util/observer/manager/MutationObserverManager.js";
import BusyIndicatorManager from "../../../../../util/busy/BusyIndicatorManager.js";
import I18nOption from "../../../../i18n/builtin/I18nOption.js";
import ListSelectEntry from "./components/ListSelectEntry.js";
import "../../../../dataview/datalist/DataListSelect.js";
import "../../components/searchheader/SearchHeader.js";
import TPL from "./ListSelect.js.html" assert {type: "html"};
import STYLE from "./ListSelect.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ListSelect.js.json" assert {type: "json"};

const MUTATION_CONFIG = {
    attributes: true,
    attributeFilter: ["value"]
};

export default class ListSelect extends AbstractFormElement {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    static get AXES() {
        return Direction;
    }

    #searchHeaderEl;

    #listEl;

    #dataManager;

    #optionsContainerEl;

    #i18nEventManager = new EventTargetManager(i18n, false);

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, () => {
        this.#onSlotChange();
    });

    #keyIndex = new Set();

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#optionsContainerEl = this.shadowRoot.getElementById("options-container");
        this.#optionsContainerEl.addEventListener("slotchange", () => {
            this.#onSlotChange();
        });
        this.#searchHeaderEl = this.shadowRoot.getElementById("search-header");
        /* --- */
        this.#listEl = this.shadowRoot.getElementById("list");
        this.#listEl.setListEntryClass(ListSelectEntry);
        this.#dataManager = new SimpleDataProvider(this.#listEl);
        this.#listEl.addEventListener("selection", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.value = event.data;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        this.#listEl.addEventListener("selection-header", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.#searchHeaderEl.selected = event.value;
        });
        /* --- */
        this.#searchHeaderEl.addEventListener("select", () => {
            const value = this.#searchHeaderEl.selected;
            if (value) {
                this.#listEl.selectAll();
            } else {
                this.#listEl.clearSelected();
            }
        });
        this.#searchHeaderEl.addEventListener("search", () => {
            const options = {filter: {}};
            const seearchValue = this.#searchHeaderEl.search;
            if (seearchValue != "") {
                options.filter = {name: seearchValue};
            }
            this.#dataManager.updateConfig(options);
        }, true);
        /* --- */
        this.#i18nEventManager.set("language", () => {
            this.#dataManager.refresh();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#dataManager.refresh();
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#listEl.disabled = disabled;
        this.#searchHeaderEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#searchHeaderEl.focus(options);
    }

    getValueKeys() {
        return [...this.#keyIndex.entries()];
    }

    set defaultValue(value) {
        this.setJSONAttribute("value", value);
    }

    get defaultValue() {
        return this.getJSONAttribute("value") ?? [];
    }

    set value(value) {
        if (typeof value === "string") {
            value = jsonParseSafe(value);
        }
        super.value = value;
    }

    get value() {
        return super.value;
    }

    set sorted(value) {
        this.setBooleanAttribute("sorted", value);
    }

    get sorted() {
        return this.getBooleanAttribute("sorted");
    }

    set multiple(val) {
        this.setBooleanAttribute("multiple", val);
    }

    get multiple() {
        return this.getBooleanAttribute("multiple");
    }

    set allowDeselect(value) {
        this.setBooleanAttribute("allowdeselect", value);
    }

    get allowDeselect() {
        return this.getBooleanAttribute("allowdeselect");
    }

    set selectEnd(value) {
        this.setBooleanAttribute("selectend", value);
    }

    get selectEnd() {
        return this.getBooleanAttribute("selectend");
    }

    set resize(value) {
        this.setEnumAttribute("resize", value, Direction);
    }

    get resize() {
        return this.getEnumAttribute("resize");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "readonly",
            "sorted",
            "multiple",
            "allowdeselect",
            "selectend"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    const readonly = this.readOnly;
                    this.#listEl.readOnly = readonly;
                    this.#searchHeaderEl.readOnly = readonly;
                }
            } break;
            case "sorted": {
                if (oldValue != newValue) {
                    this.#updateSort(this.sorted);
                }
            } break;
            case "multiple": {
                if (oldValue != newValue) {
                    const multiple = this.multiple;
                    this.#listEl.multiple = multiple;
                    this.#searchHeaderEl.selectable = multiple;
                }
            } break;
            case "allowdeselect": {
                if (oldValue != newValue) {
                    this.#listEl.allowDeselect = this.allowDeselect;
                }
            } break;
            case "selectend": {
                if (oldValue != newValue) {
                    const selectEnd = this.selectEnd;
                    this.#listEl.selectEnd = selectEnd;
                    this.#searchHeaderEl.selectEnd = selectEnd;
                }
            } break;
        }
    }

    renderValue(value) {
        this.#listEl.setSelected(value);
    }

    #updateSort(value) {
        if (value) {
            this.#i18nEventManager.active = true;
            this.#dataManager.setConfig({sortFunction: (record0, record1) => i18n.compareNumberedValuesTranslated(record0.name, record1.name)});
        } else {
            this.#i18nEventManager.active = false;
            this.#dataManager.setConfig({sortFunction: false});
        }
    }

    #onSlotChange = debounce(async () => {
        await BusyIndicatorManager.busy();
        const data = [];
        const optionNodeList = this.#optionsContainerEl.assignedElements({flatten: true}).filter((el) => el.matches("[value]"));
        const oldNodes = new Set(this.#mutationObserver.getObservedNodes());
        const newNodes = new Set();
        for (const el of optionNodeList) {
            data.push({
                key: el.value || el.innerText,
                name: el.i18nValue || el.label || el.innerText
            });
            /* --- */
            if (oldNodes.has(el)) {
                oldNodes.delete(el);
            } else {
                newNodes.add(el);
            }
        }
        for (const node of oldNodes) {
            this.#keyIndex.delete(node.key);
            this.#mutationObserver.unobserve(node);
        }
        for (const node of newNodes) {
            this.#keyIndex.add(node.key);
            this.#mutationObserver.observe(node);
        }
        this.#dataManager.setSource(data);
        await BusyIndicatorManager.unbusy();
    });

    static fromConfig(config) {
        const selectEl = new ListSelect();
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

FormElementRegistry.register("ListSelect", ListSelect);
customElements.define("emc-select-list", ListSelect);
registerFocusable("emc-select-list");
