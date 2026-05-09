export function parse(searchString) {
    if (typeof searchString === "string" && searchString !== "") {
        return Object.fromEntries(searchString.slice(1).split("&").map((v) => v.split("=")));
    }
}

export function stringify(dict) {
    if (typeof dict === "object" && !Array.isArray(dict)) {
        const res = [];
        for (const key in dict) {
            res.push(`${key}=${dict[key] ?? ""}`);
        }
        return `?${res.join("&")}`;
    }
    return "";
}
