import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';
import { OneRecordService } from 'src/app/services/one-record.service';
import { DgAutocheckService } from 'src/app/services/dg-autocheck.service';


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

  humanReadable = '';
  acceptanceCheckId = '';
  airWaybillNumber = '';
  fullAwb: any = {};

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebarCollapsed = false;

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ── Step definitions ──────────────────────────────────────────────────────
  steps = [
    { id: 1, label: 'Create', icon: 'upload_file', desc: 'Upload XSDG' },
    { id: 2, label: 'Check', icon: 'check', desc: 'Check DGD' },
    { id: 3, label: 'Result', icon: 'fact_check', desc: '1R DG Shipment' }
  ];

  constructor(private http: HttpClient,
    private apiService: ApiService,
    private oneRecordService: OneRecordService,
    private dgAutocheckService: DgAutocheckService
  ) {}

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
    reader.onload = (ev: any) => { this.rawXml = ev.target.result; };
    reader.readAsText(file);
  }

  // ── Sample XSDG ───────────────────────────────────────────────────────────
  loadSample() {
    this.rawXml = `<?xml version="1.0" encoding="utf-8"?>
<rsm:ShippersDeclarationForDangerousGoods xmlns:rsm="iata:shippersdeclarationfordangerousgoods:1" xmlns:ccts="urn:un:unece:uncefact:documentation:standard:CoreComponentsTechnicalSpecification:2" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:8" xmlns:ram="iata:datamodel:3">
  <rsm:MessageHeaderDocument>
    <ram:ID>516-00000100</ram:ID>
    <ram:Name>XML Shippers Declaration for Dangerous Goods</ram:Name>
    <ram:TypeCode>890</ram:TypeCode>
    <ram:IssueDateTime>2026-04-17T06:46:03</ram:IssueDateTime>
    <ram:PurposeCode>CREATION</ram:PurposeCode>
    <ram:VersionID>5.00</ram:VersionID>
    <ram:ConversationID>1</ram:ConversationID>
    <ram:SenderParty>
      <ram:PrimaryID schemeID="C">Address</ram:PrimaryID>
    </ram:SenderParty>
    <ram:SenderParty>
      <ram:PrimaryID schemeID="C">Pima</ram:PrimaryID>
    </ram:SenderParty>
    <ram:RecipientParty>
      <ram:PrimaryID schemeID="C">Address</ram:PrimaryID>
    </ram:RecipientParty>
    <ram:RecipientParty>
      <ram:PrimaryID schemeID="C">Pima</ram:PrimaryID>
    </ram:RecipientParty>
  </rsm:MessageHeaderDocument>
  <rsm:BusinessHeaderDocument>
    <ram:ProcessType>P</ram:ProcessType>
    <ram:SignatoryConsignorAuthentication>
      <ram:ActualDateTime>2026-04-16T22:00:00</ram:ActualDateTime>
      <ram:Statement>I hereby declare that the contents of this consignment are fully and accurately described above by the proper shipping name, and are classified, packaged, marked and labelled/placarded, and are in all respects in proper condition for transport according to applicable international and national governmental regulations. I declare that all of the applicable air transport requirements have been met.</ram:Statement>
      <ram:Signatory>Niclas</ram:Signatory>
      <ram:IssueAuthenticationLocation>
        <ram:Name>Frankfurt</ram:Name>
      </ram:IssueAuthenticationLocation>
      <ram:ProviderConsignorAuthenticationParty>
        <ram:DefinedConsignorAuthenticationContact>
          <ram:PersonName>Niclas, Mr.</ram:PersonName>
        </ram:DefinedConsignorAuthenticationContact>
      </ram:ProviderConsignorAuthenticationParty>
    </ram:SignatoryConsignorAuthentication>
  </rsm:BusinessHeaderDocument>
  <rsm:MasterConsignment>
    <ram:IncludedHouseConsignment>
      <ram:ConsignorParty>
        <ram:PrimaryID />
        <ram:AdditionalID />
        <ram:Name>ABC Chemicals
Evert van de Beekstraat 200
1118 CP Schiphol
The Netherlands</ram:Name>
        <ram:PostalStructuredAddress>
          <ram:PostcodeCode>1111</ram:PostcodeCode>
          <ram:StreetName>Street</ram:StreetName>
          <ram:CityName>City</ram:CityName>
          <ram:CountryID>HK</ram:CountryID>
          <ram:CountryName>Hong Kong (SAR) China</ram:CountryName>
          <ram:CountrySubDivisionName>Area</ram:CountrySubDivisionName>
          <ram:PostOfficeBox>PO</ram:PostOfficeBox>
        </ram:PostalStructuredAddress>
        <ram:DefinedTradeContact>
          <ram:PersonName />
          <ram:DepartmentName />
          <ram:DirectTelephoneCommunication>
            <ram:CompleteNumber>12345</ram:CompleteNumber>
          </ram:DirectTelephoneCommunication>
        </ram:DefinedTradeContact>
      </ram:ConsignorParty>
      <ram:ConsigneeParty>
        <ram:PrimaryID />
        <ram:AdditionalID />
        <ram:Name>CRI Chemicals
Route de l'aeroport, 33
1215 Geneva
Switzerland</ram:Name>
        <ram:PostalStructuredAddress>
          <ram:PostcodeCode>2222</ram:PostcodeCode>
          <ram:StreetName>Street</ram:StreetName>
          <ram:CityName>City</ram:CityName>
          <ram:CountryID>PH</ram:CountryID>
          <ram:CountryName>Philippines</ram:CountryName>
          <ram:CountrySubDivisionName>Area</ram:CountrySubDivisionName>
          <ram:PostOfficeBox>PO</ram:PostOfficeBox>
        </ram:PostalStructuredAddress>
        <ram:DefinedTradeContact>
          <ram:PersonName />
          <ram:DepartmentName />
          <ram:DirectTelephoneCommunication>
            <ram:CompleteNumber>13321</ram:CompleteNumber>
          </ram:DirectTelephoneCommunication>
        </ram:DefinedTradeContact>
      </ram:ConsigneeParty>
      <ram:OriginLocation>
        <ram:ID>AMS</ram:ID>
        <ram:Name>Schiphol Airport</ram:Name>
      </ram:OriginLocation>
      <ram:FinalDestinationLocation>
        <ram:ID>GVA</ram:ID>
        <ram:Name>Geneva Intl.</ram:Name>
      </ram:FinalDestinationLocation>
      <ram:HandlingInstructions>
        <ram:Description>Emergency contact 24-hr number: +41 79 772 70 10</ram:Description>
        <ram:ExclusiveUsageIndicator>false</ram:ExclusiveUsageIndicator>
      </ram:HandlingInstructions>
      <ram:AssociatedReferenceDocument>
        <ram:ID>516-00000100</ram:ID>
        <ram:TypeCode>741</ram:TypeCode>
        <ram:Name>Master air waybill</ram:Name>
      </ram:AssociatedReferenceDocument>
      <ram:RelatedCommercialTradeTransaction>
        <ram:IncludedCommercialTradeLineItem>
          <ram:SequenceNumeric>1</ram:SequenceNumeric>
          <ram:SpecifiedProductTradeDelivery>
            <ram:SpecifiedProductRegulatedGoods>
              <ram:ApplicableProductDangerousGoods>
                <ram:UNDGIdentificationCode>UN1263</ram:UNDGIdentificationCode>
                <ram:PackagingDangerLevelCode>II</ram:PackagingDangerLevelCode>
                <ram:PackingInstructionTypeCode>353</ram:PackingInstructionTypeCode>
                <ram:HazardClassificationID>3</ram:HazardClassificationID>
                <ram:NetWeightMeasure unitCode="LTR">5.0</ram:NetWeightMeasure>
                <ram:ProperShippingName>Paint</ram:ProperShippingName>
                <ram:HazardCategoryCode>3L</ram:HazardCategoryCode>
              </ram:ApplicableProductDangerousGoods>
            </ram:SpecifiedProductRegulatedGoods>
          </ram:SpecifiedProductTradeDelivery>
        </ram:IncludedCommercialTradeLineItem>
        <ram:SpecifiedLogisticsPackage>
          <ram:ItemQuantity>1</ram:ItemQuantity>
          <ram:SequenceNumeric>1</ram:SequenceNumeric>
          <ram:AllPackedInOneIndicator>false</ram:AllPackedInOneIndicator>
          <ram:UsedSupplyChainPackaging>
            <ram:Type>Fibreboard box</ram:Type>
          </ram:UsedSupplyChainPackaging>
          <ram:IncludedPackagedTradeLineItem>
            <ram:SequenceNumeric>1</ram:SequenceNumeric>
          </ram:IncludedPackagedTradeLineItem>
        </ram:SpecifiedLogisticsPackage>
      </ram:RelatedCommercialTradeTransaction>
      <ram:ApplicableTransportDangerousGoods>
        <ram:HazardTypeCode>NON-RADIOACTIVE</ram:HazardTypeCode>
        <ram:AircraftLimitationInformation>PASSENGER AND CARGO AIRCRAFT</ram:AircraftLimitationInformation>
        <ram:ComplianceDeclarationInformation>Failure to comply in all respects with the applicable Dangerous Goods Regulations may be in breach of the applicable law, subject to legal penalties</ram:ComplianceDeclarationInformation>
        <ram:ShipperDeclarationInformation>I hereby declare that the contents of this consignment are fully and accurately described above by the proper shipping name, and are classified, packaged, marked and labelled/placarded, and are in all respects in proper condition for transport according to applicable international and national governmental regulations. I declare that all of the applicable air transport requirements have been met.</ram:ShipperDeclarationInformation>
        <ram:EmergencyDangerousGoodsContact>
          <ram:PersonName>Name 1</ram:PersonName>
          <ram:DirectEmergencyTelephoneCommunication>
            <ram:CompleteNumber>11111</ram:CompleteNumber>
          </ram:DirectEmergencyTelephoneCommunication>
        </ram:EmergencyDangerousGoodsContact>
        <ram:EmergencyDangerousGoodsContact>
          <ram:PersonName>Name 2</ram:PersonName>
          <ram:DirectEmergencyTelephoneCommunication>
            <ram:CompleteNumber>2222</ram:CompleteNumber>
          </ram:DirectEmergencyTelephoneCommunication>
        </ram:EmergencyDangerousGoodsContact>
      </ram:ApplicableTransportDangerousGoods>
    </ram:IncludedHouseConsignment>
  </rsm:MasterConsignment>
</rsm:ShippersDeclarationForDangerousGoods>`;
    this.errorMessage = '';
  }

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object';
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  // Standard label formatter
  formatLabel(key: any): string {
    if (!key || !isNaN(key)) return '';
    return String(key)
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  }

  // Logic to build "Sender Party - Primary Id - 1"
  getArrayItemHeader(parentLabel: string, key: any): string {
    const index = Number(key) + 1;
    return `${parentLabel} - ${index}`;
  }

  keepOrder = (a: any, b: any): number => 0;

  // Step 1
  create() {
    if (!this.rawXml.trim()) { this.errorMessage = 'Please upload or load a sample XSDG file.'; return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.loadingMessage = 'Creating ONE Record DG Shipment…';

    this.apiService.convertToReadableJson(this.rawXml)
    .subscribe({
      next: (res) => {
        this.humanReadable = res;
        // this.shipmentId = res.shipment_id;
        // this.oneRecordId = res.one_record_id;
        // this.createdAt = res.created_at;
        this.isLoading = false;
        this.currentStep = 2;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = `Failed: ${err?.error?.detail || err.message}`;
      }
    });
  }

  // Step 1
  convert() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadingMessage = 'Sending XSDG to DG AutoCheck…';
    
    this.apiService.convertXmlToJson(this.rawXml)
    .subscribe({
      next: (json) => {
        // this.checkResults = res.checks || [];
        // this.checkStatus = res.status;
        // this.checkedAt = res.checked_at;
        // this.checkSource = res.source;
        // this.apiNote = res.api_note || '';
        this.isLoading = false;
        // this.currentStep=3;
        this.ingestJsonXsdg(json);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = `Failed: ${err?.error?.detail || err.message}`;
      }
    });
  
  }

  // Step 3
  ingestJsonXsdg(json: any) {
    this.isLoading = true;
    this.loadingMessage = 'Updating ONE Record shipment with check results…';

    this.oneRecordService.getAccessToken()
      .subscribe({
          next: (res) => {
            // this.currentStep = 4;
            this.ingestToOneRecord(res.access_token, json);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = `Failed: ${err?.error?.detail || err.message}`;
          }
    });

    // this.http.post<any>(`${API_BASE}/api/dg/update`, {
    //   shipment_id: this.shipmentId,
    //   check_results: this.checkResults
    // }).subscribe({
    //   next: (res) => {
    //     this.checkStatus = res.status;
    //     this.dgd = res.dgd;
    //     this.isLoading = false;
    //     this.currentStep = 5;
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
    //   }
    // });
  }

    // Step 4
    private ingestToOneRecord(token : any, json : any) : void {
        
        this.oneRecordService.ingestJsonXsdg(token, json)
          .subscribe({
            next: (res) => {
              // this.checkStatus = res.status;
              this.isLoading=true;
              // this.currentStep = 5;
              this.createAcceptanceCheck();
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = `Failed: ${err?.error?.detail || err.message}`;
            }
          });

    }

    // Step 5
    private createAcceptanceCheck() {
        this.dgAutocheckService.createAcceptanceChecks()
          .subscribe({
              next: (res) => {
                this.isLoading=true;
                this.acceptanceCheckId = res.acceptanceCheckId;
                this.importXsdgDgAutocheck();
              },
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
              }
            });

    }

    // step 6
    private importXsdgDgAutocheck() {

        this.dgAutocheckService.importXsdgDgAutocheck(this.acceptanceCheckId, this.rawXml)
          .subscribe({
              next: (res) => {
                this.isLoading=true;
                this.dgAutocheckRequestUrl();
              },
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
              }
            });
    }

    // step 7
    private dgAutocheckRequestUrl() {
       this.dgAutocheckService.requestUrl(this.acceptanceCheckId)
          .subscribe({
              next: (res) => {
                this.navigateAndListen(res.requestedUrl);
              },
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
              }
            });
    }

    // step 8 - do dg autocheck in iata site
    navigateAndListen(url: string) {
      this.isLoading = true;
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        // Poll the window reference to check if it's closed
        const timer = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(timer); // Stop polling
            this.onTabClosed();   // Call your API or logic here
          }
        }, 500); // Check every 500ms
      } else {
        alert('Please allow pop-ups for this website.');
      }
    }

    // step 9 - wait for tab to close then trigger get check result 
    onTabClosed() {
      console.log('Tab was closed. Triggering follow-up API...');
      
      this.dgAutocheckService.getCheckResult(this.acceptanceCheckId)
        .subscribe({
            next: (autocheckPayload) => {
              this.ingestCheckResult(autocheckPayload);
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
            }
          });
    }

    // step 10 - ingest result in one record
    ingestCheckResult(autocheckPayload: any) {

      this.oneRecordService.ingestCheckResultInOneRecord(autocheckPayload)
        .subscribe({
            next: (res) => {
              this.currentStep=3;
              this.getFullAwb(autocheckPayload.airWaybillNumber);
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
            }
          });
    }
            
    // step 11 - call full awb
    getFullAwb(airWaybillNumber: string) {

      this.oneRecordService.getFullAwb(airWaybillNumber)
        .subscribe({
            next: (res) => {
              this.isLoading = false;
              this.mapCheckData(res);
              this.airWaybillNumber = airWaybillNumber;
              this.currentStep=5;
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = `Update failed: ${err?.error?.detail || err.message}`;
            }
          });
    }
  
    private mapCheckData(res: any) {
      const check = res?.['https://onerecord.iata.org/ns/cargo#checks']?.[0];
      const totalResult = check?.['https://onerecord.iata.org/ns/cargo#checkTotalResult'];
      
      this.checkStatus = totalResult?.['https://onerecord.champ.aero/ns/dangerous-goods#checkResult'].toUpperCase();

      console.log('this.checkStatus', this.checkStatus);


      if (this.checkStatus === 'PASSED') {
        this.fullAwb = {
          reason: '-',
          status: check?.['https://onerecord.champ.aero/ns/dangerous-goods#checkStatus'],
          certifiedBy: totalResult?.['https://onerecord.iata.org/ns/cargo#certifiedByActor']?.['https://onerecord.iata.org/ns/cargo#firstName'],
          timestamp: totalResult?.['https://onerecord.champ.aero/ns/dangerous-goods#certifiedOn']
        };
      } else {
         this.fullAwb = {
          reason: 'Packaging & Labeling',
          status: 'failed',
          certifiedBy: 'user-ranger',
          timestamp: totalResult?.['https://onerecord.champ.aero/ns/dangerous-goods#certifiedOn']
        };
      }

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