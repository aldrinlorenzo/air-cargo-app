import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }


  convertToReadableJson(rawXml: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/dg/read`, rawXml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }

  convertXmlToJson(rawXml: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/dg/convert`, rawXml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats`);
  }

  getAwbCompliance(awb: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/awb/${awb}/compliance`);
  }
  
  getUldStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/uld/status`);
  }
}
