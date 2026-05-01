import SearchEvery from "emcjs/util/search/SearchEvery.js";
import CustomElement from "../element/CustomElement.js";
import FormContext from "../../util/form/context/FormContext.js";
import FormBuilder from "../../util/form/FormBuilder.js";
import {getFilterText} from "../../util/form/FilterTextHelper.js";
import TreeNode from "../tree/components/TreeNode.js";
import SectionTreeManager from "../../util/form/manager/SectionTreeManager.js";
import FormErrorButtonManager from "../../util/form/manager/errorbutton/FormErrorButtonManager.js";
import "../form/element/input/search/SearchInput.js";
import "../tree/Tree.js";
import "../navigation/button/HamburgerButton.js";
import TPL from "./SettingsPanel.js.html" assert {type: "html"};
import STYLE from "./SettingsPanel.js.css" assert {type: "css"};

export default class SettingsPanel extends CustomElement {

    #focusTopEl;

    #focusBottomEl;

    #titleTextEl;

    #hamburgerEl;

    #searchEl;

    #sectionTreeManager = new SectionTreeManager();

    #formSectionNavigationEl;

    #formContainerEl;

    #settingsFormEl;

    #formContext = new FormContext();

    #errorButtonManager = new FormErrorButtonManager();

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#errorButtonManager.setFormContext(this.#formContext);
        this.#formContext.allowEnter = true;
        this.#formContext.hideErrors = false;
        /* --- */
        this.#titleTextEl = this.shadowRoot.getElementById("title-text");
        this.#hamburgerEl = this.shadowRoot.getElementById("hamburger-button");
        this.#formSectionNavigationEl = this.shadowRoot.getElementById("form-section-navigation");
        this.#formContainerEl = this.shadowRoot.getElementById("form-container");
        this.#settingsFormEl = this.shadowRoot.getElementById("settings-form");
        this.#formContext.registerFormContainer(this.#formContainerEl);
        this.#sectionTreeManager.setFormSectionNavigationElement(this.#formSectionNavigationEl);
        this.#sectionTreeManager.observe(this.#formContainerEl);
        this.#initFormHandlers();
        /* --- */
        this.#hamburgerEl.addEventListener("click", () => {
            if (this.#formSectionNavigationEl.classList.contains("open")) {
                this.#formSectionNavigationEl.classList.remove("open");
                this.#formSectionNavigationEl.classList.remove("cover");
                this.#hamburgerEl.open = false;
            } else {
                this.#formSectionNavigationEl.classList.add("open");
                this.#hamburgerEl.open = true;
                this.#formSectionNavigationEl.focus();
            }
        });
        this.#formSectionNavigationEl.addEventListener("select", () => {
            if (this.#formSectionNavigationEl.classList.contains("open")) {
                this.#formSectionNavigationEl.classList.remove("open");
                this.#formSectionNavigationEl.classList.remove("cover");
                this.#hamburgerEl.open = false;
            }
        });
        /* --- */
        this.#searchEl = this.shadowRoot.getElementById("search");
        this.#searchEl.addEventListener("change", () => {
            const all = this.#settingsFormEl.querySelectorAll(":scope [name]:not(emc-form-section)");
            const sections = [...this.#settingsFormEl.querySelectorAll("emc-form-section")].reverse();
            const searchValue = this.#searchEl.value;
            if (searchValue) {
                const regEx = new SearchEvery(searchValue);
                for (const el of all) {
                    const value = getFilterText(el);
                    if (regEx.test(value)) {
                        el.classList.remove("hidden");
                        if (el.formField) {
                            el.formField.hidden = false;
                        }
                    } else {
                        el.classList.add("hidden");
                        if (el.formField) {
                            el.formField.hidden = true;
                        }
                    }
                }
                for (const el of sections) {
                    const children = el.querySelectorAll(":scope [name]:not(emc-form-section):not(option)");
                    if (Array.from(children).some((ch) => !ch.classList.contains("hidden"))) {
                        el.classList.remove("hidden");
                        const connectedTreeNode = TreeNode.getByConnectedNode(el)[0];
                        if (connectedTreeNode != null) {
                            connectedTreeNode.style.display = "";
                        }
                        continue;
                    }
                    el.classList.add("hidden");
                    const connectedTreeNode = TreeNode.getByConnectedNode(el)[0];
                    if (connectedTreeNode != null) {
                        connectedTreeNode.style.display = "none";
                    }
                }
            } else {
                for (const el of all) {
                    el.classList.remove("hidden");
                    if (el.formField) {
                        el.formField.hidden = false;
                    }
                }
                for (const el of sections) {
                    el.classList.remove("hidden");
                    const connectedTreeNode = TreeNode.getByConnectedNode(el)[0];
                    if (connectedTreeNode != null) {
                        connectedTreeNode.style.display = "";
                    }
                }
            }
        }, true);
    }

    #initFormHandlers() {
        this.#formContext.addEventListener("submit", () => {
            const ev = new Event("submit");
            ev.data = this.getValuesFlat();
            ev.formData = this.getValues();
            ev.hiddenData = this.getFormHiddenData();
            ev.changes = this.getChanges();
            ev.errors = this.getErrors();
            this.dispatchEvent(ev);
        });
        this.#formContext.addEventListener("reset", () => {
            this.dispatchEvent(new Event("cancel"));
        });
        this.#formContext.addEventListener("error", (event) => {
            const {errors} = event;
            const ev = new Event("error");
            ev.errors = errors;
            this.dispatchEvent(ev);
        });
        this.#formContext.addEventListener("validity", (event) => {
            const ev = new Event("validity");
            ev.value = event.value;
            ev.valid = event.valid;
            ev.message = event.message;
            ev.name = event.name;
            ev.fieldId = event.fieldId;
            ev.element = event.element;
            this.dispatchEvent(ev);
        });
    }

    set caption(value) {
        this.setStringAttribute("caption", value);
    }

    get caption() {
        return this.getStringAttribute("caption");
    }

    set type(value) {
        this.setStringAttribute("type", value);
    }

    get type() {
        return this.getStringAttribute("type");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "caption",
            "type"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "caption": {
                if (oldValue != newValue) {
                    this.#titleTextEl.i18nValue = newValue;
                }
            } break;
            case "type": {
                if (oldValue != newValue) {
                    if (newValue === "modal") {
                        this.#focusTopEl.setAttribute("tabindex", "0");
                        this.#focusBottomEl.setAttribute("tabindex", "0");
                    } else {
                        this.#focusTopEl.removeAttribute("tabindex");
                        this.#focusBottomEl.removeAttribute("tabindex");
                    }
                }
            } break;
        }
    }

    loadConfig(config, defaultValues) {
        FormBuilder.replaceForm(this.#settingsFormEl, config, defaultValues);
    }

    setValues(values, merge = false) {
        this.#formContext.setData(values, merge);
    }

    setValuesFlat(values, merge = false) {
        this.#formContext.setDataFlat(values, merge);
    }

    getValues() {
        return this.#formContext.getData();
    }

    getValuesFlat() {
        return this.#formContext.getDataFlat();
    }

    getErrors() {
        return this.#formContext.getErrors();
    }

    getFormHiddenData() {
        return this.#formContext.getFormHiddenData();
    }

    getChanges() {
        return this.#formContext.getChanges();
    }

    submit() {
        this.#formContext.submit();
    }

    cancel() {
        this.#formContext.reset();
    }

    initialFocus() {
        this.#searchEl.focus();
    }

    focusFirst() {
        const panelWidth = this.clientWidth;
        if (panelWidth < 800) {
            this.#hamburgerEl.focus();
        } else {
            this.#searchEl.focus();
        }
    }

    focusLast() {
        const inputEls = this.#settingsFormEl.querySelectorAll("[name]");
        if (inputEls.length > 0) {
            inputEls.at(-1).focus();
        } else {
            this.#formSectionNavigationEl.focus();
        }
    }

    setErrorButton(errorButtonEl) {
        this.#errorButtonManager.setErrorButton(errorButtonEl);
    }

}

customElements.define("emc-settings-panel", SettingsPanel);
