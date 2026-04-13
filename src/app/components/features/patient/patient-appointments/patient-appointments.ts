import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Appointment {
  id: number;
  doctor: {
    user: {
      first_name: string;
      last_name: string;
    };
    specialty: string;
  };
  scheduled_datetime: string;
  status: string;
  is_telemedicine: boolean;
  meeting_link: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}
@Component({
  selector: 'app-patient-appointments',
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-appointments.html',
  styleUrl: './patient-appointments.css',
})
export class PatientAppointments implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  error = '';
  count = 0;
  nextPage: string | null = null;
  prevPage: string | null = null;
  statusFilter = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments(url?: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });

    let apiUrl = url || 'http://127.0.0.1:8000/api/medical/patient/appointments/';

    if (!url && this.statusFilter) {
      apiUrl += `?status=${this.statusFilter}`;
    }

    this.loading = true;
    this.http.get<PaginatedResponse>(apiUrl, { headers })
      .subscribe({
        next: (data) => {
          this.appointments = data.results;
          this.count = data.count;
          this.nextPage = data.next;
          this.prevPage = data.previous;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load appointments';
          this.loading = false;
        }
      });
  }

  onStatusFilter(event: Event) {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.loadAppointments();
  }

  goToNext() {
    if (this.nextPage) this.loadAppointments(this.nextPage);
  }

  goToPrev() {
    if (this.prevPage) this.loadAppointments(this.prevPage);
  }

  isCompleted(status: string): boolean {
    return status === 'COMPLETED';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'REQUESTED': '#F59E0B',
      'CONFIRMED': '#3B82F6',
      'CHECKED_IN': '#8B5CF6',
      'COMPLETED': '#059669',
      'CANCELLED': '#EF4444',
      'NO_SHOW': '#6B7280'
    };
    return colors[status] || '#6B7280';
  }
}