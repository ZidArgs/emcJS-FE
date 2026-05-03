import {sleep} from "@emcjs/core/util/process/Sleep.js";

/**
 * This is some messed up hack to determine when an
 * element got conencted into the dom
 */
class ConnectedHook extends HTMLElement {

    #onConnected;

    constructor(onConnected) {
        super();
        this.#onConnected = onConnected;
    }

    connectedCallback() {
        this.#onConnected();
    }

}

customElements.define("emc-hook-element-connected", ConnectedHook);

export function allNodesConnected(nodeList) {
    const resolveList = new Map();
    const observer = new IsConnectedObserver((node) => resolveList.get(node)());
    return Promise.all(nodeList.map((node) => {
        return new Promise((resolve) => {
            resolveList.set(node, resolve);
            observer.observe(node);
        });
    }));
}

async function waitForConnect(node, onConnected) {
    while (!node.isConnected) {
        await sleep(10);
    }
    onConnected(node);
}

export default class IsConnectedObserver {

    #onConnected;

    constructor(onConnected) {
        this.#onConnected = onConnected;
    }

    observe(observedEl) {
        if (!(observedEl instanceof HTMLElement)) {
            throw new TypeError("only HTMLElement and its descendants can be observed");
        }
        if (!observedEl.isConnected) {
            const hookEl = new ConnectedHook(() => {
                hookEl.remove();
                this.#onConnected(observedEl);
            });
            observedEl.append(hookEl);
            if (!observedEl.contains(hookEl)) {
                console.warn("can not observe element through ConnectedHook - switching to timeout method");
                waitForConnect(observedEl, this.#onConnected);
            }
        } else {
            this.#onConnected(observedEl);
        }
    }

}
