import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  pieces: Piece[];
  dgDeclaration: DgDeclaration;
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

export interface SubCheck {
  checkId: string | null;
  checkType: string | null;
  checkResult: string | null;
  checkDate: string | null;
  checkedBy: string | null;
  checkStatus: string | null;
  createdOn: string | null;
}

export interface CheckResult {
  checkId: string | null;
  checkType: string | null;
  checkResult: string | null;
  checkDate: string | null;
  checkedBy: string | null;
  checkStatus: string | null;
  createdOn: string | null;
  subChecks: SubCheck[];
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
  private backendUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/dashboard/stats`);
  }

  getAwbCompliance(awb: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/awb/${awb}/compliance`);
  }

  getUldStatus(): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/uld/status`);
  }

  /** Fetch raw ONE Record JSON-LD response (for debugging) */
  getOneRecordRaw(awbId: string): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/api/onerecord/raw/${awbId}`);
  }

  /** Fetch parsed ONE Record AWB data via the backend proxy */
  getOneRecordAwb(awbId: string): Observable<AwbDashboardData> {
    return this.http.get<AwbDashboardData>(
      `${this.backendUrl}/api/onerecord/awb/${awbId}`
    );
  }
}


