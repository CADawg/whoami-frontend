import forge from "node-forge";
import secrets from 'secrets.js-34r7h';

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

/**
 * Generates 2 new shamir shares for the User (based on a 256 bit AES secret key)
 */
function generateNewShamirShares() {
    // Get random bits using grempe's secrets.js library
    // These 256 bits are used for AES-256 encryption of the user's data
    const cryptographicKey = secrets.random(256);

    // We now have 2 shares belonging to the user
    // Return them
    return secrets.share(cryptographicKey, 2, 2);
}

// Use node-forge and the user's password to encrypt each shamir share
function encryptShamirSharesWithAES(shamirShares: string[], password: string) {
    // Get a random salt
    let salt = forge.random.getBytesSync(128);
    // Get the AES-256 key from the password
    const key = forge.pkcs5.pbkdf2(password, salt, 100001, 32);

    // Encrypt each share
    const encryptedShares = [];

    for (let i = 0; i < shamirShares.length; i++) {
        // Forge AES GCM stands for Galois/Counter Mode and is considered secure (by the US government and BitWarden, so it's good enough for us)
        const cipher = forge.cipher.createCipher('AES-GCM', key);
        // Set the IV (Initialization Vector)
        let iv = forge.random.getBytesSync(16);

        cipher.start({iv});
        // Set the secret data
        cipher.update(forge.util.createBuffer(shamirShares[i]));
        // Finalize the encryption
        cipher.finish();

        console.log(iv);

        const tagBytes = cipher.mode.tag.getBytes();

        // Take the Tag and convert it to hex
        let tagHex = forge.util.binary.hex.encode(tagBytes);
        let ivHex = forge.util.binary.hex.encode(iv);
        let saltHex = Buffer.from(salt, "binary").toString("hex");

        let encryptedShare = forge.util.binary.hex.encode(cipher.output.getBytes());

        // Add the share, iv and tagHex to the array
        encryptedShares.push(encryptedShare + ":" + ivHex + ":" + tagHex + ":" + saltHex);
    }

    return encryptedShares;
}

function decryptShamirSharesWithAES(shamirShares: string[], password: string) {
    // Decrypt each share
    const decryptedShares = [];

    let key, lastSalt = "";

    for (let i = 0; i < shamirShares.length; i++) {
        // Split the share into the encrypted data, iv and tag
        let encryptedShare = shamirShares[i].split(":");
        let encryptedData = encryptedShare[0];
        let ivHex = encryptedShare[1];
        let tag = encryptedShare[2];
        let saltHex = encryptedShare[3];

        let salt = Buffer.from(saltHex, "hex").toString("binary");

        if (lastSalt !== saltHex || key === undefined) {
            // Get the AES-256 key from the password
            key = forge.pkcs5.pbkdf2(password, salt, 100001, 32);
            // Set the last salt
            lastSalt = saltHex;
        }

        // Convert the hex to bytes
        let encryptedDataBytes = forge.util.binary.hex.decode(encryptedData);
        let ivBytes = Buffer.from(ivHex, 'hex').toString('binary');
        let tagBuffer = forge.util.createBuffer(forge.util.binary.hex.decode(tag));

        console.log(ivBytes);

        // Forge AES GCM stands for Galois/Counter Mode and is considered secure (by the US government and BitWarden, so it's good enough for us)
        const decipher = forge.cipher.createDecipher('AES-GCM', key);
        // Set the IV (Initialization Vector)
        decipher.start({iv: ivBytes, tag: tagBuffer});
        // Set the secret data
        decipher.update(forge.util.createBuffer(encryptedDataBytes));
        // Finalize the decryption
        decipher.finish();

        // Check if the tag is correct
        //if (decipher.mode.tag.toHex() === tagBuffer.toHex()) {
        // Take the decrypted data and convert it to a string
        let decryptedShare = decipher.output.getBytes();
        let decryptedShareString = Buffer.from(decryptedShare).toString();

        // Add the share to the array
        decryptedShares.push(decryptedShareString);
        //} else {
        //return false;
        // }
    }

    return decryptedShares;
}

export { hashPassword, decryptShamirSharesWithAES, encryptShamirSharesWithAES, generateNewShamirShares };