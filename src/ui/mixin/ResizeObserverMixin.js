import {createMixin} from "@emcjs/core/mixin/Mixin.js";

const RESIZE_OBSERVER = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const target = entry.target;
        target.resizeCallback();
    }
});

export default createMixin((superclass) => class ResizeObserverMixin extends superclass {

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback?.();
        }
        RESIZE_OBSERVER.observe(this);
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback?.();
        }
        RESIZE_OBSERVER.unobserve(this);
    }

    resizeCallback() {
        const ev = new Event("resize");
        ev.outerWidth = this.offsetWidth;
        ev.outerHeight = this.offsetHeight;
        ev.innerWidth = this.clientWidth;
        ev.innerHeight = this.clientHeight;
        this.dispatchEvent(ev);
    }

});
