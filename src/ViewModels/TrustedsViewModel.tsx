// password manager vault page
export default function HomeViewModel() {
    let vaultItems = [
        {
            name: "Mum (2 Shares)",
        },
        {
            name: "Dad  (1 Share)",
        },
        {
            name: "Good Friend (1 Share)",
        }
    ];

    return <div>
        <style>

        </style>
        <div style={{maxWidth: "49%", position: "relative"}}>
            <h1 style={{display: "inline"}}>Trusted People</h1> <button style={{width: "20%", display: "inline-block", right: "0", position: "absolute"}}>Add Person</button>

            <br /><br /><br/>

            {/* Vault Items (map thru vaultItems)*/}
            {vaultItems.map((item, index) => {
                return <div key={index} style={{borderBottom: "1px solid grey", display: "flex"}}>
                    <p style={{margin: "0", alignSelf: "center"}}>{item.name}</p>
                    <div style={{flexGrow: 1}} />
                    <button style={{width: "10%", marginRight: "10px"}}>Edit</button>
                    <button style={{width: "10%"}}>Remove</button>
                </div>
            })}
        </div>
        <div style={{maxWidth: "49%", position: "fixed", top: "80px", right: "0", left: "50%"}}>
            {/* Item Edit Panel */}
            <div style={{border: "1px solid #175ddc", borderRadius: "5px", padding: "5px"}}>
                <h1>Edit Item</h1>
                <div>
                    {/* Inputs */}
                    <div>
                        <label style={{display: "block"}}>Name</label>
                        <input style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    </div>
                    <div>
                        <label style={{display: "block"}}>Username</label>
                        <input style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    </div>
                    <div>
                        <label style={{display: "block"}}>Password (or hint)</label>
                        <input style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    </div>
                    <div>
                        <label style={{display: "block"}}>Notes</label>
                        <textarea style={{display: "block", width: "100%", padding: "3px 0", marginBottom: "10px", border: "none", borderBottom: "1px solid #175ddc"}} />
                    </div>

                </div>
                <button>Save Changes</button>
            </div>
        </div>
    </div>;
}