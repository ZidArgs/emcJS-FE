import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../i18n/builtin/I18nInput.js";
import TPL from "./DataGridCellNumber.js.html" assert {type: "html"};
import STYLE from "./DataGridCellNumber.js.css" assert {type: "css"};

export default class DataGridCellNumber extends DataGridCell {

    #valueEl;

    #inputEl;

    #inputEventManager;

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#inputEl = this.shadowRoot.getElementById("input");
        /* --- */
        this.#inputEventManager = new EventTargetManager(this.#inputEl);
        this.#inputEventManager.set("input", (event) => {
            this.#onInput(event);
        });
    }

    set decimals(val) {
        this.getIntAttribute("decimals", val);
    }

    get decimals() {
        return this.setIntAttribute("decimals");
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
                case "editable": {
                    if (this.editable) {
                        this.#inputEventManager.active = true;
                    } else {
                        this.#inputEventManager.active = false;
                    }
                } break;
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
                case "decimals": {
                    this.onValueChange(this.value);
                } break;
            }
        }
    }

    onValueChange(value) {
        if (this.decimals != null && this.decimals >= 0) {
            value = parseFloat(value) || 0;
            value = value.toFixed(this.decimals);
        }
        this.#valueEl.innerText = value;
        this.#valueEl.title = value;
        this.#inputEl.value = parseFloat(value);
    }

    #onInput = debounce((event) => {
        event.stopPropagation();
        event.preventDefault();
        let value = parseFloat(this.#inputEl.value);
        if (this.decimals != null && this.decimals >= 0) {
            value = parseFloat(value.toFixed(this.decimals));
        }
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

DataGridCell.registerCellType("number", DataGridCellNumber, 100);
customElements.define("emc-datagrid-cell-number", DataGridCellNumber);
