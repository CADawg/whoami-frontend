const usernameRegex = /^[a-z0-9_]{3,20}$/;
const usernameTypingRegex = /^[a-z0-9_]{0,20}$/;
const emailRegex = /^(?=[a-z0-9@.!#$%&'*+/=?^_‘{|}~-]{6,254})(?=[a-z0-9.!#$%&'*+/=?^_‘{|}~-]{1,64})[a-z0-9!#$%&'*+/=?^_‘{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_‘{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63})[a-z0-9]([a-z0-9-]*[a-z0-9])$/i;
const validDecryptionKeyRegex = /^[a-z0-9]{64}$/i;

export {
    usernameRegex,
    emailRegex,
    usernameTypingRegex,
    validDecryptionKeyRegex
};