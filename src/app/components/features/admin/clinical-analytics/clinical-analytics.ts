import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin';
import { NgApexchartsModule } from "ng-apexcharts";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-clinical-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './clinical-analytics.html',
  styleUrls: ['./clinical-analytics.css']
})
export class ClinicalAnalytics implements OnInit {
  private adminService = inject(AdminService);
  
  isLoading = signal(true);
  stats = signal<any>(null);
  
  // Filters
  doctorId = signal<number | undefined>(undefined);

  // Charts
  public reasonChartOptions: any;
  public trendChartOptions: any;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      appointments: this.adminService.getAppointmentStats(this.doctorId()),
      consultations: this.adminService.getConsultationStats(),
      audit: this.adminService.getAuditTrail()
    }).subscribe({
      next: (res) => {
        this.stats.set(res);
        this.initCharts(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  initCharts(res: any) {
    // 1. Reschedule Reasons (Audit Trail)
    const auditData = res.audit.top_reschedule_reasons;
    this.reasonChartOptions = {
      series: auditData.map((item: any) => item.count),
      labels: auditData.map((item: any) => item.reason),
      chart: { type: "pie", height: 280 },
      colors: ['#00478D', '#006494', '#1A6BC4', '#E8F1FB'],
      legend: { position: 'bottom' },
      responsive: [{ breakpoint: 480, options: { chart: { width: 300 } } }]
    };

    // 2. Prescription vs Test Trends
    this.trendChartOptions = {
      series: [
        { name: "Prescriptions", data: [res.consultations.total_prescriptions] },
        { name: "Tests", data: [res.consultations.total_test_requests] }
      ],
      chart: { type: "bar", height: 200, stacked: true, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '30%', borderRadius: 5 } },
      colors: ['#00478D', '#1B8A5A'],
      xaxis: { categories: ["Medical Outputs"] }
    };
  }

  onFilterChange() {
    this.loadData();
  }
}