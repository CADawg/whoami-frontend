import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import RecoveryViewModel from "../ViewModels/RecoveryViewModel";
import {SyntheticEvent, useEffect, useState} from "react";
import axios from "axios";
import {createAdditionalShareFromShares, rsaEncryptString} from "../Global/Cryptography";

export interface TrustedParty {
    email: string;
    accepted: number;
    recovery_id: number;
}

export default function RecoveryViewController(props: {authViewModel?: AuthenticationViewModel}) {
    const [trustedParties, setTrustedParties] = useState<TrustedParty[]>([]);
    const [trustingMe, setTrustingMe] = useState<TrustedParty[]>([]);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const authViewModel = props.authViewModel || new AuthenticationViewModel();

    useEffect(() => {
        update().then();
    }, []);

    async function acceptRequest(event: SyntheticEvent, recovery_id: number) {
        event.preventDefault();

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/recovery/approveRecoveryRequest`, {
            requestId: recovery_id
        });
        if (response.data.success) {
            // update this request to accepted = 1
            const updatedTrustedParties = trustedParties.map(tp => {
                if (tp.recovery_id === recovery_id) {
                    return {...tp, accepted: 1};
                }
                return tp;
            });

            setTrustedParties(updatedTrustedParties);

            update().then();
        }
    }

    async function rejectRequest(event: SyntheticEvent, recovery_id: number) {
        event.preventDefault();

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/recovery/rejectRecoveryRequest`, {
            requestId: recovery_id
        });
        if (response.data.success) {
            // filter this item out as it is now deleted
            const updatedTrustedParties = trustedParties.filter(tp => tp.recovery_id !== recovery_id);

            setTrustedParties(updatedTrustedParties);

            update().then();
        }
    }

    async function update() {
        // get trusted parties via axios GET REACT_APP_API_URL/recovery/getTrusted
        const response = await axios.get(process.env.REACT_APP_API_URL + "recovery/getTrusted", {});

        // trusting me values
        const response2 = await axios.get(process.env.REACT_APP_API_URL + "recovery/getRecoveryRequests", {});

        if (response2.data.success) {
            setTrustingMe(response2.data.requests);
        }

        if (response.data.success) {
            setTrustedParties(response.data.trusted);
        } else {
            console.error(response.data);
        }
    }

    function addUser(event: SyntheticEvent) {
        event.preventDefault();

        // get public key
        (async () => {
            const response = await axios.post(process.env.REACT_APP_API_URL + "recovery/publickey", {email});

            console.log(response.data);

            if (response.data.success) {
                const rsaPubKey = response.data.publicKey;

                // generate new shamir share
                const currentShares = authViewModel.shares;

                if (!currentShares) {
                    console.error("No shares found");
                    return;
                }

                const newShare = createAdditionalShareFromShares(currentShares);

                const encryptedNewShare = rsaEncryptString(newShare, rsaPubKey);

                // send public key to trusted party via axios POST REACT_APP_API_URL/recovery/addTrusted
                const response2 = await axios.post(process.env.REACT_APP_API_URL + "recovery/addTrusted", {
                    email: email,
                    share: encryptedNewShare,
                });

                if (response2.data.success) {
                    setEmail("");
                    setShowAddPanel(false);
                    setError("");
                    await update();
                } else {
                    setError(response2.data.message);
                }
            } else {
                setError(response.data.message);
            }
        })();
    }

    function deleteByRecoveryId(event: SyntheticEvent, recoveryId: number) {
        event.preventDefault();

        (async () => {
            // delete trusted party via axios DELETE REACT_APP_API_URL/recovery/deleteTrusted
            const response = await axios.delete(process.env.REACT_APP_API_URL + "recovery/deleteTrusted", {
                data: {
                    requestId: recoveryId
                }
            });

            if (response.data.success) {
                setTrustedParties(trustedParties.filter((trustedParty: TrustedParty) => trustedParty.recovery_id !== recoveryId));
            } else {
                console.error(response.data);
            }
        })();
    }

    return <RecoveryViewModel trustedParties={trustedParties} acceptRequest={acceptRequest} rejectRequest={rejectRequest} trustingMe={trustingMe} error={error} deleteTrusted={deleteByRecoveryId} email={email} setEmail={setEmail} addUser={addUser} showAddPanel={showAddPanel} setShowAddPanel={setShowAddPanel} />;
}