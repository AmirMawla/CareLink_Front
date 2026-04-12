import { Component, OnInit, inject, signal, computed } from '@angular/core'; // Added computed
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin';
import { NgApexchartsModule } from "ng-apexcharts";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-doctor-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './doctor-analytics.html',
  styleUrls: ['./doctor-analytics.css']
})
export class DoctorAnalytics implements OnInit {
  private adminService = inject(AdminService);
  
  isLoading = signal(true);
  stats = signal<any>(null);

  // NEW: Safely compute the specialty count
  specialtyCount = computed(() => {
    const data = this.stats();
    if (!data || !data.doctors || !data.doctors.by_specialty) return 0;
    return Object.keys(data.doctors.by_specialty).length;
  });

  public specialtyChartOptions: any;
  public durationChartOptions: any;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      doctors: this.adminService.getDoctorStats(),
      scheduling: this.adminService.getSchedulingStats()
    }).subscribe({
      next: (res: any) => {
        this.stats.set(res);
        this.initCharts(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  initCharts(res: any) {
    const specialtyLabels = Object.keys(res.doctors.by_specialty || {});
    const specialtyValues = Object.values(res.doctors.by_specialty || {});

    this.specialtyChartOptions = {
      series: specialtyValues,
      labels: specialtyLabels,
      chart: { type: "polarArea", height: 350 },
      stroke: { colors: ["#fff"] },
      fill: { opacity: 0.9 },
      colors: ['#00478D', '#005EB8', '#1A6BC4', '#1B8A5A', '#BA1A1A', '#C07B00']
    };

    const durationData = res.doctors.session_duration_breakdown || {};
    this.durationChartOptions = {
      series: [{ name: "Doctors", data: Object.values(durationData) }],
      chart: { type: "bar", height: 250, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 10, columnWidth: '40%' } },
      xaxis: { categories: Object.keys(durationData).map(k => k.replace('_', ' ')) },
      colors: ['#006494']
    };
  }
}