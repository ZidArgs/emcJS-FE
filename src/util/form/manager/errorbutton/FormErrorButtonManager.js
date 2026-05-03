import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import ErrorButton from "../../../../ui/form/button/ErrorButton.js";
import FormContext from "../../context/FormContext.js";

// TODO test if error button reacts to reset event
export default class FormErrorButtonManager {

    #errorButtonEl;

    #formContextEventManager = new EventTargetManager();

    constructor(errorButtonEl, formContext) {
        if (errorButtonEl != null && !(errorButtonEl instanceof ErrorButton)) {
            throw new TypeError("errorButtonEl has to be an ErrorButton or null");
        }
        if (formContext != null && !(formContext instanceof FormContext)) {
            throw new TypeError("formContext has to be a FormContext or null");
        }
        this.#errorButtonEl = errorButtonEl;
        this.#formContextEventManager.set([
            "submit",
            "error",
            "reset"
        ], (event) => {
            if (this.#errorButtonEl != null) {
                const {errors} = event;
                this.#errorButtonEl.setErrors(errors);
            }
        });
        this.#formContextEventManager.set("validity", (event) => {
            if (this.#errorButtonEl != null) {
                const {
                    valid, element
                } = event;
                if (valid) {
                    this.#errorButtonEl.removeError(element);
                } else {
                    const {
                        name, message
                    } = event;
                    this.#errorButtonEl.addError({
                        name: name,
                        label: element.formField?.label ?? name,
                        element: element,
                        errors: [message]
                    });
                }
            }
        });
        this.#formContextEventManager.switchTarget(formContext);
        if (errorButtonEl != null) {
            if (formContext != null) {
                errorButtonEl.setErrors(formContext.getErrors());
            } else {
                errorButtonEl.setErrors();
            }
        }
    }

    setFormContext(formContext) {
        if (formContext != null && !(formContext instanceof FormContext)) {
            throw new TypeError("formContext has to be a FormContext or null");
        }
        this.#formContextEventManager.switchTarget(formContext);
        if (this.#errorButtonEl != null) {
            if (formContext != null) {
                this.#errorButtonEl.setErrors(formContext.getErrors());
            } else {
                this.#errorButtonEl.setErrors();
            }
        }
    }

    setErrorButton(errorButtonEl) {
        if (errorButtonEl != null && !(errorButtonEl instanceof ErrorButton)) {
            throw new TypeError("errorButtonEl has to be an ErrorButton or null");
        }
        this.#errorButtonEl = errorButtonEl;
        if (errorButtonEl != null) {
            const formContext = this.#formContextEventManager.target;
            if (formContext != null) {
                errorButtonEl.setErrors(formContext.getErrors());
            } else {
                errorButtonEl.setErrors();
            }
        }
    }

}
