import {
    isDict, isStringNotEmpty
} from "emcjs/util/helper/CheckType.js";
import CustomElement from "../element/CustomElement.js";
import "./panel/HBox.js";
import "./panel/VBox.js";
import "./panel/TabPanel.js";
import Panel from "./Panel.js";
import TPL from "./Layout.js.html" assert {type: "html"};
import STYLE from "./Layout.js.css" assert {type: "css"};

export default class Layout extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    loadLayout(layout) {
        this.innerHTML = "";
        const rendered = this.#renderLayout(layout);
        this.appendChild(rendered);
    }

    #renderLayout(layout) {
        if (isDict(layout)) {
            if (layout.type == "panel") {
                const clazz = Panel.getReference(layout.name);
                if (clazz != null) {
                    const el = new clazz();
                    if (isDict(layout.options)) {
                        for (const i in layout.options) {
                            el.setAttribute(i, layout.options[i]);
                        }
                    }
                    if (isStringNotEmpty(layout.id)) {
                        el.id = layout.id;
                    }
                    return el;
                } else {
                    const el = document.createElement("div");
                    el.classList.add("error-panel");
                    el.innerHTML = `error: panel with reference name "${layout.name}" not found`;
                    return el;
                }
            } else if (layout.type == "vbox" || layout.type == "hbox") {
                const el = document.createElement(`emc-panel-${layout.type}`);
                el.classList.add("stretchlast");
                for (const item of layout.items) {
                    const ch = this.#renderLayout(item);
                    if (item.autosize) {
                        ch.classList.add("autosize");
                        el.classList.remove("stretchlast");
                    }
                    el.append(ch);
                }
                return el;
            } else if (layout.type == "tabpanel") {
                const el = document.createElement("emc-panel-tabpanel");
                for (const cat of layout.categories) {
                    const cnt = el.setTab(cat.category, cat.name ?? cat.category);
                    for (const item of cat.items) {
                        const ch = this.#renderLayout(cat);
                        if (item.autosize) {
                            ch.classList.add("autosize");
                        }
                        cnt.append(ch);
                    }
                }
                return el;
            } else {
                const el = document.createElement("div");
                el.classList.add("error-panel");
                el.innerHTML = `error: panel type "${layout.type}" not found`;
                return el;
            }
        } else {
            const el = document.createElement("div");
            el.classList.add("error-panel");
            el.innerHTML = `error: no layout found`;
            return el;
        }
    }

    load() {
        for (const ch of this.children) {
            if (typeof ch.load === "function") {
                ch.load();
            }
        }
    }

    unload() {
        for (const ch of this.children) {
            if (typeof ch.unload === "function") {
                ch.unload();
            }
        }
    }

}

customElements.define("emc-layout", Layout);
