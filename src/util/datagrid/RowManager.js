import {isEqual} from "emcjs/util/helper/Comparator.js";
import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {isArrayOf} from "emcjs/util/helper/CheckType.js";
import {debounce} from "emcjs/util/Debouncer.js";
import ArraySet from "emcjs/data/collection/ArraySet.js";
import {getArrayMutations} from "emcjs/util/helper/collection/ArrayMutations.js";
import EventManager from "emcjs/util/event/EventManager.js";
import CellCache from "../../data/datagrid/CellCache.js";
import CellManager from "./CellManager.js";

const DRAG_PREVIEW = document.createElement("div");
DRAG_PREVIEW.style.display = "none";
document.body.append(DRAG_PREVIEW);

export default class RowManager extends EventTarget {

    #dataGridId;

    #cellCache;

    #target;

    #elements = new Map();

    #elementCache = new Map();

    #sortOrder = [];

    #rowDataCache = new Map();

    #cachedColumnDefinition;

    #cellManagers = new Map();

    #sortable = false;

    #selectable = false;

    #selectEnd = false;

    #draggingRowEl;

    #eventManager = new EventManager();

    constructor(target, cellCache, dataGridId) {
        if (!(target instanceof HTMLTableSectionElement)) {
            throw new TypeError("target must be of type HTMLTableSectionElement");
        }
        if (!(cellCache instanceof CellCache)) {
            throw new TypeError("cellCache must be of type CellCache");
        }
        super();
        this.#dataGridId = dataGridId;
        this.#cellCache = cellCache;
        this.#target = target;
    }

    getSelectionStatus() {
        const result = {
            visibleCount: 0,
            selectedCount: 0,
            selectedList: []
        };
        for (const [key] of this.#elements) {
            result.visibleCount++;
            const manager = this.#cellManagers.get(key);
            if (manager != null && manager.selected) {
                result.selectedCount++;
                result.selectedList.push(key);
            }
        }
        return result;
    }

    setAllVisibleRowsSelected(value = true) {
        const result = [];
        for (const [key] of this.#elements) {
            const manager = this.#cellManagers.get(key);
            if (manager != null) {
                manager.selected = typeof value === "function" ? value(key) : value;
                result.push(key);
            }
        }
        return result;
    }

    setRowSelected(key, value = true) {
        const manager = this.#cellManagers.get(key);
        if (manager != null) {
            manager.selected = value;
        }
    }

    get isDragging() {
        return this.#draggingRowEl != null;
    }

    set sortOrder(value) {
        if (!isArrayOf(value, (el) => typeof el === "string")) {
            return;
        }
        const newOrder = value.filter((key) => this.#elements.has(key));
        for (const [key] of this.#elements) {
            if (!newOrder.includes(key)) {
                newOrder.push(key);
            }
        }
        const oldOrder = this.#sortOrder;
        if (!isEqual(newOrder, oldOrder)) {
            this.#sortOrder = newOrder;
            this.#render();
            const event = new Event("sort-change");
            event.newOrder = newOrder;
            event.oldOrder = oldOrder;
            this.dispatchEvent(event);
        }
    }

    get sortOrder() {
        return [...this.#sortOrder];
    }

    set sortable(value) {
        value = !!value;
        if (this.#sortable !== value) {
            this.#sortable = value;
            for (const [, manager] of this.#cellManagers) {
                manager.sortable = value;
            }
        }
    }

    get sortable() {
        return this.#sortable;
    }

    set selectable(value) {
        value = !!value;
        if (this.#selectable !== value) {
            this.#selectable = value;
            for (const [, manager] of this.#cellManagers) {
                manager.selectable = value;
            }
        }
    }

    get selectable() {
        return this.#selectable;
    }

    set selectEnd(value) {
        value = !!value;
        if (this.#selectEnd !== value) {
            this.#selectEnd = value;
            for (const [, manager] of this.#cellManagers) {
                manager.selectEnd = value;
            }
        }
    }

    get selectEnd() {
        return this.#selectEnd;
    }

    purge() {
        this.#target.innerHTML = "";
        this.#sortOrder = [];
        this.#elements.clear();
        this.#elementCache.clear();
        this.#rowDataCache.clear();
        this.#cellManagers.clear();
    }

    manage(rowDataList, columnDefinition, selectedRows, noCache = false) {
        if (!Array.isArray(rowDataList)) {
            throw new TypeError("data must be an array");
        }

        const columnDataChanged = this.#checkColumnDefinitionChange(columnDefinition);
        const unused = new Set(this.#elements.keys());
        const newOrder = [];

        for (const index in rowDataList) {
            const rowData = rowDataList[index];
            if (typeof rowData !== "object" || Array.isArray(rowData)) {
                throw new TypeError("data entries must be objects");
            }
            const key = rowData.key;
            const isSelected = selectedRows?.has(key) ?? false;
            if (typeof key !== "string") {
                throw new TypeError("row key must be a string");
            }

            newOrder.push(key);

            if (!this.#elements.has(key)) {
                const rowEl = this.#getOrCreateElement(key);
                this.#elements.set(key, rowEl);
                if (columnDataChanged || this.#checkRowDataChange(key, rowData)) {
                    this.mutator(rowEl, key, columnDefinition, rowData, isSelected);
                }
            } else {
                const rowEl = this.#elements.get(key);
                if (columnDataChanged || this.#checkRowDataChange(key, rowData)) {
                    this.mutator(rowEl, key, columnDefinition, rowData, isSelected);
                }
                unused.delete(key);
            }
        }

        for (const key of unused) {
            const rowEl = this.#elements.get(key);
            rowEl.remove();
            this.#elements.delete(key);
            if (noCache) {
                this.#eventManager.clear(rowEl);
                this.#elementCache.delete(key);
                this.#rowDataCache.delete(key);
                const cellManager = this.#cellManagers.get(key);
                this.#eventManager.clear(cellManager);
                this.#cellManagers.delete(key);
            }
        }

        this.sortOrder = newOrder;
    }

    #getOrCreateElement(key) {
        const rowEl = this.#elementCache.get(key);
        if (rowEl != null) {
            return rowEl;
        }
        const newRowEl = this.composer(key);
        this.#elementCache.set(key, newRowEl);
        return newRowEl;
    }

    #checkColumnDefinitionChange(columnDefinition) {
        if (this.#cachedColumnDefinition == null || !isEqual(this.#cachedColumnDefinition, columnDefinition)) {
            this.#cachedColumnDefinition = deepClone(columnDefinition);
            return true;
        }
        return false;
    }

    #checkRowDataChange(key, rowData) {
        if (typeof key !== "string") {
            return true;
        }
        const cachedRowData = this.#rowDataCache.get(key);
        if (!isEqual(cachedRowData, rowData)) {
            this.#rowDataCache.set(key, deepClone(rowData));
            return true;
        }
        return false;
    }

    composer(key) {
        const rowEl = document.createElement("tr");
        rowEl.rowKey = key;
        this.#eventManager.set(rowEl, "dragstart", (event) => {
            this.#draggingRowEl = rowEl;
            rowEl.classList.add("dragging");
            event.dataTransfer.dropEffect = "move";
            event.dataTransfer.setDragImage(DRAG_PREVIEW, 0, 0);
        });
        this.#eventManager.set(rowEl, "dragend", () => {
            this.#draggingRowEl = null;
            rowEl.classList.remove("dragging");
            this.#updateSortOrder();
        });
        this.#eventManager.set(rowEl, "dragover", (e) => {
            this.#dragOverItem(e.currentTarget, e.clientY);
        });

        const cellManager = new CellManager(rowEl, this.#cellCache, this.#dataGridId);
        cellManager.sortable = this.#sortable;
        cellManager.selectable = this.#selectable;
        cellManager.selectEnd = this.#selectEnd;
        this.#eventManager.set(cellManager, "beforerender", () => {
            this.dispatchEvent(new Event("beforerender"));
        });
        this.#eventManager.set(cellManager, "afterrender", () => {
            this.dispatchEvent(new Event("afterrender"));
        });
        this.#cellManagers.set(key, cellManager);

        return rowEl;
    }

    mutator(rowEl, key, columnData, rowData, isSelected) {
        const cellManager = this.#cellManagers.get(key);
        cellManager.manage(columnData, rowData, isSelected);
    }

    #render = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        const children = this.#target.children;
        if (children.length > 0) {
            const currentOrder = [...children].map((el) => el.rowKey ?? "");
            const mutated = new ArraySet(currentOrder);
            const keys = [...this.#sortOrder];
            const {
                changes, deleted
            } = getArrayMutations(currentOrder, keys);
            // delete
            mutated.delete(...deleted);
            for (const {sequence} of deleted) {
                for (const key of sequence) {
                    const el = this.#elements.get(key);
                    if (el != null) {
                        el.remove();
                    }
                }
            }
            // mutate
            for (const {
                position, sequence
            } of changes) {
                mutated.insertAt(position, ...sequence);
            }

            const els = [];
            for (const key of mutated) {
                const el = this.#elements.get(key);
                if (el != null) {
                    els.push(el);
                }
            }
            this.#target.append(...els);
        } else {
            const els = [];
            for (const key of this.#sortOrder) {
                const el = this.#elements.get(key);
                if (el != null) {
                    els.push(el);
                }
            }
            this.#target.append(...els);
        }
        this.dispatchEvent(new Event("afterrender"));
    });

    #dragOverItem(draggingOverItem, cursorY) {
        if (this.#draggingRowEl && draggingOverItem && draggingOverItem !== this.#draggingRowEl) {
            const draggedBox = this.#draggingRowEl.getBoundingClientRect();
            if (cursorY > draggedBox.bottom) {
                draggingOverItem.after(this.#draggingRowEl);
            } else if (cursorY < draggedBox.top) {
                draggingOverItem.before(this.#draggingRowEl);
            }
        }
    }

    #updateSortOrder() {
        const items = [...this.#target.querySelectorAll("tr")];
        const sortOrder = [];
        for (const item of items) {
            sortOrder.push(item.rowKey);
        }
        this.sortOrder = sortOrder;
    }

}
