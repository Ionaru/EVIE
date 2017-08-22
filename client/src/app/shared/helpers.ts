import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';
import { parseString } from 'xml2js';
import Timer = NodeJS.Timer;

@Injectable()
export class Helpers {

  /**
   * Wrapper for the setInterval function, it will execute the passed function immediately before calling setInterval
   * @param {function} fn - The function to run
   * @param {number} interval - The interval of the repeat
   * @param {Array} params - Additional parameters to pass to fn
   * @return {Timer} - Timer object for the interval function, used for clearInterval()
   */
  public static repeat(fn: (...params) => void, interval: number, ...params: any[]): Timer {
    fn(...params);
    return setInterval(fn, interval, ...params);
  }

  public static createTitle(name: string): string {
    return `EVE-Track - ${name}`;
  }

  public static isEmpty(obj: any): boolean {
    // null and undefined are "empty"
    if (obj == null) {
      return true;
    }

    // Assume if it has a length property with a non-zero value then that property is correct.
    if (obj.length > 0) {
      return false;
    }
    if (obj.length === 0) {
      return true;
    }

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== 'object') {
      return true;
    }

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    return Object.getOwnPropertyNames(obj).length <= 0;
  }

  public static formatAmount(amount: number | string, decimals = 2, decimalMark = '.', delimiter = ','): string {
    let i: any;
    let j: any;
    let n: any;
    let s: any;
    n = Number(amount);
    s = n < 0 ? '-' : '';
    i = parseInt(n = Math.abs(+n || 0).toFixed(decimals), 10) + '';
    j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + delimiter : '') +
      i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + delimiter) +
      (decimals ? decimalMark + Math.abs(n - i).toFixed(decimals).slice(2) : '');
  }

  constructor(private logger: Logger) { }

  public processXML(response: Response): object {
    try {
      let jsonObject = {};

      parseString(response.text(), (error, json) => {
        if (error) {
          throw error;
        }
        jsonObject = json;
      });
      return jsonObject;
    } catch (error) {
      this.logger.error(error);
      return {err: 'XMLParseError'};
    }
  }

  public isCacheExpired(cacheEndTime: string): boolean {
    const cacheEndTimeDate = this.eveTimeToDate(cacheEndTime).getTime();
    const currentTime = new Date().getTime();
    const distance = cacheEndTimeDate - currentTime;
    return distance < -5000;
  }

  public eveTimeToDate(dateString: string): Date {
    try {
      return new Date(dateString.replace(/-/ig, '/').split('.')[0] + ' UTC');
    } catch (error) {
      this.logger.error(error);
      return new Date();
    }
  }

  public sortArrayByObjectProperty(array: any[], property: string, inverse = false): any[] {

    const compare = (a, b) => {
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
