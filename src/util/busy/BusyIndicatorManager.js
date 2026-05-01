import "../../ui/BusyIndicator.js";

const INSTANCES = new Map();

export default class BusyIndicatorManager {

    static #mainBusyEl = document.createElement("emc-busy-indicator");

    #busyEl;

    constructor(name) {
        if (typeof name !== "string" || name === "") {
            throw new Error("name has to be a non empty string");
        }
        if (INSTANCES.has(name)) {
            return INSTANCES.get(name);
        }
        this.#busyEl = document.createElement("emc-busy-indicator");
        INSTANCES.set(name, this);
    }

    isBusy() {
        return this.#busyEl.isBusy();
    }

    async busy() {
        await this.#busyEl.busy();
    }

    async unbusy() {
        await this.#busyEl.unbusy();
    }

    async reset() {
        await this.#busyEl.reset();
    }

    async watch(promise) {
        if (promise instanceof Promise) {
            await this.#busyEl.busy();
            try {
                const result = promise();
                await this.#busyEl.unbusy();
                return result;
            } catch (err) {
                await this.#busyEl.unbusy();
                throw err;
            }
        }
    }

    setIndicator(element) {
        if (element instanceof HTMLElement) {
            this.#busyEl.append(element);
        }
    }

    setTarget(element) {
        this.#busyEl.setTarget(element);
    }

    static setIndicator(element) {
        if (element instanceof HTMLElement) {
            BusyIndicatorManager.#mainBusyEl.append(element);
        }
    }

    static async busy() {
        await BusyIndicatorManager.#mainBusyEl.busy();
    }

    static async unbusy() {
        await BusyIndicatorManager.#mainBusyEl.unbusy();
    }

    static async reset() {
        await BusyIndicatorManager.#mainBusyEl.reset();
    }

    static async watch(promise) {
        if (promise instanceof Promise) {
            await BusyIndicatorManager.#mainBusyEl.busy();
            try {
                const result = promise();
                await BusyIndicatorManager.#mainBusyEl.unbusy();
                return result;
            } catch (err) {
                await BusyIndicatorManager.#mainBusyEl.reset();
                throw err;
            }
        }
    }

}
