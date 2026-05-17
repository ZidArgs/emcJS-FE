import {isNullOrFalse} from "@emcjs/core/util/helper/CheckType.js";
import HTMLTemplate from "../template/HTMLTemplate.js";
import FormElementRegistry from "../../registry/form/FormElementRegistry.js";
import OptionGroupRegistryChoiceManager from "./manager/OptionGroupRegistryChoiceManager.js";
import OptionGroupRegistryValuesManager from "./manager/OptionGroupRegistryValuesManager.js";
import TokenRegistryManager from "./manager/TokenRegistryManager.js";
import {setAttributes} from "../node/NodeAttributes.js";
import {createErrorElement} from "./CreateErrorElement.js";
import {
    FORM_BUTTON_MAPPING, FORM_STRUCTURE_MAPPING
} from "../../loader/FormComponentsLoader.js";
import FormField from "../../ui/form/FormField.js";

export function getFormConfig(ref) {
    const Clazz = FormElementRegistry.getRegisteredClass(ref);
    if (Clazz != null) {
        return [
            {
                "type": "Fieldset",
                "label": "Field Config",
                "children": FormField.formConfigurationFields
            },
            {
                "type": "Fieldset",
                "label": "Element Config",
                "children": Clazz.formConfigurationFields
            }
        ];
    }
    return [];
}

;

class FormBuilder {

    build(config, refLabel = null) {
        if (config != null && !(typeof config === "object")) {
            throw new TypeError("config must be an Object or an array or null");
        }

        const formContainerEl = document.createElement("emc-form-container");

        if (config != null) {
            const {
                forms,
                hasHeader = false,
                hasFooter = false,
                defaultValues = {}
            } = config;

            let firstFormEl;
            let lastFormEl;

            if (forms != null) {
                if (Array.isArray(forms)) {
                    for (const form of forms) {
                        const {
                            elements, config: formConfig, values
                        } = form;
                        const formEl = this.buildForm(elements, {
                            ...values,
                            ...defaultValues
                        }, formConfig, refLabel);
                        if (firstFormEl == null) {
                            firstFormEl = formEl;
                        }
                        lastFormEl = formEl;
                        formContainerEl.append(formEl);
                    }
                } else {
                    const {
                        elements, config: formConfig, values
                    } = forms;
                    const formEl = this.buildForm(elements, {
                        ...values,
                        ...defaultValues
                    }, formConfig, refLabel);
                    if (firstFormEl == null) {
                        firstFormEl = formEl;
                    }
                    lastFormEl = formEl;
                    formContainerEl.append(formEl);
                }
            } else {
                const {
                    elements, config: formConfig, values
                } = config;
                const formEl = this.buildForm(elements, values, formConfig, refLabel);
                if (firstFormEl == null) {
                    firstFormEl = formEl;
                }
                lastFormEl = formEl;
                formContainerEl.append(formEl);
            }

            if (hasHeader) {
                firstFormEl.setAttribute("slot", "header");
            }
            if (hasFooter && firstFormEl !== lastFormEl) {
                lastFormEl.setAttribute("slot", "footer");
            }
        }

        return formContainerEl;
    }

    buildForm(content, defaultValues, params, refLabel = null) {
        if (content != null && typeof content !== "object") {
            throw new TypeError("content must be an HTMLElement, Object, Array or null");
        }
        if (defaultValues != null && typeof defaultValues !== "object" || Array.isArray(defaultValues)) {
            throw new TypeError("defaultValues must be an Object or null");
        }
        if (params != null && !(typeof params === "object") || Array.isArray(params)) {
            throw new TypeError("params must be an Object or null");
        }

        const formEl = document.createElement("form");

        const {
            allowsInvalid = false,
            data = {},
            ...formParams
        } = params ?? {};

        if (allowsInvalid) {
            formEl.setAttribute("novalidate", "");
        }

        for (const key in data) {
            formEl.dataset[key] = data[key];
        }

        return this.replaceForm(formEl, content, defaultValues, formParams, refLabel);
    }

    replaceForm(formEl, content, defaultValues, params, refLabel = null) {
        if (!(formEl instanceof HTMLFormElement)) {
            throw new TypeError("formEl must be of type HTMLFormElement");
        }
        if (content != null && typeof content !== "object") {
            throw new TypeError("content must be an HTMLElement, Object, Array or null");
        }
        if (defaultValues != null && typeof defaultValues !== "object" || Array.isArray(defaultValues)) {
            throw new TypeError("defaultValues must be an Object or null");
        }
        if (params != null && !(typeof params === "object") || Array.isArray(params)) {
            throw new TypeError("params must be an Object or null");
        }

        formEl.innerHTML = "";

        const {
            submitButton,
            resetButton,
            values = {}
        } = params ?? {};

        this.#applyHiddenValues(formEl, values);
        this.#fillFormComponents(formEl, content, defaultValues, refLabel);

        if (!isNullOrFalse(submitButton) || !isNullOrFalse(resetButton)) {
            const buttonRowEl = document.createElement("emc-form-row");
            buttonRowEl.align = "end";
            if (!isNullOrFalse(resetButton)) {
                if (typeof resetButton === "object") {
                    buttonRowEl.append(this.#createFormButton("ResetButton", null, true, true, resetButton));
                } else if (typeof resetButton === "string") {
                    buttonRowEl.append(this.#createFormButton("ResetButton", null, true, true, {text: resetButton}));
                } else if (resetButton === true) {
                    buttonRowEl.append(this.#createFormButton("ResetButton", null, true, true, {}));
                }
            }
            if (!isNullOrFalse(submitButton)) {
                if (typeof submitButton === "object") {
                    buttonRowEl.append(this.#createFormButton("SubmitButton", null, true, true, submitButton));
                } else if (typeof submitButton === "string") {
                    buttonRowEl.append(this.#createFormButton("SubmitButton", null, true, true, {text: submitButton}));
                } else if (submitButton === true) {
                    buttonRowEl.append(this.#createFormButton("SubmitButton", null, true, true, {}));
                }
            }
            formEl.append(buttonRowEl);
        }

        return formEl;
    }

    #applyHiddenValues(containerEl, values) {
        if (!(containerEl instanceof HTMLElement)) {
            throw new TypeError("containerEl must be of type HTMLElement");
        }
        if (typeof values !== "object" || Array.isArray(values)) {
            throw new TypeError("values must be an Object");
        }
        for (const key in values) {
            const value = values[key];
            const hiddenEl = document.createElement("input");
            hiddenEl.setAttribute("type", "hidden");
            hiddenEl.setAttribute("name", key);
            if (typeof value === "object") {
                hiddenEl.setAttribute("value", JSON.stringify(value ?? ""));
            } else {
                hiddenEl.setAttribute("value", value ?? "");
            }
            containerEl.append(hiddenEl);
        }
    }

    #fillFormComponents(containerEl, content, defaultValues, refLabel = null) {
        if (!(containerEl instanceof HTMLElement)) {
            throw new TypeError("containerEl must be of type HTMLElement");
        }
        if (defaultValues != null && typeof defaultValues !== "object" || Array.isArray(defaultValues)) {
            throw new TypeError("defaultValues must be an Object or null");
        }
        if (content != null) {
            if (Array.isArray(content)) {
                for (const config of content) {
                    this.#fillFormComponent(containerEl, config, defaultValues, refLabel);
                }
            } else {
                this.#fillFormComponent(containerEl, content, defaultValues, refLabel);
            }
        }
    }

    #fillFormComponent(containerEl, config, defaultValues, refLabel = null) {
        if ((typeof config !== "object" || Array.isArray(config)) && typeof config !== "string") {
            throw new TypeError("config must be an HTMLElement, Object or String");
        }
        if (config instanceof HTMLElement) {
            containerEl.append(config);
        } else if (typeof config === "string") {
            containerEl.append(HTMLTemplate.generate(config));
        } else {
            containerEl.append(this.#createFormComponent(config, defaultValues ?? {}, refLabel));
        }
    }

    createFormComponent(config, defaultValues = {}, refLabel = null) {
        return this.#createFormComponent(config, defaultValues, refLabel);
    }

    replaceFormComponent(oldFormEl, config, defaultValues = {}, refLabel = null) {
        const newFormEl = this.#createFormComponent(config, defaultValues, refLabel);
        oldFormEl.replaceWith(newFormEl);
        return newFormEl;
    }

    #createFormComponent(config = {}, defaultValues = {}, refLabel = null) {
        const {
            type, id, visible, enabled, editable, data, ...params
        } = config;
        if (FORM_STRUCTURE_MAPPING.has(type)) {
            return this.#createFormStructure(type, id, visible, enabled, params, data, defaultValues, refLabel);
        }
        if (FORM_BUTTON_MAPPING.has(type)) {
            return this.#createFormButton(type, id, visible, enabled, params, data);
        }
        return this.#createFormElement(type, id, visible, enabled, editable, params, data, defaultValues, refLabel);
    }

    #createFormStructure(type, id, visible, enabled, params = {}, data = {}, defaultValues = {}, refLabel = null) {
        const Clazz = FORM_STRUCTURE_MAPPING.get(type);
        if (Clazz != null) {
            const {
                children, ...restParams
            } = params;
            const el = this.#createElementFromClass(Clazz, restParams);
            if (id != null) {
                el.id = id;
            }
            for (const key in data) {
                el.dataset[key] = data[key];
            }
            if (visible != null) {
                el.setAttribute("visible", JSON.stringify(visible));
            }
            if (enabled != null) {
                el.setAttribute("enabled", JSON.stringify(enabled));
            }
            this.#fillFormComponents(el, children, defaultValues, refLabel);
            return el;
        } else {
            return createErrorElement(type);
        }
    }

    #createFormButton(type, id, visible, enabled, params = {}, data = {}) {
        const Clazz = FORM_BUTTON_MAPPING.get(type);
        if (Clazz != null) {
            const el = this.#createElementFromClass(Clazz, params);
            if (id != null) {
                el.id = id;
            }
            for (const key in data) {
                el.dataset[key] = data[key];
            }
            if (visible != null) {
                el.setAttribute("visible", JSON.stringify(visible));
            }
            if (enabled != null) {
                el.setAttribute("enabled", JSON.stringify(enabled));
            }
            return el;
        } else {
            return createErrorElement(type);
        }
    }

    #createFormElement(type, id, visible, enabled, editable, config = {}, data = {}, defaultValues = {}, refLabel = null) {
        const {
            value,
            optiongroup,
            valueoptiongroup,
            tokengroup,
            label,
            tooltop,
            description,
            subtext,
            controlButtons,
            hideErrors,
            noHover,
            noPad,
            ...params
        } = config;
        const el = FormElementRegistry.create(type, params, refLabel);
        if (id != null) {
            el.id = id;
        }
        for (const key in data) {
            el.dataset[key] = data[key];
        }
        if (visible != null) {
            el.setAttribute("visible", JSON.stringify(visible));
        }
        if (enabled != null) {
            el.setAttribute("enabled", JSON.stringify(enabled));
        }
        if (editable != null) {
            el.setAttribute("editable", JSON.stringify(editable));
        }
        // default value
        if (params.name != null && defaultValues[params.name] != null) {
            const value = defaultValues[params.name];
            if (typeof value === "object") {
                el.setAttribute("value", JSON.stringify(value));
            } else {
                el.setAttribute("value", value);
            }
        } else if (value != null) {
            if (typeof value === "object") {
                el.setAttribute("value", JSON.stringify(value));
            } else {
                el.setAttribute("value", value);
            }
        } else {
            el.removeAttribute("value");
        }
        // group managers
        if (optiongroup != null) {
            const manager = new OptionGroupRegistryChoiceManager(el);
            manager.optionGroup = optiongroup;
        }
        if (valueoptiongroup != null) {
            const manager = new OptionGroupRegistryValuesManager(el);
            manager.optionGroup = optiongroup;
        }
        if (tokengroup != null) {
            const manager = new TokenRegistryManager(el);
            manager.tokenGroup = tokengroup;
        }
        // field
        const fieldEl = new FormField();
        if (label != null) {
            fieldEl.label = label;
        }
        if (tooltop != null) {
            fieldEl.tooltop = tooltop;
        }
        if (description != null) {
            fieldEl.description = description;
        }
        if (subtext != null) {
            fieldEl.subtext = subtext;
        }
        if (controlButtons != null) {
            fieldEl.controlButtons = controlButtons;
        }
        if (hideErrors != null) {
            fieldEl.hideErrors = hideErrors;
        }
        if (noHover != null) {
            fieldEl.noHover = noHover;
        }
        if (noPad != null) {
            fieldEl.noPad = noPad;
        }
        fieldEl.append(el);
        return fieldEl;
    }

    #createElementFromClass(Clazz, params) {
        if (Clazz != null) {
            if ("fromConfig" in Clazz) {
                return Clazz.fromConfig(params);
            }
            const el = new Clazz();
            setAttributes(el, params);
            return el;
        }
    }

}

export default new FormBuilder();
