import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin';

type ReportType = 'users' | 'doctors' | 'patients' | 'appointments';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-generator.html',
  styleUrls: ['./report-generator.css']
})
export class ReportGenerator {
  private adminService = inject(AdminService);
  
  selectedReport = signal<ReportType | null>(null);
  isPreparing = signal(false);
  showConfirmation = signal(false);

  // Added search to appointments to fix TS2339
  filters = {
    users: { role: '', is_active: '', search: '' },
    doctors: { specialty: '', is_active: '', search: '' },
    patients: { is_active: '', search: '' },
    appointments: { status: '', from_date: '', to_date: '', doctor_id: '', search: '' }
  };

  // Helper method to fix NG5002 (Parser Error)
  getFilterGroup(type: ReportType): any {
    return (this.filters as any)[type];
  }

  selectReport(type: ReportType) {
    this.selectedReport.set(type);
    this.showConfirmation.set(false);
  }

  requestDownload() {
    this.showConfirmation.set(true);
  }

  confirmAndDownload() {
    const type = this.selectedReport();
    if (!type) return;

    this.isPreparing.set(true);
    const activeFilters = this.getFilterGroup(type);

    this.adminService.downloadReport(type, activeFilters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.resetState();
      },
      error: () => {
        this.isPreparing.set(false);
        this.showConfirmation.set(false);
        alert('Failed to generate report. Please check your connection.');
      }
    });
  }

  resetState() {
    this.isPreparing.set(false);
    this.showConfirmation.set(false);
  }
}