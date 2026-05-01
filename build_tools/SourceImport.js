import fs from "fs";
import path from "path";
import sourceImport, {registerImportHandler} from "emcjs/build_tools/SourceImport.js";

export default sourceImport;

const HTMLTemplatePath = "util/html/template/HTMLTemplate.js";
const CSSTemplatePath = "util/html/template/CSSTemplate.js";

function normalizePath(path) {
    return path.replace(/\\/g, "/");
}

////////////////////////////////
// register frontend handlers //
////////////////////////////////
registerImportHandler("html", (sourceDir, name, contentPath) => {
    const resolvedPath = path.resolve(sourceDir, contentPath);
    // if the file exists
    if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath).toString();
        return `const ${name} = new Template(\`\n${fileContent.replace(/\\/g, "\\\\").split("\n").map((l) => `    ${l}`).join("\n")}\n\`);\n`;
    }
    return `throw new Error("the imported file ${resolvedPath} does not exist");\n`;
}, (pathPrefix = "emcJS-FE") => {
    const modulePath = normalizePath(`${pathPrefix}/${HTMLTemplatePath}`);
    return `import Template from "${modulePath}";`;
});

registerImportHandler("css", (sourceDir, name, contentPath) => {
    const resolvedPath = path.resolve(sourceDir, contentPath);
    // if the file exists
    if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath).toString();
        return `const ${name} = new GlobalStyle(\`\n${fileContent.replace(/\\/g, "\\\\").split("\n").map((l) => `    ${l}`).join("\n")}\n\`);\n`;
    }
    return `throw new Error("the imported file ${resolvedPath} does not exist");\n`;
}, (pathPrefix = "emcJS-FE") => {
    const modulePath = normalizePath(`${pathPrefix}/${CSSTemplatePath}`);
    return `import GlobalStyle from "${modulePath}";`;
});
