import {immute} from "@emcjs/core/data/Immutable.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {delimitFloat} from "@emcjs/core/util/helper/number/Float.js";
import CustomElement from "../../../../element/CustomElement.js";
import {zoomAtAnchor} from "../../../../../util/Zoom.js";
import TPL from "./ImageCropper.js.html" assert {type: "html"};
import STYLE from "./ImageCropper.js.css" assert {type: "css"};
import {isString} from "@emcjs/core/util/helper/CheckType.js";

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
const DEFAULT_CROP_SIZE = 300;
const ZOOM_SPEED = 0.001;

/* TODO finish implementing base functionalities
    - add image move operations
        - make mouse movements drag the image to focus on different parts of it
    - add resize operations (drag resize elements)
        - resize should change the image, not the crop boundaries
    - create canvas to print the resulting image on and deliver it as Blob/File
    - make mouse wheel zoom take specific fractions of the min max zoom to have specified zoom levels
        - e.g. create 10 zoom levels or zoom by 10px every turn
*/
/* TODO add optional features
    - add rotate image (both sides?)
    - add mirror image (both axes?)
*/
export default class ImageCropper extends CustomElement {

    #isDragging = false;

    #resizeState = RESIZE_STATES.NONE;

    #containerEl;

    #imageContainerEl;

    #imageEl;

    #maskEl;

    #resizeContainerEl;

    #maskRadius = null;

    #cropWidth = DEFAULT_CROP_SIZE;

    #cropHeight = DEFAULT_CROP_SIZE;

    #internalCropWidth = DEFAULT_CROP_SIZE;

    #internalCropHeight = DEFAULT_CROP_SIZE;

    #cropScale = 1;

    #internalWidth = 0;

    #internalHeight = 0;

    #internalScale = 1;

    #offsetX = 0;

    #offsetY = 0;

    #zoom = 1;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#imageContainerEl = this.shadowRoot.getElementById("image-container");
        this.#imageEl = this.shadowRoot.getElementById("image");
        this.#maskEl = this.shadowRoot.getElementById("mask");
        this.#resizeContainerEl = this.shadowRoot.getElementById("resize-container");
        /* --- */
        this.#containerEl.addEventListener("mousemove", (event) => {
            if (!this.#isDragging) {
                // update resize state
                const {
                    layerX,
                    layerY
                } = event;
                this.#refreshResizeState(layerX, layerY);
            } else if (this.#resizeState === RESIZE_STATES.NONE) {
                // move image
                const {
                    movementX,
                    movementY
                } = event;
                const newOffsetX = this.#offsetX + movementX;
                const newOffsetY = this.#offsetY + movementY;
                const [offsetX, offsetY] = this.#containBoundaries(newOffsetX, newOffsetY);
                this.#offsetX = offsetX;
                this.#offsetY = offsetY;
                this.#imageEl.style.setProperty("--offset-x", offsetX);
                this.#imageEl.style.setProperty("--offset-y", offsetY);
            } else {
                // resize
            }
        });
        this.#containerEl.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.#isDragging = true;
                this.#containerEl.classList.add("is-dragging");
            }
        });
        this.#containerEl.addEventListener("mouseup", (event) => {
            if (event.button === 0) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
            }
        });
        this.#containerEl.addEventListener("mouseenter", (event) => {
            if (this.#isDragging && !(event.buttons & 0x1)) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
            }
        });
        // zoom
        this.#containerEl.addEventListener("wheel", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.#isDragging) {
                const {
                    deltaY,
                    ctrlKey,
                    shiftKey
                } = event;
                const velocity = -deltaY * ZOOM_SPEED * (ctrlKey ? 100 : shiftKey ? 10 : 1);
                this.#applyZoom(this.#zoom + velocity);
            }
        });
        /* --- */
        this.#imageEl.addEventListener("load", () => {
            this.#internalWidth = this.#imageEl.naturalWidth;
            this.#internalHeight = this.#imageEl.naturalHeight;
            this.#updateInternalScale();
            this.#resetImage();
        });
    }

    set src(val) {
        this.setAttribute("src", val);
    }

    get src() {
        return this.getAttribute("src");
    }

    set maskRadius(val) {
        this.setAttribute("maskradius", val);
    }

    get maskRadius() {
        return this.getAttribute("maskradius");
    }

    set width(val) {
        this.setIntAttribute("width", val, 0);
    }

    get width() {
        return this.#cropWidth;
    }

    set height(val) {
        this.setIntAttribute("height", val, 0);
    }

    get height() {
        return this.#cropHeight;
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "src",
            "maskradius",
            "width",
            "height"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "src": {
                if (oldValue != newValue) {
                    this.#imageEl.src = newValue;
                }
            } break;
            case "maskradius": {
                if (oldValue != newValue) {
                    if (isString(newValue)) {
                        if (newValue.endsWith("%")) {
                            this.#maskEl.style.borderRadius = newValue;
                            this.#maskRadius = null;
                        } else {
                            this.#maskRadius = parseInt(newValue) || 0;
                            this.#updateMaskRadius();
                        }
                    } else {
                        this.#maskEl.style.borderRadius = "";
                        this.#maskRadius = null;
                    }
                }
            } break;
            case "width": {
                if (oldValue != newValue) {
                    this.#cropWidth = getCropSize(this.getIntAttribute("width"));
                    this.#updateCropSizes();
                }
            } break;
            case "height": {
                if (oldValue != newValue) {
                    this.#cropHeight = getCropSize(this.getIntAttribute("height"));
                    this.#updateCropSizes();
                }
            } break;
        }
    }

    #refreshResizeState(mousePosX, mousePosY) {
        const resizeTopStart = -RESIZE_TOLERANCE;
        const resizeTopEnd = RESIZE_TOLERANCE;

        const resizeBottomStart = this.#internalCropHeight - RESIZE_TOLERANCE;
        const resizeBottomEnd = this.#internalCropHeight + RESIZE_TOLERANCE;

        const resizeLeftStart = -RESIZE_TOLERANCE;
        const resizeLeftEnd = RESIZE_TOLERANCE;

        const resizeRightStart = this.#internalCropWidth - RESIZE_TOLERANCE;
        const resizeRightEnd = this.#internalCropWidth + RESIZE_TOLERANCE;

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

    #resetImage() {
        this.#offsetX = 0;
        this.#offsetY = 0;
        this.#zoom = this.#internalScale;
        this.#imageEl.style.setProperty("--offset-x", 0);
        this.#imageEl.style.setProperty("--offset-y", 0);
        this.#imageEl.style.setProperty("--zoom", this.#zoom);
    }

    #updateInternalScale() {
        const scaleWidth = this.#internalCropWidth / this.#internalWidth;
        const scaleHeight = this.#internalCropHeight / this.#internalHeight;
        if (scaleHeight > scaleWidth) {
            this.#internalScale = scaleHeight;
        } else {
            this.#internalScale = scaleWidth;
        }
    }

    #updateCropSizes = debounce(() => {
        // calculate sizes
        if (this.#cropHeight > this.#cropWidth) {
            this.#cropScale = DEFAULT_CROP_SIZE / this.#cropHeight;
        } else {
            this.#cropScale = DEFAULT_CROP_SIZE / this.#cropWidth;
        }
        /* if (this.#cropScale > 1) {
            this.#cropScale = 1;
        } */
        this.#internalCropWidth = this.#cropWidth * this.#cropScale;
        this.#internalCropHeight = this.#cropHeight * this.#cropScale;
        // update width
        const widthString = `${this.#internalCropWidth}px`;
        this.#imageContainerEl.style.width = widthString;
        this.#maskEl.style.width = widthString;
        this.#resizeContainerEl.style.width = widthString;
        // update height
        const heightString = `${this.#internalCropHeight}px`;
        this.#imageContainerEl.style.height = heightString;
        this.#maskEl.style.height = heightString;
        this.#resizeContainerEl.style.height = heightString;
        // reset image
        this.#updateMaskRadius();
        this.#updateInternalScale();
        this.#resetImage();
    });

    #updateMaskRadius() {
        this.#maskEl.style.borderRadius = `${this.#maskRadius * this.#cropScale}px`;
    }

    #containBoundaries(imagePosX, imagePosY) {
        const internalImageWidth = this.#internalWidth * this.#zoom;
        const internalImageHeight = this.#internalHeight * this.#zoom;
        // boundary
        const maxPanDistanceX = (internalImageWidth - this.#internalCropWidth) / 2;
        imagePosX = delimitBoundaryPosValue(imagePosX, maxPanDistanceX);
        const maxPanDistanceY = (internalImageHeight - this.#internalCropHeight) / 2;
        imagePosY = delimitBoundaryPosValue(imagePosY, maxPanDistanceY);

        return [imagePosX, imagePosY];
    }

    #applyZoom(zoom, anchorX = 0, anchorY = 0) {
        zoom = delimitFloat(zoom, this.#internalScale, this.#cropScale);
        if (this.#zoom != zoom) {
            const oldZoom = this.#zoom;
            this.#zoom = zoom;

            const [newX, newY] = zoomAtAnchor(oldZoom, zoom, {
                offset: [
                    this.#offsetX,
                    this.#offsetY
                ],
                anchor: [
                    anchorX,
                    anchorY
                ]
            });

            /* recalculate offsets to stay inside boundaries */
            const [offsetX, offsetY] = this.#containBoundaries(newX, newY, zoom);
            this.#offsetX = offsetX;
            this.#offsetY = offsetY;

            /* style */
            this.#imageEl.style.setProperty("--zoom", zoom);
            this.#imageEl.style.setProperty("--offset-x", offsetX);
            this.#imageEl.style.setProperty("--offset-y", offsetY);
        }
    }

}

customElements.define("emc-image-cropper", ImageCropper);

function getCropSize(value) {
    value = parseInt(value);
    if (isNaN(value)) {
        return DEFAULT_CROP_SIZE;
    }
    if (value < 0) {
        return 0;
    }
    return value;
}

function delimitBoundaryPosValue(posValue, maxDistance) {
    return Math.min(Math.max(-maxDistance, posValue), maxDistance);
}
