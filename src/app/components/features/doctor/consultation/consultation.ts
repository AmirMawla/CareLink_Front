import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  DoctorAppointmentDetailPatient,
  DoctorAppointmentDetailResponse,
} from '../../../../models/doctor-dashboard.model';
import { PrescriptionItem, TestRequest } from '../../../../models/consultation';
import { ApiService } from '../../../../services/api.service';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

interface ConsultationApiPayload {
  id?: number;
  diagnosis?: string;
  clinical_notes?: string;
  prescriptions?: Array<{ drug_name?: string; dose?: string; duration_days?: number }>;
  tests?: Array<{ test_name?: string }>;
  /** Present when returned from GET/POST/PATCH medical consultation APIs */
  appointment?: {
    id?: number;
    patient?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      user?: {
        first_name?: string;
        last_name?: string;
        username?: string;
      };
    };
  };
}

@Component({
  selector: 'app-consultation',
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
})
export class Consultation implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly dashboard = inject(DoctorDashboardService);
  private readonly cdr = inject(ChangeDetectorRef);

  appointmentId!: number;
  patientName = '';
  visitScheduledAt: string | null = null;
  diagnosis = '';
  clinicalNotes = '';
  prescriptions: PrescriptionItem[] = [{ drug_name: '', dose: '', duration_days: 1 }];
  tests: TestRequest[] = [{ test_name: '' }];
  loading = false;
  pageLoading = true;
  error = '';
  success = '';
  isEditMode = false;

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.appointmentId) || this.appointmentId <= 0) {
      this.pageLoading = false;
      this.error = 'Invalid appointment.';
      this.cdr.detectChanges();
      return;
    }
    this.loadPage();
  }

  private baseUrl(): string {
    return this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/`);
  }

  private loadPage(): void {
    this.dashboard
      .getDoctorAppointmentDetail(this.appointmentId)
      .pipe(
        switchMap((detail) =>
          this.http.get<ConsultationApiPayload>(this.baseUrl()).pipe(
            catchError((err: HttpErrorResponse) => {
              if (err.status === 404) return of(null);
              return throwError(() => err);
            }),
            map((consultation) => ({ detail, consultation })),
          ),
        ),
      )
      .subscribe({
        next: ({ detail, consultation }) => {
          this.visitScheduledAt = detail?.appointment?.scheduled_datetime ?? null;
          this.patientName = this.resolvePatientName(detail, consultation);
          if (consultation) {
            this.isEditMode = true;
            this.applyPayload(consultation);
          } else {
            this.isEditMode = false;
          }
          this.pageLoading = false;
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.pageLoading = false;
          this.error = this.readSaveErrorMessage(err);
          this.cdr.detectChanges();
        },
      });
  }

  /** Two-letter initials from patient display name (same idea as navbar). */
  patientInitials(): string {
    const name = (this.patientName || '').trim();
    if (!name) return '—';
    const parts = name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return (name.slice(0, 2) || '—').toUpperCase();
  }

  private resolvePatientName(
    detail: DoctorAppointmentDetailResponse | null | undefined,
    consultation: ConsultationApiPayload | null,
  ): string {
    const fromMedical = this.patientNameFromConsultationApi(consultation);
    if (fromMedical) return fromMedical;
    return this.formatPatientName(detail?.appointment?.patient);
  }

  private patientNameFromConsultationApi(c: ConsultationApiPayload | null | undefined): string {
    const patient = c?.appointment?.patient;
    if (!patient || typeof patient !== 'object') return '';
    const o = patient as Record<string, unknown>;
    const direct = `${String(o['first_name'] ?? '').trim()} ${String(o['last_name'] ?? '').trim()}`.trim();
    if (direct) return direct;
    const user = o['user'];
    if (user && typeof user === 'object') {
      const u = user as Record<string, unknown>;
      const uv = `${String(u['first_name'] ?? '').trim()} ${String(u['last_name'] ?? '').trim()}`.trim();
      if (uv) return uv;
      const un = String(u['username'] ?? '').trim();
      if (un) return un;
    }
    return '';
  }

  private formatPatientName(p?: DoctorAppointmentDetailPatient | null): string {
    if (!p) return '';
    const fn = (p.first_name ?? '').trim();
    const ln = (p.last_name ?? '').trim();
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    const u = (p.username ?? '').trim();
    if (u) return u;
    const e = (p.email ?? '').trim();
    if (e) return e;
    return `Patient #${p.id}`;
  }

  private applyPayload(data: ConsultationApiPayload): void {
    this.diagnosis = data.diagnosis ?? '';
    this.clinicalNotes = data.clinical_notes ?? '';
    const rx = data.prescriptions?.filter((p) => p && (p.drug_name || p.dose)) ?? [];
    this.prescriptions =
      rx.length > 0
        ? rx.map((p) => ({
            drug_name: p.drug_name ?? '',
            dose: p.dose ?? '',
            duration_days: Number(p.duration_days) > 0 ? Number(p.duration_days) : 1,
          }))
        : [{ drug_name: '', dose: '', duration_days: 1 }];
    const ts = data.tests?.filter((t) => t?.test_name) ?? [];
    this.tests = ts.length > 0 ? ts.map((t) => ({ test_name: t.test_name ?? '' })) : [{ test_name: '' }];
  }

  addPrescription(): void {
    this.prescriptions.push({ drug_name: '', dose: '', duration_days: 1 });
  }

  removePrescription(index: number): void {
    if (this.prescriptions.length <= 1) return;
    this.prescriptions.splice(index, 1);
  }

  addTest(): void {
    this.tests.push({ test_name: '' });
  }

  removeTest(index: number): void {
    if (this.tests.length <= 1) return;
    this.tests.splice(index, 1);
  }

  saveConsultation(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Token ${token}` });

    const payload = {
      appointment: this.appointmentId,
      diagnosis: this.diagnosis,
      clinical_notes: this.clinicalNotes,
      prescriptions: this.prescriptions.filter((p) => p.drug_name?.trim()),
      tests: this.tests.filter((t) => t.test_name?.trim()),
    };

    this.error = '';
    this.loading = true;
    const url = this.isEditMode
      ? this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/edit/`)
      : this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/save/`);

    const req = this.isEditMode
      ? this.http.patch<unknown>(url, payload, { headers })
      : this.http.post<unknown>(url, payload, { headers });

    req.subscribe({
      next: () => {
        this.loading = false;
        this.success = this.isEditMode ? 'Consultation updated.' : 'Consultation saved successfully!';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/doctor/queue']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = this.readSaveErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private readSaveErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>;
      const e = rec['error'];
      if (typeof e === 'string' && e.trim()) return e.trim();
      const detail = rec['detail'];
      if (typeof detail === 'string' && detail.trim()) return detail.trim();
      const msg = rec['message'];
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    if (err.status === 0) return 'Could not reach the server.';
    return 'Save failed. Please try again.';
  }
}
