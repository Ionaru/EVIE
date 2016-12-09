import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Globals } from '../../globals';
import { Observable } from 'rxjs';
import { Endpoint } from '../../components/endpoint/endpoint';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { xmlToJson } from '../../components/helperfunctions.component';

@Injectable()
export class ClockService {

  private endpoint: Endpoint;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('ServerStatus');
  }

  getTime(): Observable<Object> {
    let url = this.es.constructUrl(this.endpoint);
    let headers = new Headers();
    headers.append('Accept', 'application/xml');
    // let res = await this.http.get(url, {headers: headers}).toPromise();
    return this.http.get(url, {
      headers: headers
    }).map((res: Response) => {
      let xmlData = this.globals.DOMParser.parseFromString(res['_body'], 'application/xml');
      let jsonData = xmlToJson(xmlData);
      return ClockService.processTime(jsonData);
    });
  }

  private static processTime(jsonData: Object): Object {
    let currentTime = jsonData['eveapi']['currentTime']['#text'];
    let hours: any = parseInt(currentTime.slice(-8, -6), 10);
    let minutes: any = parseInt(currentTime.slice(-5, -3), 10);
    let seconds = parseInt(currentTime.slice(-2), 10);
    let status = jsonData['eveapi']['result']['serverOpen']['#text'];
    let players = jsonData['eveapi']['result']['onlinePlayers']['#text'];

    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    } else if (minutes < 10) {
      minutes = '0' + minutes.toString();
    }
    if (hours === 24) {
      hours = 0;
    } else if (hours < 10) {
      hours = hours.toString();
      hours = '0' + hours;
    }
    if (status === 'True') {
      status = 'Online';
    } else {
      status = 'Offline';
    }

    return {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      status: status,
      players: players
    };
  }

  static tickTime(time: Object): Object {
    let h: any = parseInt(time['hours'], 10);
    let m: any = parseInt(time['minutes'], 10);
    m += 1;
    if (m === 60) {
      h += 1;
      m = 0;
    }
    if (m < 10) {
      m = '0' + m.toString();
    }
    if (h === 24) {
      h = 0;
    }
    if (h < 10) {
      h = '0' + h.toString();
    }
    return {
      hours: h,
      minutes: m,
      status: time['status'],
      players: time['players']
    };
  }
}
