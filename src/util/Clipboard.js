export async function copyToClipboard(text) {
    return await modernCopy(text) || legacyCopy(text);
}

async function modernCopy(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // ignore
        }
    }
    return false;
}

// Fallback for insecure contexts
function legacyCopy(text) {
    let success = false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        success = document.execCommand("copy");
    } catch {
        success = false;
    } finally {
        document.body.removeChild(textarea);
    }
    return success;
}
