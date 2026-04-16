import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../../services/admin';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.css'],
})
export class AuditLogs implements OnInit {
  private adminService = inject(AdminService);

  logs = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading.set(true);
    this.adminService.getAppointmentAuditLogs().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.isLoading.set(false);
      },
    });
  }
}
