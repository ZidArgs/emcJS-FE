import NavBar from "../ui/navigation/NavBar.js";
import Paging from "../ui/Paging.js";

export default class ViewSwitcher {

    static #configs = new Map();

    #navbar;

    #paging;

    constructor(navbar, paging) {
        if (!(navbar instanceof NavBar)) {
            throw new TypeError("parameter 1 expected to be of type NavBar");
        }
        if (!(paging instanceof Paging)) {
            throw new TypeError("parameter 2 expected to be of type Paging");
        }
        this.#navbar = navbar;
        this.#paging = paging;
    }

    static register(name, config) {
        ViewSwitcher.#configs.set(name, config);
    }

    switch(name) {
        this.#paging.active = name;
        if (ViewSwitcher.#configs.has(name)) {
            this.#navbar.loadNavigation(ViewSwitcher.#configs.get(name));
        } else {
            this.#navbar.loadNavigation([]);
        }
    }

}
