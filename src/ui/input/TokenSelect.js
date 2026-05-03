
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import i18n from "@emcjs/core/util/I18n.js";
import SearchEvery from "@emcjs/core/util/search/SearchEvery.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {jsonParseSafe} from "@emcjs/core/util/helper/JSON.js";
import CustomElementDelegating from "../element/CustomElementDelegating.js";
import ElementManager from "../../util/element/ElementManager.js";
import {sortChildren} from "../../util/node/NodeListSort.js";
import "./components/InputElement.js";
import "../i18n/I18nLabel.js";
import "../i18n/I18nTooltip.js";
import "./Option.js";
import "../symbols/ChevronDownSymbol.js";
import TPL from "./TokenSelect.js.html" assert {type: "html"};
import STYLE from "./TokenSelect.js.css" assert {type: "css"};

class TokenElementManager extends ElementManager {

    composer(key, params) {
        const el = document.createElement("div");
        el.className = "token";
        const label = document.createElement("emc-i18n-label");
        label.i18nValue = key;
        el.addEventListener("click", (event) => {
            params.onClick(event);
        });
        el.append(label);
        return el;
    }

    mutator(el, key, params) {
        el.setAttribute("value", params.value);
    }

}

/**
 * @deprecated
 */
export default class TokenSelect extends CustomElementDelegating {

    #elManager;

    #slotEventManager;

    #i18nEventManager = new EventTargetManager(i18n);

    #onOptionClick = (event) => {
        const el = event.currentTarget;
        if (!this.readOnly) {
            const valueBuffer = new Set(this.value);
            const value = el.getAttribute("value");
            if (valueBuffer.has(value)) {
                valueBuffer.delete(value);
                this.value = Array.from(valueBuffer);
                this.#applyValue(this.value);
            }
        }
        event.stopPropagation();
        return false;
    };

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        const searchResetEl = this.shadowRoot.getElementById("search-reset");
        searchResetEl.addEventListener("click", () => {
            this.value = [];
            this.#applyValue([]);
        });
        /* --- */
        const containerEl = this.shadowRoot.getElementById("container");
        this.#slotEventManager = new EventTargetManager(containerEl);
        this.#slotEventManager.set("slotchange", () => {
            const all = this.querySelectorAll(`[value]`);
            for (const el of all) {
                if (el) {
                    el.onclick = (event) => {
                        this.#choose(event.currentTarget.getAttribute("value"));
                        event.stopPropagation();
                        return false;
                    };
                    this.#applyValue(this.value);
                }
            }
            if (this.getBooleanAttribute("sort")) {
                this.#sort();
            }
        });
        const view = this.shadowRoot.getElementById("view");
        const input = this.shadowRoot.getElementById("input");
        const container = this.shadowRoot.getElementById("scroll-container");
        this.addEventListener("click", (event) => {
            if (!this.readOnly) {
                view.setAttribute("mode", "edit");
                input.focus();
            }
            event.stopPropagation();
            return false;
        });
        const scrollContainer = this.shadowRoot.getElementById("scroll-container");
        this.addEventListener("keyup", (event) => {
            if (!this.readOnly) {
                if (view.getAttribute("mode") == "view") {
                    if (event.key == "Enter") {
                        view.setAttribute("mode", "edit");
                        input.focus();
                        event.stopPropagation();
                        return false;
                    }
                } else if (event.key == "Escape") {
                    this.#cancelSelection();
                    event.stopPropagation();
                    return false;
                } else if (event.key == "Enter") {
                    const marked = this.querySelector(".marked");
                    if (marked != null) {
                        this.#choose(marked.getAttribute("value"));
                    }
                    event.stopPropagation();
                    return false;
                } else if (event.key == "ArrowUp") {
                    const marked = this.querySelector(".marked");
                    if (marked != null) {
                        let el = marked.previousElementSibling;
                        while (el != null && el.style.display == "none") {
                            el = el.previousElementSibling;
                        }
                        if (el != null) {
                            marked.classList.remove("marked");
                            el.classList.add("marked");
                            const targetScroll = el.offsetTop - 20;
                            if (scrollContainer.scrollTop > targetScroll) {
                                scrollContainer.scrollTop = targetScroll;
                            }
                        }
                    } else {
                        let el = this.querySelector("[value]");
                        while (el != null && el.style.display == "none") {
                            el = el.nextElementSibling;
                        }
                        if (el != null) {
                            el.classList.add("marked");
                            scrollContainer.scrollTop = 0;
                        }
                    }
                    event.stopPropagation();
                    return false;
                } else if (event.key == "ArrowDown") {
                    const marked = this.querySelector(".marked");
                    if (marked != null) {
                        let el = marked.nextElementSibling;
                        while (el != null && el.style.display == "none") {
                            el = el.nextElementSibling;
                        }
                        if (el != null) {
                            marked.classList.remove("marked");
                            el.classList.add("marked");
                            const targetScroll = el.offsetTop - scrollContainer.clientHeight + el.clientHeight + 20;
                            if (scrollContainer.scrollTop < targetScroll) {
                                scrollContainer.scrollTop = targetScroll;
                            }
                        }
                    } else {
                        let el = this.querySelector("[value]");
                        while (el != null && el.style.display == "none") {
                            el = el.nextElementSibling;
                        }
                        if (el != null) {
                            el.classList.add("marked");
                            scrollContainer.scrollTop = 0;
                        }
                    }
                    event.stopPropagation();
                    return false;
                }
            }
        });
        input.addEventListener("focus", () => {
            if (!this.readOnly) {
                input.value = "";
                const thisRect = this.getBoundingClientRect();
                container.style.display = "block";
                container.style.left = `${thisRect.left}px`;
                container.style.width = `${thisRect.width}px`;
                const containerRect = container.getBoundingClientRect();
                if (thisRect.bottom + containerRect.height > window.innerHeight - 25) {
                    container.style.bottom = `${window.innerHeight - thisRect.top}px`;
                } else {
                    container.style.top = `${thisRect.bottom}px`;
                }
            }
        });
        window.addEventListener("wheel", (event) => {
            if (view.getAttribute("mode") != "view") {
                this.#cancelSelection();
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, {passive: true});
        window.addEventListener("mousedown", () => {
            if (view.getAttribute("mode") != "view") {
                this.#cancelSelection();
            }
        });
        container.addEventListener("wheel", (event) => {
            event.stopPropagation();
            return false;
        }, {passive: true});
        this.addEventListener("mousedown", (event) => {
            event.stopPropagation();
            return false;
        });
        this.addEventListener("blur", (event) => {
            this.#cancelSelection();
            event.stopPropagation();
            return false;
        });
        input.addEventListener("input", () => {
            const all = this.querySelectorAll(`[value]`);
            const regEx = new SearchEvery(input.value);
            for (const el of all) {
                if (regEx.test(el.innerText.trim())) {
                    el.style.display = "";
                } else {
                    el.style.display = "none";
                    el.classList.remove("marked");
                }
            }
        }, true);
        /* --- */
        this.#elManager = new TokenElementManager(view);
        /* --- */
        this.#i18nEventManager.active = this.getBooleanAttribute("sort");
        this.#i18nEventManager.set("language", () => {
            this.#sort();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#sort();
        });
    }

    connectedCallback() {
        const all = this.querySelectorAll(`[value]`);
        for (const el of all) {
            if (el) {
                el.onclick = (event) => {
                    this.#choose(event.currentTarget.getAttribute("value"));
                    event.stopPropagation();
                    return false;
                };
            }
        }
    }

    serialize() {
        const res = {};
        const all = this.querySelectorAll(`[value]`);
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
            if (!Array.isArray(val)) {
                val = [val];
            }
            val = JSON.stringify(val);
            this.setAttribute("value", val);
        } else {
            this.removeAttribute("value");
        }
    }

    get value() {
        let val = this.getAttribute("value");
        if (val != null) {
            val = jsonParseSafe(val) ?? [];
        } else {
            val = [];
        }
        return val;
    }

    get readOnly() {
        const val = this.getAttribute("readonly");
        return !!val && val != "false";
    }

    set readOnly(val) {
        this.setAttribute("readonly", val);
    }

    static get observedAttributes() {
        return [
            "value",
            "readonly",
            "sort"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value": {
                if (oldValue != newValue) {
                    this.calculateItems();
                    const event = new Event("change");
                    event.oldValue = oldValue;
                    event.newValue = newValue;
                    event.value = newValue;
                    this.dispatchEvent(event);
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    this.shadowRoot.getElementById("view").readOnly = newValue;
                    if (newValue != null && newValue != "false") {
                        this.shadowRoot.getElementById("view").disabled = true;
                    } else {
                        this.shadowRoot.getElementById("view").disabled = false;
                    }
                }
            } break;
            case "sort": {
                if (oldValue != newValue) {
                    this.#i18nEventManager.active = this.getBooleanAttribute("sort");
                }
            } break;
        }
    }

    calculateItems() {
        const all = this.querySelectorAll(`[value]`);
        const vals = new Set(this.value);
        for (const el of all) {
            if (el) {
                if (vals.has(el.value)) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            }
        }
    }

    #cancelSelection() {
        const container = this.shadowRoot.getElementById("scroll-container");
        const view = this.shadowRoot.getElementById("view");
        if (container.style.display != "") {
            const input = this.shadowRoot.getElementById("input");
            input.value = "";
            this.#applyValue(this.value);
            container.style.display = "";
            container.style.bottom = "";
            container.style.top = "";
            const all = this.querySelectorAll(`[value]`);
            for (const el of all) {
                el.style.display = "";
            }
            const marked = this.querySelector(".marked");
            if (marked != null) {
                marked.classList.remove("marked");
            }
        }
        view.setAttribute("mode", "view");
    }

    #choose(value) {
        if (!this.readOnly) {
            const valueBuffer = new Set(this.value);
            if (valueBuffer.has(value)) {
                valueBuffer.delete(value);
            } else {
                valueBuffer.add(value);
            }
            this.value = Array.from(valueBuffer);
        }
    }

    #applyValue(value) {
        const data = [];
        for (const val of value) {
            data.push({
                key: val,
                value: val,
                onClick: this.#onOptionClick
            });
        }
        this.#elManager.manage(data);
    }

    #sort = debounce(() => {
        this.#slotEventManager.active = false;
        sortChildren(this, `[value]`);
        this.#slotEventManager.active = true;
    });

}

customElements.define("emc-tokenselect", TokenSelect);
