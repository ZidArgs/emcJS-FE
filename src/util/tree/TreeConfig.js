export function getFromTreeConfigByRefPath(treeConfig, refPath) {
    if (typeof treeConfig !== "object") {
        throw new TypeError("first parameter must be an object");
    }
    if (!Array.isArray(refPath)) {
        throw new TypeError("second parameter must be an array");
    }
    refPath = Array.from(refPath);
    while (treeConfig != null && refPath.length) {
        treeConfig = treeConfig[refPath.shift()].children;
    }
    return treeConfig;
}
