import DataGridCell from "../DataGridCell.js";
import "../../../../../form/button/Button.js";
import TPL from "./DataGridCellButton.js.html" assert {type: "html"};
import STYLE from "./DataGridCellButton.js.css" assert {type: "css"};

export default class DataGridCellButton extends DataGridCell {

    #inputEl;

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#inputEl = this.shadowRoot.getElementById("input");
        this.#inputEl.addEventListener("click", (event) => {
            this.#onClick(event);
        });
    }

    get text() {
        return this.getAttribute("text");
    }

    set text(val) {
        this.setAttribute("text", val);
    }

    get iconType() {
        return this.getAttribute("icon-type");
    }

    set iconType(val) {
        this.setAttribute("icon-type", val);
    }

    get icon() {
        return this.getAttribute("icon");
    }

    set icon(val) {
        this.setAttribute("icon", val);
    }

    get tooltip() {
        return this.getAttribute("tooltip");
    }

    set tooltip(val) {
        this.setAttribute("tooltip", val);
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "text",
            "icon-type",
            "icon",
            "tooltip",
            "disabled",
            "readonly"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        if (oldValue != newValue) {
            switch (name) {
                case "text": {
                    this.onValueChange(this.value);
                } break;
                case "icon-type": {
                    this.#inputEl.iconType = this.iconType;
                } break;
                case "icon": {
                    this.#inputEl.icon = this.icon;
                } break;
                case "tooltip": {
                    this.#inputEl.tooltip = this.tooltip;
                } break;
                case "disabled":
                case "readonly": {
                    this.#inputEl.disabled = this.disabled || this.readOnly;
                } break;
            }
        }
    }

    onValueChange(value) {
        if (this.text != null) {
            this.#inputEl.text = this.text;
        } else if (value != null) {
            this.#inputEl.text = value;
        } else {
            this.#inputEl.text = "...";
        }
    }

    #onClick(event) {
        event.stopPropagation();
        event.preventDefault();
        const ev = new Event("action", {bubbles: true});
        ev.data = {
            action: this.action,
            columnName: this.columnName,
            rowKey: this.rowKey
        };
        this.dispatchEvent(ev);
    }

}

DataGridCell.registerCellType("button", DataGridCellButton, 50);
customElements.define("emc-datagrid-cell-button", DataGridCellButton);
