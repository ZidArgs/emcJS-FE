export function getComputedStyleProperties(element, styleProperties = []) {
    const result = {};
    const elementStyle = getComputedStyle(element);
    for (const property of styleProperties) {
        result[property] = elementStyle.getPropertyValue(property);
    }
    return result;
}
