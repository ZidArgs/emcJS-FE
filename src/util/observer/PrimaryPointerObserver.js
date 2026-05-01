import {debounce} from "emcjs/util/Debouncer.js";
import PrimaryPointerEnum from "../../enum/devices/PrimaryPointerEnum.js";

const MEDIA_QUERY_POINTER_COARSE = "(pointer: coarse)";
const MEDIA_QUERY_POINTER_FINE = "(pointer: fine)";

const MEDIA_QUERY_HOVER_HOVER = "(hover: hover)";

class PrimaryPointerObserver extends EventTarget {

    #value = PrimaryPointerEnum.POINTER_DEVICE_NONE;

    #mediaPointerCoarse;

    #mediaPointerFine;

    #mediaHoverHover;

    constructor() {
        super();
        // ---
        this.#mediaPointerCoarse = window.matchMedia(MEDIA_QUERY_POINTER_COARSE);
        this.#mediaPointerFine = window.matchMedia(MEDIA_QUERY_POINTER_FINE);
        this.#mediaHoverHover = window.matchMedia(MEDIA_QUERY_HOVER_HOVER);
        // ---
        this.#mediaPointerCoarse.addEventListener("change", () => {
            this.#updateMediaValue();
        });
        this.#mediaPointerFine.addEventListener("change", () => {
            this.#updateMediaValue();
        });
        this.#mediaHoverHover.addEventListener("change", () => {
            this.#updateMediaValue();
        });
        // ---
        this.#updateMediaValue();
    }

    #updateMediaValue = debounce(() => {
        if (this.#mediaPointerCoarse.matches) {
            if (this.#mediaHoverHover.matches) {
                this.#setValue(PrimaryPointerEnum.POINTER_DEVICE_CONTROLLER);
            } else {
                this.#setValue(PrimaryPointerEnum.POINTER_DEVICE_FINGER);
            }
        } else if (this.#mediaPointerFine.matches) {
            if (this.#mediaHoverHover.matches) {
                this.#setValue(PrimaryPointerEnum.POINTER_DEVICE_MOUSE);
            } else {
                this.#setValue(PrimaryPointerEnum.POINTER_DEVICE_STYLUS);
            }
        } else {
            this.#setValue(PrimaryPointerEnum.POINTER_DEVICE_NONE);
        }
    });

    #setValue(value) {
        if (!value.equals(this.#value)) {
            this.#value = value;
            const event = new Event("change");
            event.value = value;
            this.dispatchEvent(event);
        }
    }

    get value() {
        return this.#value;
    }

}

export default new PrimaryPointerObserver();
