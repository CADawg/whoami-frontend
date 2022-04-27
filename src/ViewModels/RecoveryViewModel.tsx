// password manager vault page
import {RecoveryAccount, TrustedParty} from "../ViewController/RecoveryViewController";
import {SyntheticEvent} from "react";

export default function RecoveryViewModel(props: {trustedParties: TrustedParty[], trustingMe: TrustedParty[], error: string, addUser: (e:SyntheticEvent) => void,
    acceptRequest: (e:SyntheticEvent, id: number) => void, rejectRequest: (e:SyntheticEvent, id: number) => void, pendingRecovery:RecoveryAccount[],
    getShareAndEncryptForRecipient: (e:SyntheticEvent, rsaPub: string, fromUser: number) => void,
    email: string, setEmail: (email: string) => void, deleteTrusted: (event:SyntheticEvent, id: number) => void, showAddPanel: boolean, setShowAddPanel: (show: boolean) => void}) {
    return <div>
        <style>

        </style>
        <div style={{maxWidth: "49%", position: "relative"}}>
            <h1 style={{display: "inline"}}>Trusted People</h1> <button onClick={e => {e.preventDefault(); props.setShowAddPanel(true);}} style={{width: "20%", display: "inline-block", right: "0", position: "absolute"}}>Add Person</button>

            <br /><br /><br/>

            {/* Trusted Items (map thru vaultItems)*/}
            {props.trustedParties.map((item, index) => {
                return <div key={index} style={{borderBottom: "1px solid grey", display: "flex"}}>
                    <p style={{margin: "0", alignSelf: "center"}}>{item.email} ({item.accepted === 1 ? "Accepted" : "Not Accepted"})</p>
                    <div style={{flexGrow: 1}} />
                    <button style={{width: "10%"}} onClick={e => props.deleteTrusted(e, item.recovery_id)}>Remove</button>
                </div>
            })}

            <br /><br />

            <h1 style={{display: "inline"}}>Trusting Me</h1>

            <br /><br />

            {/* Trusted Items (map thru vaultItems)*/}
            {props.trustingMe.map((item, index) => {
                return <div key={index} style={{borderBottom: "1px solid grey", display: "flex"}}>
                    <p style={{margin: "0", alignSelf: "center"}}>{item.email} ({item.accepted === 1 ? "Accepted" : "Not Accepted"})</p>
                    <div style={{flexGrow: 1}} />
                    <button style={{width: "10%"}} onClick={e => props.rejectRequest(e, item.recovery_id)}>{item.accepted === 0 ? "Reject" : "Remove"}</button>
                    {item.accepted === 0 ?
                    <button style={{width: "10%", marginLeft: "10px"}} onClick={e => props.acceptRequest(e, item.recovery_id)}>Accept</button> : null}
                </div>
            })}

            <br /><br />

            <h1 style={{display: "inline"}}>Recovery Requests</h1>
            <p>These are requests from people who have previously trusted you and need their account recovered. Please verify that the ID matches what they told you and that they are who they say they are before approving.</p>



            {/* Trusted Items (map thru vaultItems)*/}
            {props.pendingRecovery.map((item, index) => {
                return <div key={index} style={{borderBottom: "1px solid grey", display: "flex"}}>
                    <p style={{margin: "0", alignSelf: "center"}}>{item.email} <strong>ID: {item.recoverer_id}</strong></p>
                    <div style={{flexGrow: 1}} />
                    <button style={{width: "10%"}} onClick={e => props.getShareAndEncryptForRecipient(e, item.public_key, item.account_to_recover)}>Approve</button>
                </div>
            })}
        </div>
        <div style={{maxWidth: "49%", position: "fixed", top: "80px", right: "0", left: "50%", display: props.showAddPanel ? "block" : "none"}}>
            {/* Item Edit Panel */}
            <div style={{border: "1px solid #175ddc", borderRadius: "5px", padding: "5px"}}>
                <h1>Add Trusted</h1>
                <div>
                    {/* Inputs */}
                    {props.error ? <p style={{color: "red"}}>{props.error}</p> : null}
                    <div>
                        <label style={{display: "block"}}>Email</label>
                        <input onChange={e => props.setEmail(e.target.value)} value={props.email} type="email" style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    </div>
                </div>
                <button onClick={props.addUser}>Add Person</button>
            </div>
        </div>
    </div>;
}