import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin';
import { NgApexchartsModule } from "ng-apexcharts";

@Component({
  selector: 'app-patient-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './patient-analytics.html',
  styleUrls: ['./patient-analytics.css']
})
export class PatientAnalytics implements OnInit {
  private adminService = inject(AdminService);
  
  isLoading = signal(true);
  patientData = signal<any>(null);

  // Chart for Retention/Conversion
  public funnelChartOptions: any;

  ngOnInit() {
    this.loadPatientStats();
  }

  loadPatientStats() {
    this.isLoading.set(true);
    this.adminService.getPatientStats().subscribe({
      next: (res) => {
        this.patientData.set(res);
        this.initFunnelChart(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  initFunnelChart(res: any) {
    this.funnelChartOptions = {
  series: [{
    name: "Patients",
    data: [
      res.total_patients,
      res.patients_with_appointments,
      res.patients_with_completed_appointments,
      res.patients_with_consultations
    ]
  }],
  chart: { type: "bar", height: 380, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  plotOptions: {
    bar: {
      borderRadius: 8,
      horizontal: true,
      distributed: true,
      barHeight: '65%',
    }
  },
  colors: ['#EEF0F4', '#005EB8', '#00478D', '#1B8A5A'],
  dataLabels: {
    enabled: true,
    textAnchor: 'start',
    style: { colors: ['#191C1E'], fontWeight: 700 },
    formatter: (val: any, opt: any) => opt.w.globals.labels[opt.dataPointIndex] + ": " + val,
    offsetX: 10,
  },
  xaxis: {
    categories: ["Registered Base", "Booked Appointment", "Completed Visit", "Medically Managed"],
    labels: { show: false },
    axisBorder: { show: false }
  },
  yaxis: { labels: { show: false } },
  tooltip: { theme: 'light', y: { formatter: (val: any) => val + " Patients" } },
  legend: { show: false }
};
  }
}