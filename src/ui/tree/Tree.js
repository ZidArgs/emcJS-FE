import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import i18n from "emcjs/util/I18n.js";
import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {debounce} from "emcjs/util/Debouncer.js";
import CustomElement from "../element/CustomElement.js";
import {nodeTextComparator} from "../../util/node/NodeListSort.js";
import {scrollIntoViewIfNeeded} from "../../util/node/Scroll.js";
import TreeNodeElementManager from "../../util/tree/manager/TreeNodeElementManager.js";
import TreeNode from "./components/TreeNode.js";
import TPL from "./Tree.js.html" assert {type: "html"};
import STYLE from "./Tree.js.css" assert {type: "css"};

// TODO add cut/copy/paste functionality
// TODO add optional  search
// TODO for sort add ascending/descending option and folder handling
export default class Tree extends CustomElement {

    #treeEl;

    #elementManager;

    #i18nEventManager = new EventTargetManager(i18n);

    #currentSelectionPath = [];

    #currentSelectionRefPath = [];

    #currentMarkedEl;

    #keyboardMarkedEl;

    #ctxMarkedEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#treeEl = this.shadowRoot.getElementById("tree");
        this.#treeEl.addEventListener("select", (event) => {
            if (!event.data.isSelected) {
                const {
                    element, path, refPath
                } = event.data;
                this.#currentSelectionPath = path;
                this.#currentSelectionRefPath = refPath;

                if (this.#keyboardMarkedEl != null) {
                    this.#keyboardMarkedEl.classList.remove("keyboard-marked");
                }
                if (this.#currentMarkedEl != null) {
                    this.#currentMarkedEl.classList.remove("marked");
                }
                if (element != null) {
                    element.classList.add("marked");
                }
                this.#currentMarkedEl = element;
            }
        });
        this.#treeEl.addEventListener("blur", () => {
            if (this.#keyboardMarkedEl != null) {
                this.#keyboardMarkedEl.classList.remove("keyboard-marked");
            }
        });
        this.#treeEl.addEventListener("focus", () => {
            const currentEl = this.#keyboardMarkedEl ?? this.#currentMarkedEl;
            if (currentEl == null) {
                const element = this.#getElementByPath([0]);
                if (element != null) {
                    this.#markKeyboardUsage(null, element);
                }
            }
        });
        /* --- */
        this.addEventListener("keydown", (event) => {
            const {key} = event;
            if (key === "ArrowUp") {
                const currentEl = this.#keyboardMarkedEl ?? this.#currentMarkedEl;
                if (currentEl != null) {
                    const nextEl = this.#findPrevNode(currentEl);
                    if (nextEl != null) {
                        this.#markKeyboardUsage(currentEl, nextEl);
                    }
                } else {
                    const element = this.#getElementByPath([0]);
                    if (element != null) {
                        this.#markKeyboardUsage(null, element);
                    }
                }
                event.preventDefault();
                event.stopPropagation();
            } else if (key === "ArrowDown") {
                const currentEl = this.#keyboardMarkedEl ?? this.#currentMarkedEl;
                if (currentEl != null) {
                    const nextEl = this.#findNextNode(currentEl);
                    if (nextEl != null) {
                        this.#markKeyboardUsage(currentEl, nextEl);
                    }
                } else {
                    const element = this.#getElementByPath([0]);
                    if (element != null) {
                        this.#markKeyboardUsage(null, element);
                    }
                }
                event.preventDefault();
                event.stopPropagation();
            } else if (key === "ArrowLeft") {
                const currentEl = this.#keyboardMarkedEl ?? this.#currentMarkedEl;
                if (currentEl != null && currentEl.collapsible) {
                    currentEl.toggleCollapsed(true);
                }
                event.preventDefault();
                event.stopPropagation();
            } else if (key === "ArrowRight") {
                const currentEl = this.#keyboardMarkedEl ?? this.#currentMarkedEl;
                if (currentEl != null && currentEl.collapsible) {
                    currentEl.toggleCollapsed(false);
                }
                event.preventDefault();
                event.stopPropagation();
            } else if (key === "Enter" || key === " ") {
                const currentEl = this.#keyboardMarkedEl;
                if (currentEl != null) {
                    currentEl.select();
                }
                event.preventDefault();
                event.stopPropagation();
            }
        });
        /* --- */
        this.#elementManager = new TreeNodeElementManager(this, TreeNode);
        if (this.sorted) {
            this.#elementManager.registerSortFunction(this.#sortByNameFunction);
        }
        /* --- */
        this.#i18nEventManager.active = this.sorted;
        this.#i18nEventManager.set("language", () => {
            this.#sort();
        });
        this.#i18nEventManager.set("translation", () => {
            this.#sort();
        });
    }

    connectedCallback() {
        super.connectedCallback?.();

        const sorted = this.sorted;
        this.#i18nEventManager.active = sorted;
        if (sorted) {
            this.#elementManager.registerSortFunction(this.#sortByNameFunction);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#i18nEventManager.active = false;
    }

    set sorted(value) {
        this.setBooleanAttribute("sorted", value);
    }

    get sorted() {
        return this.getBooleanAttribute("sorted");
    }

    static get observedAttributes() {
        return ["sorted"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "sorted": {
                    if (oldValue != newValue) {
                        const sorted = this.sorted;
                        this.#i18nEventManager.active = sorted;
                        if (sorted) {
                            this.#elementManager.registerSortFunction(this.#sortByNameFunction);
                        } else {
                            this.#elementManager.registerSortFunction();
                        }
                    }
                } break;
            }
        }
    }

    loadConfig(config) {
        const data = [];
        for (const key in config) {
            const options = config[key];
            data.push({
                ...options,
                key
            });
        }
        this.#elementManager.manage(data);
    }

    loadConfigAtPath(path, config) {
        if (!Array.isArray(path)) {
            throw new Error("path must be an array");
        }
        if (path.length == 0) {
            this.loadConfig(config);
        } else {
            const node = this.#getElementByPath(path);
            if (node != null) {
                node.loadConfig(config);
            }
        }
    }

    loadConfigAtRefPath(path, config) {
        if (!Array.isArray(path)) {
            throw new Error("path must be an array");
        }
        if (path.length == 0) {
            this.loadConfig(config);
        } else {
            const node = this.#getElementByRefPath(path);
            if (node != null) {
                node.loadConfig(config);
            }
        }
    }

    getSelectedPath() {
        return deepClone(this.#currentSelectionPath);
    }

    getSelectedRefPath() {
        return deepClone(this.#currentSelectionRefPath);
    }

    selectItemByPath(path, silent = false) {
        const element = this.#getElementByPath(path);
        if (element != null) {
            if (!silent) {
                element.select();
            } else {
                element.selectSilent();
            }
        } else {
            this.#currentSelectionPath = [];
            this.#currentSelectionRefPath = [];
            if (this.#keyboardMarkedEl != null) {
                this.#keyboardMarkedEl.classList.remove("keyboard-marked");
            }
            if (this.#currentMarkedEl != null) {
                this.#currentMarkedEl.classList.remove("marked");
            }
            const ev = new Event("select", {
                bubbles: true,
                cancelable: true
            });
            ev.data = {
                element: null,
                ref: undefined,
                isSelected: false,
                path: [],
                refPath: [],
                left: 0,
                top: 0
            };
            this.dispatchEvent(ev);
        }
    }

    selectItemByRefPath(path, silent = false) {
        const element = this.#getElementByRefPath(path);
        if (element != null) {
            if (!silent) {
                element.select();
            } else {
                element.selectSilent();
            }
        } else {
            this.#currentSelectionPath = [];
            this.#currentSelectionRefPath = [];
            if (this.#keyboardMarkedEl != null) {
                this.#keyboardMarkedEl.classList.remove("keyboard-marked");
            }
            if (this.#currentMarkedEl != null) {
                this.#currentMarkedEl.classList.remove("marked");
            }
            const ev = new Event("select", {
                bubbles: true,
                cancelable: true
            });
            ev.data = {
                element: null,
                ref: undefined,
                isSelected: false,
                path: [],
                refPath: [],
                left: 0,
                top: 0
            };
            this.dispatchEvent(ev);
        }
    }

    markItemForMenuByPath(path) {
        if (this.#keyboardMarkedEl != null) {
            this.#keyboardMarkedEl.classList.remove("keyboard-marked");
        }
        if (this.#ctxMarkedEl != null) {
            this.#ctxMarkedEl.classList.remove("ctx-marked");
        }
        const element = this.#getElementByPath(path);
        if (element != null) {
            element.classList.add("ctx-marked");
        }
        this.#ctxMarkedEl = element;
    }

    markItemForMenuByRefPath(path) {
        if (this.#keyboardMarkedEl != null) {
            this.#keyboardMarkedEl.classList.remove("keyboard-marked");
        }
        if (this.#ctxMarkedEl != null) {
            this.#ctxMarkedEl.classList.remove("ctx-marked");
        }
        const element = this.#getElementByRefPath(path);
        if (element != null) {
            element.classList.add("ctx-marked");
        }
        this.#ctxMarkedEl = element;
    }

    toggleNodeCollapsedByPath(path, force) {
        const element = this.#getElementByPath(path);
        if (element != null) {
            element.toggleCollapsed(force);
        }
    }

    toggleNodeCollapsedByRefPath(path, force) {
        const element = this.#getElementByRefPath(path);
        if (element != null) {
            element.toggleCollapsed(force);
        }
    }

    forcePathExpanded(path) {
        if (path == null || !path.length) {
            return;
        }
        const p = [...path];
        let res = this;
        while (p.length) {
            const i = p.shift();
            res = res.children[i];
            if (res == null) {
                return;
            }
            res.toggleCollapsed(false);
        }
    }

    forceRefPathExpanded(path) {
        if (path == null || !path.length) {
            return;
        }
        const p = [...path];
        let res = this;
        while (p.length) {
            const i = p.shift();
            if (typeof i === "string") {
                res = res.querySelector(`:scope > [ref="${i}"]`);
            } else {
                res = res.children[i];
            }
            if (res == null) {
                return;
            }
            res.toggleCollapsed(false);
        }
    }

    forceAllCollapsed(collapsed = true) {
        for (const ch of this.children) {
            ch.forceAllCollapsed(collapsed);
        }
    }

    #getElementByPath(path) {
        if (path == null || !Array.isArray(path) || !path.length) {
            return null;
        }
        const p = [...path];
        let res = this;
        while (p.length) {
            const i = p.shift();
            res = res.children[i];
            if (res == null) {
                return null;
            }
        }
        return res;
    }

    #getElementByRefPath(path) {
        if (path == null || !Array.isArray(path) || !path.length) {
            return null;
        }
        const p = [...path];
        let res = this;
        while (p.length) {
            const i = p.shift();
            if (typeof i === "string") {
                res = res.querySelector(`:scope > [ref="${i}"]`);
            } else {
                res = res.children[i];
            }
            if (res == null) {
                return null;
            }
        }
        return res;
    }

    getPathForNode(node) {
        if (!this.contains(node)) {
            return null;
        }
        return this.#getPathForNodeRecursive(node);
    }

    #getPathForNodeRecursive(node, res = []) {
        if (node === this) {
            return res;
        }
        const targetIndex = Array.from(node.parentElement.children).indexOf(node);
        res.unshift(targetIndex);
        return this.#getPathForNodeRecursive(node.parentElement, res);
    }

    #findPrevNode(node) {
        if (node === this || !this.contains(node)) {
            return null;
        }
        const prevEl = node.previousElementSibling;
        if (prevEl != null) {
            if (node.children.length && !prevEl.collapsed) {
                let current = prevEl;
                while (current.lastElementChild != null && !current.collapsed) {
                    current = current.lastElementChild;
                }
                return current;
            }
            return prevEl;
        }
        const parentEl = node.parentElement;
        if (parentEl !== this) {
            return parentEl;
        }
        return null;
    }

    #findNextNode(node) {
        if (node === this || !this.contains(node)) {
            return null;
        }
        if (node.children.length && !node.collapsed) {
            return node.firstElementChild;
        }
        let current = node;
        while (current !== this) {
            const nextEl = node.nextElementSibling;
            if (nextEl != null) {
                return nextEl;
            }
            current = current.parentElement;
        }
        return null;
    }

    #markKeyboardUsage(currentEl, nextEl) {
        if (currentEl != null) {
            currentEl.classList.remove("keyboard-marked");
        }
        if (nextEl != null) {
            nextEl.classList.add("keyboard-marked");
            const contentEl = nextEl.shadowRoot.getElementById("content");
            scrollIntoViewIfNeeded(contentEl, {
                behavior: "smooth",
                block: "nearest"
            });
        }
        this.#keyboardMarkedEl = nextEl;
    }

    #sort = debounce(() => {
        this.#elementManager.sort();
    }, 1000);

    #sortByNameFunction(entry0, entry1) {
        const {element: el0} = entry0;
        const {element: el1} = entry1;
        return nodeTextComparator(el0, el1);
    }

}

customElements.define("emc-tree", Tree);

