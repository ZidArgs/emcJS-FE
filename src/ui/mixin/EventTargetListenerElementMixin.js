import {createMixin} from "emcjs/util/Mixin.js";
import EventTargetListenerMixin from "emcjs/mixin/EventTargetListenerMixin.js";

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
