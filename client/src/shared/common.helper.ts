/**
 * Several static helper functions.
 */
export class Common {
    /**
     * Simple function to return the input argument, usable in .catch() functions for promises.
     * @param {T} parameter - Parameter to return.
     * @return {T}
     */
    public static return = <T> (parameter: T): T => parameter;

    public static generateNumbersArray = (length: number) => Array(length).fill(undefined).map((_, i) => i + 1);

    public static uniquifyArray<T>(array: T[]): T[] {
        return array.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
    }

    public static objectsArrayToObject<T>(array: any[], key: string): T {

        const object: any = {};

        for (const item of array) {
            object[item[key]] = item;
        }

        return object;
    }

    public static romanize(num: number): string {
        if (isNaN(num)) {
            throw new Error(`${num} is not a number that can be converted to roman numerals.`);
        }

        const digits = String(num).split('');
        const key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
                '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
                '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
        let roman = '';
        let i = 3;
        while (i--) {
            roman = (key[+(digits.pop() as string) + (i * 10)] || '') + roman;
        }
        return Array(+digits.join('') + 1).join('M') + roman;
    }

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

    /**
     * Sort an array of objects by one of the object's properties (in-place).
     * @param array - The array to sort.
     * @param property - The property name to sort by. (can be property.property)
     * @param inverse - Inverse the output (descending).
     */
    public static sortArrayByObjectProperty<T>(array: T[], property: string, inverse = false): T[] {

        const compare = (a: any, b: any) => {
            let left = property.split('.').reduce((o, i) =>  o ? o[i] : o, a);
            let right = property.split('.').reduce((o, i) =>  o ? o[i] : o, b);

            if (left === undefined || right === undefined) {
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
