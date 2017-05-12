import { Response } from '@angular/http';
import { parseString } from 'xml2js';
import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

@Injectable()
export class Helpers {
  constructor(private logger: Logger) { }

  isEmpty(obj: any): boolean {
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

  processXML(response: Response): Object {
    try {
      let jsonObject = {};

      parseString(response.text(), function (error, json) {
        if (error) {
          throw error;
        }
        jsonObject = json;
      });
      return jsonObject;
    } catch (error) {
      this.logger.error(error);
      return 'XMLParseError';
    }
  }

  formatAmount(amount: number | string, decimals = 2, decimalMark = '.', delimiter = ','): string {
    let i: any, j: any, n: any, s: any;
    n = Number(amount);
    s = n < 0 ? '-' : '';
    i = parseInt(n = Math.abs(+n || 0).toFixed(decimals), 10) + '';
    j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + delimiter : '') +
      i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + delimiter) +
      (decimals ? decimalMark + Math.abs(n - i).toFixed(decimals).slice(2) : '');
  }

  isCacheExpired(cacheEndTime: string): boolean {
    const cacheEndTimeDate = this.eveTimeToDate(cacheEndTime).getTime();
    const currentTime = new Date().getTime();
    const distance = cacheEndTimeDate - currentTime;
    return distance < -5000;
  }

  eveTimeToDate(dateString: string): Date {
    try {
      return new Date(dateString.replace(/-/ig, '/').split('.')[0] + ' UTC');
    } catch (error) {
      this.logger.error(error);
      return new Date();
    }
  }

  sortArrayByObjectProperty(array: Array<any>, property: string, inverse = false): Array<any> {

    function compare(a, b) {
      let left = a[property];
      let right = b[property];

      if (!left || !right) {
        // this.logger.error('Unable to compare values', left, right);
        throw new Error(`Unable to compare values '${left}' and '${right}'`);
      }

      try {
        left = left.toUpperCase();
        right = right.toUpperCase();
      } catch (err) {
      }

      if (left < right) {
        return inverse ? 1 : -1;
      }
      if (left > right) {
        return inverse ? -1 : 1;
      }
      return 0;
    }

    return array.sort(compare);
  }

  /**
   * Wrapper for the setInterval function, it will execute the passed function immediately before calling setInterval
   * @param {Function} fn - The name of the property to fetch
   * @param {number} interval - The name of the property to fetch
   * @param {Array<any>} params - Additional parameters to pass to fn
   * @return {number} - ID value for the interval function, used for clearInterval()
   */
  static repeat(fn: Function, interval: number, ...params: Array<any>): number {
    fn(...params);
    return setInterval(fn, interval, ...params);
  }
}
