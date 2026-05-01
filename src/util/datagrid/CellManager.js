import {getFromObjectByPath} from "emcjs/util/helper/collection/ObjectContent.js";
import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {isEqual} from "emcjs/util/helper/Comparator.js";
import {debounce} from "emcjs/util/Debouncer.js";
import {getArrayMutations} from "emcjs/util/helper/collection/ArrayMutations.js";
import EventManager from "emcjs/util/event/EventManager.js";
import CellCache from "../../data/datagrid/CellCache.js";
import DataGridCell from "../../ui/dataview/datagrid/components/cell/DataGridCell.js";
import SelectCheckBox from "../../ui/form/element/components/checkbox/SelectCheckBox.js";

const BLACKLISTED_ATTRIBUTES = [
    "id",
    "class",
    "width",
    "height",
    "caption",
    "col-name",
    "row-key",
    "value",
    "style",
    "textcolor",
    "backcolor"
];

export default class CellManager extends EventTarget {

    #dataGridId;

    #cellCache;

    #target;

    #rowKey;

    #elements = new Map();

    #order = [];

    #types = new Map();

    #columnDefinitionCache = new Map();

    #valueCache = new Map();

    #sortCellEl;

    #selectCellEl;

    #sortable = false;

    #selectable = false;

    #selectEnd = false;

    #selectCheckboxEl;

    #lastCellEl;

    #eventManager = new EventManager();

    constructor(target, cellCache, dataGridId) {
        if (!(target instanceof HTMLTableRowElement)) {
            throw new TypeError("target must be of type HTMLTableRowElement");
        }
        if (!(cellCache instanceof CellCache)) {
            throw new TypeError("cellCache must be of type CellCache");
        }
        super();
        this.#dataGridId = dataGridId;
        this.#cellCache = cellCache;
        this.#target = target;

        this.#sortCellEl = document.createElement("td");
        this.#sortCellEl.classList.add("cell");
        this.#sortCellEl.classList.add("sort-cell");
        this.#sortCellEl.classList.add("fixed-cell");
        this.#sortCellEl.classList.add("fixed-cell-start");
        this.#sortCellEl.setAttribute("draggable", true);
        this.#sortCellEl.append(document.createElement("div"));

        this.#selectCellEl = document.createElement("td");
        this.#selectCellEl.classList.add("cell");
        this.#selectCellEl.classList.add("select-cell");
        this.#selectCellEl.classList.add("fixed-cell");
        this.#selectCellEl.classList.add("fixed-cell-start");
        this.#selectCheckboxEl = new SelectCheckBox();
        this.#selectCheckboxEl.classList.add("checkbox");
        this.#eventManager.set(this.#selectCheckboxEl, "change", (event) => {
            event.stopPropagation();
            const ev = new Event("selection", {
                bubbles: true,
                cancelable: true
            });
            ev.data = {
                value: this.#selectCheckboxEl.value,
                rowKey: this.#rowKey
            };
            this.#selectCheckboxEl.dispatchEvent(ev);
        }, {passive: true});
        this.#selectCellEl.append(this.#selectCheckboxEl);

        this.#lastCellEl = document.createElement("td");
        this.#lastCellEl.classList.add("cell");
        this.#lastCellEl.classList.add("last-cell");
    }

    set selected(value) {
        this.#selectCheckboxEl.value = !!value;
    }

    get selected() {
        return this.#selectCheckboxEl.value;
    }

    set sortable(value) {
        value = !!value;
        if (this.#sortable !== value) {
            this.#sortable = value;
            this.#renderSpecialCells();
        }
    }

    get sortable() {
        return this.#sortable;
    }

    set selectable(value) {
        value = !!value;
        if (this.#selectable !== value) {
            this.#selectable = value;
            this.#renderSpecialCells();
        }
    }

    get selectable() {
        return this.#selectable;
    }

    set selectEnd(value) {
        value = !!value;
        if (this.#selectEnd !== value) {
            this.#selectEnd = value;
            this.#selectCellEl.classList.toggle("fixed-cell-start", !value);
            this.#selectCellEl.classList.toggle("fixed-cell-end", value);
            this.#renderSpecialCells();
        }
    }

    get selectEnd() {
        return this.#selectEnd;
    }

    purge() {
        this.#target.innerHTML = "";
        this.#order = [];
        this.#elements.clear();
        this.#columnDefinitionCache.clear();

        this.#target.append(this.#lastCellEl);
        if (this.#selectEnd) {
            this.#target.append(this.#selectCellEl);
        } else {
            this.#target.prepend(this.#selectCellEl);
        }
    }

    manage(columnDefinition, rowData, isSelected) {
        if (!Array.isArray(columnDefinition)) {
            throw new TypeError("data must be an array");
        }

        const unused = new Set(this.#elements.keys());
        const newOrder = [];
        this.#rowKey = rowData.key;
        if (typeof this.#rowKey !== "string") {
            throw new TypeError("row key must be a string");
        }

        for (const index in columnDefinition) {
            const params = columnDefinition[index];
            if (typeof params !== "object" || Array.isArray(params)) {
                throw new TypeError("data entries must be objects");
            }
            const {
                name, type, ...columnData
            } = params;
            if (typeof name !== "string") {
                throw new TypeError("column name must be a string");
            }
            if (typeof type !== "string") {
                throw new TypeError("column type must be a string");
            }

            const value = getFromObjectByPath(rowData, name.split("."));
            newOrder.push(name);

            if (!this.#elements.has(name)) {
                const cellEl = this.composer(name, this.#rowKey, type);
                if (cellEl != null) {
                    this.mutator(cellEl, columnData, value, rowData);
                    this.#elements.set(name, cellEl);
                    this.#cellCache.addCell(this.#rowKey, name, cellEl);
                }
                this.#columnDefinitionCache.set(name, deepClone(columnData));
                this.#valueCache.set(name, deepClone(value));
                this.#types.set(name, type);
            } else if (this.#types.get(name) !== type) {
                const oldEl = this.#elements.get(name);
                const cellEl = this.composer(
                    name, this.#rowKey, type, columnData, value, rowData
                );
                oldEl.replaceWith(cellEl);
                if (cellEl != null) {
                    this.mutator(cellEl, columnData, value, rowData);
                    this.#elements.set(name, cellEl);
                }
                this.#columnDefinitionCache.set(name, deepClone(columnData));
                this.#valueCache.set(name, deepClone(value));
                this.#types.set(name, type);
                unused.delete(name);
            } else {
                const cellEl = this.#elements.get(name);
                const activeEl = cellEl.shadowRoot.activeElement;
                if (this.#checkChange(name, columnData, value)) {
                    this.mutator(cellEl, columnData, value, rowData);
                }
                unused.delete(name);
                if (activeEl != null) {
                    setTimeout(() => {
                        activeEl.focus();
                    }, 0);
                }
            }
        }

        for (const name of unused) {
            const cellEl = this.#elements.get(name);
            cellEl.remove();
            this.#elements.delete(name);
            this.#cellCache.removeCell(this.#rowKey, name);
            this.#columnDefinitionCache.delete(name);
        }

        // add select element
        this.#selectCheckboxEl.value = isSelected;
        this.#selectCheckboxEl.rowKey = this.#rowKey;

        if (!isEqual(newOrder, this.#order)) {
            this.#order = newOrder;
            this.#render();
        }
    }

    #checkChange(name, columnData, value) {
        if (typeof name !== "string") {
            return true;
        }
        const cachedColumnDefinition = this.#columnDefinitionCache.get(name);
        if (!isEqual(cachedColumnDefinition, columnData)) {
            this.#columnDefinitionCache.set(name, deepClone(columnData));
            return true;
        }
        const cachedValue = this.#valueCache.get(name);
        if (!isEqual(cachedValue, value)) {
            this.#valueCache.set(name, deepClone(value));
            return true;
        }
        return false;
    }

    composer(columnName, rowKey, type) {
        const cellEl = DataGridCell.createCell(type, this.#dataGridId);
        cellEl.classList.add("cell");
        cellEl.columnName = columnName;
        cellEl.rowKey = rowKey;
        return cellEl;
    }

    mutator(cellEl, options, value, rowData) {
        const currentAttributes = new Set([...cellEl.attributes].map((a) => {
            return a.name;
        }).filter((a) => {
            return !BLACKLISTED_ATTRIBUTES.includes(a);
        }));
        for (const [attrName, attrValue] of Object.entries(options)) {
            if (BLACKLISTED_ATTRIBUTES.includes(attrName)) {
                continue;
            }
            currentAttributes.delete(attrName);
            cellEl[attrName] = attrValue;
        }

        for (const attrName of currentAttributes) {
            cellEl[attrName] = null;
        }

        if (options.textcolor) {
            cellEl.style.color = options.textcolor;
        } else {
            cellEl.style.color = "";
        }
        if (options.backcolor) {
            cellEl.style.backgroundColor = options.backcolor;
        } else {
            cellEl.style.backgroundColor = "";
        }

        if (options.fixed === "start") {
            cellEl.classList.add("fixed-cell");
            cellEl.classList.add("fixed-cell-start");
        } else if (options.fixed === "end") {
            cellEl.classList.add("fixed-cell");
            cellEl.classList.add("fixed-cell-end");
        }

        cellEl.rowData = rowData;

        if (value != null) {
            cellEl.value = value;
        }
    }

    #render = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        // remove special cells
        this.#lastCellEl.remove();
        this.#selectCellEl.remove();
        this.#sortCellEl.remove();
        /* --- */
        const children = this.#target.children;
        if (children.length > 0) {
            const currentOrder = [...children].map((el) => el.columnName ?? "");
            const keys = [...this.#order];
            const {changes} = getArrayMutations(currentOrder, keys);
            // ---
            for (const {sequence} of changes) {
                for (const key of sequence) {
                    const el = this.#elements.get(key);
                    if (el != null) {
                        el.remove();
                    }
                }
            }
            for (const change of changes) {
                const {
                    sequence, position
                } = change;
                const els = [];
                for (const key of sequence) {
                    const el = this.#elements.get(key);
                    if (el != null) {
                        els.push(el);
                    }
                }
                if (position === 0) {
                    this.#target.prepend(...els);
                } else {
                    this.#target.children[position - 1].after(...els);
                }
            }
        } else {
            const els = [];
            for (const key of this.#order) {
                const el = this.#elements.get(key);
                if (el != null) {
                    els.push(el);
                }
            }
            this.#target.append(...els);
        }
        // add last cell
        const lastBeforeSticky = this.#target.querySelector(".cell:nth-last-child(1 of .cell:not(.fixed-cell-end))");
        if (lastBeforeSticky) {
            lastBeforeSticky.after(this.#lastCellEl);
        } else {
            this.#target.append(this.#lastCellEl);
        }
        // add select cell
        if (this.#selectable) {
            if (this.#selectEnd) {
                this.#target.append(this.#selectCellEl);
            } else {
                this.#target.prepend(this.#selectCellEl);
            }
        }
        // add sort cell
        if (this.#sortable) {
            this.#target.prepend(this.#sortCellEl);
        }
        // notify
        this.dispatchEvent(new Event("afterrender"));
    });

    #renderSpecialCells = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        // add select cell
        if (this.#selectable) {
            if (this.#selectEnd) {
                this.#target.append(this.#selectCellEl);
            } else {
                this.#target.prepend(this.#selectCellEl);
            }
        } else {
            this.#selectCellEl.remove();
        }
        // add sort cell
        if (this.#sortable) {
            this.#target.prepend(this.#sortCellEl);
        } else {
            this.#sortCellEl.remove();
        }
        this.dispatchEvent(new Event("afterrender"));
    });

}
