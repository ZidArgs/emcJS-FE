import {immute} from "@emcjs/core/data/Immutable.js";
import CustomElement from "../../../../element/CustomElement.js";
import TPL from "./ImageCropper.js.html" assert {type: "html"};
import STYLE from "./ImageCropper.js.css" assert {type: "css"};

const RESIZE_STATES = immute({
    NONE: null,
    RESIZE_LEFT: "l",
    RESIZE_RIGHT: "r",
    RESIZE_TOP: "t",
    RESIZE_BOTTOM: "b",
    RESIZE_TOP_LEFT: "tl",
    RESIZE_TOP_RIGHT: "tr",
    RESIZE_BOTTOM_RIGHT: "br",
    RESIZE_BOTTOM_LEFT: "bl"
});

const RESIZE_TOLERANCE = 10;

/* TODO finish implementing base functionalities
    - add image move operations
        - make mouse movements drag the image to focus on different parts of it
    - add resize operations
        - resize should change the image, not the crop boundaries
        - make the min value a property
    - create canvas to print the resulting image on and deliver it as Blob/File
*/
/* TODO add addvannced features
    - add properties to define crop width & height
    - add border radius for image-mask
*/
/* TODO add optional features
    - add rotate image (both sides?)
    - add mirror image (both axes?)
*/
export default class ImageCropper extends CustomElement {

    #isDragging = false;

    #resizeState = RESIZE_STATES.NONE;

    #containerEl;

    #imageEl;

    // #maskEl;

    #resizeContainerEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#imageEl = this.shadowRoot.getElementById("image");
        // this.#maskEl = this.shadowRoot.getElementById("mask");
        this.#resizeContainerEl = this.shadowRoot.getElementById("resize-container");
        /* --- */
        this.#containerEl.addEventListener("mousemove", (event) => {
            if (!this.#isDragging) {
                const {
                    layerX,
                    layerY
                } = event;
                this.#updateResize(layerX, layerY);
            }
        });
        this.#imageEl.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.#isDragging = true;
                this.#containerEl.classList.add("is-dragging");
            }
        });
        this.#imageEl.addEventListener("mouseup", (event) => {
            if (event.button === 0) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
            }
        });
        this.#imageEl.addEventListener("mouseenter", (event) => {
            if (this.#isDragging && !(event.buttons & 0x1)) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
            }
        });
    }

    set src(val) {
        this.setAttribute("src", val);
    }

    get src() {
        return this.getAttribute("src");
    }

    static get observedAttributes() {
        return ["src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src" && oldValue != newValue) {
            this.#imageEl.src = newValue;
        }
    }

    #updateResize(mousePosX, mousePosY) {
        // TODO get these beforehand during crop size adjustment
        const containerH = this.#resizeContainerEl.offsetHeight;
        const containerW = this.#resizeContainerEl.offsetWidth;

        const resizeTopStart = -RESIZE_TOLERANCE;
        const resizeTopEnd = RESIZE_TOLERANCE;

        const resizeBottomStart = containerH - RESIZE_TOLERANCE;
        const resizeBottomEnd = containerH + RESIZE_TOLERANCE;

        const resizeLeftStart = -RESIZE_TOLERANCE;
        const resizeLeftEnd = RESIZE_TOLERANCE;

        const resizeRightStart = containerW - RESIZE_TOLERANCE;
        const resizeRightEnd = containerW + RESIZE_TOLERANCE;

        if (mousePosX > resizeLeftStart && mousePosX < resizeLeftEnd) {
            if (mousePosY > resizeTopStart && mousePosY < resizeTopEnd) {
                // TOP LEFT CORNER
                this.#updateResizeState(RESIZE_STATES.RESIZE_TOP_LEFT);
            } else if (mousePosY > resizeBottomStart && mousePosY < resizeBottomEnd) {
                // BOTTOM LEFT CORNER
                this.#updateResizeState(RESIZE_STATES.RESIZE_BOTTOM_LEFT);
            } else if (mousePosY > resizeTopStart && mousePosY < resizeBottomEnd) {
                // LEFT EDGE
                this.#updateResizeState(RESIZE_STATES.RESIZE_LEFT);
            } else {
                // NONE
                this.#updateResizeState(RESIZE_STATES.NONE);
            }
        } else if (mousePosX > resizeRightStart && mousePosX < resizeRightEnd) {
            if (mousePosY > resizeTopStart && mousePosY < resizeTopEnd) {
                // TOP RIGHT CORNER
                this.#updateResizeState(RESIZE_STATES.RESIZE_TOP_RIGHT);
            } else if (mousePosY > resizeBottomStart && mousePosY < resizeBottomEnd) {
                // BOTTOM RIGHT CORNER
                this.#updateResizeState(RESIZE_STATES.RESIZE_BOTTOM_RIGHT);
            } else if (mousePosY > resizeTopStart && mousePosY < resizeBottomEnd) {
                // RIGHT EDGE
                this.#updateResizeState(RESIZE_STATES.RESIZE_RIGHT);
            } else {
                // NONE
                this.#updateResizeState(RESIZE_STATES.NONE);
            }
        } else if (mousePosX > resizeLeftStart && mousePosX < resizeRightEnd) {
            if (mousePosY > resizeTopStart && mousePosY < resizeTopEnd) {
                // TOP EDGE
                this.#updateResizeState(RESIZE_STATES.RESIZE_TOP);
            } else if (mousePosY > resizeBottomStart && mousePosY < resizeBottomEnd) {
                // BOTTOM EDGE
                this.#updateResizeState(RESIZE_STATES.RESIZE_BOTTOM);
            } else {
                // NONE
                this.#updateResizeState(RESIZE_STATES.NONE);
            }
        } else {
            // NONE
            this.#updateResizeState(RESIZE_STATES.NONE);
        }
    }

    #updateResizeState(value) {
        if (this.#resizeState !== value) {
            this.#resizeState = value;
            if (value != null) {
                this.#containerEl.setAttribute("resize", value);
            } else {
                this.#containerEl.removeAttribute("resize");
            }
        }
    }

}

customElements.define("emc-image-cropper", ImageCropper);
