import DateUtil from "@emcjs/core/util/date/DateUtil.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../i18n/builtin/I18nInput.js";
import TPL from "./DataGridCellTime.js.html" assert {type: "html"};
import STYLE from "./DataGridCellTime.js.css" assert {type: "css"};

export default class DataGridCellTime extends DataGridCell {

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
            }
        }
    }

    onValueChange(value) {
        if (value != null && value != "") {
            if (!(value instanceof Date)) {
                value = new Date(value);
            }
            const convertedValue = DateUtil.formatLocal(value, "h:m:s");
            this.classList.remove("empty");
            this.#valueEl.innerText = convertedValue;
            this.#valueEl.title = convertedValue;
            this.#inputEl.value = convertedValue;
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

DataGridCell.registerCellType("time", DataGridCellTime, 200);
customElements.define("emc-datagrid-cell-time", DataGridCellTime);
