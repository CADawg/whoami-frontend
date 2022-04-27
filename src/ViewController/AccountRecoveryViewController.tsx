import {
    aesEncryptStringsWithPassword,
    aesEncryptStringWithPassword,
    generateRSAKeypair,
    hashPassword
} from "../Global/Cryptography";
import forge from "node-forge";
import store from "store/dist/store.modern";
import {SyntheticEvent, useEffect, useState} from "react";
import AccountRecoveryViewModel from "../ViewModels/AccountRecoveryViewModel";
import axios from "axios";

export interface AccountTemp {
    username: string;
    passwordHash: string;
    publicKey: string;
    privateKey: string;
    encryptedPrivateKey: string;
}

export interface Shares {
    share_id: number;
    recovery_user_id: number;
    share: string;
}

export default function AccountRecoveryViewController() {
    const [account, setAccount] = useState<AccountTemp | null>(store.get("tempAccount", null));
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [username, setUsername] = useState(store.get("usernameAlt", ""));
    const [error, setError] = useState("");
    const [recoveryId, setRecoveryId] = useState(store.get("recoveryId", ""));
    const [shares, setShares] = useState<Shares[]>([]);
    const [finalPassword, setFinalPassword] = useState("");

    useEffect(() => {
        if (account !== null) {
            // get /recovery/recoveryDetails

            axios.post( process.env.REACT_APP_API_URL + `/recovery/recoveryDetails`, {recoveryUserId: recoveryId})
                .then(res => {
                    setShares(res.data.data);
                })
                .catch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function applyNewCredentials(event: SyntheticEvent) {
        event.preventDefault();

        // check password against account.passwordHash (after hashing it)
        const enteredPasswordHash = hashPassword(username, finalPassword);

        if (enteredPasswordHash !== account?.passwordHash) {
            setError("New password is incorrect");
            return;
        }

        setError("");

        // decrypt shares with private key
        const decryptedShares = shares.map(share => {
            const privateKey = forge.pki.privateKeyFromPem(account?.privateKey);
            return privateKey.decrypt(forge.util.decode64(share.share));
        });

        // re-encrypt with pbkdf2 from password (this is why we need it once more)
        const encryptedShares = aesEncryptStringsWithPassword(decryptedShares, finalPassword);

        // send to server

        axios.post( process.env.REACT_APP_API_URL + `/recovery/completeRecovery`, {
            recoveryUserId: shares[0].recovery_user_id,
            replacementShares: encryptedShares
        })
            .then(() => {
                setError("Recovery Complete. You may now log in with your new credentials.");
                setAccount(null);
                store.set("tempAccount", null);
                setRecoveryId("");
                store.set("recoveryId", "");
            })
            .catch(() => {
                setError("Error applying new credentials");
            });
    }


    function getTempAccount(username: string, password: string) {
        const keypair = generateRSAKeypair();
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);

        const newPasswordHash = hashPassword(username, password);

        const encryptedPrivateKey = aesEncryptStringWithPassword(privateKey, password);

        const account: AccountTemp = {
            username,
            passwordHash: newPasswordHash,
            publicKey,
            encryptedPrivateKey,
            privateKey
        };

        store.set("tempAccount", account);
        store.set("usernameAlt", username);

        setAccount(account);

        return account;
    }

    async function onSubmitClick(event: SyntheticEvent) {
        event.preventDefault();

        if (password !== passwordConfirm) {
            setError("Passwords do not match");
            return;
        }

        if (password.length === 0) {
            setError("Password cannot be empty");
            return;
        }

        if (username.length === 0) {
            setError("Username cannot be empty");
            return;
        }

        const accountInfo = getTempAccount(username, password);



        // start recovery using REACT_APP_API_URL /recovery/startRecovery via axios
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/recovery/startRecovery`, {
            accountToRecover: accountInfo.username,
            newPasswordHash: accountInfo.passwordHash,
            publicKey: accountInfo.publicKey,
            privateKey: accountInfo.encryptedPrivateKey
        });

        if (response.data.success) {
            store.set("recoveryId", response.data.id);
            setRecoveryId(response.data.id);
            store.set("usernameAlt", "");
        }
    }


    return <AccountRecoveryViewModel account={account} password={password} setPassword={setPassword} passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm}
                                     username={username} shares={shares} finalPassword={finalPassword} setFinalPassword={setFinalPassword} applyNewCredentials={applyNewCredentials} setUsername={setUsername} error={error} recoveryId={recoveryId} onSubmitClick={onSubmitClick} />;
}