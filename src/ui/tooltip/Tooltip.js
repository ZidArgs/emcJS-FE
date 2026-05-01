import CustomElement from "../element/CustomElement.js";
import TooltipLayer from "./TooltipLayer.js";
import TPL from "./Tooltip.js.html" assert {type: "html"};
import STYLE from "./Tooltip.js.css" assert {type: "css"};

const LAYER_MARGIN = 5;
const TOOLTIP_MARGIN = 5;

export default class Tooltip extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    connectedCallback() {
        if (!this.hasAttribute("slot")) {
            this.setAttribute("slot", "tooltip");
        }
    }

    static get observedAttributes() {
        return ["slot"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "slot" && newValue != "tooltip") {
            this.setAttribute("slot", "tooltip");
        }
    }

    get position() {
        return this.getAttribute("position");
    }

    set position(val) {
        this.setAttribute("position", val);
    }

    get active() {
        const val = this.getAttribute("active");
        return !!val && val != "false";
    }

    set active(val) {
        this.setAttribute("active", val);
    }

    show(/* target */) {
        if (!this.active) {
            this.active = true;
        }
        /* --- */
        let posX = 0;
        let posY = 0;
        const pRect = TooltipLayer.getNextLayerBounds(this);
        // const tRect = target.getBoundingClientRect();

        // TODO calcualte position
        posX = pRect.left + LAYER_MARGIN + TOOLTIP_MARGIN;
        posY = pRect.top + LAYER_MARGIN + TOOLTIP_MARGIN;

        // TODO calculate tooltip bound pointer
        this.setAttribute("position", "topleft");

        this.style.left = `${posX}px`;
        this.style.top = `${posY}px`;
        setTimeout(() => {
            this.initFocus();
        }, 0);
    }

    // TODO rename all close functions to hide?
    close() {
        if (this.active) {
            this.active = false;
        }
        /* --- */
        this.style.left = `${LAYER_MARGIN}px`;
        this.style.top = `${LAYER_MARGIN}px`;
    }

}

customElements.define("emc-tooltip", Tooltip);
