import i18n from "@emcjs/core/util/I18n.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import CustomElement from "../../element/CustomElement.js";
import TreeNodeElementManager from "../../../util/tree/manager/TreeNodeElementManager.js";
import {scrollIntoViewIfNeeded} from "../../../util/node/Scroll.js";
import {nodeTextComparator} from "../../../util/node/NodeListSort.js";
import {findParentBySelector} from "../../../util/node/FindParentBySelector.js";
import "../../i18n/I18nLabel.js";
import TPL from "./TreeNode.js.html" assert {type: "html"};
import STYLE from "./TreeNode.js.css" assert {type: "css"};

const NODE_TYPES = new Map();

const CONNECTED_NODE_MAP = new WeakMap();

export default class TreeNode extends CustomElement {

    #weakRef;

    #nodeEl;

    #connectedNode;

    #subTreeEl;

    #labelEl;

    #contentEl;

    #collapseEl;

    #elementManager;

    #i18nEventManager = new EventTargetManager(i18n);

    #registeredSortFunction;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        this.#weakRef = new WeakRef(this);
        /* --- */
        this.#labelEl = this.shadowRoot.getElementById("label");
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#contentEl.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();

            if (this.selectOnClick) {
                this.#dispachSelectEvent(event);
            }

            const contentClickEvent = new MouseEvent("contentclick", event);
            this.dispatchEvent(contentClickEvent);

            if (event.pointerType && !contentClickEvent.defaultPrevented) {
                this.toggleCollapsed();
            }
        });
        this.#contentEl.addEventListener("contextmenu", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const targetIndex = Array.from(this.parentElement.children).indexOf(this);
            const menuEvent = new Event("menu", {
                bubbles: true,
                cancelable: true
            });
            menuEvent.data = {
                element: this,
                index: targetIndex,
                ref: this.ref,
                connectedNode: this.connectedNode,
                isSelected: this.classList.contains("marked"),
                path: [targetIndex],
                refPath: [this.ref],
                left: event.clientX,
                top: event.clientY
            };
            this.dispatchEvent(menuEvent);

            const contentContextmenuEvent = new MouseEvent("contentcontextmenu", event);
            this.dispatchEvent(contentContextmenuEvent);
        });
        /* --- */
        this.#subTreeEl = this.shadowRoot.getElementById("tree");
        this.#subTreeEl.addEventListener("select", (event) => {
            event.stopPropagation();
            const {
                element, index, ref, connectedNode, isSelected, path, refPath, left, top
            } = event.data;
            const targetIndex = Array.from(this.parentElement.children).indexOf(this);
            const selectEvent = new Event("select", {
                bubbles: true,
                cancelable: true
            });
            selectEvent.data = {
                element,
                index,
                ref,
                connectedNode,
                isSelected,
                path: [targetIndex, ...path ?? []],
                refPath: [this.ref, ...refPath ?? []],
                left,
                top
            };
            this.dispatchEvent(selectEvent);
            if (selectEvent.defaultPrevented) {
                event.preventDefault();
            }
        });
        this.#subTreeEl.addEventListener("menu", (event) => {
            event.stopPropagation();
            const {
                element, index, ref, connectedNode, isSelected, path, refPath, left, top
            } = event.data;
            const targetIndex = Array.from(this.parentElement.children).indexOf(this);
            const menuEvent = new Event("menu", {
                bubbles: true,
                cancelable: true
            });
            menuEvent.data = {
                element,
                index,
                ref,
                connectedNode,
                isSelected,
                path: [targetIndex, ...path ?? []],
                refPath: [this.ref, ...refPath ?? []],
                left,
                top
            };
            this.dispatchEvent(menuEvent);
        });
        /* --- */
        this.#nodeEl = this.shadowRoot.getElementById("node");
        this.#collapseEl = this.shadowRoot.getElementById("collapse");
        this.#collapseEl.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.toggleCollapsed();
        });
        /* --- */
        this.#elementManager = new TreeNodeElementManager(this, TreeNode);
        if (this.sorted) {
            this.#elementManager.registerSortFunction(this.#registeredSortFunction ?? TreeNode.#sortByNameFunction);
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
            this.#elementManager.registerSortFunction(this.#registeredSortFunction ?? TreeNode.#sortByNameFunction);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
    }

    set connectedNode(value) {
        if (value instanceof Node) {
            this.#removeConnectedNode(this.connectedNode);
            this.#connectedNode = new WeakRef(value);
            this.#addConnectedNode(value);
        } else {
            this.#removeConnectedNode(this.connectedNode);
            this.#connectedNode = null;
        }
    }

    get connectedNode() {
        return this.#connectedNode?.deref();
    }

    get collapsible() {
        return this.forceCollapsible || this.children.length;
    }

    get collapsed() {
        return this.#nodeEl.classList.contains("collapsed");
    }

    set ref(val) {
        this.setAttribute("ref", val);
    }

    get ref() {
        return this.getAttribute("ref");
    }

    set label(val) {
        this.setAttribute("label", val);
    }

    get label() {
        return this.getAttribute("label");
    }

    set forceCollapsible(val) {
        this.setBooleanAttribute("forcecollapsible", val);
    }

    get forceCollapsible() {
        return this.getBooleanAttribute("forcecollapsible");
    }

    set sorted(value) {
        this.setBooleanAttribute("sorted", value);
    }

    get sorted() {
        return this.getBooleanAttribute("sorted");
    }

    set selectOnClick(value) {
        this.setBooleanAttribute("selectonclick", value);
    }

    get selectOnClick() {
        return this.getBooleanAttribute("selectonclick");
    }

    static get observedAttributes() {
        return ["label", "sorted"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "label": {
                    if (oldValue != newValue) {
                        this.#labelEl.i18nValue = newValue;
                    }
                } break;
                case "sorted": {
                    if (oldValue != newValue) {
                        const sorted = this.sorted;
                        this.#i18nEventManager.active = sorted;
                        if (sorted) {
                            this.#elementManager.registerSortFunction(this.#registeredSortFunction ?? TreeNode.#sortByNameFunction);
                        } else {
                            this.#elementManager.registerSortFunction();
                        }
                    }
                } break;
            }
        }
    }

    select = debounce(() => {
        this.toggleCollapsed(false);
        scrollIntoViewIfNeeded(this.#contentEl, {
            behavior: "smooth",
            block: "nearest"
        });
        this.#contentEl.click();
    });

    selectSilent = debounce(() => {
        this.toggleCollapsed(false);
        scrollIntoViewIfNeeded(this.#contentEl, {
            behavior: "smooth",
            block: "nearest"
        });
        this.#dispachSelectEvent();
    });

    toggleCollapsed(force) {
        if (this.collapsible) {
            this.#nodeEl.classList.toggle("collapsed", force);
        }
        if (!this.collapsed) {
            const parentNode = findParentBySelector(this, "emc-tree-node");
            if (parentNode) {
                parentNode.toggleCollapsed(false);
            }
        }
    }

    forceAllCollapsed(collapsed = true) {
        this.toggleCollapsed(!!collapsed);
        for (const ch of this.children) {
            ch.forceAllCollapsed(collapsed);
        }
    }

    loadConfig(structure) {
        const data = [];
        for (const key in structure) {
            const config = structure[key];
            data.push({
                ...config,
                key
            });
        }
        this.#elementManager.manage(data);
    }

    static registerNodeType(type, TreeNodeClass) {
        if (typeof type !== "string" || type === "") {
            throw new TypeError("type must be a non empty string");
        }
        if (TreeNodeClass === TreeNode) {
            throw new TypeError("can not register TreeNode itself");
        }
        if (!(TreeNodeClass.prototype instanceof TreeNode)) {
            throw new TypeError("registered types must inherit from TreeNode");
        }
        if (NODE_TYPES.has(type)) {
            throw new Error(`type "${type}" already registered`);
        }
        NODE_TYPES.set(type, TreeNodeClass);
        return this;
    }

    static createNodeType(type) {
        const TreeNodeClass = NODE_TYPES.get(type) ?? TreeNode;
        return new TreeNodeClass();
    }

    get comparatorText() {
        return this.#labelEl.innerText;
    }

    #sort = debounce(() => {
        this.#elementManager.sort();
    }, 1000);

    registerSortFunction(fn) {
        if (typeof fn === "function") {
            this.#registeredSortFunction = fn;
            if (this.sorted) {
                this.#elementManager.registerSortFunction(fn);
            }
        } else {
            this.#registeredSortFunction = null;
            if (this.sorted) {
                this.#elementManager.registerSortFunction(TreeNode.#sortByNameFunction);
            }
        }
    }

    #dispachSelectEvent(event) {
        const targetIndex = Array.from(this.parentElement.children).indexOf(this);
        const selectEvent = new Event("select", {
            bubbles: true,
            cancelable: true
        });
        selectEvent.data = {
            element: this,
            index: targetIndex,
            ref: this.ref,
            connectedNode: this.connectedNode,
            isSelected: this.classList.contains("marked"),
            path: [targetIndex],
            refPath: [this.ref],
            left: event?.clientX ?? 0,
            top: event?.clientY ?? 0
        };
        this.dispatchEvent(selectEvent);
    }

    static #sortByNameFunction(entry0, entry1) {
        const {element: el0} = entry0;
        const {element: el1} = entry1;
        return nodeTextComparator(el0, el1);
    }

    #addConnectedNode(value) {
        if (!CONNECTED_NODE_MAP.has(value)) {
            CONNECTED_NODE_MAP.set(value, new Set());
        }
        CONNECTED_NODE_MAP.get(value).add(this.#weakRef);
    }

    #removeConnectedNode(value) {
        if (CONNECTED_NODE_MAP.has(value)) {
            CONNECTED_NODE_MAP.get(value).delete(this.#weakRef);
        }
    }

    static getByConnectedNode(node) {
        const treeNodes = CONNECTED_NODE_MAP.get(node);
        return [...treeNodes].map((el) => el.deref()).filter((el) => el != null);
    }

}

customElements.define("emc-tree-node", TreeNode);

