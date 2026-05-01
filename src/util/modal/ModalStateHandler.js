// TODO create class to store "modal states" for single-instance-multi-purpose modals

/**
 * - create a handler that can save and restore states so one modal can be used multiple times simutaneously
 *     - on loose focus store state in handler
 *     - on push into focus restore state into modal
 * - events should be redispatched by the handler
 * - only one handler will get the attention of the modal at any time
 */

import Modal from "../../ui/modal/Modal.js";

export default class ModalStateHandler extends EventTarget {

    #state;

    #modal;

    constructor(modal) {
        if (!(modal instanceof Modal)) {
            throw new TypeError("modal has to be an instance of Modal");
        }
        super();
        this.#modal = modal;
    }

    getModal() {
        return this.#modal;
    }

    suspend() {
        this.#state = new Map();
        const data = {};
        this.#modal.suspend(data);
        for (const key in data) {
            this.#state.set(key, data[key]);
        }
    }

    restore() {
        if (this.#state != null) {
            const data = {};
            for (const [key, value] of this.#state) {
                data[key] = value;
            }
            this.#modal.restore(data);
            this.#state = null;
        } else {
            this.#modal.restore();
        }
    }

}
