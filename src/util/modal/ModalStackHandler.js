import UniqueEntriesStack from "emcjs/data/stack/UniqueEntriesStack.js";

class ModalStackHandler {

    #modalStack = new UniqueEntriesStack();

    #currentModal;

    push(modal) {
        if (this.#currentModal != null) {
            this.#currentModal.suspend();
        }
        this.#currentModal = modal;
        this.#currentModal.restore();
        this.#modalStack.push(modal);
    }

    delete(modal) {
        if (this.#currentModal === modal) {
            this.#modalStack.pop();
            this.#currentModal = this.#modalStack.peek();
            if (this.#currentModal != null) {
                this.#currentModal.restore();
            }
        } else {
            this.#modalStack.delete(modal);
        }
    }

}

export default new ModalStackHandler();
