/**
 * Several static helper functions for calculations.
 */
export class Calc {

    public static maxIntegerValue = Math.pow(2, 31);

    public static partPercentage = (part: number, total: number) => (part / total) * 100;

    public static wholeHoursLeft = (duration: number) => Math.floor(duration / (3600000));
    public static wholeDaysLeft = (duration: number) => Math.floor(duration / (86400000));

    /**
     * Generate a random string from a range of 62 characters
     * @param {number} length - The length of the desired string
     * @return {string} - The randomly generated string
     */
    public static generateRandomString(length: number): string {
        let output = '';
        const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            output += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }
        return output;
    }
}
