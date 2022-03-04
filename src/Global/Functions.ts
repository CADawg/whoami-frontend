import {ChangeEvent, useState} from "react";

// Checks if the given value is a Change Event on an input element
function isChangeEvent(toBeDetermined: any): toBeDetermined is ChangeEvent<HTMLInputElement> {
    return !!(toBeDetermined as ChangeEvent<HTMLInputElement>).target;
}

// Handles the change event of a text input and updates the state
function changeEventHandler (setValue: (value: string) => void) {
    // Returns a function that takes a ChangeEvent or String and updates the state
    return (e: ChangeEvent<HTMLInputElement> | string) => {
        // If the event is a ChangeEvent, get the value from the target
        if (isChangeEvent(e)) setValue(e.target.value || "");
        // If the event is a string, update the state
        else setValue(e);
    };
}

function changeEventHandlerWithRegex (setValue: (value: string) => void, regex: RegExp) {
    // Returns a function that takes a ChangeEvent or String and updates the state
    return (e: ChangeEvent<HTMLInputElement> | string) => {
        // If the event is a ChangeEvent, get the value from the target
        if (isChangeEvent(e)) {if (e.target.value.length === 0 || e.target.value.match(regex) !== null) setValue(e.target.value || "");}
        // If the event is a string, update the state
        else if (e.length === 0 || e.match(regex) !== null) setValue(e);
    };
}

/**
 * React.UseState with a change event handler as well as string support
 * Useful for supporting inputs by default and allowing for a string value
 * @param initialValue The initial value of the input
 */
const useStateInput = (initialValue: string): [any, (value: any) => void] => {
    const [value, setValue] = useState(initialValue);
    return [value, changeEventHandler(setValue)];
};

const useStateInputWithRegexLimiter = (initialValue: string, regex: RegExp): [any, (value: any) => void] => {
    const [value, setValue] = useState(initialValue);
    return [value, changeEventHandlerWithRegex(setValue, regex)];
};

export {changeEventHandler, useStateInput, isChangeEvent, useStateInputWithRegexLimiter};