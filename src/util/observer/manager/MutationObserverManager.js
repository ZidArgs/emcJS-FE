export default class MutationObserverManager {

    #config;

    #mutationObserver;

    #observedNodes = new Set();

    #observerIndex = new WeakMap();

    constructor(config, handler) {
        this.#config = config;
        this.#mutationObserver = new MutationObserver(handler);
    }

    observe(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        if (!this.isObserving(node)) {
            const ref = new WeakRef(node);
            this.#observedNodes.add(ref);
            this.#observerIndex.set(node, ref);
            this.#mutationObserver.observe(node, this.#config);
        }
    }

    unobserve(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        const nodeRef = this.#getNodeRef(node);
        if (nodeRef != null) {
            this.#observedNodes.delete(nodeRef);
            this.#observerIndex.delete(node);
            this.#refreshObserver();
        }
    }

    isObserving(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        return this.#observerIndex.has(node);
    }

    getObservedNodes() {
        const res = [];
        for (const ref of this.#observedNodes) {
            const derefNode = ref.deref();
            if (derefNode != null) {
                res.push(derefNode);
            }
        }
        return res;
    }

    clear() {
        this.#observedNodes.clear();
        this.#observerIndex = new WeakMap();
        this.#mutationObserver.disconnect();
    }

    #getNodeRef(node) {
        return this.#observerIndex.get(node);
    }

    #refreshObserver() {
        this.#mutationObserver.disconnect();
        for (const ref of this.#observedNodes) {
            const derefNode = ref.deref();
            if (derefNode == null) {
                this.#observedNodes.delete(ref);
            } else {
                this.#mutationObserver.observe(derefNode, this.#config);
            }
        }
    }

}
