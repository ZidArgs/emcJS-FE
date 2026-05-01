import AbstractElement from "./AbstractElement.js";
import TPL from "./AbstractTwoChildrenElement.js.html" assert {type: "html"};

export default class AbstractTwoChildrenElement extends AbstractElement {

    #placeholder0El;

    #placeholder1El;

    #child0El;

    #child1El;

    #type;

    constructor(type, caption) {
        super(caption);
        const els = TPL.generate();
        /* --- */
        this.shadowRoot.getElementById("body").append(els);
        this.#type = type;
        /* --- */
        this.#child0El = this.shadowRoot.getElementById("child0");
        this.#child1El = this.shadowRoot.getElementById("child1");
        this.#placeholder0El = this.shadowRoot.getElementById("droptarget0");
        this.#placeholder1El = this.shadowRoot.getElementById("droptarget1");
        this.#placeholder0El.addEventListener("dragover", AbstractElement.allowDrop);
        this.#placeholder1El.addEventListener("dragover", AbstractElement.allowDrop);
        this.#placeholder0El.addEventListener("drop", AbstractElement.dropOnPlaceholder);
        this.#placeholder1El.addEventListener("drop", AbstractElement.dropOnPlaceholder);
        this.#placeholder0El.addEventListener("click", (event) => {
            const e = new Event("placeholderclicked", {
                bubbles: true,
                cancelable: true
            });
            e.name = event.target.parentElement.name;
            this.dispatchEvent(e);
            event.stopPropagation();
        });
        this.#placeholder1El.addEventListener("click", (event) => {
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
            content: this.childList.map((e) => e.toJSON())
        };
    }

    loadLogic(logic) {
        if (!!logic && Array.isArray(logic.content)) {
            for (let i = 0; i < logic.content.length && i < 2; ++i) {
                const ch = logic.content[i];
                if (ch) {
                    const node = AbstractElement.buildLogic(ch);
                    node.setAttribute("slot", `slot${i}`);
                    this.append(node);
                }
            }
        }
    }

    get childList() {
        const res = [];
        const ch0 = this.#child0El.assignedElements()[0];
        const ch1 = this.#child1El.assignedElements()[0];
        if (ch0 != null && ch0 instanceof AbstractElement) {
            res.push(ch0);
        }
        if (ch1 != null && ch1 instanceof AbstractElement) {
            res.push(ch1);
        }
        return res;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "disabled":
            case "template": {
                if (oldValue != newValue) {
                    if (this.editable) {
                        this.#placeholder0El.disabled = false;
                        this.#placeholder1El.disabled = false;
                    } else {
                        this.#placeholder0El.disabled = true;
                        this.#placeholder1El.disabled = true;
                    }
                }
            } break;
        }
    }

    checkValidity() {
        return this.childList.length === 2 && this.childList.every((el) => el.checkValidity());
    }

}
