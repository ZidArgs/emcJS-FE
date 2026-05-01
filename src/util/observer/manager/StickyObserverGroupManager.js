export default class StickyObserverGroupManager {

    #stickyObserver;

    #observedNodes = new Set();

    constructor(stickyObserver) {
        this.#stickyObserver = stickyObserver;
    }

    observe(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        if (!this.isObserving(node)) {
            this.#observedNodes.add(node);
            this.#stickyObserver.observe(node);
        }
    }

    unobserve(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        if (this.isObserving(node)) {
            this.#observedNodes.delete(node);
            this.#stickyObserver.unobserve(node);
        }
    }

    isObserving(node) {
        if (!(node instanceof Node)) {
            throw new TypeError("node must be an instance of Node");
        }
        return this.#observedNodes.has(node);
    }

    getObservedNodes() {
        return [...this.#observedNodes];
    }

    clear() {
        for (const node of this.#observedNodes) {
            this.#stickyObserver.unobserve(node);
        }
        this.#observedNodes.clear();
    }

}
