import {appUID} from "@emcjs/core/util/helper/UniqueGenerator.js";
import CustomElement from "../../element/CustomElement.js";
import DragDropMemory from "../../../data/DragDropMemory.js";
import TPL from "./AbstractElement.js.html" assert {type: "html"};
import STYLE from "./AbstractElement.js.css" assert {type: "css"};
import STYLE_ERROR from "./AbstractElement.js.ErrorElement.css" assert {type: "css"};

function dragStart(event) {
    DragDropMemory.clear();
    DragDropMemory.add(event.currentTarget);
    event.stopPropagation();
}

const REG = new Map();

const DEFAULT_LOGIC_CALCULATION_OPTS = {
    valueGetter: () => false,
    execute: () => false
};

export default class AbstractElement extends CustomElement {

    #id;

    #headerEl;

    #headerTextEl;

    #logicResult;

    constructor(caption) {
        if (new.target === AbstractElement) {
            throw new Error("can not construct abstract class");
        }
        /* --- */
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#headerTextEl = this.shadowRoot.getElementById("header-text");
        this.#headerTextEl.innerText = caption;
        this.#id = appUID("logic-element");
        /* --- */
        this.addEventListener("click", (event) => {
            if (this.editable) {
                event.stopPropagation();
            }
        });
        this.addEventListener("contextmenu", (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (this.editable) {
                const ev = new Event("menu", {
                    bubbles: true,
                    cancelable: true
                });
                ev.id = this.#id;
                ev.left = event.clientX;
                ev.top = event.clientY;
                this.dispatchEvent(ev);
            }
        });
        this.addEventListener("dragstart", dragStart);
    }

    connectedCallback() {
        super.connectedCallback?.();
        if (this.getAttribute("tabindex") !== "0") {
            this.setAttribute("tabindex", "0");
        }
        if (this.draggable) {
            this.setAttribute("draggable", "true");
        } else {
            this.removeAttribute("draggable");
        }
        this.setAttribute("id", this.#id);
    }

    get draggable() {
        return !this.disabled && !this.readOnly && (!this.template || this.template !== "clicked");
    }

    get editable() {
        return !this.disabled && !this.readOnly && !this.template;
    }

    get id() {
        return this.#id;
    }

    getHeader() {
        if (this.#headerTextEl) {
            return this.#headerTextEl.innerText;
        }
    }

    set logicResult(value) {
        this.#logicResult = value;
        this.#headerEl.setAttribute("value", value);
    }

    get logicResult() {
        return this.#logicResult;
    }

    getElement(forceCopy = false) {
        if (forceCopy || this.template) {
            const node = this.cloneNode(true);
            node.removeAttribute("template");
            return node;
        } else {
            return this;
        }
    }

    calculate(/* DEFAULT_LOGIC_CALCULATION_PARAMS */) {
        throw new Error("can not call abstract method");
    }

    toJSON() {
        throw new Error("can not call abstract method");
    }

    loadLogic() {
        throw new Error("can not call abstract method");
    }

    append(node) {
        if (Array.isArray(node)) {
            node.forEach((e) => this.appendChild(e));
        } else {
            this.appendChild(node);
        }
    }

    prepend(node) {
        const firstEl = this.firstChild;
        if (firstEl == null) {
            this.append(node);
        } else if (Array.isArray(node)) {
            node.forEach((e) => firstEl.before(e));
        } else {
            firstEl.before(node);
        }
    }

    appendChild(node) {
        if (node instanceof AbstractElement && this.editable) {
            const r = super.appendChild(node);

            if (this.hasAttribute("visualize")) {
                r.setAttribute("visualize", this.getAttribute("visualize"));
            } else {
                r.removeAttribute("visualize");
            }
            if (this.hasAttribute("readonly")) {
                r.setAttribute("readonly", this.getAttribute("readonly"));
            } else {
                r.removeAttribute("readonly");
            }

            return r;
        }
    }

    insertBefore(node, ref) {
        if (node instanceof AbstractElement && this.editable) {
            const r = super.insertBefore(node, ref);

            if (this.hasAttribute("visualize")) {
                r.setAttribute("visualize", this.getAttribute("visualize"));
            } else {
                r.removeAttribute("visualize");
            }
            if (this.hasAttribute("readonly")) {
                r.setAttribute("readonly", this.getAttribute("readonly"));
            } else {
                r.removeAttribute("readonly");
            }

            return r;
        }
    }

    before(node) {
        const parentEl = this.parentElement;
        if (node instanceof AbstractElement && parentEl.editable) {
            super.before(node);

            if (parentEl.hasAttribute("visualize")) {
                node.setAttribute("visualize", parentEl.getAttribute("visualize"));
            } else {
                node.removeAttribute("visualize");
            }
            if (parentEl.hasAttribute("readonly")) {
                node.setAttribute("readonly", parentEl.getAttribute("readonly"));
            } else {
                node.removeAttribute("readonly");
            }
        }
    }

    after(node) {
        const parentEl = this.parentElement;
        if (node instanceof AbstractElement && parentEl.editable) {
            super.after(node);

            if (parentEl.hasAttribute("visualize")) {
                node.setAttribute("visualize", parentEl.getAttribute("visualize"));
            } else {
                node.removeAttribute("visualize");
            }
            if (parentEl.hasAttribute("readonly")) {
                node.setAttribute("readonly", parentEl.getAttribute("readonly"));
            } else {
                node.removeAttribute("readonly");
            }
        }
    }

    get childList() {
        return [];
    }

    set disabled(val) {
        this.setBooleanAttribute("disabled", val);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    set readOnly(value) {
        this.setBooleanAttribute("readonly", value);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    set template(value) {
        this.setBooleanAttribute("template", value);
    }

    get template() {
        return this.getBooleanAttribute("template");
    }

    static get observedAttributes() {
        return [
            "disabled",
            "readonly",
            "visualize",
            "template"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "visualize": {
                if (oldValue != newValue) {
                    const value = newValue != null && newValue != "false";
                    for (const ch of this.children) {
                        ch.visualize = value;
                    }
                }
            } break;
            case "disabled": {
                if (oldValue != newValue) {
                    if (this.draggable) {
                        this.setAttribute("draggable", "true");
                    } else {
                        this.removeAttribute("draggable");
                    }
                    const value = newValue != null && newValue != "false";
                    for (const ch of this.children) {
                        ch.disabled = value;
                    }
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    if (this.draggable) {
                        this.setAttribute("draggable", "true");
                    } else {
                        this.removeAttribute("draggable");
                    }
                    const value = this.readOnly;
                    for (const ch of this.children) {
                        ch.readOnly = value;
                    }
                }
            } break;
            case "template": {
                if (oldValue != newValue) {
                    if (this.draggable) {
                        this.setAttribute("draggable", "true");
                    } else {
                        this.removeAttribute("draggable");
                    }
                }
            } break;
        }
    }

    static registerReference(ref, clazz) {
        if (REG.has(ref)) {
            throw new Error(`reference ${ref} already exists`);
        }
        REG.set(ref, clazz);
    }

    static getReference(...refs) {
        for (const ref of refs) {
            if (REG.has(ref)) {
                return REG.get(ref);
            }
        }
        console.error("logic element not found for references", ...refs);
        return ErrorElement;
    }

    static buildLogic(logic) {
        if (typeof logic === "object" && !!logic) {
            if (Array.isArray(logic)) {
                return new ErrorElement();
            } else {
                let cl;
                if (logic.category) {
                    cl = AbstractElement.getReference(logic.category, logic.type);
                } else {
                    cl = AbstractElement.getReference(logic.type);
                }
                const node = new cl();
                node.loadLogic(logic);
                return node;
            }
        }
        return new (AbstractElement.getReference(`${logic}`));
    }

    static allowDrop(event) {
        const node = event.target.getRootNode().host;
        if (node.editable) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    static dropOnPlaceholder(event) {
        const nodes = DragDropMemory.get();
        if (nodes.length) {
            const node = nodes[0];
            if (!!node && node instanceof AbstractElement) {
                const ne = node.getElement(event.ctrlKey);
                if (ne) {
                    event.target.getRootNode().host.append(ne);
                    const slot = event.target.parentNode;
                    if (slot instanceof HTMLSlotElement && slot.name != null) {
                        ne.setAttribute("slot", slot.name);
                    } else {
                        ne.removeAttribute("slot");
                    }
                }
            }
        }
        DragDropMemory.clear();
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    checkValidity() {
        return true;
    }

    static getCalculationOptions(opts) {
        const {
            valueGetter,
            execute
        } = opts;
        const res = {...DEFAULT_LOGIC_CALCULATION_OPTS};
        if (typeof valueGetter === "function") {
            res.valueGetter = valueGetter;
        }
        if (typeof execute === "function") {
            res.execute = execute;
        }
        return res;
    }

}

class ErrorElement extends AbstractElement {

    #bodyEl;

    constructor() {
        super("ERROR: REFERENCE NOT FOUND");
        STYLE_ERROR.apply(this.shadowRoot);
        /* --- */
        this.#bodyEl = this.shadowRoot.getElementById("body");
    }

    getElement() {
        return this;
    }

    set logicResult(value) {
        super.logicResult = 0;
    }

    get logicResult() {
        return 0;
    }

    calculate() {
        super.logicResult = 0;
        return 0;
    }

    toJSON() {}

    loadLogic(logic) {
        this.#bodyEl.innerHTML = logic.type || "UNKNOWN TYPE";
    }

    checkValidity() {
        return false;
    }

}

customElements.define("emc-logic-error", ErrorElement);
