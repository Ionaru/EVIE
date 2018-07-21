/**
 * Several static helper functions.
 */
export class Helpers {

    public static ESIURL = 'https://esi.tech.ccp.is';

    /**
     * Wrapper for the setInterval function, it will execute the passed function immediately before calling setInterval
     * @param {function} fn - The function to run
     * @param {number} interval - The interval of the repeat
     * @param {Array} params - Additional parameters to pass to fn
     * @return {Timer} - Timer object for the interval function, used for clearInterval()
     */
    public static repeat(fn: (...params: any[]) => any, interval: number, ...params: any[]): number {
      fn(...params);
      return setInterval(fn, interval, ...params);
    }

    // public static createTitle(name: string): string {
    //   return `EVE-Track - ${name}`;
    // }
    //
    // public static isEmpty(obj: any): boolean {
    //   // null and undefined are "empty"
    //   if (obj == null) {
    //     return true;
    //   }
    //
    //   // Assume if it has a length property with a non-zero value then that property is correct.
    //   if (obj.length > 0) {
    //     return false;
    //   }
    //   if (obj.length === 0) {
    //     return true;
    //   }
    //
    //   // If it isn't an object at this point
    //   // it is empty, but it can't be anything *but* empty
    //   // Is it empty?  Depends on your application.
    //   if (typeof obj !== 'object') {
    //     return true;
    //   }
    //
    //   // Otherwise, does it have any properties of its own?
    //   // Note that this doesn't handle
    //   // toString and valueOf enumeration bugs in IE < 9
    //   return Object.getOwnPropertyNames(obj).length <= 0;
    // }

    public static formatNumber(amount: number | string, decimalAmount = 2, decimalMark = '.', delimiter = ','): string {

        if (decimalAmount === Infinity) {
            // Set a dynamic number of decimal places, depending on the input.
            decimalAmount = 0;
            const numberParts = amount.toString().split('.');
            if (numberParts[1]) {
                decimalAmount = numberParts[1].length;
            }
        }

        let amountNumber = Number(amount);

        if (isNaN(amountNumber)) {
            amountNumber = 0;
        }

        let negativeMarker = '';
        if (amountNumber < 0) {
            negativeMarker = '-';
        }

        const absoluteAmountString = Math.abs(amountNumber).toFixed(decimalAmount);

        const integerString = parseInt(absoluteAmountString, 10).toString();

        const digits = integerString.length;

        let characterAmountAtFront = 0;
        if (digits > 3) {
            characterAmountAtFront = digits % 3; // Determine amount of left-over characters at the front.
        }

        let firstDigits = '';
        if (characterAmountAtFront) {
            firstDigits = integerString.substr(0, characterAmountAtFront);
            firstDigits += delimiter;
        }

        let middleText = '';
        let charCounter = 0;
        const middleCharacters = integerString.substr(characterAmountAtFront);
        for (const char of middleCharacters) {
            // Skip the first delimiter because it's either added with the firstDigits or not needed.
            if (charCounter && charCounter % 3 === 0) {
                middleText += delimiter;
            }
            middleText += char;
            charCounter++;
        }

        let decimalText = '';
        if (decimalAmount) {
            const decimalNumbers = Number(absoluteAmountString) - parseInt(absoluteAmountString, 10);
            decimalText = decimalMark + decimalNumbers.toFixed(decimalAmount).slice(2); // slice first 2 characters from 0.XXX
        }

        return negativeMarker + firstDigits + middleText + decimalText;
    }

    // public processXML(response: Response): object {
    //   try {
    //     let jsonObject = {};
    //
    //     parseString(response.text(), (error, json) => {
    //       if (error) {
    //         throw error;
    //       }
    //       jsonObject = json;
    //     });
    //     return jsonObject;
    //   } catch (error) {
    //     // this.logger.error(error);
    //     return {err: 'XMLParseError'};
    //   }
    // }
    //
    // public isCacheExpired(cacheEndTime: string): boolean {
    //   const cacheEndTimeDate = Helpers.eveTimeToDate(cacheEndTime).getTime();
    //   const currentTime = new Date().getTime();
    //   const distance = cacheEndTimeDate - currentTime;
    //   return distance < -5000;
    // }

    // public static eveTimeToDate(dateString: string): Date {
    //     try {
    //         const d = dateString.replace(/-/ig, '/').split('.')[0] + ' UTC';
    //         console.log(d);
    //         return new Date(dateString.replace(/-/ig, '/').split('.')[0] + ' UTC');
    //     } catch (error) {
    //         return new Date(dateString);
    //     }
    // }

    public static constructESIUrl(version: number, ...path: Array<string | number>): string {
        let url = `${Helpers.ESIURL}/v${version}/`;
        if (path.length) {
            url += `${path.join('/')}/`;
        }
        return url;
    }

    public static sortArrayByObjectProperty(array: any[], property: string, inverse = false): any[] {

        const compare = (a: any, b: any) => {
            let left = a[property];
            let right = b[property];

            if (!left || !right) {
                throw new Error(`Unable to compare values '${left}' and '${right}'`);
            }

            if (typeof left !== typeof right) {
                throw new Error(`Unable to compare different types: '${left}' (${typeof left}) and '${right}' (${typeof right})`);
            }

            // We know the types are the same, but it's better to make absolutely sure.
            if (typeof left === 'string' && typeof right === 'string') {
                left = left.toUpperCase();
                right = right.toUpperCase();
            }

            if (left < right) {
                return inverse ? 1 : -1;
            }
            if (left > right) {
                return inverse ? -1 : 1;
            }
            return 0;
        };

        return array.sort(compare);
    }
}
