const DRAGGED = new Set();

class DragDropMemory {

    add(element) {
        if (Array.isArray(element)) {
            for (const el of element) {
                this.add(el);
            }
        } else if (element instanceof HTMLElement) {
            DRAGGED.add(element);
        }
    }

    get() {
        return Array.from(DRAGGED);
    }

    clear() {
        DRAGGED.clear();
    }

}

export default new DragDropMemory();
