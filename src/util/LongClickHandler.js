import EventTargetManager from "emcjs/util/event/EventTargetManager.js";

const INSTANCES = new WeakMap();

export default class LongClickHandler {

    #mousePressed = false;

    #timeout;

    #targetEl;

    #eventTargetManager;

    constructor(node, active) {
        if (INSTANCES.has(node)) {
            return INSTANCES.get(node);
        }
        INSTANCES.set(node, this);
        this.#targetEl = node;
        this.#eventTargetManager = new EventTargetManager(node, active);
        this.#eventTargetManager.set("mousedown", (event) => {
            if (event.button === 0) {
                this.#mousePressed = true;
                this.#callMousePressed();
                this.#timeout = setTimeout(() => {
                    this.#timeout = null;
                    if (this.#mousePressed) {
                        this.#loopMousePressed();
                    }
                }, 1000);
            }
        });
        this.#eventTargetManager.set("mouseup", (event) => {
            if (event.button === 0) {
                clearTimeout(this.#timeout);
                this.#timeout = null;
                this.#mousePressed = false;
            }
        });
        this.#eventTargetManager.set("mouseleave", () => {
            clearTimeout(this.#timeout);
            this.#timeout = null;
            this.#mousePressed = false;
        });
    }

    set active(value) {
        this.#eventTargetManager.active = value;
    }

    get active() {
        return this.#eventTargetManager.active;
    }

    #loopMousePressed() {
        if (this.#mousePressed) {
            this.#callMousePressed();
            this.#timeout = setTimeout(() => {
                this.#timeout = null;
                if (this.#mousePressed) {
                    this.#loopMousePressed();
                }
            }, 100);
        }
    }

    #callMousePressed() {
        this.#targetEl.dispatchEvent(new Event("mousepressed", {
            bubbles: true,
            cancelable: true
        }));
    }

}
