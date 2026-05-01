export function extractDefaultValuesFromConfig(formConfig, result) {
    if (typeof result !== "object" || Array.isArray(result)) {
        result = {};
    }
    if (formConfig != null) {
        if (Array.isArray(formConfig)) {
            for (const option of formConfig) {
                extractDefaultValuesFromConfig(option, result);
            }
        } else {
            const {
                name, value, children
            } = formConfig;
            if (name) {
                result[name] = value;
            }
            if (children != null) {
                extractDefaultValuesFromConfig(children, result);
            }
        }
    }
    return result;
}
