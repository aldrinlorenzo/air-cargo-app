import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private xmlContextSource = new BehaviorSubject<string | null>(null);
  currentXmlContext = this.xmlContextSource.asObservable();

  private awbContextSource = new BehaviorSubject<string | null>(null);
  currentAwbContext = this.awbContextSource.asObservable();

  constructor() { }

  updateXmlContext(xml: string) {
    this.xmlContextSource.next(xml);
  }

  updateAwbContext(data: any) {
    if (data) {
      try {
        // Build a human-readable summary of the AWB data for the AI
        const summary = this.buildAwbSummary(data);
        this.awbContextSource.next(summary);
      } catch {
        this.awbContextSource.next(JSON.stringify(data, null, 2));
      }
    } else {
      this.awbContextSource.next(null);
    }
  }

  clearAwbContext() {
    this.awbContextSource.next(null);
  }

  private buildAwbSummary(data: any): string {
    const lines: string[] = [];
    
    // Master waybill
    if (data.masterWaybill) {
      const mw = data.masterWaybill;
      lines.push(`=== MASTER WAYBILL ===`);
      lines.push(`AWB Number: ${mw.awbNumber || 'N/A'}`);
      lines.push(`Origin: ${mw.origin || 'N/A'}`);
      lines.push(`Destination: ${mw.destination || 'N/A'}`);
      lines.push(`Type: ${mw.type || 'N/A'}`);
    }

    // House waybills
    if (data.houseWaybills?.length) {
      lines.push(`\n=== HOUSE WAYBILLS (${data.houseWaybills.length}) ===`);
      data.houseWaybills.forEach((hw: any, i: number) => {
        lines.push(`  ${i + 1}. AWB: ${hw.awbNumber || 'N/A'} | Origin: ${hw.origin || 'N/A'} → Dest: ${hw.destination || 'N/A'}`);
      });
    }

    // Shipments
    if (data.shipments?.length) {
      data.shipments.forEach((ship: any, si: number) => {
        lines.push(`\n=== SHIPMENT ${si + 1} ===`);
        lines.push(`Description: ${ship.description || 'N/A'}`);
        lines.push(`Total Weight: ${ship.totalWeight || 'N/A'} ${ship.weightUnit || ''}`);
        lines.push(`Pieces: ${ship.pieces?.length || 0}`);

        // DG Declaration
        if (ship.dgDeclaration?.declarationType || ship.dgDeclaration?.declarationDate) {
          lines.push(`DG Declaration Type: ${ship.dgDeclaration.declarationType || 'N/A'}`);
          lines.push(`Declaration Date: ${ship.dgDeclaration.declarationDate || 'N/A'}`);
          lines.push(`Shipper Signature: ${ship.dgDeclaration.shipperSignature || 'N/A'}`);
        }

        // Pieces and DG items
        ship.pieces?.forEach((piece: any, pi: number) => {
          if (piece.dangerousGoods?.length) {
            lines.push(`  Piece ${pi + 1} — ${piece.dangerousGoods.length} DG item(s):`);
            piece.dangerousGoods.forEach((dg: any) => {
              lines.push(`    • UN ${dg.unNumber || 'N/A'} — ${dg.properShippingName || 'N/A'}`);
              lines.push(`      Class: ${dg.hazardClass || 'N/A'} | Packing Group: ${dg.packingGroup || 'N/A'} | PI: ${dg.packingInstruction || 'N/A'}`);
              lines.push(`      Qty: ${dg.quantity || 'N/A'} ${dg.unit || ''}`);
            });
          }
        });
      });
    }

    // Check results
    if (data.checks?.length) {
      lines.push(`\n=== DG ACCEPTANCE CHECKS (${data.checks.length}) ===`);
      data.checks.forEach((check: any, ci: number) => {
        lines.push(`  ${ci + 1}. [${check.checkResult || 'N/A'}] ${check.checkType || 'N/A'} — Status: ${check.checkStatus || 'N/A'} (${check.createdOn || 'N/A'})`);
        if (check.subChecks?.length) {
          check.subChecks.forEach((sc: any) => {
            lines.push(`     ↳ [${sc.checkResult || 'N/A'}] ${sc.checkType || 'N/A'} — by ${sc.checkedBy || 'N/A'} on ${sc.checkDate || 'N/A'}`);
          });
        }
      });
    }

    return lines.join('\n');
  }
}
