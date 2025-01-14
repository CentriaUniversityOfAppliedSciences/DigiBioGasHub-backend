
import * as crypto from 'crypto';
const keyLength = 64;
/**
 * Has a password or a secret with a password hashing algorithm (scrypt)
 * @param {string} password
 * @returns {string} The salt+hash
 */
var hash = async (password) => {
  return new Promise((resolve, reject) => {
    // generate random 64 bytes long salt 
    const salt = crypto.randomBytes(64).toString("hex");
    crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err);
      // derivedKey is of type Buffer
      resolve(`${salt}.${derivedKey.toString("hex")}`);
    });
  });
};
/**
 * Compare a plain text password with a salt+hash password
 * @param {string} password The plain text password
 * @param {string} hash The hash+salt to check against
 * @returns {boolean}
 */
var compare = async (password, hash) => {
  return new Promise((resolve, reject) => {
    const [salt, hashKey] = hash.split(".");
    // we need to pass buffer values to timingSafeEqual
    const hashKeyBuff = Buffer.from(hashKey, "hex");
    crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err);
      // compare the new supplied password with the hashed password using timeSafeEqual
      resolve(crypto.timingSafeEqual(hashKeyBuff, derivedKey));
    });
  });
};

export default {hash, compare};