import {immute} from "@emcjs/core/data/Immutable.js";
import Vector2D from "@emcjs/core/data/Vector2D.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {isString} from "@emcjs/core/util/helper/CheckType.js";
import {delimitFloat} from "@emcjs/core/util/helper/number/Float.js";
import MoveDelta2D from "@emcjs/core/util/MoveDelta2D.js";
import {registerTouchGestures} from "../../../../../event/TouchGestureEvents.js";
import {zoomAtAnchor} from "../../../../../util/Zoom.js";
import CustomElement from "../../../../element/CustomElement.js";
import STYLE from "./ImageCropper.js.css" assert { type: "css" };
import TPL from "./ImageCropper.js.html" assert { type: "html" };

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

// defaults
const MIN_WIDTH = 200;
const MIN_HEIGTH = 200;
const CROP_MIN_MARGIN = 50;
const RESIZE_AREA_TOLERANCE = 10;
const ZOOM_SPEED_WHEEL = 0.001;
const ZOOM_SPEED_MOUSE = 0.01;
const ZOOM_SPEED_TOUCH = 0.01;
const ANGLE_THRESHOLD = 20;

// calculated
const CROP_DEFAULT_WIDTH = MIN_WIDTH - CROP_MIN_MARGIN * 2;
const CROP_DEFAULT_HEIGTH = MIN_HEIGTH - CROP_MIN_MARGIN * 2;

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

    #targetCropWidth = CROP_DEFAULT_WIDTH;

    #targetCropHeight = CROP_DEFAULT_HEIGTH;

    #cropWidth = CROP_DEFAULT_WIDTH;

    #cropHeight = CROP_DEFAULT_HEIGTH;

    #internalCropWidth = CROP_DEFAULT_WIDTH;

    #internalCropHeight = CROP_DEFAULT_HEIGTH;

    #cropScale = 1;

    #internalWidth = 0;

    #internalHeight = 0;

    #internalScale = 1;

    #offsetX = 0;

    #offsetY = 0;

    #zoom = 1;

    #mouseMoveDelta = new MoveDelta2D();

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
        registerTouchGestures(this.#containerEl);
        this.#containerEl.addEventListener("mousemove", (event) => {
            if (!this.#isDragging) {
                // update resize state
                const {
                    layerX,
                    layerY
                } = event;
                const posX = layerX - (this.clientWidth - this.#internalCropWidth) / 2;
                const posY = layerY - (this.clientHeight - this.#internalCropHeight) / 2;
                this.#refreshResizeState(posX, posY);
            } else {
                const {
                    clientX,
                    clientY
                } = event;
                this.#mouseMoveDelta.moveTo(clientX, clientY);
            }
        });
        this.#containerEl.addEventListener("mousedown", (event) => {
            if (!this.#isDragging && event.button === 0) {
                this.#isDragging = true;
                this.#containerEl.classList.add("is-dragging");
                const {
                    clientX,
                    clientY
                } = event;
                this.#mouseMoveDelta.startAt(clientX, clientY);
            }
        });
        this.#containerEl.addEventListener("mouseup", (event) => {
            if (this.#isDragging && event.button === 0) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
                const {
                    clientX,
                    clientY
                } = event;
                this.#mouseMoveDelta.stopAt(clientX, clientY);
            }
        });
        this.#containerEl.addEventListener("mouseenter", (event) => {
            if (this.#isDragging && !(event.buttons & 0x1)) {
                this.#isDragging = false;
                this.#containerEl.classList.remove("is-dragging");
                this.#mouseMoveDelta.stop();
            }
        });
        this.#containerEl.addEventListener("wheel", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.#isDragging) {
                const {deltaY} = event;
                const velocity = -deltaY * ZOOM_SPEED_WHEEL;
                const factor = Math.exp(velocity);
                this.#applyZoom(this.#zoom * factor);
            }
        });
        this.#mouseMoveDelta.addEventListener("delta", (event) => {
            const {
                deltaX,
                deltaY
            } = event;
            this.#handleMouseMove(deltaX, deltaY);
        });
        this.#resizeContainerEl.addEventListener("keydown", (event) => {
            const {
                target,
                code
            } = event;
            const corner = target.dataset.corner;
            switch (code) {
                case "ArrowDown": {
                    this.#handleKeyboardZoom(corner, 0, 1);
                } break;
                case "ArrowUp": {
                    this.#handleKeyboardZoom(corner, 0, -1);
                } break;
                case "ArrowLeft": {
                    this.#handleKeyboardZoom(corner, -1, 0);
                } break;
                case "ArrowRight": {
                    this.#handleKeyboardZoom(corner, 1, 0);
                } break;
            }
        });
        this.#containerEl.addEventListener("touchpan", (event) => {
            if (event.touchCount === 1) {
                const {
                    deltaX,
                    deltaY
                } = event;
                this.#handleMouseMove(deltaX, deltaY);
            }
        });
        this.#containerEl.addEventListener("touchpinch", (event) => {
            const {deltaDist} = event;
            const velocity = deltaDist * ZOOM_SPEED_TOUCH;
            const factor = Math.exp(velocity);
            this.#applyZoom(this.#zoom * factor);
        });
        /* --- */
        this.#imageEl.addEventListener("load", () => {
            this.#internalWidth = this.#imageEl.naturalWidth;
            this.#internalHeight = this.#imageEl.naturalHeight;
            this.#updateInternalScale();
            this.reset();

            this.dispatchEvent(new Event("load", {bubbles: true}));
        });
        /* --- */
        new ResizeObserver(() => {
            this.#resizeCropArea();
        }).observe(this);
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#resizeCropArea();
    }

    #resizeCropArea() {
        this.#targetCropWidth = this.clientWidth - CROP_MIN_MARGIN * 2;
        this.#targetCropHeight = this.clientHeight - CROP_MIN_MARGIN * 2;
        this.#updateCropSizes();
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

    set cropWidth(val) {
        this.setIntAttribute("cropwidth", val, 0);
    }

    get cropWidth() {
        return this.#cropWidth;
    }

    set cropHeight(val) {
        this.setIntAttribute("cropheight", val, 0);
    }

    get cropHeight() {
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
                        this.#maskEl.style.borderRadius = newValue;
                    } else {
                        this.#maskEl.style.borderRadius = "";
                    }
                }
            } break;
            case "width": {
                if (oldValue != newValue) {
                    this.#cropWidth = getCropSize(this.getIntAttribute("width"), this.#targetCropWidth);
                    this.#updateCropSizes();
                }
            } break;
            case "height": {
                if (oldValue != newValue) {
                    this.#cropHeight = getCropSize(this.getIntAttribute("height"), this.#targetCropHeight);
                    this.#updateCropSizes();
                }
            } break;
        }
    }

    #refreshResizeState(mousePosX, mousePosY) {
        const resizeTopStart = -RESIZE_AREA_TOLERANCE;
        const resizeTopEnd = RESIZE_AREA_TOLERANCE;

        const resizeBottomStart = this.#internalCropHeight - RESIZE_AREA_TOLERANCE;
        const resizeBottomEnd = this.#internalCropHeight + RESIZE_AREA_TOLERANCE;

        const resizeLeftStart = -RESIZE_AREA_TOLERANCE;
        const resizeLeftEnd = RESIZE_AREA_TOLERANCE;

        const resizeRightStart = this.#internalCropWidth - RESIZE_AREA_TOLERANCE;
        const resizeRightEnd = this.#internalCropWidth + RESIZE_AREA_TOLERANCE;

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

    reset() {
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
        const scaleH = this.#targetCropHeight / this.#cropHeight;
        const scaleW = this.#targetCropWidth / this.#cropWidth;
        if (scaleH < scaleW) {
            this.#cropScale = scaleH;
        } else {
            this.#cropScale = scaleW;
        }
        this.#containerEl.style.setProperty("--crop-scale", this.#cropScale);
        this.#internalCropWidth = this.#cropWidth * this.#cropScale;
        this.#internalCropHeight = this.#cropHeight * this.#cropScale;
        // update width
        const widthString = `${this.#cropWidth}px`;
        this.#imageContainerEl.style.width = widthString;
        this.#maskEl.style.width = widthString;
        this.#resizeContainerEl.style.width = widthString;
        // update height
        const heightString = `${this.#cropHeight}px`;
        this.#imageContainerEl.style.height = heightString;
        this.#maskEl.style.height = heightString;
        this.#resizeContainerEl.style.height = heightString;
        // rescale image
        const oldInternalScale = this.#internalScale;
        this.#updateInternalScale();
        if (oldInternalScale !== this.#internalScale) {
            const scale = this.#internalScale / oldInternalScale;
            this.#applyZoom(this.#zoom * scale);
        }
    });

    #handleMouseMove(movementX, movementY) {
        switch (this.#resizeState) {
            case RESIZE_STATES.NONE: {
                // move image
                const newOffsetX = this.#offsetX + movementX;
                const newOffsetY = this.#offsetY + movementY;
                this.#applyPan(newOffsetX, newOffsetY);
            } break;
            case RESIZE_STATES.RESIZE_LEFT: {
                const velocity = movementX * ZOOM_SPEED_MOUSE;
                const factor = Math.exp(velocity);
                this.#applyZoom(this.#zoom * factor, this.#internalCropWidth / 2, 0);
            } break;
            case RESIZE_STATES.RESIZE_TOP: {
                const velocity = movementY * ZOOM_SPEED_MOUSE;
                const factor = Math.exp(velocity);
                this.#applyZoom(this.#zoom * factor, 0, this.#internalCropHeight / 2);
            } break;
            case RESIZE_STATES.RESIZE_RIGHT: {
                const velocity = -movementX * ZOOM_SPEED_MOUSE;
                const factor = Math.exp(velocity);
                this.#applyZoom(this.#zoom * factor, -this.#internalCropWidth / 2, 0);
            } break;
            case RESIZE_STATES.RESIZE_BOTTOM: {
                const velocity = -movementY * ZOOM_SPEED_MOUSE;
                const factor = Math.exp(velocity);
                this.#applyZoom(this.#zoom * factor, 0, -this.#internalCropHeight / 2);
            } break;
            case RESIZE_STATES.RESIZE_TOP_LEFT: {
                const zoomVector = new Vector2D(movementX, movementY);
                const velocity = zoomVector.length * ZOOM_SPEED_MOUSE;
                const relativeAngle = (zoomVector.angle + 225) % 360 - 180;
                const absAngle = Math.abs(relativeAngle);
                if (absAngle > ANGLE_THRESHOLD && absAngle < 180 - ANGLE_THRESHOLD) {
                    const factor = Math.exp(velocity);
                    const directionalFactor = relativeAngle > 0 ? factor : 1 / factor;
                    this.#applyZoom(this.#zoom * directionalFactor, this.#internalCropWidth / 2, this.#internalCropHeight / 2);
                }
            } break;
            case RESIZE_STATES.RESIZE_TOP_RIGHT: {
                const zoomVector = new Vector2D(movementX, movementY);
                const velocity = zoomVector.length * ZOOM_SPEED_MOUSE;
                const relativeAngle = (zoomVector.angle + 315) % 360 - 180;
                const absAngle = Math.abs(relativeAngle);
                if (absAngle > ANGLE_THRESHOLD && absAngle < 180 - ANGLE_THRESHOLD) {
                    const factor = Math.exp(velocity);
                    const directionalFactor = relativeAngle > 0 ? 1 / factor : factor;
                    this.#applyZoom(this.#zoom * directionalFactor, -this.#internalCropWidth / 2, this.#internalCropHeight / 2);
                }
            } break;
            case RESIZE_STATES.RESIZE_BOTTOM_RIGHT: {
                const zoomVector = new Vector2D(movementX, movementY);
                const velocity = zoomVector.length * ZOOM_SPEED_MOUSE;
                const relativeAngle = (zoomVector.angle + 45) % 360 - 180;
                const absAngle = Math.abs(relativeAngle);
                if (absAngle > ANGLE_THRESHOLD && absAngle < 180 - ANGLE_THRESHOLD) {
                    const factor = Math.exp(velocity);
                    const directionalFactor = relativeAngle > 0 ? factor : 1 / factor;
                    this.#applyZoom(this.#zoom * directionalFactor, -this.#internalCropWidth / 2, -this.#internalCropHeight / 2);
                }
            } break;
            case RESIZE_STATES.RESIZE_BOTTOM_LEFT: {
                const zoomVector = new Vector2D(movementX, movementY);
                const velocity = zoomVector.length * ZOOM_SPEED_MOUSE;
                const relativeAngle = (zoomVector.angle + 135) % 360 - 180;
                const absAngle = Math.abs(relativeAngle);
                if (absAngle > ANGLE_THRESHOLD && absAngle < 180 - ANGLE_THRESHOLD) {
                    const factor = Math.exp(velocity);
                    const directionalFactor = relativeAngle > 0 ? 1 / factor : factor;
                    this.#applyZoom(this.#zoom * directionalFactor, this.#internalCropWidth / 2, -this.#internalCropHeight / 2);
                }
            } break;
        }
    }

    #handleKeyboardZoom(corner, movementX, movementY) {
        if (movementX !== 0) {
            switch (corner) {
                case RESIZE_STATES.RESIZE_TOP_LEFT:
                case RESIZE_STATES.RESIZE_BOTTOM_LEFT: {
                    const direction = movementX > 0 ? 1 : -1;
                    this.#applyZoom(this.#zoom + direction * ZOOM_SPEED_WHEEL, this.#internalCropWidth / 2, 0);
                } break;
                case RESIZE_STATES.RESIZE_TOP_RIGHT:
                case RESIZE_STATES.RESIZE_BOTTOM_RIGHT: {
                    const direction = movementX > 0 ? -1 : 1;
                    this.#applyZoom(this.#zoom + direction * ZOOM_SPEED_WHEEL, -this.#internalCropWidth / 2, 0);
                } break;
            }
        } else if (movementY !== 0) {
            switch (corner) {
                case RESIZE_STATES.RESIZE_TOP_LEFT:
                case RESIZE_STATES.RESIZE_TOP_RIGHT: {
                    const direction = movementY > 0 ? 1 : -1;
                    this.#applyZoom(this.#zoom + direction * ZOOM_SPEED_WHEEL, 0, this.#internalCropHeight / 2);
                } break;
                case RESIZE_STATES.RESIZE_BOTTOM_RIGHT:
                case RESIZE_STATES.RESIZE_BOTTOM_LEFT: {
                    const direction = movementY > 0 ? -1 : 1;
                    this.#applyZoom(this.#zoom + direction * ZOOM_SPEED_WHEEL, 0, -this.#internalCropHeight / 2);
                } break;
            }
        }
    }

    #applyPan(offsetX, offsetY) {
        if (this.#offsetX != offsetX || this.#offsetY != offsetY) {
            const [newOffsetX, newOffsetY] = this.#containBoundaries(offsetX, offsetY);
            this.#offsetX = newOffsetX;
            this.#offsetY = newOffsetY;
            this.#imageEl.style.setProperty("--offset-x", newOffsetX);
            this.#imageEl.style.setProperty("--offset-y", newOffsetY);
            this.#notifyChange();
        }
    }

    #applyZoom(zoom, anchorX = 0, anchorY = 0) {
        zoom = delimitFloat(zoom, this.#internalScale, this.#cropScale);
        if (this.#zoom != zoom) {
            const oldZoom = this.#zoom;
            this.#zoom = zoom;

            const [newOffsetX, newOffsetY] = zoomAtAnchor(oldZoom, zoom, {
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
            const [offsetX, offsetY] = this.#containBoundaries(newOffsetX, newOffsetY, zoom);
            this.#offsetX = offsetX;
            this.#offsetY = offsetY;

            /* style */
            this.#imageEl.style.setProperty("--zoom", zoom);
            this.#imageEl.style.setProperty("--offset-x", offsetX);
            this.#imageEl.style.setProperty("--offset-y", offsetY);
            this.#notifyChange();
        }
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

    #notifyChange = debounce(() => {
        const ev = new Event("change", {bubbles: true});
        ev.zoom = this.#zoom;
        ev.x = this.#offsetX;
        ev.y = this.#offsetY;
        this.dispatchEvent(ev);
    });

    async toBlob(options) {
        const canvasEl = new OffscreenCanvas(this.#cropWidth, this.#cropHeight);
        this.renderToCanvas(canvasEl);
        return await canvasEl.convertToBlob(options);
    }

    renderToCanvas(canvasEl) {
        if (!(canvasEl instanceof HTMLCanvasElement || canvasEl instanceof OffscreenCanvas)) {
            throw new TypeError("canvasEl has to be an instance of HTMLCanvasElement or OffscreenCanvas");
        }
        const context = canvasEl.getContext("2d");

        const croppedImageWidth = this.#internalCropWidth / this.#zoom;
        const croppedImageHeight = this.#internalCropHeight / this.#zoom;

        const zoomedImageWidth = this.#internalWidth * this.#zoom;
        const zoomedImageHeight = this.#internalHeight * this.#zoom;
        const croppedImageLeft = (this.#internalCropWidth - zoomedImageWidth) / 2;
        const croppedImageTop = (this.#internalCropHeight - zoomedImageHeight) / 2;

        const left = -(this.#offsetX + croppedImageLeft) / this.#zoom;
        const top = -(this.#offsetY + croppedImageTop) / this.#zoom;

        context.drawImage(this.#imageEl, left, top, croppedImageWidth, croppedImageHeight, 0, 0, canvasEl.width, canvasEl.height);
    }

}

customElements.define("emc-image-cropper", ImageCropper);

function getCropSize(value, defValue) {
    value = parseInt(value);
    if (isNaN(value)) {
        return defValue;
    }
    if (value < 0) {
        return 0;
    }
    return value;
}

function delimitBoundaryPosValue(posValue, maxDistance) {
    return Math.min(Math.max(-maxDistance, posValue), maxDistance);
}
