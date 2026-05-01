import {debounce} from "emcjs/util/Debouncer.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../i18n/builtin/I18nInput.js";
import "../../../../../i18n/I18nLabel.js";
import "../../../../../i18n/I18nTooltip.js";
import TPL from "./DataGridCellI18n.js.html" assert {type: "html"};
import STYLE from "./DataGridCellI18n.js.css" assert {type: "css"};

export default class DataGridCellI18n extends DataGridCell {

    #tooltipEl;

    #valueEl;

    #inputEl;

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#tooltipEl = this.shadowRoot.getElementById("tooltip");
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
            this.classList.remove("empty");
            this.#valueEl.i18nValue = value;
            this.#tooltipEl.i18nValue = value;
            this.#inputEl.value = value;
        } else {
            this.classList.add("empty");
            this.#valueEl.i18nValue = "";
            this.#tooltipEl.i18nValue = "";
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

DataGridCell.registerCellType("i18n", DataGridCellI18n, 400);
customElements.define("emc-datagrid-cell-i18n", DataGridCellI18n);
