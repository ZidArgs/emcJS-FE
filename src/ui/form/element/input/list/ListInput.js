import {immute} from "@emcjs/core/data/Immutable.js";
import SimpleDataProvider from "@emcjs/core/util/dataprovider/SimpleDataProvider.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import ModalDialog from "../../../../modal/ModalDialog.js";
import FormElementRegistry from "../../../../../registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import "../../../../dataview/datagrid/DataGrid.js";
import "../../../../dataview/datagrid/Column.js";
import "../../components/searchheader/SearchHeader.js";
import "../../../FormRow.js";
import "../../../button/Button.js";
import TPL from "./ListInput.js.html" assert {type: "html"};
import STYLE from "./ListInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./ListInput.js.json" assert {type: "json"};

export default class ListInput extends AbstractFormElement {

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
        this.#searchHeaderEl.addEventListener("search", () => {
            const options = {filter: {}};
            const seearchValue = this.#searchHeaderEl.search;
            if (seearchValue != "") {
                options.filter = {name: seearchValue};
            }
            this.#dataManager.updateConfig(options);
        }, true);
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
        const value = this.getJSONAttribute("value");
        if (value != null && typeof value === "object") {
            if (Array.isArray(value)) {
                return value;
            }
            return Object.keys(value);
        }
        return [];
    }

    set value(value) {
        if (typeof value === "string") {
            value = jsonParseSafe(value);
        }
        if (value != null && typeof value === "object") {
            if (Array.isArray(value)) {
                super.value = value;
            } else {
                super.value = Object.keys(value);
            }
        } else {
            super.value = [];
        }
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
            case "sorted": {
                if (oldValue != newValue) {
                    this.#updateSort(this.sorted);
                }
            } break;
        }
    }

    renderValue(value) {
        const data = value.map((row) => {
            return {key: row};
        });
        this.#dataManager.setSource(data);
    }

    #updateSort(value) {
        if (value) {
            this.#dataManager.setConfig({sort: ["key"]});
        } else {
            this.#dataManager.setConfig({sort: []});
        }
    }

    async #addElement() {
        let rowKey = null;
        const currentValue = this.value ?? [];
        while (rowKey == null) {
            rowKey = await ModalDialog.prompt("Add item", "Please enter a new key");
            if (typeof rowKey !== "string") {
                return;
            }
            if (currentValue.includes(rowKey)) {
                await ModalDialog.alert("Key already exists", `The key "${rowKey}" does already exist. Please enter another one!`);
                rowKey = null;
            }
        }
        this.value = [...currentValue, rowKey];
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
        const currentValue = this.value;
        const index = currentValue.indexOf(rowKey);
        if (index >= 0) {
            this.value = currentValue.toSpliced(index, 1);
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

}

FormElementRegistry.register("ListInput", ListInput);
customElements.define("emc-input-list", ListInput);
registerFocusable("emc-input-list");
