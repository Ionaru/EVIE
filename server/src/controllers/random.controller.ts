/**
 * Generate a random string from a range of 62 characters
 * @param {number} length - The length of the desired string
 * @return {string} - The randomly generated string
 */
export function generateRandomString(length: number): string {
    let output = '';
    const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        output += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return output;
}
