import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

export interface DangerousGood {
  unNumber: string | null;
  properShippingName: string | null;
  hazardClass: string | null;
  packingGroup: string | null;
  quantity: string | null;
  unit: string | null;
  packingInstruction: string | null;
  radioactive: string | null;
  qValue: string | null;
}

export interface DgDeclaration {
  declarationType: string | null;
  declarationDate: string | null;
  shipperSignature: string | null;
  complianceMethod: string | null;
}

export interface Piece {
  pieceId: string | null;
  pieceDescription: string | null;
  weight: string | null;
  weightUnit: string | null;
  dangerousGoods: DangerousGood[];
  dgDeclaration: DgDeclaration;
}

export interface Shipment {
  shipmentId: string | null;
  description: string | null;
  totalWeight: string | null;
  weightUnit: string | null;
  pieceCount: string | null;
  commodity: string | null;
  pieces: Piece[];
}

export interface WaybillInfo {
  id: string | null;
  awbNumber: string | null;
  prefix: string | null;
  origin: string | null;
  destination: string | null;
  carrier: string | null;
  type: string | null;
}

export interface CheckResult {
  checkType: string | null;
  checkResult: string | null;
  checkDate: string | null;
  checkedBy: string | null;
  remarks: string | null;
}

export interface AwbDashboardData {
  masterWaybill: WaybillInfo;
  houseWaybills: WaybillInfo[];
  shipments: Shipment[];
  checks: CheckResult[];
  rawData: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private authUrl = 'https://champ-onerecord.germanywestcentral.cloudapp.azure.com/auth/realms/onerecord/protocol/openid-connect/token';
  private baseUrl = 'https://champ-onerecord.germanywestcentral.cloudapp.azure.com/api/AIR_CARGO_RANGERS/logistics-objects';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats`);
  }

  getAwbCompliance(awb: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/awb/${awb}/compliance`);
  }

  getUldStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/uld/status`);
  }

  /** Fetch parsed ONE Record AWB data via the backend proxy */
  // getOneRecordAwb(awbId: string): Observable<AwbDashboardData> {
  //   return this.http.get<AwbDashboardData>(`${this.baseUrl}${awbId}?embedded=true`);
  // }

  /** Fetch raw ONE Record JSON-LD response (for debugging) */
  getOneRecordRaw(awbId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/onerecord/raw/${awbId}`);
  }




  // 1. Method to get the Access Token
  private getToken(): Observable<any> {
    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', 'onerecord-a1r-cargo-rangers')
      .set('client_secret', 'ZuH40SeVGWrt7xgaLbuMILAHKJGSgY69');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });


    // this.http.post('/token', body.toString(), { headers }).subscribe({
    //   next: (res) => {
    //     console.log(res);
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
    //   }
    // });

    return this.http.post<any>('/token', body.toString(), { headers });
  }

  // 2. Method to get data using the token
  getOneRecordAwb(awbId: string): Observable<AwbDashboardData> {
    return this.getToken().pipe(
      switchMap(tokenResponse => {
        const token = tokenResponse.access_token;
        console.log(token);

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get<AwbDashboardData>(
          `${this.baseUrl}/awb-${awbId}?embedded=true`,
          { headers }
        );
      })
    );
  }
}


