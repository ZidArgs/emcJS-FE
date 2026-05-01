import NotAllowedError from "emcjs/error/NotAllowedError.js";
import NotSupportedError from "emcjs/error/NotSupportedError.js";

/**
 * Implements an easy way to use the Screen Wake Lock API.
 */
export default class WakeLock extends EventTarget {

    #wakeLock;

    /**
     * Test if the Screen Wake Lock API is supported by the browser.
     *
     * @returns `true` if the Screen Wake Lock API is supported, `false` otherwise
     */
    isSupported() {
        return "wakeLock" in navigator;
    }

    /**
     * Create a screen wake lock to prevent lockscreens or darkening.
     *
     * @returns `true` if the lock was created, `false` otherwise
     * @throws a {@link NotAllowedError} if the lock was rejected
     * @throws a {@link NotSupportedError} if the Screen Wake Lock API is not supported by the browser
     */
    async lock() {
        if (!this.isSupported()) {
            throw new NotSupportedError("Screen Wake Lock API is not supported by the browser");
        }
        if (this.#wakeLock == null) {
            try {
                this.#wakeLock = await navigator.wakeLock.request("screen");
                this.dispatchEvent(new Event("lock"));
                return true;
            } catch (err) {
                if (err.name === "NotAllowedError") {
                    const error = new NotAllowedError(err.message, {cause: err});
                    error.stack = err.stack;
                    throw error;
                } else {
                    throw err;
                }
            }
        }
        return false;
    }

    /**
     * Release the screen wake lock, if it exists.
     *
     * @returns `true` if the lock was released, `false` otherwise
     * @throws a {@link NotSupportedError} if the Screen Wake Lock API is not supported by the browser
     */
    async release() {
        if (!this.isSupported()) {
            throw new NotSupportedError("Screen Wake Lock API is not supported by the browser");
        }
        if (this.#wakeLock != null) {
            await this.#wakeLock.release();
            this.#wakeLock = null;
            this.dispatchEvent(new Event("release"));
            return true;
        }
        return false;
    }

}
