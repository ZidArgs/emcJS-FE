import {debounce} from "emcjs/util/Debouncer.js";
import CustomElementDelegating from "../../element/CustomElementDelegating.js";
import "../../i18n/I18nLabel.js";
import "../../form/button/Button.js";
import TPL from "./DataViewControlToolbar.js.html" assert {type: "html"};
import STYLE from "./DataViewControlToolbar.js.css" assert {type: "css"};

// TODO add sort manager (modal with two lists, one contains available columns, the other the sort order)

/* TODO
- create component for each control
- add abstract control as base class
- controls should each be added individually
- DataViewControlToolbar as optional container (?)
*/

export default class DataViewControlToolbar extends CustomElementDelegating {

    static get controls() {
        return [
            "pagination",
            "page-size",
            "entries-count",
            "total-count"
        ];
    }

    #firstEl;

    #decreaseEl;

    #currentEl;

    #maxEl;

    #increaseEl;

    #lastEl;

    #sizeEl;

    #entriesEl;

    #totalEl;

    #infiniteSizeOpt = document.createElement("option");

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#firstEl = this.shadowRoot.getElementById("first");
        this.#decreaseEl = this.shadowRoot.getElementById("decrease");
        this.#currentEl = this.shadowRoot.getElementById("current");
        this.#entriesEl = this.shadowRoot.getElementById("entries");
        this.#maxEl = this.shadowRoot.getElementById("max");
        this.#increaseEl = this.shadowRoot.getElementById("increase");
        this.#lastEl = this.shadowRoot.getElementById("last");
        this.#sizeEl = this.shadowRoot.getElementById("size");
        this.#totalEl = this.shadowRoot.getElementById("total");
        /* --- */
        this.#firstEl.addEventListener("click", (event) => {
            event.stopPropagation();
            this.value = 0;
        });
        this.#decreaseEl.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentValue = this.value;
            if (currentValue > 0) {
                this.value = currentValue - 1;
            }
        });
        this.#increaseEl.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentValue = this.value;
            const maxValue = this.max;
            if (currentValue < maxValue) {
                this.value = currentValue + 1;
            }
        });
        this.#lastEl.addEventListener("click", (event) => {
            event.stopPropagation();
            const maxValue = this.max;
            this.value = maxValue;
        });
        this.#currentEl.addEventListener("change", (event) => {
            event.stopPropagation();
            this.value = this.#currentEl.value;
        });
        this.#sizeEl.addEventListener("change", (event) => {
            event.stopPropagation();
            this.size = this.#sizeEl.value;
        });
        /* --- */
        new ResizeObserver(() => {
            this.#currentEl.style.width = `${this.#maxEl.offsetWidth}px`;
        }).observe(this.#maxEl);
        /* --- */
        this.#infiniteSizeOpt.value = "0";
        this.#infiniteSizeOpt.innerText = "inf";
        this.#sizeEl.append(this.#infiniteSizeOpt);
    }

    set value(value) {
        this.setIntAttribute("value", value, 1, this.max);
    }

    get value() {
        return this.getIntAttribute("value");
    }

    set max(value) {
        this.setIntAttribute("max", value, 1);
    }

    get max() {
        return this.getIntAttribute("max");
    }

    set size(value) {
        this.setIntAttribute("size", value, 0);
    }

    get size() {
        return this.getIntAttribute("size");
    }

    set entries(value) {
        this.setIntAttribute("entries", value, 1);
    }

    get entries() {
        return this.getIntAttribute("entries");
    }

    set total(value) {
        this.setIntAttribute("total", value, 0);
    }

    get total() {
        return this.getIntAttribute("total");
    }

    set sizes(value) {
        this.setAttribute("sizes", value);
    }

    get sizes() {
        return this.getAttribute("sizes");
    }

    set controls(value) {
        this.setListAttribute("controls", value, DataViewControlToolbar.controls);
    }

    get controls() {
        return this.getListAttribute("controls");
    }

    addControl(control) {
        if (DataViewControlToolbar.controls.includes(control)) {
            const controls = this.controls;
            if (!controls.includes(control)) {
                this.controls = [...controls, control];
            }
        }
    }

    removeControl(control) {
        if (DataViewControlToolbar.controls.includes(control)) {
            const controls = this.controls;
            if (controls.includes(control)) {
                this.controls = controls.filter((c) => c !== control);
            }
        }
    }

    toggleControl(control, forceTo) {
        if (forceTo === true) {
            this.addControl(control);
        } else if (forceTo === false) {
            this.removeControl(control);
        } else if (DataViewControlToolbar.controls.includes(control)) {
            const controls = this.controls;
            if (controls.includes(control)) {
                this.controls = controls.filter((c) => c !== control);
            } else {
                this.controls = [...controls, control];
            }
        }
    }

    static get observedAttributes() {
        return [
            "value",
            "max",
            "size",
            "entries",
            "total",
            "sizes"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    const currentValue = this.value ?? 1;
                    this.#currentEl.value = currentValue;
                    const ev = new Event("page");
                    ev.data = currentValue;
                    this.dispatchEvent(ev);
                    /* --- */
                    const maxValue = this.max ?? 1;
                    this.#firstEl.disabled = currentValue === 1;
                    this.#decreaseEl.disabled = currentValue === 1;
                    this.#increaseEl.disabled = currentValue === maxValue;
                    this.#lastEl.disabled = currentValue === maxValue;
                    /* --- */
                    this.#updateEntries();
                } else {
                    this.#currentEl.value = oldValue;
                }
            } break;
            case "max": {
                if (oldValue != newValue) {
                    const maxValue = this.max ?? 1;
                    const currentValue = this.value ?? 1;
                    if (currentValue > maxValue) {
                        this.value = currentValue;
                    } else {
                        this.#firstEl.disabled = currentValue === 1;
                        this.#decreaseEl.disabled = currentValue === 1;
                        this.#increaseEl.disabled = currentValue === maxValue;
                        this.#lastEl.disabled = currentValue === maxValue;
                    }
                    if (maxValue != null && maxValue > 0) {
                        this.#maxEl.innerText = maxValue;
                        this.#currentEl.disabled = maxValue <= 1;
                    } else {
                        this.#maxEl.innerText = "1";
                        this.#currentEl.disabled = true;
                    }
                }
            } break;
            case "size": {
                if (oldValue != newValue) {
                    const pageSize = this.size;
                    if (pageSize != null && pageSize > 0) {
                        this.#sizeEl.value = pageSize;
                        const ev = new Event("size");
                        ev.data = pageSize;
                        this.dispatchEvent(ev);
                    } else {
                        this.#sizeEl.value = 0;
                        const ev = new Event("size");
                        ev.data = 0;
                        this.dispatchEvent(ev);
                    }
                    this.#updateEntries();
                }
            } break;
            case "entries": {
                if (oldValue != newValue) {
                    this.#updateEntries();
                }
            } break;
            case "total": {
                if (oldValue != newValue) {
                    const totalEntries = this.total;
                    if (totalEntries != null && totalEntries > 0) {
                        this.#totalEl.innerText = totalEntries;
                    } else {
                        this.#totalEl.innerText = "0";
                    }
                }
            } break;
            case "sizes": {
                if (oldValue != newValue) {
                    this.#fillSizes();
                }
            } break;
        }
    }

    #updateEntries = debounce(() => {
        const shownEntries = this.entries;
        if (shownEntries != null && shownEntries > 0) {
            const pageSize = this.size;
            if (pageSize != null && pageSize > 0) {
                const currentValue = this.value ?? 1;
                const currentStart = (currentValue - 1) * pageSize;
                const currentEnd = currentStart + shownEntries;
                this.#entriesEl.innerText = `${currentStart + 1} - ${currentEnd} (${shownEntries})`;
            } else {
                this.#entriesEl.innerText = shownEntries;
            }
        } else {
            this.#entriesEl.innerText = "0";
        }
    });

    #fillSizes() {
        const sizes = this.sizes.split(",");
        this.#sizeEl.innerHTML = "";
        this.#sizeEl.append(this.#infiniteSizeOpt);
        const parsedSizes = [];
        for (const size of sizes) {
            const parsedSize = parseInt(size);
            if (!isNaN(parsedSize)) {
                parsedSizes.push(parsedSize);
            }
        }
        if (parsedSizes.length) {
            const currentPageSize = this.#sizeEl.value;
            let hasPageSize = false;
            parsedSizes.sort((a, b) => a - b);
            for (const size of parsedSizes) {
                const opt = document.createElement("option");
                opt.value = size;
                opt.innerText = size;
                this.#sizeEl.append(opt);
                if (size === currentPageSize) {
                    hasPageSize = true;
                }
            }
            if (!hasPageSize) {
                this.#sizeEl.value = parsedSizes[0];
            }
            this.#sizeEl.disabled = false;
        } else {
            this.#sizeEl.value = 0;
            this.#sizeEl.disabled = true;
        }
    }

}

customElements.define("emc-dataview-control-toolbar", DataViewControlToolbar);
