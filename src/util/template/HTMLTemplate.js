export default class HTMLTemplate {

    #template;

    constructor(template) {
        this.#template = createTemplate(template);
    }

    generate(substitutions = {}) {
        return generateTemplate(this.#template.content, substitutions);
    }

    apply(target, substitutions = {}) {
        if (target instanceof Document || target instanceof ShadowRoot || target instanceof HTMLElement) {
            target.append(this.generate(substitutions));
        }
    }

    static generate(template, substitutions = {}) {
        if (template instanceof HTMLTemplate) {
            return template.generate(substitutions);
        }
        if (!(template instanceof HTMLTemplateElement)) {
            template = createTemplate(template);
        }
        return generateTemplate(template.content, substitutions);
    }

}

function createTemplate(src) {
    if (src instanceof HTMLTemplateElement) {
        return src;
    }
    const buf = document.createElement("template");
    if (src instanceof NodeList) {
        for (const node of src) {
            buf.content.append(node);
        }
    } else if (src instanceof HTMLElement || src instanceof Node) {
        buf.content.append(src);
    } else if (typeof src === "string") {
        buf.innerHTML = src;
    }
    return buf;
}

function generateTemplate(content, substitutions = {}) {
    const newContent = content.cloneNode(true);
    substituteNodes(newContent.childNodes, prepareSubstitutions(substitutions));
    return document.importNode(newContent, true);
}

function substituteNodes(nodeList, substitutionEntries) {
    if (substitutionEntries.length) {
        for (const node of nodeList) {
            let content;
            if (node.nodeType === Node.ELEMENT_NODE) {
                content = node.innerHTML;
            } else if (node.nodeType === Node.TEXT_NODE) {
                content = node.data;
            }
            if (content == null) {
                continue;
            }
            for (const [matcher, replacer] of substitutionEntries) {
                content = content.replace(matcher, replacer);
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                node.innerHTML = content;
                substituteAttributes(node, substitutionEntries);
            } else if (node.nodeType === Node.TEXT_NODE) {
                node.data = content;
            }
        }
    }
}

function substituteAttributes(node, substitutionEntries) {
    for (const attrName of node.getAttributeNames()) {
        let content = node.getAttribute(attrName);
        for (const [matcher, replacer] of substitutionEntries) {
            content = content.replace(matcher, replacer);
        }
        node.setAttribute(attrName, content);
    }
}

function prepareSubstitutions(substitutions = {}) {
    const res = [];
    for (const name in substitutions) {
        res.push([new RegExp(`\\{\\{${name}\\}\\}`, "g"), substitutions[name]]);
    }
    return res;
}
