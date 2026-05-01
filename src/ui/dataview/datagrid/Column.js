import FixedAnchor from "../../../enum/FixedAnchor.js";
import HorizontalAlign from "../../../enum/HorizontalAlign.js";
import VerticalAlign from "../../../enum/VerticalAlign.js";
import CustomElement from "../../element/CustomElement.js";

// TODO create enum for fixed
export default class Column extends CustomElement {

    set name(value) {
        this.setStringAttribute("name", value);
    }

    get name() {
        return this.getStringAttribute("name");
    }

    set label(value) {
        this.setStringAttribute("label", value);
    }

    get label() {
        return this.getStringAttribute("label");
    }

    set hideLabel(value) {
        this.setBooleanAttribute("hidelabel", value);
    }

    get hideLabel() {
        return this.getBooleanAttribute("hidelabel");
    }

    set type(value) {
        this.setStringAttribute("type", value);
    }

    get type() {
        return this.getStringAttribute("type");
    }

    set width(value) {
        this.setStringAttribute("width", value);
    }

    get width() {
        return this.getStringAttribute("width");
    }

    set editable(value) {
        this.setBooleanAttribute("editable", value);
    }

    get editable() {
        return this.getBooleanAttribute("editable");
    }

    set hidden(value) {
        this.setBooleanAttribute("hidden", value);
    }

    get hidden() {
        return this.getBooleanAttribute("hidden");
    }

    set sortable(value) {
        this.setBooleanAttribute("sortable", value);
    }

    get sortable() {
        return this.getBooleanAttribute("sortable");
    }

    set sortBy(value) {
        this.setStringAttribute("sortby", value);
    }

    get sortBy() {
        return this.getStringAttribute("sortby");
    }

    set nullable(value) {
        this.setBooleanAttribute("nullable", value);
    }

    get nullable() {
        return this.getBooleanAttribute("nullable");
    }

    set halign(value) {
        this.setEnumAttribute("halign", value, HorizontalAlign);
    }

    get halign() {
        return this.getEnumAttribute("halign");
    }

    set valign(value) {
        this.setEnumAttribute("valign", value, VerticalAlign);
    }

    get valign() {
        return this.getEnumAttribute("valign");
    }

    set fixed(value) {
        this.setEnumAttribute("fixed", value, FixedAnchor);
    }

    get fixed() {
        return this.getEnumAttribute("fixed");
    }

    set textColor(value) {
        this.setStringAttribute("textcolor", value);
    }

    get textColor() {
        return this.getStringAttribute("textcolor");
    }

    set backColor(value) {
        this.setStringAttribute("backcolor", value);
    }

    get backColor() {
        return this.getStringAttribute("backcolor");
    }

    set iconType(value) {
        this.setStringAttribute("icon-type", value);
    }

    get iconType() {
        return this.getStringAttribute("icon-type");
    }

    set icon(value) {
        this.setStringAttribute("icon", value);
    }

    get icon() {
        return this.getStringAttribute("icon");
    }

}

customElements.define("emc-datagrid-column", Column);
