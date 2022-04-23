// Types of object that can be a "child" in react
// Element, Element[] and Strings are all valid children
export type Children = JSX.Element | null | string | JSX.Element[];

export interface Item {
    item_id?: number,
    user_id?: number,
    type: string,
    name: string,
    subitems: SubItem[],
}

export interface SubItem {
    subitem_id?: number,
    item_id?: number,
    subitem_type: string,
    subitem_value: string
}