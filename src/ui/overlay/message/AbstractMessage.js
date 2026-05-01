import CustomElement from "../../element/CustomElement.js";
import MessageLayer from "./MessageLayer.js";
import TPL from "./AbstractMessage.js.html" assert {type: "html"};
import STYLE from "./AbstractMessage.js.css" assert {type: "css"};

const ALLOWED_SLOTS = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right"
];

export default class AbstractMessage extends CustomElement {

    #textEl;

    constructor({text = "[text missing]"} = {}) {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#textEl = this.shadowRoot.getElementById("text");
        this.#textEl.innerHTML = text;
        /* --- */
        MessageLayer.append(this);
    }

    connectedCallback() {
        super.connectedCallback?.();
        if (!this.hasAttribute("slot")) {
            this.setAttribute("slot", this.constructor.defaultSlot);
        }
        if (!this.hasAttribute("role")) {
            this.setAttribute("role", "alert");
        }
    }

    set type(value) {
        this.setAttribute("type", value);
    }

    get type() {
        return this.getAttribute("type");
    }

    set slot(value) {
        this.setAttribute("slot", value);
    }

    get slot() {
        return this.getAttribute("slot");
    }

    static get observedAttributes() {
        return ["slot"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        if (name == "slot" && !ALLOWED_SLOTS.includes(newValue)) {
            this.setAttribute("slot", this.constructor.defaultSlot);
        }
    }

    static get defaultSlot() {
        return "bottom-center";
    }

    static show(params) {
        if (params != null) {
            if (typeof params == "object") {
                if (!Array.isArray(params)) {
                    const {
                        type = "", slot = this.defaultSlot, ...p
                    } = params;
                    const el = new this(p);
                    el.type = type;
                    el.slot = slot;
                    return el;
                } else {
                    throw new TypeError("Array is not a valid value");
                }
            }
            return new this({text: params});
        }
        return new this();
    }

    static success(params) {
        if (typeof params == "object") {
            if (!Array.isArray(params)) {
                return this.show({
                    ...params,
                    type: "success"
                });
            } else {
                throw new TypeError("Array is not a valid value");
            }
        } else {
            return this.show({
                text: params,
                type: "success"
            });
        }
    }

    static info(params) {
        if (typeof params == "object") {
            if (!Array.isArray(params)) {
                return this.show({
                    ...params,
                    type: "info"
                });
            } else {
                throw new TypeError("Array is not a valid value");
            }
        } else {
            return this.show({
                text: params,
                type: "info"
            });
        }
    }

    static warn(params) {
        if (typeof params == "object") {
            if (!Array.isArray(params)) {
                return this.show({
                    ...params,
                    type: "warning"
                });
            } else {
                throw new TypeError("Array is not a valid value");
            }
        } else {
            return this.show({
                text: params,
                type: "warning"
            });
        }
    }

    static error(params) {
        if (typeof params == "object") {
            if (!Array.isArray(params)) {
                return this.show({
                    ...params,
                    type: "error"
                });
            } else {
                throw new TypeError("Array is not a valid value");
            }
        } else {
            return this.show({
                text: params,
                type: "error"
            });
        }
    }

}
