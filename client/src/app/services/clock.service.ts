import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Helpers } from '../shared/helpers';

@Injectable()
export class ClockService {

  private endpoint: Endpoint;

  constructor(private http: Http, private endpointService: EndpointService, private helpers: Helpers) {
    this.endpoint = this.endpointService.getEndpoint('ServerStatus');
  }

  getTime(): Observable<Object> {
    const url = this.endpointService.constructXMLUrl(this.endpoint);
    const headers = new Headers();
    headers.append('Accept', 'application/xml');
    return this.http.get(url, {
      headers: headers
    }).map((response: Response) => {
      const jsonData = this.helpers.processXML(response);
      return ClockService.processTime(jsonData);
    });
  }

  private static processTime(jsonData: Object): Object {
    const currentTime = jsonData['eveapi']['currentTime'][0];
    let hours: any = parseInt(currentTime.slice(-8, -6), 10);
    let minutes: any = parseInt(currentTime.slice(-5, -3), 10);
    const seconds = parseInt(currentTime.slice(-2), 10);
    let status = jsonData['eveapi']['result'][0]['serverOpen'][0];
    const players = jsonData['eveapi']['result'][0]['onlinePlayers'][0];

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
