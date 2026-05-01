/**
 * Polyfill for contextmenu on WebKit (iOS)
 * ---------------------------------------------------------
 * Why ever Apple won't implement the "contextmenu"-event on iOS
 *
 * @author ZidArgs
 */

const EVENT_NAME = "contextmenu";
const ON_EVENT_NAME = `on${EVENT_NAME}`;

const isOnContextmenuSupported = (() => {
    const el = document.createElement("div");
    const isSupported = ON_EVENT_NAME in el;
    if (!isSupported) {
        el.setAttribute(ON_EVENT_NAME, "return;");
        return typeof el[ON_EVENT_NAME] === "function";
    }
    return isSupported;
})();

if (!isOnContextmenuSupported) {
    const CONTEXTMENU_DEBOUCE = 1000;
    const TIMERS = new WeakMap();
    const ADD_EVENT_LISTENER = HTMLElement.prototype.addEventListener;
    const SET_ATTRIBUTE = HTMLElement.prototype.setAttribute;
    const REMOVE_ATTRIBUTE = HTMLElement.prototype.removeAttribute;
    const ONCONTEXTMENU = new WeakMap();
    const REGISTERED = new WeakMap();

    const startTouch = function(event) {
        const el = event.currentTarget;
        ADD_EVENT_LISTENER.call(el, "touchend", endTouch, {passive: true});
        ADD_EVENT_LISTENER.call(el, "touchcancel", endTouch, {passive: true});
        ADD_EVENT_LISTENER.call(el, "touchmove", endTouch, {passive: true});
        if (event.touches.length === 1) {
            TIMERS.set(el, setTimeout(() => {
                el.removeEventListener("touchend", endTouch, {passive: true});
                el.removeEventListener("touchcancel", endTouch, {passive: true});
                el.removeEventListener("touchmove", endTouch, {passive: true});
                const touch = event.touches.item(0);
                const ev = new MouseEvent(EVENT_NAME, {
                    screenX: touch.screenX,
                    screenY: touch.screenY,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey,
                    metaKey: event.metaKey,
                    button: -1,
                    buttons: 0
                });
                el.dispatchEvent(ev);
            }, CONTEXTMENU_DEBOUCE));
        }
    };

    const endTouch = function(event) {
        const el = event.currentTarget;
        el.removeEventListener("touchend", endTouch, {passive: true});
        el.removeEventListener("touchcancel", endTouch, {passive: true});
        el.removeEventListener("touchmove", endTouch, {passive: true});
        clearTimeout(TIMERS.get(el));
    };

    const callEvent = function(event) {
        const listener = ONCONTEXTMENU.get(this);
        if (listener) {
            listener(event);
        }
    };

    Object.defineProperty(HTMLElement.prototype, ON_EVENT_NAME, {
        get: function() {
            return ONCONTEXTMENU.get(this);
        },
        set: function(value) {
            if (typeof value === "function") {
                if (!ONCONTEXTMENU.get(this)) {
                    this.addEventListener(EVENT_NAME, callEvent);
                }
                ONCONTEXTMENU.set(this, value);
            } else if (ONCONTEXTMENU.get(this)) {
                ONCONTEXTMENU.delete(this);
                this.removeEventListener(EVENT_NAME, callEvent);
            }
        }
    });
    HTMLElement.prototype.addEventListener = function(type, listener, options) {
        if (type === EVENT_NAME && !REGISTERED.get(this)) {
            REGISTERED.set(this, true);
            this.style.webkitTouchCallout = "none !important";
            ADD_EVENT_LISTENER.call(this, "touchstart", startTouch, {passive: true});
        }
        ADD_EVENT_LISTENER.call(this, type, listener, options);
    };
    HTMLElement.prototype.setAttribute = function(name, value) {
        if (name === ON_EVENT_NAME) {
            if (typeof value != "function") {
                value = new Function("event", value);
            }
            this[ON_EVENT_NAME] = value;
        }
        SET_ATTRIBUTE.call(this, name, value);
    };
    HTMLElement.prototype.removeAttribute = function(name) {
        if (name === ON_EVENT_NAME) {
            this[ON_EVENT_NAME] = null;
        }
        REMOVE_ATTRIBUTE.call(this, name);
    };
}
