import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';

interface Appointment {
  id: number;
  doctor: {
    id?: number;
    user: {
      first_name: string;
      last_name: string;
      username?: string;
    };
    specialty: string;
  };
  scheduled_datetime: string;
  status: string;
  is_telemedicine: boolean;
  meeting_link: string | null;
  has_consultation?: boolean;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}

interface CancelResponse {
  message: string;
  appointment: Appointment;
}
@Component({
  selector: 'app-patient-appointments',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patient-appointments.html',
  styleUrl: './patient-appointments.css',
})
export class PatientAppointments implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  error = '';
  toast = '';
  cancelBusyId: number | null = null;
  rescheduleBusyId: number | null = null;
  count = 0;
  nextPage: string | null = null;
  prevPage: string | null = null;
  statusFilter = '';
  searchQuery = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments(url?: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'Please sign in to view your appointments.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });

    let apiUrl = url || `${environment.apiUrl}/api/medical/patient/appointments/`;

    if (!url && this.statusFilter) {
      apiUrl += `?status=${this.statusFilter}`;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.http.get<PaginatedResponse>(apiUrl, { headers })
      .subscribe({
        next: (data) => {
          this.appointments = data.results;
          this.count = data.count;
          this.nextPage = data.next;
          this.prevPage = data.previous;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load appointments';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onStatusFilterChange() {
    this.loadAppointments();
  }
  
  hasSummary(a: Appointment): boolean {
    return !!a.has_consultation;
  }

  trackByAppointmentId(_: number, a: Appointment) {
    return a.id;
  }

  filteredAppointments(): Appointment[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return this.appointments;
    return this.appointments.filter((a) => {
      const idMatch = String(a.id).includes(q);
      const doc = this.doctorName(a).toLowerCase();
      return idMatch || doc.includes(q);
    });
  }

  totalOnPage(): number {
    return this.filteredAppointments().length;
  }

  upcomingOnPage(): number {
    const now = Date.now();
    return this.filteredAppointments().filter((a) => new Date(a.scheduled_datetime).getTime() >= now && a.status !== 'CANCELLED').length;
  }

  completedOnPage(): number {
    return this.filteredAppointments().filter((a) => a.status === 'COMPLETED').length;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      REQUESTED: 'Requested',
      CONFIRMED: 'Confirmed',
      CHECKED_IN: 'Checked In',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-show',
    };
    return map[status] || status;
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

  canCancel(status: string): boolean {
    return status === 'REQUESTED' || status === 'CONFIRMED';
  }

  doctorName(a: Appointment): string {
    const fn = (a.doctor?.user?.first_name || '').trim();
    const ln = (a.doctor?.user?.last_name || '').trim();
    const u = (a.doctor?.user?.username || '').trim();
    const base = `${fn} ${ln}`.trim() || u || 'Doctor';
    return `Dr. ${base}`;
  }

  doctorInitials(a: Appointment): string {
    const fn = (a.doctor?.user?.first_name || '').trim();
    const ln = (a.doctor?.user?.last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    const name = this.doctorName(a).replace(/^Dr\.\s*/, '');
    return name.slice(0, 2).toUpperCase();
  }

  cancelAppointment(a: Appointment): void {
    if (!this.canCancel(a.status) || this.cancelBusyId !== null) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    this.cancelBusyId = a.id;
    this.toast = '';
    this.cdr.detectChanges();
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });
    const url = `${environment.apiUrl}/api/medical/patient/appointments/${a.id}/cancel/`;
    this.http.patch<CancelResponse>(url, {}, { headers }).subscribe({
      next: (res) => {
        const nextStatus = res?.appointment?.status || 'CANCELLED';
        this.appointments = this.appointments.map((x) => (x.id === a.id ? { ...x, status: nextStatus } : x));
        this.toast = 'Appointment cancelled. The time slot is available again.';
        this.cancelBusyId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast = err?.error?.errors?.status?.[0] || 'Could not cancel this appointment.';
        this.cancelBusyId = null;
        this.cdr.detectChanges();
      },
    });
  }

  rescheduleAppointment(a: Appointment): void {
    const doctorId = a.doctor?.id;
    if (!doctorId) {
      this.toast = 'Could not open rescheduling — missing doctor id.';
      this.cdr.detectChanges();
      return;
    }
    this.router.navigate(['/doctors', doctorId], {
      queryParams: { rescheduleOf: a.id },
    });
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