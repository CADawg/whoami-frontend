import {aesEncryptStringWithPassword, generateRSAKeypair, hashPassword} from "../Global/Cryptography";
import forge from "node-forge";
import store from "store/dist/store.modern";
import {SyntheticEvent, useState} from "react";
import AccountRecoveryViewModel from "../ViewModels/AccountRecoveryViewModel";
import axios from "axios";

export interface AccountTemp {
    username: string;
    passwordHash: string;
    publicKey: string;
    privateKey: string;
    encryptedPrivateKey: string;
}

export default function AccountRecoveryViewController() {
    const [account, setAccount] = useState<AccountTemp | null>(store.get("tempAccount", null));
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [username, setUsername] = useState(store.get("username", ""));
    const [error, setError] = useState("");
    const [recoveryId, setRecoveryId] = useState(store.get("recoveryId", ""));

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
        }
    }


    return <AccountRecoveryViewModel account={account} password={password} setPassword={setPassword} passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm}
                                     username={username} setUsername={setUsername} error={error} recoveryId={recoveryId} onSubmitClick={onSubmitClick} />;
}