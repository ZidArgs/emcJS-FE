import EventManager from "@emcjs/core/util/event/EventManager.js";
import {deepClone} from "@emcjs/core/util/helper/DeepClone.js";
import {isEqual} from "@emcjs/core/util/helper/Comparator.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {getArrayMutations} from "@emcjs/core/util/helper/collection/ArrayMutations.js";
import StickyObserverGroupManager from "../observer/manager/StickyObserverGroupManager.js";
import SelectCheckBox from "../../ui/form/element/components/checkbox/SelectCheckBox.js";
import DataGridHeaderCell from "../../ui/dataview/datagrid/components/cell/DataGridHeaderCell.js";

export default class HeaderManager extends EventTarget {

    #dataGridId;

    #target;

    #stickyObserverManager;

    #elements = new Map();

    #order = [];

    #columnDefinitionCache = new Map();

    #sortHeaderCellEl;

    #selectHeaderCellEl;

    #sortable = false;

    #selectable = false;

    #selectEnd = false;

    #selectHeaderCheckboxEl;

    #lastHeaderCellEl;

    #eventManager = new EventManager();

    constructor(target, stickyObserver, dataGridId) {
        if (!(target instanceof HTMLTableRowElement)) {
            throw new TypeError("target must be of type HTMLTableRowElement");
        }
        super();
        this.#dataGridId = dataGridId;
        this.#target = target;

        this.#sortHeaderCellEl = document.createElement("th");
        this.#sortHeaderCellEl.classList.add("cell");
        this.#sortHeaderCellEl.classList.add("sort-cell");
        this.#sortHeaderCellEl.classList.add("fixed-cell");
        this.#sortHeaderCellEl.classList.add("fixed-cell-start");

        this.#selectHeaderCellEl = document.createElement("th");
        this.#selectHeaderCellEl.classList.add("cell");
        this.#selectHeaderCellEl.classList.add("select-cell");
        this.#selectHeaderCellEl.classList.add("fixed-cell");
        this.#selectHeaderCellEl.classList.add("fixed-cell-start");
        this.#selectHeaderCheckboxEl = new SelectCheckBox();
        this.#selectHeaderCheckboxEl.classList.add("checkbox");
        this.#eventManager.set(this.#selectHeaderCheckboxEl, "change", (event) => {
            event.stopPropagation();
            const value = this.#selectHeaderCheckboxEl.value;
            const ev = new Event("selectall", {
                bubbles: true,
                cancelable: true
            });
            ev.data = value;
            this.#selectHeaderCheckboxEl.dispatchEvent(ev);
        }, {passive: true});
        this.#selectHeaderCellEl.append(this.#selectHeaderCheckboxEl);

        this.#lastHeaderCellEl = document.createElement("th");
        this.#lastHeaderCellEl.classList.add("cell");
        this.#lastHeaderCellEl.classList.add("last-cell");

        this.#stickyObserverManager = new StickyObserverGroupManager(stickyObserver);
        this.#stickyObserverManager.observe(this.#sortHeaderCellEl);
        this.#stickyObserverManager.observe(this.#selectHeaderCellEl);
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
            this.#selectHeaderCellEl.classList.toggle("fixed-cell-start", !value);
            this.#selectHeaderCellEl.classList.toggle("fixed-cell-end", value);
            this.#renderSpecialCells();
        }
    }

    get selectEnd() {
        return this.#selectEnd;
    }

    setSelectionState(value) {
        this.#selectHeaderCheckboxEl.value = value;
    }

    getCellByColumnName(name) {
        return this.#elements.get(name);
    }

    purge() {
        this.#target.innerHTML = "";
        this.#order = [];
        this.#elements.clear();
        this.#columnDefinitionCache.clear();

        this.#target.append(this.#lastHeaderCellEl);
        if (this.#selectEnd) {
            this.#target.append(this.#selectHeaderCellEl);
        } else {
            this.#target.prepend(this.#selectHeaderCellEl);
        }
    }

    manage(columnDefinition) {
        if (!Array.isArray(columnDefinition)) {
            throw new TypeError("data must be an array");
        }

        const unused = new Set(this.#elements.keys());
        const newOrder = [];

        for (const index in columnDefinition) {
            const params = columnDefinition[index];
            if (typeof params !== "object" || Array.isArray(params)) {
                throw new TypeError("data entries must be objects");
            }
            const {
                name, ...columnData
            } = params;
            if (typeof name !== "string") {
                throw new TypeError("column name must be a string");
            }

            newOrder.push(name);

            if (!this.#elements.has(name)) {
                const headerCellEl = this.composer(name);
                if (headerCellEl != null) {
                    this.mutator(headerCellEl, name, columnData);
                    this.#elements.set(name, headerCellEl);
                }
                this.#columnDefinitionCache.set(name, deepClone(columnData));
            } else {
                const headerCellEl = this.#elements.get(name);
                if (this.#checkChange(name, columnData)) {
                    this.mutator(headerCellEl, name, columnData);
                }
                unused.delete(name);
            }
        }

        for (const name of unused) {
            const headerCellEl = this.#elements.get(name);
            headerCellEl.remove();
            this.#elements.delete(name);
            this.#columnDefinitionCache.delete(name);
        }

        if (!isEqual(newOrder, this.#order)) {
            this.#order = newOrder;
            this.#render();
        }
    }

    #checkChange(name, columnDefinition) {
        if (typeof name !== "string") {
            return true;
        }
        const cachedColumnDefinition = this.#columnDefinitionCache.get(name);
        if (!isEqual(cachedColumnDefinition, columnDefinition)) {
            this.#columnDefinitionCache.set(name, deepClone(columnDefinition));
            return true;
        }
        return false;
    }

    composer(name) {
        const headerCellEl = new DataGridHeaderCell(this.#dataGridId);
        headerCellEl.classList.add("cell");
        headerCellEl.columnName = name;
        return headerCellEl;
    }

    mutator(headerCellEl, name, columnData) {
        const {
            label, hidelabel, fixed, sortable = false, sortby
        } = columnData;

        headerCellEl.innerText = (label ?? name).trim();
        headerCellEl.title = label ?? name;
        headerCellEl.hideLabel = hidelabel;
        headerCellEl.sortable = sortable;
        headerCellEl.sortBy = sortby;

        if (fixed === "start") {
            headerCellEl.classList.add("fixed-cell");
            headerCellEl.classList.add("fixed-cell-start");
        } else if (fixed === "end") {
            headerCellEl.classList.add("fixed-cell");
            headerCellEl.classList.add("fixed-cell-end");
        }
    }

    #render = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        // remove special cells
        this.#lastHeaderCellEl.remove();
        this.#selectHeaderCellEl.remove();
        this.#sortHeaderCellEl.remove();
        /* --- */
        const children = this.#target.children;
        if (children.length > 0) {
            const currentOrder = [...children].map((el) => el.columnName ?? "");
            const keys = [...this.#order];
            const {
                changes, added, deleted
            } = getArrayMutations(currentOrder, keys);
            // ---
            for (const key of added) {
                const el = this.#elements.get(key);
                if (el != null) {
                    this.#stickyObserverManager.observe(el);
                }
            }
            for (const key of deleted) {
                const el = this.#elements.get(key);
                if (el != null) {
                    this.#stickyObserverManager.unobserve(el);
                }
            }
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
                    this.#stickyObserverManager.observe(el);
                }
            }
            this.#target.append(...els);
        }
        // add last cell
        const lastBeforeSticky = this.#target.querySelector(".cell:nth-last-child(1 of .cell:not(.fixed-cell-end))");
        if (lastBeforeSticky) {
            lastBeforeSticky.after(this.#lastHeaderCellEl);
        } else {
            this.#target.append(this.#lastHeaderCellEl);
        }
        // add select cell
        if (this.#selectable) {
            if (this.#selectEnd) {
                this.#target.append(this.#selectHeaderCellEl);
            } else {
                this.#target.prepend(this.#selectHeaderCellEl);
            }
        }
        // add sort cell
        if (this.#sortable) {
            this.#target.prepend(this.#sortHeaderCellEl);
        }
        this.dispatchEvent(new Event("afterrender"));
    });

    #renderSpecialCells = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        // add select cell
        if (this.#selectable) {
            if (this.#selectEnd) {
                this.#target.append(this.#selectHeaderCellEl);
            } else {
                this.#target.prepend(this.#selectHeaderCellEl);
            }
        } else {
            this.#selectHeaderCellEl.remove();
        }
        // add sort cell
        if (this.#sortable) {
            this.#target.prepend(this.#sortHeaderCellEl);
        } else {
            this.#sortHeaderCellEl.remove();
        }
        this.dispatchEvent(new Event("afterrender"));
    });

}
