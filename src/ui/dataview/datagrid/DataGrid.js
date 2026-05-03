
import {appUID} from "@emcjs/core/util/helper/UniqueGenerator.js";
import {isEqual} from "@emcjs/core/util/helper/Comparator.js";
import {deepClone} from "@emcjs/core/util/helper/DeepClone.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {filterInPlace} from "@emcjs/core/util/helper/collection/ArrayMutations.js";
import DataReceiverMixin from "@emcjs/core/util/datareceiver/DataReceiverMixin.js";
import CustomElement from "../../element/CustomElement.js";
import CellCache from "../../../data/datagrid/CellCache.js";
import BusyIndicator from "../../BusyIndicator.js";
import StickyObserver from "../../../util/observer/StickyObserver.js";
import HeaderManager from "../../../util/datagrid/HeaderManager.js";
import RowManager from "../../../util/datagrid/RowManager.js";
import {getAllAttributes} from "../../../util/node/NodeAttributes.js";
import MutationObserverManager from "../../../util/observer/manager/MutationObserverManager.js";
import Column from "./Column.js";
import DataGridCell from "./components/cell/DataGridCell.js";
import "../../i18n/I18nLabel.js";
import "../../../loader/CellTypeLoader.js";
import TPL from "./DataGrid.js.html" assert {type: "html"};
import STYLE from "./DataGrid.js.css" assert {type: "css"};

const MUTATION_CONFIG = {attributes: true};

const PX_REGEXP = /^[0-9]+(?:\.[0-9]+)?(?:px)?$/;
const PERCENT_REGEXP = /^[0-9]+(?:\.[0-9]+)?%$/;

function getStyleLengthValue(minWidth, widthValue) {
    if (widthValue != null) {
        if (PERCENT_REGEXP.test(widthValue)) {
            return `${parseFloat(widthValue)}%`;
        }
        if (PX_REGEXP.test(widthValue)) {
            return `${Math.max(50, minWidth, parseFloat(widthValue))}px`;
        }
    }
    return `${Math.max(200, minWidth)}px`;
}

export default class DataGrid extends DataReceiverMixin(CustomElement) {

    #internalId = appUID("data-grid");

    #cellCache = new CellCache();

    #scrollContainerEl;

    #tableEl;

    #headEl;

    #headerEl;

    #bodyEl;

    #nocolumnsContainerEl;

    #emptyContainerEl;

    #columnContainerEl;

    #columnDefinition = [];

    #data = [];

    #headerManager;

    #rowManager;

    #selected = new Set();

    #stretched = null;

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, () => {
        this.#onSlotChange();
    });

    #stickyObserver;

    #leftFixes = [];

    #rightFixes = [];

    #busyIndicator = new BusyIndicator();

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#busyIndicator.setTarget(this.shadowRoot);
        /* --- */
        /* --- */
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#tableEl = this.shadowRoot.getElementById("table");
        this.#headEl = this.shadowRoot.getElementById("head");
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#bodyEl = this.shadowRoot.getElementById("body");
        this.#nocolumnsContainerEl = this.shadowRoot.getElementById("nocolumns-container");
        this.#emptyContainerEl = this.shadowRoot.getElementById("empty-container");
        /* --- */
        this.#columnContainerEl = this.shadowRoot.getElementById("column-container");
        this.#columnContainerEl.addEventListener("slotchange", () => {
            this.#onSlotChange();
        });
        this.#onSlotChange();
        /* --- */
        this.#stickyObserver = new StickyObserver({root: this.#scrollContainerEl});
        this.#headerManager = new HeaderManager(this.#headerEl, this.#stickyObserver, this.#internalId);
        this.#headerManager.addEventListener("afterrender", debounce(async () => {
            this.#calculateCellFixes(this.#headEl);
        }));
        this.#stickyObserver.onStuckChange((entries) => {
            for (const entry of entries) {
                const {
                    target, isStuck
                } = entry;
                this.#setStuckForColumn(target, isStuck);
            }
        });
        this.#rowManager = new RowManager(this.#bodyEl, this.#cellCache, this.#internalId);
        this.#rowManager.addEventListener("afterrender", debounce(() => {
            this.#updateSelectionAfterRender();
            this.#refreshStuckAfterRender();
            this.#applyCellFixes(this.#bodyEl);
        }));
        this.#rowManager.addEventListener("sort-change", (event) => {
            event.stopPropagation();
            const {
                newOrder, oldOrder
            } = event;
            const ev = new Event("sort-change");
            ev.newOrder = newOrder;
            ev.oldOrder = oldOrder;
            this.dispatchEvent(ev);
        });
        /* --- */
        this.#tableEl.addEventListener("menu", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                value, columnName, rowKey
            } = event.data;
            const ev = new PointerEvent("menu", event);
            ev.data = {
                value,
                columnName,
                rowKey,
                source: event.srcElement
            };
            this.dispatchEvent(ev);
        });
        this.#tableEl.addEventListener("action", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                action, columnName, rowKey
            } = event.data;
            if (action == null || typeof action !== "string" || action === "") {
                const ev = new Event("action");
                ev.data = {
                    columnName,
                    rowKey,
                    source: event.srcElement
                };
                this.dispatchEvent(ev);
            } else {
                const ev = new Event(`action::${action}`);
                ev.data = {
                    columnName,
                    rowKey,
                    source: event.srcElement
                };
                this.dispatchEvent(ev);
            }
        });
        this.#tableEl.addEventListener("edit", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                value, action, columnName, rowKey
            } = event.data;
            if (action == null || typeof action !== "string" || action === "") {
                const ev = new Event("edit");
                ev.data = {
                    value,
                    columnName,
                    rowKey,
                    source: event.srcElement
                };
                this.dispatchEvent(ev);
            } else {
                const ev = new Event(`edit::${action}`);
                ev.data = {
                    value,
                    columnName,
                    rowKey,
                    source: event.srcElement
                };
                this.dispatchEvent(ev);
            }
        });
        this.#tableEl.addEventListener("selectall", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const value = event.data;
            const changedKeys = this.#rowManager.setAllVisibleRowsSelected(value);
            for (const rowKey of changedKeys) {
                if (value) {
                    this.#selected.add(rowKey);
                } else {
                    this.#selected.delete(rowKey);
                }
            }
            const ev = new Event("selection");
            ev.data = [...this.#selected].sort();
            this.dispatchEvent(ev);
        });
        this.#tableEl.addEventListener("selection", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const {
                value, rowKey
            } = event.data;
            if (!this.multiple) {
                if (value) {
                    const oldrowKey = [...this.#selected][0];
                    this.#rowManager.setRowSelected(oldrowKey, false);
                    this.#selected.clear();
                    this.#selected.add(rowKey);
                } else if (this.allowDeselect) {
                    this.#selected.clear();
                } else {
                    const oldRowKey = [...this.#selected][0];
                    this.#rowManager.setRowSelected(oldRowKey, true);
                }
            } else if (value) {
                this.#selected.add(rowKey);
            } else {
                this.#selected.delete(rowKey);
            }
            this.#updateSelectHeader();
            const ev = new Event("selection");
            ev.data = [...this.#selected].sort();
            this.dispatchEvent(ev);
        });
        /* --- */
        this.#tableEl.addEventListener("sort", (event) => {
            event.stopPropagation();
            const {columnName} = event.data;
            const ev = new Event("sort");
            ev.data = {columnName};
            this.dispatchEvent(ev);
        });
        this.#tableEl.addEventListener("unsort", (event) => {
            event.stopPropagation();
            const {columnName} = event.data;
            const ev = new Event("unsort");
            ev.data = {columnName};
            this.dispatchEvent(ev);
        });
        /* --- */
        this.addEventListener("dragover", (e) => {
            if (this.#rowManager.isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        this.addEventListener("dragenter", (e) => {
            if (this.#rowManager.isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#stretched = this.#columnDefinition.find((definition) => definition.name === this.stretched);
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
    }

    get internalId() {
        return this.#internalId;
    }

    set nohead(value) {
        this.setBooleanAttribute("nohead", value);
    }

    get nohead() {
        return this.getBooleanAttribute("nohead");
    }

    set sortable(value) {
        this.setBooleanAttribute("sortable", value);
    }

    get sortable() {
        return this.getBooleanAttribute("sortable");
    }

    set selectable(value) {
        this.setBooleanAttribute("selectable", value);
    }

    get selectable() {
        return this.getBooleanAttribute("selectable");
    }

    set multiple(value) {
        this.setBooleanAttribute("multiple", value);
    }

    get multiple() {
        return this.getBooleanAttribute("multiple");
    }

    set allowDeselect(value) {
        this.setBooleanAttribute("allowdeselect", value);
    }

    get allowDeselect() {
        return this.getBooleanAttribute("allowdeselect");
    }

    set selectEnd(value) {
        this.setBooleanAttribute("selectend", value);
    }

    get selectEnd() {
        return this.getBooleanAttribute("selectend");
    }

    set stretched(value) {
        this.setAttribute("stretched", value);
    }

    get stretched() {
        return this.getAttribute("stretched");
    }

    set disabled(val) {
        this.setBooleanAttribute("disabled", val);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    set readOnly(val) {
        this.setBooleanAttribute("readonly", val);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    /**
     * Deactivate caching for row data and their html elements.
     * Setting this impacts render performance.
     */
    set noCache(val) {
        this.setBooleanAttribute("nocache", val);
    }

    get noCache() {
        return this.getBooleanAttribute("nocache");
    }

    static get observedAttributes() {
        return [
            "sortable",
            "selectable",
            "selectend",
            "multiple",
            "stretched",
            "readonly"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "sortable": {
                    const sortable = this.sortable;
                    this.#headerManager.sortable = sortable;
                    this.#rowManager.sortable = sortable;
                } break;
                case "selectable": {
                    const selectable = this.selectable;
                    this.#headerManager.selectable = selectable;
                    this.#rowManager.selectable = selectable;
                    if (!this.selectable) {
                        this.clearSelected();
                    }
                } break;
                case "selectend": {
                    const selectEnd = this.selectEnd;
                    this.#headerManager.selectEnd = selectEnd;
                    this.#rowManager.selectEnd = selectEnd;
                } break;
                case "multiple": {
                    if (!this.multiple) {
                        this.clearSelected();
                    }
                } break;
                case "stretched": {
                    this.#setStreched(newValue);
                } break;
                case "disabled": {
                    for (const [,, cell] of this.#cellCache.getAllCells()) {
                        cell.disabled = this.disabled;
                    }
                } break;
                case "readonly": {
                    for (const [,, cell] of this.#cellCache.getAllCells()) {
                        cell.readOnly = this.readOnly;
                    }
                } break;
            }
        }
    }

    setSelected(selected) {
        if (selected != null && this.selectable) {
            if (!Array.isArray(selected)) {
                if (typeof selected === "string") {
                    selected = [selected];
                } else {
                    selected = [];
                }
            }
            for (const key of this.#selected) {
                this.#rowManager.setRowSelected(key, false);
            }
            this.#selected.clear();
            if (this.multiple) {
                for (const entry of selected) {
                    this.#selected.add(entry);
                    this.#rowManager.setRowSelected(entry, true);
                }
            } else if (selected.length > 0) {
                const entry = selected[0];
                this.#selected.add(entry);
                this.#rowManager.setRowSelected(entry, true);
            }
            this.#updateSelectHeader();
            const ev = new Event("selection");
            ev.data = [...this.#selected].sort();
            this.dispatchEvent(ev);
        }
    }

    getSelected() {
        return [...this.#selected].sort();
    }

    clearSelected() {
        for (const key of this.#selected) {
            this.#rowManager.setRowSelected(key, false);
        }
        this.#selected.clear();
        if (this.selectable) {
            this.#updateSelectHeader();
            const ev = new Event("selection");
            ev.data = [];
            this.dispatchEvent(ev);
        }
    }

    selectAll() {
        if (this.selectable) {
            if (this.multiple) {
                const changedKeys = this.#rowManager.setAllVisibleRowsSelected(true);
                for (const rowKey of changedKeys) {
                    this.#selected.add(rowKey);
                }
            } else {
                const selectEl = this.shadowRoot.querySelector(`td.select-cell input[type="checkbox"]`);
                const rowKey = selectEl.rowKey;
                this.#rowManager.setRowSelected(true);
                this.#selected.add(rowKey);
            }
            this.#updateSelectHeader();
            const ev = new Event("selection");
            ev.data = [...this.#selected].sort();
            this.dispatchEvent(ev);
        }
    }

    setSortIndicators(columns = []) {
        const showSortOrder = columns.length > 1;
        for (const colDef of this.#columnDefinition) {
            const {
                name, sortby
            } = colDef;
            const sortName = sortby ?? name;
            const headerCellEl = this.#headerManager.getCellByColumnName(name);
            const sortIndex = columns.findIndex((entry) => entry === sortName || entry === `!${sortName}`);
            if (sortIndex >= 0) {
                const sort = columns[sortIndex];
                headerCellEl.sortDirection = sort.startsWith("!") ? "dec" : "inc";
                if (showSortOrder) {
                    headerCellEl.sortOrder = sortIndex + 1;
                } else {
                    headerCellEl.sortOrder = null;
                }
            } else {
                headerCellEl.sortDirection = null;
                headerCellEl.sortOrder = null;
            }
        }
    }

    async setData(rows = []) {
        await this.#busyIndicator.busy();
        if (rows != null && !Array.isArray(rows)) {
            throw new TypeError("Data must be an array or null");
        }
        if (!isEqual(this.#data, rows)) {
            if (rows == null) {
                this.#data = [];
                this.#rowManager.purge();
            } else {
                this.#emptyContainerEl.classList.toggle("hidden", rows.length > 0);
                this.#data = deepClone(rows);
                this.#rowManager.manage(this.#data, this.#columnDefinition, this.#selected, this.noCache);
            }
            this.#onRowUpdate();
            /* --- */
        }
        this.#updateSelectHeader();
        await this.#busyIndicator.unbusy();
    }

    #onRowUpdate = debounce(() => {
        if (this.readOnly || this.disabled) {
            for (const [,, cell] of this.#cellCache.getAllCells()) {
                cell.readOnly = this.readOnly;
                cell.disabled = this.disabled;
            }
        }
        const ev = new Event("rows-updated");
        this.dispatchEvent(ev);
    });

    getAllCellsForColumn(columnName) {
        return this.#cellCache.getAllCellsForColumn(columnName);
    }

    getCell(rowKey, columnName) {
        return this.#cellCache.getCell(rowKey, columnName);
    }

    async #applyColumnDefinition() {
        await this.#busyIndicator.busy();
        const columnNodeList = this.#columnContainerEl.assignedElements({flatten: true}).filter((el) => el instanceof Column);
        const newColumnDefinition = [];
        /* --- */
        const oldNodes = new Set(this.#mutationObserver.getObservedNodes());
        const newNodes = new Set();

        for (const columnEl of columnNodeList) {
            const columnData = getAllAttributes(columnEl);

            if (columnData.hidden && columnData.hidden !== "false") {
                continue;
            }

            filterInPlace(newColumnDefinition, (entry) => {
                if (columnData.name !== entry.name) {
                    return true;
                }
                console.warn(`duplicate column definition for "${columnData.name}" in DataGrid`, this);
                return false;
            });

            newColumnDefinition.push(columnData);
            if (oldNodes.has(columnEl)) {
                oldNodes.delete(columnEl);
            } else {
                newNodes.add(columnEl);
            }
        }
        for (const node of oldNodes) {
            this.#mutationObserver.unobserve(node);
        }
        for (const node of newNodes) {
            this.#mutationObserver.observe(node);
        }

        if (!isEqual(this.#columnDefinition, newColumnDefinition)) {
            this.#columnDefinition = newColumnDefinition;
            this.#headerManager.manage(newColumnDefinition);
            this.#rowManager.manage(this.#data, newColumnDefinition);
            /* --- */
            for (const definition of newColumnDefinition) {
                const {
                    name, type, width
                } = definition;
                const minWidth = DataGridCell.getTypeMinWidth(type);
                this.style.setProperty(`--min-width-${name}`, `${Math.max(50, minWidth)}px`);
                if (name !== this.stretched) {
                    const widthValue = width;
                    const styleWidth = getStyleLengthValue(minWidth, widthValue);
                    this.style.setProperty(`--width-${name}`, styleWidth);
                    if (styleWidth.endsWith("px")) {
                        this.style.setProperty(`--min-width-${name}`, styleWidth);
                    }
                }
            }
            /* --- */
            const ev = new Event("rows-updated");
            this.dispatchEvent(ev);
        }
        /* --- */
        const hasColumnDefinition = newColumnDefinition.length > 0;
        this.#nocolumnsContainerEl.classList.toggle("hidden", hasColumnDefinition);
        if (hasColumnDefinition) {
            this.#refreshStuckAfterRender();
            this.#applyCellFixes(this.#bodyEl);
        }
        /* --- */
        await this.#busyIndicator.unbusy();
    }

    #updateSelectHeader() {
        const {
            visibleCount, selectedCount
        } = this.#rowManager.getSelectionStatus();

        const ev = new Event("selection-header");
        if (selectedCount === 0) { // none selected
            this.#headerManager.setSelectionState(false);
            ev.value = false;
        } else if (selectedCount === visibleCount) { // all selected
            this.#headerManager.setSelectionState(true);
            ev.value = true;
        } else { // some selected
            this.#headerManager.setSelectionState(null);
            ev.value = null;
        }
        this.dispatchEvent(ev);
    }

    #onSlotChange = debounce(() => {
        this.#applyColumnDefinition();
    });

    busy() {
        return this.#busyIndicator.busy();
    }

    unbusy() {
        return this.#busyIndicator.unbusy();
    }

    #setStreched(strechedName) {
        if (this.#stretched != null) {
            const name = this.#stretched.name;
            const widthValue = this.#stretched.width;
            if (widthValue != null) {
                const styleWidth = getStyleLengthValue(this.#stretched.type, widthValue);
                this.style.setProperty(`--width-${name}`, styleWidth);
            }
        }
        this.#stretched = this.#columnDefinition.find((definition) => definition.name === strechedName);
        if (this.#stretched != null) {
            this.style.setProperty(`--width-${strechedName}`, "100%");
        }
    }

    #updateSelectionAfterRender() {
        this.#rowManager.setAllVisibleRowsSelected((key) => this.#selected.has(key));
    }

    #calculateCellFixes(containerEl) {
        const rowEl = containerEl.querySelector(":scope tr");
        containerEl.style.display = "table-header-group";
        this.#leftFixes = [];
        this.#rightFixes = [];

        // de-stuck
        const stuckCells = [...this.#tableEl.querySelectorAll(":scope .fixed-cell.stuck")];
        for (const cellEl of stuckCells) {
            cellEl.classList.remove("stuck");
        }

        // left cells
        {
            const fixedLeftCells = [...rowEl.querySelectorAll(":scope .fixed-cell.fixed-cell-start")];
            // calculate offsets
            let leftOffset = 0;
            for (const cellEl of fixedLeftCells) {
                this.#leftFixes.push(leftOffset);
                const cellWidth = cellEl.offsetWidth;
                leftOffset += cellWidth;
            }
        }

        // right cells
        {
            const fixedRightCells = [...rowEl.querySelectorAll(":scope .fixed-cell.fixed-cell-end")].reverse();
            // calculate offsets
            let rightOffset = 0;
            for (const cellEl of fixedRightCells) {
                this.#rightFixes.push(rightOffset);
                const cellWidth = cellEl.offsetWidth;
                rightOffset += cellWidth;
            }
        }

        // re-stuck
        for (const cellEl of stuckCells) {
            cellEl.classList.add("stuck");
        }

        // apply cell fixes
        containerEl.style.display = "";
        this.#applyCellFixes(containerEl);
    }

    #applyCellFixes(containerEl) {
        const rowEls = containerEl.querySelectorAll(":scope tr");
        for (const rowEl of rowEls) {
            // left cells
            {
                const fixedLeftCells = [...rowEl.querySelectorAll(":scope .fixed-cell.fixed-cell-start")];
                let index = 0;
                for (const cellEl of fixedLeftCells) {
                    const leftOffset = this.#leftFixes[index++];
                    cellEl.style.left = `${leftOffset}px`;
                }
            }
            // right cells
            {
                const fixedRightCells = [...rowEl.querySelectorAll(":scope .fixed-cell.fixed-cell-end")].reverse();
                let index = 0;
                for (const cellEl of fixedRightCells) {
                    const rightOffset = this.#rightFixes[index++];
                    cellEl.style.right = `${rightOffset}px`;
                }
            }
        }
    }

    #refreshStuckAfterRender() {
        const stuckEls = this.#headerEl.querySelectorAll(".stuck");
        for (const stuckEl of stuckEls) {
            this.#setStuckForColumn(stuckEl, true);
        }
    }

    #setStuckForColumn(headerEl, isStuck) {
        if (headerEl.classList.contains("sort-cell")) {
            const els = this.#bodyEl.querySelectorAll(".sort-cell");
            for (const el of els) {
                el.classList.toggle(this.#stickyObserver.stuckClassName, isStuck);
            }
        } else if (headerEl.classList.contains("select-cell")) {
            const els = this.#bodyEl.querySelectorAll(".select-cell");
            for (const el of els) {
                el.classList.toggle(this.#stickyObserver.stuckClassName, isStuck);
            }
        } else {
            const name = headerEl.columnName;
            const els = this.#bodyEl.querySelectorAll(`[col-name="${name}"]`);
            for (const el of els) {
                el.classList.toggle(this.#stickyObserver.stuckClassName, isStuck);
            }
        }
    }

}

customElements.define("emc-datagrid", DataGrid);
