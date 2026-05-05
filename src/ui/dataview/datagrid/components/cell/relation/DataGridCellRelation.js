import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import OptionGroupRegistry from "../../../../../../registry/form/OptionGroupRegistry.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../form/element/select/relation/RelationSelect.js";
import TPL from "./DataGridCellRelation.js.html" assert {type: "html"};
import STYLE from "./DataGridCellRelation.js.css" assert {type: "css"};

export default class DataGridCellRelation extends DataGridCell {

    #valueEl;

    #nameEl;

    #typeEl;

    #inputEl;

    #optionGroup = null;

    #optionGroupEventTargetManager = new EventTargetManager();

    constructor(dataGridId) {
        super(dataGridId);
        this.shadowRoot.getElementById("content").append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#valueEl = this.shadowRoot.getElementById("value");
        this.#nameEl = this.shadowRoot.getElementById("name");
        this.#typeEl = this.shadowRoot.getElementById("type");
        this.#inputEl = this.shadowRoot.getElementById("input");
        /* --- */
        this.#inputEl.addEventListener("input", (event) => {
            if (this.editable) {
                this.#onInput(event);
            }
        });
        this.#optionGroupEventTargetManager.set("change", () => {
            this.#loadOptionsFromGroup();
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#optionGroupEventTargetManager.active = true;
        this.#loadOptionsFromGroup();
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#optionGroupEventTargetManager.active = false;
    }

    set value(val) {
        this.setJSONAttribute("value", val);
    }

    get value() {
        return this.getJSONAttribute("value");
    }

    set optiongroup(value) {
        this.setAttribute("optiongroup", value);
    }

    get optiongroup() {
        return this.getAttribute("optiongroup");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "editable",
            "disabled",
            "readonly",
            "optiongroup"
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
                case "optiongroup": {
                    if (newValue == null || newValue === "") {
                        this.#optionGroup = null;
                    } else {
                        this.#optionGroup = new OptionGroupRegistry(newValue);
                    }
                    this.#optionGroupEventTargetManager.switchTarget(this.#optionGroup);
                    this.#loadOptionsFromGroup();
                } break;
            }
        }
    }

    onValueChange(value) {
        if (value != null && typeof value.type === "string" && typeof value.name === "string" && value.type !== "" && value.name !== "") {
            this.#nameEl.innerText = value.name;
            this.#typeEl.innerText = value.type;
            this.#valueEl.title = `${value.name}\n[${value.type}]`;
            this.#inputEl.value = value;
        } else {
            this.#nameEl.innerText = "";
            this.#typeEl.innerText = "";
            this.#valueEl.title = "";
            this.#inputEl.value = value;
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

    #loadOptionsFromGroup() {
        this.innerHTML = "";
        if (this.#optionGroup != null) {
            for (const [value, label] of this.#optionGroup) {
                const optionEl = document.createElement("option");
                optionEl.setAttribute("value", value);
                if (typeof label === "string" && label !== "") {
                    optionEl.innerHTML = label;
                } else if (value !== "") {
                    optionEl.innerHTML = value;
                }
                this.append(optionEl);
            }
        }
    }

}

DataGridCell.registerCellType("relation", DataGridCellRelation, 300);
customElements.define("emc-datagrid-cell-relation", DataGridCellRelation);
