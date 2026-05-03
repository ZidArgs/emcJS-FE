import {debounce} from "@emcjs/core/util/Debouncer.js";
import {getArrayMutations} from "@emcjs/core/util/helper/collection/ArrayMutations.js";
import {isEqual} from "@emcjs/core/util/helper/Comparator.js";
import {deepClone} from "@emcjs/core/util/helper/DeepClone.js";

export default class ElementManager extends EventTarget {

    #target;

    #elements = new Map();

    #data = new Map();

    #cache = new Map();

    #definedOrder = [];

    #order = [];

    #sorter = null;

    #params;

    constructor(target, ...params) {
        if (!(target instanceof HTMLElement)) {
            throw new TypeError("target must be of type HTMLElement");
        }
        super();
        this.#target = target;
        this.#params = params;
    }

    connectedCallback() {}

    disconnectedCallback() {}

    manage(data) {
        if (!Array.isArray(data)) {
            throw new TypeError("data must be an array");
        }

        const unused = new Set(this.#elements.keys());
        this.#definedOrder = [];

        for (const index in data) {
            const record = data[index];
            if (typeof record !== "object" || Array.isArray(record)) {
                throw new TypeError("data entries must be objects");
            }

            const {
                key = index, ...values
            } = record;
            this.#definedOrder.push(key);

            if (!this.#elements.has(key)) {
                this.#data.set(key, record);
                this.#cache.set(key, deepClone(record));
                const el = this.composer(key, values, ...this.#params);
                if (el != null) {
                    el.setAttribute("em-key", key);
                    this.mutator(el, key, values, ...this.#params);
                    this.#elements.set(key, el);
                }
            } else {
                const el = this.#elements.get(key);
                if (this.#checkChange(record)) {
                    this.#data.set(key, record);
                    this.mutator(el, key, values, ...this.#params);
                }
                unused.delete(key);
            }
        }

        for (const key of unused) {
            const el = this.#elements.get(key);
            el.remove();
            this.#elements.delete(key);
            this.#data.delete(key);
            this.#cache.delete(key);
            this.cleanup(el, key, ...this.#params);
        }

        this.#sortEntries();
    }

    /**
     * forces the ElementManager to call its internal render function
     */
    rerender() {
        this.#render();
    }

    registerSortFunction(sorter) {
        if (typeof sorter === "function") {
            if (this.#sorter !== sorter) {
                this.#sorter = sorter;
                this.#sortEntries();
            }
        } else {
            this.#sorter = null;
            this.#sortEntries();
        }
    }

    sort = debounce(() => {
        if (this.#sorter != null) {
            this.#sortEntries();
        }
    });

    #sortEntries() {
        if (this.#sorter != null && this.#data.size > 0) {
            const newOrder = this.#definedOrder.toSorted((key0, key1) => {
                const data0 = this.#data.get(key0);
                const data1 = this.#data.get(key1);
                const el0 = this.#elements.get(key0);
                const el1 = this.#elements.get(key1);
                if (data0 == null || data1 == null) {
                    return 0;
                }
                return this.#sorter({
                    data: data0,
                    element: el0
                }, {
                    data: data1,
                    element: el1
                });
            });
            if (!isEqual(this.#order, newOrder)) {
                this.#order = newOrder;
                this.#render();
            }
        } else if (!isEqual(this.#order, this.#definedOrder)) {
            this.#order = this.#definedOrder;
            this.#render();
        }
    }

    #render = debounce(() => {
        this.dispatchEvent(new Event("beforerender"));
        const children = this.#target.children;
        if (children.length > 0) {
            const currentOrder = [...children].map((el) => el.getAttribute("em-key") ?? "");
            const keys = [...this.#order];
            const {changes} = getArrayMutations(currentOrder, keys);
            if (changes.length > 0) {
                for (const {sequence} of changes) {
                    for (const key of sequence) {
                        const el = this.#elements.get(key);
                        if (el != null) {
                            el.remove();
                        }
                    }
                }
                let missingOffset = 0;
                for (const change of changes) {
                    const {
                        sequence, position
                    } = change;
                    const adjustedPosition = position - missingOffset;
                    const els = [];
                    for (const key of sequence) {
                        const el = this.#elements.get(key);
                        if (el != null) {
                            els.push(el);
                        } else {
                            missingOffset++;
                        }
                    }
                    if (adjustedPosition <= 0) {
                        this.#target.prepend(...els);
                    } else {
                        this.#target.children[adjustedPosition - 1].after(...els);
                    }
                }
            }
        } else {
            const els = [];
            for (const key of this.#order) {
                const el = this.#elements.get(key);
                if (el != null) {
                    els.push(el);
                }
            }
            this.#target.append(...els);
        }
        this.dispatchEvent(new Event("afterrender"));
    });

    #checkChange(data) {
        if (typeof data?.key !== "string") {
            return true;
        }
        const cachedData = this.#cache.get(data.key);
        if (!isEqual(cachedData, data)) {
            this.#cache.set(data.key, deepClone(data));
            return true;
        }
        return false;
    }

    // eslint-disable-next-line no-unused-vars
    composer(key, values, ...params) {}

    // eslint-disable-next-line no-unused-vars
    mutator(el, key, values, ...params) {}

    // eslint-disable-next-line no-unused-vars
    cleanup(el, key, ...params) {}

}
