import ArraySet from "@emcjs/core/data/collection/ArraySet.js";

export default class ElementListCache {

    #elementList = new ArraySet();

    append(...nodes) {
        this.#elementList.add(...nodes.filter((node) => node instanceof Element));
    }

    prepend(...nodes) {
        this.#elementList.insertAt(0, ...nodes.filter((node) => node instanceof Element));
    }

    removeNode(...nodes) {
        this.#elementList.delete(...nodes.filter((node) => node instanceof Element));
    }

    purge() {
        this.#elementList.clear();
    }

    forEach(callback, thisArg) {
        this.#elementList.forEach(callback, thisArg);
    }

    filter(callback, thisArg) {
        this.#elementList = this.#elementList.filter(callback, thisArg);
    }

    get first() {
        return this.#elementList.at(0);
    }

    get last() {
        return this.#elementList.at(-1);
    }

    setNodeList(list) {
        this.#elementList = new ArraySet(list.filter((node) => node instanceof Element));
    }

    getNodeList() {
        return [...this.#elementList];
    }

    querySelector(selector) {
        for (const el of this.#elementList) {
            if (el.matches(selector)) {
                return el;
            }
        }
    }

    querySelectorAll(selector) {
        return [...this.#elementList].filter((el) => el.matches(selector));
    }

    get size() {
        return this.#elementList.size;
    }

    getPrev(element) {
        const pos = this.#elementList.indexOf(element);
        if (pos > 0) {
            return this.#elementList.at(pos - 1);
        }
    }

    getNext(element) {
        const pos = this.#elementList.indexOf(element);
        if (pos >= 0 && pos < this.#elementList.size - 1) {
            return this.#elementList.at(pos + 1);
        }
    }

    [Symbol.iterator]() {
        return this.#elementList[Symbol.iterator]();
    }

}
