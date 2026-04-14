import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { DoctorAppointmentDetailData } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

function isCompleteBlockedByConsultation(err: unknown): boolean {
  const httpErr = err as HttpErrorResponse;
  const body = httpErr?.error;
  if (!body || typeof body !== 'object') return false;
  const statusArr = (body as { errors?: { status?: string[] } }).errors?.status;
  const msg = statusArr?.[0];
  return typeof msg === 'string' && msg.toLowerCase().includes('consultation');
}

@Component({
  selector: 'app-doctor-appointment-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink],
  templateUrl: './doctor-appointment-detail.html',
  styleUrl: './doctor-appointment-detail.css',
})
export class DoctorAppointmentDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly appointment = signal<DoctorAppointmentDetailData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionBusy = signal(false);
  readonly formError = signal<string | null>(null);
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly consultationReady = computed(() => {
    const c = this.appointment()?.consultation;
    if (!c) return false;
    return !!(String(c.diagnosis ?? '').trim() && String(c.clinical_notes ?? '').trim());
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => Number(p.get('id'))),
        filter((id) => Number.isFinite(id) && id > 0),
        switchMap((id) => {
          this.loading.set(true);
          this.error.set(null);
          this.formError.set(null);
          this.appointment.set(null);
          return this.service.getDoctorAppointmentDetail(id).pipe(
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
        if (res?.appointment) {
          this.appointment.set(res.appointment);
          this.error.set(null);
        } else if (!this.error()) {
          this.error.set('The server returned an unexpected response. Please try again.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  retryLoad(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) return;
    this.loading.set(true);
    this.error.set(null);
    this.service.getDoctorAppointmentDetail(id).subscribe({
      next: (res) => {
        this.appointment.set(res.appointment);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(this.apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  updateStatus(status: string, successMsg: string): void {
    const id = this.appointment()?.id;
    if (!id) return;
    this.actionBusy.set(true);
    this.formError.set(null);
    this.service.patchDashboardAppointmentStatus(id, status).subscribe({
      next: (res) => {
        this.appointment.set(res.appointment);
        this.actionBusy.set(false);
        this.showToast(successMsg);
      },
      error: (err) => {
        this.actionBusy.set(false);
        if (status === 'COMPLETED' && isCompleteBlockedByConsultation(err)) {
          this.formError.set(null);
          const a = this.appointment();
          if (a) this.goToConsultationToComplete(a);
          return;
        }
        this.formError.set(this.apiErrorMessage(err));
      },
    });
  }




  onMarkCompleteClick(): void {
    this.formError.set(null);
    const a = this.appointment();
    if (!a || !this.canCompleteDetail(a.status)) return;
    if (this.consultationReady()) {
      this.updateStatus('COMPLETED', 'Appointment completed');
      return;
    }
    this.goToConsultationToComplete(a);
  }

  private goToConsultationToComplete(a: DoctorAppointmentDetailData): void {
    void this.router.navigate(['/doctor/consultation', a.id]);
  }

  canConfirmDetail(st: string): boolean {
    return st === 'REQUESTED';
  }

  canDeclineDetail(st: string): boolean {
    return st !== 'COMPLETED' && st !== 'CANCELLED';
  }

  canConsultationDetail(a: DoctorAppointmentDetailData | null): boolean {
    if (!a) return false;
    const has = !!a.consultation;
    const st = a.status;
    if (has) {
      return st === 'CHECKED_IN' || st === 'NO_SHOW' || st === 'COMPLETED';
    }
    return st === 'CHECKED_IN' || st === 'NO_SHOW';
  }

  consultationDetailLabel(a: DoctorAppointmentDetailData): string {
    return a.consultation ? 'Edit consultation' : 'Add consultation';
  }

  consultationDetailTooltip(a: DoctorAppointmentDetailData): string {
    if (this.canConsultationDetail(a)) return '';
    return 'Add when checked in or no-show; edit when a consultation already exists.';
  }

  canCompleteDetail(st: string): boolean {
    return st !== 'REQUESTED' && st !== 'CANCELLED' && st !== 'COMPLETED';
  }

  canNoShowDetail(st: string): boolean {
    return st !== 'REQUESTED' && st !== 'CANCELLED';
  }

  canRevertToCheckedInDetail(st: string): boolean {
    return st !== 'REQUESTED' && st !== 'CANCELLED' && st !== 'CHECKED_IN';
  }

  // No "back to requested" in the new workflow.

  markCompleteTooltip(status: string): string {
    if (status !== 'CHECKED_IN' && status !== 'NO_SHOW') {
      return 'Only when checked in or no-show';
    }
    if (!this.consultationReady()) {
      return 'Opens consultation to add diagnosis and notes, then you can mark complete';
    }
    return '';
  }

  openConsultationRecord(): void {
    const a = this.appointment();
    if (!a || !this.canConsultationDetail(a)) return;
    void this.router.navigate(['/doctor/consultation', a.id]);
  }

  patientName(a: DoctorAppointmentDetailData): string {
    const u = (a.patient?.username || '').trim();
    return u || `Patient #${a.patient?.id ?? ''}`;
  }

  patientInitials(a: DoctorAppointmentDetailData): string {
    const u = this.patientName(a);
    return u.slice(0, 2).toUpperCase();
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

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3200);
  }

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
      const statusArr = e['errors'] as { status?: string[] } | undefined;
      if (statusArr?.status?.length) return statusArr.status[0];
    }

    if (status === 403) {
      return 'You do not have permission to view this appointment.';
    }
    if (status === 404) return 'This appointment was not found or is not assigned to you.';
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 0) return 'Could not reach the server. Check that the API is running and try again.';

    return 'Something went wrong. Please try again.';
  }
}
