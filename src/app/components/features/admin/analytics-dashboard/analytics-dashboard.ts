import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './analytics-dashboard.html',
  styleUrls: ['./analytics-dashboard.css']
})
export class AnalyticsDashboard implements OnInit {
  private adminService = inject(AdminService);
  
  isLoading = signal(true);
  data = signal<any>(null);

  // Chart Options
  public appointmentChartOptions: any;
  public roleChartOptions: any;

  ngOnInit() {
    this.fetchAllData();
  }

  fetchAllData() {
    this.isLoading.set(true);
    // Fetch multiple endpoints at once to avoid "stuttering" UI
    forkJoin({
      overview: this.adminService.getOverview(),
      users: this.adminService.getUserStats(),
      appointments: this.adminService.getAppointmentStats(),
      scheduling: this.adminService.getSchedulingStats()
    }).subscribe({
      next: (res) => {
        this.data.set(res);
        this.initCharts(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  initCharts(res: any) {
    // 1. Appointment Status Pie Chart
    const statusData = res.appointments.by_status;
    this.appointmentChartOptions = {
      series: Object.values(statusData),
      labels: Object.keys(statusData),
      chart: { type: "donut", height: 300 },
      colors: ['#00478D', '#1B8A5A', '#BA1A1A', '#C07B00', '#006494', '#74777B'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '70%' } } }
    };

    // 2. User Roles Distribution
    const roleData = res.users.by_role;
    this.roleChartOptions = {
      series: [{ name: "Users", data: Object.values(roleData) }],
      chart: { type: "bar", height: 300, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 8, distributed: true } },
      xaxis: { categories: Object.keys(roleData) },
      colors: ['#E8F1FB', '#00478D', '#005EB8', '#1A6BC4', '#006494']
    };
  }
}