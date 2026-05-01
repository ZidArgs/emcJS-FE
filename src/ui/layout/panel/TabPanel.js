import {isStringNotEmpty} from "emcjs/util/helper/CheckType.js";
import CustomElement from "../../element/CustomElement.js";
import "../../form/button/Button.js";
import TPL from "./TabPanel.js.html" assert {type: "html"};
import STYLE from "./TabPanel.js.css" assert {type: "css"};

export default class TabPanel extends CustomElement {

    #slotEl;

    #categoryEl;

    #panelList = new Map();

    #buttonList = new Map();

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#slotEl = this.shadowRoot.getElementById("body");
        this.#slotEl.addEventListener("slotchange", () => {
            this.#prepareTabs();
        });
        /* --- */
        this.#categoryEl = this.shadowRoot.getElementById("categories");
        this.#categoryEl.addEventListener("click", (event) => {
            const target = event.target.getAttribute("target");
            if (target != null) {
                this.active = target;
                event.preventDefault();
                return false;
            }
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#prepareTabs();
        if (!this.active) {
            const el = this.#categoryEl.querySelector("[target]");
            if (el != null) {
                this.active = el.getAttribute("target");
            }
        }
    }

    get active() {
        return this.getAttribute("active");
    }

    set active(val) {
        this.setAttribute("active", val);
    }

    static get observedAttributes() {
        return ["active"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "active": {
                    if (oldValue) {
                        const oldPanel = this.#panelList.get(oldValue);
                        if (oldPanel != null) {
                            oldPanel.classList.remove("active");
                            if (typeof oldPanel.unload === "function") {
                                oldPanel.unload();
                            }
                        }
                        const oldButton = this.#buttonList.get(oldValue);
                        if (oldButton != null) {
                            oldButton.active = false;
                        }
                    }
                    const newPanel = this.#panelList.get(newValue);
                    if (newPanel != null) {
                        newPanel.classList.add("active");
                        if (typeof newPanel.load === "function") {
                            newPanel.load();
                        }
                    }
                    const newButton = this.#buttonList.get(newValue);
                    if (newButton != null) {
                        newButton.active = true;
                        const ev = new Event("change");
                        ev.panel = newValue;
                        this.dispatchEvent(ev);
                    } else {
                        const firstButton = this.#categoryEl.querySelector("[target]");
                        if (firstButton != null) {
                            firstButton.active = true;
                            this.active = firstButton.getAttribute("target");
                        }
                    }
                } break;
            }
        }
    }

    setTab(category, name = category) {
        if (!isStringNotEmpty(category)) {
            throw new Error("category must be an unempty string");
        }
        if (!isStringNotEmpty(name)) {
            throw new Error("optional name must be an unempty string");
        }
        const buttonEl = this.#buttonList.get(category);
        if (buttonEl == null) {
            // panel
            const panelEl = this.#panelList.get(category) ?? document.createElement("div");
            panelEl.className = "panel";
            if (category === this.active) {
                panelEl.classList.add("active");
            }
            panelEl.setAttribute("category", category);
            this.#panelList.set(category, panelEl);
            this.append(panelEl);
            // button
            this.#addTabButton(category, name);
            // ---
            return panelEl;
        } else {
            buttonEl.text = name;
        }
    }

    getTab(category) {
        return this.#panelList.get(category);
    }

    hasTab(category) {
        return this.#panelList.has(category);
    }

    removeTab(category) {
        const panelEl = this.#panelList.get(category);
        if (panelEl != null) {
            panelEl.remove();
        }
        const buttonEl = this.#buttonList.get(category);
        if (buttonEl != null) {
            buttonEl.remove();
        }
        this.#panelList.delete(category);
        this.#buttonList.delete(category);
    }

    #prepareTabs() {
        const panelElList = this.#slotEl.assignedNodes();
        const deletedTabs = new Set(this.#buttonList.keys());
        this.#categoryEl.innerHTML = "";
        for (const panelEl of panelElList) {
            if (panelEl instanceof HTMLElement) {
                const category = panelEl.getAttribute("category");
                if (isStringNotEmpty(category)) {
                    deletedTabs.delete(category);
                    this.#panelList.set(category, panelEl);
                    panelEl.className = "panel";
                    if (category === this.active) {
                        panelEl.classList.add("active");
                        if (typeof panelEl.load === "function") {
                            panelEl.load();
                        }
                    }
                    const buttonEl = this.#buttonList.get(category);
                    if (buttonEl == null) {
                        this.#addTabButton(category, category);
                    } else {
                        this.#categoryEl.append(buttonEl);
                    }
                }
            }
        }
        for (const deleted of deletedTabs) {
            this.#panelList.delete(deleted);
            this.#buttonList.delete(deleted);
            if (deleted === this.active) {
                this.active = null;
            }
        }
    }

    #addTabButton(category, name) {
        const buttonEl = document.createElement("emc-button");
        buttonEl.className = "category";
        if (category === this.active) {
            buttonEl.classList.add("active");
        }
        buttonEl.setAttribute("target", category);
        buttonEl.setAttribute("border-flat", "bottom");
        buttonEl.setAttribute("border-open", "bottom");
        buttonEl.setAttribute("slim", "");
        buttonEl.text = name;
        this.#buttonList.set(category, buttonEl);
        this.#categoryEl.append(buttonEl);
    }

}

customElements.define("emc-panel-tabpanel", TabPanel);
