/**
 * Connects the Login/Register Views with the Authentication Service (Backend / Model)
 * @class AuthenticationViewModel
 * @param apiUrl {string} The URL of the Backend API Login
 */
import axios from "axios";
import {
    decryptShamirSharesWithAES,
    encryptShamirSharesWithAES,
    generateNewShamirShares,
    hashPassword,
    mergeShamirShares
} from "../Global/Cryptography";
import {emailRegex} from "../Global/Regex";
import store from 'store/dist/store.modern';

// Set withCredentials so that we can keep the cookies :)
axios.defaults.withCredentials = true;

export class DecryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DecryptionError";
    }
}

export default class AuthenticationViewModel{
    private readonly apiUrl: string;
    public decryptionKey: string | undefined;
    public shares: string[] | undefined;

    constructor(apiUrl?: string){
        this.apiUrl = apiUrl || process.env.REACT_APP_API_URL + "/auth";
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
                const data = response.data.data as {emailVerified: number, shares: [number, string[]]};
                this.shares = data.shares[1];
                const decryptedShares = decryptShamirSharesWithAES(data.shares[1], password);
                // (We rethrow the error in the catch)
                // noinspection ExceptionCaughtLocallyJS
                if (decryptedShares === false) throw new DecryptionError("Could not decrypt Shamir Shares"); // Should not happen as we have strongly validated this
                this.decryptionKey = mergeShamirShares(decryptedShares);

                store.set("username", username);

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
     * @returns {Promise<any>}
     */
    private async sendRegisterRequest(username: string, hashedPassword: string, email: string, shamirSecrets: string[]): Promise<{success: boolean, message: string}> {
        try {
            const response = await axios.post(this.apiUrl + "/sign_up", {
                username: username,
                password: hashedPassword,
                email: email,
                encryptedShares: shamirSecrets
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

    public async register(username: string, email: string, password: string): Promise<{ success: boolean, message: string }>{
        // We only generate these here, they are never sent anywhere unencrypted
        const shares = generateNewShamirShares();

        const encryptedShares = encryptShamirSharesWithAES(shares.shares, password);

        // Stores the secret values here, so that they can only be accessed within our react app
        this.decryptionKey = shares.cryptographicKey;
        this.shares = shares.shares;

        // The username doesn't need full security, so we can use localStorage (Makes it more convenient for the user)
        store.set("username", username);

        // We hash the password here, so it is never sent to the server
        const hashedPassword = hashPassword(username, password);

        // now we can send to the server using the authViewModel
        return await this.sendRegisterRequest(username, hashedPassword, email, encryptedShares);
    }
}