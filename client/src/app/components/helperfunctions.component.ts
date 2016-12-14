import { Response } from '@angular/http';

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
  if (Object.getOwnPropertyNames(obj).length > 0) {
    return false;
  }

  return true;
}

export function checkAccess(accessMask: number, testAgainst: number): boolean {
  return (accessMask & testAgainst) > 0;
}

export function processXML(res: Response): Object {
  let parser: DOMParser = new DOMParser();
  let xmlData: XMLDocument = parser.parseFromString(res['_body'], 'application/xml');
  return xmlToJson(xmlData);
}

export function xmlToJson(xml: Document | Node): Object {

  // Create the return object
  let obj = {};

  if (xml.nodeType === 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        let attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      let item = xml.childNodes.item(i);
      let nodeName = item.nodeName;
      if (typeof(obj[nodeName]) === 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) === 'undefined') {
          let old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

export function formatISK(amount: number | string, c: number = 2, d: string = '.', t: string = ','): string {
  let i: any, j: any, n: any, s: any;
  n = Number(amount);
  s = n < 0 ? '-' : '';
  i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + '';
  j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
    (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
}

export function isCacheExpired(cacheEndTime: string): boolean {
  let cacheEndTimeDate = Date.parse(cacheEndTime.replace(/-/ig, '/').split('.')[0]);
  cacheEndTimeDate += 3600000;
  let currentTime = new Date().getTime();
  let distance = cacheEndTimeDate - currentTime;
  return distance < -5000;
}
