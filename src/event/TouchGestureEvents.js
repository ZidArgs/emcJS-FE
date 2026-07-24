import Vector2D from "@emcjs/core/data/Vector2D.js";
import {isNull} from "@emcjs/core/util/helper/CheckType.js";

class TouchGestureEvents {

    #touchCache = new Map();

    #target;

    #eventHandlers;

    constructor(target) {
        if (target != null && !(target instanceof EventTarget)) {
            throw new TypeError("target must be an instance of EventTarget or null");
        }
        this.#eventHandlers = {
            touchStart: (event) => {
                this.touchStart(event);
            },
            touchMove: (event) => {
                this.touchMove(event);
            },
            touchEnd: (event) => {
                this.touchEnd(event);
            }
        };
        this.#setTarget(target);
    }

    switchTarget(target) {
        if (target != null && !(target instanceof EventTarget)) {
            throw new TypeError("target must be an instance of EventTarget or null");
        }
        this.#removeEventListeners();
        this.#setTarget(target);
    }

    #setTarget(target) {
        if (target != null) {
            this.#target = new WeakRef(target);
            this.#addEventListeners();
        } else {
            this.#target = null;
        }
    }

    #addEventListeners() {
        const target = this.#target?.deref();
        if (target != null) {
            target.addEventListener("touchstart", this.#eventHandlers.touchStart);
            target.addEventListener("touchmove", this.#eventHandlers.touchMove);
            target.addEventListener("touchend", this.#eventHandlers.touchEnd);
            target.addEventListener("touchcancel", this.#eventHandlers.touchEnd);
        }
    }

    #removeEventListeners() {
        const target = this.#target?.deref();
        if (target != null) {
            target.removeEventListener("touchstart", this.#eventHandlers.touchStart);
            target.removeEventListener("touchmove", this.#eventHandlers.touchMove);
            target.removeEventListener("touchend", this.#eventHandlers.touchEnd);
            target.removeEventListener("touchcancel", this.#eventHandlers.touchEnd);
        }
    }

    touchStart(event) {
        if (event.cancelable) {
            event.preventDefault();
            for (const touch of event.changedTouches) {
                this.#touchCache.set(touch.identifier, touch);
            }
        }
    }

    touchMove(event) {
        if (event.cancelable) {
            event.preventDefault();
            if (event.changedTouches.length > 0) {
                this.#handlePan(event);
                this.#handlePinch(event);
                for (const touch of event.changedTouches) {
                    this.#touchCache.set(touch.identifier, touch);
                }
            }
        }
    }

    touchEnd(event) {
        if (event.cancelable) {
            event.preventDefault();
        }
        for (const touch of event.changedTouches) {
            this.#touchCache.delete(touch.identifier);
        }
    }

    #handlePan(event) {
        const target = this.#target?.deref();
        if (target != null) {
            const [centerX, centerY] = this.#getTouchCenter(event);
            const [deltaX, deltaY] = this.#getTouchDelta(event);

            const ev = new Event("touchpan");
            ev.centerX = centerX;
            ev.centerY = centerY;
            ev.deltaX = deltaX;
            ev.deltaY = deltaY;
            ev.touchCount = event.targetTouches.length;
            target.dispatchEvent(ev);
        }
    }

    #handlePinch(event) {
        const target = this.#target?.deref();
        if (target != null) {
            if (event.targetTouches.length === 2) {
                const newPoint1 = event.targetTouches[0];
                const newPoint2 = event.targetTouches[1];

                const oldPoint1 = this.#touchCache.get(newPoint1.identifier);
                const oldPoint2 = this.#touchCache.get(newPoint2.identifier);

                if (!isNull(oldPoint1) && !isNull(oldPoint2)) {
                    const oldVector1 = new Vector2D(oldPoint1.clientX, oldPoint1.clientY);
                    const oldVector2 = new Vector2D(oldPoint2.clientX, oldPoint2.clientY);
                    const oldDistance = oldVector1.distanceTo(oldVector2);

                    const newVector1 = new Vector2D(newPoint1.clientX, newPoint1.clientY);
                    const newVector2 = new Vector2D(newPoint2.clientX, newPoint2.clientY);
                    const newDistance = newVector1.distanceTo(newVector2);

                    if (oldDistance !== newDistance) {
                        const ev = new Event("touchpinch");
                        ev.centerX = (newPoint1.clientX + newPoint2.clientX) / 2;
                        ev.centerY = (newPoint1.clientY + newPoint2.clientY) / 2;
                        ev.deltaDist = newDistance - oldDistance;
                        target.dispatchEvent(ev);
                    }
                }
            }
        }
    }

    #getTouchCenter(event) {
        const result = [0, 0];
        const count = event.targetTouches.length;
        for (const touch of event.targetTouches) {
            result[0] += touch.clientX;
            result[1] += touch.clientY;
        }
        return [result[0] / count, result[1] / count];
    }

    #getTouchDelta(event) {
        const result = [0, 0];
        const count = event.changedTouches.length;
        for (const touch of event.changedTouches) {
            const oldTouch = this.#touchCache.get(touch.identifier);
            result[0] += touch.clientX - oldTouch.clientX;
            result[1] += touch.clientY - oldTouch.clientY;
        }
        return [result[0] / count, result[1] / count];
    }

}

const touchGestureEventCache = new WeakMap();

export function registerTouchGestures(target) {
    if (target != null && !(target instanceof EventTarget)) {
        throw new TypeError("target must be an instance of EventTarget or null");
    }
    touchGestureEventCache.set(target, new TouchGestureEvents(target));
}

export function unregisterTouchGestures(target) {
    if (target != null && !(target instanceof EventTarget)) {
        throw new TypeError("target must be an instance of EventTarget or null");
    }
    const touchGestureEvents = touchGestureEventCache.get(target);
    if (touchGestureEvents != null) {
        touchGestureEvents.switchTarget();
        touchGestureEventCache.delete(target);
    }
}
