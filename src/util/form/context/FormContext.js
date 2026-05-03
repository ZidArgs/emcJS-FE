import ObservableStorage from "@emcjs/core/data/storage/observable/ObservableStorage.js";
import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import {
    elevateObject, getFromObjectByPath
} from "@emcjs/core/util/helper/collection/ObjectContent.js";
import {instanceOfOne} from "@emcjs/core/util/helper/Class.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import AbstractFormElement from "../../../ui/form/element/AbstractFormElement.js";
import FormContainer from "../../../ui/form/FormContainer.js";
import MutationObserverManager from "../../observer/manager/MutationObserverManager.js";
import FormInputContext from "./FormInputContext.js";
import FormElementContext from "./FormElementContext.js";

const FORM_ELEMENTS = [
    HTMLInputElement,
    HTMLSelectElement,
    HTMLTextAreaElement
];

const INPUT_TYPE_BLACKLIST = [
    "button",
    "sumbit",
    "reset",
    "image"
];

const MUTATION_CONFIG = {
    childList: true,
    subtree: true
};

const REGISTERED_FORMS = new WeakMap();

export default class FormContext extends EventTarget {

    #dataStorage = new ObservableStorage();

    #validators = new Set();

    #formElList = new Set();

    #formEventManager = new EventMultiTargetManager();

    #storageEventTargetManager = new EventTargetManager();

    #formFieldContextList = new Set();

    #ghostInvisible = false;

    #allowEnter = false;

    #hideErrors = null;

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type == "childList") {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) {
                        this.#registerNodeRecursive(node);
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (node instanceof HTMLElement) {
                        this.#unregisterNodeRecursive(node);
                    }
                }
            }
        }
    });

    constructor(initValues = {}) {
        super();
        this.#formEventManager.set("keydown", (event) => {
            if (event.keyCode === 13) {
                if (this.#allowEnter) {
                    this.submit();
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        this.#formEventManager.set("submit", (event) => {
            this.submit();
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.#formEventManager.set("reset", (event) => {
            this.reset();
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.#formEventManager.set("validity", (event) => {
            const ev = new Event("validity");
            ev.value = event.value;
            ev.valid = event.valid;
            ev.message = event.message;
            ev.name = event.name;
            ev.fieldId = event.fieldId;
            ev.element = event.target;
            this.dispatchEvent(ev);
        });
        /* --- */
        this.#dataStorage.deserialize(initValues);
        this.#storageEventTargetManager.switchTarget(this.#dataStorage);
        this.#storageEventTargetManager.set("clear", (event) => {
            const ev = new Event("clear");
            ev.data = elevateObject(event.data);
            this.dispatchEvent(ev);
        });
        this.#storageEventTargetManager.set("change", (event) => {
            const ev = new Event("change");
            ev.data = elevateObject(event.data);
            ev.changes = elevateObject(event.changes);
            this.dispatchEvent(ev);
        });
        this.#storageEventTargetManager.set("load", (event) => {
            const ev = new Event("load");
            ev.data = elevateObject(event.data);
            this.dispatchEvent(ev);
        });
    }

    async submit() {
        const errorFields = await this.revalidate();
        if (errorFields.length) {
            const ev = new Event("error");
            ev.errors = errorFields;
            this.dispatchEvent(ev);
            errorFields[0].element.focus();
            return false;
        }
        /* --- */
        const ev = new Event("submit");
        ev.data = this.getDataFlat();
        ev.formData = this.getFormFieldsData();
        ev.hiddenData = this.getFormHiddenData();
        ev.changes = this.getChanges();
        ev.errors = this.getErrors();
        this.dispatchEvent(ev);
        return true;
    }

    acceptChanges() {
        this.#dataStorage.flushChanges();
    }

    addValidator(validator) {
        if (typeof validator === "function" && !this.#validators.has(validator)) {
            this.#validators.add(validator);
            this.revalidate();
        }
    }

    removeValidator(validator) {
        if (typeof validator === "function" && this.#validators.has(validator)) {
            this.#validators.remove(validator);
            this.revalidate();
        }
    }

    async revalidate() {
        const validations = [];
        for (const validator of this.#validators) {
            validations.push(this.#doGlobalValidation(validator));
        }
        for (const formEl of this.#formElList) {
            if (!formEl.noValidate) {
                for (const node of formEl.elements) {
                    if (node instanceof AbstractFormElement) {
                        validations.push(this.#doFormFieldValidation(node));
                    } else if (!node.reportValidity()) {
                        validations.push(Promise.resolve({
                            name: node.name,
                            label: node.label,
                            element: node,
                            errors: [node.validationMessage]
                        }));
                    }
                }
            }
        }
        const errors = await Promise.all(validations);
        return errors.filter((e) => e != null);
    }

    async #doGlobalValidation(validator) {
        const message = await validator(this.getFormFieldsData());
        if (typeof message === "string" && message !== "") {
            return {
                name: null,
                element: null,
                errors: [message]
            };
        }
    }

    async #doFormFieldValidation(fieldEl) {
        if (!fieldEl.noValidate) {
            const errors = await fieldEl.revalidate();
            if (errors.length) {
                return {
                    name: fieldEl.name,
                    element: fieldEl,
                    errors
                };
            }
        }
    }

    reset() {
        this.#dataStorage.purgeChanges();
        this.dispatchEvent(new Event("reset"));
    }

    set ghostInvisible(value) {
        this.#ghostInvisible = !!value;
    }

    get ghostInvisible() {
        return this.#ghostInvisible;
    }

    set allowEnter(value) {
        this.#allowEnter = !!value;
    }

    get allowEnter() {
        return this.#allowEnter;
    }

    registerFormContainer(formContainerEl) {
        if (!(formContainerEl instanceof FormContainer)) {
            throw new TypeError("FormContainer expected");
        }
        const allFormEls = formContainerEl.querySelectorAll("form");
        for (const formEl of allFormEls) {
            this.registerForm(formEl);
        }
    }

    unregisterFormContainer(formContainerEl) {
        if (!(formContainerEl instanceof FormContainer)) {
            throw new TypeError("FormContainer expected");
        }
        const allFormEls = formContainerEl.querySelectorAll("form");
        for (const formEl of allFormEls) {
            this.unregisterForm(formEl);
        }
    }

    registerForm(formEl) {
        if (!(formEl instanceof HTMLFormElement)) {
            throw new TypeError("HTMLFormElement expected");
        }
        if (!this.#formElList.has(formEl)) {
            if (REGISTERED_FORMS.has(formEl)) {
                throw new Error("form is already registered to another FormContext");
            }
            REGISTERED_FORMS.set(formEl, this);
            this.#formElList.add(formEl);
            this.#formEventManager.addTarget(formEl);
            this.#mutationObserver.observe(formEl);
            for (const node of formEl.children) {
                this.#registerNodeRecursive(node);
            }
        }
    }

    unregisterForm(formEl) {
        if (!(formEl instanceof HTMLFormElement)) {
            throw new TypeError("HTMLFormElement expected");
        }
        if (!this.#formElList.has(formEl)) {
            throw new Error("form is not registered to this FormContext");
        }
        this.#formEventManager.removeTarget(formEl);
        this.#mutationObserver.unobserve(formEl);
        for (const node of formEl.children) {
            this.#unregisterNodeRecursive(node);
        }
        REGISTERED_FORMS.delete(formEl, this);
        this.#formElList.delete(formEl);
    }

    setData(data, merge = false) {
        const res = {};
        for (const context of this.#formFieldContextList) {
            const name = context.node.name;
            if (name != null) {
                const value = getFromObjectByPath(data, name.split("."));
                if (value != null) {
                    res[name] = value;
                }
            }
        }
        this.setDataFlat(res, merge);
    }

    setDataFlat(data, merge = false) {
        this.#formEventManager.active = false;
        if (merge) {
            this.#dataStorage.setAll(data);
        } else {
            this.#dataStorage.deserialize(data);
        }
        this.#formEventManager.active = true;
    }

    getData() {
        return elevateObject(this.getDataFlat());
    }

    getDataFlat() {
        return this.#dataStorage.getAll();
    }

    getInternalFormData() {
        const res = {};
        for (const formEl of this.#formElList) {
            const data = extractFormData(formEl);
            for (const key in data) {
                res[key] = data[key];
            }
        }
        return res;
    }

    getFormFieldsData() {
        const res = {};
        for (const context of this.#formFieldContextList) {
            if (!context.node.disabled) {
                res[context.node.name] = context.node.getSubmitValue();
            }
        }
        return res;
    }

    getFormHiddenData() {
        const res = {};
        for (const formEl of this.#formElList) {
            const all = formEl.querySelectorAll("input[type=\"hidden\"][name]");
            for (const el of all) {
                const name = el.getAttribute("name");
                if (name != null) {
                    const value = el.getAttribute("value") ?? "";
                    res[name] = value;
                }
            }
        }
        return res;
    }

    hasChanges() {
        return this.#dataStorage.hasChanges();
    }

    getChanges() {
        return this.#dataStorage.getChanges();
    }

    getFormValidity() {
        for (const formEl of this.#formElList) {
            if (!formEl.checkValidity()) {
                return false;
            }
        }
        return true;
    }

    set hideErrors(value) {
        if (value != null) {
            value = !!value;
        }
        if (this.#hideErrors !== value) {
            this.#hideErrors = value;
            for (const context of this.#formFieldContextList) {
                context.globalHideErrors = value;
            }
        }
    }

    get hideErrors() {
        return this.#hideErrors;
    }

    getErrors() {
        const res = [];
        for (const context of this.#formFieldContextList) {
            if (context.errors.length) {
                res.push({
                    name: context.node.name,
                    errors: context.errors,
                    element: context.node
                });
            }
        }
        return res;
    }

    #registerNodeRecursive(node) {
        this.#registerNode(node);
        for (const subNode of node.children) {
            this.#registerNodeRecursive(subNode);
        }
    }

    #unregisterNodeRecursive(node) {
        this.#unregisterNode(node);
        for (const subNode of node.children) {
            this.#unregisterNodeRecursive(subNode);
        }
    }

    #registerNode(node) {
        if (node instanceof AbstractFormElement) {
            const context = FormElementContext.getContext(node);
            context.storage = this.#dataStorage;
            context.ghostInvisible = this.#ghostInvisible;
            this.#formFieldContextList.add(context);
            node.addValidator(this.#doGlobalValidationFromField);
            node.formContextAssociatedCallback(this);
            if (this.#hideErrors != null) {
                node.hideErrors = this.#hideErrors;
            }
            // this.#doFormFieldValidation(node);
        } else if (instanceOfOne(node, ...FORM_ELEMENTS) && !INPUT_TYPE_BLACKLIST.includes(node.type)) {
            const context = FormInputContext.getContext(node);
            context.storage = this.#dataStorage;
            context.ghostInvisible = this.#ghostInvisible;
        }
    }

    #unregisterNode(node) {
        if (node instanceof AbstractFormElement) {
            const context = FormElementContext.getContext(node);
            context.storage = null;
            context.ghostInvisible = false;
            this.#formFieldContextList.delete(context);
            node.removeValidator(this.#doGlobalValidationFromField);
        } else if (instanceOfOne(node, ...FORM_ELEMENTS) && !INPUT_TYPE_BLACKLIST.includes(node.type)) {
            const context = FormInputContext.getContext(node);
            context.storage = null;
            context.ghostInvisible = false;
        }
    }

    #doGlobalValidationFromField = debounce(() => {
        for (const validator of this.#validators) {
            this.#doGlobalValidation(validator);
        }
    });

    findFields(callback) {
        const res = [];
        for (const context of this.#formFieldContextList) {
            if (callback(context.node)) {
                res.push(context.node);
            }
        }
        return res;
    }

    findFieldsByName(name) {
        const res = [];
        for (const context of this.#formFieldContextList) {
            if (context.node.name === name) {
                res.push(context.node);
            }
        }
        return res;
    }

    findFieldContexts(callback) {
        const res = [];
        for (const context of this.#formFieldContextList) {
            if (callback(context)) {
                res.push(context);
            }
        }
        return res;
    }

}

export function extractFormData(formEl) {
    const formData = new FormData(formEl);
    return Object.fromEntries(formData.entries());
}
