import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';

interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
}

interface ApiDoctor {
  id: number;
  user: ApiUser;
  specialty: string;
  session_duration?: number;
}

interface ApiAppointment {
  id: number;
  doctor: ApiDoctor;
  scheduled_datetime: string;
  status: string;
  check_in_time: string | null;
  is_telemedicine: boolean;
  meeting_link: string | null;
}

interface ApiPrescriptionItem {
  id: number;
  drug_name: string;
  dose: string;
  duration_days: number;
}

interface ApiTestRequest {
  id: number;
  test_name: string;
}

interface ConsultationSummaryResponse {
  id: number;
  appointment: ApiAppointment;
  diagnosis: string;
  clinical_notes: string;
  prescriptions: ApiPrescriptionItem[];
  tests: ApiTestRequest[];
  created_at: string;
}

@Component({
  selector: 'app-appointment-summary',
  imports: [CommonModule, RouterModule],
  templateUrl: './appointment-summary.html',
  styleUrl: './appointment-summary.css',
})
export class AppointmentSummaryComponent implements OnInit {
  appointmentId = 0;
  data: ConsultationSummaryResponse | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id') || 0);
    this.load();
  }

  private load(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.loading = false;
      this.error = 'Please sign in to view your appointment summary.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.appointmentId) {
      this.loading = false;
      this.error = 'Invalid appointment id.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const headers = new HttpHeaders({ Authorization: `Token ${token}` });
    const url = `${environment.apiUrl}/api/medical/patient/history/${this.appointmentId}/`;
    this.http.get<ConsultationSummaryResponse>(url, { headers }).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.data = null;
        this.loading = false;
        this.error = err?.error?.error || 'Failed to load appointment summary.';
        this.cdr.detectChanges();
      },
    });
  }

  doctorName(): string {
    const u = this.data?.appointment?.doctor?.user;
    const fn = (u?.first_name || '').trim();
    const ln = (u?.last_name || '').trim();
    const un = (u?.username || '').trim();
    const base = `${fn} ${ln}`.trim() || un || 'Doctor';
    return `Dr. ${base}`;
  }

  doctorInitials(): string {
    const u = this.data?.appointment?.doctor?.user;
    const fn = (u?.first_name || '').trim();
    const ln = (u?.last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    return this.doctorName().replace(/^Dr\.\s*/, '').slice(0, 2).toUpperCase();
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

  statusColor(status: string): string {
    const colors: { [key: string]: string } = {
      REQUESTED: '#F59E0B',
      CONFIRMED: '#3B82F6',
      CHECKED_IN: '#8B5CF6',
      COMPLETED: '#059669',
      CANCELLED: '#EF4444',
      NO_SHOW: '#6B7280',
    };
    return colors[status] || '#6B7280';
  }
}

