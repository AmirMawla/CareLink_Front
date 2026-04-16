import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Reception } from '../../../../services/reception';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent implements OnInit {
  private readonly receptionService = inject(Reception);
  private cdr = inject(ChangeDetectorRef);

  totalAppointments = 0;
  waitingCount = 0;
  checkedInCount = 0;
  completedCount = 0;
  noShowCount = 0;
  cancelledCount = 0;

  ngOnInit(): void {
    this.loadStats();
  }


// loadStats(): void {
//     this.receptionService.getTodayQueue().subscribe({
//       next: (data) => {
//         this.totalAppointments = data.length;
//         this.waitingCount = data.filter(a => a.status === 'CONFIRMED').length;
//         this.checkedInCount = data.filter(a => a.status === 'CHECKED_IN').length;
//         this.completedCount = data.filter(a => a.status === 'COMPLETED').length;
//         this.noShowCount = data.filter(a => a.status === 'NO_SHOW').length;
//         this.cancelledCount = data.filter(a => a.status === 'CANCELLED').length;

//         this.cdr.detectChanges();
//       },
//       error: (err) => console.error('Dashboard Stats failed:', err)
//     });
//   }

loadStats(): void {
  this.receptionService.getAppointments({}).subscribe({
    next: (data) => {
      const today = new Date().toISOString().split('T')[0];

      const todayAppointments = data.filter(appt => {
        const apptDate = appt.scheduled_datetime.split('T')[0];
        return apptDate === today;
      });

      this.totalAppointments = todayAppointments.length;
      this.waitingCount = todayAppointments.filter(a => a.status === 'CONFIRMED').length;
      this.checkedInCount = todayAppointments.filter(a => a.status === 'CHECKED_IN').length;
      this.completedCount = todayAppointments.filter(a => a.status === 'COMPLETED').length;
      this.noShowCount = todayAppointments.filter(a => a.status === 'NO_SHOW').length;
      this.cancelledCount = todayAppointments.filter(a => a.status === 'CANCELLED').length;

      this.cdr.detectChanges();
    },
    error: (err) => console.error('Failed to fetch all appointments:', err)
  });
}
}
