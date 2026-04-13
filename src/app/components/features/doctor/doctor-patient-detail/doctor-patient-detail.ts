import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import {
  DoctorPatientDetailAppointment,
  DoctorPatientDetailData,
} from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

@Component({
  selector: 'app-doctor-patient-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink],
  templateUrl: './doctor-patient-detail.html',
  styleUrls: ['./doctor-patient-detail.css', '../doctor-appointment-detail/doctor-appointment-detail.css'],
})
export class DoctorPatientDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();

  readonly patient = signal<DoctorPatientDetailData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => Number(p.get('id'))),
        filter((id) => Number.isFinite(id) && id > 0),
        switchMap((id) => {
          this.loading.set(true);
          this.error.set(null);
          this.patient.set(null);
          return this.service.getDoctorPatientDetail(id).pipe(
            catchError((err) => {
              this.error.set(this.apiErrorMessage(err));
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res?.patient) {
          this.patient.set(res.patient);
          this.error.set(null);
        } else if (!this.error()) {
          this.error.set('The server returned an unexpected response. Please try again.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryLoad(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) return;
    this.loading.set(true);
    this.error.set(null);
    this.service.getDoctorPatientDetail(id).subscribe({
      next: (res) => {
        this.patient.set(res.patient);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(this.apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  patientName(p: DoctorPatientDetailData): string {
    const u = (p.username || '').trim();
    return u || `Patient #${p.id}`;
  }

  patientInitials(p: DoctorPatientDetailData): string {
    return this.patientName(p).slice(0, 2).toUpperCase();
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      REQUESTED: 'badge-requested',
      CONFIRMED: 'badge-confirmed',
      CHECKED_IN: 'badge-checked-in',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled',
      NO_SHOW: 'badge-no-show',
    };
    return `badge ${map[status] || 'badge-info'}`;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      REQUESTED: 'Requested',
      CONFIRMED: 'Confirmed',
      CHECKED_IN: 'Checked In',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-Show',
    };
    return map[status] || status;
  }

  isPast(dateIso: string): boolean {
    const d = new Date(dateIso);
    return d.getTime() < Date.now();
  }

  hasConsultationSummary(ap: DoctorPatientDetailAppointment): boolean {
    const c = ap.consultation;
    if (!c) return false;
    return !!(
      String(c.diagnosis ?? '').trim() ||
      String(c.clinical_notes ?? '').trim() ||
      (c.prescriptions?.length ?? 0) > 0 ||
      (c.tests?.length ?? 0) > 0
    );
  }

  trackByAppt = (_: number, a: DoctorPatientDetailAppointment) => a.id;

  private apiErrorMessage(err: unknown): string {
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status;
    const body = httpErr?.error;

    if (typeof body === 'string' && body.trim()) {
      const t = body.replace(/<[^>]+>/g, '').trim();
      if (t.length) return t.length > 240 ? `${t.slice(0, 240)}…` : t;
    }

    if (body && typeof body === 'object') {
      const e = body as Record<string, unknown>;
      const detail = e['detail'];
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length && typeof detail[0] === 'string') {
        return detail[0];
      }
      const msg = e['message'];
      if (typeof msg === 'string') return msg;
    }

    if (status === 403) {
      return 'You do not have permission to view this patient.';
    }
    if (status === 404) return 'This patient was not found or you have no appointments with them.';
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 0) return 'Could not reach the server. Check that the API is running and try again.';

    return 'Something went wrong. Please try again.';
  }
}
