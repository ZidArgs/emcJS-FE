import {immute} from "emcjs/data/Immutable.js";
import SimpleDataProvider from "emcjs/util/dataprovider/SimpleDataProvider.js";
import {jsonParseSafe} from "emcjs/util/helper/JSON.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import ModalDialog from "../../../../modal/ModalDialog.js";
import FormElementRegistry from "../../../../../data/registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusHelper.js";
import Direction from "../../../../../enum/Direction.js";
import "../../../../dataview/datagrid/DataGrid.js";
import "../../../../dataview/datagrid/Column.js";
import "../../components/searchheader/SearchHeader.js";
import "../../../FormRow.js";
import "../../../button/Button.js";
import TPL from "./KeyValueListInput.js.html" assert {type: "html"};
import STYLE from "./KeyValueListInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./KeyValueListInput.js.json" assert {type: "json"};

export default class KeyValueListInput extends AbstractFormElement {

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
        this.#gridEl.addEventListener("edit::value", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                value, rowKey
            } = event.data;
            const currentValue = {...this.value};
            if (rowKey in currentValue) {
                currentValue[rowKey] = value;
            }
            this.value = currentValue;
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
        return this.getJSONAttribute("value") ?? {};
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
        const data = Object.entries(value).map((row) => {
            return {
                key: row[0],
                name: row[0],
                value: row[1]
            };
        });
        this.#dataManager.setSource(data);
    }

    #updateSort(value) {
        if (value) {
            this.#dataManager.setConfig({sort: ["name"]});
        } else {
            this.#dataManager.setConfig({sort: []});
        }
    }

    async #addElement() {
        let rowKey = null;
        const currentValue = this.value ?? {};
        while (rowKey == null) {
            rowKey = await ModalDialog.prompt("Add item", "Please enter a new key");
            if (typeof rowKey !== "string") {
                return;
            }
            if (rowKey in currentValue) {
                await ModalDialog.alert("Key already exists", `The key "${rowKey}" does already exist. Please enter another one!`);
                rowKey = null;
            }
        }
        this.value = {
            ...currentValue,
            [rowKey]: ""
        };
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
        const currentValue = {...this.value};
        if (rowKey in currentValue) {
            delete currentValue[rowKey];
            this.value = currentValue;
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

}

FormElementRegistry.register("KeyValueListInput", KeyValueListInput);
customElements.define("emc-input-keyvaluelist", KeyValueListInput);
registerFocusable("emc-input-keyvaluelist");
