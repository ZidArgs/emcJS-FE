
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import i18n from "emcjs/util/I18n.js";
import SearchEvery from "emcjs/util/search/SearchEvery.js";
import {debounce} from "emcjs/util/Debouncer.js";
import CustomElementDelegating from "../element/CustomElementDelegating.js";
import {sortChildren} from "../../util/node/NodeListSort.js";
import "./Option.js";
import "../symbols/ChevronDownSymbol.js";
import TPL from "./SearchSelect.js.html" assert {type: "html"};
import STYLE from "./SearchSelect.js.css" assert {type: "css"};

/**
 * @deprecated
 */
export default class SearchSelect extends CustomElementDelegating {

    #slotEventManager;

    #i18nEventManager = new EventTargetManager(i18n);

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
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
                    if (el.value == this.value) {
                        this.shadowRoot.getElementById("view").value = el.innerHTML;
                    }
                }
            }
            if (this.getBooleanAttribute("sort")) {
                this.#sort();
            }
        });
        /* --- */
        const viewEl = this.shadowRoot.getElementById("view");
        const inputEl = this.shadowRoot.getElementById("input");
        const scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.addEventListener("click", (event) => {
            if (!this.readOnly) {
                viewEl.setAttribute("mode", "edit");
                inputEl.focus();
            }
            event.stopPropagation();
            return false;
        });
        this.addEventListener("keyup", (event) => {
            if (!this.readOnly) {
                if (viewEl.getAttribute("mode") == "view") {
                    if (event.key == "Enter") {
                        viewEl.setAttribute("mode", "edit");
                        inputEl.focus();
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
                            if (scrollContainerEl.scrollTop > targetScroll) {
                                scrollContainerEl.scrollTop = targetScroll;
                            }
                        }
                    } else {
                        let el = this.querySelector("[value]");
                        while (el != null && el.style.display == "none") {
                            el = el.nextElementSibling;
                        }
                        if (el != null) {
                            el.classList.add("marked");
                            scrollContainerEl.scrollTop = 0;
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
                            const targetScroll = el.offsetTop - scrollContainerEl.clientHeight + el.clientHeight + 20;
                            if (scrollContainerEl.scrollTop < targetScroll) {
                                scrollContainerEl.scrollTop = targetScroll;
                            }
                        }
                    } else {
                        let el = this.querySelector("[value]");
                        while (el != null && el.style.display == "none") {
                            el = el.nextElementSibling;
                        }
                        if (el != null) {
                            el.classList.add("marked");
                            scrollContainerEl.scrollTop = 0;
                        }
                    }
                    event.stopPropagation();
                    return false;
                }
            }
        });
        inputEl.addEventListener("focus", () => {
            if (!this.readOnly) {
                inputEl.value = "";
                const thisRect = this.getBoundingClientRect();
                scrollContainerEl.style.display = "block";
                scrollContainerEl.style.left = `${thisRect.left}px`;
                scrollContainerEl.style.width = `${thisRect.width}px`;
                const containerRect = scrollContainerEl.getBoundingClientRect();
                if (thisRect.bottom + containerRect.height > window.innerHeight - 25) {
                    scrollContainerEl.style.bottom = `${window.innerHeight - thisRect.top}px`;
                } else {
                    scrollContainerEl.style.top = `${thisRect.bottom}px`;
                }
            }
        });
        window.addEventListener("wheel", () => {
            if (viewEl.getAttribute("mode") != "view") {
                this.#cancelSelection();
            }
        }, {passive: true});
        window.addEventListener("mousedown", (event) => {
            if (viewEl.getAttribute("mode") != "view") {
                this.#cancelSelection();
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        scrollContainerEl.addEventListener("wheel", (event) => {
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
        inputEl.addEventListener("input", () => {
            const all = this.querySelectorAll(`[value]`);
            const regEx = new SearchEvery(inputEl.value);
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
        if (!this.value && !!all.length) {
            this.value = all[0].value;
        }
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

    get value() {
        return this.getAttribute("value");
    }

    set value(val) {
        this.setAttribute("value", val);
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
                    this.#applyValue(this.value);
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
        const view = this.shadowRoot.getElementById("view");
        if (!this.readOnly) {
            this.value = value;
            const container = this.shadowRoot.getElementById("scroll-container");
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
        view.focus();
    }

    #applyValue(value) {
        const view = this.shadowRoot.getElementById("view");
        const el = this.querySelector(`[value="${value}"]`);
        if (el != null) {
            view.innerHTML = el.innerHTML;
        } else {
            view.innerHTML = value;
        }
    }

    #sort = debounce(() => {
        this.#slotEventManager.active = false;
        sortChildren(this, `[value]`);
        this.#slotEventManager.active = true;
    });

}

customElements.define("emc-searchselect", SearchSelect);
