import {debounce} from "@emcjs/core/util/Debouncer.js";
import CustomElement from "../element/CustomElement.js";
import BubbleLayer from "./BubbleLayer.js";
import TPL from "./Bubble.js.html" assert {type: "html"};
import STYLE from "./Bubble.js.css" assert {type: "css"};

const POSITIONS = [
    "topleft",
    "top",
    "topright",
    "right",
    "bottomright",
    "bottom",
    "bottomleft",
    "left"
];

const OFFSET_MARGIN = 0.3;

export default class Bubble extends CustomElement {

    #contentEl;

    #refNode;

    #viewportNode;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
    }

    connectedCallback() {
        this.#refNode = this.#findRefNode();
        this.#viewportNode = BubbleLayer.findNextLayer(this);
        this.refreshTooltipPosition();
    }

    get refNode() {
        return this.#refNode;
    }

    get viewportNode() {
        return this.#viewportNode;
    }

    set position(val) {
        this.setEnumAttribute("position", val, POSITIONS);
    }

    get position() {
        return this.getEnumAttribute("position");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "position"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.();
        switch (name) {
            case "position": {
                if (oldValue != newValue) {
                    if (POSITIONS.includes(newValue)) {
                        this.#contentEl.setAttribute("position", newValue || "top");
                    } else {
                        this.refreshTooltipPosition();
                    }
                }
            } break;
        }
    }

    refreshTooltipPosition = debounce(() => {
        if (this.position == null) {
            const refRect = this.#refNode.getBoundingClientRect();
            const viewportRect = this.#viewportNode.getBoundingClientRect();

            const posX = refRect.x + refRect.width / 2 - viewportRect.x;
            const posY = refRect.y + refRect.height / 2 - viewportRect.y;

            const mapW = viewportRect.width;
            const mapH = viewportRect.height;

            const leftP = posX / mapW;
            const topP = posY / mapH;

            let tooltip = "";
            if (topP < OFFSET_MARGIN) {
                tooltip = "bottom";
            } else if (topP > 1 - OFFSET_MARGIN) {
                tooltip = "top";
            }
            if (leftP < OFFSET_MARGIN) {
                tooltip += "right";
            } else if (leftP > 1 - OFFSET_MARGIN) {
                tooltip += "left";
            }
            this.#contentEl.setAttribute("position", tooltip || "top");
        }
    });

    #findRefNode() {
        return this.assignedSlot ?? this.parentElement ?? this.getRootNode().host ?? document.body;
    }

}

customElements.define("emc-bubble", Bubble);
