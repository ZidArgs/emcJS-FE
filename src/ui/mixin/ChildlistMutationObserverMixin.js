import {createMixin} from "@emcjs/core/mixin/Mixin.js";

export default createMixin((superclass) => class ChildlistMutationObserverMixin extends superclass {

    #observer;

    constructor(...args) {
        super(...args);
        /* --- */
        this.#observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type == "childList") {
                    const target = mutation.target;
                    for (const element of mutation.addedNodes) {
                        this.nodeAddedCallback(element, target);
                    }
                    for (const element of mutation.removedNodes) {
                        this.nodeRemovedCallback(element, target);
                    }
                }
            }
        });
    }

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback?.();
        }
        this.#observer.observe(this, {
            childList: true,
            subtree: this.constructor.checkSubtreeMutation
        });
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback?.();
        }
        this.#observer.disconnect();
    }

    nodeAddedCallback(/* element, target */) {
        // nothing
    }

    nodeRemovedCallback(/* element, target */) {
        // nothing
    }

    static get checkSubtreeMutation() {
        return false;
    }

});
