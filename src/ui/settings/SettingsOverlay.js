import OverlayPanel from "../overlay/OverlayPanel.js";
import "../form/button/Button.js";
import "../icon/FontIcon.js";
import "./SettingsPanel.js";
import TPL from "./SettingsOverlay.js.html" assert {type: "html"};
import STYLE from "./SettingsOverlay.js.css" assert {type: "css"};

export default class SettingsOverlay extends OverlayPanel {

    #contentEl;

    #settingsPanelEl;

    #submitEl;

    #cancelEl;

    constructor(caption) {
        super(caption);
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#contentEl.append(els);
        this.#settingsPanelEl = this.shadowRoot.getElementById("settings-panel");
        /* --- */
        this.#submitEl = this.shadowRoot.getElementById("submit");
        this.#cancelEl = this.shadowRoot.getElementById("cancel");
        this.#initSettingsPanelHandlers();
    }

    set autosave(value) {
        this.setBooleanAttribute("autosave", value);
    }

    get autosave() {
        return this.getBooleanAttribute("autosave");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "autosave"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "autosave": {
                if (oldValue != newValue) {
                    if (newValue) {
                        // TODO activate save on change
                    } else {
                        // TODO deactivate save on change
                    }
                }
            } break;
        }
    }

    hide() {
        this.#settingsPanelEl.cancel();
    }

    loadConfig(config, defaultValues) {
        this.#settingsPanelEl.loadConfig(config, defaultValues);
    }

    reset() {
        this.#settingsPanelEl.reset();
    }

    setValues(values, merge = false) {
        this.#settingsPanelEl.setValues(values, merge);
    }

    setValuesFlat(values, merge = false) {
        this.#settingsPanelEl.setValuesFlat(values, merge);
    }

    getValues() {
        this.#settingsPanelEl.getValues();
    }

    getValuesFlat() {
        this.#settingsPanelEl.getValuesFlat();
    }

    submit() {
        this.#settingsPanelEl.submit();
    }

    cancel() {
        this.#settingsPanelEl.cancel();
    }

    setErrorButton(errorButton) {
        this.#settingsPanelEl.setErrorButton(errorButton);
    }

    #initSettingsPanelHandlers() {
        this.#submitEl.addEventListener("click", () => {
            this.submit();
        });
        this.#cancelEl.addEventListener("click", () => {
            this.cancel();
        });
        this.#settingsPanelEl.addEventListener("submit", (event) => {
            this.#onsubmit(event);
        });
        this.#settingsPanelEl.addEventListener("cancel", () => {
            this.#oncancel();
        });
    }

    #onsubmit(event) {
        super.hide();
        const {
            data, formData, hiddenData, changes, errors
        } = event;
        const ev = new Event("submit");
        ev.data = data;
        ev.formData = formData;
        ev.hiddenData = hiddenData;
        ev.changes = changes;
        ev.errors = errors;
        this.dispatchEvent(ev);
    }

    #oncancel() {
        super.hide();
        this.dispatchEvent(new Event("cancel"));
    }

    initialFocus() {
        this.#settingsPanelEl.initialFocus();
    }

    focusLast() {
        this.#submitEl.focus();
    }

}

customElements.define("emc-settings-overlay", SettingsOverlay);
