import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../i18n/builtin/I18nInput.js";
import TPL from "./DataGridCellBoolean.js.html" assert {type: "html"};
import STYLE from "./DataGridCellBoolean.js.css" assert {type: "css"};

export default class DataGridCellBoolean extends DataGridCell {

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
        this.#inputEventManager.set("change", (event) => {
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
        value = !!value && value !== "false";
        this.#valueEl.innerText = value ? "☑" : "☐";
        this.#valueEl.title = value ? "True" : "False";
        this.#inputEl.checked = value;
    }

    #onInput(event) {
        event.stopPropagation();
        event.preventDefault();
        const value = this.#inputEl.checked;
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

}

DataGridCell.registerCellType("boolean", DataGridCellBoolean, 70, {
    renderValue: () => {},
    editValue: () => {}
});
customElements.define("emc-datagrid-cell-boolean", DataGridCellBoolean);
