import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import OptionGroupRegistry from "../../../../../../data/registry/form/OptionGroupRegistry.js";
import DataGridCell from "../DataGridCell.js";
import "../../../../../form/element/select/image/ImageSelect.js";
import TPL from "./DataGridCellImage.js.html" assert {type: "html"};
import STYLE from "./DataGridCellImage.js.css" assert {type: "css"};

export default class DataGridCellImage extends DataGridCell {

    #valueEl;

    #inputEl;

    #optionGroup = null;

    #optionGroupEventTargetManager = new EventTargetManager(null, false);

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
                case "col-name": {
                    this.#inputEl.name = `${this.dataGridId}-${newValue}`;
                } break;
            }
        }
    }

    onValueChange(value) {
        if (value != null && value != "") {
            this.classList.remove("empty");
            this.#valueEl.innerText = value;
            this.#valueEl.title = value;
            this.#inputEl.value = value;
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

DataGridCell.registerCellType("image", DataGridCellImage, 300);
customElements.define("emc-datagrid-cell-image", DataGridCellImage);
