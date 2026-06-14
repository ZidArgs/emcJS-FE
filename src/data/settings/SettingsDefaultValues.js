import {immute} from "@emcjs/core/data/Immutable.js";
import OptionGroupRegistry from "../../registry/form/OptionGroupRegistry.js";

const SET_TYPES = [
    "list",
    "-list"
];

export default class SettingsDefaultValues {

    #unresolvedDefaults;

    #defaults = new Map();

    constructor(settingsConfig) {
        const unresolvedDefaults = this.#resolveDefaults(settingsConfig);
        this.#unresolvedDefaults = immute(unresolvedDefaults);
    }

    get unresolved() {
        return this.#unresolvedDefaults;
    }

    has(key) {
        return this.#defaults.has(key);
    }

    get(key) {
        return this.#defaults.get(key);
    }

    getAll() {
        const res = {};
        for (const [key, value] of this.#defaults) {
            res[key] = value;
        }
        return res;
    }

    keys() {
        return this.#defaults.keys();
    }

    [Symbol.iterator]() {
        return this.#defaults[Symbol.iterator]();
    }

    #resolveDefaults(settingsConfig) {
        const unresolvedDefaults = {};
        for (const [key, value] of Object.entries(settingsConfig)) {
            unresolvedDefaults[key] = value.default;
            if (SET_TYPES.indexOf(value.type) >= 0) {
                this.#resolveOptionValues(value.values, value.default);
            } else {
                this.#defaults.set(key, value.default);
            }
        }
        return unresolvedDefaults;
    }

    #resolveOptionValues(values, defaultValues) {
        const defaultValueSet = new Set(defaultValues);
        if (values != null) {
            if (typeof values === "object") {
                if (!Array.isArray(values)) {
                    values = Object.keys(values);
                }
                for (const el of values) {
                    this.#defaults.set(el, defaultValueSet.has(el));
                }
            } else {
                this.#resolveOptionGroupForList(values, defaultValueSet);
            }
        }
        return values;
    }

    #resolveOptionGroupForList(name, defaultValues) {
        const optionGroupRegistry = new OptionGroupRegistry(name);
        optionGroupRegistry.addEventListener("change", () => {
            this.#extractOptionGroupValuesForList(optionGroupRegistry, defaultValues);
        });
        this.#extractOptionGroupValuesForList(optionGroupRegistry, defaultValues);
    }

    #extractOptionGroupValuesForList(optionGroupRegistry, defaultValues) {
        for (const [key] of optionGroupRegistry) {
            this.#defaults.set(key, defaultValues.has(key));
        }
    }

}
