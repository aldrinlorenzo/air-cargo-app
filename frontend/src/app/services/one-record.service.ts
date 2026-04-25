import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OneRecordService {
//    private baseUrl = 'https://champ-onerecord.germanywestcentral.cloudapp.azure.com';
  
    constructor(private http: HttpClient) { }
  
    getAccessToken(): Observable<any> {

        const body = new HttpParams()
            .set('grant_type', 'client_credentials')
            .set('client_id', 'onerecord-a1r-cargo-rangers')
            .set('client_secret', 'ZuH40SeVGWrt7xgaLbuMILAHKJGSgY69');
    
        const httpOptions = {
            headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
            })
        };
    
        return this.http.post('/token', body.toString(), httpOptions);

    }

    ingestJsonXsdg(token: any, json : any) : Observable<any> {

        json['type'] = 'FWB';
        const declaration = json['ShippersDeclarationForDangerousGoods'][0];
        json['airWaybillNumber'] = declaration.MessageHeaderDocument[0].ID[0];
        json['payload'] = declaration;
        delete json['ShippersDeclarationForDangerousGoods']

        const pw = "Kox!+)H>vutLp12`ek+s";
        const credentials = btoa(`a1r-cargo-rangers:${pw}`);

        const httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'X-Requested-With': 'XMLHttpRequest'
            }),
            // withCredentials: true
        };

        return this.http.post('/api-b/inbound-message/cargo-hub/AIR_CARGO_RANGERS', json, httpOptions);
    }

    ingestCheckResultInOneRecord(autocheckPayload: any) : Observable<any> {

        let payload : any = {};
        
        payload['type'] = 'FHL';
        payload['airWaybillNumber'] = autocheckPayload.airWaybillNumber
        payload['payload'] = autocheckPayload;

        const pw = "Kox!+)H>vutLp12`ek+s";
        const credentials = btoa(`a1r-cargo-rangers:${pw}`);

        const httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'X-Requested-With': 'XMLHttpRequest'
            }),
            // withCredentials: true
        };

         return this.http.post('/api-b/inbound-message/cargo-hub/AIR_CARGO_RANGERS', payload, httpOptions);

    }

    getFullAwb(airWaybillNumber: string): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(tokenResponse => {
                const token = tokenResponse.access_token;
                
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${token}`
                });

                return this.http.get(`/api/AIR_CARGO_RANGERS/logistics-objects/awb-${airWaybillNumber}?embedded=true`, { headers });
            })
        );
    }
    

}
