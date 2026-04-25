import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatbotService } from '../../services/chatbot.service';

const API_BASE = 'http://localhost:8000';

export interface DgItem {
  un_number: string;
  proper_shipping_name: string;
  hazard_class: string;
  subsidiary_risk: string;
  packing_group: string;
  packing_instruction: string;
  quantity: string;
  quantity_unit: string;
  net_quantity: string;
  authorizations: string;
  special_provisions: string;
}

export interface DgdData {
  awb_number: string;
  message_id: string;
  shipper: { name: string; address: string };
  consignee: { name: string; address: string };
  origin: string;
  destination: string;
  piece_quantity: string;
  gross_weight: string;
  weight_unit: string;
  dg_items: DgItem[];
  emergency_phone: string;
  emergency_name: string;
  signatory_name: string;
  signatory_date: string;
}

export interface CheckResult {
  check_name: string;
  category: string;
  result: 'PASS' | 'FAIL' | 'N/A';
  message: string;
  regulation: string;
}

export type StepId = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-dg-shipment',
  templateUrl: './dg-shipment.component.html',
  styleUrls: ['./dg-shipment.component.css']
})
export class DgShipmentComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebarCollapsed = false;

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ── State ─────────────────────────────────────────────────────────────────
  currentStep: StepId = 1;
  isDragging = false;
  isLoading = false;
  loadingMessage = '';
  errorMessage = '';

  shipmentId: string = '';
  oneRecordId: string = '';
  createdAt: string = '';
  dgd: DgdData | null = null;
  rawXml: string = '';

  checkResults: CheckResult[] = [];
  checkStatus: 'PASSED' | 'FAILED' | '' = '';
  checkedAt: string = '';
  checkSource: string = '';
  apiNote: string = '';

  // ── Step definitions ──────────────────────────────────────────────────────
  steps = [
    { id: 1, label: 'Create', icon: 'upload_file', desc: 'Upload XSDG' },
    { id: 2, label: 'View', icon: 'description', desc: 'Review DGD' },
    { id: 3, label: 'Check', icon: 'fact_check', desc: 'DG AutoCheck' },
    { id: 4, label: 'Update', icon: 'sync', desc: 'Apply Results' },
    { id: 5, label: 'Verify', icon: 'verified', desc: 'Final DGD' },
  ];

  constructor(private http: HttpClient, private chatbotService: ChatbotService) { }

  // ── File handling ─────────────────────────────────────────────────────────
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging = false;
    if (e.dataTransfer?.files?.length) this.readFile(e.dataTransfer.files[0]);
  }
  onFileSelected(e: any) {
    if (e.target.files?.length) this.readFile(e.target.files[0]);
  }
  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      this.rawXml = ev.target.result;
      this.chatbotService.updateXmlContext(this.rawXml);
    };
    reader.readAsText(file);
  }

  // ── Sample XSDG ───────────────────────────────────────────────────────────
  loadSample() {
    this.rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:ShippersDeclarationForDangerousGoods
  xmlns:rsm="urn:un:unece:uncefact:data:standard:ShippersDeclarationForDangerousGoods:2"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:31"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>DGD-2024-FRA-001</ram:ID>
    <ram:IssueDateTime>
      <udt:DateTimeString formatCode="304">20241104T1430Z</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SpecifiedSupplyChainConsignment>
    <ram:AssociatedTransportDocument>
      <ram:ID>02012345678</ram:ID>
    </ram:AssociatedTransportDocument>
    <ram:ConsignorTradeParty>
      <ram:Name>A1R Cargo Solutions GmbH</ram:Name>
      <ram:PostalTradeAddress>
        <ram:LineOne>60 Cargo Drive</ram:LineOne>
        <ram:CityName>Frankfurt</ram:CityName>
        <ram:CountryID>DE</ram:CountryID>
      </ram:PostalTradeAddress>
    </ram:ConsignorTradeParty>
    <ram:ConsigneeTradeParty>
      <ram:Name>Global Logistics Corp.</ram:Name>
      <ram:PostalTradeAddress>
        <ram:LineOne>1 JFK Freight Hub</ram:LineOne>
        <ram:CityName>New York</ram:CityName>
        <ram:CountryID>US</ram:CountryID>
      </ram:PostalTradeAddress>
    </ram:ConsigneeTradeParty>
    <ram:DepartureTransportEvent>
      <ram:LoadingBaseportLocation>
        <ram:ID>FRA</ram:ID>
      </ram:LoadingBaseportLocation>
    </ram:DepartureTransportEvent>
    <ram:ArrivalTransportEvent>
      <ram:UnloadingBaseportLocation>
        <ram:ID>JFK</ram:ID>
      </ram:UnloadingBaseportLocation>
    </ram:ArrivalTransportEvent>
    <ram:PackageQuantity>3</ram:PackageQuantity>
    <ram:GrossWeightMeasure unitCode="K">45.0</ram:GrossWeightMeasure>
    <ram:IncludedSupplyChainConsignmentItem>
      <ram:TransportDangerousGoods>
        <ram:UNDGIdentification>
          <ram:ID>3480</ram:ID>
        </ram:UNDGIdentification>
        <ram:ProperShippingName>Lithium ion batteries</ram:ProperShippingName>
        <ram:HazardClassification>
          <ram:ClassCode>9</ram:ClassCode>
        </ram:HazardClassification>
        <ram:PackingGroup>II</ram:PackingGroup>
        <ram:PackingInstruction>PI 965 Section II</ram:PackingInstruction>
        <ram:MeasuredDGProductQuantity unitCode="kg">45.0</ram:MeasuredDGProductQuantity>
        <ram:AuthorizationInformation>CAO Only</ram:AuthorizationInformation>
      </ram:TransportDangerousGoods>
    </ram:IncludedSupplyChainConsignmentItem>
  </rsm:SpecifiedSupplyChainConsignment>
  <rsm:EmergencyContactInformation>
    <ram:TelephoneCommunication>
      <ram:CompleteNumber>+49-69-123-4567</ram:CompleteNumber>
    </ram:TelephoneCommunication>
    <ram:ResponsiblePartyName>CHEMTREC</ram:ResponsiblePartyName>
  </rsm:EmergencyContactInformation>
  <rsm:SignatoryContact>
    <ram:PersonName>Capt. Sarah Thorne</ram:PersonName>
  </rsm:SignatoryContact>
</rsm:ShippersDeclarationForDangerousGoods>`;
    this.errorMessage = '';
  }

  // ── Step 1: CREATE ────────────────────────────────────────────────────────
  createShipment() {
    if (!this.rawXml.trim()) { this.errorMessage = 'Please upload or load a sample XSDG file.'; return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.loadingMessage = 'Creating ONE Record DG Shipment…';

    this.http.post<any>(`${API_BASE}/api/dg/create`, this.rawXml, {
      headers: { 'Content-Type': 'text/xml' }
    }).subscribe({
      next: (res) => {
        this.shipmentId = res.shipment_id;
        this.oneRecordId = res.one_record_id;
        this.createdAt = res.created_at;
        this.dgd = res.dgd;
        this.isLoading = false;
        this.currentStep = 2;
        // Push DGD data to chatbot for context-aware conversations
        this.chatbotService.updateAwbContext({
          masterWaybill: { awbNumber: this.dgd?.awb_number, origin: this.dgd?.origin, destination: this.dgd?.destination },
          shipments: [{
            description: 'DG Shipment',
            totalWeight: this.dgd?.gross_weight,
            weightUnit: this.dgd?.weight_unit,
            pieces: [{
              dangerousGoods: (this.dgd?.dg_items || []).map((item: any) => ({
                unNumber: item.un_number,
                properShippingName: item.proper_shipping_name,
                hazardClass: item.hazard_class,
                packingGroup: item.packing_group,
                packingInstruction: item.packing_instruction,
                quantity: item.quantity,
                unit: item.quantity_unit
              }))
            }]
          }],
          checks: []
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = `Failed to create shipment: ${err?.error?.detail || err.message}`;
      }
    });
  }

  // ── Step 2 → 3: proceed to check ─────────────────────────────────────────
  proceedToCheck() { this.currentStep = 3; this.errorMessage = ''; }

  // ── Step 3: DG AUTOCHECK ──────────────────────────────────────────────────
  performCheck() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadingMessage = 'Sending XSDG to DG AutoCheck…';

    this.http.post<any>(`${API_BASE}/api/dg/check`, {
      shipment_id: this.shipmentId,
      xml_data: this.rawXml
    }).subscribe({
      next: (res) => {
        this.checkResults = res.checks || [];
        this.checkStatus = res.status;
        this.checkedAt = res.checked_at;
        this.checkSource = res.source;
        this.apiNote = res.api_note || '';
        this.isLoading = false;
        this.proceedToUpdate();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = `DG AutoCheck failed: ${err?.error?.detail || err.message}`;
      }
    });
  }

  // ── Step 4: UPDATE ────────────────────────────────────────────────────────
  proceedToUpdate() {
    this.isLoading = true;
    this.loadingMessage = 'Updating ONE Record shipment with check results…';

    this.http.post<any>(`${API_BASE}/api/dg/update`, {
      shipment_id: this.shipmentId,
      check_results: this.checkResults
    }).subscribe({
      next: (res) => {
        this.checkStatus = res.status;
        this.dgd = res.dgd;
        this.isLoading = false;
        this.currentStep = 5;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
      }
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset() {
    this.currentStep = 1;
    this.rawXml = '';
    this.shipmentId = '';
    this.dgd = null;
    this.checkResults = [];
    this.checkStatus = '';
    this.errorMessage = '';
    this.isLoading = false;
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get passCount() { return this.checkResults.filter(c => c.result === 'PASS').length; }
  get failCount() { return this.checkResults.filter(c => c.result === 'FAIL').length; }

  get formattedCreatedAt(): string {
    if (!this.createdAt) return '';
    return new Date(this.createdAt).toLocaleString();
  }

  get formattedCheckedAt(): string {
    if (!this.checkedAt) return '';
    return new Date(this.checkedAt).toLocaleString();
  }

  isStepCompleted(stepId: number): boolean { return this.currentStep > stepId; }
  isStepActive(stepId: number): boolean { return this.currentStep === stepId; }
  isStepReachable(stepId: number): boolean { return this.currentStep >= stepId; }
}
