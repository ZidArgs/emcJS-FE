import EventManager from "emcjs/util/event/EventManager.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import {
    isFunction,
    isHttpUrl
} from "emcjs/util/helper/CheckType.js";
import CustomElement from "../element/CustomElement.js";
import "./button/NavbarButton.js";
import "./button/HamburgerButton.js";
import TPL from "./NavBar.js.html" assert {type: "html"};
import STYLE from "./NavBar.js.css" assert {type: "css"};

const MIXINS = new Map();

function encodeWindowFeatures(input) {
    if (typeof input === "string") {
        return input;
    } else if (typeof input === "object" && !Array.isArray(input)) {
        return Object.entries(input).map((entry) => {
            const [key, value] = entry;
            return `${key}=${value}`;
        }).join(",");
    }
}

// TODO use EventManager for navigation elements
export default class NavBar extends CustomElement {

    #containerEl;

    #contentEl;

    #coverEl;

    #hamburgerEl;

    #navigationHandler = null;

    #navigationEventManager = new EventManager(false);

    #windowEventManager = new EventTargetManager(window, false);

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */

        // layout
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#hamburgerEl = this.shadowRoot.getElementById("hamburger-button");
        this.#coverEl = this.shadowRoot.getElementById("cover");
        this.#hamburgerEl.addEventListener("click", () => {
            if (this.#containerEl.classList.contains("open")) {
                this.#closeAll();
            } else {
                this.#containerEl.classList.add("open");
                this.#hamburgerEl.open = true;
            }
        });
        this.#coverEl.addEventListener("click", () => {
            this.#closeAll();
        });
        this.addEventListener("blur", () => {
            this.#closeAll();
        });
        this.#windowEventManager.set("resize", () => {
            this.#closeAll();
        });
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#windowEventManager.active = true;
        this.#navigationEventManager.active = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#windowEventManager.active = false;
        this.#navigationEventManager.active = false;
    }

    set maxWidth(value) {
        this.setIntAttribute("maxwidth", value, 0);
    }

    get maxWidth() {
        return this.getIntAttribute("maxwidth");
    }

    static get observedAttributes() {
        return ["maxwidth"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "maxwidth") {
            if (oldValue != newValue) {
                this.#containerEl.style.maxWidth = `${newValue}px`;
            }
        }
    }

    loadNavigation(config) {
        this.#navigationEventManager.clear();
        this.#contentEl.innerHTML = "";
        for (const item of config) {
            this.#generateElement(this.#contentEl, item);
        }
    }

    setNavigationHandler(fn) {
        if (typeof fn === "function") {
            this.#navigationHandler = fn;
        } else {
            this.#navigationHandler = null;
        }
    }

    #generateElement(contentEl, config) {
        const IS_MAIN_NAV = contentEl.id == "content";
        if (config["visible"] == null || !!config["visible"]) {
            if (config["mixin"]) {
                const mixinConfig = MIXINS.get(config["mixin"]);
                if (mixinConfig != null) {
                    for (const item of mixinConfig) {
                        this.#generateElement(contentEl, item);
                    }
                }
            } else {
                const listEl = document.createElement("li");
                const btnEl = document.createElement("emc-navbar-button");
                listEl.append(btnEl);
                // content
                if (config["content"] != null) {
                    btnEl.content = config["content"];
                }
                if (config["tooltip"] != null) {
                    btnEl.tooltip = config["tooltip"];
                }
                // action
                if (isFunction(config.handler)) {
                    this.#navigationEventManager.set(btnEl, "click", (event) => {
                        this.#closeAll();
                        config.handler();
                        event.stopPropagation();
                        return false;
                    });
                }
                // href
                if (isHttpUrl(config.href)) {
                    this.#navigationEventManager.set(btnEl, "click", (event) => {
                        this.#closeAll();
                        const target = event.ctrlKey ? "_blank" : config.target;
                        if (target) {
                            const windowFeatures = encodeWindowFeatures(config.windowFeatures);
                            window.open(config.href, target, windowFeatures);
                        } else if (this.#navigationHandler != null) {
                            this.#navigationHandler(config.href);
                        } else {
                            window.location.href = config.href;
                        }
                        event.stopPropagation();
                        return false;
                    });
                }
                // submenu events
                if (!IS_MAIN_NAV) {
                    this.#navigationEventManager.set(btnEl, "focus", (event) => {
                        if (event.relatedTarget != null && !contentEl.contains(event.relatedTarget)) {
                            const pListEl = contentEl.parentElement;
                            pListEl.classList.add("focus-open");
                            this.#containerEl.classList.add("cover");
                            event.preventDefault();
                        }
                    });
                    this.#navigationEventManager.set(btnEl, "blur", (event) => {
                        if (event.relatedTarget == null || !contentEl.contains(event.relatedTarget)) {
                            const pListEl = contentEl.parentElement;
                            pListEl.classList.remove("focus-open");
                            this.#maybeRemoveCover();
                            event.preventDefault();
                        }
                    });
                }
                // submenu
                if (config["submenu"] != null) {
                    const submenuEl = document.createElement("ul");
                    for (const item of config["submenu"]) {
                        this.#generateElement(submenuEl, item);
                    }
                    listEl.append(submenuEl);
                    // submenu button events
                    if (IS_MAIN_NAV) {
                        btnEl.expands = "down";
                    } else {
                        btnEl.expands = "right";
                    }
                    this.#navigationEventManager.set(btnEl, "click", (event) => {
                        if (!listEl.classList.contains("open")) {
                            if (IS_MAIN_NAV) {
                                this.#closeAll();
                                this.#containerEl.classList.add("cover");
                            }
                            listEl.classList.add("open");
                        } else {
                            listEl.classList.remove("open");
                            this.#closeSubtree(submenuEl);
                            if (IS_MAIN_NAV) {
                                this.#maybeRemoveCover();
                            }
                        }
                        event.stopPropagation();
                        return false;
                    });
                    this.#navigationEventManager.set(submenuEl, "click", (event) => {
                        event.stopPropagation();
                        return false;
                    });
                }
                // add element
                contentEl.append(listEl);
            }
        }
    }

    static addMixin(name, config) {
        MIXINS.set(name, config);
    }

    #closeAll() {
        this.#containerEl.classList.remove("cover");
        this.#containerEl.classList.remove("open");
        for (const el of this.#contentEl.querySelectorAll(".open")) {
            el.classList.remove("open");
            el.blur();
        }
        for (const el of this.#contentEl.querySelectorAll(".focus-open")) {
            el.classList.remove("focus-open");
            el.blur();
        }
        this.#hamburgerEl.open = false;
    }

    #closeSubtree(targetEl) {
        for (const el of targetEl.querySelectorAll(".open")) {
            el.classList.remove("open");
        }
    }

    #maybeRemoveCover() {
        const openEl = this.#contentEl.querySelector(".open") ?? this.#contentEl.querySelector(".focus-open");
        if  (openEl == null) {
            this.#containerEl.classList.remove("cover");
        }
    }

}

customElements.define("emc-navbar", NavBar);
