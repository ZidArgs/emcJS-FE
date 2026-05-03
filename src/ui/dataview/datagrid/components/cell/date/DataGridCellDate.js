import DateUtil from "@emcjs/core/util/date/DateUtil.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../i18n/builtin/I18nInput.js";
import TPL from "./DataGridCellDate.js.html" assert {type: "html"};
import STYLE from "./DataGridCellDate.js.css" assert {type: "css"};

export default class DataGridCellDate extends DataGridCell {

    #valueEl;

    #inputEl;

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("input", (event) => {
            if (this.editable) {
                this.#onInput(event);
            }
        });
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "editable",
            "disabled",
            "readonly"
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
            }
        }
    }

    onValueChange(value) {
        if (value != null && value != "") {
            if (!(value instanceof Date)) {
                value = new Date(value);
            }
            const viewValue = DateUtil.formatLocal(value, "D.M.Ys");
            const editValue = DateUtil.formatLocal(value, "Y-M-D");
            this.classList.remove("empty");
            this.#valueEl.innerText = viewValue;
            this.#valueEl.title = viewValue;
            this.#inputEl.value = editValue;
        } else {
            this.classList.add("empty");
            this.#valueEl.innerText = "";
            this.#valueEl.title = "";
            this.#inputEl.value = "";
        }
    }

    #onInput = debounce((event) => {
        event.stopPropagation();
        event.preventDefault();
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
    }, 300);

}

DataGridCell.registerCellType("date", DataGridCellDate, 200);
customElements.define("emc-datagrid-cell-date", DataGridCellDate);
