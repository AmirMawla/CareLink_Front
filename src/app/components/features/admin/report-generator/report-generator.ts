import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin';

type ReportType = 'users' | 'doctors' | 'patients' | 'receptionists' | 'appointments';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-generator.html',
  styleUrls: ['./report-generator.css'],
})
export class ReportGenerator {
  private adminService = inject(AdminService);

  selectedReport = signal<ReportType | null>(null);
  isPreparing = signal(false);
  showConfirmation = signal(false);

  filters = {
    users: { role: '', is_active: '', search: '' },
    doctors: { specialty: '', is_active: '', search: '' },
    patients: { is_active: '', search: '' },
    receptionists: { is_active: '', doctor_id: '', search: '' },
    appointments: { status: '', from_date: '', to_date: '', doctor_id: '', patient_id: '' },
  };

  getFilterGroup(type: ReportType): any {
    return (this.filters as any)[type];
  }

  selectReport(type: ReportType) {
    this.selectedReport.set(type);
    this.showConfirmation.set(false);
  }

  confirmAndDownload() {
    const type = this.selectedReport();
    if (!type) return;

    this.isPreparing.set(true);

    // Clean params: ensure we don't send empty strings to the backend
    const rawFilters = this.getFilterGroup(type);
    const activeFilters = Object.fromEntries(
      Object.entries(rawFilters).filter(([_, v]) => v !== null && v !== ''),
    );

    this.adminService.downloadReport(type, activeFilters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_report_${new Date().getTime()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.resetState();
      },
      error: () => {
        this.isPreparing.set(false);
        this.showConfirmation.set(false);
        alert('Report generation failed. Please verify your admin permissions.');
      },
    });
  }

  resetState() {
    this.isPreparing.set(false);
    this.showConfirmation.set(false);
  }
}
