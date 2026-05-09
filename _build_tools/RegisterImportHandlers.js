import fs from "fs";
import path from "path";
import SourceImport from "@zidargs/buildtools/SourceImport.js";
import {resolvePackageName} from "@zidargs/buildtools/util/ResolvePackage.js";

export const PACKAGE_NAME = resolvePackageName(import.meta.dirname);

const HTMLTemplatePath = "util/template/HTMLTemplate.js";
const CSSTemplatePath = "util/template/CSSTemplate.js";

function normalizePath(path) {
    return path.replace(/\\/g, "/");
}

////////////////////////////////
// register frontend handlers //
////////////////////////////////
SourceImport.registerImportHandler("html", (sourceDir, name, contentPath) => {
    const resolvedPath = path.resolve(sourceDir, contentPath);
    // if the file exists
    if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath).toString();
        return `const ${name} = new Template(\`\n${fileContent.replace(/\\/g, "\\\\").split("\n").map((l) => `    ${l}`).join("\n")}\n\`);\n`;
    }
    return `throw new Error("the imported file ${resolvedPath} does not exist");\n`;
}, () => {
    const modulePath = normalizePath(`${PACKAGE_NAME}/${HTMLTemplatePath}`);
    return `import Template from "${modulePath}";`;
});

SourceImport.registerImportHandler("css", (sourceDir, name, contentPath) => {
    const resolvedPath = path.resolve(sourceDir, contentPath);
    // if the file exists
    if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath).toString();
        return `const ${name} = new GlobalStyle(\`\n${fileContent.replace(/\\/g, "\\\\").split("\n").map((l) => `    ${l}`).join("\n")}\n\`);\n`;
    }
    return `throw new Error("the imported file ${resolvedPath} does not exist");\n`;
}, () => {
    const modulePath = normalizePath(`${PACKAGE_NAME}/${CSSTemplatePath}`);
    return `import GlobalStyle from "${modulePath}";`;
});
