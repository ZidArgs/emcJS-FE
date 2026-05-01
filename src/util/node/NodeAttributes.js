import {
    isArrayOf, isStringNotEmpty
} from "emcjs/util/helper/CheckType.js";
import {jsonParseSafe} from "emcjs/util/helper/JSON.js";
import {dashedToCamelCase} from "emcjs/util/helper/string/ConvertCase.js";

export function setAttributes(el, attr) {
    const attributeList = el.constructor.attributes ?? [];

    if (!isArrayOf(attributeList, isStringNotEmpty)) {
        throw new Error("can not create form element, class attributes can only be null or an array of strings");
    }

    for (const name in attr) {
        const value = attr[name];
        if (attributeList.includes(name)) {
            el[name] = value;
        } else {
            safeSetAttribute(el, name, value);
        }
    }
}

export function safeSetAttribute(node, name, value) {
    if (value != null) {
        if (typeof value === "object") {
            node.setAttribute(name, JSON.stringify(value));
        } else if (typeof value === "boolean") {
            if (value) {
                node.setAttribute(name, "");
            } else {
                node.removeAttribute(name);
            }
        } else {
            node.setAttribute(name, value);
        }
    } else {
        node.removeAttribute(name);
    }
}

export function getAllAttributes(node) {
    const res = {};
    for (const attr of node.attributes) {
        const attrName = dashedToCamelCase(attr.name);
        res[attrName] = node[attrName] ?? attr.value;
    }
    return res;
}

export function setBooleanAttribute(node, name, value) {
    if (value == null) {
        node.removeAttribute(name);
    } else if (typeof value === "boolean") {
        if (value) {
            node.setAttribute(name, "");
        } else {
            node.removeAttribute(name);
        }
    } else {
        node.setAttribute(name, value);
    }
}

export function getBooleanAttribute(node, name) {
    const value = node.getAttribute(name);
    if (value == null || value === "false") {
        return false;
    }
    if (value === "" || value === "true") {
        return true;
    }
    return value;
}

export function setStringAttribute(node, name, value) {
    if (value == null) {
        node.removeAttribute(name);
    } else {
        node.setAttribute(name, value.toString());
    }
}

export function getStringAttribute(node, name) {
    return node.getAttribute(name);
}

export function setNumberAttribute(node, name, value, min, max) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
        node.removeAttribute(name);
    } else {
        const parsedMin = parseFloat(min) || Number.NEGATIVE_INFINITY;
        const parsedMax = parseFloat(max) || Number.POSITIVE_INFINITY;
        if (parsedMin > parsedMax) {
            throw new Error("min can't be greater than max");
        }
        if (parsedValue < parsedMin) {
            node.setAttribute(name, parsedMin);
        } else if (parsedValue > parsedMax) {
            node.setAttribute(name, parsedMax);
        } else {
            node.setAttribute(name, parsedValue);
        }
    }
}

export function getNumberAttribute(node, name) {
    const value = node.getAttribute(name);
    if (value != null) {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
            return parsedValue;
        }
    }
    return null;
}

export function setIntAttribute(node, name, value, min, max) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
        node.removeAttribute(name);
    } else {
        const parsedMin = parseInt(min) || Number.MIN_SAFE_INTEGER;
        const parsedMax = parseInt(max) || Number.MAX_SAFE_INTEGER;
        if (parsedMin > parsedMax) {
            throw new Error("min can't be greater than max");
        }
        if (parsedValue < parsedMin) {
            node.setAttribute(name, parsedMin);
        } else if (parsedValue > parsedMax) {
            node.setAttribute(name, parsedMax);
        } else {
            node.setAttribute(name, parsedValue);
        }
    }
}

export function getIntAttribute(node, name) {
    const value = node.getAttribute(name);
    if (value != null) {
        const parsedValue = parseInt(value);
        if (!isNaN(parsedValue)) {
            return parsedValue;
        }
    }
    return null;
}

export function setJSONAttribute(node, name, value) {
    if (value == null) {
        node.removeAttribute(name);
    } else {
        if (typeof value === "string") {
            value = jsonParseSafe(value);
        }
        node.setAttribute(name, JSON.stringify(value));
    }
}

export function getJSONAttribute(node, name) {
    try {
        return jsonParseSafe(node.getAttribute(name));
    } catch {
        return null;
    }
}

export function setEnumAttribute(node, name, value, allowedValues) {
    if (value == null || !allowedValues.includes(value)) {
        node.removeAttribute(name);
    } else {
        node.setAttribute(name, value);
    }
}

export function getEnumAttribute(node, name) {
    return node.getAttribute(name);
}

export function setListAttribute(node, name, value, allowedValues) {
    if (value == null) {
        node.removeAttribute(name);
    } else if (Array.isArray(value)) {
        if (value.length === 0) {
            node.removeAttribute(name);
        } else if (allowedValues != null) {
            const acceptedValues = value.filter((val, idx) => allowedValues.includes(val) && value.indexOf(val) === idx);
            node.setAttribute(name, acceptedValues.join(" "));
        } else {
            const acceptedValues = value.filter((val, idx) => value.indexOf(val) === idx);
            node.setAttribute(name, acceptedValues.join(" "));
        }
    } else if (allowedValues == null || allowedValues.includes(value)) {
        node.setAttribute(name, value);
    } else {
        node.removeAttribute(name);
    }
}

export function getListAttribute(node, name) {
    const value = (node.getAttribute(name) ?? "").split(" ");
    return value.filter((val, idx) => isStringNotEmpty(val) && value.indexOf(val) === idx);
}
