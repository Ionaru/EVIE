import { Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';

const logger = new Logger();

export function isEmpty(obj: any): boolean {

  // null and undefined are "empty"
  if (obj == null) {
    return true;
  }

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
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

export function checkAccess(accessMask: number, testAgainst: number): boolean {
  return (accessMask & testAgainst) > 0;
}

export function processXML(response: Response): Object {
  try {
    const parser: DOMParser = new DOMParser();
    const xmlData: XMLDocument = parser.parseFromString(response.text(), 'application/xml');
    return xmlToJson(xmlData);
  } catch (error) {
    logger.error(error);
    return 'XMLParseError';
  }
}

export function xmlToJson(xml: Document | Node): Object {

  // Create the return object
  let obj = {};

  if (xml.nodeType === 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (typeof(obj[nodeName]) === 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) === 'undefined') {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
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
