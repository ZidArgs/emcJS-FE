import {immute} from "@emcjs/core/data/Immutable.js";
import i18n from "@emcjs/core/util/I18n.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import DataReceiverMixin from "@emcjs/core/util/datareceiver/DataReceiverMixin.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import {setAttributes} from "../../../../../util/node/NodeAttributes.js";
import Column from "../../../../dataview/datagrid/Column.js";
import "../../../../dataview/datagrid/DataGrid.js";
import "../../components/searchheader/SearchHeader.js";
import TPL from "./GridSelect.js.html" assert {type: "html"};
import STYLE from "./GridSelect.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./GridSelect.js.json" assert {type: "json"};

export default class GridSelect extends DataReceiverMixin(AbstractFormElement) {

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

    #gridEl;

    #i18nEventManager = new EventTargetManager(i18n, false);

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#searchHeaderEl = this.shadowRoot.getElementById("search-header");
        this.#gridEl = this.shadowRoot.getElementById("grid");
        this.#gridEl.addEventListener("selection", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.value = event.data;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        /* --- */
        this.#gridEl.addEventListener("sort", (event) => {
            event.stopPropagation();
            const {columnName} = event.data;
            const ev = new Event("sort");
            ev.data = {columnName};
            this.dispatchEvent(ev);
        });
        this.#gridEl.addEventListener("unsort", (event) => {
            event.stopPropagation();
            const {columnName} = event.data;
            const ev = new Event("unsort");
            ev.data = {columnName};
            this.dispatchEvent(ev);
        });
        /* --- */
        this.#searchHeaderEl.addEventListener("search", (event) => {
            event.stopPropagation();
            const search = this.#searchHeaderEl.search;
            const ev = new Event("search");
            ev.data = {search};
            this.dispatchEvent(ev);
        }, true);
        /* --- */
        this.#i18nEventManager.set(["language", "translation"], () => {
            this.dispatchEvent(new Event("refresh"));
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#searchHeaderEl.disabled = disabled;
        this.#gridEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#searchHeaderEl.focus(options);
    }

    async setData(data) {
        this.#gridEl.setData(data);
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

    set stretched(value) {
        this.setAttribute("stretched", value);
    }

    get stretched() {
        return this.getAttribute("stretched");
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
            "selectend",
            "stretched"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    const readonly = this.readOnly;
                    this.#gridEl.readOnly = readonly;
                    this.#searchHeaderEl.readOnly = readonly;
                }
            } break;
            case "multiple": {
                if (oldValue != newValue) {
                    const multiple = this.multiple;
                    this.#gridEl.multiple = multiple;
                    this.#searchHeaderEl.selectable = multiple;
                }
            } break;
            case "allowdeselect": {
                if (oldValue != newValue) {
                    this.#gridEl.allowDeselect = this.allowDeselect;
                }
            } break;
            case "selectend": {
                if (oldValue != newValue) {
                    const selectEnd = this.selectEnd;
                    this.#gridEl.selectEnd = selectEnd;
                    this.#searchHeaderEl.selectEnd = selectEnd;
                }
            } break;
            case "stretched": {
                if (oldValue != newValue) {
                    this.#gridEl.stretched = this.stretched;
                }
            } break;
        }
    }

    renderValue(value) {
        this.#gridEl.setSelected(value);
    }

    static fromConfig(config) {
        const selectEl = new GridSelect();
        const {
            columns = {}, options = [], ...params
        } = config;

        setAttributes(selectEl, params);

        for (const column of columns) {
            const columnEl = new Column();
            const {key = ""} = column;
            columnEl.name = key;
            if (key === "key") {
                const {
                    label = "", width = 0
                } = column;
                columnEl.type = "string";
                columnEl.label = label;
                columnEl.width = width;
                columnEl.editable = false;
            } else {
                const {
                    type = "string", label = "", width = 0, editable = false
                } = column;
                columnEl.type = type;
                columnEl.label = label;
                columnEl.width = width;
                columnEl.editable = editable;
            }
            selectEl.append(columnEl);
        }

        selectEl.setData(options);

        return selectEl;
    }

    busy() {
        this.#gridEl.busy();
    }

    unbusy() {
        this.#gridEl.unbusy();
    }

}

FormElementRegistry.register("GridSelect", GridSelect);
customElements.define("emc-select-grid", GridSelect);
registerFocusable("emc-select-grid");
