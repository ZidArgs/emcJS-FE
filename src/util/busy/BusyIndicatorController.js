import BusyIndicator from "../../ui/BusyIndicator.js";

export default class BusyIndicatorController {

    #indicator;

    constructor(indicator) {
        if (!(indicator instanceof BusyIndicator)) {
            throw new Error("indicator must be an instance of BusyIndicator");
        }
        this.#indicator = indicator;
    }

    isBusy() {
        return this.#indicator.isBusy();
    }

    busy() {
        return this.#indicator.busy();
    }

    unbusy() {
        return this.#indicator.unbusy();
    }

    reset() {
        return this.#indicator.reset();
    }

    promise(promise) {
        return this.#indicator.promise(promise);
    }

}
