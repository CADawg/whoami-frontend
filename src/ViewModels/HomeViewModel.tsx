// password manager vault page
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrash} from "@fortawesome/pro-solid-svg-icons";
import {SyntheticEvent} from "react";
import {Item} from "../Global/Types";

export default function HomeViewController(props: {selectedItemType: number, setSelectedItemType: (v: number) => void, hasPanelOpen: boolean, errorMessage: string,
    setFormItem: (v: string, v2: string) => void, getFormItem: (v: string) => any, submitForm: () => void, addItemButtonClicked: (e: SyntheticEvent) => void,
    getItemTypeIndexById: (id: string) => number,isEditing: number, setIsEditing: (i: number) => void, vaultItems: Item[], editItem: (e: SyntheticEvent, i: number) => void,
    vaultItemTypes: ({ name: string; id: string; fields: any })[], cancel: (e: SyntheticEvent) => void, delete: (e: SyntheticEvent) => void}) {

    return <div>
        <div style={{maxWidth: "49%", position: "relative"}}>
            <h1 style={{display: "inline"}}>Vault</h1> <button style={{width: "20%", display: "inline-block", right: "0", position: "absolute"}} onClick={props.addItemButtonClicked}>Add Item</button>

            <br /><br /><br/>

            {/* Vault Items */}
            {props.vaultItems.map((item, index) => {
                return <div key={index} style={{borderBottom: "1px solid grey", display: "flex"}}>
                    <p style={{margin: "0", alignSelf: "center"}}>{item.name}</p>
                    <div style={{flexGrow: 1}} />
                    <button onClick={e => props.editItem(e, item.item_id || 0)} style={{width: "10%", marginRight: "10px"}}>Edit</button>
                </div>
            })}
        </div>
        <div style={{maxWidth: "49%", position: "fixed", top: "80px", right: "0", left: "50%"}}>
            {/* Item Edit Panel */}
            <div style={{border: "1px solid #175ddc", borderRadius: "5px", padding: "5px", display: props.hasPanelOpen ? "block" : "none"}}>
                <h1>Edit Item</h1>
                <div>
                    {/* Item type selector */}
                    {props.errorMessage ? <p style={{color: "red", margin: "0", marginBottom: "10px"}}>{props.errorMessage}</p> : null}
                    <label style={{display: "block"}}>Item Name</label>
                    <input value={props.getFormItem("name")} onChange={e => props.setFormItem("name", e.target.value)} type="string" style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    {props.isEditing < 0 ? <label>Item Type</label> : null}
                    {props.isEditing < 0 ? <select style={{
                        width: "100%",
                        color: "white",
                        backgroundColor: "#175ddc",
                        border: "1px solid #175ddc",
                        borderRadius: "5px",
                        padding: "5px",
                        marginBottom: "10px"
                    }} onChange={e => props.setSelectedItemType(parseInt(e.target.value))} value={props.selectedItemType}>
                        {props.vaultItemTypes.map((itemType, index) => {
                            return <option key={index} value={index}>{itemType.name}</option>
                        })}
                    </select> : null}
                    {/* Inputs (based on type) */}
                    <div>
                        {Object.keys(props.vaultItemTypes[props.selectedItemType].fields).map((key: string, index: number) => {
                            return <div key={index}>
                                <label style={{display: "block"}}>{props.vaultItemTypes[props.selectedItemType].fields[key].label}</label>
                                {props.vaultItemTypes[props.selectedItemType].fields[key].type === "textarea" ? <textarea value={props.getFormItem(key)} onChange={e => props.setFormItem(key, e.target.value)} style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} /> :
                                    <input value={props.getFormItem(key)} onChange={e => props.setFormItem(key, e.target.value)} type={props.vaultItemTypes[props.selectedItemType].fields[key].type} style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />}
                            </div>
                        })}
                    </div>
                </div>
                <div style={{display: "flex"}}>
                    <button onClick={props.cancel} style={{backgroundColor: "#666", borderColor: "#666", flexGrow: "0", marginRight: "5px", flexBasis: "100px"}}>Cancel</button>
                    <button onClick={e => {e.preventDefault(); props.submitForm()}}>Save Changes</button>
                    <button onClick={props.delete} style={{backgroundColor: "#d9534f", borderColor: "#d9534f", flexGrow: "0", flexBasis: "50px", marginLeft: "5px"}}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
            </div>
        </div>
    </div>;
}