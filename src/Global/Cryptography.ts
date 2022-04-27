import forge from "node-forge";
import secrets from 'secrets.js-34r7h';
import {validDecryptionKeyRegex} from "./Regex";

/**
 * Creates a deterministic hash from a username and password.
 * @param username The user's username.
 * @param password The user's password.
 */
function hashPassword(username: string, password: string): string {
    username = username.toLowerCase();

    // Generate the SHA-512 hash of the username and password. Using <-p|u-> to separate the username and password.
    // Using a non-standard separator again helps to prevent dictionary attacks by us.
    // A normal hash is usually separated by a . (dot) character.
    return forge.md.sha512.create().update(password + "<-p|u->" + username).digest().toHex();
}

function generateRSAKeypair(): { publicKey: forge.pki.PublicKey, privateKey: forge.pki.PrivateKey } {
    // create forge rsa keypair
    const keypair = forge.pki.rsa.generateKeyPair({bits: 2048, e: 0x10001, workers: -1});

    return {
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey
    };
}

/**
 * Generates 2 new shamir shares for the User (based on a 256 bit AES secret key)
 */
function generateNewShamirShares() {
    // Get random bits using grempe's secrets.js library
    // These 256 bits are used for AES-256 encryption of the user's data
    const cryptographicKey = secrets.random(256);

    // We now have 2 shares belonging to the user
    // Return them
    return {shares: secrets.share(cryptographicKey, 2, 2), cryptographicKey: Buffer.from(cryptographicKey, "hex").toString("binary")};
}

export function createAdditionalShareFromShares(shares: string[]) {
    console.log(shares);
    console.log(secrets.combine(shares));
    return "";
}

export function rsaEncryptString(string: string, pubKey: string): string {
    const publicKey = forge.pki.publicKeyFromPem(pubKey);
    const encrypted = publicKey.encrypt(string, "RSA-OAEP");

    return forge.util.encode64(encrypted);
}

export function rsaDecryptString(string: string, privKey: string): string {
    const privateKey = forge.pki.privateKeyFromPem(privKey);
    return privateKey.decrypt(forge.util.decode64(string), "RSA-OAEP");
}

// Merge shamir shares to get the user's cryptographic key
function mergeShamirShares(shares: string[]): string|false {
    const data = secrets.combine(shares);

    // Check data is a 256 bit string (64 characters, hexadecimal)
    if (data.match(validDecryptionKeyRegex) !== null) {
        return Buffer.from(data, "hex").toString("binary");
    } else {
        return false;
    }
}

function aesEncryptString(string: string, key: string): string {
    // Forge AES GCM stands for Galois/Counter Mode and is considered secure (by the US government and BitWarden, so it's good enough for us)
    const cipher = forge.cipher.createCipher('AES-GCM', key);
    // Set the IV (Initialization Vector)
    let iv = forge.random.getBytesSync(16);

    cipher.start({iv});
    // Set the secret data
    cipher.update(forge.util.createBuffer(string));
    // Finalize the encryption
    cipher.finish();

    const tagBytes = cipher.mode.tag.getBytes();

    // Take the Tag and convert it to hex
    let tagHex = forge.util.binary.hex.encode(tagBytes);
    let ivHex = forge.util.binary.hex.encode(iv);

    let encryptedShare = forge.util.binary.hex.encode(cipher.output.getBytes());

    // Add the share, iv and tagHex to the array
    return encryptedShare + ":" + ivHex + ":" + tagHex;
}

function aesEncryptStrings(strings: string[], key: string): string[] {
    // Encrypt each share
    const encryptedShares = [];

    for (let i = 0; i < strings.length; i++) {
        encryptedShares.push(aesEncryptString(strings[i], key));
    }

    return encryptedShares;
}

// Use node-forge and the user's password to encrypt each shamir share
function aesEncryptStringsWithPassword(strings: string[], password: string) {
    // Get a random salt
    let salt = forge.random.getBytesSync(128);
    // Get the AES-256 key from the password
    const key = forge.pkcs5.pbkdf2(password, salt, 100001, 32);

    const encryptedShares = aesEncryptStrings(strings, key);

    // Calculate salt
    let saltHex = Buffer.from(salt, "binary").toString("hex");

    return encryptedShares.map(encryptedShare => encryptedShare + ":" + saltHex);
}

export function aesEncryptStringWithPassword(string: string, password: string) {
    // Get a random salt
    let salt = forge.random.getBytesSync(128);
    // Get the AES-256 key from the password
    const key = forge.pkcs5.pbkdf2(password, salt, 100001, 32);

    // Encrypt the string
    let encryptedShare = aesEncryptString(string, key);

    // Calculate salt
    let saltHex = Buffer.from(salt, "binary").toString("hex");

    return encryptedShare + ":" + saltHex;
}

// reverse of aesEncryptStringWithPassword
export function aesDecryptStringWithPassword(encryptedString: string, password: string) {
    // split by :
    let encryptedShares = encryptedString.split(":");

    // get last part
    let saltHex = encryptedShares.pop() || "";

    // join rest back
    let aesData = encryptedShares.join(":");

    // use pbkdf2 to get the key
    let key = forge.pkcs5.pbkdf2(password, Buffer.from(saltHex, "hex").toString('binary'), 100001, 32);

    // decrypt with key

    return aesDecryptString(aesData, key);
}

function aesDecryptString(encryptedShare: string, key: string): string|false {
    let splitShare = encryptedShare.split(":");
    let encryptedData = splitShare[0];
    let ivHex = splitShare[1];
    let tag = splitShare[2];

    if (encryptedData.length === 0) {
        return ""; // Empty string
    }

    // Convert the hex to bytes
    let encryptedDataBytes = forge.util.binary.hex.decode(encryptedData);
    let ivBytes = Buffer.from(ivHex, 'hex').toString('binary');
    let tagBuffer = forge.util.createBuffer(forge.util.binary.hex.decode(tag));

    // Forge AES GCM stands for Galois/Counter Mode and is considered secure (by the US government and BitWarden, so it's good enough for us)
    const decipher = forge.cipher.createDecipher('AES-GCM', key);
    // Set the IV (Initialization Vector)
    decipher.start({iv: ivBytes, tag: tagBuffer});
    // Set the secret data
    decipher.update(forge.util.createBuffer(encryptedDataBytes));
    // Finalize the decryption
    decipher.finish();

    // Check if the tag is correct
    if (decipher.mode.tag.toHex() === tagBuffer.toHex()) {
        // Take the decrypted data and convert it to a string
        let decryptedShare = decipher.output.getBytes();
        // Return correct share
        return Buffer.from(decryptedShare).toString();
    }

    return false;
}

function aesDecryptStringsWithSameKey(encryptedStrings: string[], key: string): string[] {
    const decryptedShares = [];

    for (let i = 0; i < encryptedStrings.length; i++) {
        const decryptedShare = aesDecryptString(encryptedStrings[i], key);

        if (decryptedShare !== false) decryptedShares.push(decryptedShare);
    }

    return decryptedShares;
}

function aesDecryptStrings(encryptedStringsWithKeys: string[][]): string[] {
    // Decrypt each share
    const decryptedStrings = [];

    for (let i = 0; i < encryptedStringsWithKeys.length; i++) {
        // Split the share into the encrypted data, iv and tag
        let encryptedShare = encryptedStringsWithKeys[i][0];
        let key = encryptedStringsWithKeys[i][1];

        const decryptedShare = aesDecryptString(encryptedShare, key);

        if (decryptedShare !== false) decryptedStrings.push(decryptedShare);
    }

    return decryptedStrings;
}

function splitSaltAndEncryptedShare(encryptedShare: string): string[] {
    // Split the share into the encrypted data, iv and tag
    let encryptedShareSplit = encryptedShare.split(":");
    let encryptedData = encryptedShareSplit[0];
    let ivHex = encryptedShareSplit[1];
    let tag = encryptedShareSplit[2];
    let saltHex = encryptedShareSplit[3];

    return [encryptedData + ":" + ivHex + ":" + tag, saltHex];
}

function saltAndShareToKey(shares: string[], password: string) {
    // Convert the salt to bytes
    let saltBytes = Buffer.from(shares[1], 'hex').toString('binary');

    // Get the AES-256 key from the password
    const key = forge.pkcs5.pbkdf2(password, saltBytes, 100001, 32);

    return [shares[0], key];
}

function aesDecryptStringsWithPassword(shamirShares: string[], password: string) {
    const shares = shamirShares.map(share => saltAndShareToKey(splitSaltAndEncryptedShare(share), password));

    // Decrypt all
    return aesDecryptStrings(shares);
}

export { hashPassword, aesDecryptStringsWithPassword, aesDecryptString, generateRSAKeypair, aesEncryptString, aesEncryptStringsWithPassword, aesDecryptStringsWithSameKey, generateNewShamirShares, mergeShamirShares };