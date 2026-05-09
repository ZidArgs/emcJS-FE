import EventTargetListenerMixin from "@emcjs/core/mixin/event/EventTargetListenerMixin.js";
import {createMixin} from "@emcjs/core/mixin/Mixin.js";

export default createMixin((superclass) => class EventTargetListenerElementMixin extends EventTargetListenerMixin(superclass) {

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback?.();
        }
        this.setEventTargetListenerActive(true);
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback?.();
        }
        this.setEventTargetListenerActive(false);
    }

});
