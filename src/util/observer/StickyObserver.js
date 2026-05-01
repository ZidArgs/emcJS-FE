import {isEqual} from "emcjs/util/helper/Comparator.js";
import {getBoundingContentRect} from "../element/ElementSizeHelper.js";
import StyleChangeObserver from "./StyleChangeObserver.js";

const OBSERVED_STYLES = [
    "position",
    "top",
    "bottom",
    "left",
    "right"
];

export default class StickyObserver {

    #rootEl;

    #marginTop = 0;

    #marginBottom = 0;

    #marginLeft = 0;

    #marginRight = 0;

    #onStuckCallback;

    #observedEls = new Map();

    #styleChangeObserver;

    #stuckClassName = "stuck";

    constructor(options = {}) {
        const {
            root = document.rootElement,
            marginTop = 0,
            marginBottom = 0,
            marginLeft = 0,
            marginRight = 0
        } = options;
        this.#rootEl = root;
        if (!isNaN(marginTop)) {
            this.#marginTop = parseInt(marginTop);
        }
        if (!isNaN(marginBottom)) {
            this.#marginBottom = parseInt(marginBottom);
        }
        if (!isNaN(marginLeft)) {
            this.#marginLeft = parseInt(marginLeft);
        }
        if (!isNaN(marginRight)) {
            this.#marginRight = parseInt(marginRight);
        }
        /* -- */
        root.addEventListener("scroll", () => {
            this.#refresh();
        });
        /* -- */
        this.#styleChangeObserver = new StyleChangeObserver((changedEls) => {
            const entries = [];
            const contentRect = getBoundingContentRect(this.#rootEl);
            for (const changedEl of changedEls) {
                const oldEntry = this.#observedEls.get(changedEl);
                const newEntry = this.#handleObservedElement(changedEl, contentRect);
                if (!isEqual(oldEntry, newEntry)) {
                    this.#observedEls.set(changedEl, newEntry);
                    entries.push(newEntry);
                }
            }
            if (entries.length > 0) {
                this.#applySticky(entries);
            }
        }, OBSERVED_STYLES);
        this.#styleChangeObserver.blacklistClass(this.#stuckClassName);
    }

    set stuckClassName(value) {
        if (this.#stuckClassName !== value) {
            this.#styleChangeObserver.unblacklistClass(this.#stuckClassName);
            this.#styleChangeObserver.blacklistClass(value);
            this.#stuckClassName = value;
        }
    }

    get stuckClassName() {
        return this.#stuckClassName;
    }

    set marginTop(value) {
        if (!isNaN(value)) {
            this.#marginTop = parseInt(value);
        }
    }

    get marginTop() {
        return this.#marginTop;
    }

    set marginBottom(value) {
        if (!isNaN(value)) {
            this.#marginBottom = parseInt(value);
        }
    }

    get marginBottom() {
        return this.#marginBottom;
    }

    set marginLeft(value) {
        if (!isNaN(value)) {
            this.#marginLeft = parseInt(value);
        }
    }

    get marginLeft() {
        return this.#marginLeft;
    }

    set marginRight(value) {
        if (!isNaN(value)) {
            this.#marginRight = parseInt(value);
        }
    }

    get marginRight() {
        return this.#marginRight;
    }

    onStuckChange(callback) {
        if (typeof callback === "function") {
            this.#onStuckCallback = callback;
        } else {
            this.#onStuckCallback = null;
        }
    }

    #refresh() {
        const entries = this.takeRecords();
        if (entries.length > 0) {
            this.#applySticky(entries);
        }
    }

    async observe(element) {
        if (!this.#observedEls.has(element)) {
            await this.#styleChangeObserver.observe(element);
            const contentRect = getBoundingContentRect(this.#rootEl);
            const entry = this.#handleObservedElement(element, contentRect);
            this.#observedEls.set(element, entry);
            this.#applySticky([entry]);
        } else {
            console.warn("element is already observed");
        }
    }

    unobserve(element) {
        if (this.#observedEls.has(element)) {
            this.#observedEls.delete(element);
            this.#styleChangeObserver.unobserve(element);
        }
    }

    disconnect() {
        this.#observedEls.clear();
        this.#styleChangeObserver.disconnect();
    }

    takeRecords() {
        const entries = [];
        const contentRect = getBoundingContentRect(this.#rootEl);
        for (const [observedEl, oldEntry] of this.#observedEls) {
            const newEntry = this.#handleObservedElement(observedEl, contentRect);
            if (!isEqual(oldEntry, newEntry)) {
                this.#observedEls.set(observedEl, newEntry);
                entries.push(newEntry);
            }
        }
        return entries;
    }

    getRecords() {
        const entries = [];
        for (const [, entry] of this.#observedEls) {
            entries.push(entry);
        }
        return entries;
    }

    #handleObservedElement(observedEl, contentRect) {
        const observedStyle = this.#styleChangeObserver.getStyle(observedEl);
        const entry = {
            target: observedEl,
            isStuck: false,
            stuckPositions: {
                top: false,
                bottom: false,
                left: false,
                right: false
            }
        };
        if (observedStyle.position !== "sticky") {
            return entry;
        }

        const observedRect = observedEl.getBoundingClientRect();
        // get top stuck
        const styleTop = parseFloat(observedStyle.top);
        if (!isNaN(styleTop)) {
            if (Math.floor(observedRect.top) <= Math.ceil(contentRect.top) + styleTop + this.#marginTop) {
                entry.isStuck = true;
                entry.stuckPositions.top = true;
            }
        }
        // get bottom stuck
        const styleBottom = parseFloat(observedStyle.bottom);
        if (!isNaN(styleBottom)) {
            if (Math.ceil(observedRect.bottom) >= Math.floor(contentRect.bottom) - styleBottom - this.#marginBottom) {
                entry.isStuck = true;
                entry.stuckPositions.bottom = true;
            }
        }
        // get left stuck
        const styleLeft = parseFloat(observedStyle.left);
        if (!isNaN(styleLeft)) {
            if (Math.floor(observedRect.left) <= Math.ceil(contentRect.left) + styleLeft + this.#marginLeft) {
                entry.isStuck = true;
                entry.stuckPositions.left = true;
            }
        }
        // get right stuck
        const styleRight = parseFloat(observedStyle.right);
        if (!isNaN(styleRight)) {
            if (Math.ceil(observedRect.right) >= Math.floor(contentRect.right) - styleRight - this.#marginRight) {
                entry.isStuck = true;
                entry.stuckPositions.right = true;
            }
        }

        return entry;
    }

    #applySticky(entries) {
        if (typeof this.#stuckClassName === "string" && this.#stuckClassName !== "") {
            for (const entry of entries) {
                entry.target.classList.toggle(this.#stuckClassName, entry.isStuck);
            }
        }
        this.#onStuckCallback?.(entries);
    }

}
