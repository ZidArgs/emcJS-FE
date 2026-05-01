import EventManager from "emcjs/util/event/EventManager.js";
import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {debounce} from "emcjs/util/Debouncer.js";
import CustomElement from "../../element/CustomElement.js";
import ContextMenuLayer from "./ContextMenuLayer.js";
import "./ContextMenuItem.js";
import TPL from "./ContextMenu.js.html" assert {type: "html"};
import STYLE from "./ContextMenu.js.css" assert {type: "css"};

const Q_TAB = [
    "button:not([tabindex=\"-1\"])",
    "[href]:not([tabindex=\"-1\"])",
    "input:not([tabindex=\"-1\"])",
    "select:not([tabindex=\"-1\"])",
    "textarea:not([tabindex=\"-1\"])",
    "[tabindex]:not([tabindex=\"-1\"])"
].join(",");

const LAYER_MARGIN = 5;

export default class ContextMenu extends CustomElement {

    #menuEl;

    #initFocusEl;

    #topFocusEl;

    #bottomFocusEl;

    #top = 0;

    #left = 0;

    #props;

    #items = null;

    #addedItems = null;

    #inactiveGroups = new Set();

    #entriesEventManager = new EventManager(false);

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#menuEl = this.shadowRoot.getElementById("menu");
        this.#initFocusEl = this.shadowRoot.getElementById("init_focus");
        this.#topFocusEl = this.shadowRoot.getElementById("focus_catcher_top");
        this.#bottomFocusEl = this.shadowRoot.getElementById("focus_catcher_bottom");
        this.#menuEl.style.left = `${LAYER_MARGIN}px`;
        this.#menuEl.style.top = `${LAYER_MARGIN}px`;
        this.#menuEl.addEventListener("click", (event) => {
            this.close();
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.addEventListener("click", (event) => {
            this.close();
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.addEventListener("contextmenu", (event) => {
            this.close();
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.addEventListener("keyup", (event) => {
            if (event.key == "Enter" || event.key == "Escape") {
                this.close();
                /* --- */
                event.preventDefault();
                return false;
            }
        });
        /* --- */
        this.#topFocusEl.addEventListener("focus", () => {
            this.focusLast();
        });
        this.#bottomFocusEl.addEventListener("focus", () => {
            this.focusFirst();
        });
        this.#initFocusEl.addEventListener("blur", () => {
            this.#initFocusEl.setAttribute("tabindex", "");
        });
    }

    connectedCallback() {
        super.connectedCallback?.();

        this.#entriesEventManager.active = true;
        this.initItems();
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();

        this.#entriesEventManager.active = false;
    }

    get top() {
        return this.#top;
    }

    get left() {
        return this.#left;
    }

    get active() {
        const val = this.getAttribute("active");
        return !!val && val != "false";
    }

    set active(val) {
        this.setAttribute("active", val);
    }

    show(posX, posY, ...props) {
        this.#top = posY;
        this.#left = posX;
        this.#menuEl.style.visibility = "hidden";
        this.#props = deepClone(props);
        /* --- */
        if (!this.active) {
            this.active = true;
            this.dispatchEvent(new Event("show"));
        }
        /* --- */
        setTimeout(() => {
            this.#calculatePostition();
            this.initFocus();
        }, 0);
    }

    #calculatePostition() {
        const pRect = ContextMenuLayer.getNextLayerBounds(this);
        let posY = this.#top;
        let posX = this.#left;
        if (pRect.x >= 0 && posX < pRect.x + LAYER_MARGIN) {
            posX = pRect.x + LAYER_MARGIN;
        } else {
            const bWidth = Math.min(pRect.width + pRect.x, window.innerWidth);
            if (this.#menuEl.offsetWidth + posX > bWidth - LAYER_MARGIN) {
                posX = bWidth - this.#menuEl.offsetWidth - LAYER_MARGIN;
            }
        }
        if (pRect.y >= 0 && posY < pRect.y + LAYER_MARGIN) {
            posY = pRect.y + LAYER_MARGIN;
        } else {
            const bHeight = Math.min(pRect.height + pRect.y, window.innerHeight);
            if (this.#menuEl.offsetHeight + posY > bHeight - LAYER_MARGIN) {
                posY = bHeight - this.#menuEl.offsetHeight - LAYER_MARGIN;
            }
        }
        this.#menuEl.style.visibility = "";
        this.#menuEl.style.left = `${posX}px`;
        this.#menuEl.style.top = `${posY}px`;
    }

    close() {
        if (this.active) {
            this.active = false;
            this.dispatchEvent(new Event("close"));
        }
        /* --- */
        this.#menuEl.style.left = `${LAYER_MARGIN}px`;
        this.#menuEl.style.top = `${LAYER_MARGIN}px`;
    }

    initFocus() {
        this.#initFocusEl.setAttribute("tabindex", "0");
        this.#initFocusEl.focus();
    }

    focusFirst() {
        const a = Array.from(this.querySelectorAll(Q_TAB));
        if (a.length) {
            a[0].focus();
        }
    }

    focusLast() {
        const a = Array.from(this.querySelectorAll(Q_TAB));
        if (a.length) {
            a[a.length - 1].focus();
        }
    }

    initItems() {
        if (this.#items == null) {
            const config = [];
            const itemEls = this.querySelectorAll("div.splitter, [menu-action]");
            for (const itemEl of Array.from(itemEls)) {
                const attr = itemEl.getAttribute("menu-action");
                if (attr != null) {
                    config.push({
                        menuAction: attr,
                        content: itemEl.innerHTML
                    });
                } else {
                    config.push("splitter");
                }
            }
            this.setItems(config);
        }
    }

    setItems(config) {
        if (Array.isArray(config)) {
            this.#items = config;
            this.#renderItems();
        } else {
            this.#items = null;
            this.initItems();
        }
    }

    setAddedItems(config) {
        if (Array.isArray(config)) {
            this.#addedItems = config;
            this.#renderItems();
        } else {
            this.#addedItems = null;
            this.#renderItems();
        }
    }

    toggleGroupActive(name, value) {
        if (value) {
            this.#inactiveGroups.delete(name);
        } else {
            this.#inactiveGroups.add(name);
        }
        const itemEls = this.querySelectorAll(`[menu-group="${name}"]`);
        for (const itemEl of Array.from(itemEls)) {
            itemEl.classList.toggle("hidden", !value);
        }
    }

    #renderItems = debounce(() => {
        this.#entriesEventManager.clear();
        this.innerHTML = "";
        if (Array.isArray(this.#items)) {
            for (const entry of this.#items) {
                this.#addItem(entry);
            }
        }
        if (Array.isArray(this.#addedItems)) {
            for (const entry of this.#addedItems) {
                this.#addItem(entry);
            }
        }
        if (this.active) {
            this.#calculatePostition();
            this.initFocus();
        }
    });

    #addItem(entry) {
        if (entry == "splitter") {
            const el = document.createElement("div");
            el.classList.add("splitter");
            this.append(el);
        } else if (entry instanceof HTMLElement) {
            this.append(entry);
            const attr = entry.getAttribute("menu-action");
            if (attr) {
                this.#entriesEventManager.set(entry, "click", (event) => {
                    this.#onElementChoice(attr);
                    /* --- */
                    event.preventDefault();
                    return false;
                });
                this.#entriesEventManager.set(entry, "keyup", (event) => {
                    if (event.key == "Enter") {
                        this.#onElementChoice(attr);
                        /* --- */
                        event.preventDefault();
                        return false;
                    }
                });
            }
        } else if (typeof entry == "object" && !Array.isArray(entry)) {
            if (entry.type == "splitter") {
                const el = document.createElement("div");
                el.classList.add("splitter");
                if (entry.group) {
                    el.setAttribute("menu-group", entry.group);
                    if (this.#inactiveGroups.has(entry.group)) {
                        el.classList.add("hidden");
                    }
                }
                this.append(el);
            } else if (!entry.type || entry.type == "item") {
                const el = document.createElement("emc-contextmenuitem");
                el.classList.add("item");
                if (entry.group) {
                    el.setAttribute("menu-group", entry.group);
                    if (this.#inactiveGroups.has(entry.group)) {
                        el.classList.add("hidden");
                    }
                }
                el.setAttribute("tabindex", "0");
                el.innerHTML = entry.content;
                el.info = entry.info;

                /* --- */
                if (typeof entry.action == "function") {
                    this.#entriesEventManager.set(el, "click", (event) => {
                        entry.action();
                        /* --- */
                        event.preventDefault();
                        return false;
                    });
                    this.#entriesEventManager.set(el, "keyup", (event) => {
                        if (event.key == "Enter") {
                            entry.action();
                            /* --- */
                            event.preventDefault();
                            return false;
                        }
                    });
                }
                /* --- */
                if (typeof entry.menuAction == "string") {
                    el.setAttribute("menu-action", entry.menuAction);
                    this.#entriesEventManager.set(el, "click", (event) => {
                        this.#onElementChoice(entry.menuAction);
                        /* --- */
                        event.preventDefault();
                        return false;
                    });
                    this.#entriesEventManager.set(el, "keyup", (event) => {
                        if (event.key == "Enter") {
                            this.#onElementChoice(entry.menuAction);
                            /* --- */
                            event.preventDefault();
                            return false;
                        }
                    });
                }
                this.append(el);
            }
        }
    }

    #onElementChoice(name) {
        const ev = new Event(name);
        ev.left = this.left;
        ev.top = this.top;
        ev.props = deepClone(this.#props);
        this.dispatchEvent(ev);
    }

}

customElements.define("emc-contextmenu", ContextMenu);
