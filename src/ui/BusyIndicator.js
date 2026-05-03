import ActiveCounter from "@emcjs/core/util/counter/ActiveCounter.js";
import CustomElement from "./element/CustomElement.js";
import TPL from "./BusyIndicator.js.html" assert {type: "html"};
import STYLE from "./BusyIndicator.js.css" assert {type: "css"};

const DOM_CHANGE_DELAY = 50;

export default class BusyIndicator extends CustomElement {

    #isActive = false;

    #targetEl = document.body;

    #activeCounter = new ActiveCounter();

    #promiseCounter = new ActiveCounter();

    constructor(target) {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        if (target != null) {
            this.setTarget(target);
        }
    }

    isBusy() {
        return this.#isActive;
    }

    busy() {
        return new Promise((resolve) => {
            if (this.#activeCounter.add() && !this.#promiseCounter.isActive()) {
                this.#addIndicator(resolve);
            } else {
                resolve();
            }
        });
    }

    unbusy() {
        return new Promise((resolve) => {
            if (this.#activeCounter.remove() && !this.#promiseCounter.isActive()) {
                this.#removeIndocator(resolve);
            } else {
                resolve();
            }
        });
    }

    reset() {
        return new Promise((resolve) => {
            if (this.#activeCounter.reset() && !this.#promiseCounter.isActive()) {
                this.#removeIndocator(resolve);
            } else {
                resolve();
            }
        });
    }

    async promise(promise) {
        if (promise instanceof Promise) {
            await this.#busyPromise();
            try {
                const value = await promise;
                await this.#unbusyPromise();
                return value;
            } catch (error) {
                await this.#unbusyPromise();
                throw error;
            }
        }
        return promise;
    }

    setTarget(element) {
        if (element instanceof HTMLElement || element instanceof ShadowRoot) {
            this.#targetEl = element;
        } else {
            this.#targetEl = document.body;
        }
        if (this.#isActive) {
            this.#targetEl.append(this);
        }
    }

    #busyPromise() {
        return new Promise((resolve) => {
            if (this.#promiseCounter.add() && !this.#activeCounter.isActive()) {
                this.#addIndicator(resolve);
            } else {
                resolve();
            }
        });
    }

    #unbusyPromise() {
        return new Promise((resolve) => {
            if (this.#promiseCounter.remove() && !this.#activeCounter.isActive()) {
                this.#removeIndocator(resolve);
            } else {
                resolve();
            }
        });
    }

    #addIndicator(resolve) {
        this.#isActive = true;
        this.#targetEl.append(this);
        setTimeout(()=> {
            resolve();
        }, DOM_CHANGE_DELAY);
    }

    #removeIndocator(resolve) {
        this.#isActive = false;
        setTimeout(()=> {
            this.remove();
            resolve();
        }, 0);
    }

}

customElements.define("emc-busy-indicator", BusyIndicator);
