import DataGridCell from "../DataGridCell.js";
import BoolOrLogicModal from "./components/BoolOrLogicModal.js";
import "../../../../../form/element/input/action/ActionInput.js";
import TPL from "./DataGridCellBoolOrLogic.js.html" assert {type: "html"};
import STYLE from "./DataGridCellBoolOrLogic.js.css" assert {type: "css"};

const BOOL_OR_LOGIC_MODALS = new Map();

export default class DataGridCellBoolOrLogic extends DataGridCell {

    #valueEl;

    #inputEl;

    #boolOrLogicModal;

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.setValueRenderer((value) => this.#getRenderValue(value));
        this.#inputEl.addEventListener("change", (event) => {
            if (this.editable) {
                this.#onInput(event);
            }
        });
        this.#inputEl.addEventListener("action", () => {
            if (this.#boolOrLogicModal != null) {
                this.#boolOrLogicModal.value = this.value;
                this.#boolOrLogicModal.onsubmit = (event) => {
                    this.value = this.#boolOrLogicModal.value;
                    this.#onInput();
                    event.stopPropagation();
                    event.preventDefault();
                };
                this.#boolOrLogicModal.show();
            }
        });
    }

    #onInput() {
        const value = this.#inputEl.value;
        this.value = value;
        const ev = new Event("edit", {bubbles: true});
        ev.data = {
            value,
            action: this.action,
            columnName: this.columnName,
            rowKey: this.rowKey
        };
        this.dispatchEvent(ev);
    }

    set value(val) {
        this.setJSONAttribute("value", val);
    }

    get value() {
        return this.getJSONAttribute("value");
    }

    set nullable(value) {
        this.setBooleanAttribute("nullable", value);
    }

    get nullable() {
        return this.getBooleanAttribute("nullable");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "editable",
            "disabled",
            "readonly",
            "nullable",
            "row-key"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        if (oldValue != newValue) {
            switch (name) {
                case "disabled": {
                    this.#inputEl.disabled = this.disabled;
                } break;
                case "readonly": {
                    if (this.readOnly) {
                        this.#inputEl.setAttribute("readonly", "");
                    } else {
                        this.#inputEl.removeAttribute("readonly");
                    }
                } break;
                case "nullable": {
                    if (this.#boolOrLogicModal != null) {
                        this.#boolOrLogicModal.nullable = this.nullable;
                    }
                } break;
                case "row-key": {
                    // this.#inputEl.setModalRefName(newValue);
                } break;
                case "col-name": {
                    if (newValue) {
                        const inputId = `${this.dataGridId}-${this.columnName}`;
                        this.#inputEl.name = inputId;
                        this.#boolOrLogicModal = this.#getModal(inputId);
                        this.#boolOrLogicModal.nullable = this.nullable;
                    } else {
                        this.#inputEl.name = "";
                        this.#boolOrLogicModal = null;
                    }
                } break;
            }
        }
    }

    onValueChange(value) {
        const renderedValue = this.#getRenderValue(value);
        this.#valueEl.innerText = renderedValue;
        this.#valueEl.title = renderedValue;
        this.#inputEl.value = value;
    }

    #getRenderValue(value) {
        if (typeof value === "object" && value != null) {
            return "Logic";
        } else if (value === false) {
            return "False";
        } else if (value === true) {
            return "True";
        }
        return "Null";
    }

    #getModal(modalId) {
        if (modalId) {
            if (BOOL_OR_LOGIC_MODALS.has(modalId)) {
                return BOOL_OR_LOGIC_MODALS.get(modalId);
            }
            const modal = new BoolOrLogicModal();
            BOOL_OR_LOGIC_MODALS.set(modalId, modal);
            modal.name = modalId;
            return modal;
        }
    }

}

DataGridCell.registerCellType("boolorlogic", DataGridCellBoolOrLogic, 210);
customElements.define("emc-datagrid-cell-boolorlogic", DataGridCellBoolOrLogic);
