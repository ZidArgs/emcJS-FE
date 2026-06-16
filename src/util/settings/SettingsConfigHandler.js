import {immute} from "@emcjs/core/data/Immutable.js";
import OptionGroupRegistry from "../../registry/form/OptionGroupRegistry.js";
import SettingsDefaultValues from "../../data/settings/SettingsDefaultValues.js";

// TODO make SettingsConfigHandler react to changes to OptionGroupRegistry if a optiongroup has been used
export default class SettingsConfigHandler {

    #typeMembers = new Map();

    #settingsConfig;

    #defaultValues;

    #combinedFields = new Map();

    #combinedFieldKeys = new Map();

    #optionGroupKeys = new Map();

    constructor(config, getLabel) {
        const translated = this.#translateSettings(config);
        const converted = buildSettingsConfig(translated, getLabel);
        this.#settingsConfig = immute(converted);
        this.#defaultValues = new SettingsDefaultValues(config);
    }

    get config() {
        return this.#settingsConfig;
    }

    get defaultValues() {
        return this.#defaultValues;
    }

    convertToFormData(data) {
        const result = {};
        dataLoop: for (const [key, value] of Object.entries(data)) {
            if (value == null) {
                continue;
            }
            if (this.#combinedFieldKeys.has(key)) {
                const vKey = this.#combinedFieldKeys.get(key);
                result[vKey] = result[vKey] ?? [];
                if (value) {
                    result[vKey].push(key);
                }
                continue;
            }
            for (const [optionGrouupRegistry, vKey] of this.#optionGroupKeys) {
                if (optionGrouupRegistry.has(key)) {
                    if (value) {
                        result[vKey] = result[vKey] ?? [];
                        result[vKey].push(key);
                    }
                    continue dataLoop;
                }
            }
            result[key] = value;
            continue;
        }
        return result;
    }

    convertFromFormData(data) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            if (value == null) {
                continue;
            }
            if (this.#combinedFields.has(key)) {
                if (Array.isArray(value)) {
                    const valueList = this.#combinedFields.get(key);
                    if (valueList instanceof OptionGroupRegistry) {
                        for (const [vKey] of valueList) {
                            result[vKey] = value.includes(vKey);
                        }
                    } else if (Array.isArray(valueList)) {
                        for (const vKey of valueList) {
                            result[vKey] = value.includes(vKey);
                        }
                    } else {
                        for (const vKey in valueList) {
                            result[vKey] = value.includes(vKey);
                        }
                    }
                    continue;
                }
            }
            result[key] = value;
            continue;
        }
        return result;
    }

    #translateSettings(config) {
        const translatedConfig = {};

        for (const [key, value] of Object.entries(config)) {
            const {
                category, ...config
            } = value;
            const translatedInput = translateInputField(key, config);
            this.#addTypeMember(config.type, key);
            if (translatedInput !== false) {
                if (category) {
                    translatedConfig[`${category}::${key}`] = translatedInput;
                } else {
                    translatedConfig[key] = translatedInput;
                }
            }
            if (config.type === "list") {
                if (translatedInput.options) {
                    this.#combinedFields.set(key, translatedInput.options);
                    if (Array.isArray(translatedInput.options)) {
                        for (const vKey of translatedInput.options) {
                            this.#combinedFieldKeys.set(vKey, key);
                        }
                    } else {
                        for (const vKey in translatedInput.options) {
                            this.#combinedFieldKeys.set(vKey, key);
                        }
                    }
                } else if (translatedInput.optiongroup) {
                    const optionGroupRegistry = new OptionGroupRegistry(translatedInput.optiongroup);
                    this.#combinedFields.set(key, optionGroupRegistry);
                    this.#optionGroupKeys.set(optionGroupRegistry, key);
                }
            }
        }

        return translatedConfig;
    }

    #addTypeMember(type, name) {
        if (!this.#typeMembers.has(type)) {
            this.#typeMembers.set(type, new Set());
        }
        this.#typeMembers.get(type).add(name);
    }

    getTypeMembers(type) {
        return [...this.#typeMembers.get(type) ?? []];
    }

}

// translate
function translateInputField(name, config) {
    if (config.type === "hidden" || config.type.startsWith("-")) {
        return false;
    }
    switch (config.type) {
        case "caption": {
            return `<h3 style="margin: 6px 6px 2px;"><emc-i18n-label i18n-value="${name}"></emc-i18n-label></h3>`;
        }
        case "number":
        case "NumberInput": {
            return createNumberField("NumberInput", config.desc, config.default, config.visible, config.resettable, config.min, config.max);
        }
        case "range":
        case "RangeInput": {
            return createNumberField("RangeInput", config.desc, config.default, config.visible, config.resettable, config.min, config.max);
        }
        case "choice":
        case "SimpleSelect": {
            return createSelectField(config.desc, config.default, config.visible, config.resettable, config.values);
        }
        case "list":
        case "ListSelect": {
            return createListField(config.desc, config.default, config.visible, config.resettable, config.values);
        }
        case "string": {
            return createGenericField("StringInput", config.desc, config.default, config.visible, config.resettable);
        }
        case "check": {
            return createGenericField("SwitchInput", config.desc, config.default, config.visible, config.resettable);
        }
        case "color": {
            return createGenericField("ColorInput", config.desc, config.default, config.visible, config.resettable);
        }
        case "hotkey": {
            return createGenericField("KeyBindInput", config.desc, config.default, config.visible, config.resettable);
        }
        default: {
            return createGenericField(config.type, config.desc, config.default, config.visible, config.resettable);
        }
    }
}

function createGenericField(type, description, value, visible, resettable) {
    const result = {type};
    if (description != null) {
        result.description = description;
    }
    if (value != null) {
        result.value = value;
    }
    if (visible != null) {
        result.visible = visible;
    }
    if (resettable === true) {
        result.controlButtons = ["reset"];
    }
    return result;
}

function createNumberField(type, description, value, visible, resettable, min, max) {
    const result = createGenericField(type, description, value, visible, resettable);
    result.required = true;
    min = parseFloat(min);
    if (!isNaN(min)) {
        result.min = min;
    }
    max = parseFloat(max);
    if (!isNaN(max)) {
        result.max = max;
    }
    return result;
}

function createSelectField(description, value, visible, resettable, options) {
    const result = createGenericField("SimpleSelect", description, value, visible, resettable);
    if (typeof options === "string") {
        result.optiongroup = options;
    } else {
        result.options = translateInputOptions(options);
    }
    return result;
}

function createListField(description, value, visible, resettable, options) {
    const result = createGenericField("ListSelect", description, value, visible, resettable);
    result.multiple = true;
    if (typeof options === "string") {
        result.optiongroup = options;
    } else {
        result.options = translateInputOptions(options);
    }
    return result;
}

function translateInputOptions(options) {
    if (Array.isArray(options)) {
        const res = {};
        for (const entry of options) {
            res[entry] = entry;
        }
        return res;
    }
    return options;
}

// build config
function buildSettingsConfig(config, getLabel = (label) => label) {
    const sectionMap = new Map();
    const translatedConfig = [];

    for (const [key, value] of Object.entries(config)) {
        const path = key.split("::");
        const name = path.pop();
        if (path.length) {
            const sectionName = path.join(".");
            const sectionConfig = getOrCreateSection(translatedConfig, sectionMap, sectionName);
            if (typeof value === "string") {
                sectionConfig.children.push(value);
            } else {
                const label = getLabel(name);
                sectionConfig.children.push({
                    label,
                    name,
                    ...value
                });
            }
        } else {
            const label = getLabel(name);
            translatedConfig.push({
                label,
                name,
                ...value
            });
        }
    }

    return translatedConfig;
}

function getOrCreateSection(translatedConfig, sectionMap, sectionName) {
    if (sectionMap.has(sectionName)) {
        return sectionMap.get(sectionName);
    }
    const newSection = {
        type: "Section",
        label: sectionName,
        children: []
    };
    const path = sectionName.split(".");
    if (path.length > 1) {
        /* const currentName =  */path.pop();
        const parentName = path.join(".");
        const parentSection = getOrCreateSection(translatedConfig, sectionMap, parentName);

        parentSection.children.push(newSection);
        sectionMap.set(sectionName, newSection);
        return newSection;
    }
    sectionMap.set(sectionName, newSection);
    translatedConfig.push(newSection);
    return newSection;
}
