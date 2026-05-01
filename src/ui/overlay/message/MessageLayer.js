import CustomElement from "../../element/CustomElement.js";
import TPL from "./MessageLayer.js.html" assert {type: "html"};
import STYLE from "./MessageLayer.js.css" assert {type: "css"};

const LAYER = new Map();
let DEFAULT = null;

export default class MessageLayer extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        if (DEFAULT == null) {
            DEFAULT = this;
        }
    }

    set name(value) {
        this.setAttribute("name", value);
    }

    get name() {
        return this.getAttribute("name");
    }

    static get observedAttributes() {
        return ["name"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "name" && newValue != oldValue) {
            if (LAYER.has(newValue)) {
                throw new Error(`MessageLayer with name "${name}" already exists`);
            }
            LAYER.set(newValue, this);
            if (LAYER.has(oldValue)) {
                LAYER.delete(oldValue);
            }
        }
    }

    setDefault() {
        DEFAULT = this;
    }

    static setDefault(name) {
        if (LAYER.has(name)) {
            DEFAULT = LAYER.get(name);
        }
    }

    static getDefault() {
        return DEFAULT;
    }

    static getLayer(name) {
        return LAYER.get(name);
    }

    static hasLayer(name) {
        return LAYER.has(name);
    }

    static append(element, layer) {
        if (!!layer && MessageLayer.hasLayer(layer)) {
            MessageLayer.getLayer(layer).append(element);
        } else if (DEFAULT != null) {
            DEFAULT.append(element);
        } else {
            document.body.append(element);
        }
    }

}

customElements.define("emc-message-layer", MessageLayer);
