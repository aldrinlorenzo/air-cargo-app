import { Component, OnInit } from '@angular/core';
import { ApiService, AwbDashboardData, CheckResult, SubCheck, Piece, DangerousGood, Shipment, WaybillInfo } from '../../services/api.service';
import { ChatbotService } from '../../services/chatbot.service';

@Component({
  selector: 'app-dgr-compliance',
  templateUrl: './dgr-compliance.component.html',
  styleUrls: ['./dgr-compliance.component.css']
})
export class DgrComplianceComponent implements OnInit {

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebarCollapsed = false;

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ── AWB input ──────────────────────────────────────────────────────────────
  awbId = '';
  awbInputValue = '';

  // ── State ──────────────────────────────────────────────────────────────────
  isLoading = false;
  error: string | null = null;
  notFound = false;

  // ── Accordion state ────────────────────────────────────────────────────────
  expandedChecks = new Set<number>();

  // ── Parsed Data ────────────────────────────────────────────────────────────
  dashboardData: AwbDashboardData | null = null;

  // ── Derived / convenience getters ──────────────────────────────────────────
  get masterWaybill(): WaybillInfo | null {
    return this.dashboardData?.masterWaybill ?? null;
  }

  get houseWaybills(): WaybillInfo[] {
    return this.dashboardData?.houseWaybills ?? [];
  }

  get shipments(): Shipment[] {
    return this.dashboardData?.shipments ?? [];
  }

  get allPieces(): Piece[] {
    return this.shipments.flatMap(s => s.pieces);
  }

  get allDangerousGoods(): DangerousGood[] {
    return this.allPieces.flatMap(p => p.dangerousGoods);
  }

  get checks(): CheckResult[] {
    return this.dashboardData?.checks ?? [];
  }

  get totalDgCount(): number {
    return this.allDangerousGoods.length;
  }

  /** All sub-checks across all parent checks (for counting) */
  get allSubChecks(): SubCheck[] {
    return this.checks.flatMap(c => c.subChecks ?? []);
  }

  get failedChecksCount(): number {
    return this.checks.filter(c =>
      c.checkResult?.toUpperCase().includes('FAIL') ||
      c.checkResult?.toUpperCase().includes('NOK') ||
      c.checkResult?.toUpperCase().includes('REJECT')
    ).length;
  }

  get passedChecksCount(): number {
    return this.checks.filter(c =>
      c.checkResult?.toUpperCase().includes('PASS') ||
      c.checkResult?.toUpperCase().includes('OK') ||
      c.checkResult?.toUpperCase().includes('ACCEPT')
    ).length;
  }

  get totalPieceCount(): number {
    return this.allPieces.length;
  }

  constructor(private apiService: ApiService, private chatbotService: ChatbotService) { }

  ngOnInit(): void {
  }

  loadAwbData(): void {
    this.awbId = this.awbInputValue.trim();
    if (!this.awbId) return;

    this.isLoading = true;
    this.error = null;
    this.notFound = false;
    this.dashboardData = null;
    this.expandedChecks.clear();

    this.apiService.getOneRecordAwb(this.awbId).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
        // Push AWB data to chatbot for context-aware conversations
        this.chatbotService.updateAwbContext(data);
      },
      error: (err) => {
        const status = err?.status;
        if (status === 404 || status === 400) {
          this.notFound = true;
          this.error = null;
        } else {
          this.error = err?.error?.detail ?? err?.message ?? 'Failed to fetch AWB data from ONE Record.';
        }
        this.isLoading = false;
        this.chatbotService.clearAwbContext();
      }
    });
  }

  toggleCheck(index: number): void {
    if (this.expandedChecks.has(index)) {
      this.expandedChecks.delete(index);
    } else {
      this.expandedChecks.add(index);
    }
  }

  isCheckExpanded(index: number): boolean {
    return this.expandedChecks.has(index);
  }

  getCheckStatusClass(result: string | null): string {
    const r = (result ?? '').toUpperCase();
    if (r.includes('PASS') || r.includes('OK') || r.includes('ACCEPT')) {
      return 'status-pass';
    }
    if (r.includes('FAIL') || r.includes('NOK') || r.includes('REJECT')) {
      return 'status-fail';
    }
    return 'status-pending';
  }

  getCheckStatusLabel(result: string | null): string {
    const r = (result ?? '').toUpperCase();
    if (r.includes('PASS') || r.includes('OK') || r.includes('ACCEPT')) return 'PASS';
    if (r.includes('FAIL') || r.includes('NOK') || r.includes('REJECT')) return 'FAIL';
    if (result) return result;
    return 'N/A';
  }

  formatId(id: string | null | undefined): string {
    if (!id) return '—';
    // Shorten long URIs to just the last segment
    const parts = id.split('/');
    return parts[parts.length - 1] || id;
  }

  /** Collect all DG declarations across all shipments */
  get allDgDeclarations() {
    return this.shipments
      .map(s => ({ ...s.dgDeclaration, shipmentId: s.shipmentId }))
      .filter(d => d.declarationType || d.declarationDate || d.shipperSignature);
  }
}
