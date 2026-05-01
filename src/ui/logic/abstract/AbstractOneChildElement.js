import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractOneChildElement.js.html" assert {type: "html"};

export default class AbstractOneChildElement extends AbstractElement {

    #placeholderEl;

    #type;

    constructor(type, caption) {
        super(caption);
        const els = TPL.generate();
        /* --- */
        this.shadowRoot.getElementById("body").append(els);
        this.#type = type;
        /* --- */
        this.#placeholderEl = this.shadowRoot.getElementById("droptarget");
        this.#placeholderEl.addEventListener("dragover", AbstractElement.allowDrop);
        this.#placeholderEl.addEventListener("drop", AbstractElement.dropOnPlaceholder);
        this.#placeholderEl.addEventListener("click", (event) => {
            const e = new Event("placeholderclicked", {
                bubbles: true,
                cancelable: true
            });
            e.name = event.target.parentElement.name;
            this.dispatchEvent(e);
            event.stopPropagation();
        });
    }

    toJSON() {
        return {
            type: this.#type,
            content: this.childList.map((e) => e.toJSON())[0]
        };
    }

    loadLogic(logic) {
        if (!!logic && !!logic.content) {
            const node = AbstractElement.buildLogic(logic.content);
            this.append(node);
        }
    }

    get childList() {
        const ch = Array.from(this.children).filter((node) => node instanceof AbstractElement);
        if (ch.length) {
            return [ch[0]];
        }
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "disabled":
            case "template": {
                if (oldValue != newValue) {
                    if (this.editable) {
                        this.#placeholderEl.disabled = false;
                    } else {
                        this.#placeholderEl.disabled = true;
                    }
                }
            } break;
        }
    }

    checkValidity() {
        return this.childList.length === 1 && this.childList[0].checkValidity();
    }

}
