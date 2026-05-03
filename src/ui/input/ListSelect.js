
import i18n from "@emcjs/core/util/I18n.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import SearchEvery from "@emcjs/core/util/search/SearchEvery.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import CustomElementDelegating from "../element/CustomElementDelegating.js";
import ListSelectionHelper from "../../util/form/ListSelectionController.js";
import {sortChildren} from "../../util/node/NodeListSort.js";
import "../header/SelectionHeader.js";
import "./Option.js";
import TPL from "./ListSelect.js.html" assert {type: "html"};
import STYLE from "./ListSelect.js.css" assert {type: "css"};
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";

/**
 * @deprecated
 */
export default class ListSelect extends CustomElementDelegating {

    #valueElementsList;

    #valueList = new Map();

    #visibleValueList = new Set();

    #selectedValueList = new Set();

    #selectedVisibleValueList = new Set();

    #currentSearch;

    #containerEl;

    #scrollContainerEl;

    #headerEl;

    #slotEventManager;

    #i18nEventManager = new EventTargetManager(i18n);

    #selectionHelper;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#slotEventManager = new EventTargetManager(this.#containerEl);
        this.#slotEventManager.set("slotchange", () => {
            this.#valueList.clear();
            this.#visibleValueList.clear();
            this.#selectedValueList.clear();

            this.#valueElementsList = this.querySelectorAll(`[value]`);
            const all = this.#valueElementsList;
            for (const el of all) {
                if (el) {
                    const value = el.getAttribute("value");
                    if (this.#valueList.has(value)) {
                        el.style.display = "none";
                        continue;
                    }
                    const innerText = el.innerText;
                    this.#valueList.set(value, {
                        el,
                        innerText
                    });
                    if (this.#currentSearch?.test(innerText) ?? true) {
                        this.#visibleValueList.add(value);
                    } else {
                        el.style.display = "none";
                    }
                    if (el.classList.contains("active")) {
                        this.#selectedValueList.add(value);
                    }
                    el.onclick = () => {
                        this.#choose(value);
                    };
                }
            }
            this.#calculateItems();
            if (this.getBooleanAttribute("sort")) {
                this.#sort();
            }
        });
        /* header */
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#headerEl.addEventListener("check", (event) => {
            if (this.multiple) {
                if (event.value) {
                    for (const value of this.#visibleValueList) {
                        this.#selectedValueList.add(value);
                    }
                } else {
                    for (const value of this.#visibleValueList) {
                        this.#selectedValueList.delete(value);
                    }
                }
                this.value = [...this.#selectedValueList];
            }
        });
        this.#headerEl.addEventListener("search", debounce((event) => {
            const all = this.#valueElementsList;
            let checked = false;
            let unchecked = false;
            if (event.value) {
                this.#currentSearch = new SearchEvery(event.value);
                for (const [value, entry] of this.#valueList) {
                    const {
                        el, innerText
                    } = entry;
                    if (this.#currentSearch.test(innerText)) {
                        this.#visibleValueList.add(value);
                        if (el.classList.contains("active")) {
                            checked = true;
                            this.#selectedVisibleValueList.add(value);
                        } else {
                            unchecked = true;
                        }
                        el.style.display = "";
                    } else {
                        this.#visibleValueList.delete(value);
                        this.#selectedVisibleValueList.delete(value);
                        el.style.display = "none";
                    }
                }
            } else {
                for (const el of all) {
                    const value = el.getAttribute("value");
                    this.#visibleValueList.add(value);
                    el.style.display = "";
                    if (el.classList.contains("active")) {
                        checked = true;
                        this.#selectedVisibleValueList.add(value);
                    } else {
                        unchecked = true;
                    }
                }
            }
            if (this.multiple) {
                if (checked) {
                    if (unchecked) {
                        this.#headerEl.checked = "mixed";
                    } else {
                        this.#headerEl.checked = true;
                    }
                } else {
                    this.#headerEl.checked = false;
                }
            }
        }, 300));
        /* --- */
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#selectionHelper = new ListSelectionHelper(this, this.#scrollContainerEl);
        this.#selectionHelper.addEventListener("choose", (event) => {
            this.#choose(event.value);
        });
        /* --- */
        this.#i18nEventManager.active = this.getBooleanAttribute("sort");
        this.#i18nEventManager.set("language", () => {
            this.#sort();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#sort();
        });
    }

    focus() {
        if (this.#headerEl != null) {
            this.#headerEl.focus();
        }
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#valueElementsList = this.querySelectorAll(`[value]`);
        const all = this.#valueElementsList;
        if (!this.value) {
            if (this.multiple) {
                this.value = [];
            } else if (all.length > 0) {
                this.value = all[0].value;
            }
        }
        for (const el of all) {
            if (el) {
                el.onclick = () => {
                    this.#choose(el.getAttribute("value"));
                };
            }
        }
        this.#calculateItems();
    }

    serialize() {
        const res = {};
        const all = this.#valueElementsList;
        for (const el of all) {
            res[el.value] = el.classList.contains("active");
        }
        return res;
    }

    deserialize(values) {
        const res = [];
        for (const key in values) {
            if (values[key]) {
                res.push(key);
            }
        }
        this.value = res;
    }

    set value(val) {
        if (val != null) {
            if (this.multiple) {
                if (!Array.isArray(val)) {
                    val = [val];
                }
                val = JSON.stringify(val);
            } else if (Array.isArray(val)) {
                val = val[0];
            }
            this.setAttribute("value", val);
        } else {
            this.removeAttribute("value");
        }
    }

    get value() {
        let val = this.getAttribute("value");
        if (this.multiple) {
            if (val != null) {
                val = jsonParseSafe(val) ?? [];
            } else {
                val = [];
            }
        }
        return val;
    }

    set multiple(val) {
        this.setAttribute("multiple", val);
    }

    get multiple() {
        return this.getAttribute("multiple") == "true";
    }

    set readOnly(val) {
        this.setAttribute("readonly", val);
    }

    get readOnly() {
        const val = this.getAttribute("readonly");
        return !!val && val != "false";
    }

    static get observedAttributes() {
        return [
            "value",
            "multiple",
            "sort"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    this.#calculateItems();
                    const event = new Event("change");
                    event.oldValue = oldValue;
                    event.newValue = newValue;
                    event.value = newValue;
                    this.dispatchEvent(event);
                }
            } break;
            case "multiple": {
                if (oldValue != newValue) {
                    if (newValue != "true") {
                        const arr = jsonParseSafe(this.getAttribute("value")) ?? [];
                        if (arr.length > 1) {
                            this.value = arr[0];
                        }
                    } else {
                        const val = this.getAttribute("value");
                        if (val != null) {
                            this.value = [val];
                        } else {
                            this.value = [];
                        }
                    }
                    this.#headerEl.multiple = newValue;
                }
            } break;
            case "sort": {
                if (oldValue != newValue) {
                    this.#i18nEventManager.active = this.getBooleanAttribute("sort");
                }
            } break;
        }
    }

    resetSearch() {
        this.#headerEl.search = "";
    }

    #calculateItems = debounce(() => {
        const all = this.#valueElementsList;
        if (all != null) {
            if (this.multiple) {
                const vals = new Set(this.value);
                let checked = false;
                let unchecked = false;
                for (const el of all) {
                    if (el) {
                        if (vals.has(el.value)) {
                            el.classList.add("active");
                            if (el.style.display == "") {
                                checked = true;
                            }
                        } else {
                            el.classList.remove("active");
                            if (el.style.display == "") {
                                unchecked = true;
                            }
                        }
                    }
                }
                if (checked) {
                    if (unchecked) {
                        this.#headerEl.checked = "mixed";
                    } else {
                        this.#headerEl.checked = true;
                    }
                } else {
                    this.#headerEl.checked = false;
                }
            } else {
                for (const el of all) {
                    if (el) {
                        if (this.value == el.value) {
                            el.classList.add("active");
                        } else {
                            el.classList.remove("active");
                        }
                    }
                }
            }
        }
    });

    #choose(value) {
        if (!this.readOnly) {
            if (this.multiple) {
                const arr = this.value;
                const set = new Set(arr);
                if (set.has(value)) {
                    set.delete(value);
                } else {
                    set.add(value);
                }
                this.value = Array.from(set);
            } else {
                this.value = value;
            }
        }
    }

    hasValue(value) {
        return this.#valueList.has(value);
    }

    #sort = debounce(() => {
        this.#slotEventManager.active = false;
        sortChildren(this, `[value]`);
        this.#slotEventManager.active = true;
    });

}

customElements.define("emc-listselect", ListSelect);
