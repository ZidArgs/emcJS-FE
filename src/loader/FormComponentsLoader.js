import MapLocker from "@emcjs/core/data/locker/MapLocker.js";

// structural
import FormSection from "../ui/form/FormSection.js";
import FormFieldset from "../ui/form/FormFieldset.js";
import FormRow from "../ui/form/FormRow.js";
import FormField from "../ui/form/FormField.js";
import FormGroup from "../ui/form/FormGroup.js";

export const FORM_STRUCTURE_MAPPING = new MapLocker(new Map([
    ["Section", FormSection],
    ["Fieldset", FormFieldset],
    ["Row", FormRow],
    ["FormField", FormField],
    ["FormGroup", FormGroup]
]));

// button
import Button from "../ui/form/button/Button.js";
import ActionButton from "../ui/form/button/ActionButton.js";
import SubmitButton from "../ui/form/button/SubmitButton.js";
import ResetButton from "../ui/form/button/ResetButton.js";
import ErrorButton from "../ui/form/button/ErrorButton.js";
import LinkButton from "../ui/form/button/LinkButton.js";

export const FORM_BUTTON_MAPPING = new MapLocker(new Map([
    ["Button", Button],
    ["ActionButton", ActionButton],
    ["SubmitButton", SubmitButton],
    ["ResetButton", ResetButton],
    ["ErrorButton", ErrorButton],
    ["LinkButton", LinkButton]
]));

// element / input
import "../ui/form/element/input/action/ActionInput.js";
import "../ui/form/element/input/boolorlogic/BoolOrLogicInput.js";
import "../ui/form/element/input/checkbox/CheckboxInput.js";
import "../ui/form/element/input/code/CodeInput.js";
import "../ui/form/element/input/color/ColorInput.js";
import "../ui/form/element/input/file/FileInput.js";
import "../ui/form/element/input/grid/GridInput.js";
import "../ui/form/element/input/keybind/KeyBindInput.js";
import "../ui/form/element/input/keyvaluelist/KeyValueListInput.js";
import "../ui/form/element/input/list/ListInput.js";
import "../ui/form/element/input/logic/LogicInput.js";
import "../ui/form/element/input/number/NumberInput.js";
import "../ui/form/element/input/password/PasswordInput.js";
import "../ui/form/element/input/range/RangeInput.js";
import "../ui/form/element/input/search/SearchInput.js";
import "../ui/form/element/input/slider/SliderInput.js";
import "../ui/form/element/input/string/StringInput.js";
import "../ui/form/element/input/switch/SwitchInput.js";
import "../ui/form/element/input/text/TextInput.js";
// element / select
import "../ui/form/element/select/grid/GridSelect.js";
import "../ui/form/element/select/image/ImageSelect.js";
import "../ui/form/element/select/list/ListSelect.js";
import "../ui/form/element/select/relation/RelationSelect.js";
import "../ui/form/element/select/search/SearchSelect.js";
import "../ui/form/element/select/simple/SimpleSelect.js";
import "../ui/form/element/select/switch/SwitchSelect.js";
import "../ui/form/element/select/token/TokenSelect.js";

