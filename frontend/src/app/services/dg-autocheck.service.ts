import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DgAutocheckService {
//    private baseUrl = 'https://qa-dgautocheck.iata.org';
  
    private bearerToken = '';

    constructor(private http: HttpClient) {
        this.getBearerToken()
        .subscribe({
            next: (res) => {
              this.bearerToken = res.access_token;
            }
          });       
     }
  
    getBearerToken() : Observable<any> {
    
        const body = new HttpParams()
            .set('grant_type', 'client_credentials')
            .set('client_id', 'h1oPJKlYo_YW9DrH5pff0A')
            .set('client_secret', 'qSm4NH5OCYmm0kmzWJTzSI2d0FHhr3RgJPBLOBGcwzkhAwhpbbpPwCiYIojkwWtJ_fi_nlnEtthFyS-ry4xP3g');

        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
            })
        };
        return this.http.post('/oauth2/token', body.toString(), httpOptions);
    }
    
    createAcceptanceChecks() : Observable<any> {

        const params = new HttpParams()
            .set('officeIdentifier', 'Hong Kong')
            .set('userIdentifier', 'user-ranger');

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.bearerToken}`
        });

        return this.http.post('/api/v1/acceptance-checks', params.toString(), { headers });
    }
    
    importXsdgDgAutocheck(acceptanceCheckId: string, rawXml: string) : Observable<any> {

        const headers = new HttpHeaders({
            'Content-Type': 'application/xml',
            'Authorization': `Bearer ${this.bearerToken}`
        });
        
        return this.http.put(`/api/v1/acceptance-checks/${acceptanceCheckId}/import/xsdg`, rawXml, { headers });        
    }

    requestUrl(acceptanceCheckId: string) : Observable<any> {

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.bearerToken}`
        });

        const params = new HttpParams()
            .set('userIdentifier', 'user-ranger');

         return this.http.post(`/api/v1/acceptance-checks/${acceptanceCheckId}/request-url`, params.toString(), { headers });        
    }


    getCheckResult(acceptanceCheckId: string) : Observable<any> {

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.bearerToken}`
        });

         return this.http.get(`/api/v1/acceptance-checks/${acceptanceCheckId}`, { headers });        
    }
}
