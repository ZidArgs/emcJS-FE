import {immute} from "emcjs/data/Immutable.js";
import SimpleDataProvider from "emcjs/util/dataprovider/SimpleDataProvider.js";
import {
    deleteAtIndexImmuted, sortDictListByArrayImmuted
} from "emcjs/util/helper/collection/ArrayMutations.js";
import {jsonParseSafe} from "emcjs/util/helper/JSON.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import ModalDialog from "../../../../modal/ModalDialog.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import Direction from "../../../../../enum/Direction.js";
import {setAttributes} from "../../../../../util/node/NodeAttributes.js";
import Column from "../../../../dataview/datagrid/Column.js";
import "../../../../dataview/datagrid/DataGrid.js";
import "../../components/searchheader/SearchHeader.js";
import "../../../FormRow.js";
import "../../../button/Button.js";
import TPL from "./GridInput.js.html" assert {type: "html"};
import STYLE from "./GridInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./GridInput.js.json" assert {type: "json"};

export default class GridInput extends AbstractFormElement {

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

    #addEl;

    #dataManager;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#searchHeaderEl = this.shadowRoot.getElementById("search-header");
        this.#gridEl = this.shadowRoot.getElementById("grid");
        this.#addEl = this.shadowRoot.getElementById("add");
        this.#dataManager = new SimpleDataProvider(this.#gridEl);
        /* --- */
        this.#addEl.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.#addElement();
        });
        /* --- */
        this.#gridEl.addEventListener("action::delete", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {rowKey} = event.data;
            this.#removeElement(rowKey);
        });
        /* --- */
        this.#gridEl.addEventListener("edit", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                value, rowKey, columnName
            } = event.data;
            const index = this.#getElementIndex(rowKey);
            if (index >= 0) {
                const currentValue = [...this.value];
                const currentRow = {...currentValue[index]};
                currentRow[columnName] = value;
                currentValue[index] = currentRow;
                this.value = currentValue;
                this.dispatchEvent(new Event("input", {
                    bubbles: true,
                    cancelable: true
                }));
            }
        });
        /* --- */
        this.#gridEl.addEventListener("sort-change", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {newOrder} = event;
            const currentValue = this.value ?? [];
            this.value = sortDictListByArrayImmuted(currentValue, newOrder, "key");
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
        /* --- */
        this.#searchHeaderEl.addEventListener("search", () => {
            const options = {filter: {}};
            const seearchValue = this.#searchHeaderEl.search;
            if (seearchValue != "") {
                options.filter = {name: seearchValue};
            }
            this.#dataManager.updateConfig(options);
        }, {capture: true});
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#searchHeaderEl.disabled = disabled;
        this.#gridEl.disabled = disabled;
        this.#addEl.disabled = disabled;
    }

    focus(options) {
        super.focus(options);
        this.#searchHeaderEl.focus(options);
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

    set stretched(value) {
        this.setAttribute("stretched", value);
    }

    get stretched() {
        return this.getAttribute("stretched");
    }

    set sorted(value) {
        this.setBooleanAttribute("sorted", value);
    }

    get sorted() {
        return this.getBooleanAttribute("sorted");
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
            "stretched",
            "sorted"
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
            case "stretched": {
                if (oldValue != newValue) {
                    this.#gridEl.stretched = this.stretched;
                }
            } break;
            case "sorted": {
                if (oldValue != newValue) {
                    this.#updateSortable(this.sorted);
                }
            } break;
        }
    }

    renderValue(value) {
        const data = Object.entries(value).map((row) => {
            return {
                key: row[0],
                ...row[1]
            };
        });
        this.#dataManager.setSource(data);
    }

    #updateSortable(value) {
        const columnNodeList = this.#gridEl.querySelectorAll("emc-datagrid-column");
        if (value === true) {
            this.#dataManager.setConfig({sort: ["key"]});
            this.#gridEl.sortable = false;
            for (const columnEl of columnNodeList) {
                columnEl.sortable = true;
            }
        } else {
            this.#dataManager.setConfig({sort: []});
            for (const columnEl of columnNodeList) {
                columnEl.sortable = false;
            }
            if (value === "manual") {
                this.#gridEl.sortable = true;
            } else {
                this.#gridEl.sortable = false;
            }
        }
    }

    async #addElement() {
        let rowKey = null;
        while (rowKey == null) {
            rowKey = await ModalDialog.prompt("Add item", "Please enter a new key");
            if (typeof rowKey !== "string") {
                return;
            }
            const index = this.#getElementIndex(rowKey);
            if (index >= 0) {
                await ModalDialog.alert("Key already exists", `The key "${rowKey}" does already exist. Please enter another one!`);
                rowKey = null;
            }
        }
        const currentValue = this.value ?? [];
        this.value = [...currentValue, {key: rowKey}];
        this.dispatchEvent(new Event("input", {
            bubbles: true,
            cancelable: true
        }));
    }

    async #removeElement(rowKey) {
        const result = await ModalDialog.confirm("Remove entry", `Do you really want to remove the entry?\n\n${rowKey}`);
        if (result !== true) {
            return;
        }
        const currentValue = this.value ?? [];
        const index = this.#getElementIndex(rowKey);
        if (index >= 0) {
            this.value = deleteAtIndexImmuted(currentValue, index);
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    #getElementIndex(rowKey) {
        const currentValue = this.value ?? [];
        return currentValue.findIndex((entry) => {
            return rowKey === entry.key;
        });
    }

    static fromConfig(config) {
        const inputEl = new GridInput();
        const {
            columns = [], ...params
        } = config;

        setAttributes(inputEl, params);

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
            inputEl.append(columnEl);
        }

        return inputEl;
    }

}

FormElementRegistry.register("GridInput", GridInput);
customElements.define("emc-input-grid", GridInput);
registerFocusable("emc-input-grid");
