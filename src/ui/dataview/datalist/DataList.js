
import DataReceiverMixin from "emcjs/util/datareceiver/DataReceiverMixin.js";
import {classExtends} from "emcjs/util/helper/Class.js";
import CustomElement from "../../element/CustomElement.js";
import ElementManager from "../../../util/element/ElementManager.js";
import BusyIndicator from "../../BusyIndicator.js";
import DataListEntry from "./components/DataListEntry.js";
import "../../i18n/I18nLabel.js";
import TPL from "./DataList.js.html" assert {type: "html"};
import STYLE from "./DataList.js.css" assert {type: "css"};

export default class DataList extends DataReceiverMixin(CustomElement) {

    #listEntryClass = DataListEntry;

    #scrollContainerEl;

    #emptyContainerEl;

    #elementManager = new ElementManager(this);

    #busyIndicator = new BusyIndicator();

    #entries = new Map();

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#busyIndicator.setTarget(this.shadowRoot);
        /* --- */
        this.#scrollContainerEl = this.shadowRoot.getElementById("scroll-container");
        this.#emptyContainerEl = this.shadowRoot.getElementById("empty-container");
        this.#elementManager.composer = (key) => {
            const el = new this.#listEntryClass();
            this.prepareListEntry(el, key);
            el.key = key;
            this.#entries.set(key, el);
            return el;
        };
        this.#elementManager.mutator = (el, key, values) => {
            el.setData(values);
        };
        this.#elementManager.cleanup = (el, key) => {
            this.#entries.delete(key);
            this.removeListEntry(el);
        };
        this.#elementManager.addEventListener("afterrender", () => {
            const ev = new Event("afterrender", event);
            this.#scrollContainerEl.dispatchEvent(ev);
        });
        /* --- */
    }

    setListEntryClass(Clazz) {
        if  (classExtends(Clazz, DataListEntry)) {
            this.#listEntryClass = Clazz;
        }
    }

    prepareListEntry(/* el, key */) {
        // to override
    }

    removeListEntry(/* el */) {
        // to override
    }

    getEntry(key) {
        return this.#entries.get(key);
    }

    getAllEntries() {
        return [...this.#entries.values()];
    }

    setData(records) {
        this.#emptyContainerEl.classList.toggle("hidden", records.length > 0);
        this.#elementManager.manage(records);
    }

    busy() {
        return this.#busyIndicator.busy();
    }

    unbusy() {
        return this.#busyIndicator.unbusy();
    }

}

customElements.define("emc-datalist", DataList);
