import { Response } from '@angular/http';
import { parseString } from 'xml2js';
import { Logger } from 'angular2-logger/core';

const logger = new Logger();

export function isEmpty(obj: any): boolean {

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

export function processXML(response: Response): Object {
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
    logger.error(error);
    return 'XMLParseError';
  }
}

export function formatISK(amount: number | string, decimals = 2, decimalMark = '.', delimiter = ','): string {
  let i: any, j: any, n: any, s: any;
  n = Number(amount);
  s = n < 0 ? '-' : '';
  i = parseInt(n = Math.abs(+n || 0).toFixed(decimals), 10) + '';
  j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + delimiter : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + delimiter) +
    (decimals ? decimalMark + Math.abs(n - i).toFixed(decimals).slice(2) : '');
}

export function isCacheExpired(cacheEndTime: string): boolean {
  let cacheEndTimeDate = stringToDate(cacheEndTime).getTime();
  cacheEndTimeDate += 3600000;
  const currentTime = new Date().getTime();
  const distance = cacheEndTimeDate - currentTime;
  return distance < -5000;
}

export function stringToDate(dateString): Date {
  return new Date(dateString.replace(/-/ig, '/').split('.')[0]);
}
