import {execSync} from "child_process";
import fs from "fs";
import path from "path";
import {resolvePackagePath} from "@emcjs/node/util/package/Package.js";

/* TODO
it would be better to build a simple cdn instead of the full package management

---

the cdn should only hold the packages by name and their versions (cdn.net/${package_name}/${version_tag}/${file_name})
where file_name is one of the following:
- ${package_name}-${version_tag}.tgz
- ${package_name}-${version_tag}.zip
- dist/*

---

releases are available in different formats
- as resource folder for direct usage of the cdn
- as a zip container for easy download
- as a tgz (including the tar container) for npm usage
*/

const __dirname = path.resolve();

{ // copy icon font
    const fontModulePath = resolvePackagePath("@emcjs/icons", __dirname);
    const srcPath = path.resolve(fontModulePath, "dist");
    const fontSrcPath = path.resolve(srcPath, "font");
    const targetPath = path.resolve(__dirname, "src/_style/icons");
    const fontTargetPath = path.resolve(targetPath, "font");
    const cssSrcPathFiles = [
        "emcjs-icons-codes.css",
        "emcjs-icons-font.css"
    ];

    if (fs.existsSync(fontModulePath)) {
        execSync("yarn build", {cwd: fontModulePath});
        if (fs.existsSync(fontSrcPath)) {
            for (const fileName of cssSrcPathFiles) {
                const cssSrcPath = path.resolve(srcPath, fileName);
                const cssTargetPath = path.resolve(targetPath, fileName);
                fs.cpSync(cssSrcPath, cssTargetPath, {force: true});
            }
            fs.cpSync(fontSrcPath, fontTargetPath, {
                recursive: true,
                force: true
            });
        } else {
            throw new Error("icon font not found!");
        }
    } else {
        throw new Error("font module not found!");
    }
}
