export function beforeUnloadHandler(event) {
    event.preventDefault();
    event.returnValue = true;
    return true;
}
