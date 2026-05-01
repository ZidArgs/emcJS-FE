import CustomElementDelegating from "../../../../element/CustomElementDelegating.js";
import TPL from "./DataGridHeaderCell.js.html" assert {type: "html"};
import STYLE from "./DataGridHeaderCell.js.css" assert {type: "css"};

export default class DataGridHeaderCell extends CustomElementDelegating {

    #dataGridId;

    #sortIndicatorEl;

    constructor(dataGridId) {
        if (typeof dataGridId !== "string" || dataGridId === "") {
            throw new Error("dataGridId must be a non empty string");
        }
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#dataGridId = dataGridId;
        this.#sortIndicatorEl = this.shadowRoot.getElementById("sort-indicator");
        /* --- */
        this.addEventListener("click", (event) => {
            event.stopPropagation();
            if (this.sortable) {
                const ev = new Event("sort", {bubbles:true});
                ev.data = {columnName: this.sortBy ?? this.columnName};
                this.dispatchEvent(ev);
            }
        });
        this.#sortIndicatorEl.addEventListener("click", (event) => {
            event.stopPropagation();
            if (this.sortable) {
                const ev = new Event("unsort", {bubbles:true});
                ev.data = {columnName: this.sortBy ?? this.columnName};
                this.dispatchEvent(ev);
            }
        });
    }

    get dataGridId() {
        return this.#dataGridId;
    }

    set columnName(val) {
        this.setAttribute("col-name", val);
    }

    get columnName() {
        return this.getAttribute("col-name");
    }

    set sortable(val) {
        this.setBooleanAttribute("sortable", val);
    }

    get sortable() {
        return this.getBooleanAttribute("sortable");
    }

    set sortBy(value) {
        this.setStringAttribute("sortby", value);
    }

    get sortBy() {
        return this.getStringAttribute("sortby");
    }

    set sortDirection(val) {
        this.setStringAttribute("sortdir", val);
    }

    get sortDirection() {
        return this.getStringAttribute("sortdir");
    }

    set sortOrder(val) {
        this.setNumberAttribute("sortorder", val, 1);
    }

    get sortOrder() {
        return this.getNumberAttribute("sortorder");
    }

    static get observedAttributes() {
        return ["col-name", "sortorder"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "col-name": {
                    const escapedColumnName = CSS.escape(this.columnName);
                    if (escapedColumnName) {
                        const styleWidth = `var(--width-${escapedColumnName}, 100%)`;
                        this.style.minWidth = `var(--min-width-${escapedColumnName}, 100%)`;
                        this.style.maxWidth = styleWidth;
                        this.style.width = styleWidth;
                    } else {
                        this.style.minWidth = "";
                        this.style.maxWidth = "";
                        this.style.width = "";
                    }
                } break;
                case "sortorder": {
                    this.#sortIndicatorEl.innerText = newValue;
                } break;
            }
        }
    }

}

customElements.define("emc-datagrid-headercell", DataGridHeaderCell);
