import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";

export default class ListSelectionController extends EventTarget {

    #target;

    #container;

    #skipFn;

    #marked;

    #eventManager = new EventTargetManager();

    constructor(target, container, skipFn) {
        super();
        this.#target = target;
        this.#container = container;
        this.#skipFn = skipFn;
        /* --- */
        this.#eventManager.switchTarget(target);
        this.#eventManager.set("blur", (event) => {
            this.#cancelSelection();
            event.stopPropagation();
            return false;
        });
        this.#eventManager.set("keydown", (event) => {
            if (!("readonly" in target) || !target.readOnly) {
                switch (event.key) {
                    case "Escape": {
                        this.#cancelSelection();
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                    case "Enter":
                    case " ": {
                        this.#selectMarked();
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                    case "ArrowUp": {
                        this.#markPrevious();
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                    case "ArrowDown": {
                        this.#markNext();
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }
            }
        });
    }

    #cancelSelection() {
        this.dispatchEvent(new Event("cancel"));
        if (this.#marked != null) {
            this.#marked.classList.remove("marked");
            this.#marked = null;
        }
    }

    #selectMarked() {
        if (this.#marked != null) {
            const ev = new Event("choose");
            ev.value = this.#marked.getAttribute("value");
            this.dispatchEvent(ev);
            this.#marked.classList.remove("marked");
            this.#marked = null;
        }
    }

    #markPrevious() {
        if (this.#marked != null) {
            let el = this.#marked.previousElementSibling;
            while (el != null && this.#skipElement(el)) {
                el = el.previousElementSibling;
            }
            if (el != null) {
                this.#marked.classList.remove("marked");
                el.classList.add("marked");
                const targetScroll = el.offsetTop - 20 - this.#container.offsetTop;
                if (this.#container.scrollTop > targetScroll) {
                    this.#container.scrollTop = targetScroll;
                }
                this.#marked = el;
            }
        } else {
            this.#markFirst();
        }
    }

    #markNext() {
        if (this.#marked != null) {
            let el = this.#marked.nextElementSibling;
            while (el != null && this.#skipElement(el)) {
                el = el.nextElementSibling;
            }
            if (el != null) {
                this.#marked.classList.remove("marked");
                el.classList.add("marked");
                const targetScroll = el.offsetTop - this.#container.clientHeight - this.#container.offsetTop + el.clientHeight + 20;
                if (this.#container.scrollTop < targetScroll) {
                    this.#container.scrollTop = targetScroll;
                }
                this.#marked = el;
            }
        } else {
            this.#markFirst();
        }
    }

    #markFirst() {
        let el = this.#target.querySelector("[value]");
        while (el != null && this.#skipElement(el)) {
            el = el.nextElementSibling;
        }
        if (el != null) {
            el.classList.add("marked");
            this.#container.scrollTop = 0;
            this.#marked = el;
        }
    }

    #skipElement(el) {
        if (el.style.display === "none") {
            return true;
        }
        if (typeof this.#skipFn === "function") {
            return this.#skipFn(el);
        }
        return false;
    }

}
