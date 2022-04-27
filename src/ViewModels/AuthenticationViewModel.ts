/**
 * Connects the Login/Register Views with the Authentication Service (Backend / Model)
 * @class AuthenticationViewModel
 * @param apiUrl {string} The URL of the Backend API Login
 */
import axios from "axios";
import {
    aesDecryptString,
    aesDecryptStringsWithPassword, aesEncryptString,
    aesEncryptStringsWithPassword, generateRSAKeypair,
    generateNewShamirShares,
    hashPassword,
    mergeShamirShares
} from "../Global/Cryptography";
import {emailRegex} from "../Global/Regex";
import store from 'store/dist/store.modern';
import EventEmitter from "events";
import forge from "node-forge";
// Set withCredentials so that we can keep the cookies :)
axios.defaults.withCredentials = true;

export class DecryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DecryptionError";
    }
}

function allIsNotUndefined(...value: any):boolean {
    for (let i = 0; i < value.length; i++) {
        if (value[i] === undefined) {
            return false;
        }
    }

    return true;
}

export default class AuthenticationViewModel{
    private readonly apiUrl: string;
    public decryptionKey: string | undefined;
    public shares: string[] | undefined;
    public privateKey: forge.pki.PrivateKey | undefined;
    public publicKey: forge.pki.PublicKey | undefined;
    public username: string | undefined;
    private usernameAtServer: string | undefined | false;
    private isEmailVerifiedAtServer: boolean | undefined;
    private interval: NodeJS.Timer;
    public authEvents: EventEmitter = new EventEmitter();
    private lastLoggedInState: boolean|undefined = undefined;

    constructor(apiUrl?: string){
        this.apiUrl = apiUrl || process.env.REACT_APP_API_URL + "auth";

        this.interval = setInterval(async () => {
            await this.updateServerValues();
        }, 10000);

        // do it once at the start
        this.updateServerValues().then(() => {});
    }

    async updateServerValues() {
        // Use axios to get the username at the server POST /username

        try {
            const response = await axios.post(this.apiUrl + "/username", {});

            if (response.data.success) {
                this.usernameAtServer = response.data.data.username;
                this.isEmailVerifiedAtServer = response.data.data.isVerified;
            } else {
                this.usernameAtServer = false; // not logged in
                this.isEmailVerifiedAtServer = undefined;
            }
        } catch (e) {
            this.usernameAtServer = undefined;
            this.isEmailVerifiedAtServer = undefined;
        }

        const loggedIn = this.isLoggedIn();
        if (loggedIn !== this.lastLoggedInState) {
            this.updateLoginStatus(loggedIn);
        }
    }

    updateLoginStatus(loggedIn: boolean):void {
        this.lastLoggedInState = loggedIn;
        this.authEvents.emit("loginStatusUpdate", loggedIn);
    }

    isEmailVerified():boolean {
        console.log("isEmailVerified", this.isEmailVerifiedAtServer);

        if (this.isEmailVerifiedAtServer === undefined) return true;

        return this.isEmailVerifiedAtServer;
    }

    isLoggedIn(): boolean {
        if (allIsNotUndefined(this.username, this.decryptionKey, this.shares, this.privateKey, this.publicKey)) {
            // check server username value (undefined means not checked yet)
            if (this.usernameAtServer === this.username || this.usernameAtServer === undefined) {
                return true;
            }
        }

        return false;
    }

    logout(): boolean {
        this.username = undefined;
        this.decryptionKey = undefined;
        this.shares = undefined;

        axios.post(this.apiUrl + "/logout", {}).then(() => {
            this.usernameAtServer = false;
        }).catch(() => {
            this.usernameAtServer = false;
        });

        this.authEvents.emit("loginStatusUpdate", false);

        return true;
    }

    /**
     * Logs the User in
     * @param username {string} The Username of the User
     * @param password {string} The Password of the User
     * @returns {Promise<any>}
     */
    public async login(username: string, password: string): Promise<false|{emailVerified: number, shares: [number, string[]]}>{
        try {
            // We hash the password here, so it is never sent to the server
            const hashedPassword = hashPassword(username, password);

            const response = await axios.post(this.apiUrl + "/sign_in", {
                username: username,
                password: hashedPassword
            });

            if (response.data.success)  {
                const data = response.data.data as {emailVerified: number, shares: [number, string[]], keypair: {publicKey: string, encryptedPrivateKey: string}};
                const decryptedShares = aesDecryptStringsWithPassword(data.shares[1], password);
                this.shares = decryptedShares;
                const decryptionKey = mergeShamirShares(decryptedShares);
                if (decryptionKey) {
                    const decryptedPrivateKey = aesDecryptString(data.keypair.encryptedPrivateKey, decryptionKey);
                    this.decryptionKey = decryptionKey;

                    if (decryptedPrivateKey) {
                        this.privateKey = forge.pki.privateKeyFromPem(decryptedPrivateKey);
                        this.publicKey = forge.pki.publicKeyFromPem(data.keypair.publicKey);
                    }
                }
                else this.decryptionKey = undefined;
                this.username = username;

                store.set("username", username);

                this.usernameAtServer = username; // Won't be updated from server yet
                this.updateLoginStatus(true);

                // If it's successful this is the only format it returns
                return data;
            } else {
                return false;
            }
        } catch (e) {
            if (e instanceof DecryptionError) throw e;

            return false;
        }
    }

    /**
     * Registers the User
     * @param username {string} The Username of the User
     * @param hashedPassword {string} The Password of the User
     * @param email {string} The Email of the User
     * @param shamirSecrets {string[]} The Shamir Secret (encrypted) of the User
     * @param encryptedPrivateKey {string} The Private Key (encrypted) of the User (Encrypted From PEM String)
     * @param publicKey {string} The Public Key of the User (PEM Format)
     * @returns {Promise<any>}
     */
    private async sendRegisterRequest(username: string, hashedPassword: string, email: string, shamirSecrets: string[], encryptedPrivateKey: string, publicKey: string): Promise<{success: boolean, message: string}> {
        try {
            const response = await axios.post(this.apiUrl + "/sign_up", {
                username: username,
                password: hashedPassword,
                email: email,
                encryptedShares: shamirSecrets,
                encryptedPrivateKey: encryptedPrivateKey,
                publicKey: publicKey
            }, {withCredentials: true});

            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "An error occurred while connecting to the server"
            };
        }
    }

    public validateRegisterFields(username: string, email: string, password: string, confirmPassword: string): {success: boolean, message: string} {
        if (username.length < 3) {
            return {
                success: false,
                message: "Username must be at least 3 characters long"
            };
        }

        else if (password.length < 8 || password.match(/[0-9]/g) === null) {
            return {
                success: false,
                message: "Password must be at least 8 characters long and include a number"
            };
        }

        else if (password !== confirmPassword) {
            return {
                success: false,
                message: "Passwords do not match"
            };
        }

        else if (email.match(emailRegex) === null) {
            return {
                success: false,
                message: "Email is not valid"
            };
        }

        else return {
            success: true,
            message: ""
        };
    }

    /**
     * Registers the User with the server, generating all the necessary keys on the frontend
     * @param username User's username
     * @param email User's email
     * @param password User's password (unhashed)
     */
    public async register(username: string, email: string, password: string): Promise<{ success: boolean, message: string }>{
        // We only generate these here, they are never sent anywhere unencrypted
        const shares = generateNewShamirShares();

        const encryptedShares = aesEncryptStringsWithPassword(shares.shares, password);

        // Used when sending from another friend (so we don't see the encrypted contents)
        const keypair = generateRSAKeypair();

        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);

        // Encrypt the Private key of the keypair with the stored key (inside of the shamir shares)
        const encryptedPrivateKey = aesEncryptString(privateKey, shares.cryptographicKey);


        // Stores the secret values here, so that they can only be accessed within our react app
        this.decryptionKey = shares.cryptographicKey;
        this.shares = shares.shares;
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
        this.username = username;

        // The username doesn't need full security, so we can use localStorage (Makes it more convenient for the user)
        store.set("username", username);

        // We hash the password here, so it is never sent to the server
        const hashedPassword = hashPassword(username, password);

        // now we can send to the server using the authViewModel
        const srr = await this.sendRegisterRequest(username, hashedPassword, email, encryptedShares, encryptedPrivateKey, publicKey);

        if (srr.success) {
            this.usernameAtServer = username; // Won't be updated from server yet
            this.updateLoginStatus(true);
        }

        return srr;
    }
}